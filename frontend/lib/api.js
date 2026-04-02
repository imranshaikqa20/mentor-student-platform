import axios from "axios";

// =====================================
// ✅ AXIOS INSTANCE
// =====================================
const api = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 8000,
});

// =====================================
// ✅ AUTH ROUTES CHECK
// =====================================
const isAuthRoute = (url = "") =>
  url.includes("/auth/login") || url.includes("/auth/signup");

// =====================================
// ✅ REQUEST INTERCEPTOR
// =====================================
api.interceptors.request.use(
  (config) => {
    try {
      console.log("📤 API REQUEST:", config.method?.toUpperCase(), config.url);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : null;

      if (token && !isAuthRoute(config.url)) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("🔐 Token attached");
      }

      return config;
    } catch (err) {
      console.error("❌ REQUEST ERROR:", err);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// =====================================
// 🚨 REDIRECT CONTROL
// =====================================
let isRedirecting = false;

// =====================================
// ✅ RESPONSE INTERCEPTOR
// =====================================
api.interceptors.response.use(
  (response) => {
    console.log("✅ API RESPONSE:", response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error("❌ API ERROR:", error);

    // =====================================
    // ⏱️ TIMEOUT
    // =====================================
    if (error.code === "ECONNABORTED") {
      alert("Request timeout. Backend not responding.");
      return Promise.reject(error);
    }

    // =====================================
    // 📡 BACKEND RESPONSE
    // =====================================
    if (error.response) {
      const { status, config } = error.response;

      console.warn("⚠️ API FAILED:", config?.url);
      console.warn("⚠️ STATUS:", status);

      // =====================================
      // 🔥 SMART 401 HANDLING (FINAL FIX)
      // =====================================
      if (status === 401) {

        console.warn("🚨 401 from:", config?.url);

        // ❗ Only logout for critical APIs
        const isCritical =
          config?.url?.includes("/sessions") ||
          config?.url?.includes("/user");

        if (isCritical) {
          console.warn("🚪 Critical auth failure → logout");

          if (!isRedirecting && typeof window !== "undefined") {
            isRedirecting = true;

            localStorage.removeItem("token");

            alert("Session expired. Please login again.");

            window.location.replace("/");

            setTimeout(() => {
              isRedirecting = false;
            }, 2000);
          }
        } else {
          // 🔥 Ignore non-critical 401
          console.warn("⚠️ Ignored 401 (non-critical)");
        }
      }
    }

    // =====================================
    // 🚫 NO RESPONSE
    // =====================================
    else if (error.request) {
      alert("Backend not reachable. Please check server.");
    }

    return Promise.reject(error);
  }
);

export default api;