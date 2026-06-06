"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { GROUPS_2026, FIXTURES_2026 } from "../data/schedule2026";
const ScorecardModal = dynamic(() => import("../components/ScorecardModal"));
import LiveScoreInline from "../components/LiveScoreInline";
const STAGES = ["Group Stage", "Round of 32", "Round of 16", "Quarter-Final", "Semi-Final", "Final"];

export default function Calendar() {
  const [activeStage, setActiveStage] = useState("Group Stage");
  const [selectedFixture, setSelectedFixture] = useState(null);

  const filteredFixtures = FIXTURES_2026.filter(f => f.stage === activeStage);

  const getFlag = (teamName) => {
    for (const group of GROUPS_2026) {
      const team = group.teams.find(t => t.name.trim() === teamName.trim());
      if (team) return team.flag;
    }
    return null;
  };

  const renderMatchWithFlags = (matchStr) => {
    if (!matchStr.includes(" vs "))
      return <span className="fixture-tbd">{matchStr}</span>;

    const [team1, team2] = matchStr.split(" vs ").map((s) => s.trim());
    const flag1 = getFlag(team1);
    const flag2 = getFlag(team2);

    return (
      <div className="fixture-match-teams">
        <span className="fixture-team fixture-team--home">
          <span className="fixture-team-name">{team1}</span>
          {flag1 && <img src={flag1} alt="" className="flag-icon" loading="lazy" decoding="async" />}
        </span>
        <LiveScoreInline matchStr={matchStr} />
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
                  <div key={idx} className="unified-group-card">
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
                            {group.teams.map((team, tIdx) => (
                              <tr key={tIdx} className="team-row">
                                <td className="col-team">
                                  <span className="team-rank">{tIdx + 1}</span>
                                  <img src={team.flag} alt={team.name} className="flag-icon-small" loading="lazy" decoding="async" />
                                  <span className="team-name">{team.name}</span>
                                </td>
                                <td>0</td>
                                <td>0</td>
                                <td>0</td>
                                <td>0</td>
                                <td>0</td>
                                <td>0</td>
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
                                  {renderMatchWithFlags(fixture.match)}
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
                    <div className="col-match">{renderMatchWithFlags(fixture.match)}</div>
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
