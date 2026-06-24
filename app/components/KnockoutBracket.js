"use client";

import React, { useRef, useState, useEffect } from "react";

// Round of 32 team badge — circular flag with the 3-letter code beneath.
// Falls back to the placeholder code (e.g. "A1") while a group is undecided.
function Badge({ t }) {
  return (
    <div className={`kb-badge${t.tbd ? " is-tbd" : ""}`}>
      <span className="kb-badge-circle">
        {t.flag ? (
          <img src={t.flag} alt="" className="kb-flag" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <span className="kb-badge-ph">{t.code}</span>
        )}
      </span>
      <span className="kb-code">{t.code}</span>
    </div>
  );
}

function Match({ m }) {
  return (
    <div className="kb-match">
      <Badge t={m.s1} />
      <span className="kb-v">v</span>
      <Badge t={m.s2} />
    </div>
  );
}

function Mini({ t }) {
  if (!t || t.tbd) return <span className="kb-mini is-tbd">—</span>;
  return (
    <span className="kb-mini">
      {t.flag ? <img src={t.flag} alt="" className="kb-mini-flag" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : null}
      {t.code}
    </span>
  );
}

// Inner-round node (R16 / QF / SF). Shows the round label until the matchup is
// known, then upgrades to the live pairing.
function Node({ match, label, variant = "" }) {
  const s1 = match?.s1, s2 = match?.s2;
  const known = (s1 && !s1.tbd) || (s2 && !s2.tbd);
  return (
    <div className={`kb-node ${variant}${known ? " has-teams" : ""}`}>
      {known ? (
        <span className="kb-node-teams"><Mini t={s1} /><span className="kb-node-x">v</span><Mini t={s2} /></span>
      ) : (
        <span className="kb-node-label">{label}</span>
      )}
    </div>
  );
}

export default function KnockoutBracket({ rounds }) {
  const { r32 = [], r16 = [], qf = [], sf = [] } = rounds || {};

  const left = { r32: r32.slice(0, 8), r16: r16.slice(0, 4), qf: qf.slice(0, 2), sf: sf.slice(0, 1) };
  const right = { r32: r32.slice(8, 16), r16: r16.slice(4, 8), qf: qf.slice(2, 4), sf: sf.slice(1, 2) };

  // ── Bracket connectors drawn as an SVG overlay from real element positions,
  //    so the elbow lines join exactly at any width (desktop fill or mobile pan). ──
  const boardRef = useRef(null);
  const [conn, setConn] = useState({ w: 0, h: 0, paths: [] });

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const compute = () => {
      const br = board.getBoundingClientRect();
      const rel = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          l: r.left - br.left, r: r.right - br.left,
          mx: (r.left + r.right) / 2 - br.left, my: (r.top + r.bottom) / 2 - br.top,
        };
      };
      const q = (sel) => [...board.querySelectorAll(sel)].map(rel);
      const L = {
        r32: q(".kb-side--left .kb-col--r32 .kb-match"),
        r16: q(".kb-side--left .kb-col--r16 .kb-node"),
        qf: q(".kb-side--left .kb-col--qf .kb-node"),
        sf: q(".kb-side--left .kb-col--sf .kb-node"),
      };
      const R = {
        r32: q(".kb-side--right .kb-col--r32 .kb-match"),
        r16: q(".kb-side--right .kb-col--r16 .kb-node"),
        qf: q(".kb-side--right .kb-col--qf .kb-node"),
        sf: q(".kb-side--right .kb-col--sf .kb-node"),
      };
      const video = rel(board.querySelector(".kb-trophy"));
      const paths = [];
      // node sits to the RIGHT of its two feeders (left half)
      const elbowL = (n, f1, f2) => {
        if (!n || !f1 || !f2) return;
        const mx = n.l - 16;
        paths.push(`M${f1.r} ${f1.my}H${mx}V${f2.my}H${f2.r}`);
        paths.push(`M${mx} ${n.my}H${n.l}`);
      };
      // node sits to the LEFT of its two feeders (right half)
      const elbowR = (n, f1, f2) => {
        if (!n || !f1 || !f2) return;
        const mx = n.r + 16;
        paths.push(`M${f1.l} ${f1.my}H${mx}V${f2.my}H${f2.l}`);
        paths.push(`M${mx} ${n.my}H${n.r}`);
      };
      for (let j = 0; j < 4; j++) elbowL(L.r16[j], L.r32[2 * j], L.r32[2 * j + 1]);
      for (let j = 0; j < 2; j++) elbowL(L.qf[j], L.r16[2 * j], L.r16[2 * j + 1]);
      elbowL(L.sf[0], L.qf[0], L.qf[1]);
      for (let j = 0; j < 4; j++) elbowR(R.r16[j], R.r32[2 * j], R.r32[2 * j + 1]);
      for (let j = 0; j < 2; j++) elbowR(R.qf[j], R.r16[2 * j], R.r16[2 * j + 1]);
      elbowR(R.sf[0], R.qf[0], R.qf[1]);
      // semi-finals into the centre
      if (L.sf[0] && video) paths.push(`M${L.sf[0].r} ${L.sf[0].my}H${video.l}`);
      if (R.sf[0] && video) paths.push(`M${video.r} ${R.sf[0].my}H${R.sf[0].l}`);

      setConn({ w: board.scrollWidth, h: board.scrollHeight, paths });
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(board);
    window.addEventListener("resize", compute);
    return () => { ro.disconnect(); window.removeEventListener("resize", compute); };
  }, [rounds]);

  return (
    <div className="kb-fit">
      <div className="kb-board" ref={boardRef}>
        <svg className="kb-conn" width={conn.w} height={conn.h} viewBox={`0 0 ${conn.w} ${conn.h}`} aria-hidden="true">
          {conn.paths.map((d, i) => <path key={i} d={d} />)}
        </svg>
        <div className="kb-layout">
          <div className="kb-side kb-side--left">
            <div className="kb-col kb-col--r32">{left.r32.map((m, i) => <Match key={i} m={m} />)}</div>
            <div className="kb-col kb-col--r16">{left.r16.map((m, i) => <Node key={i} match={m} label="R16" />)}</div>
            <div className="kb-col kb-col--qf">{left.qf.map((m, i) => <Node key={i} match={m} label="QF" />)}</div>
            <div className="kb-col kb-col--sf">{left.sf.map((m, i) => <Node key={i} match={m} label="SF" variant="kb-node--sf" />)}</div>
          </div>

          <div className="kb-center">
            <div className="kb-trophy" aria-label="Trophy">
              <video className="kb-trophy-img" src="/trophy.mp4" autoPlay loop muted playsInline />
            </div>
          </div>

          <div className="kb-side kb-side--right">
            <div className="kb-col kb-col--sf">{right.sf.map((m, i) => <Node key={i} match={m} label="SF" variant="kb-node--sf" />)}</div>
            <div className="kb-col kb-col--qf">{right.qf.map((m, i) => <Node key={i} match={m} label="QF" />)}</div>
            <div className="kb-col kb-col--r16">{right.r16.map((m, i) => <Node key={i} match={m} label="R16" />)}</div>
            <div className="kb-col kb-col--r32">{right.r32.map((m, i) => <Match key={i} m={m} />)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
