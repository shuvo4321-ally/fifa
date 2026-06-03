"use client";

import { useState } from "react";
import { GROUPS_2026, FIXTURES_2026 } from "../data/schedule2026";
import ScorecardModal from "../components/ScorecardModal";
const STAGES = ["All Matches", "Group Stage", "Round of 32", "Round of 16", "Quarter-Final", "Semi-Final", "Final"];

export default function Calendar() {
  const [view, setView] = useState("groups"); // 'groups' or 'fixtures'
  const [activeStage, setActiveStage] = useState("All Matches");
  const [selectedFixture, setSelectedFixture] = useState(null);

  const filteredFixtures = activeStage === "All Matches" 
    ? FIXTURES_2026 
    : FIXTURES_2026.filter(f => f.stage === activeStage);

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
          {flag1 && <img src={flag1} alt="" className="flag-icon" />}
        </span>
        <span className="fixture-vs">VS</span>
        <span className="fixture-team fixture-team--away">
          {flag2 && <img src={flag2} alt="" className="flag-icon" />}
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
          
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${view === "groups" ? "active" : ""}`}
              onClick={() => setView("groups")}
            >
              Group Stage
            </button>
            <button 
              className={`toggle-btn ${view === "fixtures" ? "active" : ""}`}
              onClick={() => setView("fixtures")}
            >
              Fixtures
            </button>
          </div>
        </div>

        <div className="calendar-content">
          {view === "groups" && (
            <div className="groups-grid">
              {GROUPS_2026.map((group, idx) => (
                <div key={idx} className="group-card">
                  <h3 className="group-title">{group.name}</h3>
                  <ul className="team-list">
                    {group.teams.map((team, tIdx) => (
                      <li key={tIdx} className="team-item">
                        <img src={team.flag} alt={team.name} className="flag-icon" />
                        <span className="team-name">{team.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {view === "fixtures" && (
            <>
              <div className="calendar-subnav">
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
            </>
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
