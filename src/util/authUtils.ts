import type { User } from "../types/types";

// 🕐 Auto logout helper
export function handleAutoLogout(
  setUser: React.Dispatch<React.SetStateAction<User | null>>,
  durationMs: number = 10 * 60 * 60 * 1000 // default to 10 hours
) {
  setTimeout(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    alert("Session expired. Please login again.");
    window.location.href = "/";
  }, durationMs);
}
