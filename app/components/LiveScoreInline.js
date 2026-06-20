"use client";

import { useLiveScore } from "../lib/liveScores";

export default function LiveScoreInline({ matchStr }) {
  const valid = typeof matchStr === "string" && matchStr.includes(" vs ");
  const [t1, t2] = valid ? matchStr.split(" vs ").map((s) => s.trim()) : ["", ""];
  // Reads from the shared /api/scores snapshot — no per-fixture network call.
  const live = useLiveScore(t1, t2);

  if (!valid) return null;

  // Inline score ONLY while a match is actually live. ESPN reports 0-0 for
  // not-yet-started (TIMED) matches, so checking the score alone made every
  // upcoming fixture show "0-0". A finished result isn't shown inline either —
  // it lives in the group table and the scorecard — so the schedule stays clean.
  const isLive = live && (live.status === "IN_PLAY" || live.status === "PAUSED");
  const hasScore = isLive && live.s1 != null && live.s2 != null;
  if (!hasScore) {
    return <span className="fixture-vs">VS</span>;
  }

  return (
    <span
      className="fixture-vs"
      style={{ color: "#ff5252", fontSize: "18px", fontWeight: 900 }}
    >
      {live.s1} - {live.s2}
    </span>
  );
}
