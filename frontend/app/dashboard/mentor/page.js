"use client";

import api from "../../../lib/api";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// =========================================
// ✅ Decode JWT safely
// =========================================
function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

// =========================================
// ✅ Check token expiry
// =========================================
function isTokenExpired(payload) {
  if (!payload?.exp) return true;
  return payload.exp * 1000 < Date.now();
}

export default function MentorDashboard() {
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const hasRedirected = useRef(false);

  // =========================================
  // 🔒 VALIDATE AUTH + ROLE
  // =========================================
  const validateUser = () => {
    if (hasRedirected.current) return;

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        hasRedirected.current = true;
        router.replace("/");
        return;
      }

      const payload = decodeToken(token);

      if (!payload || isTokenExpired(payload)) {
        localStorage.clear();
        hasRedirected.current = true;
        router.replace("/");
        return;
      }

      // ✅ Normalize role
      let role = payload.role || "";
      role = role.replace("ROLE_", "").toUpperCase();

      if (role !== "MENTOR") {
        hasRedirected.current = true;
        router.replace("/dashboard/student"); // safe redirect
      }
    } catch (err) {
      console.error("Auth error:", err);
      localStorage.clear();
      hasRedirected.current = true;
      router.replace("/");
    }
  };

  // =========================================
  // ✅ INITIAL LOAD
  // =========================================
  useEffect(() => {
    validateUser();
  }, []);

  // =========================================
  // 🔥 BACK BUTTON FIX
  // =========================================
  useEffect(() => {
    const revalidate = () => {
      hasRedirected.current = false;
      validateUser();
    };

    window.addEventListener("focus", revalidate);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        revalidate();
      }
    });

    return () => {
      window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", revalidate);
    };
  }, []);

  // =========================================
  // 🚀 CREATE SESSION
  // =========================================
  const createSession = async () => {
    try {
      setLoading(true);

      const res = await api.post("/sessions/create");
      const id = res.data?.id;

      if (!id) throw new Error("Invalid session response");

      setSessionId(id);

      console.log("✅ Session created:", id);
    } catch (err) {
      console.error("❌ Create session error:", err);

      alert(
        err.response?.data?.error ||
          err.response?.data ||
          err.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // 🚪 LOGOUT
  // =========================================
  const handleLogout = () => {
    localStorage.clear();
    router.replace("/");
  };

  // =========================================
  // ▶ START SESSION
  // =========================================
  const startSession = () => {
    if (!sessionId) {
      alert("Please create session first");
      return;
    }

    router.push(`/session/${sessionId}`);
  };

  // =========================================
  // 🎨 UI
  // =========================================
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          👨‍🏫 Mentor Dashboard
        </h2>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* CARD */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-6 max-w-xl mx-auto">
        {/* CREATE SESSION */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            🚀 Create New Session
          </h3>

          <button
            onClick={createSession}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Session"}
          </button>
        </div>

        {/* SESSION INFO */}
        {sessionId && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Session ID</p>
            <p className="font-mono text-lg text-blue-700 break-all">
              {sessionId}
            </p>
          </div>
        )}

        {/* START SESSION */}
        <div>
          <button
            onClick={startSession}
            className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-black transition"
          >
            ▶️ Start Session
          </button>
        </div>
      </div>
    </div>
  );
}