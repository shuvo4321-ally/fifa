"use client";

import { useState, useRef, useEffect } from "react";
import HlsPlayer from "../components/HlsPlayer";
import { TV_CHANNELS } from "../data/tvChannels";
import { useVoiceRoom } from "../lib/voiceRoom";

const CHANNELS = TV_CHANNELS;
const ROOM = "beta"; // one shared room — anyone with this URL joins it

export default function BetaWatchParty() {
  const [active, setActive] = useState(CHANNELS[0] || null);
  const [name, setName] = useState("");
  const stageRef = useRef(null);

  const { joined, connecting, muted, peers, error, join, leave, toggleMute } = useVoiceRoom(ROOM);

  // Default display name (editable before joining).
  useEffect(() => {
    setName(`Guest-${Math.floor(1000 + Math.random() * 9000)}`);
  }, []);

  const cycle = (dir) => {
    if (!active) return;
    const i = CHANNELS.findIndex((c) => c.name === active.name);
    if (i < 0) return;
    setActive(CHANNELS[(i + dir + CHANNELS.length) % CHANNELS.length]);
  };

  const toggleFullscreen = () => {
    const el = stageRef.current;
    if (!el) return;
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl) (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  };

  const count = peers.length + (joined ? 1 : 0);

  return (
    <main className="live-page livetv-page">
      <div className="live-head">
        <div>
          <h1 className="live-title">
            Watch Party <span style={{ fontSize: 13, color: "#ffd34d", verticalAlign: "middle", marginLeft: 8, fontWeight: 800, letterSpacing: ".08em" }}>BETA</span>
          </h1>
          <p className="predict-sub">Watch Live TV together and talk over voice. Share this page&apos;s URL — anyone who opens it can join.</p>
        </div>
      </div>

      <div className="live-stage livetv-stage" ref={stageRef}>
        {active ? (
          <HlsPlayer
            src={active.url || undefined}
            poster={active.logo || undefined}
            streamType={active.type}
            drmKid={active.kid}
            drmKey={active.key}
            onFullscreen={toggleFullscreen}
            onPrev={() => cycle(-1)}
            onNext={() => cycle(1)}
          />
        ) : (
          <div className="live-overlay live-cover"><p className="live-overlay-title">No channels</p></div>
        )}
      </div>

      {/* ── Voice bar ── */}
      <section
        style={{
          marginTop: 16, padding: "14px 16px", borderRadius: 14,
          background: "rgba(20,20,28,0.6)", border: "1px solid rgba(255,255,255,0.12)",
          display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12,
        }}
      >
        {!joined ? (
          <>
            <span style={{ fontWeight: 700 }}>🎙 Voice chat</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={24}
              style={{
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 8, padding: "8px 12px", color: "#fff", outline: "none", minWidth: 140,
              }}
            />
            <button
              onClick={() => join(name)}
              disabled={connecting}
              style={{
                background: "#ffd34d", color: "#10101a", fontWeight: 800, border: "none",
                borderRadius: 8, padding: "9px 18px", cursor: "pointer", opacity: connecting ? 0.6 : 1,
              }}
            >
              {connecting ? "Joining…" : "Join voice"}
            </button>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
              Only your mic is shared — the TV audio you hear stays on your device.
            </span>
          </>
        ) : (
          <>
            <span style={{ fontWeight: 700, color: "#3ddc84" }}>● In voice · {count} {count === 1 ? "person" : "people"}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span style={chip(true)}>{name} (you)</span>
              {peers.map((p) => (
                <span key={p.id} style={chip(false)}>{p.name}</span>
              ))}
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button onClick={toggleMute} style={btn(muted ? "#dc2626" : "rgba(255,255,255,0.12)")}>
                {muted ? "🔇 Unmute" : "🎙 Mute"}
              </button>
              <button onClick={leave} style={btn("rgba(255,255,255,0.12)")}>Leave</button>
            </div>
          </>
        )}
        {error && <span style={{ color: "#ff6b6b", fontSize: 13, width: "100%" }}>{error}</span>}
      </section>

      {/* ── Channel strip ── */}
      <section className="livetv-guide" style={{ marginTop: 16 }}>
        <div className="livetv-guide-head"><h2 className="livetv-guide-title">Channels</h2></div>
        <div className="tv-channels">
          {CHANNELS.map((c) => (
            <button
              key={c.name}
              className={`tv-channel${active === c ? " is-active" : ""}`}
              onClick={() => setActive(c)}
            >
              {active === c && <span className="tv-channel-badge">On now</span>}
              <span className="tv-channel-logo-wrap">
                <span className="tv-channel-fallback">{(c.name.replace(/[^A-Za-z]/g, "").slice(0, 2) || "TV").toUpperCase()}</span>
                {c.logo && <img src={c.logo} alt="" className="tv-channel-logo" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
              </span>
              <span className="tv-channel-name">{c.name}</span>
              <span className="tv-channel-group">{c.group}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

const chip = (me) => ({
  padding: "5px 10px", borderRadius: 999, fontSize: 13, fontWeight: 600,
  background: me ? "rgba(255,211,77,0.18)" : "rgba(255,255,255,0.1)",
  border: `1px solid ${me ? "rgba(255,211,77,0.4)" : "rgba(255,255,255,0.18)"}`,
  color: "#fff", whiteSpace: "nowrap",
});
const btn = (bg) => ({
  background: bg, color: "#fff", fontWeight: 700, border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 8, padding: "9px 16px", cursor: "pointer",
});
