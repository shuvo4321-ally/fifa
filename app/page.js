"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Hero from "./components/Hero";

gsap.registerPlugin(ScrollTrigger);
import { TOURNAMENTS, HERO_SLIDES } from "./data/tournaments";

const LEGENDS = [
  {
    firstName: "Lionel",
    lastName: "MESSI",
    title: "Classic Players: Lionel Messi",
    image: "https://images.unsplash.com/photo-1551280857-2b9bbe5204f6?q=80&w=800&auto=format&fit=crop",
  },
  {
    firstName: "",
    lastName: "PELÉ",
    title: "Classic Players: Pelé",
    image: "https://images.unsplash.com/photo-1508344928928-7165b67de128?q=80&w=800&auto=format&fit=crop",
  },
  {
    firstName: "Cristiano",
    lastName: "RONALDO",
    title: "Classic Players: Cristiano Ronaldo",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop",
  },
  {
    firstName: "Johan",
    lastName: "Cruyff",
    title: "Classic Players: Johan Cruyff",
    image: "https://images.unsplash.com/photo-1518605368461-1e9de4504eb9?q=80&w=800&auto=format&fit=crop",
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
  if (hidden) return null;
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
  const scrollRef = useRef(null);
  const filmsScrollRef = useRef(null);
  const legendsSectionRef = useRef(null);
  const legendsBgRef = useRef(null);

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
  };

  const handleMouseMove = (e, ref) => {
    if (!ref.current || !ref.current.isDown) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - ref.current.startX) * 1.5;
    ref.current.scrollLeft = ref.current.scrollLeftStart - walk;
  };

  return (
    <>
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
              {TOURNAMENTS.map((t, i) =>
                t.slug ? (
                  <Link
                    key={i}
                    href={`/${t.slug}`}
                    className="tournament-card"
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
            <img ref={legendsBgRef} src="https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=2400&auto=format&fit=crop" alt="Legends Background" className="legends-bg-img" />
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
                <div className="legend-card-container" key={i}>
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
    </>
  );
}
