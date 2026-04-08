"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push("/ideas");
    } else {
      setError("Invalid credentials");
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-white">Tekkipodi</h1>
        {error && <p className="text-accent-red text-sm">{error}</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 bg-transparent border border-slate-gray text-silver-mist placeholder:text-silver-mist/50 outline-none focus:border-marker-blue"
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 bg-transparent border border-slate-gray text-silver-mist placeholder:text-silver-mist/50 outline-none focus:border-marker-blue"
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full px-3 py-2 bg-transparent border border-slate-gray text-silver-mist hover:border-marker-blue disabled:opacity-50 transition-colors"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
