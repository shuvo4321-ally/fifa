"use client";

import Link from "next/link";
import { useLiveScore } from "../lib/liveScores";

export default function HeroMatchRow({ m }) {
  // Shared snapshot — no per-row fetch (every row + the calendar share one poll).
  const live = useLiveScore(m.team1, m.team2);
  const isLive = live && (live.status === "IN_PLAY" || live.status === "PAUSED");
  const isFinished = live && live.status === "FINISHED";
  const hasScore = live && live.s1 != null && live.s2 != null;

  let middle;
  if (isLive && hasScore) {
    middle = (
      <span className="hero-today-live">
        <span className="hero-live-dot" />
        {live.s1}-{live.s2}
      </span>
    );
  } else if (isFinished && hasScore) {
    middle = <span className="hero-today-ft">{live.s1}-{live.s2} · FT</span>;
  } else if (m.over) {
    middle = <span className="hero-today-time">FT</span>;
  } else {
    middle = <span className="hero-today-time">{m.time}</span>;
  }

  // Don't dim a finished match when we actually have its score to show.
  const dim = m.over && !isLive && !(isFinished && hasScore);

  return (
    <Link href={m.href || "/calendar"} className={`hero-today-row${dim ? " is-over" : ""}`}>
      <span className="hero-today-side">
        {m.flag1 && <img src={m.flag1} alt="" className="hero-today-flag" />}
        <span className="hero-today-name">{m.team1}</span>
      </span>
      {middle}
      <span className="hero-today-side hero-today-side--right">
        <span className="hero-today-name">{m.team2}</span>
        {m.flag2 && <img src={m.flag2} alt="" className="hero-today-flag" />}
      </span>
    </Link>
  );
}
