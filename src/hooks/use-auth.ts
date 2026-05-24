"use client";

import { useState, useEffect, useCallback } from "react";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  const fetchCurrentUser = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setState({ user: data.data, token, loading: false });
      } else {
        localStorage.removeItem("auth-token");
        setState({ user: null, token: null, loading: false });
      }
    } catch {
      setState({ user: null, token: null, loading: false });
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("auth-token");
    if (stored) {
      fetchCurrentUser(stored);
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");

    localStorage.setItem("auth-token", data.data.token);
    setState({ user: data.data.user, token: data.data.token, loading: false });
    return data.data;
  };

  const logout = async () => {
    localStorage.removeItem("auth-token");
    setState({ user: null, token: null, loading: false });
  };

  const getToken = () => {
    if (state.token) return state.token;
    return localStorage.getItem("auth-token");
  };

  return { ...state, login, logout, getToken };
}
