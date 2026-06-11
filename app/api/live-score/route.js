import { NextResponse } from 'next/server';

// In-memory cache (60s) instead of Next's Data Cache: on Vercel the Data Cache
// kept serving a ~20h-old pre-kickoff snapshot when background revalidation was
// rate-limited, so live matches stayed "TIMED" forever. This stays fresh, keeps
// us under football-data's 10 req/min, and falls back to the last good snapshot
// if the upstream call fails.
let cachedData = null;
let lastFetchTime = 0;
const CACHE_TTL = 60000; // 60 seconds

// Newest lastUpdated across all matches — football-data's replicas flap
// between fresh and hours-old snapshots under load, so we only ever move
// forward in time and never overwrite newer data with an older snapshot.
function freshness(data) {
  let max = 0;
  for (const m of data?.matches || []) {
    const t = Date.parse(m.lastUpdated || "") || 0;
    if (t > max) max = t;
  }
  return max;
}

async function getWcMatches(apiKeys) {
  const now = Date.now();
  if (cachedData && now - lastFetchTime < CACHE_TTL) return cachedData;

  let lastErrorStatus = null;
  for (let i = 0; i < apiKeys.length; i++) {
    const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: { 'X-Auth-Token': apiKeys[i] },
      cache: 'no-store',
    });

    if (res.ok) {
      const fresh = await res.json();
      if (!cachedData || freshness(fresh) >= freshness(cachedData)) {
        cachedData = fresh;
        lastFetchTime = now;
        return cachedData;
      }
      // Stale replica — try the next key, a new request may hit a fresh one.
      continue;
    }

    lastErrorStatus = res.status;
    // If rate limited or quota-blocked, try the next key
    if (res.status === 429 || res.status === 403) {
      continue;
    }
    break; // Stop looping on fatal error
  }

  // All keys failed or returned stale snapshots — serve the newest we have.
  if (cachedData) {
    lastFetchTime = now; // don't hammer the API again for another TTL window
    return cachedData;
  }
  throw new Error(`API Error. Last status: ${lastErrorStatus}`);
}

// ── ESPN public scoreboard fallback ──
// football-data.org 403-blocks requests from Vercel's server IPs (works from a
// home PC, fails from the deploy). ESPN's scoreboard JSON is keyless, has no
// quota, and allows datacenter traffic — used whenever football-data is
// unreachable or claims a match hasn't started after its kickoff time.
let espnCache = null;
let espnFetchTime = 0;
const ESPN_TTL = 30000; // 30 seconds

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

// Fixture name (normalized) → ESPN names that don't substring-match it.
const TEAM_ALIASES = {
  "korea republic": ["south korea"],
  "usa": ["united states"],
  "turkiye": ["turkey"],
  "ivory coast": ["cote divoire", "cote d ivoire"],
};

function teamMatches(espnName, fixtureName) {
  const e = normTeam(espnName);
  const f = normTeam(fixtureName);
  if (!e || !f) return false;
  if (e.includes(f) || f.includes(e)) return true;
  return (TEAM_ALIASES[f] || []).some((alias) => e.includes(alias) || alias.includes(e));
}

async function getEspnScoreboard() {
  const now = Date.now();
  if (espnCache && now - espnFetchTime < ESPN_TTL) return espnCache;
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard",
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      espnCache = data?.events || [];
      espnFetchTime = now;
    }
  } catch {
    // keep the last snapshot
  }
  return espnCache;
}

