import { GROUPS_2026, FIXTURES_2026 } from "../../data/schedule2026";
import { buildMatchAnalysis } from "../../lib/footballData";
import { supabase } from "../../lib/supabase";
import { fetchWebSearch } from "../../lib/webSearch";
import {
  computeBaseline,
  blendWeight,
  blendProbs,
  marginOf,
  confidenceFrom,
  favoriteFrom,
  scoreMatchesFavorite,
} from "../../lib/predictModel";

export const dynamic = "force-dynamic";

const MODEL = "gemini-3.5-flash";

// Structured shape Gemini must return for a prediction (JSON mode). Rendering a
// real card from this is what makes the output readable instead of a text blob.
const predictionSchema = {
  type: "object",
  properties: {
    teamA: { type: "string" },
    teamB: { type: "string" },
    winProbA: { type: "integer" },
    drawProb: { type: "integer" },
    winProbB: { type: "integer" },
    predictedScore: { type: "string" },
    favorite: { type: "string" },
    confidence: { type: "string", enum: ["High", "Medium", "Low"] },
    keyFactors: { type: "array", items: { type: "string" } },
    headToHead: { type: "string" },
    verdict: { type: "string" },
  },
  required: [
    "teamA", "teamB", "winProbA", "drawProb", "winProbB", "predictedScore",
    "favorite", "confidence", "keyFactors", "headToHead", "verdict",
  ],
};

function buildHistoricalContext() {
  const groups = GROUPS_2026.map(
    (g) => `${g.name}: ${g.teams.map((t) => t.name).join(", ")}`
  ).join("\n");

  const fixtures = FIXTURES_2026.filter((f) => f.stage === "Group Stage")
    .map((f) => `${f.date} ${f.time} — ${f.match} (${f.group})`)
    .join("\n");

  return `
## FIFA World Cup 2026 — Groups (48 teams, 12 groups)
${groups}

## Group Stage Fixtures (times in Bangladesh BDT)
${fixtures}

## All-Time World Cup Winners
1930 Uruguay (hosts) | 1934 Italy (hosts) | 1938 Italy | 1950 Uruguay
1954 West Germany | 1958 Brazil | 1962 Brazil | 1966 England (hosts)
1970 Brazil | 1974 West Germany (hosts) | 1978 Argentina (hosts)
1982 Italy | 1986 Argentina | 1990 West Germany | 1994 Brazil
1998 France (hosts) | 2002 Brazil | 2006 Italy | 2010 Spain
2014 Germany | 2018 France | 2022 Argentina
`;
}

function normName(s) {
  return (s || "").toLowerCase().replace(/[^a-z]/g, "");
}

/** Tolerant JSON parse: strips code fences and extracts the first {...} block. */
function safeParseJson(text) {
  if (!text) return null;
  let s = String(text).trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  }
  try {
    return JSON.parse(s);
  } catch {}
  const m = s.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      return JSON.parse(m[0]);
    } catch {}
  }
  return null;
}

/** One-line, human-readable summary of what fed the model (UI trust signal). */
function buildBasis(signalA, signalB) {
  const bits = [];
  if (signalA?.squadRating && signalB?.squadRating) {
    bits.push(`squad ratings ${Math.round(signalA.squadRating)} vs ${Math.round(signalB.squadRating)}`);
  }
  const fa = signalA?.form;
  const fb = signalB?.form;
  if (fa && fb) {
    bits.push(`recent form ${fa.w}W-${fa.d}D-${fa.l}L vs ${fb.w}W-${fb.d}D-${fb.l}L`);
  }
  if (!bits.length) return "Based on historical knowledge (no live data for this matchup).";
  return `Based on ${bits.join(" and ")}.`;
}

/**
 * Ground the LLM prediction in the deterministic baseline (mutates `parsed`).
 * Blends probabilities, recomputes favourite + confidence from the grounded
 * numbers, keeps the scoreline only if consistent, and attaches trust signals.
 */
