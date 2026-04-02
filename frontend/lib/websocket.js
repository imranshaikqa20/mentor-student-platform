// lib/websocket.js

import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let stompClient = null;
let isConnecting = false;

// ✅ NEW: message queue (fixes early publish issues)
let messageQueue = [];

// =========================================
// 🚀 CONNECT SOCKET (IMPROVED)
// =========================================
export const connectSocket = (onConnect) => {
  if (stompClient && stompClient.connected) {
    console.log("⚡ Already connected");
    onConnect && onConnect(stompClient);
    return stompClient;
  }

  if (isConnecting) {
    console.log("⏳ Already connecting...");
    return;
  }

  isConnecting = true;

  const token = localStorage.getItem("token");

  console.log("🔐 Token:", token ? "Present" : "Missing");

  stompClient = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8080/ws"),

    connectHeaders: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},

    reconnectDelay: 5000,

    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    debug: (str) => {
      console.log("STOMP:", str);
    },

    // =========================================
    // ✅ CONNECTED
    // =========================================
    onConnect: (frame) => {
      console.log("✅ WebSocket CONNECTED");

      isConnecting = false;

      // ✅ flush queued messages
      messageQueue.forEach((msg) => {
        stompClient.publish(msg);
      });
      messageQueue = [];

      if (onConnect) onConnect(stompClient);
    },

    // =========================================
    // ❌ STOMP ERROR
    // =========================================
    onStompError: (frame) => {
      console.error("❌ STOMP ERROR:", frame.headers["message"]);
      console.error("❌ Details:", frame.body);
      isConnecting = false;
    },

    // =========================================
    // ❌ WS ERROR
    // =========================================
    onWebSocketError: (error) => {
      console.error("❌ WebSocket ERROR:", error);
      isConnecting = false;
    },

    // =========================================
    // ⚠️ WS CLOSE
    // =========================================
    onWebSocketClose: () => {
      console.warn("⚠️ WebSocket CLOSED");
      isConnecting = false;
    },
  });

  stompClient.activate();

  return stompClient;
};

// =========================================
// 📤 SAFE PUBLISH (🔥 IMPORTANT)
// =========================================
export const publishMessage = (destination, body) => {
  const msg = {
    destination,
    body: JSON.stringify(body),
  };

  if (stompClient && stompClient.connected) {
    stompClient.publish(msg);
  } else {
    console.warn("⏳ Socket not ready, queueing message");
    messageQueue.push(msg);
  }
};

// =========================================
// 🔌 DISCONNECT SOCKET
// =========================================
export const disconnectSocket = () => {
  if (stompClient) {
    console.log("🔌 Disconnecting socket...");
    stompClient.deactivate();
    stompClient = null;
    isConnecting = false;
    messageQueue = [];
  }
};

// =========================================
// 📦 GET CLIENT
// =========================================
export const getSocketClient = () => {
  return stompClient;
};