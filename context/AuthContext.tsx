// context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import api, { setAuthToken } from "../lib/api";
import { storage } from "../lib/storage";

type User = { id: number; name: string; email: string };

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helpers
  const clearSession = async () => {
    await storage.deleteItem("token");
    setAuthToken(null);
    setUser(null);
  };

  const refreshSession = async () => {
    const token = await storage.getItem("token");
    if (!token) {
      await clearSession();
      return;
    }
    setAuthToken(token);
    const me = await api.get<User>("/me"); // GET
    setUser(me.data);
  };

  // Restaurar sesión al arrancar
  useEffect(() => {
    (async () => {
      try {
        await refreshSession();
      } catch {
        await clearSession();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await api.post<{ token: string }>("/auth/login", { email, password });
      const token = data.token;
      if (!token) throw new Error("Token ausente");

      await storage.setItem("token", token);
      setAuthToken(token);

      // Trae el usuario; si falla, limpia
      const me = await api.get<User>("/me");
      setUser(me.data);
    } catch (err) {
      await clearSession();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post("/auth/logout").catch(() => {});
    } finally {
      await clearSession();
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}
