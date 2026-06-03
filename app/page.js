"use client";

import Link from "next/link";
import Hero from "./components/Hero";
import { TOURNAMENTS, HOME_HERO } from "./data/tournaments";

export default function Home() {
  return (
    <>
      <main className="home">
        <Hero
          hero={HOME_HERO}
          onCta={() =>
            document
              .getElementById("tournaments")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        />

        <div className="home-content">
          <section className="carousel-section" id="tournaments">
            <div className="carousel-header">
              <h2 className="carousel-title">FIFA World Cup™ Archive</h2>
            </div>
            <div className="tournament-grid">
              {TOURNAMENTS.map((t, i) =>
                t.slug ? (
                  <Link
                    key={i}
                    href={`/${t.slug}`}
                    className="tournament-card"
                  >
                    <div className="tournament-poster">
                      <img
                        src={t.thumbnail}
                        alt=""
                        loading="lazy"
                        className="tournament-img"
                      />
                      <div className="tournament-scrim" />
                      <div className="tournament-fifa-badge">
                        <strong>FIFA+</strong>
                      </div>
                    </div>
                    <h3 className="tournament-title">{t.title}</h3>
                  </Link>
                ) : (
                  <div key={i} className="tournament-card tournament-card--locked">
                    <div className="tournament-poster">
                      <img
                        src={t.thumbnail}
                        alt=""
                        loading="lazy"
                        className="tournament-img"
                      />
                      <div className="tournament-scrim" />
                      <div className="tournament-fifa-badge">
                        <strong>FIFA+</strong>
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
      </main>
    </>
  );
}
