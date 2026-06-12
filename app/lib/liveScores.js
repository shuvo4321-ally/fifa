"use client";

import { useEffect, useState } from "react";

/**
 * One shared, deduped poll of /api/scores for the entire app. Every match row —
 * the ~70 calendar fixtures and the home hero — reads its score from this single
 * snapshot instead of fetching /api/live-score itself. The cache is module-level,
 * so it's also shared across client-side navigation between home and calendar.
 */

let snapshot = { matches: [], ts: 0 };
let inflight = null;
let pollTimer = null;
const listeners = new Set();
const TTL = 30000;

function norm(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ALIASES = {
  "korea republic": "south korea",
  "usa": "united states",
  "turkiye": "turkey",
  "ivory coast": "cote divoire",
};

function nameMatch(a, b) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x.includes(y) || y.includes(x)) return true;
  return ALIASES[y] === x || ALIASES[x] === y;
}

async function refresh() {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const r = await fetch("/api/scores", { cache: "no-store" });
      const d = await r.json();
      snapshot = { matches: d?.matches || [], ts: Date.now() };
      listeners.forEach((fn) => fn());
    } catch {
      // keep the last snapshot
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

function ensureFresh() {
  if (Date.now() - snapshot.ts > TTL) refresh();
}

/** Live status + team1-oriented score for one fixture, from the shared snapshot. */
export function useLiveScore(team1, team2) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    ensureFresh();
    // A single interval drives every subscriber; it stops when none are mounted.
    if (!pollTimer) pollTimer = setInterval(() => { if (listeners.size) ensureFresh(); }, TTL);
    return () => {
      listeners.delete(fn);
      if (listeners.size === 0 && pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };
  }, []);

  for (const m of snapshot.matches) {
    const fwd = nameMatch(m.home, team1) && nameMatch(m.away, team2);
    const rev = !fwd && nameMatch(m.home, team2) && nameMatch(m.away, team1);
    if (fwd || rev) {
      const h = m.score?.home;
      const a = m.score?.away;
      return { status: m.status, minute: m.minute, s1: rev ? a : h, s2: rev ? h : a };
    }
  }
  return null;
}
