"use client";

import { useState, useEffect, useRef } from "react";
import HlsPlayer from "../components/HlsPlayer";
import { TV_CHANNELS } from "../data/tvChannels";

const AVAILABLE_CHANNELS = TV_CHANNELS;

function initials(name) {
  const letters = (name || "").replace(/[^A-Za-z]/g, "");
  return (letters.slice(0, 2) || "TV").toUpperCase();
}

export default function LiveTvPage() {
  const [active, setActive] = useState(AVAILABLE_CHANNELS[0] || null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem("hasSeenLiveTvPopup");
    if (!hasSeenPopup) {
      setShowPopup(true);
      localStorage.setItem("hasSeenLiveTvPopup", "true");
      const timer = setTimeout(() => setShowPopup(false), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const stageRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFs = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      const isFs = fsEl === stageRef.current;
      setIsFullscreen(isFs);
      
      if (isFs) {
        try {
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock("landscape").catch(() => {});
          }
        } catch (e) {}
      } else {
        try {
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
        } catch (e) {}
      }
    };
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange", onFs);
    };
  }, []);

  const toggleFullscreen = () => {
    const el = stageRef.current;
    if (!el) return;
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl) {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
    }
  };

  const handleNext = () => {
    if (!active) return;
    const idx = AVAILABLE_CHANNELS.findIndex(c => c.name === active.name);
    if (idx < 0) return;
    const nextIdx = (idx + 1) % AVAILABLE_CHANNELS.length;
    setActive(AVAILABLE_CHANNELS[nextIdx]);
  };

  const handlePrev = () => {
    if (!active) return;
    const idx = AVAILABLE_CHANNELS.findIndex(c => c.name === active.name);
    if (idx < 0) return;
    const prevIdx = (idx - 1 + AVAILABLE_CHANNELS.length) % AVAILABLE_CHANNELS.length;
    setActive(AVAILABLE_CHANNELS[prevIdx]);
  };

  const uniqueOrigins = Array.from(
    new Set(
      AVAILABLE_CHANNELS
        .map(c => c.url)
        .filter(Boolean)
        .map(url => {
          try {
            return new URL(url).origin;
          } catch {
            return null;
          }
        })
        .filter(Boolean)
    )
  );

  return (
    <>
      {uniqueOrigins.map(origin => (
        <link key={origin} rel="preconnect" href={origin} crossOrigin="anonymous" />
      ))}

      {showPopup && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}
          onClick={() => setShowPopup(false)}
        >
          <div style={{ position: "relative", maxWidth: "100%", maxHeight: "100%", display: "flex", justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
            <img src="/images/live-tv-popup.png" alt="Live TV Popup" style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: "12px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)" }} />
            <button onClick={() => setShowPopup(false)} style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>
      )}

      <main className="live-page livetv-page">
        <div className="live-head">
          <div>
            <h1 className="live-title">Live TV</h1>
            <p className="predict-sub">Live sports, news &amp; entertainment channels.</p>
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
              onPrev={handlePrev}
              onNext={handleNext}
            />
          ) : (
            <div className="live-overlay live-cover">
              <p className="live-overlay-title">No channels yet</p>
            </div>
          )}
        </div>

        {active && (
          <div className="livetv-now-bar">
            <div>
              <h2 className="livetv-now-name">{active.name}</h2>
              <p className="livetv-now-meta">{active.group}</p>
            </div>
            <div style={{ 
              marginLeft: "auto", 
              fontSize: "13px", 
              color: "#fff", 
              backgroundColor: "rgba(255, 255, 255, 0.1)", 
              border: "1px solid rgba(255, 255, 255, 0.2)", 
              padding: "8px 12px", 
              borderRadius: "8px", 
              display: "flex", 
              alignItems: "center", 
              gap: "8px",
              maxWidth: "320px",
              lineHeight: "1.4"
            }}>
              <span style={{ fontSize: "16px" }}>⚠️</span>
              <span>Seeing a stuck screen? Use the <strong>Reload</strong> button in the player controls to reconnect or check next channel.</span>
            </div>
          </div>
        )}

        {AVAILABLE_CHANNELS.length > 1 && (
          <section className="livetv-guide">
            <div className="livetv-guide-head">
              <h2 className="livetv-guide-title">All channels</h2>
            </div>

            <div className="tv-channels">
              {AVAILABLE_CHANNELS.map((c) => {
                const isActive = active === c;
                return (
                  <button
                    key={c.name}
                    className={`tv-channel${isActive ? " is-active" : ""}`}
                    onClick={() => setActive(c)}
                  >
                    {isActive && <span className="tv-channel-badge">On now</span>}
                    <span className="tv-channel-logo-wrap">
                      <span className="tv-channel-fallback">{initials(c.name)}</span>
                      {c.logo && (
                        <img
                          src={c.logo}
                          alt=""
                          className="tv-channel-logo"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </span>
                    <span className="tv-channel-name">{c.name}</span>
                    <span className="tv-channel-group">{c.group}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
