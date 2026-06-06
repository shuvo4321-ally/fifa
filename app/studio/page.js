"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
const JitsiRoom = dynamic(() => import("../components/JitsiRoom"), { ssr: false });

export default function Studio() {
  // --- Password gate ---
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [authError, setAuthError] = useState("");
  const [checking, setChecking] = useState(false);

  // --- Broadcast state ---
  const [isLive, setIsLive] = useState(false);
  const [joined, setJoined] = useState(false);

  // Phones can't screen-share, so we show camera-based steps there.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("cron-studio-ok") === "1") {
      setUnlocked(true);
    }
    setIsMobile(window.matchMedia("(max-width: 640px)").matches);
  }, []);

  const submitPw = async (e) => {
    e.preventDefault();
    setChecking(true);
    setAuthError("");
    try {
      const r = await fetch("/api/broadcast-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (r.ok) {
        sessionStorage.setItem("cron-studio-ok", "1");
        setUnlocked(true);
      } else {
        const d = await r.json().catch(() => ({}));
        setAuthError(d.error || "Wrong password.");
      }
    } catch {
      setAuthError("Couldn't verify — try again.");
    } finally {
      setChecking(false);
    }
  };

  const goLive = () => setIsLive(true);

  const endLive = () => {
    setIsLive(false);
    setJoined(false);
  };

  const handleLiveChange = useCallback((live) => {
    setJoined(live);
    if (!live) setIsLive(false);
  }, []);

  // --- Locked: ask for the broadcaster password ---
  if (!unlocked) {
    return (
      <main
        className="live-page"
        style={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--page-gutter)",
        }}
      >
        <form
          onSubmit={submitPw}
          style={{
            width: "100%",
            maxWidth: 360,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-4)",
            textAlign: "center",
          }}
        >
          <span className="live-kicker">
            <span className="live-dot is-on" />
            Broadcaster
          </span>
          <h1 className="live-overlay-title">Studio access</h1>
          <p className="live-overlay-sub">Enter the broadcaster password to go live.</p>
          <input
            type="password"
            className="search-input"
            placeholder="Password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoFocus
            style={{ maxWidth: 280 }}
          />
          {authError && <p className="live-error">{authError}</p>}
          <button className="studio-golive" type="submit" disabled={checking}>
            {checking ? "Checking…" : "Unlock studio"}
          </button>
        </form>
      </main>
    );
  }

  // --- Unlocked: the broadcaster studio ---
  return (
    <main
      className="live-page"
      style={{
        padding: "var(--page-gutter)",
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        className="studio-stage-wrap"
        style={{ margin: "0 auto", maxWidth: "1200px", width: "100%", gap: "var(--space-7)" }}
      >
        <div className="live-stage">
          {isLive ? (
            <JitsiRoom role="host" room="CRON-GLOBAL-LIVE" onLiveChange={handleLiveChange} />
          ) : (
            <div className="live-overlay live-cover">
              <span className="live-kicker">
                <span className="live-dot" />
                Ready
              </span>
              <p className="live-overlay-title">You're not on air yet</p>
              <p className="live-overlay-sub">
                {isMobile
                  ? "Hit Go live, then tap the camera icon to broadcast your camera."
                  : "Hit Go live, then share your screen or switch to OBS Virtual Camera."}
              </p>
              <button className="studio-golive" onClick={goLive}>
                <span className="live-dot is-on" />
                Go live
              </button>
            </div>
          )}
        </div>

        <aside className="studio-panel" style={{ marginTop: 0 }}>
          {isMobile ? (
            <>
              <span className="channel-stage">Go live from your phone</span>
              <ol className="studio-checklist">
                <li>
                  <span className="studio-step-num">1</span>
                  <span>
                    Tap <b>Go live</b>.
                  </span>
                </li>
                <li>
                  <span className="studio-step-num">2</span>
                  <span>
                    Tap the <b>camera</b> icon in the player to start broadcasting your camera
                    (allow camera access if asked).
                  </span>
                </li>
                <li>
                  <span className="studio-step-num">3</span>
                  <span>
                    <b>Screen-share &amp; OBS aren't available on phones</b> — use a computer for
                    those.
                  </span>
                </li>
              </ol>
            </>
          ) : (
            <>
              <span className="channel-stage">Go live in 3 steps</span>
              <ol className="studio-checklist">
                <li>
                  <span className="studio-step-num">1</span>
                  <span>
                    <b>Go live</b> to claim the channel.
                  </span>
                </li>
                <li>
                  <span className="studio-step-num">2</span>
                  <span>
                    Click the <b>screen-share</b> (monitor) icon, or <b>Settings → Camera → OBS
                    Virtual Camera</b>.
                  </span>
                </li>
                <li>
                  <span className="studio-step-num">3</span>
                  <span>If meet.jit.si asks, log in once so you're the moderator.</span>
                </li>
              </ol>
            </>
          )}
          <p className="studio-watch">
            Viewers watch at <b>/live</b>
          </p>
          {isLive && (
            <button className="live-stop" onClick={endLive}>
              End broadcast
            </button>
          )}
        </aside>
      </div>
    </main>
  );
}
