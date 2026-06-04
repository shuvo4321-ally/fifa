"use client";

import { useState, useEffect } from 'react';
import { parseKickoff } from '../lib/matchTime';

export default function ScorecardModal({ match, flag1, flag2, onClose }) {
  const [team1, team2] = match.match.split(" vs ");
  const [timeLeft, setTimeLeft] = useState("");
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Countdown timer logic
  useEffect(() => {
    const matchDateTime = parseKickoff(match.date, match.time);
    const updateTimer = () => {
      if (!matchDateTime) {
        setTimeLeft("—");
        return;
      }
      const now = new Date();
      const diff = matchDateTime.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("Match time reached");
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

  // Fetch real API data
  useEffect(() => {
    async function fetchLiveScore() {
      try {
        const res = await fetch(`/api/live-score?match=${encodeURIComponent(match.match)}`);
        const data = await res.json();
        setApiData(data);
      } catch (err) {
        console.error("Failed to fetch live score", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLiveScore();
    // Refresh every 30 seconds if modal is open
    const interval = setInterval(fetchLiveScore, 30000);
    return () => clearInterval(interval);
  }, [match.match]);

  const isLiveOrFinished = apiData && (apiData.status === 'IN_PLAY' || apiData.status === 'PAUSED' || apiData.status === 'FINISHED');

  return (
    <div className="scorecard-overlay" onClick={onClose}>
      <div className={`scorecard-modal ${!isLiveOrFinished ? 'countdown-modal' : ''}`} onClick={e => e.stopPropagation()}>
        <button className="scorecard-close" onClick={onClose}>✕</button>
        
        {loading ? (
          <div className="scorecard-loading">Loading live data...</div>
        ) : isLiveOrFinished ? (
          // LIVE SCORECARD VIEW
          <>
            <div className="scorecard-header">
              <div className="scorecard-team scorecard-team-left">
                {flag1 && <img src={flag1} alt={team1} className="scorecard-flag" />}
                <h2>{apiData.homeTeam?.name || team1}</h2>
              </div>
              
              <div className="scorecard-score-box">
                <div className="scorecard-status live-pulse">
                  {apiData.status === 'IN_PLAY' ? 'LIVE' : apiData.status}
                </div>
                <div className="scorecard-score">
                  {apiData.score?.fullTime?.home ?? 0} - {apiData.score?.fullTime?.away ?? 0}
                </div>
                {apiData.score?.halfTime?.home !== null && (
                  <div className="scorecard-meta">
                    HT: {apiData.score.halfTime.home} - {apiData.score.halfTime.away}
                  </div>
                )}
              </div>
              
              <div className="scorecard-team scorecard-team-right">
                {flag2 && <img src={flag2} alt={team2} className="scorecard-flag" />}
                <h2>{apiData.awayTeam?.name || team2}</h2>
              </div>
            </div>
          </>
        ) : (
          // COUNTDOWN VIEW
          <div className="scorecard-header countdown-header">
            <div className="scorecard-team scorecard-team-left">
              {flag1 && <img src={flag1} alt={team1} className="scorecard-flag" />}
              <h2>{team1}</h2>
            </div>
            
            <div className="scorecard-score-box countdown-box">
              <div className="scorecard-status">Upcoming Match</div>
              <div className="countdown-timer">
                <span>{timeLeft}</span>
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
        )}
      </div>
    </div>
  );
}
