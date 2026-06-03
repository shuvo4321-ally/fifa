import { GROUPS_2026, FIXTURES_2026 } from "./schedule2026";

// The teams you broadcast. Live TV is built from real schedule fixtures that
// involve any of these — each becomes a "Team vs Team" channel.
export const TARGET_TEAMS = [
  "Argentina",
  "Brazil",
  "France",
  "Germany",
  "Portugal",
  "Netherlands",
];

const flagOf = (name) => {
  for (const g of GROUPS_2026) {
    const t = g.teams.find((team) => team.name === name);
    if (t) return t.flag;
  }
  return null;
};

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Real "Team vs Team" fixtures (group games use " vs "; knockout placeholders
// use " v ", so they're naturally excluded) that involve a target team.
export const LIVE_MATCHES = FIXTURES_2026.filter((f) => f.match.includes(" vs "))
  .map((f) => {
    const [team1, team2] = f.match.split(" vs ").map((s) => s.trim());
    return { ...f, team1, team2, flag1: flagOf(team1), flag2: flagOf(team2) };
  })
  .filter(
    (m) => TARGET_TEAMS.includes(m.team1) || TARGET_TEAMS.includes(m.team2)
  )
  .map((m) => {
    const slug = slugify(`${m.team1}-vs-${m.team2}`);
    return { ...m, slug, room: `CRON-LIVE-${slug}` };
  });

export const getMatch = (slug) => LIVE_MATCHES.find((m) => m.slug === slug);
