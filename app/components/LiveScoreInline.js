"use client";

import { useState, useEffect } from "react";

export default function LiveScoreInline({ matchStr }) {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchStr.includes(" vs ")) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchScore = async () => {
      try {
        const res = await fetch(`/api/live-score?match=${encodeURIComponent(matchStr)}`);
        const data = await res.json();
        if (!isMounted) return;
        
        if (data && data.score && data.score.fullTime && data.score.fullTime.home !== null) {
          setScore(`${data.score.fullTime.home} - ${data.score.fullTime.away}`);
        } else {
          setScore("VS");
        }
      } catch (err) {
        if (isMounted) setScore("VS");
      }
      if (isMounted) setLoading(false);
    };

    fetchScore();
    
    return () => { isMounted = false; };
  }, [matchStr]);

  if (!matchStr.includes(" vs ")) return null;

  if (loading) {
    return <span className="fixture-vs">...</span>;
  }

  const isScore = score !== "VS";

  return (
    <span className="fixture-vs" style={{ 
      color: isScore ? "white" : "inherit", 
      fontSize: isScore ? "18px" : "inherit",
      fontWeight: isScore ? "900" : "800"
    }}>
      {score}
    </span>
  );
}
