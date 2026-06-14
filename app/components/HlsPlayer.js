"use client";

import { useEffect, useRef, useState } from "react";

export default function HlsPlayer({ src, poster, onFullscreen, onPrev, onNext, streamType, drmKid, drmKey, onErrorCallback }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const shakaRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const loadIdRef = useRef(0);
  
  const [error, setError] = useState("");
  const [hevcWarning, setHevcWarning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    setError("");
    let cancelled = false;
    // Each load gets a unique id; switching channels bumps it, so any in-flight
    // async work from the previous channel bails instead of attaching a second
    // stream over the new one (the "both play at once" bug).
    const myId = ++loadIdRef.current;
    const isStale = () => cancelled || myId !== loadIdRef.current;

    // Silence the previous stream immediately on switch.
    try { video.pause(); } catch {}

    const isDash = streamType === "dash" || src.toLowerCase().includes(".mpd");

    const initShaka = async () => {
      if (isStale()) return;
      try {
        const shaka = window.shaka;
        if (!shaka) {
          setError("Failed to load DASH player.");
          return;
        }
        shaka.polyfill.installAll();
        if (shaka.Player.isBrowserSupported()) {
          const player = new shaka.Player(video);
          shakaRef.current = player;
          const shakaConfig = {
            streaming: {
              bufferingGoal: 10,
              rebufferingGoal: 2,
              lowLatencyMode: true,
              jumpLargeGaps: true
            },
            abr: {
              defaultBandwidthEstimate: 500000 // Force low initial bitrate for instant start
            }
          };

          if (drmKid && drmKey) {
            shakaConfig.drm = { clearKeys: { [drmKid]: drmKey } };
          }
          
          player.configure(shakaConfig);
          player.addEventListener('error', (event) => {
            // Expected for dead/geo-blocked DASH streams. Use warn, not error —
            // Next dev promotes every console.error into a blocking overlay.
            console.warn('DASH playback error:', event.detail?.code ?? event.detail);
            if (onErrorCallback) onErrorCallback(true);
          });
          try {
            await player.load(src);
            // Switched away mid-load → tear this one down, don't let it play.
            if (isStale()) { player.destroy().catch(() => {}); return; }
          } catch (e) {
            if (e.code !== shaka.util.Error.Code.LOAD_INTERRUPTED) {
              throw e;
            }
          }
        } else {
          setError("Browser not supported for DASH playback.");
        }
      } catch (err) {
        console.warn("DASH channel failed to start:", err?.code ?? err?.message ?? err);
        if (!cancelled) setError("Could not start the player.");
        if (onErrorCallback) onErrorCallback(true);
      }
    };

    if (isDash) {
      // Shaka Player is loaded globally via layout.js <Script> tag.
      // Poll for window.shaka availability (it uses strategy="lazyOnload").
      const waitForShaka = () => {
        return new Promise((resolve, reject) => {
          if (window.shaka) { resolve(); return; }
          let elapsed = 0;
          const interval = setInterval(() => {
            elapsed += 100;
            if (window.shaka) { clearInterval(interval); resolve(); return; }
            if (elapsed >= 15000) { clearInterval(interval); reject(new Error("Shaka Player did not load in time.")); }
          }, 100);
        });
      };

      waitForShaka()
        .then(() => { if (!isStale()) return initShaka(); })
        .catch((err) => {
          console.warn("Shaka player failed to load:", err?.message ?? err);
          if (!cancelled) setError("Could not load the DASH player.");
        });
    } else {
      (async () => {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
          return;
        }
        try {
          const { default: Hls } = await import("hls.js");
          if (isStale()) return;
          if (Hls.isSupported()) {
            const hls = new Hls({ 
              enableWorker: true, 
              lowLatencyMode: true,
              startLevel: 0, // Force lowest level immediately, skip bandwidth test
              capLevelToPlayerSize: true,
              maxBufferLength: 10,
              maxMaxBufferLength: 30,
              liveSyncDurationCount: 2,
              liveMaxLatencyDurationCount: 5,
              manifestLoadingTimeOut: 5000,
              manifestLoadingMaxRetry: 3
            });
            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(Hls.Events.ERROR, (_e, data) => {
              if (data?.fatal) {
                console.warn("HLS fatal error:", data?.details ?? data);
                if (data.details === "manifestParsingError" || data.details === "bufferAddCodecError" || data.reason?.includes("codec")) {
                  setError("This channel uses HEVC (H.265) video encoding. Your browser or device does not support HEVC decoding.");
                } else {
                  setError("This channel couldn't load — the token may have expired, or it's geo-blocked.");
                  if (onErrorCallback) onErrorCallback(true);
                }
              }
            });
          } else {
            video.src = src;
          }
        } catch {
          if (!cancelled) setError("Could not start the player.");
        }
      })();
    }

    return () => {
      cancelled = true;
      // Tear down whichever engine is active.
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (shakaRef.current) {
        // destroy() is async and we don't await it, but resetting the <video>
        // below synchronously detaches its MediaSource.
        shakaRef.current.destroy().catch(() => {});
        shakaRef.current = null;
      }
      // ALWAYS reset the media element. Previously the Shaka branch skipped
      // this, so switching away from a DASH channel (e.g. World Cup TV) left
      // its MediaSource attached and the next channel's hls.attachMedia() threw
      // → "Could not start the player" for every channel until a full refresh.
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [src, streamType, drmKid, drmKey]);

  // Sync state with video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, []);

  const handleMouseMove = () => {
    setIsHovering(true);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovering(false);
    }, 2500);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) videoRef.current.play();
      else videoRef.current.pause();
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val > 0 && isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
    }
  };

  const togglePip = async () => {
    if (videoRef.current && document.pictureInPictureEnabled) {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    }
  };

  const reloadStream = () => {
    if (hlsRef.current && videoRef.current) {
      hlsRef.current.stopLoad();
      hlsRef.current.startLoad();
      videoRef.current.play();
    } else if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play();
    }
  };

  return (
    <div
      className="custom-player-wrapper"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Error is an OVERLAY, not an early return. The <video> must stay mounted —
          unmounting it nulled videoRef, so the load effect bailed on the next
          channel and left every subsequent one "unavailable" until a refresh. */}
      {error && (
        <div className="live-overlay live-cover" style={{ position: "absolute", inset: 0, zIndex: 25 }}>
          <p className="live-overlay-title">Channel unavailable</p>
          <p className="live-overlay-sub">{error}</p>
        </div>
      )}
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
          zIndex: 20,
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
      <video
        ref={videoRef}
        className="live-video"
        disablePictureInPicture={false}
        autoPlay
        playsInline
        poster={poster}
        onClick={togglePlay}
        onDoubleClick={onFullscreen}
      />

      {onPrev && (
        <button 
          className={`custom-nav-btn custom-nav-left ${isHovering || !isPlaying ? "is-visible" : ""}`}
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
        </button>
      )}

      {onNext && (
        <button 
          className={`custom-nav-btn custom-nav-right ${isHovering || !isPlaying ? "is-visible" : ""}`}
          onClick={(e) => { e.stopPropagation(); onNext(); }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
        </button>
      )}

      <div className={`custom-controls-bar ${isHovering || !isPlaying ? "is-visible" : ""}`}>
        <div className="custom-controls-left">
          <button className="control-btn" onClick={togglePlay}>
            {isPlaying ? (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            )}
          </button>
          
          <button className="control-btn" onClick={toggleMute}>
            {isMuted || volume === 0 ? (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            )}
          </button>

          <input 
            type="range" 
            className="volume-slider" 
            min="0" max="1" step="0.05" 
            value={isMuted ? 0 : volume} 
            onChange={handleVolumeChange} 
            style={{ '--vol-fill': `${(isMuted ? 0 : volume) * 100}%` }}
          />
        </div>

        <div className="custom-controls-right">
          <button className="control-btn" onClick={togglePip} title="Picture-in-Picture">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect><rect x="12" y="11" width="7" height="5" rx="1" ry="1"></rect></svg>
          </button>
          <button className="control-btn" onClick={reloadStream} title="Reload Stream">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          </button>
          <button className="control-btn" onClick={onFullscreen} title="Fullscreen">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m11-5h3a2 2 0 0 1 2 2v3m0 8v3a2 2 0 0 1-2 2h-3m-8 0H5a2 2 0 0 1-2-2v-3"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
