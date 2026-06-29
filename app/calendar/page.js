"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { GROUPS_2026, FIXTURES_2026 } from "../data/schedule2026";
const ScorecardModal = dynamic(() => import("../components/ScorecardModal"));
import LiveScoreInline from "../components/LiveScoreInline";
import { useGroupStandings } from "../lib/liveScores";
import { thirdAssignmentsByWinner, buildBracket } from "../lib/knockoutBracket";
const STAGES = ["Group Stage", "Round of 32", "Round of 16", "Quarter-Final", "Semi-Final", "Final"];

// "Group A" → "group-a" — anchor target for hero deep-links.
const groupSlug = (name) => (name || "").trim().toLowerCase().replace(/\s+/g, "-");

export default function Calendar() {
  const [activeStage, setActiveStage] = useState("Group Stage");
  const [selectedFixture, setSelectedFixture] = useState(null);
  // Group tables derived from the same match results the fixtures show — the two
  // can't disagree, and it drops the separate /api/standings call.
  const standings = useGroupStandings(GROUPS_2026, FIXTURES_2026);
  // winner-group-letter → third-placed opponent (same matching as the bracket).
  const thirds = thirdAssignmentsByWinner(standings, GROUPS_2026);
  // Full bracket with winner advancement (R32 → R16 → QF → SF → Final), used to
  // resolve R16+ fixtures live as each round's results land.
  const bracket = buildBracket(standings, GROUPS_2026, FIXTURES_2026);

  // Deep-link from the home hero: /calendar#group-a scrolls to that group's
  // table (the Group Stage view is the default, so the anchor exists on load).
  useEffect(() => {
    const id = decodeURIComponent((window.location.hash || "").replace("#", ""));
    if (!id) return;
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 350);
    return () => clearTimeout(t);
  }, []);

  const filteredFixtures = FIXTURES_2026.filter(f => f.stage === activeStage);

  const getFlag = (teamName) => {
    for (const group of GROUPS_2026) {
      const team = group.teams.find(t => t.name.trim() === teamName.trim());
      if (team) return team.flag;
    }
    return null;
  };

  // "B1" = Group B winner, "D2" = Group D runner-up → the live team from the
  // standings. Other placeholders (3rd X/Y/Z, Winner R32-N) stay as-is.
  const resolveSlot = (spec) => {
    const m = (spec || "").match(/^([A-L])([12])$/);
    if (!m) return spec;
    const rows = standings["Group " + m[1]];
    if (rows && rows.some((r) => r.gp > 0)) return rows[Number(m[2]) - 1]?.name || spec;
    return spec;
  };

  const renderMatchWithFlags = (fixture) => {
    const matchStr = typeof fixture === "string" ? fixture : fixture.match;
    if (!matchStr.includes(" vs "))
      return <span className="fixture-tbd">{matchStr}</span>;

    const [raw1, raw2] = matchStr.split(" vs ").map((s) => s.trim());
    let team1 = resolveSlot(raw1);
    let team2 = resolveSlot(raw2);
    const ref = typeof fixture === "object" ? fixture.ref : null;
    if (ref) {
      // R16+ : show the advanced winners once each round's results land,
      // otherwise the "Winner N" label stays.
      const m = bracket.rounds?.[ref.round]?.[ref.i];
      if (m?.s1 && !m.s1.tbd) team1 = m.s1.name;
      if (m?.s2 && !m.s2.tbd) team2 = m.s2.name;
    } else {
      // "E1 vs 3rd A/B/C/D/F": fill the third-place side from the bracket's
      // assignment (group winner is always the non-"3rd" side).
      const w1 = raw1.match(/^([A-L])1$/), w2 = raw2.match(/^([A-L])1$/);
      if (w1 && /^3rd/i.test(raw2) && thirds[w1[1]]) team2 = thirds[w1[1]];
      else if (w2 && /^3rd/i.test(raw1) && thirds[w2[1]]) team1 = thirds[w2[1]];
    }
    const flag1 = getFlag(team1);
    const flag2 = getFlag(team2);

    return (
      <div className="fixture-match-teams">
        <span className="fixture-team fixture-team--home">
          <span className="fixture-team-name">{team1}</span>
          {flag1 && <img src={flag1} alt="" className="flag-icon" loading="lazy" decoding="async" />}
        </span>
        <LiveScoreInline matchStr={`${team1} vs ${team2}`} />
        <span className="fixture-team fixture-team--away">
          {flag2 && <img src={flag2} alt="" className="flag-icon" loading="lazy" decoding="async" />}
          <span className="fixture-team-name">{team2}</span>
        </span>
      </div>
    );
  };

  return (
    <>
      <main className="calendar-layout">
        <div className="calendar-hero">
          <h1 className="calendar-hero-title">FIFA World Cup 2026™</h1>
          <p className="calendar-hero-subtitle">Groups & Fixtures Schedule</p>
          
          <div className="calendar-subnav unified-subnav">
            {STAGES.map(stage => (
              <button 
                key={stage}
                className={`subnav-tab ${activeStage === stage ? 'active' : ''}`}
                onClick={() => setActiveStage(stage)}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>

        <div className="calendar-content">
          {activeStage === "Group Stage" ? (
            <div className="unified-groups-grid">
              {GROUPS_2026.map((group, idx) => {
                const groupFixtures = FIXTURES_2026.filter(f => f.group === group.name);
                
                return (
                  <div key={idx} id={groupSlug(group.name)} className="unified-group-card">
                    <h3 className="group-title">{group.name}</h3>
                    <div className="unified-group-content">
                      <div className="group-table-wrapper">
                        <table className="group-table">
                          <thead>
                            <tr>
                              <th className="col-team">Team</th>
                              <th title="Matches Played">MP</th>
                              <th title="Won">W</th>
                              <th title="Drawn">D</th>
                              <th title="Lost">L</th>
                              <th title="Goal Difference">GD</th>
                              <th title="Points">Pts</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(standings?.[group.name] || group.teams.map((t) => ({ name: t.name }))).map((row, tIdx) => (
                              <tr key={row.name} className="team-row">
                                <td className="col-team">
                                  <span className="team-rank">{row.rank ?? tIdx + 1}</span>
                                  <img src={getFlag(row.name) || ""} alt={row.name} className="flag-icon-small" loading="lazy" decoding="async" />
                                  <span className="team-name">{row.name}</span>
                                </td>
                                <td>{row.gp ?? 0}</td>
                                <td>{row.w ?? 0}</td>
                                <td>{row.d ?? 0}</td>
                                <td>{row.l ?? 0}</td>
                                <td>{(row.gd ?? 0) > 0 ? `+${row.gd}` : row.gd ?? 0}</td>
                                <td>{row.pts ?? 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="group-fixtures-wrapper">
                        <div className="fixtures-list-mini">
                          {groupFixtures.map((fixture, i) => {
                            const [team1, team2] = fixture.match.includes(" vs ") ? fixture.match.split(" vs ") : [null, null];
                            const flag1 = team1 ? getFlag(team1) : null;
                            const flag2 = team2 ? getFlag(team2) : null;
                            
                            return (
                              <div 
                                key={i} 
                                className={`fixture-row-mini ${fixture.match.includes(" vs ") ? "clickable" : ""}`}
                                onClick={() => {
                                  if (fixture.match.includes(" vs ")) {
                                    setSelectedFixture({ ...fixture, flag1, flag2 });
                                  }
                                }}
                              >
                                <div className="mini-date-time">
                                  <span>{fixture.date}</span>
                                  <span>{fixture.time}</span>
                                </div>
                                <div className="mini-match">
                                  {renderMatchWithFlags(fixture)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="fixtures-list">
              <div className="fixtures-header">
                <div className="col-date">Date</div>
                <div className="col-match">Match</div>
                <div className="col-group">Group/Venue</div>
                <div className="col-time">Time (BD)</div>
              </div>
              
              {filteredFixtures.map((fixture, i) => {
                const [team1, team2] = fixture.match.includes(" vs ") ? fixture.match.split(" vs ") : [null, null];
                const flag1 = team1 ? getFlag(team1) : null;
                const flag2 = team2 ? getFlag(team2) : null;
                
                return (
                  <div 
                    key={i} 
                    className={`fixture-row ${fixture.match.includes(" vs ") ? "clickable" : ""}`}
                    onClick={() => {
                      if (fixture.match.includes(" vs ")) {
                        setSelectedFixture({ ...fixture, flag1, flag2 });
                      }
                    }}
                  >
                    <div className="col-date">{fixture.date}</div>
                    <div className="col-match">{renderMatchWithFlags(fixture)}</div>
                    <div className="col-group">{fixture.group}</div>
                    <div className="col-time">{fixture.time}</div>
                  </div>
                );
              })}
              
              {filteredFixtures.length === 0 && (
                <div className="empty-state">
                  <p>No fixtures found for this stage.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {selectedFixture && (
        <ScorecardModal 
          match={selectedFixture}
          flag1={selectedFixture.flag1}
          flag2={selectedFixture.flag2}
          onClose={() => setSelectedFixture(null)}
        />
      )}
    </>
  );
}