async function findEspnMatch(team1, team2) {
  const events = await getEspnScoreboard();
  if (!events) return null;

  for (const e of events) {
    const comp = e?.competitions?.[0];
    const home = comp?.competitors?.find((c) => c.homeAway === "home");
    const away = comp?.competitors?.find((c) => c.homeAway === "away");
    if (!home || !away) continue;
    const hName = home.team?.displayName || "";
    const aName = away.team?.displayName || "";

    const fwd = teamMatches(hName, team1) && teamMatches(aName, team2);
    const rev = !fwd && teamMatches(hName, team2) && teamMatches(aName, team1);
    if (!fwd && !rev) continue;

    const st = comp?.status?.type || e?.status?.type || {};
    let status = "TIMED";
    if (st.state === "in") {
      const atHalftime =
        /^half\s*-?\s*time$/i.test((st.description || "").trim()) ||
        (st.shortDetail || "").trim().toUpperCase() === "HT";
      status = atHalftime ? "PAUSED" : "IN_PLAY";
    } else if (st.state === "post") status = "FINISHED";

    // Orient home/away to the requested fixture (team1 = home side of the card).
    const hScore = Number(home.score ?? 0);
    const aScore = Number(away.score ?? 0);
    return {
      status,
      minute: st.shortDetail || null,
      homeTeam: { name: fwd ? hName : aName },
      awayTeam: { name: fwd ? aName : hName },
      score: {
        fullTime: { home: fwd ? hScore : aScore, away: fwd ? aScore : hScore },
        halfTime: { home: null, away: null },
      },
      source: "espn",
    };
  }
  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const matchParam = searchParams.get('match');

  if (!matchParam || !matchParam.includes(' vs ')) {
    return NextResponse.json({ error: 'Invalid match format' }, { status: 400 });
  }

  let [team1, team2] = matchParam.split(' vs ');
  team1 = team1.trim();
  team2 = team2.trim();

  // Debug/testing: ?source=espn skips football-data and serves the fallback.
  if (searchParams.get('source') === 'espn') {
    const af = await findEspnMatch(team1, team2);
    if (af) return NextResponse.json(af);
    return NextResponse.json({ status: 'SCHEDULED', notFound: true, source: 'espn' });
  }

  const keysStr = process.env.FOOTBALL_DATA_SCHEDULE_KEY || process.env.FOOTBALL_DATA_API_KEY;
  if (!keysStr) {
    const af = await findEspnMatch(team1, team2);
    if (af) return NextResponse.json(af);
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }
  const apiKeys = keysStr.split(",").map(k => k.trim()).filter(Boolean);

  try {
    const apiData = await getWcMatches(apiKeys);

    if (!apiData || !apiData.matches) {
       return NextResponse.json({ error: 'No data available' }, { status: 404 });
    }

    // Try to find the specific match.
    // We use a loose includes match because API names might differ slightly (e.g. "Korea Republic" vs "South Korea").
    const foundMatch = apiData.matches.find(m => {
       const home = m.homeTeam?.name || '';
       const away = m.awayTeam?.name || '';

       if (!home || !away) return false;

       const matchForward = (home.includes(team1) || team1.includes(home)) && (away.includes(team2) || team2.includes(away));
       const matchReverse = (home.includes(team2) || team2.includes(home)) && (away.includes(team1) || team1.includes(away));

       return matchForward || matchReverse;
    });

    if (foundMatch) {
       // Stale-replica cross-check: kickoff has passed but football-data still
       // says not-started — see if ESPN knows the match is actually underway.
       const kickedOff = foundMatch.utcDate && Date.parse(foundMatch.utcDate) <= Date.now();
       const notStarted = foundMatch.status === 'TIMED' || foundMatch.status === 'SCHEDULED';
       if (kickedOff && notStarted) {
         const af = await findEspnMatch(team1, team2);
         if (af && af.status !== 'TIMED') return NextResponse.json(af);
       }
       return NextResponse.json(foundMatch);
    } else {
       // If the API doesn't have this exact match yet, we return SCHEDULED so the UI gracefully falls back to the countdown
       return NextResponse.json({ status: 'SCHEDULED', notFound: true });
    }
  } catch (error) {
    // football-data unreachable from this server (it 403-blocks Vercel/datacenter
    // IPs) — serve the ESPN scoreboard instead of failing.
    const af = await findEspnMatch(team1, team2);
    if (af) return NextResponse.json(af);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
