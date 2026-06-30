"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("admin@bakuport.local");
  const [password, setPassword] = useState("change-me-admin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? "Login failed.");
        return;
      }

      router.replace(searchParams.get("redirect") ?? "/admin");
      router.refresh();
    } catch {
      setError("Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="hc-label mb-2">Email</label>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          className="hc-field"
        />
      </div>

      <div>
        <label className="hc-label mb-2">Password</label>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          className="hc-field hc-mono"
        />
      </div>

      {error ? (
        <p className="hc-mono rounded-lg border border-[rgba(240,105,138,0.32)] bg-[rgba(240,105,138,0.08)] px-4 py-3 text-sm text-[var(--hc-rose)]">
          ⚠ {error}
        </p>
      ) : null}

      <button type="submit" disabled={loading} className="hc-btn hc-btn--primary w-full py-3">
        {loading ? "Signing in…" : "Sign in to console"}
      </button>
    </form>
  );
}
