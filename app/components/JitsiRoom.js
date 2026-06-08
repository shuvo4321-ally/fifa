"use client";

import { useEffect, useRef, useState } from "react";

const JITSI_DOMAIN = "meet.jit.si";

/** True on phones / small touch-screens where the Jitsi IFrame often fails. */
function detectMobile() {
  if (typeof navigator === "undefined") return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || (typeof window !== "undefined" && window.innerWidth < 768)
  );
}

/**
 * Build the direct Jitsi URL with config encoded in the hash.
 * On mobile we open this in a new tab so the full Jitsi web-app handles
 * WebRTC natively (no cross-origin iframe issues).
 */
function jitsiDirectUrl(room, isHost) {
  const cfg = [
    "config.prejoinPageEnabled=false",
    "config.disableDeepLinking=true",
    "config.startWithAudioMuted=" + (!isHost),
    "config.startWithVideoMuted=" + (!isHost),
    "config.hideConferenceSubject=true",
    "config.hideConferenceTimer=true",
    "interfaceConfig.MOBILE_APP_PROMO=false",
    "interfaceConfig.SHOW_JITSI_WATERMARK=false",
    "interfaceConfig.SHOW_BRAND_WATERMARK=false",
    "interfaceConfig.SHOW_POWERED_BY=false",
  ].join("&");
  return `https://${JITSI_DOMAIN}/${encodeURIComponent(room)}#${cfg}`;
}

