import { buildMatchContext } from './app/lib/footballData.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  try {
    console.log("Fetching context...");
    const ctx = await buildMatchContext('Mexico', 'Korea Republic');
    console.log("Context length:", ctx.length);
    console.log("Context preview:\n", ctx);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
