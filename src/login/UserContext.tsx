import { useState, useEffect, useContext } from "react";
import type { ReactNode } from "react";
import { UserContext } from "./UserContext";
import type { User, UserContextType } from "../types/types";
import { forceLogout, scheduleLogoutAtJwtExp } from "../util/authUtils";

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");


       if (storedUser && token) {
      try {
        const parsed = JSON.parse(storedUser) as User;
        setUser(parsed);
        scheduleLogoutAtJwtExp(setUser, token);
      } catch (e) {
        // bad JSON -> clear corrupted state
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
      }
    }
  }, []);

  // Optional: cross-tab sync (logout in all tabs)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token" && e.newValue === null) {
        forceLogout(setUser);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
