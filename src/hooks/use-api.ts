"use client";

import { useCallback } from "react";

export function useApi() {
  const getToken = useCallback(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth-token");
  }, []);

  const request = useCallback(
    async <T = unknown>(
      url: string,
      options: RequestInit = {}
    ): Promise<{ data?: T; error?: string }> => {
      const token = getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      try {
        const res = await fetch(url, { ...options, headers });
        const json = await res.json();

        if (!res.ok) {
          return { error: json.error || "Error en la solicitud" };
        }

        return { data: json.data ?? json };
      } catch (err) {
        return { error: "Error de conexión" };
      }
    },
    [getToken]
  );

  const get = useCallback(
    <T = unknown>(url: string) => request<T>(url),
    [request]
  );

  const post = useCallback(
    <T = unknown>(url: string, body: unknown) =>
      request<T>(url, { method: "POST", body: JSON.stringify(body) }),
    [request]
  );

  const put = useCallback(
    <T = unknown>(url: string, body: unknown) =>
      request<T>(url, { method: "PUT", body: JSON.stringify(body) }),
    [request]
  );

  const del = useCallback(
    <T = unknown>(url: string) => request<T>(url, { method: "DELETE" }),
    [request]
  );

  return { get, post, put, del };
}
