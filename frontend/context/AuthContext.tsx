"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface UserProfile {
  id: number;
  uuid: string;
  email: string;
  fullName: string;
  company?: string;
  department?: string;
  jobTitle?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and load user if token is present
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem("accessToken");
      if (storedToken) {
        setAccessToken(storedToken);
        try {
          const res = await api.get("/api/users/me");
          setCurrentUser(res.data);
          setIsAuthenticated(true);
        } catch (err) {
          // Token might be expired, Axios response interceptor will attempt refresh.
          // If refresh fails, it redirects to /login.
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      const { accessToken: access, refreshToken: refresh, user } = res.data;

      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
      
      setAccessToken(access);
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      router.push("/dashboard");
    } catch (err) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/register", data);
      const { accessToken: access, refreshToken: refresh, user } = res.data;

      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);

      setAccessToken(access);
      setCurrentUser(user);
      setIsAuthenticated(true);

      router.push("/dashboard");
    } catch (err) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    const refresh = localStorage.getItem("refreshToken");
    try {
      if (refresh) {
        await api.post("/api/auth/logout", { refreshToken: refresh });
      }
    } catch (err) {
      // Continue even if server request fails
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setAccessToken(null);
      setCurrentUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      router.push("/login");
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get("/api/users/me");
      setCurrentUser(res.data);
    } catch (err) {
      // Ignored
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        accessToken,
        isAuthenticated,
        isLoading,
        login,
        registerUser,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