function groundPrediction(parsed, baseline, signalA, signalB, teams) {
  if (!baseline) {
    // No baseline (e.g. couldn't parse two teams) — just normalise to 100.
    const a = Number(parsed.winProbA) || 0;
    const d = Number(parsed.drawProb) || 0;
    const b = Number(parsed.winProbB) || 0;
    const sum = a + d + b;
    if (sum > 0 && sum !== 100) {
      parsed.winProbA = Math.round((a / sum) * 100);
      parsed.drawProb = Math.round((d / sum) * 100);
      parsed.winProbB = 100 - parsed.winProbA - parsed.drawProb;
    }
    return;
  }

  // Align orientation so winProbA always refers to teams[0], even if the model swapped sides.
  if (normName(parsed.teamA) === normName(teams[1]) && normName(parsed.teamB) === normName(teams[0])) {
    [parsed.winProbA, parsed.winProbB] = [parsed.winProbB, parsed.winProbA];
    const m = /^(\d+)\s*-\s*(\d+)$/.exec((parsed.predictedScore || "").trim());
    if (m) parsed.predictedScore = `${m[2]}-${m[1]}`;
  }
  parsed.teamA = teams[0];
  parsed.teamB = teams[1];

  // Blend baseline with the LLM — weight the math more when data is richer.
  const w = blendWeight(baseline.coverage);
  const blended = blendProbs(baseline, parsed, w);
  parsed.winProbA = blended.winProbA;
  parsed.drawProb = blended.drawProb;
  parsed.winProbB = blended.winProbB;

  // Derive favourite + confidence from the grounded numbers (not the LLM's self-report).
  parsed.favorite = favoriteFrom(blended, parsed.teamA, parsed.teamB);
  parsed.confidence = confidenceFrom(baseline.coverage, marginOf(blended));

  // Keep the LLM's scoreline if it's reasonable (matches the favourite direction).
  // Only fall back to the baseline score when the LLM's score contradicts the data.
  const llmScoreOk = scoreMatchesFavorite(parsed.predictedScore, parsed.favorite, parsed.teamA, parsed.teamB);
  if (!llmScoreOk) {
    // LLM got the winner wrong — use the calculated score instead.
    parsed.predictedScore = baseline.score;
  } else if (baseline.lambdaA != null) {
    // LLM has the right winner — but sanity-check total goals are within a
    // reasonable range of the expected total (±3 goals).
    const sm = /^(\d+)\s*-\s*(\d+)$/.exec((parsed.predictedScore || "").trim());
    if (sm) {
      const llmTotal = Number(sm[1]) + Number(sm[2]);
      const expectedTotal = baseline.lambdaA + baseline.lambdaB;
      if (Math.abs(llmTotal - expectedTotal) > 3) {
        parsed.predictedScore = baseline.score;
      }
    }
  }

  // Trust signals for the UI.
  parsed.ratingA = baseline.ratingA;
  parsed.ratingB = baseline.ratingB;
  parsed.dataCoverage = baseline.coverage;
  parsed.formA = signalA?.form ? { ...signalA.form, outcomes: signalA.outcomes || [] } : null;
  parsed.formB = signalB?.form ? { ...signalB.form, outcomes: signalB.outcomes || [] } : null;
  parsed.basis = buildBasis(signalA, signalB);
}

