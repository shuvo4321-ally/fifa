"use client";

import { useEffect, useRef, useState } from "react";

export default function HlsPlayer({ src, poster }) {
  const videoRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    setError("");
    let hls;
    let cancelled = false;

    (async () => {
      // Safari / iOS play HLS natively.
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        return;
      }
      try {
        const { default: Hls } = await import("hls.js");
        if (cancelled) return;
        if (Hls.isSupported()) {
          hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.ERROR, (_e, data) => {
            if (data?.fatal) {
              setError(
                "This channel couldn't load — the token may have expired, or it's geo-blocked / blocking cross-site playback."
              );
            }
          });
        } else {
          video.src = src;
        }
      } catch {
        if (!cancelled) setError("Could not start the player.");
      }
    })();

    return () => {
      cancelled = true;
      if (hls) hls.destroy();
    };
  }, [src]);

  if (error) {
    return (
      <div className="live-overlay live-cover">
        <p className="live-overlay-title">Channel unavailable</p>
        <p className="live-overlay-sub">{error}</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className="live-video"
      controls
      autoPlay
      playsInline
      muted
      poster={poster}
    />
  );
}
