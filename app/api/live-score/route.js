import { NextResponse } from 'next/server';

// ── ESPN public scoreboard API (keyless, unlimited, Vercel-friendly) ──
// We no longer query football-data.org here since it is 403-blocked by Vercel.
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

  try {
    const af = await findEspnMatch(team1, team2);
    if (af) {
      return NextResponse.json(af);
    }
    // If the API doesn't have this exact match yet, we return SCHEDULED so the UI gracefully falls back to the countdown
    return NextResponse.json({ status: 'SCHEDULED', notFound: true, source: 'espn' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
