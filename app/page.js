"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Hero from "./components/Hero";
import MatchCard from "./components/MatchCard";

gsap.registerPlugin(ScrollTrigger);
import { TOURNAMENTS, HERO_SLIDES } from "./data/tournaments";

const LEGENDS = [
  {
    id: "messi",
    firstName: "Lionel",
    lastName: "MESSI",
    title: "Classic Players: Lionel Messi",
    subtitle: "Legend",
    description: "Witness the magic of Lionel Messi in action.",
    image: "/images/messi.jpg",
    source: "dailymotion",
    videoId: "x8qdamr"
  },
  {
    id: "pele",
    firstName: "",
    lastName: "PELÉ",
    title: "Classic Players: Pelé",
    subtitle: "Legend",
    description: "The King of Football.",
    image: "/images/pele.webp",
    source: "dailymotion",
    videoId: "x6amtxf"
  },
  {
    id: "ronaldo",
    firstName: "Ronaldo",
    lastName: "NAZÁRIO",
    title: "Classic Players: Ronaldo Nazário",
    subtitle: "Legend",
    description: "O Fenômeno. One of the greatest strikers to ever play the game.",
    image: "/images/ronaldo.jpg",
    source: "dailymotion",
    videoId: "x9qfdc8"
  },
  {
    id: "maradona",
    firstName: "Diego",
    lastName: "MARADONA",
    title: "Classic Players: Diego Maradona",
    subtitle: "Legend",
    description: "El Pibe de Oro. One of the greatest players in the history of football.",
    image: "/images/maradona.jpg",
    source: "dailymotion",
    videoId: "x982suy"
  }
];

function TournamentImg({ src }) {
  const [hidden, setHidden] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const img = ref.current;
    // Dead poster URLs often fail before React attaches onError (SSR / first
    // paint), which leaves the browser's broken-image glyph. Catch that on
    // mount and hide it so only the gradient placeholder shows.
    if (img && img.complete && img.naturalWidth === 0) setHidden(true);
  }, []);
  if (hidden || !src) return null;
  return (
    <img
      ref={ref}
      src={src}
      alt=""
      loading="lazy"
      className="tournament-img"
      onError={() => setHidden(true)}
    />
  );
}

