import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
let keysStr = "";
envContent.split('\n').forEach(line => {
  if (line.startsWith('GEMINI_API_KEYS=')) {
    keysStr = line.replace('GEMINI_API_KEYS=', '').trim();
  }
});

const apiKeys = keysStr.split(",").map(k => k.trim()).filter(Boolean);

async function testKey(model, key) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: "Hello" }] }],
    })
  });
  const data = await res.json();
  console.log(`[${model}] Status: ${res.status}`);
  if (res.status !== 200) console.log(JSON.stringify(data));
}

async function run() {
  if (apiKeys.length === 0) return console.log("No keys found");
  const key = apiKeys[0];
  console.log("Testing with first key...");
  await testKey("gemini-1.5-flash", key);
  await testKey("gemini-3.5-flash", key);
}

run();
