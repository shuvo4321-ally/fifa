// Builds the FIFA World Cup 2026 knockout bracket DYNAMICALLY from the live
// group standings, following the OFFICIAL bracket structure.
//
// Source: FIFA 2026 match schedule / "2026 FIFA World Cup knockout stage"
// (en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage).
//
//   • 12 group winners + 12 runners-up + the 8 best third-placed teams = 32.
//   • Winners of groups A, B, D, E, G, I, K, L each face a third-placed team;
//     winners of C, F, H, J face a runner-up. Thirds never meet runners-up or
//     each other. Each "vs third" match has a fixed 5-group eligibility bucket.
//   • The 8 best thirds are ranked (points → GD → GF). FIFA pre-assigns each
//     valid combination to bracket slots; we reproduce a valid assignment with a
//     bipartite matching over the official eligibility buckets.
//   • R32 → R16 → QF → SF → Final follow the official match-number adjacency.
//     A winner only advances once its match has a FINISHED result.
//
// Nothing is hard-coded to a result; every team is read from the live table, so
// the bracket re-shuffles the instant a standing changes.

import { getLiveScoreSync, getRoundOpponentSync } from "./liveScores";
import { isSameTeam } from "./teamNormalization";

export const TEAM_CODES = {
  "Czechia": "CZE", "Korea Republic": "KOR", "Mexico": "MEX", "South Africa": "RSA",
  "Bosnia & Herzegovina": "BIH", "Canada": "CAN", "Qatar": "QAT", "Switzerland": "SUI",
  "Brazil": "BRA", "Haiti": "HAI", "Morocco": "MAR", "Scotland": "SCO",
  "Australia": "AUS", "Paraguay": "PAR", "Türkiye": "TUR", "USA": "USA",
  "Curaçao": "CUW", "Ecuador": "ECU", "Germany": "GER", "Ivory Coast": "CIV",
  "Japan": "JPN", "Netherlands": "NED", "Sweden": "SWE", "Tunisia": "TUN",
  "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN", "New Zealand": "NZL",
  "Cabo Verde": "CPV", "Saudi Arabia": "KSA", "Spain": "ESP", "Uruguay": "URU",
  "France": "FRA", "Iraq": "IRQ", "Norway": "NOR", "Senegal": "SEN",
  "Algeria": "ALG", "Argentina": "ARG", "Austria": "AUT", "Jordan": "JOR",
  "Colombia": "COL", "Congo": "CGO", "Portugal": "POR", "Uzbekistan": "UZB",
  "Croatia": "CRO", "England": "ENG", "Ghana": "GHA", "Panama": "PAN",
};

// Round of 32 in official match order (73–88). A side is either a position
// string ("1E" = winner Group E, "2B" = runner-up Group B) or a third-place
// slot { third: [eligible group letters] }.
const R32_SPEC = [
  { a: "2A", b: "2B" },                                   // 73
  { a: "1E", b: { third: ["A", "B", "C", "D", "F"] } },   // 74
  { a: "1F", b: "2C" },                                   // 75
  { a: "1C", b: "2F" },                                   // 76
  { a: "1I", b: { third: ["C", "D", "F", "G", "H"] } },   // 77
  { a: "2E", b: "2I" },                                   // 78
  { a: "1A", b: { third: ["C", "E", "F", "H", "I"] } },   // 79
  { a: "1L", b: { third: ["E", "H", "I", "J", "K"] } },   // 80
  { a: "1D", b: { third: ["B", "E", "F", "I", "J"] } },   // 81
  { a: "1G", b: { third: ["A", "E", "H", "I", "J"] } },   // 82
  { a: "2K", b: "2L" },                                   // 83
  { a: "1H", b: "2J" },                                   // 84
  { a: "1B", b: { third: ["E", "F", "G", "I", "J"] } },   // 85
  { a: "1J", b: "2H" },                                   // 86
  { a: "1K", b: { third: ["D", "E", "I", "J", "L"] } },   // 87
  { a: "2D", b: "2G" },                                   // 88
];

// Reorder the match-number array into bracket order so that advancing
// consecutive pairs reproduces the official R16/QF/SF/Final tree.
// (left half = matches feeding SF1, right half = matches feeding SF2.)
const BRACKET_ORDER = [1, 4, 0, 2, 10, 11, 8, 9, 3, 5, 6, 7, 13, 15, 12, 14];

const codeFor = (name) => TEAM_CODES[name] || (name || "").slice(0, 3).toUpperCase();
const teamObj = (name, flags) => ({ name, flag: flags[name] || null, code: codeFor(name), tbd: false });
const tbdObj = (label) => ({ name: null, flag: null, code: label, tbd: true });

// Kuhn's algorithm: match qualifying groups → third slots respecting the
// official eligibility buckets. Returns Map<slotMatchIndex, groupLetter>.
function matchThirds(slots, qualGroups) {
  const groupToSlot = new Map(); // group -> slot match index
  const slotOwner = new Map();   // slot index -> group
  const tryAssign = (g, seen) => {
    for (const slot of slots) {
      if (!slot.bucket.includes(g) || seen.has(slot.idx)) continue;
      seen.add(slot.idx);
      const owner = slotOwner.get(slot.idx);
      if (owner === undefined || tryAssign(owner, seen)) {
        slotOwner.set(slot.idx, g);
        groupToSlot.set(g, slot.idx);
        return true;
      }
    }
    return false;
  };
  for (const g of qualGroups) tryAssign(g, new Set());
  return slotOwner;
}

