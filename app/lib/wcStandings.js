/**
 * Live World Cup group standings from API-Football (primary) with
 * football-data.org as fallback. Returns a normalized-name →
 * { gp, w, d, l, gd, pts } map so predictions can be grounded
 * in actual tournament form. 5-minute in-memory cache + last-good fallback.
 */

import { normTeam, isSameTeam } from "./teamNormalization.js";

let cache = null;
let fetchTime = 0;
const TTL = 5 * 60 * 1000;

/** Try API-Football first (reachable from Vercel, uses existing API_FOOTBALL_KEY). */
async function fetchFromApiFootball() {
  const keysStr = process.env.API_FOOTBALL_KEY;
  if (!keysStr) return null;
  const apiKeys = keysStr.split(",").map(k => k.trim()).filter(Boolean);

  // FIFA World Cup 2026 — league ID = 1, season = 2026
  const currentYear = new Date().getFullYear();

  for (const key of apiKeys) {
    try {
      const res = await fetch(
        `https://v3.football.api-sports.io/standings?league=1&season=${currentYear}`,
        {
          headers: { "x-apisports-key": key },
          cache: "no-store",
        }
      );
      if (!res.ok) continue;
      const data = await res.json();

      // API-Football returns errors in body when quota exceeded
      if (data.errors && data.errors.requests) continue;

      const groups = data?.response?.[0]?.league?.standings;
      if (!groups || !Array.isArray(groups)) return null;

      const map = {};
      for (const group of groups) {
        for (const entry of group) {
          const name = normTeam(entry?.team?.name || "");
          if (!name) continue;
          map[name] = {
            gp: entry.all?.played || 0,
            w: entry.all?.win || 0,
            d: entry.all?.draw || 0,
            l: entry.all?.lose || 0,
            gf: entry.all?.goals?.for || 0,
            ga: entry.all?.goals?.against || 0,
            gd: entry.goalsDiff || 0,
            pts: entry.points || 0,
          };
        }
      }
      if (Object.keys(map).length > 0) return map;
    } catch {
      continue;
    }
  }
  return null;
}

/** Fallback: football-data.org (may be blocked on Vercel but works locally). */
async function fetchFromFootballData() {
  const keysStr = process.env.FOOTBALL_DATA_API_KEY;
  if (!keysStr) return null;
  const apiKeys = keysStr.split(",").map(k => k.trim()).filter(Boolean);

  for (const key of apiKeys) {
    try {
      const res = await fetch(
        "https://api.football-data.org/v4/competitions/WC/standings",
        {
          headers: { "X-Auth-Token": key },
          cache: "no-store",
        }
      );
      if (!res.ok) continue;
      const data = await res.json();

      const map = {};
      for (const standing of data?.standings || []) {
        if (standing.type !== "TOTAL") continue;
        for (const entry of standing.table || []) {
          const name = normTeam(entry?.team?.name || "");
          if (!name) continue;
          map[name] = {
            gp: entry.playedGames || 0,
            w: entry.won || 0,
            d: entry.draw || 0,
            l: entry.lost || 0,
            gf: entry.goalsFor || 0,
            ga: entry.goalsAgainst || 0,
            gd: entry.goalDifference || 0,
            pts: entry.points || 0,
          };
        }
      }
      if (Object.keys(map).length > 0) return map;
    } catch {
      continue;
    }
  }
  return null;
}

export async function getWcStandings() {
  const now = Date.now();
  if (cache && now - fetchTime < TTL) return cache;

  // Try API-Football first (works on Vercel), then football-data.org as fallback
  const result = await fetchFromApiFootball() || await fetchFromFootballData();

  if (result) {
    cache = result;
    fetchTime = now;
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
