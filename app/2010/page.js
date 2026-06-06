"use client";

import { useState, useEffect, useRef } from "react";
import MatchCard from "../components/MatchCard";
import Hero from "../components/Hero";
import useMediaQuery from "../lib/useMediaQuery";
import { MATCHES, HERO } from "../data/matches2010";

export default function WorldCup2010() {
  const [activeMatch, setActiveMatch] = useState(null);
  const playerRef = useRef(null);
  // Phones block autoplay-with-sound (and in-app browsers hang on the attempt),
  // so on mobile we let the player show a clean tap-to-play instead.
  const isMobile = useMediaQuery("(max-width: 640px)");

  const openMatch = (match) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setActiveMatch(match);
    window.location.hash = match.id;
  };

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const match = MATCHES.find(m => m.id === hash);
      if (match) {
        setActiveMatch(match);
      }
    }
    
    const handleHashChange = () => {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash) {
        const match = MATCHES.find(m => m.id === currentHash);
        if (match) {
          setActiveMatch(match);
        }
      } else {
        setActiveMatch(null);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  
  const activeIndex = activeMatch ? MATCHES.indexOf(activeMatch) : -1;
  const nextMatch =
    activeIndex >= 0 ? MATCHES[(activeIndex + 1) % MATCHES.length] : null;

  useEffect(() => {
    if (!activeMatch) return;
    
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