// Maps each group WINNER's letter (the "vs 3rd" matches — A,B,D,E,G,I,K,L) to
// the third-placed team it faces. Prefers the ACTUAL matchup from the feed (the
// official FIFA allocation, once the R32 fixtures are published), and falls back
// to a bipartite assignment over the eligibility buckets before then. Used by
// the bracket, schedule and prediction so they always agree with reality.
export function thirdAssignmentsByWinner(standings, groups) {
  const flags = {};
  for (const g of groups) for (const t of g.teams) flags[t.name] = t.flag;
  // map a feed spelling ("Congo DR", "Cape Verde") back to our schedule name.
  const scheduleNameOf = (feedName) => {
    for (const n in flags) if (isSameTeam(n, feedName)) return n;
    return feedName;
  };
  const slots = R32_SPEC
    .map((m, idx) => (m.b && m.b.third ? { idx, bucket: m.b.third, winnerLetter: m.a[1] } : null))
    .filter(Boolean);

  const out = {};
  const pending = [];
  for (const slot of slots) {
    const rows = standings["Group " + slot.winnerLetter];
    const winnerName = rows && rows.some((r) => r.gp > 0) ? rows[0]?.name : null;
    const opp = winnerName ? getRoundOpponentSync(winnerName, "round-of-32") : null;
    if (opp) out[slot.winnerLetter] = scheduleNameOf(opp);
    else pending.push(slot);
  }

  // Bipartite fallback for any "vs 3rd" slot the feed hasn't published yet.
  if (pending.length) {
    const thirds = [];
    for (const g of groups) {
      const letter = g.name.replace("Group ", "");
      const row = standings["Group " + letter]?.[2];
      if (row && row.gp > 0) thirds.push({ letter, name: row.name, pts: row.pts, gd: row.gd, gf: row.gf });
    }
    thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name));
    const taken = new Set(Object.values(out));
    const qual = thirds.slice(0, 8).filter((t) => !taken.has(scheduleNameOf(t.name)));
    const owner = matchThirds(pending.map((s) => ({ idx: s.idx, bucket: s.bucket })), qual.map((t) => t.letter));
    const byGroup = new Map(qual.map((t) => [t.letter, t.name]));
    for (const slot of pending) {
      const g = owner.get(slot.idx);
      if (g) out[slot.winnerLetter] = byGroup.get(g);
    }
  }
  return out;
}

export function buildBracket(standings, groups, fixtures) {
  const flags = {};
  for (const g of groups) for (const t of g.teams) flags[t.name] = t.flag;

  const groupRows = (letter) => standings["Group " + letter];
  const groupHasData = (letter) => {
    const rows = groupRows(letter);
    return !!(rows && rows.some((x) => x.gp > 0));
  };

  // Third-place opponents — from the feed's real matchups (bipartite fallback).
  const thirdByWinner = thirdAssignmentsByWinner(standings, groups);

  const resolvePos = (spec) => {
    const letter = spec[1], pos = parseInt(spec[0], 10);
    if (!groupHasData(letter)) return tbdObj(spec);
    const row = groupRows(letter)?.[pos - 1];
    return row ? teamObj(row.name, flags) : tbdObj(spec);
  };
  const resolveSide = (side, idx) => {
    if (typeof side === "string") return resolvePos(side);
    // third slot: look it up by the group winner of this match.
    const name = thirdByWinner[R32_SPEC[idx].a[1]];
    if (name) return teamObj(name, flags);
    return tbdObj("3rd " + side.third.join("/"));
  };

  // R32 in match order, then reorder into bracket order.
  const r32ordered = R32_SPEC.map((m, idx) => ({ s1: resolveSide(m.a, idx), s2: resolveSide(m.b, idx) }));
  const r32 = BRACKET_ORDER.map((i) => r32ordered[i]);

  // Knockout has no draws: a level score is settled in extra time / penalties,
  // so trust the feed's winner flag; fall back to goals only if it's missing.
  const winnerOf = (match) => {
    if (!match || !match.s1?.name || !match.s2?.name) return null;
    const sc = getLiveScoreSync(match.s1.name, match.s2.name);
    if (!sc || sc.status !== "FINISHED") return null;
    if (sc.winner === "s1") return match.s1;
    if (sc.winner === "s2") return match.s2;
    if (sc.s1 != null && sc.s2 != null && sc.s1 !== sc.s2) return sc.s1 > sc.s2 ? match.s1 : match.s2;
    return null;
  };
  const advance = (round) => {
    const next = [];
    for (let i = 0; i < round.length; i += 2) {
      next.push({ s1: winnerOf(round[i]) || tbdObj("TBD"), s2: winnerOf(round[i + 1]) || tbdObj("TBD") });
    }
    return next;
  };

  const r16 = advance(r32);
  const qf = advance(r16);
  const sf = advance(qf);
  const final = advance(sf);

  // Third-place play-off: the two semi-final LOSERS.
  const loserOf = (match) => {
    if (!match || !match.s1?.name || !match.s2?.name) return null;
    const sc = getLiveScoreSync(match.s1.name, match.s2.name);
    if (!sc || sc.status !== "FINISHED") return null;
    if (sc.winner === "s1") return match.s2;
    if (sc.winner === "s2") return match.s1;
    if (sc.s1 != null && sc.s2 != null && sc.s1 !== sc.s2) return sc.s1 > sc.s2 ? match.s2 : match.s1;
    return null;
  };
  const thirdPlace = [{ s1: loserOf(sf[0]) || tbdObj("Loser SF1"), s2: loserOf(sf[1]) || tbdObj("Loser SF2") }];

  return { flags, rounds: { r32, r16, qf, sf, final, thirdPlace } };
}
