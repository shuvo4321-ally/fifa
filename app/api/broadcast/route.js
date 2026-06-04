// Single-stream lock for the fan broadcast.
//
// NOTE: this state lives in ONE server process (module memory). That's perfect
// for the single dev server this project runs on. If this were ever deployed to
// a serverless/multi-instance host, swap this for Redis / Upstash / a KV store.

let lock = { liveSlug: null, token: null, updatedAt: 0 };
const STALE_MS = 20000; // a broadcaster that stops sending heartbeats frees up after this

function current() {
  if (lock.token && Date.now() - lock.updatedAt > STALE_MS) {
    lock = { liveSlug: null, token: null, updatedAt: 0 };
  }
  return lock;
}

export async function GET() {
  const l = current();
  return Response.json({ liveSlug: l.liveSlug });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }

  const { action, slug, token } = body || {};
  if (!token) return Response.json({ error: "missing token" }, { status: 400 });

  const l = current();

  if (action === "start") {
    // Acquire only if the channel is free or already held by us.
    if (l.token && l.token !== token) {
      return Response.json({ ok: false, liveSlug: l.liveSlug }, { status: 409 });
    }
    lock = { liveSlug: slug || null, token, updatedAt: Date.now() };
    return Response.json({ ok: true, liveSlug: lock.liveSlug });
  }

  if (action === "beat") {
    if (l.token !== token) {
      return Response.json({ ok: false, liveSlug: l.liveSlug }, { status: 409 });
    }
    lock.updatedAt = Date.now();
    return Response.json({ ok: true, liveSlug: lock.liveSlug });
  }

  if (action === "stop") {
    if (l.token === token) {
      lock = { liveSlug: null, token: null, updatedAt: 0 };
    }
    return Response.json({ ok: true, liveSlug: null });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}

export const dynamic = "force-dynamic";
