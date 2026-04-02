"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import API from "../lib/api";

export default function AuthPage() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "MENTOR",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token) {
      if (role === "MENTOR") {
        router.replace("/dashboard/mentor");
      } else {
        router.replace("/dashboard/student");
      }
    }
  }, [router]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (!form.email || !form.password) {
      setError("Email and Password are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const url = isLogin ? "/auth/login" : "/auth/signup";
      const res = await API.post(url, form);

      localStorage.setItem("token", res.data.token);

      const email = res.data.email || form.email;
      const role = (res.data.role || form.role || "STUDENT").toUpperCase();

      localStorage.setItem("email", email);
      localStorage.setItem("role", role);

      if (role === "MENTOR") {
        router.replace("/dashboard/mentor");
      } else {
        router.replace("/dashboard/student");
      }

    } catch (err) {
      if (err.response) {
        const message =
          err.response.data?.message ||
          err.response.data ||
          "Invalid credentials";
        setError(message);
      } else if (err.request) {
        setError("Backend not reachable. Start server.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">

        {/* TITLE */}
        <h2 className="text-2xl font-bold text-center mb-6 text-black">
          {isLogin ? "Login" : "Create Account"}
        </h2>

        {/* ERROR */}
        {error && (
          <div className="mb-4 p-2 text-sm text-red-600 bg-gray-100 border border-gray-300 rounded text-center">
            {error}
          </div>
        )}

        {/* EMAIL */}
        <div className="mb-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
          />
        </div>

        {/* PASSWORD */}
        <div className="mb-4 relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
          />

          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2 cursor-pointer text-sm text-gray-600"
          >
            {showPassword ? "Hide" : "Show"}
          </span>
        </div>

        {/* ROLE */}
        {!isLogin && (
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
          >
            <option value="MENTOR">Mentor</option>
            <option value="STUDENT">Student</option>
          </select>
        )}

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2 bg-black text-white rounded-lg hover:opacity-90 transition"
        >
          {loading
            ? "Processing..."
            : isLogin
            ? "Login"
            : "Sign Up"}
        </button>

        {/* SWITCH */}
        <p className="text-center text-gray-600 mt-4 text-sm">
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}

          <span
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-black font-semibold ml-1 cursor-pointer"
          >
            {isLogin ? "Sign up" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
}