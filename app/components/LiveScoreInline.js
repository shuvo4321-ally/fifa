"use client";

import { useLiveScore } from "../lib/liveScores";

export default function LiveScoreInline({ matchStr }) {
  const valid = typeof matchStr === "string" && matchStr.includes(" vs ");
  const [t1, t2] = valid ? matchStr.split(" vs ").map((s) => s.trim()) : ["", ""];
  // Reads from the shared /api/scores snapshot — no per-fixture network call.
  const live = useLiveScore(t1, t2);

  if (!valid) return null;

  const hasScore = live && live.s1 != null && live.s2 != null;
  if (!hasScore) {
    return <span className="fixture-vs">VS</span>;
  }

  return (
    <span
      className="fixture-vs"
      style={{ color: "white", fontSize: "18px", fontWeight: 900 }}
    >
      {live.s1} - {live.s2}
    </span>
  );
}
