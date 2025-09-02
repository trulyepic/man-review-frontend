import type { User } from "../types/types";

// 🕐 Auto logout helper
// export function handleAutoLogout(
//   setUser: React.Dispatch<React.SetStateAction<User | null>>,
//   durationMs: number = 6 * 60 * 60 * 1000 // default to 6 hours
// ) {
//   setTimeout(() => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     setUser(null);
//     alert("Session expired. Please login again.");
//     window.location.href = "/";
//   }, durationMs);
// }

let logoutTimer: number | null = null;

function decodeJwt(token: string): { exp?: number } {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function scheduleLogoutAtJwtExp(
  setUser: React.Dispatch<React.SetStateAction<User | null>>,
  token: string
) {
  // clear any prior timer
  if (logoutTimer) {
    window.clearTimeout(logoutTimer);
    logoutTimer = null;
  }

  const { exp } = decodeJwt(token);
  if (!exp) return; // if backend didn't set exp, do nothing (or set a fallback)

  const safetyMs = 30_000; // logout 30s early
  const msUntilExpiry = exp * 1000 - Date.now() - safetyMs;

  if (msUntilExpiry <= 0) {
    forceLogout(setUser);
    return;
  }
  logoutTimer = window.setTimeout(() => forceLogout(setUser), msUntilExpiry);
}

export function forceLogout(
  setUser: React.Dispatch<React.SetStateAction<User | null>>
) {
  try {
    localStorage.setItem("sessionExpired", "1");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } finally {
    setUser(null);
    // alert("Your session has expired. Please log in again.");
    // Hard redirect to guarantee a clean state
    window.location.href = "/";
  }
}
