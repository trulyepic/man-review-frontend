// src/api/client.ts
import axios from "axios";

// Optional: prevent multiple rapid redirects on burst 401s
let isLoggingOut = false;

function hardLogout() {
  if (isLoggingOut) return;
  isLoggingOut = true;

  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } finally {
    // Force a clean app state; no dependency on React context
    window.location.href = "/";
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_URL, 
  // timeout: 20000, // optional
//   baseURL: "http://localhost:8000"
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler — works without UserContext access
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      hardLogout();
    }
    return Promise.reject(err);
  }
);
