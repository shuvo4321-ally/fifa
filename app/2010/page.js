"use client";

import { useState, useEffect, useRef } from "react";
import MatchCard from "../components/MatchCard";
import Hero from "../components/Hero";
import { MATCHES, HERO } from "../data/matches2010";

const UP_NEXT_AFTER_MS = 30000;

export default function WorldCup2010() {
  const [activeMatch, setActiveMatch] = useState(null);
  const [showUpNext, setShowUpNext] = useState(false);
  const playerRef = useRef(null);
  // Phones block autoplay-with-sound (and in-app browsers hang on the attempt),
  // so on mobile we let the player show a clean tap-to-play instead.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.matchMedia("(max-width: 640px)").matches);
  }, []);

  const openMatch = (match) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setShowUpNext(false);
    setActiveMatch(match);
  };

  const backToHome = () => {
    setShowUpNext(false);
    setActiveMatch(null);
  };

  
  const activeIndex = activeMatch ? MATCHES.indexOf(activeMatch) : -1;
  const nextMatch =
    activeIndex >= 0 ? MATCHES[(activeIndex + 1) % MATCHES.length] : null;

  useEffect(() => {
    if (!activeMatch) return;
    setShowUpNext(false);
    
    let transitioned = false;

    const handleMessage = (event) => {
      if (transitioned) return;
      try {
        let isVideoEnd = false;
        let msg = event.data;
        
        // Parse JSON strings just in case Dailymotion sends them
        if (typeof msg === 'string' && msg.trim().startsWith('{')) {
          try { msg = JSON.parse(msg); } catch (e) {}
        }

        if (typeof msg === 'string') {
          if (msg.includes('event=end') || msg.includes('event=video_end')) {
            isVideoEnd = true;
          } else if (msg.includes('event=timeupdate')) {
            const matchTime = msg.match(/time=([0-9.]+)/);
            if (matchTime) {
              const time = parseFloat(matchTime[1]);
              if (activeMatch.endAt && time >= activeMatch.endAt) {
                isVideoEnd = true;
              }
            }
          }
        } 
        
        if (typeof msg === 'object' && msg !== null) {
          if (msg.event === 'end' || msg.event === 'video_end') {
            isVideoEnd = true;
          } else if (msg.event === 'timeupdate') {
            if (msg.time !== undefined) {
              const time = parseFloat(msg.time);
              if (activeMatch.endAt && time >= activeMatch.endAt) {
                isVideoEnd = true;
              }
            }
          }
        }
        
        if (isVideoEnd && nextMatch) {
          transitioned = true;
          openMatch(nextMatch); // Transition instantly
        }
      } catch (e) {}
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [activeMatch, nextMatch]);

  return (
    <>
      {activeMatch ? (
        <div className="theater-mode">
          <div className="theater-container">
            <div className="theater-player-wrapper" ref={playerRef}>

              <iframe
                src={activeMatch.source === 'dailymotion' ? `https://www.dailymotion.com/embed/video/${activeMatch.id}?api=1&id=dmplayer&origin=${typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''}&autoplay=${isMobile ? "false" : "true"}&mute=false&queue-enable=false&queue-autoplay-next=false&endscreen-enable=false&ui-logo=false&info=0&logo=0&watermark=0` : activeMatch.source === 'filemoon' ? `https://filemoon.org/e/${activeMatch.id}` : activeMatch.source === 'voe' ? `https://voe.sx/e/${activeMatch.id}` : `https://geo.dailymotion.com/player.html?video=${activeMatch.id}&autoplay=true`}
                allowFullScreen="allowfullscreen"
                webkitallowfullscreen="true"
                mozallowfullscreen="true"
                allowtransparency="true"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                scrolling="no"
                frameBorder="0"
                title={activeMatch.title}
                className="theater-iframe"
              />

              

              {showUpNext && nextMatch && (
                <div className="upnext-overlay" onClick={() => setShowUpNext(false)}>
                  <button
                    className="upnext-close"
                    aria-label="Dismiss"
                    onClick={() => setShowUpNext(false)}
                  >
                    ✕
                  </button>



                  <div className="upnext-panel">
                    <span className="upnext-label">Up next</span>
                    <button
                      className="upnext-card"
                      onClick={() => openMatch(nextMatch)}
                    >
                      <img src={nextMatch.thumbnail} alt="" className="upnext-thumb" />
                      <div className="upnext-text">
                        <strong>{nextMatch.title}</strong>
                        <span>{nextMatch.subtitle}</span>
                      </div>
                    </button>
                    <button className="upnext-home" onClick={backToHome}>
                      Back to home
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="theater-meta">
              <div className="meta-left">
                <h1>{activeMatch.title}</h1>
                <p>{activeMatch.subtitle}</p>
              </div>
            </div>

            <p className="theater-description">{activeMatch.description}</p>

            {MATCHES.filter((m) => m.id !== activeMatch.id).length > 0 && (
              <section className="carousel-section" style={{ marginTop: "var(--space-8)" }}>
                <div className="carousel-header">
                  <h2 className="carousel-title">Related</h2>
                </div>
                <div className="calendar-grid">
                  {MATCHES.filter((m) => m.id !== activeMatch.id).map((match, i) => (
                    <MatchCard
                      key={i}
                      match={match}
                      onPlay={() => openMatch(match)}
                    />
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      ) : (
        <main className="home">
          <Hero
            hero={HERO}
            onCta={() =>
              document
                .getElementById("home-matches")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          />

          <div className="home-content">
            <section className="carousel-section" id="home-matches">
              <div className="carousel-header">
                <h2 className="carousel-title">Full Event Replays &amp; Highlights</h2>
              </div>
              <div className="calendar-grid">
                {MATCHES.map((match, i) => (
                  <MatchCard
                    key={i}
                    match={match}
                    onPlay={() => openMatch(match)}
                  />
                ))}
              </div>
            </section>
          </div>
        </main>
      )}
    </>
  );
}
