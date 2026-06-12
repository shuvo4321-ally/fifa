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

const ALIASES = {
  "korea republic": "south korea",
  "usa": "united states",
  "turkiye": "turkey",
  "ivory coast": "cote d ivoire",
  "cabo verde": "cape verde",
  "czechia": "czech republic",
  "iran": "ir iran",
  "congo dr": "congo",
  "dr congo": "congo"
};

/** Fuzzy-lookup a team's name to see if it matches another. */
export function isSameTeam(a, b) {
  const x = normTeam(a);
  const y = normTeam(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  
  if (ALIASES[x] === y || ALIASES[y] === x) return true;
  return false;
}
