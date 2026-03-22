"use client";

import { usePathname } from "next/navigation";
import { LogoutButton } from "./logout-button";

interface NavBarProps {
  user: { id: string; name: string } | null;
  pendingRequestCount?: number;
}

export function NavBar({ user, pendingRequestCount = 0 }: NavBarProps) {
  const pathname = usePathname();

  const navLinks = user
    ? [
        { href: "/", label: "My Library" },
        { href: "/feed", label: "Feed" },
        { href: "/friends", label: "Friends", badge: pendingRequestCount },
      ]
    : [];

  return (
    <header className="border-b border-border bg-background-elevated/60 backdrop-blur-md px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-3">
            <svg
              className="hidden h-6 w-8 text-accent-amber/50 sm:block"
              viewBox="0 0 32 24"
              fill="none"
            >
              <path
                d="M28 12 C22 4, 14 2, 8 6 S2 14, 6 18 C10 22, 18 20, 22 16"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <circle cx="6" cy="18" r="1.5" fill="currentColor" opacity="0.6" />
            </svg>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground">
              Simmer
            </h1>
          </a>

          {user && (
            <nav className="hidden items-center gap-1 sm:flex">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-accent-amber"
                        : "text-foreground-muted hover:text-foreground"
                    }`}
                  >
                    {link.label}
                    {link.badge ? (
                      <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent-amber text-[10px] font-bold text-background">
                        {link.badge}
                      </span>
                    ) : null}
                  </a>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-foreground-muted sm:block">
                {user.name}
              </span>
              <a
                href="/recipes/new"
                className="rounded-lg bg-accent-amber px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-amber-light"
              >
                + Add Recipe
              </a>
              <LogoutButton />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="/login"
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors hover:bg-background-hover hover:text-foreground"
              >
                Login
              </a>
              <a
                href="/signup"
                className="rounded-lg bg-accent-amber px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-amber-light"
              >
                Sign Up
              </a>
            </div>
          )}
        </div>

        {/* Mobile nav */}
        {user && (
          <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-border bg-background-elevated/95 backdrop-blur-md sm:hidden">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors ${
                    isActive
                      ? "text-accent-amber"
                      : "text-foreground-muted"
                  }`}
                >
                  {link.label}
                  {link.badge ? (
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent-amber text-[9px] font-bold text-background">
                      {link.badge}
                    </span>
                  ) : null}
                </a>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
