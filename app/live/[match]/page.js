"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import JitsiRoom from "../../components/JitsiRoom";
import { getMatch } from "../../data/channels";

export default function MatchChannel() {
  const params = useParams();
  const m = getMatch(params.match);

  if (!m) {
    return (
      <main className="live-page">
        <div className="live-head">
          <div>
            <span className="live-kicker">Live TV</span>
            <h1 className="live-title">Match not found</h1>
          </div>
          <Link href="/live" className="live-broadcast-link">
            ← All matches
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="live-page">
      <div className="live-head">
        <div>
          <span className="live-kicker">
            <span className="live-dot is-on" />
            Live TV
          </span>
          <h1 className="live-title fixture-title">
            {m.flag1 && <img src={m.flag1} alt="" className="channel-title-flag" />}
            {m.team1}
            <span className="fixture-title-vs"> vs </span>
            {m.team2}
            {m.flag2 && <img src={m.flag2} alt="" className="channel-title-flag channel-title-flag--right" />}
          </h1>
        </div>
        <Link href="/live" className="live-broadcast-link">
          ← All matches
        </Link>
      </div>

      <div className="live-stage">
        <JitsiRoom role="viewer" room={m.room} />
      </div>

      <p className="live-note">
        {m.date} · {m.time} · {m.group}. You join muted; the channel goes live when
        this match is being broadcast.
      </p>
    </main>
  );
}
