"use client";

import { useEffect, useRef, useState } from "react";
import {
  connectSocket,
  getSocketClient,
} from "../lib/websocket";

export default function Chat({ sessionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);

  const subscriptionRef = useRef(null);
  const chatEndRef = useRef(null);
  const seenMessages = useRef(new Set());

  // 🔥 PERSIST MESSAGES (KEY FIX)
  const messagesRef = useRef([]);

  const currentUser = useRef("");
  const role = useRef("");

  // =========================================
  // 👤 LOAD USER
  // =========================================
  useEffect(() => {
    currentUser.current =
      localStorage.getItem("email") || "guest@gmail.com";

    role.current =
      localStorage.getItem("role")?.toUpperCase() === "MENTOR"
        ? "MENTOR"
        : "STUDENT";
  }, []);

  // =========================================
  // 🔽 RESTORE MESSAGES ON MOUNT
  // =========================================
  useEffect(() => {
    setMessages(messagesRef.current);
  }, []);

  // =========================================
  // 🔽 AUTO SCROLL
  // =========================================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // =========================================
  // 🔌 CONNECT + SUBSCRIBE
  // =========================================
  useEffect(() => {
    if (!sessionId) return;

    connectSocket((client) => {
      setConnected(true);

      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }

      subscriptionRef.current = client.subscribe(
        `/topic/chat/${sessionId}`,
        (msg) => {
          try {
            const data = JSON.parse(msg.body);

            if (!data || data.type !== "CHAT") return;

            const key = `${data.name}-${data.message}-${data.timestamp}`;

            if (seenMessages.current.has(key)) return;
            seenMessages.current.add(key);

            const newMsg = {
              message: data.message,
              sender: data.sender,
              name: data.name,
              timestamp: data.timestamp,
            };

            // 🔥 UPDATE BOTH STATE + REF
            messagesRef.current = [...messagesRef.current, newMsg];
            setMessages(messagesRef.current);

          } catch (err) {
            console.error("Parse error:", err);
          }
        }
      );
    });

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [sessionId]);

  // =========================================
  // 📤 SEND MESSAGE
  // =========================================
  const sendMsg = () => {
    if (!input.trim()) return;

    const client = getSocketClient();

    if (!client || !client.connected) return;

    const payload = {
      type: "CHAT",
      message: input,
      sender: role.current,
      name: currentUser.current,
      timestamp: Date.now(),
    };

    client.publish({
      destination: `/app/chat/${sessionId}`,
      body: JSON.stringify(payload),
    });

    setInput("");
  };

  // =========================================
  // ⛔ ENTER FIX
  // =========================================
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMsg();
    }
  };

  // =========================================
  // 🎨 UI
  // =========================================
  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="p-3 bg-black text-white font-semibold">
        Chat Room
      </div>

      {/* MESSAGES */}
      <div className="flex-1 p-3 overflow-y-auto bg-gray-100">
        {messages.map((msg, i) => {
          const isMine = msg.name === currentUser.current;

          return (
            <div
              key={i}
              className={`flex ${
                isMine ? "justify-end" : "justify-start"
              } mb-3`}
            >
              <div
                className={`px-3 py-2 rounded-lg max-w-[70%]
                ${
                  isMine
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300"
                }`}
              >
                <div className="text-xs font-bold mb-1">
                  {msg.sender} ({msg.name})
                </div>

                <div>{msg.message}</div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* INPUT */}
      <div className="flex p-2 border-t bg-white">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-3 py-2 border rounded-full"
          placeholder="Type a message..."
        />

        <button
          onClick={sendMsg}
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-full"
        >
          Send
        </button>
      </div>
    </div>
  );
}