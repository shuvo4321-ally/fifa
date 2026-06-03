import { NextResponse } from 'next/server';

// Simple in-memory cache to stay far below the 10 requests/minute limit
let cachedData = null;
let lastFetchTime = 0;
const CACHE_TTL = 60000; // 60 seconds

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const matchParam = searchParams.get('match');
  
  if (!matchParam || !matchParam.includes(' vs ')) {
    return NextResponse.json({ error: 'Invalid match format' }, { status: 400 });
  }

  let [team1, team2] = matchParam.split(' vs ');
  team1 = team1.trim();
  team2 = team2.trim();
  
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const now = Date.now();
    // Only fetch if cache is empty or expired
    if (!cachedData || now - lastFetchTime > CACHE_TTL) {
      const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
        headers: { 'X-Auth-Token': apiKey },
        // Use Next.js cache bypass for this specific internal fetch to let our custom TTL handle it
        cache: 'no-store'
      });
      
      if (res.ok) {
        cachedData = await res.json();
        lastFetchTime = now;
      } else if (cachedData) {
        // If API fails (e.g. rate limit), fallback to stale cache silently
      } else {
        throw new Error(`API Error: ${res.status}`);
      }
    }

    if (!cachedData || !cachedData.matches) {
       return NextResponse.json({ error: 'No data available' }, { status: 404 });
    }

    // Try to find the specific match.
    // We use a loose includes match because API names might differ slightly (e.g. "Korea Republic" vs "South Korea").
    const foundMatch = cachedData.matches.find(m => {
       const home = m.homeTeam?.name || '';
       const away = m.awayTeam?.name || '';
       
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
