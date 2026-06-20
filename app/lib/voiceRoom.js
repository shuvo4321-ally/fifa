"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

// Public STUN only (no TURN) — fine for a beta; some strict/symmetric NATs may
// not connect without a TURN server, which we can add later.
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

/**
 * Multi-person voice chat over a Supabase Realtime channel (signaling + presence)
 * with peer-to-peer WebRTC audio (mesh). Only each person's MICROPHONE is sent to
 * the others — the live-TV audio they're hearing is never transmitted. Anyone on
 * the same `roomName` who joins can talk; everyone hears everyone.
 */
export function useVoiceRoom(roomName, capacity = 8) {
  const [joined, setJoined] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [muted, setMuted] = useState(false);
  const [peers, setPeers] = useState([]); // [{ id, name }]
  const [error, setError] = useState("");
  const [count, setCount] = useState(0); // people in the party (incl. you)
  const [full, setFull] = useState(false);

  const meId = useRef("");
  if (!meId.current) {
    meId.current =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `p_${Math.random().toString(36).slice(2)}`;
  }
  const nameRef = useRef("");
  const channelRef = useRef(null);
  const localStream = useRef(null);
  const pcs = useRef(new Map()); // remoteId -> { pc, audioEl, pendingIce: [], name }
  const leaveRef = useRef(() => {}); // late-bound so the presence handler can bow out when full

  const send = useCallback((payload) => {
    channelRef.current?.send({ type: "broadcast", event: "signal", payload });
  }, []);

  const closePeer = useCallback((id) => {
    const rec = pcs.current.get(id);
    if (rec) {
      try { rec.pc.close(); } catch {}
      if (rec.audioEl) { try { rec.audioEl.srcObject = null; rec.audioEl.remove(); } catch {} }
      pcs.current.delete(id);
    }
    setPeers((list) => list.filter((p) => p.id !== id));
  }, []);

  const createPeer = useCallback((remoteId, remoteName) => {
    let rec = pcs.current.get(remoteId);
    if (rec) return rec;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    rec = { pc, audioEl: null, pendingIce: [], name: remoteName || "Guest" };
    pcs.current.set(remoteId, rec);

    localStream.current?.getTracks().forEach((t) => pc.addTrack(t, localStream.current));

    pc.onicecandidate = (e) => {
      if (e.candidate) send({ to: remoteId, from: meId.current, kind: "ice", data: e.candidate });
    };
    pc.ontrack = (e) => {
      if (!rec.audioEl) {
        const el = document.createElement("audio");
        el.autoplay = true;
        el.playsInline = true;
        document.body.appendChild(el);
        rec.audioEl = el;
      }
      rec.audioEl.srcObject = e.streams[0];
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") closePeer(remoteId);
    };

    setPeers((list) => (list.some((p) => p.id === remoteId) ? list : [...list, { id: remoteId, name: rec.name }]));
    return rec;
  }, [send, closePeer]);

  // Initiator side: build an offer to a peer.
  const callPeer = useCallback(async (remoteId, remoteName) => {
    const rec = createPeer(remoteId, remoteName);
    try {
      const offer = await rec.pc.createOffer();
      await rec.pc.setLocalDescription(offer);
      send({ to: remoteId, from: meId.current, name: nameRef.current, kind: "offer", data: offer });
    } catch (e) {
      console.warn("voice: offer failed", e);
    }
  }, [createPeer, send]);

  const handleSignal = useCallback(async (msg) => {
    if (!msg || msg.to !== meId.current || msg.from === meId.current) return;
    const { from, kind, data } = msg;
    try {
      if (kind === "offer") {
        const rec = createPeer(from, msg.name);
        await rec.pc.setRemoteDescription(new RTCSessionDescription(data));
        for (const c of rec.pendingIce) { try { await rec.pc.addIceCandidate(c); } catch {} }
        rec.pendingIce = [];
        const answer = await rec.pc.createAnswer();
        await rec.pc.setLocalDescription(answer);
        send({ to: from, from: meId.current, name: nameRef.current, kind: "answer", data: answer });
      } else if (kind === "answer") {
        const rec = pcs.current.get(from);
        if (rec) {
          await rec.pc.setRemoteDescription(new RTCSessionDescription(data));
          for (const c of rec.pendingIce) { try { await rec.pc.addIceCandidate(c); } catch {} }
          rec.pendingIce = [];
        }
      } else if (kind === "ice") {
        const rec = pcs.current.get(from);
        if (rec) {
          if (rec.pc.remoteDescription && rec.pc.remoteDescription.type) {
            try { await rec.pc.addIceCandidate(data); } catch {}
          } else {
            rec.pendingIce.push(data);
          }
        }
      }
    } catch (e) {
      console.warn("voice: signal handling error", e);
    }
  }, [createPeer, send]);

  const join = useCallback(async (displayName) => {
    if (joined || connecting) return;
    if (!supabase) { setError("Voice backend not configured."); return; }
    nameRef.current = (displayName || "Guest").slice(0, 24);
    setConnecting(true);
    setError("");
    setFull(false);
    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (e) {
      setConnecting(false);
      setError(e?.name === "NotAllowedError" ? "Microphone permission denied." : "Couldn't access your microphone.");
      return;
    }

    const channel = supabase.channel(`voice:${roomName}`, {
      config: { presence: { key: meId.current }, broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel.on("broadcast", { event: "signal" }, ({ payload }) => handleSignal(payload));

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      // Everyone in the room, ordered by who joined first (stable tiebreak on id).
      const all = Object.entries(state)
        .map(([key, metas]) => ({ id: key, name: metas?.[0]?.name || "Guest", joinedAt: metas?.[0]?.joinedAt || 0 }))
        .sort((a, b) => (a.joinedAt - b.joinedAt) || (a.id < b.id ? -1 : 1));
      setCount(all.length);

      // Enforce the party limit: only the first `capacity` people (by join order)
      // stay. If the room was already full when you joined, bow out gracefully.
      const myIndex = all.findIndex((p) => p.id === meId.current);
      if (myIndex >= capacity) {
        setError(`Party is full (${capacity}/${capacity}).`);
        setFull(true);
        leaveRef.current();
        return;
      }

      const allowed = all.slice(0, capacity).filter((p) => p.id !== meId.current);
      // Connect to any new peer. Deterministic initiator (higher id calls) avoids glare.
      for (const p of allowed) {
        if (!pcs.current.has(p.id) && meId.current > p.id) callPeer(p.id, p.name);
      }
      // Drop peers that left (or got bumped past the limit).
      for (const id of [...pcs.current.keys()]) {
        if (!allowed.some((p) => p.id === id)) closePeer(id);
      }
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ id: meId.current, name: nameRef.current, joinedAt: Date.now() });
        setJoined(true);
        setConnecting(false);
      }
    });
  }, [joined, connecting, roomName, capacity, handleSignal, callPeer, closePeer]);

  const leave = useCallback(() => {
    for (const id of [...pcs.current.keys()]) closePeer(id);
    pcs.current.clear();
    if (channelRef.current) { try { supabase.removeChannel(channelRef.current); } catch {} channelRef.current = null; }
    if (localStream.current) { localStream.current.getTracks().forEach((t) => t.stop()); localStream.current = null; }
    setPeers([]);
    setJoined(false);
    setMuted(false);
    setCount(0);
  }, [closePeer]);
  leaveRef.current = leave; // keep the late-bound ref pointing at the latest leave

  const toggleMute = useCallback(() => {
    const track = localStream.current?.getAudioTracks?.()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  }, []);

  // Clean up on unmount.
  useEffect(() => () => { leave(); }, [leave]);

  return { joined, connecting, muted, peers, error, count, full, capacity, meId: meId.current, join, leave, toggleMute };
}
