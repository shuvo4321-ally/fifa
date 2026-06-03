"use client";

import { useEffect, useRef } from "react";

export default function Hero({ hero }) {
  const bgRef = useRef(null);
  const contentRef = useRef(null);

  // Premium parallax: the hero is pinned (sticky) while the content scrolls up
  // over it. On scroll the background slowly fades out and zooms a touch — a
  // cinematic recede — and the title lifts + fades. Opacity + transform are
  // GPU-composited, so it stays smooth on phones.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight || 1;
      const p = Math.min(Math.max(window.scrollY / vh, 0), 1); // 0 → 1 over one screen
      if (bgRef.current) {
        bgRef.current.style.opacity = `${1 - p}`;
        bgRef.current.style.transform = `scale(${1 + p * 0.1})`;
      }
      if (contentRef.current) {
        contentRef.current.style.opacity = `${1 - p * 1.3}`;
        contentRef.current.style.transform = `translate3d(0, ${-p * 32}px, 0)`;
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="hero" aria-label={hero.title}>
      <div
        className="hero-bg"
        ref={bgRef}
        style={{ backgroundImage: `url('${hero.image}')` }}
      />
      <div className="hero-scrim" />
      <div className="hero-content" ref={contentRef}>
        {hero.eyebrow && <div className="hero-eyebrow">{hero.eyebrow}</div>}
        <h1 className="hero-title">{hero.title}</h1>
        {hero.description && <p className="hero-desc">{hero.description}</p>}
      </div>
    </section>
  );
}
