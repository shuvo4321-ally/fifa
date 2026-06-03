"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import JitsiRoom from "../components/JitsiRoom";
import { LIVE_MATCHES } from "../data/channels";

// Hidden broadcaster page (not linked anywhere). Reachable only at /studio and
// gated by BROADCAST_PASSWORD in .env.local. Pick which match you're broadcasting.
export default function Studio() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [match, setMatch] = useState(null);

  useEffect(() => {
    if (sessionStorage.getItem("cron_broadcast_ok") === "1") setAuthed(true);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/broadcast-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) {
        sessionStorage.setItem("cron_broadcast_ok", "1");
        setAuthed(true);
      } else {
        setError(data.error || "Wrong password.");
      }
    } catch {
      setError("Could not verify — try again.");
    } finally {
      setBusy(false);
    }
  };

  // 1) Locked
  if (!authed) {
    return (
      <main className="live-page">
        <div className="live-head">
          <div>
            <span className="live-kicker">
              <span className="live-dot is-on" />
              Studio
            </span>
            <h1 className="live-title">Broadcaster sign-in</h1>
          </div>
        </div>
        <div className="live-stage">
          <form className="live-gate live-cover" onSubmit={submit}>
            <p className="live-overlay-title">Broadcaster sign-in</p>
            <p className="live-overlay-sub">Only you can start a stream.</p>
            <input
              type="password"
              className="search-input live-gate-input"
              placeholder="Broadcast password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button className="live-go" type="submit" disabled={busy}>
              {busy ? "Checking…" : "Unlock broadcast"}
            </button>
            {error && <span className="live-error">{error}</span>}
          </form>
        </div>
      </main>
    );
  }

  // 2) Choose which match to broadcast
  if (!match) {
    return (
      <main className="live-page">
        <div className="live-head">
          <div>
            <span className="live-kicker">
              <span className="live-dot is-on" />
              Studio
            </span>
            <h1 className="live-title">Pick a match to broadcast</h1>
          </div>
          <Link href="/live" className="live-broadcast-link">
            View public page →
          </Link>
        </div>
        <div className="live-matches">
          {LIVE_MATCHES.map((m) => (
            <button
              key={m.slug}
              className="fixture-card"
              onClick={() => setMatch(m)}
            >
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
            </button>
          ))}
        </div>
      </main>
    );
  }

  // 3) Broadcasting the chosen match
  return (
    <main className="live-page">
      <div className="live-head">
        <div>
          <span className="live-kicker">
            <span className="live-dot is-on" />
            On air · {match.team1} vs {match.team2}
          </span>
          <h1 className="live-title">Go live</h1>
        </div>
        <button
          className="live-broadcast-link live-switch"
          onClick={() => setMatch(null)}
        >
          ← Switch match
        </button>
      </div>

      <div className="live-stage">
        <JitsiRoom role="host" room={match.room} />
      </div>

      <p className="live-note">
        Broadcasting <strong>{match.team1} vs {match.team2}</strong> — viewers watch
        at <strong>/live/{match.slug}</strong>. Click the <strong>screen-share</strong>{" "}
        (monitor) icon to go live, or <strong>Settings → Camera → OBS Virtual
        Camera</strong>. If meet.jit.si asks, log in once to be the moderator.
      </p>
    </main>
  );
}
