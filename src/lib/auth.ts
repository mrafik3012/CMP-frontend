/** Restore user from token on app load (e.g. after refresh). */
import { useEffect } from "react";
import { authApi } from "../api/client";
import { useAuthStore } from "../stores/authStore";

export function useAuthRestore() {
  const setUser = useAuthStore((s) => s.setUser);
  const setAuthChecked = useAuthStore((s) => s.setAuthChecked);

  useEffect(() => {
    // Use vanilla fetch to avoid axios interceptor retry loop on startup
    fetch("/api/v1/auth/me", {
      credentials: "include",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setUser(data ?? null);
        setAuthChecked();
      })
      .catch(() => {
        setUser(null);
        setAuthChecked();
      });
  }, []);
}
