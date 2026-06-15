/**
 * Universal team name normalizer for World Cup 2026.
 * Resolves API/Data feed discrepancies (e.g., ESPN vs football-data vs custom schedules).
 */

export function normTeam(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z]+/g, " ")   // &, -, ', etc. → space
    .replace(/\band\b/g, " ")   // "Bosnia & Herzegovina" === "Bosnia-Herzegovina"
    .replace(/\s+/g, " ")
    .trim();
}

// Each row lists EVERY spelling (normalized) that a feed or our schedule uses
// for ONE team — across ESPN, football-data and the fixtures. They all resolve
// to the first entry (the canonical key). Add a new spelling to its row once and
// it's recognized everywhere (table, fixtures, modal, hero, predictions).
const TEAM_GROUPS = [
  ["korea republic", "south korea", "korea"],
  ["usa", "united states", "united states of america", "us"],
  ["turkiye", "turkey"],
  ["ivory coast", "cote d ivoire"],
  ["cabo verde", "cape verde", "cape verde islands"],
  ["czechia", "czech republic"],
  ["iran", "ir iran"],
  ["congo", "congo dr", "dr congo", "democratic republic of congo", "congo republic"],
  ["bosnia herzegovina", "bosnia"],
];

// every known spelling → its canonical key (the first entry of its group)
const CANON = {};
for (const group of TEAM_GROUPS) for (const name of group) CANON[name] = group[0];

/**
 * Stable canonical key for a team — the SAME value for every known spelling
 * ("Cabo Verde", "Cape Verde", "Cape Verde Islands" all → "cabo verde").
 */
export function canonicalTeam(s) {
  const n = normTeam(s);
  return CANON[n] || n;
}

/** True if two names refer to the same team, across any provider's spelling. */
export function isSameTeam(a, b) {
  const ka = canonicalTeam(a);
  const kb = canonicalTeam(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  // Fallback for a full-length spelling no group lists yet (e.g. a feed sending
  // just "Bosnia"). Length-gated so knockout placeholders like "A1"/"C2" — which
  // normalize to a single letter — can never substring-match a real team.
  return ka.length >= 4 && kb.length >= 4 && (ka.includes(kb) || kb.includes(ka));
}
