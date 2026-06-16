/**
 * Live World Cup group standings from ESPN (public, keyless, unlimited, Vercel-friendly).
 * Returns a normalized-name → { gp, w, d, l, gf, ga, gd, pts } map so predictions
 * can be grounded in actual tournament form. 5-minute in-memory cache.
 */

import { normTeam, isSameTeam } from "./teamNormalization.js";

let cache = null;
let fetchTime = 0;
const TTL = 5 * 60 * 1000; // 5 minutes

function statNum(stats, key) {
  const s = stats[key];
  if (s == null) return 0;
  if (typeof s.value === "number") return s.value;
  const n = Number(s.displayValue);
  return Number.isNaN(n) ? 0 : n;
}

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
    const espnGroups = data?.children || [];

    const map = {};
    for (const g of espnGroups) {
      const entries = g?.standings?.entries || [];
      for (const entry of entries) {
        const name = normTeam(entry?.team?.displayName || "");
        if (!name) continue;
        const stats = {};
        for (const s of entry.stats || []) stats[s.abbreviation || s.name] = s;
        map[name] = {
          gp: statNum(stats, "GP"),
          w: statNum(stats, "W"),
          d: statNum(stats, "D"),
          l: statNum(stats, "L"),
          gf: statNum(stats, "F"),
          ga: statNum(stats, "A"),
          gd: statNum(stats, "GD"),
          pts: statNum(stats, "P"),
        };
      }
    }

    if (Object.keys(map).length > 0) {
      cache = map;
      fetchTime = now;
      return map;
    }
  } catch (error) {
    console.error("Failed to fetch ESPN standings:", error.message);
  }
  return cache; // last good snapshot, or null on first failure
}

export function lookupWcRecord(map, teamName) {
  if (!map) return null;
  const n = normTeam(teamName);
  if (map[n]) return map[n];
  for (const key of Object.keys(map)) {
    if (isSameTeam(key, teamName)) return map[key];
  }
  return null;
}
