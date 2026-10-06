// Parse an extended M3U playlist into the same channel shape as TV_CHANNELS.
// Directive lines (#EXTINF / #EXTVLCOPT / #KODIPROP) accumulate until the next
// URL line, which closes the entry.

const attr = (line, key) => {
  const m = line.match(new RegExp(`${key}="([^"]*)"`, "i"));
  return m ? m[1].trim() : "";
};

function streamType(url) {
  const path = url.split("?")[0].toLowerCase();
  if (path.endsWith(".mpd")) return "dash";
  if (path.endsWith(".m3u8")) return "hls";
  return "native"; // plain audio/video (e.g. radio) — played by the <video> element directly
}

export function parseM3U(text) {
  const channels = [];
  const seen = new Set();
  let cur = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#EXTINF")) {
      const comma = line.lastIndexOf(",");
      cur.name = (comma >= 0 ? line.slice(comma + 1) : "").trim() || attr(line, "tvg-name");
      cur.logo = attr(line, "tvg-logo");
      cur.group = attr(line, "group-title") || "Other";
    } else if (line.startsWith("#EXTVLCOPT:")) {
      const [k, ...v] = line.slice(11).split("=");
      const val = v.join("=").trim();
      if (/http-user-agent/i.test(k)) cur.userAgent = val;
      if (/http-referr?er/i.test(k)) cur.referer = val;
      if (/http-origin/i.test(k)) cur.origin = val;
    } else if (line.startsWith("#KODIPROP:")) {
      const m = line.match(/license_key=([0-9a-f]{32}):([0-9a-f]{32})/i);
      if (m) { cur.kid = m[1]; cur.key = m[2]; }
    } else if (!line.startsWith("#")) {
      // http:// streams are blocked as mixed content on the HTTPS deploy.
      const id = `${cur.name}|${line}`;
      if (cur.name && /^https:\/\//i.test(line) && !seen.has(id)) {
        seen.add(id); // the playlist lists some channels twice
        channels.push({ ...cur, url: line, type: streamType(line), no_proxy: false });
      }
      cur = {};
    }
  }
  return channels;
}
