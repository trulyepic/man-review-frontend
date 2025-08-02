import { useContext } from "react";

import type { UserContextType } from "../types/types";
import { UserContext } from "./UserContext";

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
