"use client";

import Link from "next/link";
import { FIXTURES_2026, GROUPS_2026 } from "../data/schedule2026";
import KnockoutBracket from "../components/KnockoutBracket";
import { useGroupStandings } from "../lib/liveScores";
import { buildBracket } from "../lib/knockoutBracket";

export default function BracketPage() {
  // Live group tables → dynamic bracket. Re-renders on every score tick
  // (useGroupStandings subscribes to the shared poll), so the R32 teams
  // re-shuffle the moment a standing changes.
  const standings = useGroupStandings(GROUPS_2026, FIXTURES_2026);
  const { rounds } = buildBracket(standings, GROUPS_2026, FIXTURES_2026);

  return (
    <main className="kb-page">
      <div className="calendar-hero">
        <h1 className="calendar-hero-title">Knockout Bracket</h1>
        <p className="calendar-hero-subtitle">FIFA World Cup 2026™ · live from the tables</p>
        <div className="calendar-subnav unified-subnav" style={{ justifyContent: "center" }}>
          <Link href="/calendar" className="subnav-tab">Back to Calendar</Link>
        </div>
      </div>

      <div className="kb-wrap">
        <KnockoutBracket rounds={rounds} />
      </div>
    </main>
  );
}
