"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

// Route an HLS manifest through our same-origin proxy. This is what makes
// channels start fast: the browser reuses the page's warm connection instead of
// a cold DNS+TLS handshake to a distant CDN, and CORS / mixed-content / geo
// blocks disappear. The proxy rewrites the manifest so segments come through it
// too. DASH (.mpd) is left direct — only plain HLS is proxied.
function proxify(u) {
  if (!u || !/^https?:\/\//i.test(u)) return u;
  return `/api/proxy?url=${encodeURIComponent(u)}`;
}

export default function HlsPlayer({ src, poster, onFullscreen, onPrev, onNext, streamType, drmKid, drmKey, onErrorCallback }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const shakaRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const loadIdRef = useRef(0);
  // Auto-reconnect bookkeeping: how many retries so far, the queued retry timer,
  // a stall watchdog, and the last src we actually switched to.
  const retryRef = useRef(0);
  const retryTimerRef = useRef(null);
  const stallTimerRef = useRef(null);
  const startTimerRef = useRef(null);
  const lastSrcRef = useRef(null);

  const [error, setError] = useState("");
  const [hevcWarning, setHevcWarning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  // True from the moment a channel starts loading until it actually plays — so
  // the user always sees a "please wait" spinner instead of a blank/frozen frame.
  const [loading, setLoading] = useState(true);
  // >0 while we're auto-reloading this channel (holds the attempt number).
  const [reconnecting, setReconnecting] = useState(0);
  // Bumping this re-runs the load effect on the SAME src — i.e. it reloads the
  // current channel without ever switching to another one.
  const [reloadNonce, setReloadNonce] = useState(0);

  // Re-load the CURRENT channel after a short, growing delay. We never change
  // `src` here, so a stream that drops, expires, or freezes keeps trying to come
  // back on its own and stays pointed at exactly the channel the user picked.
  const scheduleReconnect = () => {
    if (retryTimerRef.current) return; // a reload is already queued
    retryRef.current += 1;
    setReconnecting(retryRef.current);
    setError("");
    const delay = Math.min(1500 + (retryRef.current - 1) * 1500, 8000); // 1.5s → 8s cap
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      setReloadNonce((n) => n + 1);
    }, delay);
  };

  // Clear any pending timers if the player unmounts mid-retry.
  useEffect(() => () => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    if (startTimerRef.current) clearTimeout(startTimerRef.current);
  }, []);

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
    setLoading(true);
    let cancelled = false;
    // Each load gets a unique id; switching channels bumps it, so any in-flight
    // async work from the previous channel bails instead of attaching a second
    // stream over the new one (the "both play at once" bug).
    const myId = ++loadIdRef.current;
    const isStale = () => cancelled || myId !== loadIdRef.current;

    // Reset the retry counter only when the user actually changes channel. A
    // reconnect re-run (reloadNonce bump) keeps the same src, so we DON'T reset —
    // that's how the backoff grows while we keep retrying the one channel.
    if (lastSrcRef.current !== src) {
      lastSrcRef.current = src;
      retryRef.current = 0;
      setReconnecting(0);
    }

    // Silence the previous stream immediately on switch.
    try { video.pause(); } catch {}

    // ── Auto-recovery on the media element ──────────────────────────────────
    // A failed or frozen channel reloads ITSELF (same src) until it plays, so a
    // flaky stream comes back without the user touching anything.
    const onMediaError = () => {
      if (isStale()) return;
      const code = video.error?.code;
      if (code === 3 || code === 4) { // DECODE / SRC_NOT_SUPPORTED → codec issue, retrying won't help
        setError("This channel uses a video codec your browser can't decode.");
        return;
      }
      scheduleReconnect();
    };
    const armStallWatchdog = () => {
      if (isStale()) return;
      clearTimeout(stallTimerRef.current);
      // Frozen this long on a live stream isn't buffering — reload it.
      stallTimerRef.current = setTimeout(() => {
        if (!isStale() && !video.paused && video.readyState < 3) scheduleReconnect();
      }, 15000);
    };
    const onPlaying = () => {
      clearTimeout(stallTimerRef.current);
      clearTimeout(startTimerRef.current);
      retryRef.current = 0;     // it's alive — forget the failures
      setReconnecting(0);
      setLoading(false);        // stream is open → hide the "please wait" loader
    };
    // Some dead/geo-blocked streams never error AND never fire `waiting` — they
    // just hang at readyState 0 forever (manifest or first segment never lands).
    // A hard deadline catches that silent case: if the channel hasn't reached a
    // playable state in time, reload it. Cleared the moment real data arrives.
    const clearStartDeadline = () => clearTimeout(startTimerRef.current);
    startTimerRef.current = setTimeout(() => {
      if (!isStale() && video.readyState < 3) scheduleReconnect();
    }, 15000);
    video.addEventListener("error", onMediaError);
    video.addEventListener("waiting", armStallWatchdog);
    video.addEventListener("stalled", armStallWatchdog);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("loadeddata", clearStartDeadline);
    video.addEventListener("canplay", clearStartDeadline);

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
              lowLatencyMode: true
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
            if (!isStale()) scheduleReconnect();
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
        if (onErrorCallback) onErrorCallback(true);
        if (!isStale()) scheduleReconnect(); // transient load failure → keep trying this channel
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
          if (!isStale()) scheduleReconnect();
        });
    } else {
      // hls.js is statically imported (bundled with this route), so there's no
      // lazy chunk to fetch on play — the channel starts as fast as possible.
      // The manifest goes through our same-origin proxy for a warm, CORS-free,
      // geo-unblocked fetch.
      const streamSrc = proxify(src);
      // Prefer hls.js wherever MSE exists (Chrome/Edge/Firefox/Electron). Only
      // fall back to NATIVE HLS when hls.js can't run (iOS Safari) — Chromium
      // reports canPlayType("…mpegurl")="maybe" but can't actually play it, so
      // checking native first wrongly sent it down a dead path.
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
          manifestLoadingTimeOut: 10000, // tolerate the extra proxy hop
          manifestLoadingMaxRetry: 4,
          levelLoadingTimeOut: 10000,
          fragLoadingTimeOut: 30000
        });
        hlsRef.current = hls;
        hls.loadSource(streamSrc);
        hls.attachMedia(video);
        let softRecoveries = 0;
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (!data?.fatal) return;
          console.warn("HLS fatal error:", data?.details ?? data);
          if (data.details === "manifestParsingError" || data.details === "bufferAddCodecError" || data.reason?.includes("codec")) {
            setError("This channel uses HEVC (H.265) video encoding. Your browser or device does not support HEVC decoding.");
            return;
          }
          // Try hls.js's own in-place recovery first — it keeps the warm
          // connection and whatever buffer exists, so a slow-but-alive stream
          // isn't thrown away. Only escalate to a full teardown-reconnect once
          // in-place recovery is exhausted.
          if (softRecoveries < 3) {
            softRecoveries++;
            try {
              if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
              else hls.startLoad();
              return;
            } catch {}
          }
          // Token expired / geo-block / dead stream: keep reloading the SAME
          // channel on a backoff until it comes back.
          scheduleReconnect();
        });
      } else {
        // Native HLS (iOS Safari) — also through the proxy.
        video.src = streamSrc;
      }
    }

    return () => {
      cancelled = true;
      clearTimeout(stallTimerRef.current);
      clearTimeout(startTimerRef.current);
      video.removeEventListener("error", onMediaError);
      video.removeEventListener("waiting", armStallWatchdog);
      video.removeEventListener("stalled", armStallWatchdog);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("loadeddata", clearStartDeadline);
      video.removeEventListener("canplay", clearStartDeadline);
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
  }, [src, streamType, drmKid, drmKey, reloadNonce]);

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
    // Manual reload = a clean, full re-init of the CURRENT channel. Reset the
    // auto-retry state so the user's tap starts fresh rather than fighting a
    // queued reconnect.
    if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null; }
    clearTimeout(stallTimerRef.current);
    retryRef.current = 0;
    setReconnecting(0);
    setError("");
    setReloadNonce((n) => n + 1);
  };

  // Keep the controls + channel nav reachable while an overlay (please-wait,
  // reconnecting, or error) is covering the video — otherwise the user is stuck
  // unable to mute, go fullscreen, reload or switch channels until it plays.
  const showControls = isHovering || !isPlaying || loading || reconnecting > 0 || !!error;

  return (
    <div
      className="custom-player-wrapper"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* One keyframe + spinner class shared by every overlay below. */}
      <style>{`@keyframes hlsSpin{to{transform:rotate(360deg)}}
        .hls-spin{width:36px;height:36px;border-radius:50%;border:3px solid rgba(255,255,255,0.25);border-top-color:#fff;animation:hlsSpin .8s linear infinite;margin-bottom:14px}`}</style>

      {/* Error is an OVERLAY, not an early return. The <video> must stay mounted —
          unmounting it nulled videoRef, so the load effect bailed on the next
          channel and left every subsequent one "unavailable" until a refresh. */}
      {error && (
        <div className="live-overlay live-cover" style={{ position: "absolute", inset: 0, zIndex: 25, pointerEvents: "none" }}>
          <p className="live-overlay-title">Channel unavailable</p>
          <p className="live-overlay-sub">{error}</p>
        </div>
      )}
      {/* Auto-reconnect overlay — shown while we keep reloading THIS channel.
          Lower z-index than the permanent error so a real codec failure wins. */}
      {reconnecting > 0 && !error && (
        <div className="live-overlay live-cover" style={{ position: "absolute", inset: 0, zIndex: 24, pointerEvents: "none" }}>
          <span className="hls-spin" aria-hidden />
          <p className="live-overlay-title">Reconnecting…</p>
          <p className="live-overlay-sub">This channel is taking a moment — retrying automatically (attempt {reconnecting}).</p>
        </div>
      )}
      {/* Initial "please wait" loader — shown until the stream actually opens so
          the screen never just sits blank/frozen while a channel is connecting. */}
      {loading && !error && reconnecting === 0 && (
        <div className="live-overlay live-cover" style={{ position: "absolute", inset: 0, zIndex: 23, pointerEvents: "none" }}>
          <span className="hls-spin" aria-hidden />
          <p className="live-overlay-title">Please wait…</p>
          <p className="live-overlay-sub">Opening the channel — this can take a few seconds.</p>
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
          className={`custom-nav-btn custom-nav-left ${showControls ? "is-visible" : ""}`}
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
        </button>
      )}

      {onNext && (
        <button 
          className={`custom-nav-btn custom-nav-right ${showControls ? "is-visible" : ""}`}
          onClick={(e) => { e.stopPropagation(); onNext(); }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
        </button>
      )}

      <div className={`custom-controls-bar ${showControls ? "is-visible" : ""}`}>
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
