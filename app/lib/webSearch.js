export async function fetchWebSearch(query) {
  // 1. Try Tavily first
  const tavilyKeysStr = process.env.TAVILY_API_KEY;
  if (tavilyKeysStr) {
    const tavilyKeys = tavilyKeysStr.split(",").map(k => k.trim()).filter(Boolean);
    let tavilyLastError = null;

    for (let i = 0; i < tavilyKeys.length; i++) {
      const key = tavilyKeys[i];
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
          next: { revalidate: 3600 }
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.results) {
            return data.results.map(r => r.content).join("\n");
          }
          return null; // Empty results but successful call
        }

        tavilyLastError = res.status;
        if (res.status === 429 || res.status === 401 || res.status === 403) {
          console.warn(`Tavily key ${i+1}/${tavilyKeys.length} failed (${res.status}). Trying next...`);
          continue;
        }
        break; // Stop Tavily loop on other fatal errors
      } catch (err) {
        console.warn(`Tavily network error on key ${i+1}/${tavilyKeys.length}:`, err.message);
        tavilyLastError = err.message;
      }
    }
    console.warn("All Tavily keys exhausted or failed. Last error:", tavilyLastError);
  }

  // 2. Fallback to Serper API
  console.log("Falling back to Serper API...");
  const serperKeysStr = process.env.SERPER_API_KEY;
  if (!serperKeysStr) {
    console.error("No SERPER_API_KEY found for fallback.");
    return null;
  }

  const serperKeys = serperKeysStr.split(",").map(k => k.trim()).filter(Boolean);
  let serperLastError = null;

  for (let i = 0; i < serperKeys.length; i++) {
    const key = serperKeys[i];
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": key,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ q: query }),
        next: { revalidate: 3600 }
      });

      if (res.ok) {
        const data = await res.json();
        // Extract top 3 organic snippets from Google search
        if (data && data.organic) {
          return data.organic.slice(0, 3).map(r => r.snippet).join("\n");
        }
        return null;
      }

      serperLastError = res.status;
      if (res.status === 429 || res.status === 403) {
         console.warn(`Serper key ${i+1}/${serperKeys.length} failed (${res.status}). Trying next...`);
         continue;
      }
      break;
    } catch (err) {
      console.warn(`Serper network error on key ${i+1}/${serperKeys.length}:`, err.message);
      serperLastError = err.message;
    }
  }

  console.error("All Serper API keys exhausted. Last error:", serperLastError);
  return null;
}
