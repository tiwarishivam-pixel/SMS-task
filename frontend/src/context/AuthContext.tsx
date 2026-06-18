import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import api from "@/api/client";

interface User {
  id: string;
  name: string;
  email: string;
  role?: "user" | "admin";
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(() => {
    const rawUser = localStorage.getItem("user");
    return rawUser ? (JSON.parse(rawUser) as User) : null;
  });

  const persistUser = (nextUser: User) => {
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const login = (nextToken: string, nextUser: User) => {
    localStorage.setItem("token", nextToken);
    persistUser(nextUser);
    setToken(nextToken);
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = (patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...patch };
      localStorage.setItem("user", JSON.stringify(merged));
      return merged;
    });
  };

  const refreshProfile = useCallback(async () => {
    if (!localStorage.getItem("token")) return;
    const response = await api.get("/users/me");
    persistUser(response.data);
  }, []);

  const value = useMemo(
    () => ({ user, token, login, logout, updateUser, refreshProfile }),
    [user, token, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
