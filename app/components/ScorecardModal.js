"use client";

import { useState, useEffect } from 'react';

export default function ScorecardModal({ match, flag1, flag2, onClose }) {
  const [team1, team2] = match.match.split(" vs ");
  const [timeLeft, setTimeLeft] = useState("");
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Parse match date and time (e.g., "Jun 12, 2026" and "01:00 AM")
    const matchDateTime = new Date(`${match.date} ${match.time}`);

    const updateTimer = () => {
      const now = new Date();
      const diff = matchDateTime - now;

      if (diff <= 0) {
        setIsLive(true);
        setTimeLeft("Match has started / Finished");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${days}d ${hours}h ${mins}m ${secs}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [match]);

  return (
    <div className="scorecard-overlay" onClick={onClose}>
      <div className="scorecard-modal countdown-modal" onClick={e => e.stopPropagation()}>
        <button className="scorecard-close" onClick={onClose}>✕</button>
        
        <div className="scorecard-header countdown-header">
          <div className="scorecard-team scorecard-team-left">
            {flag1 && <img src={flag1} alt={team1} className="scorecard-flag" />}
            <h2>{team1}</h2>
          </div>
          
          <div className="scorecard-score-box countdown-box">
            <div className="scorecard-status">Upcoming Match</div>
            <div className="countdown-timer">
              {isLive ? (
                <span className="live-pulse">LIVE / ENDED</span>
              ) : (
                <span>{timeLeft}</span>
              )}
            </div>
            <div className="countdown-meta">
              {match.date} • {match.time} (BD)
              <br />
              {match.group}
            </div>
          </div>
          
          <div className="scorecard-team scorecard-team-right">
            {flag2 && <img src={flag2} alt={team2} className="scorecard-flag" />}
            <h2>{team2}</h2>
          </div>
        </div>
      </div>
    </div>
  );
}
