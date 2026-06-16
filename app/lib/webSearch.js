async function tryTavily(query) {
  const keysStr = process.env.TAVILY_API_KEY;
  if (!keysStr) return null;
  const keys = keysStr.split(",").map(k => k.trim()).filter(Boolean);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: key,
          query: query,
          search_depth: "basic",
          include_answer: false,
          max_results: 3
        }),
        signal: AbortSignal.timeout(2500)
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.results && data.results.length > 0) {
          const content = data.results.map(r => r.content).filter(Boolean).join("\n");
          if (content.trim()) return content;
        }
      } else {
        console.warn(`Tavily key ${i+1}/${keys.length} returned status ${res.status}`);
      }
    } catch (err) {
      console.warn(`Tavily error on key ${i+1}/${keys.length}:`, err.message);
    }
  }
  return null;
}

async function trySerper(query) {
  const keysStr = process.env.SERPER_API_KEY;
  if (!keysStr) return null;
  const keys = keysStr.split(",").map(k => k.trim()).filter(Boolean);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": key,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ q: query }),
        signal: AbortSignal.timeout(2500)
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.organic && data.organic.length > 0) {
          const content = data.organic.slice(0, 3).map(r => r.snippet).filter(Boolean).join("\n");
          if (content.trim()) return content;
        }
      } else {
        console.warn(`Serper key ${i+1}/${keys.length} returned status ${res.status}`);
      }
    } catch (err) {
      console.warn(`Serper error on key ${i+1}/${keys.length}:`, err.message);
    }
  }
  return null;
}

export async function fetchWebSearch(query) {
  // Try Tavily first
  let results = await tryTavily(query);
  if (results && results.trim()) {
    return results;
  }

  // If Tavily is exhausted, empty, or fails, fallback to Serper
  console.log(`Tavily exhausted or returned no results for query: "${query}". Trying Serper...`);
  results = await trySerper(query);
  if (results && results.trim()) {
    return results;
  }

  return null;
}
