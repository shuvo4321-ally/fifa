/**
 * Bulk World Cup match fetch — ALL matches in one upstream call, so the client
 * can look up any fixture's score locally instead of hitting a per-match
 * endpoint dozens of times. football-data (full fixture list, key rotation) with
 * an ESPN scoreboard fallback (keyless, reaches Vercel). 30s in-memory cache.
 */

let cache = null; // { matches, source, ts }
const TTL = 30000;

async function fromEspn() {
  let res;
  try {
    res = await fetch(
      // Whole-tournament date range in ONE call. The default scoreboard only
      // returns the CURRENT day's handful of matches, so every other day's
      // results — and therefore the group tables and most scorecards — stayed
      // blank. WC 2026 runs Jun 11 – Jul 19, 2026.
      "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260720",
      { cache: "no-store" }
    );
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const d = await res.json();
  const matches = (d.events || []).map((e) => {
    const comp = e?.competitions?.[0];
    const home = comp?.competitors?.find((c) => c.homeAway === "home");
    const away = comp?.competitors?.find((c) => c.homeAway === "away");
    const st = comp?.status?.type || e?.status?.type || {};
    let status = "TIMED";
    if (st.state === "in") {
      const ht =
        /^half\s*-?\s*time$/i.test((st.description || "").trim()) ||
        (st.shortDetail || "").trim().toUpperCase() === "HT";
      status = ht ? "PAUSED" : "IN_PLAY";
    } else if (st.state === "post") status = "FINISHED";
    return {
      home: home?.team?.displayName || "",
      away: away?.team?.displayName || "",
      status,
      score: {
        home: home?.score != null ? Number(home.score) : null,
        away: away?.score != null ? Number(away.score) : null,
      },
      minute: st.shortDetail || null,
      utcDate: e?.date || null,
    };
  });
  return { matches, source: "espn" };
}

export async function getAllWcMatches() {
  if (cache && Date.now() - cache.ts < TTL) return cache;
  const result = await fromEspn();
  if (result) {
    cache = { ...result, ts: Date.now() };
    return cache;
  }
  return cache || { matches: [], source: null, ts: 0 }; // last good snapshot or empty
}
