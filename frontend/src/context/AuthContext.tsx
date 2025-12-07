// src/context/AuthContext.tsx
import { createContext, useEffect, useState, ReactNode } from "react";
import api from "../api/axios";

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Uygulama ilk açıldığında access token varsa /auth/me ile user'ı çek
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setLoading(false);
      return;
    }

    const loadMe = async () => {
      try {
        const res = await api.get("/auth/me/");
        setUser(res.data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("auth/me hatası:", err);
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    // JWT token al
    const res = await api.post("/auth/token/", {
      username: usernameOrEmail,
      password,
    });

    const { access, refresh } = res.data;
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);

    // Kullanıcı bilgisi çek
    const meRes = await api.get("/auth/me/");
    setUser(meRes.data);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

