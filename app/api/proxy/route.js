import { TV_CHANNELS } from "../../data/tvChannels";

// ─────────────────────────────────────────────────────────────────────────────
// Same-origin HLS proxy (Node.js runtime).
//
// Why this exists: loading an .m3u8 straight from a far-off IPTV CDN means the
// browser pays a fresh DNS + TLS handshake per channel, fights missing CORS
// headers, and can be geo-blocked or mixed-content-blocked on our HTTPS deploy.
// Routing the manifest + every segment through THIS origin reuses the page's
// already-warm HTTP/2 connection, kills CORS, and upgrades HTTP→HTTPS — which is
// what makes the player start fast (the trick tv.shajon.dev uses).
//
// Runtime note: kept on the default Node.js runtime. The Edge runtime failed to
// deploy on Vercel for this route; Node serverless delivers the same proxy
// behaviour (only a marginally higher cold start). To move the bytes off Vercel's
// bandwidth quota, deploy the Cloudflare Worker in /cloudflare instead.
//
// Only plain HLS is proxied. DASH/ClearKey channels are left untouched.
// ─────────────────────────────────────────────────────────────────────────────

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROXY_PATH = "/api/proxy";

// ── Host allowlist ──────────────────────────────────────────────────────────
// Seeded from the channel list so this can't be abused as a generic open relay.
// We allow the registrable domain (so a stream's segment subdomains resolve too).
function regDomain(host) {
  const p = host.toLowerCase().split(".");
  if (p.length <= 2) return host.toLowerCase();
  const sld = ["co", "com", "net", "org", "gov", "go", "ac", "edu"];
  // e.g. "ott-balancer.tvri.go.id" → keep "tvri.go.id"
  if (p[p.length - 1].length === 2 && sld.includes(p[p.length - 2])) return p.slice(-3).join(".");
  return p.slice(-2).join(".");
}

const ALLOWED_DOMAINS = new Set();
for (const c of TV_CHANNELS) {
  // DASH stays direct; only seed HLS hosts.
  const isHls = c?.type === "hls" || (c?.url || "").toLowerCase().includes(".m3u8");
  if (!isHls || !c.url) continue;
  try { ALLOWED_DOMAINS.add(regDomain(new URL(c.url).hostname)); } catch {}
}

function isPrivateHost(host) {
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "0.0.0.0" || host === "::1" || host.startsWith("[")) return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  return false;
}

function hostAllowed(host) {
  return !isPrivateHost(host) && ALLOWED_DOMAINS.has(regDomain(host));
}

// ── Manifest rewriting ──────────────────────────────────────────────────────
const toProxy = (abs) => `${PROXY_PATH}?url=${encodeURIComponent(abs)}`;
const resolve = (u, base) => { try { return new URL(u, base).toString(); } catch { return u; } };

// Rewrite every URL in an .m3u8 to point back through this proxy, resolving any
// relative paths against the manifest's (post-redirect) URL first.
function rewriteManifest(text, base) {
  return text
    .split(/\r?\n/)
    .map((line) => {
      const t = line.trim();
      if (t === "") return line;
      if (t.startsWith("#")) {
        // KEY / MAP / MEDIA / I-FRAME-STREAM-INF carry a URI="..." attribute.
        if (t.includes("URI=")) {
          return line.replace(/URI="([^"]+)"/g, (_m, u) => `URI="${toProxy(resolve(u, base))}"`);
        }
        return line;
      }
      // A bare line is a segment or a variant-playlist URL.
      return toProxy(resolve(t, base));
    })
    .join("\n");
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-expose-headers": "*",
};

export async function GET(request) {
  const target = new URL(request.url).searchParams.get("url");
  if (!target) return new Response("Missing url", { status: 400 });

  let parsed;
  try { parsed = new URL(target); } catch { return new Response("Bad url", { status: 400 }); }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return new Response("Unsupported scheme", { status: 400 });
  }
  if (!hostAllowed(parsed.hostname)) {
    return new Response("Host not allowed", { status: 403 });
  }

  // Forward Range so byte-range (fMP4) segments work; spoof referer/UA because
  // some CDNs gate on them.
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

  // Stream segments / keys straight through, preserving range/caching headers.
  const out = { ...CORS, "cache-control": "public, max-age=15" };
  for (const h of ["content-type", "content-length", "accept-ranges", "content-range", "etag", "last-modified"]) {
    const v = upstream.headers.get(h);
    if (v) out[h] = v;
  }
  if (!out["content-type"]) out["content-type"] = "application/octet-stream";

  return new Response(upstream.body, { status: upstream.status, headers: out });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { ...CORS, "access-control-allow-methods": "GET, OPTIONS" },
  });
}
