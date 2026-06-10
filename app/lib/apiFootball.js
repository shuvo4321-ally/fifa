/**
 * API-Football (v3.football.api-sports.io) client with in-memory caching.
 * Provides deep stats, lineups, and specific player details on the free tier.
 */

const API_BASE = "https://v3.football.api-sports.io";

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

async function fetchRapidApi(endpoint) {
  const keysStr = process.env.API_FOOTBALL_KEY;
  if (!keysStr) return null;
  const apiKeys = keysStr.split(",").map(k => k.trim()).filter(Boolean);

  const cached = getCached(endpoint);
  if (cached) return cached;

  let lastError = null;

  for (let i = 0; i < apiKeys.length; i++) {
    const key = apiKeys[i];
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          "x-apisports-key": key,
        },
        next: { revalidate: 3600 },
      });
      
      if (!res.ok) {
        console.warn(`API-Football ${res.status} for ${endpoint} using key ${i+1}/${apiKeys.length}`);
        lastError = res.status;
        // 429 Too Many Requests, 403 Forbidden (Quota reached)
        if (res.status === 429 || res.status === 403) {
          continue;
        }
        return null;
      }
      
      const data = await res.json();
      
      // API-Football sometimes returns 200 OK but includes errors in the body when quota is reached
      if (data.errors && data.errors.requests) {
        console.warn(`API-Football quota reached for key ${i+1}/${apiKeys.length}`);
        lastError = "Quota Reached";
        continue;
      }

      setCache(endpoint, data);
      return data;
    } catch (err) {
      console.warn(`API-Football fetch failed with key ${i+1}/${apiKeys.length}:`, err.message);
      lastError = err.message;
    }
  }

  console.error("All API-Football keys exhausted. Last error:", lastError);
  return null;
}

// ── Helpers ──

// Fuzzy match a team name against the API result
function matchTeam(apiTeams, name) {
  if (!apiTeams?.length) return null;
  const n = name.toLowerCase().trim();
  return (
    apiTeams.find((t) => t.team.name?.toLowerCase() === n) ||
    apiTeams.find((t) => t.team.name?.toLowerCase().includes(n)) ||
    null
  );
}

// ── Public API ──

export async function findRapidTeam(teamName) {
  const search = await fetchRapidApi(`/teams?search=${encodeURIComponent(teamName)}`);
  if (search?.response?.length) {
    const found = matchTeam(search.response, teamName) || search.response[0];
    return found.team;
  }
  return null;
}

export async function getRapidSquad(teamId) {
  const data = await fetchRapidApi(`/players/squads?team=${teamId}`);
  if (data?.response?.length) {
    return data.response[0].players;
  }
  return [];
}

export async function getRapidRecentStats(teamId, season = 2026) {
  // Try to fetch last 5 fixtures
  const data = await fetchRapidApi(`/fixtures?team=${teamId}&last=5`);
  return data?.response || [];
}
