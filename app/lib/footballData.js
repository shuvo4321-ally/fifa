/**
 * Football data API client using API-Football and Supabase exclusively.
 * Completely free of football-data.org (which is 403-blocked on Vercel).
 */
import { findRapidTeam, getRapidSquad, getRapidRecentStats, getRapidTeamStatistics } from "./apiFootball.js";
import { supabase } from "./supabase.js";
import { getWcStandings, lookupWcRecord } from "./wcStandings.js";

// ── In-memory cache ──
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

// ── Public API ──

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

/** Build a rich RAG context string + signals for a match. */
export async function buildMatchAnalysis(team1Name, team2Name) {
  const [rapidTeam1, rapidTeam2, supaTeam1, supaTeam2, wcStandings] = await Promise.all([
    findRapidTeam(team1Name),
    findRapidTeam(team2Name),
    getSupabaseTeam(team1Name),
    getSupabaseTeam(team2Name),
    getWcStandings()
  ]);

  const parts = [];
  const signals = [];

  for (const [name, rapidTeam, supaTeam] of [
    [team1Name, rapidTeam1, supaTeam1],
    [team2Name, rapidTeam2, supaTeam2],
  ]) {
    // Structured signals the deterministic baseline model reads
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

    if (!rapidTeam && !supaTeam) {
      parts.push(`\n## ${name}\n(No live API data — use your built-in knowledge)\n`);
      signals.push(signal);
      continue;
    }

    signal.hasData = true;

    // Fetch squad + recent matches + team statistics in parallel from API-Football
    const [rapidSquad, rapidStats, rapidTeamStats] = await Promise.all([
      rapidTeam ? getRapidSquad(rapidTeam.id) : [],
      rapidTeam ? getRapidRecentStats(rapidTeam.id) : [],
      rapidTeam ? getRapidTeamStatistics(rapidTeam.id) : null
    ]);

    let section = `\n## ${name}\n`;

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
    }

    // Recent results (API-Football)
    if (rapidStats && rapidStats.length > 0) {
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

    // API-Football team statistics (goals, clean sheets, form)
    if (rapidTeamStats) {
      const goals = rapidTeamStats.goals;
      const fixtures = rapidTeamStats.fixtures;
      const cleanSheets = rapidTeamStats.clean_sheet;

      if (goals?.for?.total?.total && goals?.against?.total?.total && fixtures?.played?.total) {
        const played = fixtures.played.total;
        const goalsFor = goals.for.total.total;
        const goalsAgainst = goals.against.total.total;
        const avgFor = goals.for.average?.total || (goalsFor / played).toFixed(1);
        const avgAgainst = goals.against.average?.total || (goalsAgainst / played).toFixed(1);
        const csTotal = cleanSheets?.total || 0;

        section += `\n### Season Statistics (API-Football)\n`;
        section += `**Played:** ${played} | **Goals For:** ${goalsFor} (avg ${avgFor}/game) | **Goals Against:** ${goalsAgainst} (avg ${avgAgainst}/game)\n`;
        section += `**Clean Sheets:** ${csTotal} | **Failed to Score:** ${rapidTeamStats.failed_to_score?.total || 0}\n`;

        if (fixtures.wins?.total != null) {
          section += `**Record:** ${fixtures.wins.total}W ${fixtures.draws?.total || 0}D ${fixtures.loses?.total || 0}L\n`;
        }
        if (rapidTeamStats.form) {
          section += `**Form String:** ${rapidTeamStats.form}\n`;
        }

        // Use these stats to enhance the signal's goals data if we don't have
        // enough from recent fixtures alone
        if (!signal.form || signal.form.played < 3) {
          signal.gf = goalsFor;
          signal.ga = goalsAgainst;
          if (fixtures.wins?.total != null) {
            signal.form = {
              w: fixtures.wins.total,
              d: fixtures.draws?.total || 0,
              l: fixtures.loses?.total || 0,
              played: played
            };
          }
        }
      }
    }

    // ── Actual World Cup form (highest priority) ──
    const wcRec = lookupWcRecord(wcStandings, name);
    if (wcRec && wcRec.gp > 0) {
      signal.form = { w: wcRec.w, d: wcRec.d, l: wcRec.l, played: wcRec.gp };
      signal.gf = wcRec.gf;
      signal.ga = wcRec.ga;
      signal.outcomes = [
        ...Array(wcRec.w).fill("W"),
        ...Array(wcRec.d).fill("D"),
        ...Array(wcRec.l).fill("L"),
      ];
      section += `\n**World Cup group form:** ${wcRec.w}W ${wcRec.d}D ${wcRec.l}L — GF ${wcRec.gf}, GA ${wcRec.ga}, GD ${wcRec.gd > 0 ? "+" : ""}${wcRec.gd}, ${wcRec.pts} pts\n`;
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
