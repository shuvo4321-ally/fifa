import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const expected = process.env.BROADCAST_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "No broadcast password set. Add BROADCAST_PASSWORD to .env.local." },
      { status: 503 }
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }

  const ok = typeof body.password === "string" && body.password === expected;
  return NextResponse.json(
    ok ? { ok: true } : { ok: false, error: "Wrong password." },
    { status: ok ? 200 : 401 }
  );
}
