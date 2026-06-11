"use client";

import { useEffect, useRef, useState } from "react";
import shaka from "shaka-player/dist/shaka-player.compiled.js";
import Hls from "hls.js";
export default function HlsPlayer({ src, poster, onFullscreen, onPrev, onNext, streamType, drmKid, drmKey, onErrorCallback }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const shakaRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  
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

    const isDash = streamType === "dash" || src.toLowerCase().includes(".mpd");

    (async () => {
      try {
        const actualShaka = shaka.default || shaka;
        const ActualHls = Hls.default || Hls;

        if (isDash) {
          // DASH stream
          actualShaka.polyfill.installAll();
          
          if (actualShaka.Player.isBrowserSupported()) {
            const player = new actualShaka.Player(video);
            shakaRef.current = player;
            
            // Configure DRM if keys are provided
            if (drmKid && drmKey) {
              player.configure({
                drm: {
                  clearKeys: {
                    [drmKid]: drmKey
                  }
                }
              });
            }

            player.addEventListener('error', (event) => {
              console.error('Shaka Error:', event.detail);
              if (onErrorCallback) onErrorCallback(true);
            });

            try {
              await player.load(src);
            } catch (e) {
              // Ignore load interrupted errors when unmounting
              if (e.code !== actualShaka.util.Error.Code.LOAD_INTERRUPTED) {
                throw e;
              }
            }
          } else {
            setError("Browser not supported for DASH playback.");
          }
        } else {
          // HLS stream
          if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = src;
            return;
          }
          if (cancelled) return;
          if (ActualHls.isSupported()) {
            const hls = new ActualHls({ enableWorker: true, lowLatencyMode: true });
            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(ActualHls.Events.ERROR, (_e, data) => {
              if (data?.fatal) {
                console.error("Hls.js fatal error:", data);
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
        }
      } catch (err) {
        console.error("Player init error:", err.code ? `Code ${err.code}` : err);
        if (!cancelled) setError("Could not start the player.");
        if (onErrorCallback) onErrorCallback(true);
      }
    })();

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
        if (video) {
          video.pause();
          video.removeAttribute("src");
          video.load();
        }
      } else if (shakaRef.current) {
        shakaRef.current.destroy();
        shakaRef.current = null;
        // Do not manually modify video.src here; Shaka's destroy() handles it safely.
      } else if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [src, streamType, drmKid, drmKey]);

  // Sync state with video
  const [isBuffering, setIsBuffering] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onCanPlay = () => setIsBuffering(false);
    const onLoadStart = () => setIsBuffering(true);
    
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("loadstart", onLoadStart);
    
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("loadstart", onLoadStart);
    };
  }, []);

  // Reset buffering state when source changes
  useEffect(() => {
    setIsBuffering(true);
  }, [src]);

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

  if (error) {
    return (
      <div className="live-overlay live-cover">
        <p className="live-overlay-title">Channel unavailable</p>
        <p className="live-overlay-sub">{error}</p>
      </div>
    );
  }

  return (
    <div 
      className="custom-player-wrapper" 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
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
      {isBuffering && (
        <div className="custom-loading-overlay">
          <div className="custom-spinner"></div>
          <p className="custom-loading-text">PLEASE WAIT</p>
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
