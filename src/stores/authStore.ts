/**
 * Auth state. FR-AUTH-005: role for route guards.
 */
import { create } from "zustand";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  authChecked: boolean;
  setUser: (u: User | null) => void;
  setAuthChecked: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authChecked: false,
  setUser: (user) => set({ user }),
  setAuthChecked: () => set({ authChecked: true }),
  logout: () => set({ user: null }),
}));
