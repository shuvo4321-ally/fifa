import { GROUPS_2026, FIXTURES_2026 } from "../../data/schedule2026";
import { buildMatchContext } from "../../lib/footballData";

export const dynamic = "force-dynamic";

const MODEL = "gemini-3.5-flash";

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

export async function POST(request) {
  const keysEnv = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
  if (!keysEnv) {
    return Response.json(
      { error: "GEMINI_API_KEYS not set. Add it to .env.local and restart the dev server." },
      { status: 503 }
    );
  }
  const apiKeys = keysEnv.split(",").map(k => k.trim()).filter(Boolean);

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { type, match, message } = body || {};

  let userPrompt = "";
  let liveDataStr = "";

  if (type === "predict" && match) {
    // RAG: Fetch real squad and form data from football-data.org
    const teams = match.split("vs").map((t) => t.trim());
    if (teams.length === 2) {
      liveDataStr = await buildMatchContext(teams[0], teams[1]);
    }

    userPrompt = `Predict this FIFA World Cup 2026 match: ${match}

Here is the LIVE RAG Data for both teams (Current Squad, Coach, Ages, and Recent Matches Form):
${liveDataStr}

Give me:
## Prediction
Win/Draw/Loss percentages and predicted score. Base this heavily on the recent form and current squad provided in the Live RAG Data above.

## Key Factors
What decides this match (tactics, players, conditions)

## Head-to-Head History
Past World Cup meetings between these teams

## Verdict
Your final bold take as a pundit`;
  } else if (type === "chat" && message) {
    userPrompt = message;
  } else {
    return Response.json({ error: "Provide { type: 'predict', match } or { type: 'chat', message }." }, { status: 400 });
  }

  const systemInstruction = `You are an elite FIFA World Cup analyst.
You have encyclopedic knowledge of World Cup history and are specifically briefed on the FIFA World Cup 2026:
${buildHistoricalContext()}

RULES FOR PREDICTIONS:
- You will receive LIVE RAG DATA with the exact current squads and recent form. You MUST base your analysis on the specific players listed in the Live Data. Mention their ages, positions, and the team's recent form.
- Win/Draw/Loss probabilities MUST add up to 100%.
- Always give a predicted score (e.g. "2-1").
- Format with markdown: use **bold**, headers (##), and bullet points.`;

  let lastErrorMsg = "AI service error.";
  let lastStatus = 502;

  // Round-robin: try each key until one succeeds
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
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        lastErrorMsg = errBody?.error?.message || "AI service error.";
        lastStatus = res.status;
        console.warn(`Key ${i + 1}/${apiKeys.length} failed (${res.status}): ${lastErrorMsg}`);
        
        // If it's a quota error (429) or another retryable error, try the next key
        if (res.status === 429 || res.status >= 500) {
          continue; 
        } else {
          // Bad request (400) or other fatal error - don't retry
          break;
        }
      }

      const data = await res.json();
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't generate a response.";

      return Response.json({ text });
    } catch (err) {
      console.warn(`Key ${i + 1}/${apiKeys.length} network error:`, err);
      lastErrorMsg = "Couldn't reach the AI service.";
      lastStatus = 500;
    }
  }

  // If all keys failed, return the last error
  console.error("All Gemini API keys failed.");
  return Response.json(
    { error: `Gemini API Error (All keys exhausted). Last error (${lastStatus}): ${lastErrorMsg}` },
    { status: lastStatus }
  );
}
