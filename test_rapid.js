import { findRapidTeam, getRapidRecentStats } from './app/lib/apiFootball.js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

async function run() {
  const team = await findRapidTeam("South Africa");
  console.log(team);
  if (team) {
    const stats = await getRapidRecentStats(team.id);
    console.log(JSON.stringify(stats, null, 2));
  }
}
run();
