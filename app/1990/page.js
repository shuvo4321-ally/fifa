"use client";

import { useState, useEffect } from "react";
import MatchCard from "../components/MatchCard";
import Hero from "../components/Hero";
import { MATCHES, HERO } from "../data/matches1990";

const UP_NEXT_AFTER_MS = 30000;

export default function WorldCup1990() {
  const [activeMatch, setActiveMatch] = useState(null);
  const [showUpNext, setShowUpNext] = useState(false);

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
    const t = setTimeout(() => setShowUpNext(true), UP_NEXT_AFTER_MS);
    return () => clearTimeout(t);
  }, [activeMatch]);

  return (
    <>
      {activeMatch ? (
        <div className="theater-mode">
          <div className="theater-container">
            <div className="theater-player-wrapper">
              <img src={activeMatch.thumbnail} alt="" className="theater-poster" />
              <iframe
                src={activeMatch.source === 'filemoon' ? `https://filemoon.org/e/${activeMatch.id}` : activeMatch.source === 'voe' ? `https://voe.sx/e/${activeMatch.id}` : `https://streamtape.com/e/${activeMatch.id}`}
                allowFullScreen
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
