"use client";

import { useState } from "react";
import HlsPlayer from "../components/HlsPlayer";
import { TV_CHANNELS } from "../data/tvChannels";

export default function LiveTvPage() {
  const [active, setActive] = useState(TV_CHANNELS[0] || null);

  return (
    <main className="live-page">
      <div className="live-head live-head--center">
        <div>
          <span className="live-kicker">
            <span className="live-dot is-on" />
            Live TV
          </span>
          <h1 className="live-title">{active ? active.name : "Live TV"}</h1>
        </div>
      </div>

      <div className="live-stage">
        {active ? (
          <HlsPlayer src={active.url} poster={active.logo} />
        ) : (
          <div className="live-overlay live-cover">
            <p className="live-overlay-title">No channels yet</p>
          </div>
        )}
      </div>

      {TV_CHANNELS.length > 1 && (
        <div className="tv-channels">
          {TV_CHANNELS.map((c) => (
            <button
              key={c.name}
              className={`tv-channel${active === c ? " is-active" : ""}`}
              onClick={() => setActive(c)}
            >
              <img src={c.logo} alt="" className="tv-channel-logo" />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      )}

      <p className="live-note">
        {active?.group ? `${active.group} · ` : ""}Live stream. Tap the player to
        unmute.
      </p>
    </main>
  );
}
