// src/api/client.ts
import axios from "axios";
import type { AxiosError, AxiosResponse } from "axios";

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
  // baseURL: "http://localhost:8000",
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    // Axios header values must be strings|number|boolean
    (
      config.headers as Record<string, string>
    ).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Narrow/guard helpers
function isCanceledError(err: unknown): boolean {
  // axios.isCancel exists in axios v1; feature-check for safety
  if (
    typeof (axios as { isCancel?: (v: unknown) => boolean }).isCancel ===
    "function"
  ) {
    if (axios.isCancel(err)) return true;
  }
  if (err && typeof err === "object") {
    const obj = err as { code?: unknown; name?: unknown; message?: unknown };
    if (obj.code === "ERR_CANCELED") return true;
    if (obj.name === "CanceledError" || obj.name === "AbortError") return true;
    if (obj.message === "canceled") return true;
  }
  return false;
}

function isAxiosErr<T = unknown>(err: unknown): err is AxiosError<T> {
  return (
    (
      axios as { isAxiosError?: (payload: unknown) => payload is AxiosError }
    ).isAxiosError?.(err) ?? false
  );
}

// Global 401 handler — works without UserContext access
api.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: unknown) => {
    // Ignore cancels here so they don't trigger logout logic
    if (isCanceledError(err)) {
      return Promise.reject(err);
    }
    if (isAxiosErr(err)) {
      const status = err.response?.status;
      if (status === 401) hardLogout();
    }
    return Promise.reject(err);
  }
);

// a tiny helper to use in UI
export const isRequestCanceled = (err: unknown): boolean => {
  return isCanceledError(err);
};
