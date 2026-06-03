// iOS-safe kickoff parsing. Safari can't parse `new Date("Jun 12, 2026 01:00 AM")`,
// so we build the Date from parts instead.
const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

export function parseKickoff(dateStr, timeStr) {
  const d = /([A-Za-z]{3,})\s+(\d{1,2}),\s*(\d{4})/.exec(dateStr || "");
  if (!d) return null;
  const month = MONTHS[d[1].slice(0, 3).toLowerCase()];
  if (month === undefined) return null;

  let hour = 12;
  let min = 0;
  const t = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(timeStr || "");
  if (t) {
    hour = parseInt(t[1], 10) % 12;
    if (/pm/i.test(t[3])) hour += 12;
    min = parseInt(t[2], 10);
  }
  return new Date(parseInt(d[3], 10), month, parseInt(d[2], 10), hour, min, 0);
}

export const FULL_TIME_MIN = 135; // ~match length incl. half-time + stoppage

// "upcoming" | "live" | "finished"
export function matchStatus(dateStr, timeStr, now = Date.now()) {
  const kickoff = parseKickoff(dateStr, timeStr);
  if (!kickoff) return { state: "upcoming", kickoff: null, elapsedMin: 0 };
  const elapsedMin = Math.floor((now - kickoff.getTime()) / 60000);
  if (elapsedMin < 0) return { state: "upcoming", kickoff, elapsedMin };
  if (elapsedMin >= FULL_TIME_MIN) return { state: "finished", kickoff, elapsedMin };
  return { state: "live", kickoff, elapsedMin };
}
