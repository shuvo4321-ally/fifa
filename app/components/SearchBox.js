"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { TOURNAMENTS } from "../data/tournaments";
import { ALL_MATCHES } from "../data/allMatches";

export default function SearchBox({ onResultClick }) {
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
  const tournamentResults = query
    ? TOURNAMENTS.filter((t) => t.title.toLowerCase().includes(query))
    : TOURNAMENTS.filter((t) => t.slug);

  const matchResults = query
    ? ALL_MATCHES.filter(
        (m) =>
          m.title?.toLowerCase().includes(query) ||
          m.subtitle?.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query) ||
          m.year?.includes(query)
      )
    : [];

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
            placeholder="Search World Cups or Matches…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <ul className="search-results">
            {tournamentResults.length === 0 && matchResults.length === 0 && (
              <li className="search-empty">No results found</li>
            )}
            
            {tournamentResults.length > 0 && (
              <li style={{ padding: "8px 16px", fontSize: "12px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>
                Tournaments
              </li>
            )}
            {tournamentResults.map((t, i) =>
              t.slug ? (
                <li key={`t-${i}`}>
                  <Link
                    href={`/${t.slug}`}
                    className="search-result"
                    onClick={() => {
                      setOpen(false);
                      if (onResultClick) onResultClick();
                    }}
                  >
                    {t.title}
                  </Link>
                </li>
              ) : (
                <li key={`t-${i}`} className="search-result search-result--soon">
                  {t.title}
                  <span>Coming soon</span>
                </li>
              )
            )}

            {matchResults.length > 0 && (
              <li style={{ padding: "8px 16px", fontSize: "12px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>
                Matches
              </li>
            )}
            {matchResults.map((m, i) => (
              <li key={`m-${i}`}>
                <Link
                  href={`/${m.year}#${m.id}`}
                  className="search-result"
                  onClick={() => {
                    setOpen(false);
                    if (onResultClick) onResultClick();
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span>{m.title}</span>
                    <span style={{ fontSize: "0.8em", color: "rgba(255,255,255,0.6)" }}>
                      {m.year} • {m.stage || m.type}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
