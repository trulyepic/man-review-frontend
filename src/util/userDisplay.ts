export function usernameClassName(role?: string | null): string {
  const normalized = String(role || "").toUpperCase();

  if (normalized === "ADMIN") {
    return "bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-transparent";
  }

  if (normalized === "CONTRIBUTOR") {
    return "bg-gradient-to-r from-blue-300 via-sky-300 to-cyan-200 bg-clip-text text-transparent";
  }

  return "text-slate-950 dark:text-white";
}

export function inlineUsernameClassName(role?: string | null): string {
  const normalized = String(role || "").toUpperCase();

  if (normalized === "ADMIN") {
    return "bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-transparent";
  }

  if (normalized === "CONTRIBUTOR") {
    return "bg-gradient-to-r from-blue-300 via-sky-300 to-cyan-200 bg-clip-text text-transparent";
  }

  return "text-slate-700 dark:text-slate-200";
}
