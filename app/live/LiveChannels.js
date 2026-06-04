"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LIVE_MATCHES } from "../data/channels";

export default function LiveChannels() {
  const [liveSlug, setLiveSlug] = useState(null);

  // Poll the broadcast lock so each channel shows real LIVE / OFFLINE status.
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const r = await fetch("/api/broadcast", { cache: "no-store" });
        const d = await r.json();
        if (!stop) setLiveSlug(d.liveSlug || null);
      } catch {}
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  const liveMatch = LIVE_MATCHES.find((m) => m.slug === liveSlug);

  return (
    <>
      {liveMatch && (
        <Link href={`/live/${liveMatch.slug}`} className="live-featured">
          <span className="live-featured-now">
            <span className="live-dot is-on" />
            Now live
          </span>
          <span className="live-featured-title">
            {liveMatch.team1} vs {liveMatch.team2}
          </span>
          <span className="channel-cta">Watch →</span>
        </Link>
      )}

      <div className="live-matches">
        {LIVE_MATCHES.map((m) => {
          const live = m.slug === liveSlug;
          return (
            <Link
              key={m.slug}
              href={`/live/${m.slug}`}
              className={`channel-card${live ? " is-live" : ""}`}
            >
              <div className="channel-card-head">
                <span className="channel-stage">{m.stage}</span>
                <span className={`channel-status${live ? " is-live" : ""}`}>
                  <span className={`live-dot${live ? " is-on" : ""}`} />
                  {live ? "Live" : "Offline"}
                </span>
              </div>
              <div className="channel-card-teams">
                <div className="channel-team">
                  {m.flag1 && <img src={m.flag1} alt="" className="channel-flag" />}
                  <span>{m.team1}</span>
                </div>
                <span className="channel-vs">VS</span>
                <div className="channel-team channel-team--right">
                  <span>{m.team2}</span>
                  {m.flag2 && <img src={m.flag2} alt="" className="channel-flag" />}
                </div>
              </div>
              <div className="channel-card-foot">
                <span className="channel-time">
                  {m.date} · {m.time}
                </span>
                <span className="channel-cta">{live ? "Watch →" : "Open →"}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
