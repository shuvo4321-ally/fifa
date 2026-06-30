import { FIXTURES_2026, GROUPS_2026 } from "../data/schedule2026.js";
import { getLiveScoreSync, getGroupStandingsSync } from "./liveScores.js";
import { buildBracket, thirdAssignmentsByWinner } from "./knockoutBracket.js";

// Resolve a knockout placeholder ("B1" = Group B winner, "D2" = Group D
// runner-up) to the actual team from the live standings.
function resolvePlaceholder(spec, standings) {
  const m = (spec || "").trim().match(/^([A-L])([12])$/);
  if (!m) return spec;
  const rows = standings["Group " + m[1]];
  if (rows && rows.some((r) => r.gp > 0)) return rows[Number(m[2]) - 1]?.name || spec;
  return spec;
}

// Resolve a full fixture to its two teams: group winner/runner-up, the actual
// third-placed opponent (feed-driven), and R16+ winners that have advanced —
// the same resolution the bracket and calendar use, so they all agree.
function resolveMatchTeams(fixture, standings, thirds, bracket) {
  const [r1, r2] = (fixture.match || "").split(" vs ").map((s) => s.trim());
  if (fixture.ref) {
    const m = bracket?.rounds?.[fixture.ref.round]?.[fixture.ref.i];
    const a = m?.s1 && !m.s1.tbd ? m.s1.name : resolvePlaceholder(r1, standings);
    const b = m?.s2 && !m.s2.tbd ? m.s2.name : resolvePlaceholder(r2, standings);
    return [a, b];
  }
  let t1 = resolvePlaceholder(r1, standings), t2 = resolvePlaceholder(r2, standings);
  const w1 = r1.match(/^([A-L])1$/), w2 = r2.match(/^([A-L])1$/);
  if (w1 && /^3rd/i.test(r2) && thirds[w1[1]]) t2 = thirds[w1[1]];
  else if (w2 && /^3rd/i.test(r1) && thirds[w2[1]]) t1 = thirds[w2[1]];
  return [t1, t2];
}

// name → flag lookup, built once.
const FLAGS = {};
for (const g of GROUPS_2026) for (const t of g.teams) FLAGS[t.name.trim()] = t.flag;
const getFlag = (n) => FLAGS[(n || "").trim()] || null;

// "Group A" → "group-a" (anchor on the schedule page); null for non-group rounds.
const groupSlug = (g) => (/^group\s+/i.test(g || "") ? g.trim().toLowerCase().replace(/\s+/g, "-") : null);

// Fixture date/time strings are Bangladesh time (UTC+6) — see the predict route.
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const BDT_OFFSET_MS = 6 * 60 * 60 * 1000;
const MATCH_OVER_MS = 2.5 * 60 * 60 * 1000; // full time + halftime + stoppage → "FT"
const HIDE_AFTER_FINISH_MS = 0; // do not wait, roll immediately
const EXPIRE_MS = MATCH_OVER_MS + HIDE_AFTER_FINISH_MS; // a match expires immediately after full time
const MAX_ROWS = 6; // a match day has at most 6 fixtures — show them all (no "+N more")

function kickoffMs(f) {
  const dm = /([A-Za-z]{3})[a-z]*\s+(\d{1,2}),\s*(\d{4})/.exec(f?.date || "");
  const tm = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(f?.time || "");
  if (!dm || !tm || MONTHS[dm[1]] == null) return NaN;
  let hour = Number(tm[1]) % 12;
  if (/PM/i.test(tm[3])) hour += 12;
  return Date.UTC(Number(dm[3]), MONTHS[dm[1]], Number(dm[2]), hour, Number(tm[2])) - BDT_OFFSET_MS;
}

// Calendar-day key (in BDT) for an epoch — shift so the UTC fields read as the
// Bangladesh wall clock, then key off year-month-day.
function dayKeyFromMs(ms) {
  const d = new Date(ms + BDT_OFFSET_MS);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}
function fixtureDayKey(f) {
  const dm = /([A-Za-z]{3})[a-z]*\s+(\d{1,2}),\s*(\d{4})/.exec(f?.date || "");
  if (!dm || MONTHS[dm[1]] == null) return null;
  return `${Number(dm[3])}-${MONTHS[dm[1]]}-${Number(dm[2])}`;
}

/**
 * Build the home hero's "today's matches" slide.
 *
 * Shows today's slate while any of it is still to come; once today is finished
 * (or empty) it rolls to the next match day ("Next up"), and returns null only
 * when the whole tournament is over. `now` is passed in — not read here — so the
 * caller can compute it post-mount and avoid an SSR hydration mismatch.
 */
export function buildTodaySlide(now) {
  const standings = getGroupStandingsSync(GROUPS_2026, FIXTURES_2026);
  const thirds = thirdAssignmentsByWinner(standings, GROUPS_2026);
  const bracket = buildBracket(standings, GROUPS_2026, FIXTURES_2026);

  const fixtures = FIXTURES_2026
    .filter((f) => f.match.includes(" vs "))
    .map((f) => {
      const k = kickoffMs(f);
      const [t1, t2] = resolveMatchTeams(f, standings, thirds, bracket);
      const live = getLiveScoreSync(t1, t2);
      const isFinished = live && live.status === "FINISHED";
      return { ...f, k, dayKey: fixtureDayKey(f), t1, t2, isFinished };
    })
    .filter((f) => !Number.isNaN(f.k) && f.dayKey);
  if (fixtures.length === 0) return null;

  // A match expires immediately after full time; the next
  // not-yet-expired match decides which day we show. Once the last of
  // today's games clears, the panel rolls to the next match day immediately.
  const upcoming = fixtures.filter((f) => !f.isFinished && f.k + EXPIRE_MS > now).sort((a, b) => a.k - b.k);
  if (upcoming.length === 0) return null; // tournament finished

  const targetKey = upcoming[0].dayKey;
  const isToday = targetKey === dayKeyFromMs(now);
  const dayFixtures = fixtures
    .filter((f) => f.dayKey === targetKey && !f.isFinished && f.k + EXPIRE_MS > now) // drop matches immediately after they finish
    .sort((a, b) => a.k - b.k);

  const rows = dayFixtures.slice(0, MAX_ROWS).map((f) => {
    const t1 = f.t1, t2 = f.t2; // already resolved above
    const slug = groupSlug(f.group);
    return {
      team1: t1,
      team2: t2,
      flag1: getFlag(t1),
      flag2: getFlag(t2),
      time: f.time,
      over: f.k + MATCH_OVER_MS < now,
      // Deep-link straight to this match's group table on the schedule page.
      href: slug ? `/calendar#${slug}` : "/calendar",
    };
  });

  const dateLabel = (dayFixtures[0].date || "").replace(/,\s*\d{4}$/, ""); // "Jun 12, 2026" → "Jun 12"
  return {
    heading: isToday ? "Today's Matches" : `Next Up · ${dateLabel}`,
    rows,
    moreCount: Math.max(0, dayFixtures.length - rows.length),
  };
}
