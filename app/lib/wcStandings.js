/**
 * Live World Cup group records from ESPN's public standings API (keyless, no
 * quota, and reachable from Vercel where football-data 403s). Returns a
 * normalized-name → { gp, w, d, l, gd, pts } map so predictions can be grounded
 * in actual tournament form. 5-minute in-memory cache + last-good fallback.
 */

let cache = null;
let fetchTime = 0;
const TTL = 5 * 60 * 1000;

function normTeam(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function statNum(stats, key) {
  const s = stats[key];
  if (s == null) return 0;
  if (typeof s.value === "number") return s.value;
  const n = Number(s.displayValue);
  return Number.isNaN(n) ? 0 : n;
}

// Our fixture name → ESPN name, for the few that don't substring-match.
const ALIASES = {
  "korea republic": "south korea",
  "usa": "united states",
  "turkiye": "turkey",
  "ivory coast": "cote divoire",
};

export async function getWcStandings() {
  const now = Date.now();
  if (cache && now - fetchTime < TTL) return cache;
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings",
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`ESPN standings ${res.status}`);
    const data = await res.json();

    const map = {};
    for (const g of data?.children || []) {
      for (const e of g?.standings?.entries || []) {
        const name = normTeam(e?.team?.displayName || "");
        if (!name) continue;
        const stats = {};
        for (const s of e.stats || []) stats[s.abbreviation || s.name] = s;
        map[name] = {
          gp: statNum(stats, "GP"),
          w: statNum(stats, "W"),
          d: statNum(stats, "D"),
          l: statNum(stats, "L"),
          gd: statNum(stats, "GD"),
          pts: statNum(stats, "P"),
        };
      }
    }
    cache = map;
    fetchTime = now;
    return map;
  } catch {
    return cache; // last good snapshot, or null on first failure
  }
}

/** Fuzzy-lookup a team's WC record by name (handles partial + alias matches). */
export function lookupWcRecord(map, teamName) {
  if (!map) return null;
  const n = normTeam(teamName);
  if (map[n]) return map[n];
  for (const key of Object.keys(map)) {
    if (key.includes(n) || n.includes(key)) return map[key];
  }
  const alias = ALIASES[n];
  if (alias && map[normTeam(alias)]) return map[normTeam(alias)];
  return null;
}