export default function JitsiRoom({ role = "viewer", room, onLiveChange }) {
  const isHost = role === "host";
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const onLiveRef = useRef(onLiveChange);
  onLiveRef.current = onLiveChange;
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);
  const [stalled, setStalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile once on mount.
  useEffect(() => {
    setIsMobile(detectMobile());
  }, []);

  // ── IFrame API for desktop viewers + all hosts ──
  // Mobile viewers skip this (the effect bails early).
  useEffect(() => {
    // Mobile viewers don't use the iframe at all.
    if (!isHost && isMobile) return;

    let cancelled = false;
    let stallTimer;

    const loadScript = () =>
      new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) return resolve();
        const existing = document.getElementById("jitsi-external-api");
        if (existing) {
          existing.addEventListener("load", resolve);
          existing.addEventListener("error", () =>
            reject(new Error("Couldn't reach meet.jit.si"))
          );
          return;
        }
        const s = document.createElement("script");
        s.id = "jitsi-external-api";
        s.src = `https://${JITSI_DOMAIN}/external_api.js`;
        s.async = true;
        s.onload = resolve;
        s.onerror = () => reject(new Error("Couldn't reach meet.jit.si"));
        document.body.appendChild(s);
      });

    const hostToolbar = [
      "microphone",
      "camera",
      "desktop",
      "tileview",
      "fullscreen",
      "settings",
      "hangup",
    ];
    const toolbar = isHost ? hostToolbar : ["fullscreen"];

    (async () => {
      try {
        await loadScript();
        if (cancelled || !containerRef.current) return;

        // If the viewer hasn't joined within 12 s, show a fallback link.
        if (!isHost) {
          stallTimer = setTimeout(() => {
            if (!cancelled) setStalled(true);
          }, 12000);
        }

        const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName: room,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          userInfo: { displayName: isHost ? "Broadcaster" : "Viewer" },
          configOverwrite: {
            prejoinConfig: { enabled: false },
            prejoinPageEnabled: false,
            startWithAudioMuted: !isHost,
            startWithVideoMuted: !isHost,
            startSilent: !isHost,
            disableInitialGUM: !isHost,
            enableNoAudioDetection: !isHost ? false : undefined,
            enableNoisyMicDetection: !isHost ? false : undefined,
            requireDisplayName: false,
            disableDeepLinking: true,
            disableInviteFunctions: true,
            disableTileView: !isHost,
            disableSelfView: !isHost,

            // ── 1080p @ 30 fps ──
            resolution: 1080,
            constraints: {
              video: {
                height: { ideal: 1080, max: 1080, min: 720 },
                width: { ideal: 1920, max: 1920, min: 1280 },
                frameRate: { ideal: 30, max: 30 },
              },
            },
            desktopSharingFrameRate: { min: 30, max: 30 },
            maxFullResolutionParticipants: -1,
            videoQuality: {
              preferredCodec: "VP9",
              maxBitratesVideo: {
                low: 500000,
                standard: 2500000,
                high: 4000000,
                ssHigh: 4000000,
              },
              minHeightForQualityLvl: {
                360: "low",
                720: "standard",
                1080: "high",
              },
            },
            lastNLimits: {},
            channelLastN: -1,
            startVideoMuted: 0,

            filmstrip: { disabled: !isHost },
            hideConferenceSubject: true,
            hideConferenceTimer: true,
            hideParticipantsStats: true,
            disableReactions: true,
            disablePolls: true,
            toolbarButtons: toolbar,
            notifications: [],
            conferenceInfo: { autoHide: [], alwaysVisible: [] },
          },
          interfaceConfigOverwrite: {
            MOBILE_APP_PROMO: false,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
            SHOW_CHROME_EXTENSION_BANNER: false,
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            HIDE_INVITE_MORE_HEADER: true,
            DISABLE_FOCUS_INDICATOR: true,
            CONNECTION_INDICATOR_DISABLED: true,
            VIDEO_QUALITY_LABEL_DISABLED: true,
            DEFAULT_BACKGROUND: "#000000",
            FILMSTRIP_ENABLED: isHost,
            TILE_VIEW_MAX_COLUMNS: 1,
            TOOLBAR_BUTTONS: toolbar,
          },
        });
        apiRef.current = api;

        // Ensure the iframe has proper permissions for media playback.
        try {
          const iframe = api.getIFrame();
          if (iframe) {
            iframe.allow =
              "autoplay *; camera *; microphone *; fullscreen *; display-capture *";
          }
        } catch {}

        api.addEventListener("videoConferenceJoined", () => {
          if (cancelled) return;
          clearTimeout(stallTimer);
          setJoined(true);
          setStalled(false);
          onLiveRef.current?.(true);
        });
        api.addEventListener("videoConferenceLeft", () => {
          if (cancelled) return;
          setJoined(false);
          onLiveRef.current?.(false);
        });
        api.addEventListener("readyToClose", () => {
          if (cancelled) return;
          setJoined(false);
          onLiveRef.current?.(false);
        });
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to start the room.");
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(stallTimer);
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [isHost, isMobile, room]);

  // ── Mobile viewer: show a direct link instead of iframe ──
  if (!isHost && isMobile) {
    return (
      <div className="live-overlay live-cover">
        <span className="live-kicker">
          <span className="live-dot is-on" />
          Live
        </span>
        <p className="live-overlay-title">Watch the live stream</p>
        <p className="live-overlay-sub">
          Tap below to open the broadcast. It will open in a new tab where you
          can watch fullscreen.
        </p>
        <a
          href={jitsiDirectUrl(room, false)}
          target="_blank"
          rel="noopener noreferrer"
          className="studio-golive"
          style={{
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ▶ Watch Live
        </a>
      </div>
    );
  }

  // ── Desktop / host rendering ──
  return (
    <>
      <div ref={containerRef} className="jitsi-frame" />

      {error && (
        <div className="live-overlay live-cover">
          <p className="live-overlay-title">Couldn't load Live TV</p>
          <p className="live-overlay-sub">{error}</p>
        </div>
      )}

      {/* Desktop viewer: "connecting" overlay until Jitsi joins */}
      {!isHost && !joined && !error && !stalled && (
        <div className="live-overlay live-cover">
          <span className="live-kicker">
            <span className="live-dot" />
            Connecting
          </span>
          <p className="live-overlay-title">The stream isn't live yet</p>
          <p className="live-overlay-sub">
            This page starts automatically the moment the broadcast begins —
            keep it open.
          </p>
        </div>
      )}

      {/* Desktop viewer: fallback if Jitsi iframe stalled */}
      {!isHost && !joined && !error && stalled && (
        <div className="live-overlay live-cover">
          <span className="live-kicker">
            <span className="live-dot is-on" />
            Stream
          </span>
          <p className="live-overlay-title">Having trouble connecting?</p>
          <p className="live-overlay-sub">
            The embedded player is taking too long. You can watch directly
            instead.
          </p>
          <a
            href={jitsiDirectUrl(room, false)}
            target="_blank"
            rel="noopener noreferrer"
            className="studio-golive"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            Open Stream ↗
          </a>
        </div>
      )}
    </>
  );
}
