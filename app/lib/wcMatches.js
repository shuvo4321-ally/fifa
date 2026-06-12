/**
 * Bulk World Cup match fetch — ALL matches in one upstream call, so the client
 * can look up any fixture's score locally instead of hitting a per-match
 * endpoint dozens of times. football-data (full fixture list, key rotation) with
 * an ESPN scoreboard fallback (keyless, reaches Vercel). 30s in-memory cache.
 */

let cache = null; // { matches, source, ts }
const TTL = 30000;

async function fromFootballData() {
  const keysStr = process.env.FOOTBALL_DATA_SCHEDULE_KEY || process.env.FOOTBALL_DATA_API_KEY;
  if (!keysStr) return null;
  const keys = keysStr.split(",").map((k) => k.trim()).filter(Boolean);
  for (const key of keys) {
    let res;
    try {
      res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
        headers: { "X-Auth-Token": key },
        cache: "no-store",
      });
    } catch {
      continue;
    }
    if (res.ok) {
      const d = await res.json();
      const matches = (d.matches || []).map((m) => ({
        home: m.homeTeam?.name || m.homeTeam?.shortName || "",
        away: m.awayTeam?.name || m.awayTeam?.shortName || "",
        status: m.status,
        score: { home: m.score?.fullTime?.home ?? null, away: m.score?.fullTime?.away ?? null },
        minute: null,
        utcDate: m.utcDate || null,
      }));
      return { matches, source: "football-data" };
    }
    if (res.status === 429 || res.status === 403) continue; // try next key / fall through
    break;
  }
  return null;
}

async function fromEspn() {
  let res;
  try {
    res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard",
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
  const result = (await fromFootballData()) || (await fromEspn());
  if (result) {
    cache = { ...result, ts: Date.now() };
    return cache;
  }
  return cache || { matches: [], source: null, ts: 0 }; // last good snapshot or empty
}
