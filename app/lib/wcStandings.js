/**
 * World Cup group standings derived from our own live scores — the same source
 * the calendar page uses. No ESPN API call needed, zero cost, and always in sync
 * with the scoreboards shown on the site.
 *
 * Returns a normalized-name → { gp, w, d, l, gd, pts } map so predictions can
 * be grounded in actual tournament form. 5-minute in-memory cache.
 */

import { normTeam, isSameTeam } from "./teamNormalization";
import { GROUPS_2026, FIXTURES_2026 } from "../data/schedule2026";
import { getAllWcMatches } from "./wcMatches";

let cache = null;
let fetchTime = 0;
const TTL = 5 * 60 * 1000;

function matchScore(matches, team1, team2) {
  for (const m of matches) {
    const fwd =
      isSameTeam(m.home, team1) && isSameTeam(m.away, team2);
    const rev =
      !fwd && isSameTeam(m.home, team2) && isSameTeam(m.away, team1);
    if (fwd || rev) {
      if (m.status !== "FINISHED") continue;
      const h = m.score?.home;
      const a = m.score?.away;
      if (h == null || a == null) continue;
      return { s1: rev ? a : h, s2: rev ? h : a };
    }
  }
  return null;
}

export async function getWcStandings() {
  const now = Date.now();
  if (cache && now - fetchTime < TTL) return cache;

  try {
    // Fetch from our own scores endpoint (same source as the calendar)
    const { matches } = await getAllWcMatches();
    if (!matches || matches.length === 0) return cache;

    const map = {};

    for (const g of GROUPS_2026) {
      for (const t of g.teams) {
        map[normTeam(t.name)] = { gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
      }

      // Compute standings from finished group fixtures
      const groupFixtures = FIXTURES_2026.filter(
        (f) => f.group === g.name && f.match.includes(" vs ")
      );

      for (const fx of groupFixtures) {
        const [t1, t2] = fx.match.split(" vs ").map((s) => s.trim());
        const r1 = map[normTeam(t1)];
        const r2 = map[normTeam(t2)];
        if (!r1 || !r2) continue;

        const sc = matchScore(matches, t1, t2);
        if (!sc) continue;

        r1.gp++;
        r2.gp++;
        r1.gf += sc.s1;
        r1.ga += sc.s2;
        r2.gf += sc.s2;
        r2.ga += sc.s1;

        if (sc.s1 > sc.s2) {
          r1.w++;
          r1.pts += 3;
          r2.l++;
        } else if (sc.s1 < sc.s2) {
          r2.w++;
          r2.pts += 3;
          r1.l++;
        } else {
          r1.d++;
          r2.d++;
          r1.pts++;
          r2.pts++;
        }
      }
    }

    // Compute GD for each team
    for (const rec of Object.values(map)) {
      rec.gd = rec.gf - rec.ga;
    }

    cache = map;
    fetchTime = now;
    return map;
  } catch (err) {
    console.warn("wcStandings: failed to compute standings:", err.message);
    return cache; // last good snapshot, or null on first failure
  }
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
