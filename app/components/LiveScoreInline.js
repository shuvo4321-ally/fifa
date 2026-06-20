"use client";

import { useLiveScore } from "../lib/liveScores";

export default function LiveScoreInline({ matchStr }) {
  const valid = typeof matchStr === "string" && matchStr.includes(" vs ");
  const [t1, t2] = valid ? matchStr.split(" vs ").map((s) => s.trim()) : ["", ""];
  // Reads from the shared /api/scores snapshot — no per-fixture network call.
  const live = useLiveScore(t1, t2);

  if (!valid) return null;

  // Show the score for FINISHED and LIVE matches; show "VS" only for upcoming.
  // ESPN reports 0-0 for not-yet-started (TIMED) matches, so we must gate on the
  // status — otherwise every upcoming fixture would display a phantom "0-0".
  const isLive = live && (live.status === "IN_PLAY" || live.status === "PAUSED");
  const isFinished = live && live.status === "FINISHED";
  const hasScore = (isLive || isFinished) && live.s1 != null && live.s2 != null;
  if (!hasScore) {
    return <span className="fixture-vs">VS</span>;
  }

  return (
    <span
      className="fixture-vs"
      style={{ color: isLive ? "#ff5252" : "white", fontSize: "18px", fontWeight: 900 }}
      title={isLive ? "Live" : "Full time"}
    >
      {live.s1} - {live.s2}
    </span>
  );
}
