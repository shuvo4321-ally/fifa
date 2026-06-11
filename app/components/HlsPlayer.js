"use client";

import { useEffect, useRef, useState } from "react";
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { MediaPlayer, MediaProvider, isDASHProvider } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';

export default function HlsPlayer({ src, poster, onFullscreen, onPrev, onNext, streamType, drmKid, drmKey, onErrorCallback }) {
  const [error, setError] = useState("");
  const [hevcWarning, setHevcWarning] = useState(false);

  useEffect(() => {
    if (!src) return;
    const isMaybeHevc = src.toLowerCase().includes("caze") || src.toLowerCase().includes("hevc") || src.toLowerCase().includes("h265");
    if (isMaybeHevc) {
      const hasHevcSupport = 
        (window.MediaSource && MediaSource.isTypeSupported('video/mp4; codecs="hvc1.1.6.L93.B0"')) ||
        (window.MediaSource && MediaSource.isTypeSupported('video/mp4; codecs="hev1.1.6.L93.B0"')) ||
        (document.createElement('video').canPlayType('video/mp4; codecs="hvc1.1.6.L93.B0"') === "probably") ||
        (document.createElement('video').canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"') === "probably");
      
      if (!hasHevcSupport) {
        setHevcWarning(true);
      } else {
        setHevcWarning(false);
      }
    } else {
      setHevcWarning(false);
    }
  }, [src]);

  const onProviderChange = (provider) => {
    if (isDASHProvider(provider)) {
      if (drmKid && drmKey) {
        const protData = {
          "org.w3.clearkey": {
            clearkeys: {
              [drmKid]: drmKey
            }
          }
        };
        // Some versions of Vidstack have onSetup, others don't.
        if (provider.onSetup) {
          provider.onSetup(() => {
            provider.player?.setProtectionData?.(protData);
          });
        } else if (provider.player) {
          provider.player.setProtectionData?.(protData);
        }
      }
    }
  };

  const onError = (e) => {
    console.error("Vidstack Error:", e);
    // Ignore aborted or network errors during unmount
    if (e?.code !== 1 && e?.code !== 2) {
      if (onErrorCallback) onErrorCallback(true);
    }
  };

  if (error) {
    return (
      <div className="live-overlay live-cover">
        <p className="live-overlay-title">Channel unavailable</p>
        <p className="live-overlay-sub">{error}</p>
      </div>
    );
  }

  // Determine type if not specified
  const isDash = streamType === "dash" || src?.toLowerCase().includes(".mpd");

  return (
    <div className="custom-player-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {hevcWarning && (
        <div style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          right: "12px",
          background: "rgba(220, 38, 38, 0.95)",
          color: "white",
          padding: "10px 16px",
          borderRadius: "8px",
          fontSize: "12.5px",
          fontWeight: "600",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)"
        }}>
          <span>⚠️</span>
          <span style={{ flex: 1 }}>
            This channel uses HEVC (H.265) encoding. If you see a black screen or experience issues, please use Edge, Safari, or enable Hardware Acceleration in Chrome.
          </span>
          <button 
            onClick={() => setHevcWarning(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "white",
              fontSize: "14px",
              cursor: "pointer",
              padding: "0 4px"
            }}
          >
            ✕
          </button>
        </div>
      )}

      <MediaPlayer 
        className="vds-player"
        style={{ width: '100%', height: '100%' }}
        src={{
          src: src,
          type: isDash ? 'application/dash+xml' : 'application/x-mpegurl'
        }}
        autoPlay
        playsInline
        poster={poster}
        onProviderChange={onProviderChange}
        onError={onError}
        crossOrigin="anonymous"
      >
        <MediaProvider />
        <DefaultVideoLayout icons={defaultLayoutIcons} />
      </MediaPlayer>

      {/* Custom Prev/Next Buttons Hovering Over Vidstack */}
      {onPrev && (
        <button 
          className="custom-nav-btn custom-nav-left is-visible"
          style={{ zIndex: 40 }}
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
        </button>
      )}

      {onNext && (
        <button 
          className="custom-nav-btn custom-nav-right is-visible"
          style={{ zIndex: 40 }}
          onClick={(e) => { e.stopPropagation(); onNext(); }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
        </button>
      )}
    </div>
  );
}
