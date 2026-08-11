"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { getMe, logout as apiLogout, getToken } from "@/lib/api";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ user: null, loading: false, error: null });
      return;
    }

    try {
      const user = await getMe();
      setState({ user, loading: false, error: null });
    } catch {
      setState({ user: null, loading: false, error: "Session expired" });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(() => {
    apiLogout();
    setState({ user: null, loading: false, error: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
