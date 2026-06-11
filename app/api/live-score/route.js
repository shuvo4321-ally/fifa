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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const matchParam = searchParams.get('match');

  if (!matchParam || !matchParam.includes(' vs ')) {
    return NextResponse.json({ error: 'Invalid match format' }, { status: 400 });
  }

  let [team1, team2] = matchParam.split(' vs ');
  team1 = team1.trim();
  team2 = team2.trim();

  const keysStr = process.env.FOOTBALL_DATA_SCHEDULE_KEY || process.env.FOOTBALL_DATA_API_KEY;
  if (!keysStr) {
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
       return NextResponse.json(foundMatch);
    } else {
       // If the API doesn't have this exact match yet, we return SCHEDULED so the UI gracefully falls back to the countdown
       return NextResponse.json({ status: 'SCHEDULED', notFound: true });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
