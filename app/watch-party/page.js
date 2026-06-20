"use client";

import { useState, useRef, useEffect } from "react";
import HlsPlayer from "../components/HlsPlayer";
import { TV_CHANNELS } from "../data/tvChannels";
import { useVoiceRoom } from "../lib/voiceRoom";

const CHANNELS = TV_CHANNELS;
const MAX = 8; // peer-to-peer voice is reliable up to ~8
const newCode = () => Math.random().toString(36).slice(2, 8).toUpperCase(); // 6-char room code

export default function WatchParty() {
  const [ready, setReady] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [name, setName] = useState("");
  const [active, setActive] = useState(CHANNELS[0] || null);
  const [copied, setCopied] = useState(false);
  const stageRef = useRef(null);

  // The room code IS the secret — the voice channel is keyed to it, so only
  // people with your invite link land in the same party.
  const { joined, connecting, muted, peers, error, count, full, join, leave, toggleMute } = useVoiceRoom(roomCode, MAX);

  // Read room code (from the invite link) + saved channel/name on mount.
  useEffect(() => {
    try {
      const r = (new URL(window.location.href).searchParams.get("room") || "").trim().toUpperCase();
      if (r) setRoomCode(r);
    } catch {}
    try {
      const savedCh = localStorage.getItem("watch-party-channel");
      if (savedCh) { const ch = CHANNELS.find((c) => c.name === savedCh); if (ch) setActive(ch); }
    } catch {}
    let savedName = "";
    try { savedName = localStorage.getItem("watch-party-name") || ""; } catch {}
    setName(savedName || `Guest-${Math.floor(1000 + Math.random() * 9000)}`);
    setReady(true);
  }, []);

  // Lock background height to prevent jumping/shifting when mobile URL bar hides/shows on scroll.
  useEffect(() => {
    const bg = document.querySelector(".watch-party-bg-container");
    if (!bg) return;

    let lastWidth = window.innerWidth;
    const updateHeight = () => {
      bg.style.height = `${window.innerHeight}px`;
    };

    updateHeight();

    const handleResize = () => {
      // Only recalculate if width actually changed (e.g., orientation swap or screen size change),
      // preventing layout shifts when scrolling vertically on mobile browsers.
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        updateHeight();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => { try { if (name) localStorage.setItem("watch-party-name", name); } catch {} }, [name]);

  // Stay in voice across a refresh (sessionStorage; cleared by Leave or tab close).
  useEffect(() => { if (joined) { try { sessionStorage.setItem("watch-party-in-voice", "1"); } catch {} } }, [joined]);
  const autoTried = useRef(false);
  useEffect(() => {
    if (autoTried.current || !ready || !roomCode || !name) return;
    autoTried.current = true;
    try { if (sessionStorage.getItem("watch-party-in-voice") === "1") join(name); } catch {}
  }, [ready, roomCode, name, join]);
  useEffect(() => {
    if (error && !joined && !connecting) { try { sessionStorage.removeItem("watch-party-in-voice"); } catch {} }
  }, [error, joined, connecting]);

  const setRoom = (code) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("room", code);
      window.history.replaceState(null, "", url.toString());
    } catch {}
    setRoomCode(code);
  };
  const createParty = () => setRoom(newCode());
  const joinByCode = () => { const c = joinInput.trim().toUpperCase(); if (c) setRoom(c); };
  const copyLink = () => {
    try { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const handleLeave = () => { try { sessionStorage.removeItem("watch-party-in-voice"); } catch {} leave(); };

  const pickChannel = (ch) => { setActive(ch); try { if (ch) localStorage.setItem("watch-party-channel", ch.name); } catch {} };
  const cycle = (dir) => {
    if (!active) return;
    const i = CHANNELS.findIndex((c) => c.name === active.name);
    if (i < 0) return;
    pickChannel(CHANNELS[(i + dir + CHANNELS.length) % CHANNELS.length]);
  };
  const toggleFullscreen = () => {
    const el = stageRef.current; if (!el) return;
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl) (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  };

  if (!ready) return null; // avoid an SSR/hydration flash before we read the URL

  // ── LOBBY: no room yet ──
  if (!roomCode) {
    return (
      <>
        <div className="watch-party-bg-container">
          <div className="watch-party-bg-scrim" />
        </div>
        <main className="live-page livetv-page">
          <div className="live-head live-head--center">
            <div>
              <h1 className="live-title">Watch Party</h1>
              <p className="predict-sub">Private rooms — only people you send the invite link to can join (max {MAX}).</p>
            </div>
          </div>
          <section style={{ ...card, maxWidth: 460, marginLeft: "auto", marginRight: "auto", flexDirection: "column", alignItems: "stretch", gap: 14 }}>
            <button onClick={createParty} style={{ ...btn("#ffd34d"), color: "#10101a", fontWeight: 800, fontSize: 15, padding: "12px 18px" }}>
              ＋ Create a private party
            </button>
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>— or join one —</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && joinByCode()}
                placeholder="Enter party code"
                style={{ ...input, flex: 1, textTransform: "uppercase" }}
              />
              <button onClick={joinByCode} style={btn("rgba(255,255,255,0.12)")}>Join</button>
            </div>
          </section>
        </main>
      </>
    );
  }

  const roomFull = full || (!joined && count >= MAX);

  // ── PARTY: inside a room ──
  return (
    <>
      <div className="watch-party-bg-container">
        <div className="watch-party-bg-scrim" />
      </div>
      <main className="live-page livetv-page">
        <div className="live-head live-head--center">
          <div>
            <h1 className="live-title">Watch Party</h1>
            <p className="predict-sub">Watch Live TV together and talk over voice.</p>
          </div>
        </div>

        {/* ── Room / invite bar ── */}
        <section style={{ ...card, justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Party code</span>
            <code style={{ background: "rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: 8, fontWeight: 800, letterSpacing: "0.12em" }}>{roomCode}</code>
            {joined && <span style={{ color: "#3ddc84", fontSize: 13, fontWeight: 700 }}>● {count}/{MAX} in party</span>}
          </span>
          <button onClick={copyLink} style={btn("rgba(255,255,255,0.12)")}>{copied ? "✓ Link copied" : "Copy invite link"}</button>
        </section>

        <div className="live-stage livetv-stage" ref={stageRef} style={{ marginTop: 14 }}>
          {active ? (
            <HlsPlayer
              src={active.url || undefined}
              poster={active.logo || undefined}
              streamType={active.type}
              drmKid={active.kid}
              drmKey={active.key}
              noProxy={active.no_proxy}
              onFullscreen={toggleFullscreen}
              onPrev={() => cycle(-1)}
              onNext={() => cycle(1)}
            />
          ) : (
            <div className="live-overlay live-cover"><p className="live-overlay-title">No channels</p></div>
          )}
        </div>

        {/* ── Voice bar ── */}
        <section style={{ ...card, marginTop: 16 }}>
          {!joined ? (
            <>
              <span style={{ fontWeight: 700 }}>🎙 Voice chat</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={24} style={{ ...input, minWidth: 140 }} />
              <button
                onClick={() => join(name)}
                disabled={connecting || roomFull}
                style={{ ...btn("#ffd34d"), color: "#10101a", fontWeight: 800, opacity: connecting || roomFull ? 0.5 : 1 }}
              >
                {roomFull ? "Party full" : connecting ? "Joining…" : "Join voice"}
              </button>
              <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
                Only your mic is shared — the TV audio you hear stays on your device.
              </span>
            </>
          ) : (
            <>
              <span style={{ fontWeight: 700, color: "#3ddc84" }}>● In voice · {count}/{MAX}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span style={chip(true)}>{name} (you)</span>
                {peers.map((p) => <span key={p.id} style={chip(false)}>{p.name}</span>)}
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button onClick={toggleMute} style={btn(muted ? "#dc2626" : "rgba(255,255,255,0.12)")}>{muted ? "🔇 Unmute" : "🎙 Mute"}</button>
                <button onClick={handleLeave} style={btn("rgba(255,255,255,0.12)")}>Leave</button>
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
              <button key={c.name} className={`tv-channel${active === c ? " is-active" : ""}`} onClick={() => pickChannel(c)}>
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
    </>
  );
}

// Styles
const card = {
  marginTop: 16, padding: "14px 16px", borderRadius: 14,
  background: "rgba(10, 10, 15, 0.45)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
  display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12,
};
const input = {
  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 8, padding: "9px 12px", color: "#fff", outline: "none",
};
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
