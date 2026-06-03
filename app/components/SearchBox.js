"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { TOURNAMENTS } from "../data/tournaments";

export default function SearchBox() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  // Focus the field when opening; clear the query when closing.
  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQ("");
  }, [open]);

  // Close on outside-click or Escape.
  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const query = q.trim().toLowerCase();
  // With no query, show what's actually watchable (the tournaments with a page).
  const results = query
    ? TOURNAMENTS.filter((t) => t.title.toLowerCase().includes(query))
    : TOURNAMENTS.filter((t) => t.slug);

  return (
    <div className="search-box" ref={boxRef}>
      <button
        className="icon-btn"
        aria-label="Search World Cups"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {open && (
        <div className="search-popover" role="dialog" aria-label="Search World Cups">
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder="Search World Cups…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <ul className="search-results">
            {results.length === 0 && (
              <li className="search-empty">No tournaments found</li>
            )}
            {results.map((t, i) =>
              t.slug ? (
                <li key={i}>
                  <Link
                    href={`/${t.slug}`}
                    className="search-result"
                    onClick={() => setOpen(false)}
                  >
                    {t.title}
                  </Link>
                </li>
              ) : (
                <li key={i} className="search-result search-result--soon">
                  {t.title}
                  <span>Coming soon</span>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
