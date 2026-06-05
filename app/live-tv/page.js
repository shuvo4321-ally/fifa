"use client";

import { useState, useEffect } from "react";
import HlsPlayer from "../components/HlsPlayer";
import { TV_CHANNELS } from "../data/tvChannels";


export default function LiveTvPage() {
  const [active, setActive] = useState(TV_CHANNELS[0] || null);

  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem("hasSeenLiveTvPopup");
    if (!hasSeenPopup) {
      setShowPopup(true);
      localStorage.setItem("hasSeenLiveTvPopup", "true");
    }
  }, []);

  return (
    <>


      {showPopup && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }} onClick={() => setShowPopup(false)}>
          <div style={{ position: "relative", maxWidth: "100%", maxHeight: "100%", display: "flex", justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
            <img src="/images/live-tv-popup.png" alt="Live TV Popup" style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: "12px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)" }} />
            <button onClick={() => setShowPopup(false)} style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>
      )}

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
    </>
  );
}
