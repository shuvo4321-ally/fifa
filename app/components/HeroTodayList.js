"use client";

import { useEffect, useRef } from "react";
import HeroMatchRow from "./HeroMatchRow";

/**
 * The hero's fixtures list: a continuous, seamless INFINITE auto-scroll. The
 * rows are duplicated once so the loop wraps back to the top invisibly. It caps
 * to ~3 rows and keeps looping until only the last 3 matches remain (then it's
 * static). Hovering (desktop) or touching (mobile) pauses it so you can read —
 * we never write scrollTop while paused, so the browser is never fought and it
 * can't stutter.
 */
const VISIBLE_ROWS = 3; // show 3; keep looping until only the last 3 remain
const PEEK = 14;        // show a sliver of the next row → reads as "there's more"
const SPEED = 26;       // px per second

export default function HeroTodayList({ rows }) {
  const scrollRef = useRef(null);
  const pauseUntil = useRef(0);
  const hovering = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let wrapPoint = 0;
    // Cap the visible height to ~VISIBLE_ROWS, and find the wrap point (one full
    // set of rows) — both measured from the real DOM since row height differs
    // desktop vs mobile.
    const fit = () => {
      if (rows.length > VISIBLE_ROWS && el.children.length > rows.length) {
        const capTop = el.children[VISIBLE_ROWS].offsetTop;    // top of the 4th row
        const setHeight = el.children[rows.length].offsetTop;  // top of the 1st duplicate = one full set
        if (capTop > 0) el.style.maxHeight = `${capTop + PEEK}px`;
        if (setHeight > 0) wrapPoint = setHeight;
      } else {
        el.style.maxHeight = "";
        wrapPoint = 0;
      }
    };
    fit();
    el.scrollTop = 0;

    let raf = 0;
    let last = performance.now();
    let currentY = 0;
    const overflows = () => rows.length > VISIBLE_ROWS;

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05); // clamp tab-switch jumps
      last = now;

      if (wrapPoint <= 0 && overflows()) fit(); // layout settled late

      // Static (≤3 matches) → freeze.
      if (!overflows() || wrapPoint <= 0) { currentY = el.scrollTop; return; }

      let pos = el.scrollTop; // single read
      // Seamless wrap for BOTH auto- and hand-scrolling: the moment we cross into
      // the duplicated copy, snap back by one full set. It's identical content so
      // the snap is invisible, and it fires only at the boundary (once per loop) —
      // NOT every frame — so it never fights the user's momentum the way the old
      // clamp did (that constant fight is what stuttered).
      if (pos >= wrapPoint) { pos -= wrapPoint; el.scrollTop = pos; }

      // Paused (hover / touch / drag) → let the user scroll freely; don't
      // auto-advance, just keep our tracker in sync.
      if (hovering.current || Date.now() < pauseUntil.current) {
        currentY = pos;
        return;
      }

      // Auto-advance. Resync first in case the user just hand-scrolled.
      if (Math.abs(pos - currentY) > 2) currentY = pos;
      currentY += SPEED * dt;
      if (currentY >= wrapPoint) currentY -= wrapPoint;
      el.scrollTop = currentY;
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("resize", fit);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, [rows.length]);

  // Pause the loop briefly on touch / wheel so a mobile tap-and-read works.
  const pause = () => { pauseUntil.current = Date.now() + 6000; };

  return (
    <div
      className="hero-today-scroll"
      ref={scrollRef}
      onMouseEnter={() => { hovering.current = true; }}
      onMouseLeave={() => { hovering.current = false; }}
      onPointerDown={pause}
      onTouchStart={pause}
      onWheel={pause}
    >
      {rows.map((m, i) => (
        <HeroMatchRow key={i} m={m} />
      ))}
      {/* Duplicate copy makes the loop seamless; only rendered when it loops. */}
      {rows.length > VISIBLE_ROWS && rows.map((m, i) => (
        <HeroMatchRow key={`dup-${i}`} m={m} />
      ))}
    </div>
  );
}
