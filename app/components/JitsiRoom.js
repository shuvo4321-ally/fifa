"use client";

import { useEffect, useRef, useState } from "react";

const JITSI_DOMAIN = "meet.jit.si";
// Long, unique room name so strangers don't wander in. Change it to your own.
const ROOM_NAME = "CRONLiveTV-3f9Qx2Lp";

export default function JitsiRoom({ role = "viewer", room, quality = "720p30" }) {
  const isHost = role === "host";
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false); // true once the room is actually live

  // Parse quality setting
  const res = quality.includes("1080") ? 1080 : quality.includes("480") ? 480 : 720;
  const fps = parseInt(quality.split("p")[1] || "30");

  useEffect(() => {
    let cancelled = false;

    const loadScript = () =>
      new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) return resolve();
        const existing = document.getElementById("jitsi-external-api");
        if (existing) {
          existing.addEventListener("load", resolve);
          existing.addEventListener("error", () =>
            reject(new Error("Couldn’t reach meet.jit.si"))
          );
          return;
        }
        const s = document.createElement("script");
        s.id = "jitsi-external-api";
        s.src = `https://${JITSI_DOMAIN}/external_api.js`;
        s.async = true;
        s.onload = resolve;
        s.onerror = () => reject(new Error("Couldn’t reach meet.jit.si"));
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
    const toolbar = isHost ? hostToolbar : ["fullscreen", "volume"];

    (async () => {
      try {
        await loadScript();
        if (cancelled || !containerRef.current) return;
        const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName: room || ROOM_NAME,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          userInfo: { displayName: isHost ? "Broadcaster" : "Viewer" },
          configOverwrite: {
            prejoinConfig: { enabled: false },
            prejoinPageEnabled: false,
            startWithAudioMuted: !isHost,
            startWithVideoMuted: !isHost,
            disableDeepLinking: true,
            disableInviteFunctions: true,
            disableTileView: !isHost,
            disableSelfView: !isHost,
            desktopSharingFrameRate: { min: fps, max: fps },
            resolution: res,
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

        // The room only "starts" once a moderator (the broadcaster) is in.
        // Until then meet.jit.si shows its own "waiting for moderator / log-in"
        // screen — we keep our cover over it and only reveal on join.
        api.addEventListener("videoConferenceJoined", () => {
          if (!cancelled) setJoined(true);
        });
        api.addEventListener("videoConferenceLeft", () => {
          if (!cancelled) setJoined(false);
        });
        api.addEventListener("readyToClose", () => {
          if (!cancelled) setJoined(false);
        });
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to start the room.");
      }
    })();

    return () => {
      cancelled = true;
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [isHost, room, quality]);

  return (
    <>
      <div ref={containerRef} className="jitsi-frame" />

      {error && (
        <div className="live-overlay live-cover">
          <p className="live-overlay-title">Couldn’t load Live TV</p>
          <p className="live-overlay-sub">{error}</p>
        </div>
      )}

      {/* Viewers never see Jitsi's join/login screen — show our own until live. */}
      {!isHost && !joined && !error && (
        <div className="live-overlay live-cover">
          <span className="live-kicker">
            <span className="live-dot" />
            Offline
          </span>
          <p className="live-overlay-title">The stream isn’t live yet</p>
          <p className="live-overlay-sub">
            This page starts automatically the moment the broadcast begins — keep it open.
          </p>
        </div>
      )}
    </>
  );
}
