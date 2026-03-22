"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-border px-3 py-2 text-sm text-foreground-muted transition-colors hover:bg-background-hover hover:text-foreground"
    >
      Logout
    </button>
  );
}
