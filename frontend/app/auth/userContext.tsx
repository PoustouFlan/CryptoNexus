"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type User = {
  id: string;
  email: string;
  name?: string;
};

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Optional: fetch logged-in user on mount
  useEffect(() => {
    fetch("https://cryptonex.us/auth/profile", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
