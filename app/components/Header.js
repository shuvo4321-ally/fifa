"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBox from "./SearchBox";

const NAV = [
  { label: "Home", href: "/" },
  { label: "All sports", href: "#", caret: true },
  { label: "Live TV", href: "/live" },
  { label: "Schedule", href: "/calendar" },
];

export default function Header() {
  const pathname = usePathname();
  const isActive = (href) =>
    href === "/" ? pathname === "/" : href !== "#" && pathname.startsWith(href);

  return (
    <header className="site-header">
      <div className="header-left">
        <Link href="/" className="logo" aria-label="CRON — Home">
          CRON
        </Link>
        <nav>
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`nav-link${isActive(item.href) ? " is-active" : ""}`}
            >
              {item.label}
              {item.caret && (
                <span className="nav-caret" aria-hidden="true">
                  ▾
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      <div className="header-right">
        <SearchBox />
      </div>
    </header>
  );
}
