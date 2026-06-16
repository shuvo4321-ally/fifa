/**
 * Football-data.org API client with in-memory caching.
 * Used to fetch real squad data, coaches, and recent results
 * before passing them as RAG context to Gemini.
 */
import { findRapidTeam, getRapidSquad, getRapidRecentStats } from "./apiFootball.js";
import { supabase } from "./supabase.js";
import { getWcStandings, lookupWcRecord } from "./wcStandings.js";


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
  // Use the specific schedule key if fetching matches, otherwise use the main key
  const isMatchSchedule = endpoint.includes("/matches");
  const keysStr = isMatchSchedule 
    ? process.env.FOOTBALL_DATA_SCHEDULE_KEY || process.env.FOOTBALL_DATA_API_KEY 
    : process.env.FOOTBALL_DATA_API_KEY;

  if (!keysStr) return null;
  const apiKeys = keysStr.split(",").map(k => k.trim()).filter(Boolean);

  const cached = getCached(endpoint);
  if (cached) return cached;

  let lastError = null;

  for (let i = 0; i < apiKeys.length; i++) {
    const key = apiKeys[i];
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { "X-Auth-Token": key },
        next: { revalidate: 3600 },
      });
      
      if (!res.ok) {
        console.warn(`football-data.org ${res.status} for ${endpoint} using key ${i+1}/${apiKeys.length}`);
        lastError = res.status;
        // If 429 Too Many Requests or 403 Forbidden (quota limit), try next key
        if (res.status === 429 || res.status === 403) {
          continue;
        }
        return null; // Other errors like 404, 400 don't need retry
      }
      
      const data = await res.json();
      setCache(endpoint, data);
      return data;
    } catch (err) {
      console.warn(`football-data.org fetch failed with key ${i+1}/${apiKeys.length}:`, err.message);
      lastError = err.message;
    }
  }

  console.error("All football-data.org API keys exhausted. Last error:", lastError);
  return null;
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
export async function getSupabaseTeam(teamName) {
  if (!supabase) return null;
  const n = teamName.toLowerCase().trim();
  const { data, error } = await supabase
    .from('fifa_wc26_prediction')
    .select('*')
    .ilike('country', `%${n}%`)
    .limit(1);
  if (!error && data && data.length > 0) return data[0];
  return null;
}

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
export async function buildMatchAnalysis(team1Name, team2Name) {
  const [team1, team2, rapidTeam1, rapidTeam2, supaTeam1, supaTeam2, wcStandings] = await Promise.all([
    findTeam(team1Name),
    findTeam(team2Name),
    findRapidTeam(team1Name),
    findRapidTeam(team2Name),
    getSupabaseTeam(team1Name),
    getSupabaseTeam(team2Name),
    getWcStandings()
  ]);

  const parts = [];
  const signals = [];

  for (const [name, team, rapidTeam, supaTeam] of [
    [team1Name, team1, rapidTeam1, supaTeam1],
    [team2Name, team2, rapidTeam2, supaTeam2],
  ]) {
    // Structured signals the deterministic baseline model reads (see predictModel.js).
    const signal = {
      name,
      hasData: false,
      squadRating: null, // EA FC 26 squad average
      top11: null,
      elo: null, // World Football Elo Rating
      form: null, // { w, d, l, played }
      gf: 0,
      ga: 0,
      outcomes: [], // ["W","D","L", ...] most recent first
    };

    if (!team && !rapidTeam && !supaTeam) {
      parts.push(`\n## ${name}\n(No live API data — use your built-in knowledge)\n`);
      signals.push(signal);
      continue;
    }

    signal.hasData = true;

    // Fetch squad + recent matches in parallel from both APIs
    const [details, matches, rapidSquad, rapidStats] = await Promise.all([
      team ? getTeamSquad(team.id) : null,
      team ? getRecentMatches(team.id, 8) : [],
      rapidTeam ? getRapidSquad(rapidTeam.id) : [],
      rapidTeam ? getRapidRecentStats(rapidTeam.id) : []
    ]);

    let section = `\n## ${name}`;
    if (team && team.tla) section += ` (${team.tla})`;
    section += "\n";

    // Coach
    if (details?.coach?.name) {
      section += `**Coach:** ${details.coach.name} (${details.coach.nationality || ""})\n`;
    }

    // Supabase Detailed Squad & Metrics (Highest Priority)
    if (supaTeam && supaTeam.metrics && supaTeam.players) {
      const sa = Number(supaTeam.metrics.squadAvg);
      const t11 = Number(supaTeam.metrics.top11Avg);
      if (!Number.isNaN(sa)) signal.squadRating = sa;
      if (!Number.isNaN(t11)) signal.top11 = t11;
      if (supaTeam.metrics.elo) signal.elo = Number(supaTeam.metrics.elo);
      // Pass positional metrics to the model for matchup-specific scoring
      if (supaTeam.metrics.attack) signal.attack = supaTeam.metrics.attack;
      if (supaTeam.metrics.defense) signal.defense = supaTeam.metrics.defense;
      if (supaTeam.metrics.midfield) signal.midfield = supaTeam.metrics.midfield;
      if (supaTeam.metrics.goalkeeper) signal.goalkeeper = supaTeam.metrics.goalkeeper;
      section += "\n### Current Squad & EA FC 26 Metrics (Database)\n";
      section += `**Overall Squad Rating:** ${supaTeam.metrics.squadAvg} | **Top 11 Average:** ${supaTeam.metrics.top11Avg} | **World Football Elo Rating:** ${supaTeam.metrics.elo || "N/A"}\n`;
      if (supaTeam.metrics.attack) {
        section += `**Attack:** ${supaTeam.metrics.attack.overall} (Shooting: ${supaTeam.metrics.attack.sho}, Pace: ${supaTeam.metrics.attack.pac})\n`;
        section += `**Midfield:** ${supaTeam.metrics.midfield.overall} (Passing: ${supaTeam.metrics.midfield.pas}, Dribbling: ${supaTeam.metrics.midfield.dri})\n`;
        section += `**Defense:** ${supaTeam.metrics.defense.overall} (Defending: ${supaTeam.metrics.defense.def}, Physical: ${supaTeam.metrics.defense.phy})\n`;
        section += `**Goalkeeper:** ${supaTeam.metrics.goalkeeper.overall} (Reflexes: ${supaTeam.metrics.goalkeeper.ref})\n`;
      }
      
      const grouped = {};
      for (const p of supaTeam.players) {
        const pos = p.pos || "Unknown";
        if (!grouped[pos]) grouped[pos] = [];
        grouped[pos].push(p);
      }
      const order = ["GK", "DF", "MF", "FW", "Unknown"];
      for (const pos of order) {
        if (!grouped[pos]) continue;
        section += `**${pos}:** `;
        section += grouped[pos]
          .map((p) => {
            const ea = p.ea;
            if (ea) return `${ea.ea_name} (OVR: ${ea.overall})`;
            return p.name;
          })
          .join(" · ");
        section += "\n";
      }
    } else if (rapidSquad && rapidSquad.length > 0) {
      section += "\n### Current Squad (Advanced Data from API-Football)\n";
      const grouped = {};
      for (const p of rapidSquad) {
        const pos = p.position || "Unknown";
        if (!grouped[pos]) grouped[pos] = [];
        grouped[pos].push(p);
      }
      const order = ["Goalkeeper", "Defender", "Midfielder", "Attacker", "Unknown"];
      for (const pos of order) {
        if (!grouped[pos]) continue;
        section += `**${pos}:** `;
        section += grouped[pos]
          .map((p) => {
            return `${p.name} (Age: ${p.age || "?"})`;
          })
          .join(" · ");
        section += "\n";
      }
    } else if (details?.squad?.length) {
      const grouped = {};
      for (const p of details.squad) {
        const pos = p.position || "Unknown";
        if (!grouped[pos]) grouped[pos] = [];
        grouped[pos].push(p);
      }

      section += "\n### Current Squad (Basic Data)\n";
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

    // Recent results (football-data)
    if (matches && matches.length > 0) {
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
    if (matches && matches.length && team?.id) {
      let w = 0, d = 0, l = 0, gf = 0, ga = 0;
      // Most-recent-first so the form strip reads left→right newest→oldest.
      const ordered = [...matches].sort(
        (m1, m2) => new Date(m2.utcDate || 0) - new Date(m1.utcDate || 0)
      );
      for (const m of ordered) {
        const isHome = m.homeTeam?.id === team.id;
        const homeG = m.score?.fullTime?.home ?? 0;
        const awayG = m.score?.fullTime?.away ?? 0;
        gf += isHome ? homeG : awayG;
        ga += isHome ? awayG : homeG;
        let r;
        if (homeG === awayG) { d++; r = "D"; }
        else if ((isHome && homeG > awayG) || (!isHome && awayG > homeG)) { w++; r = "W"; }
        else { l++; r = "L"; }
        signal.outcomes.push(r);
      }
      signal.form = { w, d, l, played: matches.length };
      signal.gf = gf;
      signal.ga = ga;
      section += `\n**Form (last ${matches.length}):** ${w}W ${d}D ${l}L — ${gf} goals scored, ${ga} conceded\n`;
    }

    // ── Vercel fallback for recent form ──
    // football-data.org 403-blocks the deploy's server IPs, so on Vercel the
    // block above produces no form (→ coverage caps at 0.5, "High" confidence
    // becomes impossible, baseline ungrounded). API-Football IS reachable from
    // Vercel and we already fetched its last-5 fixtures as `rapidStats` above —
    // build the same Recent Results + form signal from it when football-data is
    // dark, so predictions are grounded identically on localhost and the deploy.
    if (!signal.form && rapidTeam?.id && rapidStats?.length) {
      const ordered = [...rapidStats]
        .filter((f) => f?.goals?.home != null && f?.goals?.away != null)
        .sort((a, b) => new Date(b.fixture?.date || 0) - new Date(a.fixture?.date || 0));

      if (ordered.length) {
        section += "\n### Recent Results\n";
        let w = 0, d = 0, l = 0, gf = 0, ga = 0;
        for (const f of ordered) {
          const isHome = f.teams?.home?.id === rapidTeam.id;
          const homeG = f.goals.home ?? 0;
          const awayG = f.goals.away ?? 0;
          const home = f.teams?.home?.name || "?";
          const away = f.teams?.away?.name || "?";
          const date = (f.fixture?.date || "").slice(0, 10);
          const comp = f.league?.name || "";
          section += `${date} | ${home} ${homeG}-${awayG} ${away}${comp ? ` (${comp})` : ""}\n`;

          const myG = isHome ? homeG : awayG;
          const oppG = isHome ? awayG : homeG;
          gf += myG;
          ga += oppG;
          let r;
          if (myG === oppG) { d++; r = "D"; }
          else if (myG > oppG) { w++; r = "W"; }
          else { l++; r = "L"; }
          signal.outcomes.push(r);
        }
        signal.form = { w, d, l, played: ordered.length };
        signal.gf = gf;
        signal.ga = ga;
        section += `\n**Form (last ${ordered.length}):** ${w}W ${d}D ${l}L — ${gf} goals scored, ${ga} conceded\n`;
      }
    }

    // ── Actual World Cup form (highest priority) ──
    // Once a team has played a group game, its real tournament record is the most
    // predictive recent form — and ESPN standings reach Vercel — so it overrides
    // the pre-tournament form above. Falls back to that form before kickoff (gp 0).
    const wcRec = lookupWcRecord(wcStandings, name);
    if (wcRec && wcRec.gp > 0) {
      signal.form = { w: wcRec.w, d: wcRec.d, l: wcRec.l, played: wcRec.gp };
      // Standings expose GD only; encode it so (gf - ga) / played === gd / gp.
      signal.gf = wcRec.gd > 0 ? wcRec.gd : 0;
      signal.ga = wcRec.gd < 0 ? -wcRec.gd : 0;
      signal.outcomes = [
        ...Array(wcRec.w).fill("W"),
        ...Array(wcRec.d).fill("D"),
        ...Array(wcRec.l).fill("L"),
      ];
      section += `\n**World Cup group form:** ${wcRec.w}W ${wcRec.d}D ${wcRec.l}L — GD ${wcRec.gd > 0 ? "+" : ""}${wcRec.gd}, ${wcRec.pts} pts\n`;
    }

    parts.push(section);
    signals.push(signal);
  }

  return { context: parts.join("\n---\n"), signalA: signals[0], signalB: signals[1] };
}

/** Backward-compatible string-only context. */
export async function buildMatchContext(team1Name, team2Name) {
  return (await buildMatchAnalysis(team1Name, team2Name)).context;
}
