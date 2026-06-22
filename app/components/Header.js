"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import SearchBox from "./SearchBox";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Prediction", href: "/live" },
  { label: "Schedule", href: "/calendar" },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    if (href === "#") return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleNavClick = (e, href) => {
    if (href === "/" && pathname === "/") {
      if (window.location.hash) {
        window.history.pushState(null, "", "/");
        window.dispatchEvent(new Event("hashchange"));
      }
    }
    setMenuOpen(false);
  };

  return (
    <>
      <header className="site-header">
        <div className="header-left">
          <Link href="/" className="logo" aria-label="Home" onClick={(e) => handleNavClick(e, "/")}>
            <svg viewBox="0 0 100 100" className="logo-mark" fill="none" aria-hidden="true">
              <path
                d="M8 8 H92 V41 L79 50 L92 59 V92 H8 V59 L21 50 L8 41 Z"
                stroke="#fff"
                strokeWidth="6"
                strokeLinejoin="miter"
              />
              <text x="50" y="32" className="logo-text">CR</text>
              <text x="50" y="70" className="logo-text">7</text>
            </svg>
          </Link>
          <nav className="nav-desktop">
            {NAV.map((item) => {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`nav-link${isActive(item.href) ? " is-active" : ""}`}
                  onClick={(e) => handleNavClick(e, item.href)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="header-right">
          <SearchBox onResultClick={() => setMenuOpen(false)} />
          <button
            type="button"
            className={`hamburger${menuOpen ? " is-open" : ""}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav className="nav-mobile">
          {NAV.map((item) => {
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`nav-mobile-link${isActive(item.href) ? " is-active" : ""}`}
                onClick={(e) => handleNavClick(e, item.href)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
