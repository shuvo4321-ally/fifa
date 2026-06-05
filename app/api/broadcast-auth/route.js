import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  // Trim so a stray newline/space (common when importing a .env into Vercel)
  // doesn't cause a false "wrong password".
  const expected = (process.env.BROADCAST_PASSWORD || "").trim();
  if (!expected) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No broadcast password set. Add BROADCAST_PASSWORD in Vercel → Settings → Environment Variables (Production), then redeploy.",
      },
      { status: 503 }
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }

  const given = typeof body.password === "string" ? body.password.trim() : "";
  const ok = given.length > 0 && given === expected;
  return NextResponse.json(
    ok ? { ok: true } : { ok: false, error: "Wrong password." },
    { status: ok ? 200 : 401 }
  );
}
