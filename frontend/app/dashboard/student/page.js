"use client";

import api from "../../../lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {

  const [sessionId, setSessionId] = useState("");
  const router = useRouter();

  // ✅ LOGOUT FUNCTION
  const handleLogout = () => {
    localStorage.removeItem("token"); // 🔥 remove token
    alert("Logged out successfully");

    router.push("/"); // 🔥 redirect to login page
  };

  return (
    <div className="p-4 space-y-4">

      {/* 🔥 Header with Logout */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Student Dashboard</h2>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>

      {/* 🔹 Join Session */}
      <input
        className="border p-2 w-full"
        placeholder="Enter Session ID"
        value={sessionId}
        onChange={(e) => setSessionId(e.target.value)}
      />

      <button
        className="bg-black text-white p-2 w-full"
        onClick={() => {
          if (!sessionId) {
            alert("Please enter session ID");
            return;
          }
          router.push(`/session/${sessionId}`);
        }}
      >
        Join Session
      </button>

    </div>
  );
}