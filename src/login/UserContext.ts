import { createContext } from "react";
import type { UserContextType } from "../types/types";

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);
