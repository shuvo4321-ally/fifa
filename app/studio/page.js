"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import JitsiRoom from "../components/JitsiRoom";
import { LIVE_MATCHES } from "../data/channels";

// Hidden broadcaster page (not linked anywhere). Reachable only at /studio and
// gated by BROADCAST_PASSWORD in .env.local. Pick which match you're broadcasting.
export default function Studio() {
  const [match, setMatch] = useState(null);  // 1) Choose which match to broadcast
  const [quality, setQuality] = useState("720p30"); // Default sweet spot

  if (!match) {
    return (
      <main className="live-page">
        <div className="live-head">
          <div>
            <span className="live-kicker">
              <span className="live-dot is-on" />
              Studio
            </span>
            <h1 className="live-title">Pick a match to broadcast</h1>
          </div>
          <Link href="/live" className="live-broadcast-link">
            View public page →
          </Link>
        </div>
        <div className="live-matches">
          {LIVE_MATCHES.map((m) => (
            <button
              key={m.slug}
              className="fixture-card"
              onClick={() => setMatch(m)}
            >
              <div className="fixture-card-top">
                <div className="fixture-card-team">
                  {m.flag1 && <img src={m.flag1} alt="" className="fixture-card-flag" />}
                  <span>{m.team1}</span>
                </div>
                <span className="fixture-card-vs">VS</span>
                <div className="fixture-card-team fixture-card-team--right">
                  <span>{m.team2}</span>
                  {m.flag2 && <img src={m.flag2} alt="" className="fixture-card-flag" />}
                </div>
              </div>
              <div className="fixture-card-meta">
                {m.date} · {m.time} · {m.stage}
              </div>
            </button>
          ))}
        </div>
      </main>
    );
  }

  // 2) Broadcasting the chosen match
  return (
    <main className="live-page">
      <div className="live-head">
        <div>
          <span className="live-kicker">
            <span className="live-dot is-on" />
            On air · {match.team1} vs {match.team2}
          </span>
          <h1 className="live-title">Go live</h1>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select 
            value={quality} 
            onChange={(e) => setQuality(e.target.value)}
            className="search-input"
            style={{ padding: "0.5rem", borderRadius: "8px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <option value="1080p60">1080p @ 60 FPS (Highest Quality, High Bandwidth)</option>
            <option value="1080p30">1080p @ 30 FPS (High Quality, Medium Bandwidth)</option>
            <option value="720p60">720p @ 60 FPS (Smooth Motion, Medium Bandwidth)</option>
            <option value="720p30">720p @ 30 FPS (Standard, Low Bandwidth)</option>
            <option value="480p30">480p @ 30 FPS (SD, Lowest Bandwidth)</option>
          </select>
          <button
            className="live-broadcast-link live-switch"
            onClick={() => setMatch(null)}
          >
            ← Switch match
          </button>
        </div>
      </div>

      <div className="live-stage">
        <JitsiRoom role="host" room={match.room} quality={quality} />
      </div>

      <p className="live-note">
        Broadcasting <strong>{match.team1} vs {match.team2}</strong> — viewers watch
        at <strong>/live/{match.slug}</strong>. Click the <strong>screen-share</strong>{" "}
        (monitor) icon to go live, or <strong>Settings → Camera → OBS Virtual
        Camera</strong>. If meet.jit.si asks, log in once to be the moderator.
      </p>
    </main>
  );
}
