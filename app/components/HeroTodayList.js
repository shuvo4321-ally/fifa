"use client";

import { useEffect, useRef } from "react";
import HeroMatchRow from "./HeroMatchRow";

/**
 * The hero's fixtures list. It caps itself to ~4 rows and continuously
 * auto-scrolls through the rest in an infinite loop, so every game glides
 * into view — with NO visible scrollbar. The user can still scroll it by
 * hand, which pauses the auto-scroll for a few seconds.
 */
const VISIBLE_ROWS = 4;
const PEEK = 14;        // show a sliver of the next row → reads as "there's more"
const SPEED = 26;       // px per second

export default function HeroTodayList({ rows }) {
  const scrollRef = useRef(null);
  const pauseUntil = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Cap the height to ~VISIBLE_ROWS, measured from the real rows (their height
    // differs desktop vs mobile), so anything beyond that has to scroll in.
    const fit = () => {
      const items = [...el.children];
      if (rows.length > VISIBLE_ROWS && items.length > VISIBLE_ROWS) {
        el.style.maxHeight = `${items[VISIBLE_ROWS].offsetTop + PEEK}px`;
      } else {
        el.style.maxHeight = "";
      }
    };
    fit();
    el.scrollTop = 0;

    let raf = 0;
    let last = performance.now();
    const overflows = () => rows.length > VISIBLE_ROWS;

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05); // clamp tab-switch jumps
      last = now;
      if (Date.now() < pauseUntil.current || !overflows()) return;

      const items = [...el.children];
      // The point where the duplicate items start is the offsetTop of the first duplicate.
      const wrapPoint = items[rows.length] ? items[rows.length].offsetTop : el.scrollHeight / 2;
      
      let next = el.scrollTop + SPEED * dt;
      if (next >= wrapPoint) { 
        next -= wrapPoint; // Seamless wrap
      }
      el.scrollTop = next;
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("resize", fit);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, [rows.length]);

  // Any manual scroll / touch pauses the auto-scroll briefly.
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
      {/* Duplicate rows for infinite scroll if there's an overflow */}
      {rows.length > VISIBLE_ROWS && rows.map((m, i) => (
        <HeroMatchRow key={`dup-${i}`} m={m} />
      ))}
    </div>
  );
}
