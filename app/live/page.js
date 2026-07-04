"use client";

import { useState, useEffect, useCallback } from "react";
import { FIXTURES_2026, GROUPS_2026 } from "../data/schedule2026";
import { getLiveScoreSync, useGroupStandings } from "../lib/liveScores";
import { thirdAssignmentsByWinner, buildBracket } from "../lib/knockoutBracket";

// Build a name → flag lookup once from the group data.
const FLAGS = {};
for (const g of GROUPS_2026) for (const t of g.teams) FLAGS[t.name.trim()] = t.flag;
const getFlag = (name) => FLAGS[(name || "").trim()] || null;
const splitMatch = (m) => (m || "").split(" vs ").map((s) => s.trim());

// Fixture date/time strings are in Bangladesh time (UTC+6) — see the predict
// route. Resolve one to an absolute kickoff instant so "is it over?" is correct
// regardless of where the viewer is.
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const BDT_OFFSET_MS = 6 * 60 * 60 * 1000;

function fixtureKickoffMs(f) {
  const dm = /([A-Za-z]{3})[a-z]*\s+(\d{1,2}),\s*(\d{4})/.exec(f?.date || "");
  const tm = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(f?.time || "");
  if (!dm || !tm) return NaN;
  const month = MONTHS[dm[1]];
  if (month == null) return NaN;
  let hour = Number(tm[1]) % 12;
  if (/PM/i.test(tm[3])) hour += 12;
  // Treat the wall-clock value as BDT, then shift to the true UTC instant.
  return Date.UTC(Number(dm[3]), month, Number(dm[2]), hour, Number(tm[2])) - BDT_OFFSET_MS;
}

// Prediction is for matches still to come, so a fixture leaves the list the
// moment its kickoff time passes. Unparseable dates count as upcoming so a data
// hiccup never silently hides a fixture (the live-status check still drops it).
function hasFixtureStarted(f, now) {
  const k = fixtureKickoffMs(f);
  return !Number.isNaN(k) && now >= k;
}

