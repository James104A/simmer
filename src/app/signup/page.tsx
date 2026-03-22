"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="card-glass rounded-2xl border border-border p-8">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-foreground text-center">
            Join Simmer
          </h1>
          <p className="mt-2 text-sm text-foreground-muted text-center">
            Create an account to start cooking with friends
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              autoFocus
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-muted/50 focus:border-accent-amber focus:outline-none focus:ring-1 focus:ring-accent-amber"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-muted/50 focus:border-accent-amber focus:outline-none focus:ring-1 focus:ring-accent-amber"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 characters)"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-muted/50 focus:border-accent-amber focus:outline-none focus:ring-1 focus:ring-accent-amber"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-muted/50 focus:border-accent-amber focus:outline-none focus:ring-1 focus:ring-accent-amber"
            />

            {error && (
              <p className="text-sm text-accent-wine-light">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !name || !email || !password || !confirmPassword}
              className="w-full rounded-lg bg-accent-amber px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent-amber-light disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-foreground-muted">
            Already have an account?{" "}
            <a href="/login" className="text-accent-amber hover:text-accent-amber-light">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
