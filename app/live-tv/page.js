"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import HlsPlayer from "../components/HlsPlayer";
import { TV_CHANNELS } from "../data/tvChannels";

const ALL = "All";
const sameChannel = (a, b) => !!a && !!b && a.url === b.url && a.name === b.name;

function initials(name) {
  const letters = (name || "").replace(/[^A-Za-z]/g, "");
  return (letters.slice(0, 2) || "TV").toUpperCase();
}

export default function LiveTvPage() {
  // Hand-picked channels stay pinned first; the IPTV playlist is appended once
  // /api/playlist responds (it's fetched live because its tokens expire).
  const [channels, setChannels] = useState(TV_CHANNELS);
  const [active, setActive] = useState(TV_CHANNELS[0] || null);
  const [group, setGroup] = useState(ALL);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/playlist")
      .then((r) => r.json())
      .then(({ channels: extra }) => {
        if (cancelled || !Array.isArray(extra) || !extra.length) return;
        setChannels([...TV_CHANNELS, ...extra]);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const groups = useMemo(() => {
    const counts = new Map();
    for (const c of channels) counts.set(c.group, (counts.get(c.group) || 0) + 1);
    return [[ALL, channels.length], ...counts];
  }, [channels]);

  const AVAILABLE_CHANNELS = useMemo(() => {
    const q = query.trim().toLowerCase();
    return channels.filter(
      (c) => (group === ALL || c.group === group) && (!q || c.name.toLowerCase().includes(q))
    );
  }, [channels, group, query]);
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
    if (!AVAILABLE_CHANNELS.length) return;
    const idx = AVAILABLE_CHANNELS.findIndex(c => sameChannel(c, active));
    const nextIdx = (idx + 1) % AVAILABLE_CHANNELS.length;
    setActive(AVAILABLE_CHANNELS[nextIdx]);
  };

  const handlePrev = () => {
    if (!active) return;
    if (!AVAILABLE_CHANNELS.length) return;
    const idx = AVAILABLE_CHANNELS.findIndex(c => sameChannel(c, active));
    const prevIdx = idx < 0 ? AVAILABLE_CHANNELS.length - 1 : (idx - 1 + AVAILABLE_CHANNELS.length) % AVAILABLE_CHANNELS.length;
    setActive(AVAILABLE_CHANNELS[prevIdx]);
  };

  const uniqueOrigins = Array.from(
    new Set(
      TV_CHANNELS
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
            <img src="/images/live-tv-popup.webp" alt="Live TV Popup" style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: "12px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)" }} />
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
              noProxy={active.no_proxy}
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
          </div>
        )}

        {channels.length > 1 && (
          <section className="livetv-guide">
            <div className="livetv-guide-head">
              <h2 className="livetv-guide-title">All channels</h2>
              <span className="livetv-guide-count">{AVAILABLE_CHANNELS.length} channels</span>
            </div>

            <input
              type="search"
              className="livetv-search"
              placeholder="Search channels…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="livetv-groups">
              {groups.map(([g, n]) => (
                <button
                  key={g}
                  className={`livetv-group${group === g ? " is-active" : ""}`}
                  onClick={() => setGroup(g)}
                >
                  {g} <span className="livetv-group-n">{n}</span>
                </button>
              ))}
            </div>

            <div className="tv-channels">
              {AVAILABLE_CHANNELS.map((c) => {
                const isActive = sameChannel(active, c);
                return (
                  <button
                    key={`${c.name}|${c.url}`}
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
