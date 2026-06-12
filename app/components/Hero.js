"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import HeroMatchRow from "./HeroMatchRow";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export default function Hero({ hero, slides, today, pinned = false, onCta }) {
  const heroRef = useRef(null);
  const bgRef = useRef(null);
  const contentRef = useRef(null);

  const isCarousel = Array.isArray(slides) && slides.length > 1;
  const [active, setActive] = useState(0);
  const current = isCarousel ? slides[active] : hero;
  const layers = isCarousel ? slides : [current];
  const dotCount = isCarousel ? slides.length : 5;
  const activeIndex = isCarousel ? active : 0;

  // Swipe (touch) / drag (mouse) to change slide — one path via pointer events.
  const swipe = useRef(null);
  const onPointerDown = (e) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e) => {
    if (!swipe.current) return;
    const dx = e.clientX - swipe.current.x;
    const dy = e.clientY - swipe.current.y;
    swipe.current = null;
    // Horizontal swipe past the threshold, and clearly horizontal (not a scroll).
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      setActive((a) => (a + (dx < 0 ? 1 : -1) + slides.length) % slides.length);
    }
  };

  // Auto-rotate; the timer resets whenever the slide changes (manual or auto),
  // so a swipe/tap gives you a fresh 6s before it advances on its own.
  useEffect(() => {
    if (!isCarousel) return;
    const id = setTimeout(
      () => setActive((a) => (a + 1) % slides.length),
      6000
    );
    return () => clearTimeout(id);
  }, [isCarousel, slides, active]);

  useGSAP(
    () => {
      // Background zoom-in entrance (all viewports — it never hides the text).
      gsap.fromTo(
        bgRef.current,
        { scale: 1.12 },
        { scale: 1.0, duration: 2.6, ease: "power2.out" }
      );

      // Text/scroll-driven animations run on DESKTOP ONLY — on phones the short
      // hero would otherwise fade the copy to near-invisible (see mobile notes).
      const mm = gsap.matchMedia();
      mm.add("(min-width: 641px)", () => {
        const elements = contentRef.current.children;
        if (elements.length > 0) {
          gsap.fromTo(
            elements,
            { opacity: 0, y: 28, filter: "blur(8px)" },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 1.1,
              stagger: 0.12,
              delay: 0.3,
              ease: "power3.out",
            }
          );
        }

        gsap.fromTo(
          contentRef.current,
          { opacity: 1, y: 0, filter: "blur(0px)" },
          {
            opacity: 0,
            y: -36,
            filter: "blur(6px)",
            ease: "power2.in",
            immediateRender: false,
            scrollTrigger: {
              trigger: heroRef.current,
              start: "bottom bottom",
              end: "bottom 55%",
              scrub: 0.6,
            },
          }
        );

        gsap.to(bgRef.current, {
          scale: 1.18,
          yPercent: -12,
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    },
    { scope: heroRef, dependencies: [pinned] }
  );

  return (
    <section
      className="hero"
      aria-label={current.title}
      ref={heroRef}
      onPointerDown={isCarousel ? onPointerDown : undefined}
      onPointerUp={isCarousel ? onPointerUp : undefined}
      style={isCarousel ? { touchAction: "pan-y", userSelect: "none", cursor: "grab" } : undefined}
    >
      <div className="hero-bg" ref={bgRef}>
        {layers.map((s, i) => (
          <div
            key={i}
            className="hero-bg-img"
            style={{
              '--bg-desktop': `url('${s.image}')`,
              '--bg-mobile': `url('${s.mobileImage || s.image}')`,
              backgroundImage: 'var(--bg-desktop)',
              opacity: i === activeIndex ? 1 : 0,
            }}
          />
        ))}
      </div>
      <div className="hero-scrim" />
      <div className={`hero-content ${pinned ? "centered" : ""}`} ref={contentRef}>
        {current.eyebrow && (
          <div className="hero-eyebrow">
            {current.eyebrow}
            <span className="hero-eyebrow-tm">™</span>
          </div>
        )}
        <h1 className="hero-title">{current.title}</h1>
        {/* Today's fixtures — fixed across all slides so it's always visible. */}
        {today && today.rows && today.rows.length > 0 ? (
          <div className="hero-fixtures">
            <span className="hero-fixtures-head">{today.heading}</span>
            <div className="hero-today">
              {today.rows.map((m, i) => (
                <HeroMatchRow key={i} m={m} />
              ))}
              <Link href="/live-tv" className="hero-today-cta">
                {today.moreCount > 0 ? `+${today.moreCount} more · Watch Now →` : "Watch Now →"}
              </Link>
            </div>
          </div>
        ) : (
          current.description && <p className="hero-desc">{current.description}</p>
        )}
        {isCarousel && (
          <div className="hero-dots">
            {Array.from({ length: dotCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                className={`hero-dot${i === activeIndex ? " active" : ""}`}
                onClick={() => setActive(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
