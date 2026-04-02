"use client";

import { useEffect, useRef, useState } from "react";
import { connectSocket, getSocketClient } from "../lib/websocket";

export default function VideoCall({ sessionId, onCallChange }) {
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const subscriptionRef = useRef(null);

  const [remoteStreams, setRemoteStreams] = useState([]);
  const [inCall, setInCall] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  // ✅ NEW (ONLY ADDITION)
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState("idle");

  const userId = useRef(
    typeof window !== "undefined"
      ? localStorage.getItem("email") || Date.now().toString()
      : Date.now().toString()
  );

  const sendSignal = (data) => {
    const client = getSocketClient();
    if (!client || !client.connected) return;

    client.publish({
      destination: `/app/video/${sessionId}`,
      body: JSON.stringify({
        ...data,
        sender: userId.current,
      }),
    });
  };

  const startMedia = async () => {
    setConnectionStatus("connecting");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current = stream;
    setConnectionStatus("connected");
  };

  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }
  }, [inCall]);

  // ✅ NEW: Replace track for peers
  const replaceTrack = (newTrack) => {
    Object.values(peersRef.current).forEach((peer) => {
      const sender = peer.getSenders().find((s) => s.track?.kind === "video");
      if (sender) sender.replaceTrack(newTrack);
    });
  };

  // ✅ NEW: Start Screen Share
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const screenTrack = screenStream.getVideoTracks()[0];

      replaceTrack(screenTrack);

      const oldTrack = localStreamRef.current.getVideoTracks()[0];
      oldTrack.stop();
      localStreamRef.current.removeTrack(oldTrack);
      localStreamRef.current.addTrack(screenTrack);

      localVideoRef.current.srcObject = localStreamRef.current;

      setIsScreenSharing(true);

      screenTrack.onended = () => stopScreenShare();
    } catch (err) {
      console.error("Screen share error", err);
    }
  };

  // ✅ NEW: Stop Screen Share
  const stopScreenShare = async () => {
    const camStream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    const camTrack = camStream.getVideoTracks()[0];

    replaceTrack(camTrack);

    const oldTrack = localStreamRef.current.getVideoTracks()[0];
    oldTrack.stop();
    localStreamRef.current.removeTrack(oldTrack);
    localStreamRef.current.addTrack(camTrack);

    localVideoRef.current.srcObject = localStreamRef.current;

    setIsScreenSharing(false);
  };

  const createPeer = (id) => {
    if (peersRef.current[id]) return peersRef.current[id];

    const isInitiator = userId.current < id;

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peersRef.current[id] = peer;

    localStreamRef.current?.getTracks().forEach((track) => {
      peer.addTrack(track, localStreamRef.current);
    });

    peer.ontrack = (event) => {
      setRemoteStreams((prev) => {
        if (prev.find((p) => p.id === id)) return prev;
        return [...prev, { id, stream: event.streams[0] }];
      });

      setConnectionStatus("connected");
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: "ICE",
          candidate: event.candidate,
          target: id,
        });
      }
    };

    if (isInitiator) {
      peer.createOffer().then((offer) => {
        peer.setLocalDescription(offer);
        sendSignal({ type: "OFFER", offer, target: id });
      });
    }

    return peer;
  };

  const handleSignal = async (msg) => {
    const data = JSON.parse(msg.body);

    if (data.sender === userId.current) return;
    if (data.target && data.target !== userId.current) return;

    let peer;

    try {
      switch (data.type) {
        case "JOIN":
          createPeer(data.sender);
          break;

        case "OFFER":
          peer = createPeer(data.sender);
          await peer.setRemoteDescription(
            new RTCSessionDescription(data.offer)
          );

          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);

          sendSignal({
            type: "ANSWER",
            answer,
            target: data.sender,
          });
          break;

        case "ANSWER":
          peer = peersRef.current[data.sender];
          await peer?.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          break;

        case "ICE":
          peer = peersRef.current[data.sender];
          await peer?.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
          break;

        case "END":
          removePeer(data.sender);
          break;
      }
    } catch (err) {
      console.error("WebRTC error", err);
    }
  };

  const removePeer = (id) => {
    const peer = peersRef.current[id];
    if (peer) peer.close();

    delete peersRef.current[id];
    setRemoteStreams((prev) => prev.filter((p) => p.id !== id));
  };

  useEffect(() => {
    if (!sessionId) return;

    connectSocket((client) => {
      subscriptionRef.current = client.subscribe(
        `/topic/video/${sessionId}`,
        handleSignal
      );
    });

    return () => fullCleanup();
  }, [sessionId]);

  const startCall = async () => {
    await startMedia();
    setInCall(true);
    sendSignal({ type: "JOIN" });
    onCallChange?.(true);
  };

  const endCall = () => {
    sendSignal({ type: "END" });
    fullCleanup();
  };

  const toggleMute = () => {
    const audioTracks = localStreamRef.current?.getAudioTracks();
    audioTracks?.forEach((track) => (track.enabled = !track.enabled));
    setIsMuted(!isMuted);
  };

  const toggleCamera = () => {
    const videoTracks = localStreamRef.current?.getVideoTracks();
    videoTracks?.forEach((track) => (track.enabled = !track.enabled));
    setIsCameraOff(!isCameraOff);
  };

  const fullCleanup = () => {
    Object.values(peersRef.current).forEach((peer) => peer.close());
    peersRef.current = {};

    localStreamRef.current?.getTracks().forEach((t) => t.stop());

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    setRemoteStreams([]);
    setInCall(false);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setConnectionStatus("idle");

    onCallChange?.(false);
  };

  const totalUsers = remoteStreams.length + (inCall ? 1 : 0);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#020617] to-[#0f172a] rounded-xl overflow-hidden">

      {/* HEADER */}
      <div className="flex justify-between items-center px-5 py-3 bg-white/5 backdrop-blur border-b border-white/10">
        <span className="text-white font-semibold">🎥 Live Video Call</span>

        {connectionStatus === "connecting" && (
          <span className="text-yellow-400 text-xs">Connecting...</span>
        )}
        {connectionStatus === "connected" && (
          <span className="text-green-400 text-xs">● Live</span>
        )}
      </div>

      {/* STATUS MESSAGE */}
      {inCall && remoteStreams.length === 0 && (
        <div className="absolute top-16 w-full text-center text-gray-400 text-sm">
          Waiting for others to join...
        </div>
      )}

      {/* FOCUS MODE */}
      {totalUsers === 1 && inCall ? (
        <div className="flex items-center justify-center h-full p-6">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="w-[60%] md:w-[50%] lg:w-[45%] max-w-2xl rounded-xl shadow-lg border border-white/10"
          />
        </div>
      ) : (
        <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          {inCall && (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className="w-full h-52 object-cover rounded-xl"
            />
          )}

          {remoteStreams.map((user) => (
            <video
              key={user.id}
              autoPlay
              ref={(video) => {
                if (video && user.stream) {
                  video.srcObject = user.stream;
                }
              }}
              className="w-full h-52 object-cover rounded-xl"
            />
          ))}
        </div>
      )}

      {/* CONTROLS */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 bg-white/10 backdrop-blur px-6 py-3 rounded-full">

        {!inCall ? (
          <button
            onClick={startCall}
            className="bg-green-500 px-5 py-2 rounded-full text-white"
          >
            ▶ Start
          </button>
        ) : (
          <>
            <button onClick={toggleMute} className="bg-gray-700 px-4 py-2 rounded-full text-white">
              {isMuted ? "🔊" : "🔇"}
            </button>

            <button onClick={toggleCamera} className="bg-gray-700 px-4 py-2 rounded-full text-white">
              {isCameraOff ? "📷" : "📷❌"}
            </button>

            {/* ✅ ONLY NEW BUTTON */}
            <button
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              className="bg-gray-700 px-4 py-2 rounded-full text-white"
            >
              📺
            </button>

            <button onClick={endCall} className="bg-red-500 px-5 py-2 rounded-full text-white">
              ⛔ End
            </button>
          </>
        )}
      </div>
    </div>
  );
}