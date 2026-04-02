"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  connectSocket,
  getSocketClient,
} from "../lib/websocket";

export default function CodeEditor({ sessionId }) {
  const [code, setCode] = useState("// 🚀 Start coding...");

  const timeoutRef = useRef(null);
  const isRemoteUpdate = useRef(false);
  const subscriptionRef = useRef(null);

  // =========================================
  // 📥 LOAD SAVED CODE
  // =========================================
  useEffect(() => {
    if (!sessionId) return;

    fetch(`http://localhost:8080/api/sessions/${sessionId}/code`)
      .then((res) => res.text())
      .then((data) => {
        if (data) setCode(data);
      })
      .catch(() => {});
  }, [sessionId]);

  // =========================================
  // 🔌 CONNECT + SUBSCRIBE
  // =========================================
  useEffect(() => {
    if (!sessionId) return;

    connectSocket((client) => {
      subscriptionRef.current?.unsubscribe();

      subscriptionRef.current = client.subscribe(
        `/topic/session/${sessionId}`,
        (msg) => {
          try {
            const data = JSON.parse(msg.body);

            if (!data || data.type !== "CODE") return;

            isRemoteUpdate.current = true;

            setCode(data.content || "");

            setTimeout(() => {
              isRemoteUpdate.current = false;
            }, 50);
          } catch (e) {
            console.error("Parse error", e);
          }
        }
      );
    });

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [sessionId]);

  // =========================================
  // 📤 SEND CODE
  // =========================================
  const handleChange = (value) => {
    setCode(value);

    if (isRemoteUpdate.current) return;

    clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const client = getSocketClient();

      if (!client || !client.connected) return;

      client.publish({
        destination: `/app/session/${sessionId}`,
        body: JSON.stringify({
          type: "CODE",
          content: value,
        }),
      });
    }, 300);
  };

  // =========================================
  // 🧹 CLEANUP
  // =========================================
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  // =========================================
  // 🎨 UI (MONACO EDITOR)
  // =========================================
  return (
    <div className="h-full flex flex-col bg-white rounded-xl overflow-hidden border border-gray-300">

      {/* HEADER */}
      <div className="px-4 py-2 bg-gray-100 border-b flex justify-between items-center">
        <span className="font-medium text-sm">💻 Code Editor</span>
        <span className="text-green-500 text-xs">● Live</span>
      </div>

      {/* MONACO EDITOR */}
      <div className="flex-1">
        <Editor
          height="100%"
          language="javascript" // you can change dynamically later
          theme="vs-dark"
          value={code}
          onChange={handleChange}
          options={{
            fontSize: 14,
            fontFamily: "monospace",
            minimap: { enabled: false },
            wordWrap: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}