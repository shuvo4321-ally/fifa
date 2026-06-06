"use client";

import Image from "next/image";

export default function MatchCard({ match, onPlay }) {
  return (
    <article className="match-card">
      <div className="frame">
        <a
          className="poster"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (onPlay) onPlay(match);
          }}
        >
          <Image 
            src={match.thumbnail} 
            alt={match.title || "Match thumbnail"} 
            fill={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="poster-img" 
          />
          
          {match.date && <div className="date-pill">{match.date}</div>}
        </a>
      </div>
      <div className="match-meta">
        <h2>{match.title}</h2>
        <p>{match.subtitle}</p>
        {match.type && (
          <div className="match-type-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/>
            </svg>
            {match.type}
          </div>
        )}
      </div>
    </article>
  );
}
