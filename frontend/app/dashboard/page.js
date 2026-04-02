"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch (e) {
    return null;
  }
}

function isTokenExpired(payload) {
  if (!payload?.exp) return true;
  return payload.exp * 1000 < Date.now();
}

export default function DashboardRedirect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const hasRedirected = useRef(false);

  const validateAndRedirect = () => {
    if (hasRedirected.current) return;

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        hasRedirected.current = true;
        router.replace("/");
        return;
      }

      const payload = decodeToken(token);

      if (!payload) {
        localStorage.clear();
        hasRedirected.current = true;
        router.replace("/");
        return;
      }

      if (isTokenExpired(payload)) {
        localStorage.clear();
        hasRedirected.current = true;
        router.replace("/");
        return;
      }

      let role = payload.role;

      if (!role) {
        localStorage.clear();
        hasRedirected.current = true;
        router.replace("/");
        return;
      }

      role = role.replace("ROLE_", "").toUpperCase();

      hasRedirected.current = true;

      if (role === "MENTOR") {
        router.replace("/dashboard/mentor");
      } else if (role === "STUDENT") {
        router.replace("/dashboard/student");
      } else {
        localStorage.clear();
        router.replace("/");
      }

    } catch (error) {
      console.error("Dashboard redirect error:", error);
      localStorage.clear();
      hasRedirected.current = true;
      router.replace("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    validateAndRedirect();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      hasRedirected.current = false;
      validateAndRedirect();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        hasRedirected.current = false;
        validateAndRedirect();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // ✅ WHITE UI LOADER
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-white text-black">

        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>

        <p className="text-lg font-semibold">
          Redirecting to your dashboard...
        </p>
      </div>
    );
  }

  return null;
}