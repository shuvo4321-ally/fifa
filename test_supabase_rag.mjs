import { buildMatchContext } from './app/lib/footballData.js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

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
