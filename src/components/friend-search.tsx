"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  name: string;
  email: string;
}

export function FriendSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [sent, setSent] = useState<Record<string, string>>({});

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/friends/search?q=${encodeURIComponent(q.trim())}`
      );
      if (res.ok) {
        setResults(await res.json());
      }
    } finally {
      setSearching(false);
    }
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    // Simple debounce using timeout
    const timeout = setTimeout(() => search(value), 300);
    return () => clearTimeout(timeout);
  }

  async function handleAddFriend(email: string) {
    setSending((prev) => ({ ...prev, [email]: true }));
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent((prev) => ({ ...prev, [email]: "Request sent!" }));
        router.refresh();
      } else {
        setSent((prev) => ({ ...prev, [email]: data.error }));
      }
    } finally {
      setSending((prev) => ({ ...prev, [email]: false }));
    }
  }

  return (
    <div className="mt-4">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search by name or email..."
        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-accent-amber focus:outline-none focus:ring-1 focus:ring-accent-amber"
      />

      {searching && (
        <p className="mt-3 text-sm text-foreground-muted">Searching...</p>
      )}

      {results.length > 0 && (
        <div className="mt-3 space-y-2">
          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-xl border border-border bg-background-elevated p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-sage/20 text-sm font-semibold text-accent-sage-light">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {user.name}
                  </p>
                  <p className="text-xs text-foreground-muted">{user.email}</p>
                </div>
              </div>
              {sent[user.email] ? (
                <span className="text-sm text-foreground-muted">
                  {sent[user.email]}
                </span>
              ) : (
                <button
                  onClick={() => handleAddFriend(user.email)}
                  disabled={sending[user.email]}
                  className="rounded-lg bg-accent-amber px-3 py-1.5 text-sm font-medium text-background transition-colors hover:bg-accent-amber-light disabled:opacity-50"
                >
                  {sending[user.email] ? "..." : "Add Friend"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {query.trim().length >= 2 && !searching && results.length === 0 && (
        <p className="mt-3 text-sm text-foreground-muted">
          No users found matching &ldquo;{query}&rdquo;
        </p>
      )}
    </div>
  );
}
