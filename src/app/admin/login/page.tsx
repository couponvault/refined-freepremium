"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/50";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.trim(),
        password: password,
      }),
    });
    setLoading(false);
    if (res.ok) {
      window.location.href = "/admin";
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <form
        onSubmit={submit}
        className="glass glow w-full max-w-sm rounded-2xl border border-border p-8"
      >
        <div className="mb-2 flex justify-center">
          <BrandLogo size="xl" href={null} priority />
        </div>
        <h1 className="mb-1 text-center text-lg font-semibold tracking-tight text-muted">
          Admin sign-in
        </h1>
        <p className="mb-8 text-center text-sm text-muted">
          Sign in to manage FreePremium
        </p>
        <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
          Username
        </label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className={`${inputCls} mb-5`}
        />
        <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className={`${inputCls} mb-5`}
        />
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="glow w-full rounded-lg bg-accent py-2.5 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
