"use client";

import { useEffect, useRef } from "react";
import HeroMatchRow from "./HeroMatchRow";

/**
 * The hero's fixtures list. It caps itself to ~4 rows and quietly auto-rotates
 * through the rest, so on a full 6-match day every game cycles into view — with
 * NO visible scrollbar. The user can still scroll it by hand, which pauses the
 * rotation for a few seconds.
 */
const VISIBLE_ROWS = 4;
const PEEK = 14; // show a sliver of the next row so it reads as "there's more"

export default function HeroTodayList({ rows }) {
  const scrollRef = useRef(null);
  const pauseUntil = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Cap the height to ~VISIBLE_ROWS, measured from the real rows (their height
    // differs desktop vs mobile), so anything beyond that has to rotate in.
    const fit = () => {
      const items = [...el.children];
      el.style.maxHeight =
        items.length > VISIBLE_ROWS ? `${items[VISIBLE_ROWS].offsetTop + PEEK}px` : "";
    };
    fit();
    el.scrollTop = 0;

    const overflows = () => el.scrollHeight - el.clientHeight > 8;
    const step = () => {
      if (Date.now() < pauseUntil.current || !overflows()) return;
      // Reached the bottom → loop back to the top.
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 6) {
        el.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      // Otherwise advance so the next row aligns to the top.
      const next = [...el.children].find((r) => r.offsetTop > el.scrollTop + 6);
      el.scrollTo({ top: next ? next.offsetTop : 0, behavior: "smooth" });
    };

    const id = setInterval(step, 3000);
    window.addEventListener("resize", fit);
    return () => {
      clearInterval(id);
      window.removeEventListener("resize", fit);
    };
  }, [rows.length]);

  // Any manual scroll / touch pauses the auto-rotate briefly.
  const pause = () => { pauseUntil.current = Date.now() + 6000; };

  return (
    <div
      className="hero-today-scroll"
      ref={scrollRef}
      onPointerDown={pause}
      onWheel={pause}
      onTouchStart={pause}
    >
      {rows.map((m, i) => (
        <HeroMatchRow key={i} m={m} />
      ))}
    </div>
  );
}
