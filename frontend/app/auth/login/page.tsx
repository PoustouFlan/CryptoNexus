"use client";

import { useState } from "react";
import { useAuth } from "../userContext";

export default function LoginPage() {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("https://cryptonex.us/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const { access_token, user } = await res.json();
      localStorage.setItem("token", access_token);
      setUser(user);
    } else {
      setError("Invalid credentials");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "https://cryptonex.us/api/auth/google";
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-2">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Login
        </button>
      </form>
      <button
        onClick={handleGoogleLogin}
        className="mt-4 bg-red-500 text-white p-2 rounded"
      >
        Login with Google
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
