// Cloudflare Worker: same-origin-style HLS proxy.
//
// This is a port of app/api/proxy/route.js to a Cloudflare Worker so the live-
// video bytes flow through Cloudflare's network (no egress billing, 300+ POPs)
// instead of your Vercel project's bandwidth quota.
//
// Deploy:
//   1. npm i -g wrangler        (or: npx wrangler ...)
//   2. wrangler login           (opens browser; approve in YOUR Cloudflare account)
//   3. wrangler deploy          (from this cloudflare/ folder)
//   4. Copy the printed URL, e.g. https://hls-proxy.<you>.workers.dev
//   5. In app/components/HlsPlayer.js, point proxify() at it:
//        const PROXY = "https://hls-proxy.<you>.workers.dev/?url=";
//        return PROXY + encodeURIComponent(u);
//
// Note: this proxy is now CROSS-ORIGIN to the page, so hls.js relies on the CORS
// headers below (already permissive). Functionally identical to the Vercel route.

// Allowed upstream registrable domains — seeded from the HLS channels so this
// can't be abused as a generic open relay. Add a domain here when you add an
// HLS channel on a new host.
const ALLOWED_DOMAINS = new Set([
  "streamhostingcdn.top",
  "akamaized.net",
  "tvri.go.id",
  "cinerama.uz",
]);

function regDomain(host) {
  const p = host.toLowerCase().split(".");
  if (p.length <= 2) return host.toLowerCase();
  const sld = ["co", "com", "net", "org", "gov", "go", "ac", "edu"];
  if (p[p.length - 1].length === 2 && sld.includes(p[p.length - 2])) return p.slice(-3).join(".");
  return p.slice(-2).join(".");
}

function isPrivateHost(host) {
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "0.0.0.0" || host === "::1" || host.startsWith("[")) return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  return false;
}

const hostAllowed = (host) => !isPrivateHost(host) && ALLOWED_DOMAINS.has(regDomain(host));

const PROXY_BASE = "/?url="; // requests come in as https://worker.dev/?url=<encoded>
const toProxy = (abs) => `${PROXY_BASE}${encodeURIComponent(abs)}`;
const resolveUrl = (u, base) => { try { return new URL(u, base).toString(); } catch { return u; } };

function rewriteManifest(text, base) {
  return text
    .split(/\r?\n/)
    .map((line) => {
      const t = line.trim();
      if (t === "") return line;
      if (t.startsWith("#")) {
        if (t.includes("URI=")) {
          return line.replace(/URI="([^"]+)"/g, (_m, u) => `URI="${toProxy(resolveUrl(u, base))}"`);
        }
        return line;
      }
      return toProxy(resolveUrl(t, base));
    })
    .join("\n");
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-expose-headers": "*",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...CORS, "access-control-allow-methods": "GET, OPTIONS" } });
    }

    const target = new URL(request.url).searchParams.get("url");
    if (!target) return new Response("Missing url", { status: 400 });

    let parsed;
    try { parsed = new URL(target); } catch { return new Response("Bad url", { status: 400 }); }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return new Response("Unsupported scheme", { status: 400 });
    if (!hostAllowed(parsed.hostname)) return new Response("Host not allowed", { status: 403 });

    const headers = {
      "user-agent": request.headers.get("user-agent") || "Mozilla/5.0",
      accept: "*/*",
      referer: parsed.origin + "/",
    };
    const range = request.headers.get("range");
    if (range) headers.range = range;

    let upstream;
    try {
      upstream = await fetch(target, { headers, redirect: "follow" });
    } catch {
      return new Response("Upstream fetch failed", { status: 502 });
    }

    const ct = (upstream.headers.get("content-type") || "").toLowerCase();
    const isManifest = ct.includes("mpegurl") || parsed.pathname.toLowerCase().endsWith(".m3u8");

    if (isManifest) {
      const text = await upstream.text();
      return new Response(rewriteManifest(text, upstream.url || target), {
        status: upstream.status,
        headers: { ...CORS, "content-type": "application/vnd.apple.mpegurl", "cache-control": "no-store" },
      });
    }

    const out = { ...CORS, "cache-control": "public, max-age=15" };
    for (const h of ["content-type", "content-length", "accept-ranges", "content-range", "etag", "last-modified"]) {
      const v = upstream.headers.get(h);
      if (v) out[h] = v;
    }
    if (!out["content-type"]) out["content-type"] = "application/octet-stream";

    return new Response(upstream.body, { status: upstream.status, headers: out });
  },
};