export default function PredictionHub() {
  const [activeMatch, setActiveMatch] = useState(null);
  const [activeMeta, setActiveMeta] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [predictionText, setPredictionText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // `now` stays 0 until mounted so the server render and first client paint
  // agree (no hydration mismatch); then it ticks each minute so matches drop
  // off the moment they finish, without a manual refresh.
  const [now, setNow] = useState(0);
  useEffect(() => {
    setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  // Standings drive knockout resolution (and subscribe to the shared snapshot,
  // so the list re-renders the instant a result lands).
  const standings = useGroupStandings(GROUPS_2026, FIXTURES_2026);
  const thirds = thirdAssignmentsByWinner(standings, GROUPS_2026);
  // Full bracket with winner advancement (R32 → R16 → QF → SF → Final), used to
  // resolve R16+ fixtures live as each round's results land — same source the
  // calendar and home hero use, so none of them can disagree.
  const bracket = buildBracket(standings, GROUPS_2026, FIXTURES_2026);

  // Resolve knockout placeholders to the live teams: "B1" = Group B winner,
  // "D2" = runner-up, "E1 vs 3rd …" = winner vs the bracket-assigned third.
  const resolveSlot = (spec) => {
    const m = (spec || "").match(/^([A-L])([12])$/);
    if (!m) return spec;
    const rows = standings["Group " + m[1]];
    if (rows && rows.some((r) => r.gp > 0)) return rows[Number(m[2]) - 1]?.name || spec;
    return spec;
  };
  // Resolve a fixture's two teams, including R16+ ("Winner 73 vs Winner 75")
  // and the third-place match, via the bracket's live advancement — not just
  // the R32-level group-slot placeholders.
  const resolveMatch = (fixture) => {
    const matchStr = typeof fixture === "string" ? fixture : fixture.match;
    const [r1, r2] = splitMatch(matchStr);
    let t1 = resolveSlot(r1), t2 = resolveSlot(r2);
    const ref = typeof fixture === "object" ? fixture.ref : null;
    if (ref) {
      const m = bracket.rounds?.[ref.round]?.[ref.i];
      if (m?.s1 && !m.s1.tbd) t1 = m.s1.name;
      if (m?.s2 && !m.s2.tbd) t2 = m.s2.name;
    } else {
      const w1 = r1.match(/^([A-L])1$/), w2 = r2.match(/^([A-L])1$/);
      if (w1 && /^3rd/i.test(r2) && thirds[w1[1]]) t2 = thirds[w1[1]];
      else if (w2 && /^3rd/i.test(r1) && thirds[w2[1]]) t1 = thirds[w2[1]];
    }
    return [t1, t2];
  };

  // Every fixture — group AND knockout — whose teams are known and that hasn't
  // kicked off / finished. Knockout placeholders that aren't decidable yet
  // (no resolved flag, e.g. "Winner R32-1") are skipped until their teams set.
  const upcomingFixtures = FIXTURES_2026
    .filter((f) => f.match.includes(" vs ") && !hasFixtureStarted(f, now))
    .map((f) => {
      const [t1, t2] = resolveMatch(f);
      return { ...f, t1, t2, resolvedMatch: `${t1} vs ${t2}` };
    })
    .filter((f) => {
      if (!getFlag(f.t1) || !getFlag(f.t2)) return false; // both must be real teams
      const live = getLiveScoreSync(f.t1, f.t2);
      // gone the moment it's live or finished — prediction is for upcoming only
      if (live && (live.status === "IN_PLAY" || live.status === "PAUSED" || live.status === "FINISHED")) return false;
      return true;
    })
    .sort((a, b) => {
      const ka = fixtureKickoffMs(a);
      const kb = fixtureKickoffMs(b);
      if (Number.isNaN(ka)) return 1;
      if (Number.isNaN(kb)) return -1;
      return ka - kb; // Ascending: earliest date first
    });

  const closeModal = useCallback(() => {
    setActiveMatch(null);
    setActiveMeta(null);
    setPrediction(null);
    setPredictionText("");
    setError("");
    setLoading(false);
  }, []);

  const handlePredict = useCallback(async (fixture, knockoutArg = false) => {
    const matchStr = typeof fixture === "string" ? fixture : (fixture.resolvedMatch || fixture.match);
    // Knockout → a draw is decided in ET/penalties, so upset potential is higher.
    const knockout = typeof fixture === "object" ? (fixture.stage && fixture.stage !== "Group Stage") : knockoutArg;
    setActiveMatch(matchStr);
    if (fixture && fixture.date) setActiveMeta({ date: fixture.date, group: fixture.group, knockout });
    setPrediction(null);
    setPredictionText("");
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "predict", match: matchStr, knockout }),
      });
      // Parse defensively: on a serverless timeout/crash the platform returns an
      // HTML error page, not JSON. Reading text first lets us show a clear,
      // actionable message instead of a raw "Unexpected token '<'".
      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          res.status === 504 || res.status === 502 || /<!doctype|<html/i.test(raw)
            ? "The prediction took too long and timed out. Please tap Try again."
            : "The prediction service had a hiccup. Please tap Try again."
        );
      }
      if (!res.ok) throw new Error(data.error || "Failed to fetch prediction");
      if (data.prediction) setPrediction(data.prediction);
      else if (data.text) setPredictionText(data.text);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lock body scroll while the modal is open. It closes only via the ✕ button.
  useEffect(() => {
    if (!activeMatch) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeMatch]);

  return (
    <div className="live-page predict-page">
      <div className="live-head">
        <div>
          <h1 className="live-title">World Cup 2026 Analytics</h1>
          <p className="predict-sub">Tap any fixture for a data-driven prediction.</p>
        </div>
      </div>

      <div className="match-grid">
        {upcomingFixtures.map((f, i) => {
          const t1 = f.t1, t2 = f.t2;
          return (
            <button key={i} className="match-card" onClick={() => handlePredict(f)}>
              <div className="match-card-meta">
                <span>{f.date}</span>
                <span className="match-card-group">{f.group}</span>
              </div>
              <div className="match-card-teams">
                <span className="match-card-side">
                  <FlagImg src={getFlag(t1)} className="match-card-flag" />
                  <span className="match-card-name">{t1}</span>
                </span>
                <span className="match-card-vs">VS</span>
                <span className="match-card-side match-card-side--right">
                  <span className="match-card-name">{t2}</span>
                  <FlagImg src={getFlag(t2)} className="match-card-flag" />
                </span>
              </div>
              <span className="match-card-cta">
                Predict result
                <span className="match-card-cta-arrow" aria-hidden="true">→</span>
              </span>
            </button>
          );
        })}
      </div>
      {now > 0 && upcomingFixtures.length === 0 && (
        <p className="predict-sub" style={{ textAlign: "center", padding: "3rem 1rem" }}>
          No upcoming matches — every fixture has kicked off. Check back for the next round.
        </p>
      )}

      {activeMatch && (
        <PredictionModal
          match={activeMatch}
          meta={activeMeta}
          loading={loading}
          error={error}
          prediction={prediction}
          predictionText={predictionText}
          onClose={closeModal}
          onRetry={() => handlePredict(activeMatch, activeMeta?.knockout)}
        />
      )}
    </div>
  );
}

