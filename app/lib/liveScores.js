"use client";

import { useEffect, useState } from "react";
import { normTeam, isSameTeam } from "./teamNormalization";
 * One shared, deduped poll of /api/scores for the entire app. Every match row —
 * the calendar fixtures and the home hero — and the group tables all read from
 * this single snapshot instead of each fetching their own endpoint.
 *
 * - The poll is ADAPTIVE: fast only while a match is in play, easing to an idle
 *   heartbeat otherwise (instead of hammering the API every 30s around the clock).
 * - Finished results are STICKY and persisted to localStorage, so a result never
 *   disappears when it ages out of the live API's window (notably on Vercel,
 *   where ESPN's scoreboard only carries current matches).
 * - The group standings are DERIVED from these same results, so the table can
 *   never contradict the scorelines shown on the fixtures.
 */

let snapshot = { matches: [], ts: 0 };
let inflight = null;
let pollTimer = null;
const listeners = new Set();

const STALE_MS = 30000;          // refetch on mount if older than this
const LIVE_MS = 30000;           // a match is in play → poll fast
const SOON_MS = 60000;           // a kickoff is near / match could be live → moderate
const IDLE_MS = 10 * 60 * 1000;  // nothing live and nothing imminent → idle heartbeat
const STORAGE_KEY = "wc-results-v1";

// ── Sticky result store (finished results survive across fetches + reloads) ──
let store = new Map(); // key → match
let hydrated = false;

function keyOf(m) {
  return `${normTeam(m.home)}|${normTeam(m.away)}`;
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) for (const m of JSON.parse(raw)) if (m?.home && m?.away) store.set(keyOf(m), m);
  } catch {}
  if (store.size && snapshot.matches.length === 0) {
    // Show cached results instantly; ts 0 keeps it "stale" so a refresh still runs.
    snapshot = { matches: [...store.values()], ts: 0 };
  }
}

function persistFinished() {
  if (typeof window === "undefined") return;
  try {
    const finished = [...store.values()].filter((m) => m.status === "FINISHED");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finished));
  } catch {}
}

function mergeIntoStore(incoming) {
  for (const m of incoming) {
    if (!m?.home || !m?.away) continue;
    const key = keyOf(m);
    const prev = store.get(key);
    // A finished result is immutable — never let a later scheduled/no-score
    // response (e.g. a match that aged out of the live window) erase it.
    if (prev && prev.status === "FINISHED" && m.status !== "FINISHED") continue;
    store.set(key, m);
  }
}



function anyLive() {
  return snapshot.matches.some((m) => m.status === "IN_PLAY" || m.status === "PAUSED");
}

// How long until the next poll, based on what's actually happening.
function nextDelay() {
  if (anyLive()) return LIVE_MS;
  const now = Date.now();
  let nextKick = Infinity;
  for (const m of snapshot.matches) {
    const t = Date.parse(m.utcDate || "");
    if (!t) continue;
    if (now >= t && now - t < 3 * 60 * 60 * 1000 && m.status !== "FINISHED") return SOON_MS;
    if (t > now) nextKick = Math.min(nextKick, t);
  }
  if (nextKick !== Infinity) {
    const until = nextKick - now;
    if (until < 20 * 60 * 1000) return SOON_MS;
    return Math.min(IDLE_MS, until - 2 * 60 * 1000);
  }
  return IDLE_MS;
}

function scheduleNext() {
  clearTimeout(pollTimer);
  pollTimer = setTimeout(() => {
    if (listeners.size === 0) { pollTimer = null; return; }
    refresh(); // its finally() reschedules from the fresh snapshot
  }, nextDelay());
}

async function refresh() {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const r = await fetch("/api/scores", { cache: "no-store" });
      const d = await r.json();
      mergeIntoStore(d?.matches || []);
      snapshot = { matches: [...store.values()], ts: Date.now() };
      persistFinished();
      listeners.forEach((fn) => fn());
    } catch {
      // keep the last snapshot
    } finally {
      inflight = null;
      if (listeners.size > 0) scheduleNext(); // re-pace from the latest data
    }
  })();
  return inflight;
}

// Shared subscription + adaptive poll lifecycle, used by every consumer below.
function useScoresTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    hydrate();
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    if (Date.now() - snapshot.ts > STALE_MS) refresh(); // reschedules on completion
    else if (!pollTimer) scheduleNext();
    return () => {
      listeners.delete(fn);
      if (listeners.size === 0) {
        clearTimeout(pollTimer);
        pollTimer = null;
      }
    };
  }, []);
}

// team1-oriented score + status for one fixture, from a match list.
function lookupScore(matches, team1, team2) {
  for (const m of matches) {
    const fwd = isSameTeam(m.home, team1) && isSameTeam(m.away, team2);
    const rev = !fwd && isSameTeam(m.home, team2) && isSameTeam(m.away, team1);
    if (fwd || rev) {
      const h = m.score?.home;
      const a = m.score?.away;
      return { status: m.status, minute: m.minute, s1: rev ? a : h, s2: rev ? h : a };
    }
  }
  return null;
}

/** Live status + team1-oriented score for one fixture, from the shared snapshot. */
export function useLiveScore(team1, team2) {
  useScoresTick();
  return lookupScore(snapshot.matches, team1, team2);
}

// Build group tables purely from FINISHED match results — same source as the
// fixture scorelines, so the two can never disagree.
function deriveStandings(matches, groups, fixtures) {
  const out = {};
  for (const g of groups) {
    const rows = {};
    for (const t of g.teams) rows[t.name] = { name: t.name, gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
    for (const fx of fixtures) {
      if (fx.group !== g.name || !fx.match.includes(" vs ")) continue;
      const [t1, t2] = fx.match.split(" vs ").map((s) => s.trim());
      const r1 = rows[t1], r2 = rows[t2];
      if (!r1 || !r2) continue;
      const sc = lookupScore(matches, t1, t2);
      if (!sc || sc.status !== "FINISHED" || sc.s1 == null || sc.s2 == null) continue;
      r1.gp++; r2.gp++;
      r1.gf += sc.s1; r1.ga += sc.s2; r2.gf += sc.s2; r2.ga += sc.s1;
      if (sc.s1 > sc.s2) { r1.w++; r1.pts += 3; r2.l++; }
      else if (sc.s1 < sc.s2) { r2.w++; r2.pts += 3; r1.l++; }
      else { r1.d++; r2.d++; r1.pts++; r2.pts++; }
    }
    const arr = Object.values(rows).map((r) => ({ ...r, gd: r.gf - r.ga }));
    arr.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name));
    out[g.name] = arr;
  }
  return out;
}

/** Group tables derived from the shared results — `{ "Group A": [rows], ... }`. */
export function useGroupStandings(groups, fixtures) {
  useScoresTick();
  return deriveStandings(snapshot.matches, groups, fixtures);
}
