"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { LIVE_MATCHES } from "../data/channels";

const JitsiRoom = dynamic(() => import("../components/JitsiRoom"), { ssr: false });

function genToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Studio() {
  // --- Password gate ---
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [authError, setAuthError] = useState("");
  const [checking, setChecking] = useState(false);

  // --- Broadcast state ---
  const [isLive, setIsLive] = useState(false);
  const [joined, setJoined] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState("__global__");
  const [lockError, setLockError] = useState("");

  const tokenRef = useRef(genToken());
  const heartbeatRef = useRef(null);

  // Phones can't screen-share, so we show camera-based steps there.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("cron-studio-ok") === "1") {
      setUnlocked(true);
    }
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Release the broadcast lock on page unload / unmount.
  useEffect(() => {
    const releaseOnUnload = () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      navigator.sendBeacon(
        "/api/broadcast",
        new Blob(
          [JSON.stringify({ action: "stop", token: tokenRef.current })],
          { type: "application/json" }
        )
      );
    };
    window.addEventListener("beforeunload", releaseOnUnload);
    return () => {
      window.removeEventListener("beforeunload", releaseOnUnload);
      releaseOnUnload(); // also fire on client-side navigation
    };
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
        sessionStorage.setItem("cron-studio-pw", pw);
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

  /** Call the broadcast-lock API. */
  const broadcastApi = async (action, slug) => {
    try {
      const storedPw = sessionStorage.getItem("cron-studio-pw") || "";
      const r = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          slug: slug || null,
          token: tokenRef.current,
          password: storedPw,
        }),
      });
      return await r.json();
    } catch {
      return { ok: false };
    }
  };

  const selectedMatch =
    LIVE_MATCHES.find((m) => m.slug === selectedSlug) || null;
  const broadcastSlug = selectedMatch ? selectedMatch.slug : null;
  const roomName = selectedMatch ? selectedMatch.room : "CRON-GLOBAL-LIVE";

  const goLive = async () => {
    setLockError("");
    const res = await broadcastApi("start", broadcastSlug);
    if (!res.ok) {
      setLockError(
        res.liveSlug
          ? `Another broadcaster is already live on "${res.liveSlug}". Wait for them to finish.`
          : "Couldn't acquire the broadcast lock — try again."
      );
      return;
    }
    setIsLive(true);
    // Heartbeat every 8 s — the server expires the lock after 20 s of silence.
    heartbeatRef.current = setInterval(() => {
      broadcastApi("beat", broadcastSlug);
    }, 8000);
  };

  const endLive = async () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    await broadcastApi("stop", broadcastSlug);
    setIsLive(false);
    setJoined(false);
    setLockError("");
  };

  const handleLiveChange = useCallback((live) => {
    setJoined(live);
    if (!live) {
      // Jitsi disconnected — release the lock.
      setIsLive(false);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop", token: tokenRef.current }),
      }).catch(() => {});
    }
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
            <JitsiRoom role="host" room={roomName} onLiveChange={handleLiveChange} />
          ) : (
            <div className="live-overlay live-cover">
              <span className="live-kicker">
                <span className="live-dot" />
                Ready
              </span>
              <p className="live-overlay-title">You're not on air yet</p>
              <p className="live-overlay-sub">
                {isMobile
                  ? "Select a channel, hit Go live, then tap the camera icon to broadcast."
                  : "Select a channel below, then hit Go live to start broadcasting."}
              </p>

              {/* Match / channel selector */}
              <select
                className="search-input"
                style={{ maxWidth: 340, margin: "0 auto var(--space-4)", cursor: "pointer" }}
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
              >
                <option value="__global__">🌐 Global broadcast (all /live viewers)</option>
                {LIVE_MATCHES.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.team1} vs {m.team2} — {m.date}
                  </option>
                ))}
              </select>

              {lockError && <p className="live-error">{lockError}</p>}

              <button className="studio-golive" onClick={goLive}>
                <span className="live-dot is-on" />
                Go live
              </button>
            </div>
          )}
        </div>

        <aside className="studio-panel" style={{ marginTop: 0 }}>
          {isLive && (
            <div style={{ marginBottom: "var(--space-4)" }}>
              <span className="live-kicker">
                <span className="live-dot is-on" />
                On air
              </span>
              <p style={{ margin: "var(--space-2) 0 0", opacity: 0.7 }}>
                Broadcasting to:{" "}
                <b>
                  {selectedMatch
                    ? `${selectedMatch.team1} vs ${selectedMatch.team2}`
                    : "Global"}
                </b>
              </p>
              <p style={{ margin: "var(--space-1) 0 0", opacity: 0.5, fontSize: "0.85em" }}>
                Room: {roomName}
              </p>
            </div>
          )}

          {isMobile ? (
            <>
              <span className="channel-stage">Go live from your phone</span>
              <ol className="studio-checklist">
                <li>
                  <span className="studio-step-num">1</span>
                  <span>
                    Select a channel and tap <b>Go live</b>.
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
                    Select a channel and click <b>Go live</b>.
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
            Viewers watch at{" "}
            <b>{selectedMatch ? `/live/${selectedMatch.slug}` : "/live"}</b>
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
