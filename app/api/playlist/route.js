import { parseM3U } from "../../lib/m3u";

// The upstream playlist is regenerated several times a day (its stream tokens
// expire), so it's fetched live and cached for 10 minutes instead of committed.
const PLAYLIST_URL = "https://raw.githubusercontent.com/abusaeeidx/Mrgify-BDIX-IPTV/main/playlist.m3u";

export const revalidate = 600;

export async function GET() {
  try {
    const res = await fetch(PLAYLIST_URL, { next: { revalidate } });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const channels = parseM3U(await res.text());
    return Response.json({ channels });
  } catch (err) {
    return Response.json({ channels: [], error: String(err?.message || err) }, { status: 502 });
  }
}