function FlagImg({ src, className }) {
  if (!src) return null;
  return <img src={src} alt="" className={className} loading="lazy" decoding="async" />;
}

function PredictionModal({ match, meta, loading, error, prediction, predictionText, onClose, onRetry }) {
  const [t1, t2] = splitMatch(match);
  return (
    <div className="pred-modal-backdrop">
      <div className="pred-modal" role="dialog" aria-modal="true">
        <button className="pred-modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="pred-modal-head">
          <span className="live-kicker">
            AI Prediction{meta ? ` · ${meta.group}` : ""}
          </span>
          <div className="pred-modal-match">
            <span className="pred-modal-side">
              <FlagImg src={getFlag(t1)} className="pred-modal-flag" />
              <span>{t1}</span>
            </span>
            <span className="pred-modal-vs">vs</span>
            <span className="pred-modal-side pred-modal-side--right">
              <span>{t2}</span>
              <FlagImg src={getFlag(t2)} className="pred-modal-flag" />
            </span>
          </div>
        </div>

        <div className="pred-modal-body">
          {loading ? (
            <div className="predict-loading">
              <span className="predict-spinner" />
              <p>Crunching squads, form &amp; the matchup…</p>
            </div>
          ) : error ? (
            <div className="predict-error-block">
              <p className="predict-error">{error}</p>
              <button className="predict-btn" onClick={onRetry}>Try again</button>
            </div>
          ) : prediction ? (
            <PredictionCard p={prediction} />
          ) : predictionText ? (
            <div className="predict-fallback">{predictionText}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PredictionCard({ p }) {
  const a = Number(p.winProbA) || 0;
  const d = Number(p.drawProb) || 0;
  const b = Number(p.winProbB) || 0;
  const isDraw = (p.favorite || "").toLowerCase() === "draw";
  const favA = !isDraw && p.favorite === p.teamA;
  const favB = !isDraw && p.favorite === p.teamB;
  const conf = (p.confidence || "Medium").toLowerCase();

  return (
    <div className="pred">
      {/* Predicted scoreline */}
      <div className="pred-score">
        <span className={`pred-score-team${favA ? " is-fav" : ""}`}>
          <FlagImg src={getFlag(p.teamA)} className="pred-score-flag" />
        </span>
        <span className="pred-scoreline">{p.predictedScore}{p.toPenalties ? <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>&nbsp;→ pens</span> : ""}</span>
        <span className={`pred-score-team pred-score-team--right${favB ? " is-fav" : ""}`}>
          <FlagImg src={getFlag(p.teamB)} className="pred-score-flag" />
        </span>
      </div>

      {/* Headline */}
      <div className="pred-headline">
        <span className="pred-fav-label">
          {isDraw ? "Too close to call" : `${p.favorite} favoured`}
        </span>
        <span className={`pred-conf pred-conf--${conf}`}>{p.confidence} confidence</span>
      </div>

      {p.knockout && p.advanceA != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "4px 0", fontSize: 13 }}>
          <span style={{ color: "#9ea2a4" }}>⚑ To advance</span>
          <b style={{ color: "#fff" }}>{p.teamA} {p.advanceA}%</b>
          <span style={{ color: "#9ea2a4" }}>·</span>
          <b style={{ color: "#fff" }}>{p.teamB} {p.advanceB}%</b>
          <span style={{ color: "#9ea2a4", fontSize: 12 }}>(incl. penalties)</span>
        </div>
      )}

      {p.upsetChance != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "4px 0", fontSize: 13 }}>
          <span style={{ color: "#9ea2a4" }}>🎲 Upset potential</span>
          <b style={{ color: "#fde047" }}>{p.upsetChance}%</b>
          <span style={{ color: "#9ea2a4" }}>· volatility</span>
          <span style={{ fontWeight: 700, color: p.unpredictability === "High" ? "#ff6b6b" : p.unpredictability === "Medium" ? "#fbbf24" : "#3ddc84" }}>
            {p.unpredictability} ({p.volatility}/100)
          </span>
        </div>
      )}

      {p.basis && <p className="pred-basis">{p.basis}</p>}

      {/* Probability bar */}
      <div className="pred-probs">
        <div className="pred-bar">
          <div className="pred-seg pred-seg--a" style={{ width: `${a}%` }} title={`${p.teamA} ${a}%`} />
          <div className="pred-seg pred-seg--d" style={{ width: `${d}%` }} title={`Draw ${d}%`} />
          <div className="pred-seg pred-seg--b" style={{ width: `${b}%` }} title={`${p.teamB} ${b}%`} />
        </div>
        <div className="pred-prob-labels">
          <span><b>{a}%</b> {p.teamA}</span>
          <span><b>{d}%</b> Draw</span>
          <span><b>{b}%</b> {p.teamB}</span>
        </div>
      </div>

      {/* Recent form */}
      {(p.formA || p.formB) && (
        <div className="pred-block">
          <h4 className="pred-block-title">Recent form</h4>
          <div className="pred-form">
            <FormRow team={p.teamA} form={p.formA} />
            <FormRow team={p.teamB} form={p.formB} />
          </div>
        </div>
      )}

      {/* Key factors */}
      {Array.isArray(p.keyFactors) && p.keyFactors.length > 0 && (
        <div className="pred-block">
          <h4 className="pred-block-title">Key factors</h4>
          <ul className="pred-factors">
            {p.keyFactors.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Head-to-head */}
      {p.headToHead && (
        <p className="pred-h2h">
          <span className="pred-h2h-label">Head-to-head</span> {p.headToHead}
        </p>
      )}

      {/* Verdict */}
      {p.verdict && <div className="pred-verdict">“{p.verdict}”</div>}
    </div>
  );
}

function FormRow({ team, form }) {
  const flag = getFlag(team);
  return (
    <div className="pred-form-row">
      <span className="pred-form-team">
        {flag && <FlagImg src={flag} className="pred-form-flag" />}
        <span className="pred-form-team-name">{team}</span>
      </span>
      {form ? (
        <>
          <span className="pred-form-pills">
            {(form.outcomes || []).slice(0, 6).map((o, i) => (
              <span key={i} className={`pred-pill pred-pill--${o.toLowerCase()}`}>{o}</span>
            ))}
          </span>
          <span className="pred-form-rec">{form.w}W {form.d}D {form.l}L</span>
        </>
      ) : (
        <span className="pred-form-na">No recent data</span>
      )}
    </div>
  );
}
