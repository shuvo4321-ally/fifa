import Link from "next/link";
import { LIVE_MATCHES } from "../data/channels";

export const metadata = {
  title: "Live TV — CRON",
  description: "Live match channels.",
};

export default function LiveTV() {
  return (
    <main className="live-page">
      <div className="live-head live-head--center">
        <div>
          <span className="live-kicker">
            <span className="live-dot is-on" />
            Live TV
          </span>
          <h1 className="live-title">Matches</h1>
        </div>
      </div>

      <div className="live-matches">
        {LIVE_MATCHES.map((m) => (
          <Link key={m.slug} href={`/live/${m.slug}`} className="fixture-card">
            <div className="fixture-card-top">
              <div className="fixture-card-team">
                {m.flag1 && <img src={m.flag1} alt="" className="fixture-card-flag" />}
                <span>{m.team1}</span>
              </div>
              <span className="fixture-card-vs">VS</span>
              <div className="fixture-card-team fixture-card-team--right">
                <span>{m.team2}</span>
                {m.flag2 && <img src={m.flag2} alt="" className="fixture-card-flag" />}
              </div>
            </div>
            <div className="fixture-card-meta">
              {m.date} · {m.time} · {m.stage}
            </div>
          </Link>
        ))}
      </div>

      <p className="live-note">
        Pick a match to open its channel — it plays automatically when that game is
        being broadcast.
      </p>
    </main>
  );
}
