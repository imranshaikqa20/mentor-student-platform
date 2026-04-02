"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const pathname = usePathname(); // ✅ get current route

  const loadUser = () => {
    const storedRole = localStorage.getItem("role");
    const storedEmail = localStorage.getItem("email");

    setRole(storedRole);
    setEmail(storedEmail);
    setIsLoaded(true);
  };

  useEffect(() => {
    loadUser();

    window.addEventListener("storage", loadUser);
    return () => window.removeEventListener("storage", loadUser);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setRole(null);
    setEmail(null);
    window.location.href = "/";
  };

  // ⛔ Wait until data loads
  if (!isLoaded) return null;

  // ⛔ Hide navbar on auth pages
  const hideOnRoutes = ["/", "/login", "/register"];
  if (hideOnRoutes.includes(pathname)) return null;

  // ⛔ Hide if not logged in
  if (!role) return null;

  // ✅ Show navbar only when logged in & not on auth pages
  return (
    <div className="w-full bg-black text-white px-6 py-4 flex justify-between items-center">

      {/* Logo */}
      <Link href="/dashboard" className="text-lg font-bold hover:text-blue-400">
        🚀 Dashboard
      </Link>

      <div className="flex items-center gap-6">

        <Link href="/dashboard" className="hover:text-blue-400">
          Dashboard
        </Link>

        {role === "MENTOR" && (
          <>
            <Link href="/sessions">Sessions</Link>
            <Link href="/students">Students</Link>
          </>
        )}

        {role === "USER" && (
          <>
            <Link href="/mentors">Find Mentors</Link>
            <Link href="/my-sessions">My Sessions</Link>
          </>
        )}

        <span className="text-sm bg-gray-800 px-3 py-1 rounded">
          {email} ({role})
        </span>

        <button
          onClick={handleLogout}
          className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}