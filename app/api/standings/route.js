import { NextResponse } from 'next/server';
import { GROUPS_2026 } from '../../data/schedule2026';

// Live group standings from ESPN's public scoreboard API (keyless, no quota,
// reachable from Vercel where football-data.org 403-blocks server IPs).
// Updates shortly after each match finishes. 5-min in-memory cache + the last
// good snapshot as a fallback if ESPN is briefly unreachable.
let cached = null;
let fetchTime = 0;
const TTL = 5 * 60 * 1000; // 5 minutes

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

// Our fixture name (normalized) → ESPN names that don't substring-match it.
const TEAM_ALIASES = {
  "korea republic": ["south korea"],
  "usa": ["united states"],
  "turkiye": ["turkey"],
  "ivory coast": ["cote divoire", "cote d ivoire"],
};

function teamMatches(espnName, ourName) {
  const e = normTeam(espnName);
  const f = normTeam(ourName);
  if (!e || !f) return false;
  if (e.includes(f) || f.includes(e)) return true;
  return (TEAM_ALIASES[f] || []).some((alias) => e.includes(alias) || alias.includes(e));
}

function statNum(stats, key) {
  const s = stats[key];
  if (s == null) return 0;
  if (typeof s.value === "number") return s.value;
  const n = Number(s.displayValue);
  return Number.isNaN(n) ? 0 : n;
}

export async function GET() {
  const now = Date.now();
  if (cached && now - fetchTime < TTL) return NextResponse.json(cached);

  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings",
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`ESPN standings ${res.status}`);
    const data = await res.json();
    const espnGroups = data?.children || [];

    const groups = {};
    for (const g of GROUPS_2026) {
      const eg = espnGroups.find(
        (x) => (x.name || "").trim().toLowerCase() === g.name.trim().toLowerCase()
      );
      const entries = eg?.standings?.entries || [];

      let rows = g.teams.map((t) => {
        const en = entries.find((e) => teamMatches(e?.team?.displayName || "", t.name));
        if (!en) {
          return { name: t.name, rank: null, gp: 0, w: 0, d: 0, l: 0, gd: 0, pts: 0 };
        }
        const stats = {};
        for (const s of en.stats || []) stats[s.abbreviation || s.name] = s;
        return {
          name: t.name, // our canonical name, so the client needs no alias logic
          rank: statNum(stats, "R") || null,
          gp: statNum(stats, "GP"),
          w: statNum(stats, "W"),
          d: statNum(stats, "D"),
          l: statNum(stats, "L"),
          gd: statNum(stats, "GD"),
          pts: statNum(stats, "P"),
        };
      });

      // Order by ESPN's live rank when available.
      if (rows.some((r) => r.rank)) {
        rows = [...rows].sort((a, b) => (a.rank || 99) - (b.rank || 99));
      }
      groups[g.name] = rows;
    }

    cached = { groups, updatedAt: new Date().toISOString() };
    fetchTime = now;
    return NextResponse.json(cached);
  } catch (error) {
    if (cached) return NextResponse.json(cached);
    const cause = error?.cause?.message || (error?.cause ? String(error.cause) : "");
    return NextResponse.json(
      { groups: null, error: cause ? `${error.message} (${cause})` : error.message },
      { status: 502 }
    );
  }
}
