"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  connectSocket,
  disconnectSocket,
  getSocketClient, // ✅ added
} from "../../../lib/websocket";

import Chat from "../../../components/Chat";
import CodeEditor from "../../../components/CodeEditor";
import VideoCall from "../../../components/VideoCall";

export default function SessionRoom() {
  const { id } = useParams();
  const router = useRouter();

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  const [activeView, setActiveView] = useState(null);
  const [hidden, setHidden] = useState({
    code: false,
    video: false,
    chat: false,
  });

  // ✅ NEW: Presence state
  const [onlineUsers, setOnlineUsers] = useState([]);

  const socketRef = useRef(null);

  // =========================================
  // 🔌 SOCKET CONNECT
  // =========================================
  useEffect(() => {
    if (!id) return;

    const socket = connectSocket(() => {
      setConnected(true);
      setError("");
    });

    socketRef.current = socket;

    socket.onDisconnect = () => {
      setConnected(false);
      setError("Connection lost...");
    };

    return () => {
      disconnectSocket();
    };
  }, [id]);

  // =========================================
  // 👥 PRESENCE SUBSCRIBE
  // =========================================
  useEffect(() => {
    if (!id || !connected) return;

    const client = getSocketClient();

    const sub = client.subscribe(`/topic/presence/${id}`, (msg) => {
      const data = JSON.parse(msg.body);
      setOnlineUsers(data.users || []);
    });

    return () => sub.unsubscribe();
  }, [id, connected]);

  // =========================================
  // 👤 JOIN / LEAVE
  // =========================================
  useEffect(() => {
    if (!id || !connected) return;

    const client = getSocketClient();
    const user = localStorage.getItem("email");

    // JOIN
    client.publish({
      destination: `/app/presence/${id}`,
      body: JSON.stringify({
        type: "JOIN",
        user,
      }),
    });

    return () => {
      // LEAVE
      client.publish({
        destination: `/app/presence/${id}`,
        body: JSON.stringify({
          type: "LEAVE",
          user,
        }),
      });
    };
  }, [id, connected]);

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center text-black bg-white">
        {error}
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="h-screen flex items-center justify-center text-black bg-white">
        Connecting...
      </div>
    );
  }

  const toggleMinimize = (key) => {
    setHidden((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const maximize = (key) => {
    setActiveView(key);
  };

  const restore = () => {
    setActiveView(null);
  };

  const renderControls = (key) => (
    <div className="absolute top-2 right-2 flex gap-2 z-50">
      <button
        onClick={() => {
          if (activeView === key) {
            restore();
          } else {
            toggleMinimize(key);
          }
        }}
        className="bg-gray-800 text-white px-2 py-1 rounded"
      >
        —
      </button>

      {activeView !== key && (
        <button
          onClick={() => maximize(key)}
          className="bg-gray-800 text-white px-2 py-1 rounded"
        >
          ⬜
        </button>
      )}
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-white text-black flex flex-col">

      {/* HEADER */}
      <div className="flex flex-col bg-white border-b border-gray-300 shadow-sm">

        {/* TOP BAR */}
        <div className="flex items-center p-3">
          <button
            onClick={() => router.back()}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            ⬅
          </button>
        </div>

        {/* ✅ ONLINE USERS BAR (NEW) */}
        <div className="flex items-center gap-3 px-3 pb-2 overflow-x-auto">
          <span className="text-sm font-semibold">👥 Online:</span>

          {onlineUsers.length === 0 ? (
            <span className="text-gray-400 text-sm">No users</span>
          ) : (
            onlineUsers.map((user, i) => (
              <span
                key={i}
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap"
              >
                🟢 {user}
              </span>
            ))
          )}
        </div>
      </div>

      {/* MAIN */}
      <div className="flex flex-1 p-2 gap-2 bg-white overflow-hidden">

        {/* LEFT SIDE */}
        {(activeView === null || activeView === "code" || activeView === "video") && (
          <div className="flex flex-col flex-[3] gap-2 overflow-hidden">

            {/* CODE */}
            {(activeView === null || activeView === "code") && !hidden.code && (
              <div className="flex-[3] border border-gray-300 rounded-xl relative shadow-sm overflow-hidden">
                {renderControls("code")}
                <div className="h-full w-full overflow-auto">
                  <CodeEditor sessionId={id} />
                </div>
              </div>
            )}

            {/* VIDEO */}
            {(activeView === null || activeView === "video") && !hidden.video && (
              <div className="flex-[1] border border-gray-300 rounded-xl relative shadow-sm overflow-hidden">
                {renderControls("video")}
                <div className="h-full w-full overflow-auto">
                  <VideoCall sessionId={id} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* CHAT */}
        {(activeView === null || activeView === "chat") && !hidden.chat && (
          <div
            className={
              activeView === "chat"
                ? "flex-1 border border-gray-300 rounded-xl relative shadow-sm overflow-hidden"
                : "w-[320px] border border-gray-300 rounded-xl relative shadow-sm overflow-hidden"
            }
          >
            {renderControls("chat")}
            <div className="h-full flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <Chat sessionId={id} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RESTORE BAR */}
      <div className="flex gap-2 p-2 bg-white border-t border-gray-300 overflow-x-auto">
        {hidden.code && (
          <button onClick={() => toggleMinimize("code")} className="bg-gray-200 px-3 py-1 rounded">
            Code
          </button>
        )}
        {hidden.video && (
          <button onClick={() => toggleMinimize("video")} className="bg-gray-200 px-3 py-1 rounded">
            Video
          </button>
        )}
        {hidden.chat && (
          <button onClick={() => toggleMinimize("chat")} className="bg-gray-200 px-3 py-1 rounded">
            Chat
          </button>
        )}
      </div>
    </div>
  );
}