export default function Home() {
  const [activeLegend, setActiveLegend] = useState(null);
  const playerRef = useRef(null);
  const scrollRef = useRef(null);
  const filmsScrollRef = useRef(null);
  const legendsSectionRef = useRef(null);
  const legendsBgRef = useRef(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const legend = LEGENDS.find(l => l.id === hash);
      if (legend && legend.source) setActiveLegend(legend);
    }
    const handleHashChange = () => {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash) {
        const legend = LEGENDS.find(l => l.id === currentHash);
        if (legend && legend.source) setActiveLegend(legend);
      } else {
        setActiveLegend(null);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const openLegend = (legend) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.location.hash = legend.id;
  };

  const backToHome = () => {
    if (window.location.hash) {
      window.history.back();
    } else {
      setActiveLegend(null);
    }
  };

  useGSAP(() => {
    // 1. Cinematic parallax for legends background
    if (legendsSectionRef.current && legendsBgRef.current) {
      gsap.fromTo(
        legendsBgRef.current,
        { scale: 1.0, yPercent: -10 },
        {
          scale: 1.15,
          yPercent: 10,
          ease: "none",
          scrollTrigger: {
            trigger: legendsSectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }

    // 2. Cinematic entrance for legends text
    if (legendsSectionRef.current) {
      const texts = legendsSectionRef.current.querySelectorAll('.films-eyebrow, .films-main-title, .films-description, .films-nav');
      gsap.fromTo(
        texts,
        { opacity: 0, y: 24, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.1,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: legendsSectionRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }
  }, { scope: legendsSectionRef });

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollFilms = (direction) => {
    if (filmsScrollRef.current) {
      const scrollAmount = 400;
      filmsScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };
  const handleMouseDown = (e, ref) => {
    if (!ref.current) return;
    ref.current.isDown = true;
    ref.current.startX = e.pageX - ref.current.offsetLeft;
    ref.current.scrollLeftStart = ref.current.scrollLeft;
    ref.current.style.scrollSnapType = 'none';
    ref.current.style.scrollBehavior = 'auto';
    isDraggingRef.current = false;
  };

  const handleMouseLeave = (ref) => {
    if (!ref.current) return;
    ref.current.isDown = false;
    ref.current.style.scrollSnapType = 'x mandatory';
    ref.current.style.scrollBehavior = 'smooth';
  };

  const handleMouseUp = (ref) => {
    if (!ref.current) return;
    ref.current.isDown = false;
    ref.current.style.scrollSnapType = 'x mandatory';
    ref.current.style.scrollBehavior = 'smooth';
    setTimeout(() => { isDraggingRef.current = false; }, 50);
  };

  const handleMouseMove = (e, ref) => {
    if (!ref.current || !ref.current.isDown) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - ref.current.startX) * 1.5;
    if (Math.abs(walk) > 5) {
      isDraggingRef.current = true;
    }
    ref.current.scrollLeft = ref.current.scrollLeftStart - walk;
  };

  return (
    <>
      {activeLegend ? (
        <div className="theater-mode">
          <div className="theater-container">
            <div className="theater-player-wrapper" ref={playerRef}>
              <iframe
                src={
                  activeLegend.source === 'youtube' 
                    ? `https://www.youtube.com/embed/${activeLegend.videoId}?autoplay=1` 
                    : activeLegend.source === 'dailymotion'
                      ? `https://geo.dailymotion.com/player.html?video=${activeLegend.videoId}&autoplay=true`
                      : ""
                }
                allowFullScreen="allowfullscreen"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                frameBorder="0"
                title={activeLegend.title}
                className="theater-iframe"
              />
            </div>
            <div className="theater-meta">
              <div className="meta-left">
                <h1>{activeLegend.title}</h1>
                <p>{activeLegend.subtitle}</p>
              </div>
            </div>
            <p className="theater-description">{activeLegend.description}</p>
            {LEGENDS.filter((l) => l.id !== activeLegend.id && l.source).length > 0 && (
              <section className="carousel-section" style={{ marginTop: "var(--space-8)" }}>
                <div className="carousel-header">
                  <h2 className="carousel-title">Related</h2>
                </div>
                <div className="calendar-grid">
                  {LEGENDS.filter((l) => l.id !== activeLegend.id && l.source).map((legend, i) => (
                    <MatchCard
                      key={i}
                      match={{...legend, thumbnail: legend.image}}
                      onPlay={() => openLegend(legend)}
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
          slides={HERO_SLIDES}
          pinned={true}
          onCta={() =>
            document
              .getElementById("tournaments")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        />

        <div className="home-content">
          <section className="carousel-section" id="tournaments">
            <div className="carousel-header">
              <h2 className="carousel-title">FIFA World Cup™ Editions</h2>
              <div className="carousel-nav">
                <button className="carousel-nav-btn" onClick={() => scroll('left')} style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <button className="carousel-nav-btn" onClick={() => scroll('right')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>
            <div 
              className="tournament-grid" 
              ref={scrollRef}
              onMouseDown={(e) => handleMouseDown(e, scrollRef)}
              onMouseLeave={() => handleMouseLeave(scrollRef)}
              onMouseUp={() => handleMouseUp(scrollRef)}
              onMouseMove={(e) => handleMouseMove(e, scrollRef)}
              style={{ cursor: 'grab' }}
            >
              {([...TOURNAMENTS].reverse()).map((t, i) =>
                t.slug ? (
                  <Link
                    key={i}
                    href={`/${t.slug}`}
                    className="tournament-card"
                    onClick={(e) => {
                      if (isDraggingRef.current) e.preventDefault();
                    }}
                  >
                    <div className="tournament-poster">
                      <TournamentImg src={t.thumbnail} />
                      <div className="tournament-scrim" />
                      <div className="tournament-fifa-badge">
                        <strong>FIFA</strong>
                      </div>
                    </div>
                    <h3 className="tournament-title">{t.title}</h3>
                  </Link>
                ) : (
                  <div key={i} className="tournament-card tournament-card--locked">
                    <div className="tournament-poster">
                      <TournamentImg src={t.thumbnail} />
                      <div className="tournament-scrim" />
                      <div className="tournament-fifa-badge">
                        <strong>FIFA</strong>
                      </div>
                      <div className="tournament-lock">Coming Soon</div>
                    </div>
                    <h3 className="tournament-title">{t.title}</h3>
                  </div>
                )
              )}
            </div>
          </section>
        </div>

        <section className="legends-section" ref={legendsSectionRef}>
          <div className="legends-bg">
            <img ref={legendsBgRef} src="/images/legends-bg.png" alt="Legends Background" className="legends-bg-img" />
            <div className="legends-bg-scrim"></div>
          </div>

          <div className="legends-content">
            <div className="films-header-area">
              <div className="films-text-area">
                <span className="films-eyebrow">LEGENDS</span>
                <h2 className="films-main-title">Icons of the game</h2>
                <p className="films-description">
                  From Pelé to Cristiano Ronaldo, witness the magic of football's all-time greats in action.
                </p>
              </div>
              <div className="carousel-nav films-nav">
                <button className="carousel-nav-btn" onClick={() => scrollFilms('left')} style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <button className="carousel-nav-btn" onClick={() => scrollFilms('right')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>

            <div 
              className="films-grid" 
              ref={filmsScrollRef}
              onMouseDown={(e) => handleMouseDown(e, filmsScrollRef)}
              onMouseLeave={() => handleMouseLeave(filmsScrollRef)}
              onMouseUp={() => handleMouseUp(filmsScrollRef)}
              onMouseMove={(e) => handleMouseMove(e, filmsScrollRef)}
              style={{ cursor: 'grab' }}
            >
              {LEGENDS.map((f, i) => (
                <div 
                  className="legend-card-container" 
                  key={i}
                  onClick={(e) => { 
                    if (isDraggingRef.current) {
                      e.preventDefault();
                      return;
                    }
                    if(f.source) openLegend(f); 
                  }}
                  style={{ cursor: f.source ? 'pointer' : 'grab' }}
                >
                  <div className="legend-card">
                    <img src={f.image} alt={f.lastName} className="legend-card-bg" />
                    <div className="legend-card-overlay"></div>
                    <div className="legend-card-content">
                      <div className="legend-card-top">
                        <span className="legend-tag">CLASSIC<br/>PLAYERS</span>
                        <span className="legend-badge">FIFA</span>
                      </div>
                      <div className="legend-card-bottom">
                        {f.firstName && <span className="legend-first-name">{f.firstName}</span>}
                        <span className="legend-last-name">{f.lastName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="film-footer">
                    <h4 className="film-subtitle">{f.title}</h4>
                    <p className="film-meta">FIFA</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      )}
    </>
  );
}
