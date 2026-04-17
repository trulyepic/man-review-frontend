import type { User, UserRole } from "../types/types";

function normalizeRole(role?: UserRole | null): string {
  return String(role || "GENERAL").toUpperCase();
}

export function isAdminRole(role?: UserRole | null): boolean {
  return normalizeRole(role) === "ADMIN";
}

export function canSubmitSeriesRole(role?: UserRole | null): boolean {
  return ["ADMIN", "CONTRIBUTOR"].includes(normalizeRole(role));
}

export function isAdminUser(user?: User | null): boolean {
  return isAdminRole(user?.role);
}

export function canSubmitSeriesUser(user?: User | null): boolean {
  return canSubmitSeriesRole(user?.role);
}
