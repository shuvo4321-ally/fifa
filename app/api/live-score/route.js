import { NextResponse } from 'next/server';

function generateMockData(team1, team2) {
  // Deterministic "random" based on team names to keep it consistent
  const seed = (team1.trim() + team2.trim()).length;
  const score1 = seed % 4;
  const score2 = (seed * 7) % 5;
  
  const statusList = ["Live - 34'", "Live - 78'", "Half Time", "Full Time"];
  const status = statusList[(seed * 2) % 4];

  const events = [];
  if (score1 > 0) {
    events.push({ time: "12'", team: team1, type: "goal", player: "Forward (9)" });
  }
  if (score2 > 0) {
    events.push({ time: "28'", team: team2, type: "goal", player: "Winger (11)" });
  }
  if (score1 > 1) {
    events.push({ time: "67'", team: team1, type: "goal", player: "Midfielder (10)" });
  }
  if (score2 > 1) {
    events.push({ time: "89'", team: team2, type: "goal", player: "Sub (21)" });
  }
  if (score1 > 2) {
    events.push({ time: "90+2'", team: team1, type: "goal", player: "Defender (4)" });
  }

  // Sort events by time loosely
  events.sort((a, b) => parseInt(a.time) - parseInt(b.time));

  return {
    score: {
      team1: score1,
      team2: score2
    },
    status,
    events,
    stats: {
      possession: { team1: 45 + (seed % 15), team2: 55 - (seed % 15) },
      shotsOnTarget: { team1: score1 + (seed % 4), team2: score2 + (seed % 3) },
      yellowCards: { team1: seed % 3, team2: (seed * 2) % 3 },
      corners: { team1: 3 + (seed % 5), team2: 2 + (seed % 4) }
    }
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const match = searchParams.get('match');
  
  if (!match || !match.includes(' vs ')) {
    return NextResponse.json({ error: 'Invalid match format' }, { status: 400 });
  }

  const [team1, team2] = match.split(' vs ');
  
  // Add a slight delay to simulate network request latency
  await new Promise(resolve => setTimeout(resolve, 800));

  const data = generateMockData(team1, team2);
  
  return NextResponse.json(data);
}
