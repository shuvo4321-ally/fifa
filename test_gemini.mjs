import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) process.env[key.trim()] = valueParts.join('=').trim();
});

import { buildMatchContext } from './app/lib/footballData.js';

async function run() {
  const context = await buildMatchContext('Mexico', 'Korea Republic');
  
  const systemInstruction = `You are an elite, data-driven FIFA World Cup analyst.
You have encyclopedic knowledge of World Cup history and are specifically briefed on the FIFA World Cup 2026:

CRITICAL RULES FOR PREDICTIONS:
1. STRICT DATA ADHERENCE: You MUST anchor your prediction mathematically to the "Form" (Wins/Draws/Losses) and "Recent Results" provided in the LIVE RAG DATA. If one team has significantly more recent wins, they MUST be favored heavily.
2. SQUAD & EA FC 26 METRICS: You now have access to highly detailed EA FC 26 metrics (Overall, Attack, Midfield, Defense, Goalkeeper stats) and player overalls (OVR). Use these ratings to evaluate head-to-head positional matchups, star player impact, and overall squad strength. A much higher squad rating (e.g., 85 vs 75) should strongly influence the prediction.
3. BREAKING NEWS CONTEXT: Treat "LATEST BREAKING NEWS" as a modifier, NOT the foundation. A single injury or weather event should slightly adjust probabilities, but it should NEVER overturn a massive mathematical advantage in recent form.
4. FORMAT: Win/Draw/Loss probabilities MUST add up to 100%. Always give a predicted score (e.g. "2-1").
5. Use markdown formatting: use **bold**, headers (##), and bullet points.`;

  const userPrompt = `Predict this FIFA World Cup 2026 match: Mexico vs Korea Republic

Here is the LIVE RAG Data for both teams (Current Squad, Coach, Ages, and Recent Matches Form):
${context}

Give me:
## Prediction
Win/Draw/Loss percentages and predicted score. Base this heavily on the recent form and current squad provided in the Live RAG Data above.

## Key Factors
What decides this match (tactics, players, conditions)

## Head-to-Head History
Past World Cup meetings between these teams

## Verdict
Your final bold take as a pundit`;

  const keysEnv = process.env.GEMINI_API_KEYS;
  const apiKeys = keysEnv.split(",").map(k => k.trim()).filter(Boolean);
  const MODEL = "gemini-3.5-flash"; // WAIT: IS GEMINI-3.5-FLASH A REAL MODEL?
  const apiKey = apiKeys[0];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  console.log("Sending to Gemini...");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  });
  
  if (!res.ok) {
    console.error("HTTP Error:", res.status);
    console.error(await res.text());
  } else {
    const data = await res.json();
    console.log("Data received:", JSON.stringify(data).substring(0, 500));
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) console.error("No text returned! Full response:", JSON.stringify(data, null, 2));
    else console.log("Success! Output length:", text.length);
  }
}

run();
