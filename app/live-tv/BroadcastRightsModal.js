"use client";

const CHANNELS = [
  { name: "BTV", logo: "https://s3.aynaott.com/storage/00da8a07fb26b2fb79359ee535e4c7bc" },
  { name: "T Sports", logo: "https://s3.aynaott.com/storage/dbc585f70a60b9855b6e13a8ce4cb6f4" },
  { name: "Somoy TV", logo: null },
];

export default function BroadcastRightsModal({ onClose }) {
  return (
    <div className="brm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="brm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="brm-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {/* Swap the inner content for <img src="/wc2026.png" .../> to use the real logo. */}
        <div className="brm-logo" aria-hidden="true">
          <span className="brm-logo-trophy">🏆</span>
          <span className="brm-logo-yr">2026</span>
        </div>

        <span className="brm-badge">
          <span className="brm-dot brm-dot--gold" />
          FIFA WORLD CUP 2026
        </span>

        <h2 className="brm-title">
          Official Joint
          <br />
          <span className="brm-title-grad">Broadcasting Rights</span>
        </h2>

        <span className="brm-live">
          <span className="brm-dot brm-dot--red" />
          LIVE IN BANGLADESH
        </span>

        <p className="brm-info">
          Bangladesh Television <b>BTV</b>, <b>T Sports</b>, and <b>Somoy TV</b> have officially
          acquired the joint broadcasting rights to telecast the{" "}
          <b className="brm-gold">FIFA World Cup 2026</b> live in Bangladesh.
        </p>

        <div className="brm-channels">
          {CHANNELS.map((c) => (
            <div className="brm-channel" key={c.name}>
              <div className="brm-channel-card">
                {c.logo ? (
                  <img
                    src={c.logo}
                    alt={c.name}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span className="brm-channel-ph">{c.name}</span>
                )}
              </div>
              <span className="brm-channel-name">{c.name}</span>
            </div>
          ))}
        </div>

        <button className="brm-cta" onClick={onClose}>
          <span className="brm-play">▶</span> Watch Live Stream Now
        </button>
      </div>
    </div>
  );
}
