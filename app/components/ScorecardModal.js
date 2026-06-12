"use client";

import { useState, useEffect } from 'react';
import { parseKickoff } from '../lib/matchTime';
import { useLiveScore } from '../lib/liveScores';

export default function ScorecardModal({ match, flag1, flag2, onClose }) {
  const [team1, team2] = match.match.split(" vs ").map((s) => s.trim());
  const [timeLeft, setTimeLeft] = useState("");
  // Same shared snapshot the fixtures + group table read from — one source of
  // truth (and the fixed name-matching), so the modal can't disagree with them.
  const live = useLiveScore(team1, team2);

  // Countdown for upcoming matches.
  useEffect(() => {
    const matchDateTime = parseKickoff(match.date, match.time);
    const updateTimer = () => {
      if (!matchDateTime) { setTimeLeft("—"); return; }
      const diff = matchDateTime.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Match time reached"); return; }
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

  const isLive = live && (live.status === 'IN_PLAY' || live.status === 'PAUSED');
  const hasScore =
    live && live.s1 != null && live.s2 != null &&
    (isLive || live.status === 'FINISHED');

  return (
    <div className="scorecard-overlay" onClick={onClose}>
      <div className={`scorecard-modal ${!hasScore ? 'countdown-modal' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="scorecard-close" onClick={onClose}>✕</button>

        {hasScore ? (
          // LIVE / FINISHED SCORECARD VIEW
          <div className="scorecard-header">
            <div className="scorecard-team scorecard-team-left">
              {flag1 && <img src={flag1} alt={team1} className="scorecard-flag" />}
              <h2>{team1}</h2>
            </div>

            <div className="scorecard-score-box">
              <div className={`scorecard-status ${isLive ? 'live-pulse' : ''}`}>
                {live.status === 'IN_PLAY' ? 'LIVE' : live.status === 'PAUSED' ? 'HT' : 'FT'}
              </div>
              <div className="scorecard-score">
                {live.s1} - {live.s2}
              </div>
              {live.minute && isLive && (
                <div className="scorecard-meta">{live.minute}</div>
              )}
            </div>

            <div className="scorecard-team scorecard-team-right">
              {flag2 && <img src={flag2} alt={team2} className="scorecard-flag" />}
              <h2>{team2}</h2>
            </div>
          </div>
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