export async function POST(request) {
  const keysEnv = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
  if (!keysEnv) {
    return Response.json(
      { error: "GEMINI_API_KEYS not set. Add it to .env.local and restart the dev server." },
      { status: 503 }
    );
  }
  const apiKeys = keysEnv.split(",").map((k) => k.trim()).filter(Boolean);

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { type, match, message } = body || {};

  let userPrompt = "";
  let liveDataStr = "";
  let baseline = null;
  let signalA = null;
  let signalB = null;
  let teams = [];

  if (type === "predict" && match) {
    // Supabase cache — return a fresh (<60 min) structured prediction instantly.
    if (supabase) {
      const { data: cachedPred, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("match_string", match)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && cachedPred && cachedPred.length > 0) {
        const lastPred = cachedPred[0];
        const ageInMs = Date.now() - new Date(lastPred.created_at).getTime();
        if (ageInMs < 3600000) {
          try {
            const parsed = JSON.parse(lastPred.prediction_text);
            if (parsed && parsed.teamA) {
              console.log(`[Cache Hit] ${match}`);
              return Response.json({ prediction: parsed });
            }
          } catch {
            // Old markdown cache — fall through and regenerate as structured.
          }
        }
      }
    }

    // RAG: real squads + form from API-Football + parallel web news search
    teams = match.split("vs").map((t) => t.trim());
    let webNewsStr = "";

    if (teams.length === 2) {
      // Degrade gracefully: if the RAG data fetch fails, still produce a
      // prediction from Gemini (with whatever baseline we have) instead of
      // crashing the route into a 500/HTML error page.
      try {
        const [analysis, h2hNews, teamANews, teamBNews] = await Promise.all([
          buildMatchAnalysis(teams[0], teams[1]),
          fetchWebSearch(`${teams[0]} vs ${teams[1]} head to head football match records history`),
          fetchWebSearch(`${teams[0]} national football team latest news injuries suspensions squad`),
          fetchWebSearch(`${teams[1]} national football team latest news injuries suspensions squad`),
        ]);
        liveDataStr = analysis.context;
        signalA = analysis.signalA;
        signalB = analysis.signalB;

        const newsParts = [];
        if (h2hNews) newsParts.push(`### Head-to-Head Records & History:\n${h2hNews}`);
        if (teamANews) newsParts.push(`### ${teams[0]} Latest News & Injury Updates:\n${teamANews}`);
        if (teamBNews) newsParts.push(`### ${teams[1]} Latest News & Injury Updates:\n${teamBNews}`);
        webNewsStr = newsParts.join("\n\n");

        baseline = computeBaseline(signalA, signalB);
      } catch (e) {
        console.warn("RAG data fetch failed, predicting without it:", e?.message ?? e);
      }
    }

    const newsContext = webNewsStr
      ? `\n🚨 LATEST BREAKING NEWS & RECENT FORM (HIGHEST PRIORITY):\n${webNewsStr}\n`
      : "";

    const baselineBlock = baseline
      ? `\n📊 STATISTICAL BASELINE (computed from squad ratings + recent form — ANCHOR your probabilities to this):
- ${teams[0]} win ${baseline.winA}% | Draw ${baseline.draw}% | ${teams[1]} win ${baseline.winB}%
- Model expected scoreline: ${baseline.score}
- Composite strength: ${teams[0]} ${baseline.ratingA}, ${teams[1]} ${baseline.ratingB}
Stay within ~10-15% of these numbers unless the breaking news clearly justifies more, and do not flip the favourite without strong justification.\n`
      : "";

    userPrompt = `Predict this FIFA World Cup 2026 match: ${match}
${newsContext}${baselineBlock}
LIVE RAG Data (current squads, coaches, ages, recent form, player ratings, World Football Elo Ratings):
${liveDataStr}

Fill every field of the structured prediction:
- teamA / teamB: the two teams, using the EXACT names from "${match}".
- winProbA / drawProb / winProbB: integer percentages (teamA win, draw, teamB win) that MUST sum to exactly 100. Anchor them to the recent form, squad ratings, and World Football Elo Ratings above.
- predictedScore: most likely scoreline as "X-Y" (teamA goals - teamB goals).
- favorite: the favored team's EXACT name, or "Draw" if a draw is most likely.
- confidence: "High", "Medium", or "Low" — how decisive the data is.
- keyFactors: 3-4 short, SPECIFIC factors that decide the match (name players, form runs, a tactical edge, conditions). No markdown. Do not mention EA Sports.
- headToHead: one short sentence on all their past meetings across all competitions in the last 13 years (not just World Cup). No markdown.
- verdict: one punchy, confident sentence — your final pundit take. No markdown. Do not mention EA Sports or EA FC.`;
  } else if (type === "chat" && message) {
    userPrompt = message;
  } else {
    return Response.json(
      { error: "Provide { type: 'predict', match } or { type: 'chat', message }." },
      { status: 400 }
    );
  }

  const systemInstruction = `You are an elite, data-driven FIFA World Cup analyst.
You have encyclopedic knowledge of World Cup history and are specifically briefed on the FIFA World Cup 2026:
${buildHistoricalContext()}

CRITICAL RULES FOR PREDICTIONS:
1. STRICT DATA ADHERENCE: Anchor your prediction mathematically to the "Form" (Wins/Draws/Losses) and "Recent Results" in the LIVE RAG DATA. If one team has significantly more recent wins, favor them heavily.
2. SQUAD, PLAYER METRICS & ELO RATINGS: Use the provided World Football Elo Ratings, squad ratings, and player overalls to weigh positional matchups, star impact, and squad strength. Elo ratings are highly predictive of match outcomes. A much higher squad rating or Elo rating should strongly influence the call. NEVER mention 'EA Sports' or 'EA FC' in your output.
3. BREAKING NEWS CONTEXT: Treat "LATEST BREAKING NEWS" as a modifier, not the foundation. A single injury/weather event nudges probabilities but never overturns a massive form advantage.
4. PROBABILITIES: winProbA + drawProb + winProbB MUST equal 100, and predictedScore must be consistent with them.`;

  const generationConfig =
    type === "predict"
      ? {
          temperature: 0.6,
          maxOutputTokens: 4096,
          // gemini-2.5-flash is a "thinking" model: reasoning tokens count against the
          // output budget and were truncating the JSON (→ parse fail → raw-text fallback).
          // The deterministic baseline does the heavy reasoning, so disable thinking for
          // clean, complete, fast JSON.
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          responseSchema: predictionSchema,
        }
      : { temperature: 0.7, maxOutputTokens: 2048 };

  let lastErrorMsg = "AI service error.";
  let lastStatus = 502;
  let overloadHits = 0; // 503s = model-wide overload, not per-key — bail out fast.

  // Round-robin: try each key until one succeeds.
  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig,
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          ],
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        lastErrorMsg = errBody?.error?.message || "AI service error.";
        lastStatus = res.status;
        console.warn(`Key ${i + 1}/${apiKeys.length} failed (${res.status}): ${lastErrorMsg}`);
        // 503 = the model is overloaded for everyone; cycling more keys just wastes
        // ~3s each, so give up after a few attempts instead of hanging ~1 min.
        if (res.status === 503) {
          if (++overloadHits >= 3) break;
          continue;
        }
        if (res.status === 429 || res.status >= 500) continue;
        break;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        const finishReason = data.candidates?.[0]?.finishReason || "UNKNOWN";
        return Response.json(
          { error: `The AI returned no content (reason: ${finishReason}). Try again.` },
          { status: 502 }
        );
      }

      if (type === "predict") {
        const parsed = safeParseJson(text);
        if (parsed && parsed.teamA) {
          // Ground the LLM's narrative in the deterministic baseline.
          groundPrediction(parsed, baseline, signalA, signalB, teams);

          if (supabase && match) {
            await supabase
              .from("predictions")
              .insert([{ match_string: match, prediction_text: JSON.stringify(parsed) }]);
            console.log(`[Cache Miss] Generated + saved structured prediction for ${match}`);
          }
          return Response.json({ prediction: parsed });
        }
        // Incomplete/invalid JSON (e.g. truncated) — ask for a retry instead of
        // dumping raw JSON into the UI.
        console.warn(`Prediction JSON parse failed for ${match}. Head: ${String(text).slice(0, 120)}`);
        return Response.json(
          { error: "The AI response came back incomplete. Please tap Try again." },
          { status: 502 }
        );
      }

      return Response.json({ text });
    } catch (err) {
      console.warn(`Key ${i + 1}/${apiKeys.length} network error:`, err);
      lastErrorMsg = "Couldn't reach the AI service.";
      lastStatus = 500;
    }
  }

  console.error("All Gemini API keys failed.");
  const friendlyError =
    lastStatus === 503
      ? "The AI is overloaded right now (Gemini is at high demand). Please try again in a moment."
      : `AI service error (${lastStatus}): ${lastErrorMsg}`;
  return Response.json({ error: friendlyError }, { status: lastStatus });
}
