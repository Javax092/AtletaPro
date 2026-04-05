import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AuthResponse, Club, User } from "../types/auth";
import { authApi } from "../api/auth";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  club: Club | null;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    clubName: string;
    clubSlug: string;
    adminName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const storageTokenKey = "sports_ai_token";
const storageAuthKey = "sports_ai_auth";

const persistAuth = (data: AuthResponse) => {
  localStorage.setItem(storageTokenKey, data.token);
  localStorage.setItem(storageAuthKey, JSON.stringify(data));
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [club, setClub] = useState<Club | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(storageAuthKey);
    if (!stored) return;
    const parsed = JSON.parse(stored) as AuthResponse;
    setToken(parsed.token);
    setUser(parsed.user);
    setClub(parsed.club);
  }, []);

  const applyAuth = (data: AuthResponse) => {
    persistAuth(data);
    setToken(data.token);
    setUser(data.user);
    setClub(data.club);
  };

  const logout = () => {
    localStorage.removeItem(storageTokenKey);
    localStorage.removeItem(storageAuthKey);
    setToken(null);
    setUser(null);
    setClub(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        club,
        login: async (payload) => applyAuth(await authApi.login(payload)),
        register: async (payload) => applyAuth(await authApi.register(payload)),
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

