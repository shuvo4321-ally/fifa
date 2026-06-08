/**
 * Football-data.org API client with in-memory caching.
 * Used to fetch real squad data, coaches, and recent results
 * before passing them as RAG context to Gemini.
 */

const API_BASE = "https://api.football-data.org/v4";

// ── In-memory cache (survives across requests in the same process) ──
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

async function fetchApi(endpoint) {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) return null;

  const cached = getCached(endpoint);
  if (cached) return cached;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { "X-Auth-Token": key },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      console.warn(`football-data.org ${res.status} for ${endpoint}`);
      return null;
    }
    const data = await res.json();
    setCache(endpoint, data);
    return data;
  } catch (err) {
    console.warn("football-data.org fetch failed:", err.message);
    return null;
  }
}

// ── Helpers ──

function calcAge(dob) {
  if (!dob) return "?";
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

// Fuzzy match a team name against the API result
function matchTeam(apiTeams, name) {
  if (!apiTeams?.length) return null;
  const n = name.toLowerCase().trim();
  return (
    apiTeams.find((t) => t.name?.toLowerCase() === n) ||
    apiTeams.find((t) => t.shortName?.toLowerCase() === n) ||
    apiTeams.find((t) => t.tla?.toLowerCase() === n) ||
    apiTeams.find((t) => t.name?.toLowerCase().includes(n)) ||
    apiTeams.find((t) => n.includes(t.shortName?.toLowerCase() || "~~~")) ||
    null
  );
}

// ── Public API ──

/** Try to find a team in the WC 2026 competition, then fall back to global search. */
export async function findTeam(teamName) {
  // 1. Try WC competition (code may be WC or a season-specific id)
  const wcTeams = await fetchApi("/competitions/WC/teams");
  if (wcTeams?.teams) {
    const found = matchTeam(wcTeams.teams, teamName);
    if (found) return found;
  }

  // 2. Fallback: search globally (free tier may not support this)
  const search = await fetchApi(`/teams?name=${encodeURIComponent(teamName)}`);
  if (search?.teams?.length) return search.teams[0];

  return null;
}

/** Get full team details including squad. */
export async function getTeamSquad(teamId) {
  return await fetchApi(`/teams/${teamId}`);
}

/** Get a team's recent finished matches. */
export async function getRecentMatches(teamId, limit = 8) {
  const data = await fetchApi(`/teams/${teamId}/matches?status=FINISHED&limit=${limit}`);
  return data?.matches || [];
}

/**
 * Build a rich RAG context string for a match between two teams.
 * Fetches squads, coaches, and recent results from football-data.org.
 */
export async function buildMatchContext(team1Name, team2Name) {
  const [team1, team2] = await Promise.all([findTeam(team1Name), findTeam(team2Name)]);

  const parts = [];

  for (const [name, team] of [
    [team1Name, team1],
    [team2Name, team2],
  ]) {
    if (!team) {
      parts.push(`\n## ${name}\n(No live API data — use your built-in knowledge)\n`);
      continue;
    }

    // Fetch squad + recent matches in parallel
    const [details, matches] = await Promise.all([
      getTeamSquad(team.id),
      getRecentMatches(team.id, 8),
    ]);

    let section = `\n## ${name}`;
    if (team.tla) section += ` (${team.tla})`;
    section += "\n";

    // Coach
    if (details?.coach?.name) {
      section += `**Coach:** ${details.coach.name} (${details.coach.nationality || ""})\n`;
    }

    // Squad grouped by position
    if (details?.squad?.length) {
      const grouped = {};
      for (const p of details.squad) {
        const pos = p.position || "Unknown";
        if (!grouped[pos]) grouped[pos] = [];
        grouped[pos].push(p);
      }

      section += "\n### Current Squad\n";
      const order = ["Goalkeeper", "Defence", "Midfield", "Offence", "Unknown"];
      for (const pos of order) {
        if (!grouped[pos]) continue;
        section += `**${pos}:** `;
        section += grouped[pos]
          .map((p) => {
            const age = calcAge(p.dateOfBirth);
            return `${p.name} (${p.nationality || "?"}, ${age})`;
          })
          .join(" · ");
        section += "\n";
      }
    }

    // Recent results
    if (matches.length) {
      section += "\n### Recent Results\n";
      for (const m of matches.slice(0, 8)) {
        const home = m.homeTeam?.shortName || m.homeTeam?.name || "?";
        const away = m.awayTeam?.shortName || m.awayTeam?.name || "?";
        const fh = m.score?.fullTime?.home ?? "?";
        const fa = m.score?.fullTime?.away ?? "?";
        const comp = m.competition?.name || "";
        const date = m.utcDate?.slice(0, 10) || "";
        section += `${date} | ${home} ${fh}-${fa} ${away} (${comp})\n`;
      }
    }

    // Win/Draw/Loss record from recent matches
    if (matches.length && team.id) {
      let w = 0, d = 0, l = 0, gf = 0, ga = 0;
      for (const m of matches) {
        const isHome = m.homeTeam?.id === team.id;
        const homeG = m.score?.fullTime?.home ?? 0;
        const awayG = m.score?.fullTime?.away ?? 0;
        gf += isHome ? homeG : awayG;
        ga += isHome ? awayG : homeG;
        if (homeG === awayG) d++;
        else if ((isHome && homeG > awayG) || (!isHome && awayG > homeG)) w++;
        else l++;
      }
      section += `\n**Form (last ${matches.length}):** ${w}W ${d}D ${l}L — ${gf} goals scored, ${ga} conceded\n`;
    }

    parts.push(section);
  }

  return parts.join("\n---\n");
}
