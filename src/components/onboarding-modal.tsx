"use client";

import { useState } from "react";

interface OnboardingModalProps {
  userName: string;
}

const STEPS = [
  {
    title: "Welcome to Simmer",
    subtitle: "Your shared recipe library",
    content: (name: string) => (
      <>
        <p className="text-foreground-muted leading-relaxed">
          Hey {name}! Simmer is where you and the people you cook with keep
          track of recipes you love, discover what your friends are making, and
          build a shared kitchen together.
        </p>
        <p className="mt-3 text-foreground-muted leading-relaxed">
          Let&apos;s walk through how it works.
        </p>
      </>
    ),
    icon: (
      <svg className="h-12 w-12 text-accent-amber" viewBox="0 0 48 48" fill="none">
        <path
          d="M42 18C33 6 21 3 12 9S3 21 9 27C15 33 27 30 33 24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="9" cy="27" r="2.5" fill="currentColor" opacity="0.6" />
      </svg>
    ),
  },
  {
    title: "Save Recipes from Anywhere",
    subtitle: "Paste a link, let AI do the rest",
    content: () => (
      <>
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-amber/20 text-accent-amber font-bold text-xs">
              1
            </span>
            <span className="text-foreground">
              Tap <span className="font-semibold text-accent-amber">+ Add</span> in the top bar
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-amber/20 text-accent-amber font-bold text-xs">
              2
            </span>
            <span className="text-foreground">
              Paste any recipe URL
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-amber/20 text-accent-amber font-bold text-xs">
              3
            </span>
            <span className="text-foreground">
              AI extracts ingredients, steps, and details
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm text-foreground-muted">
          Tag recipes by cuisine, season, or occasion so you can find them later.
          After cooking, mark recipes as favorites or discard the ones that
          didn&apos;t work out.
        </p>
      </>
    ),
    icon: (
      <svg className="h-12 w-12 text-accent-sage" viewBox="0 0 48 48" fill="none">
        <rect x="8" y="6" width="32" height="36" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M16 16h16M16 22h16M16 28h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="36" cy="36" r="8" fill="var(--accent-sage)" opacity="0.2" />
        <path d="M33 36h6M36 33v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Cook with Friends & Your Partner",
    subtitle: "Share your kitchen digitally",
    content: () => (
      <>
        <div className="space-y-3">
          <div className="rounded-xl border border-accent-wine/30 bg-accent-wine/5 p-4">
            <h4 className="text-sm font-semibold text-accent-wine-light">
              Partner Vault
            </h4>
            <p className="mt-1 text-sm text-foreground-muted">
              Link with your partner to share a single recipe library. Both of
              you can add, edit, and cook from the same collection.
            </p>
          </div>
          <div className="rounded-xl border border-accent-sage/30 bg-accent-sage/5 p-4">
            <h4 className="text-sm font-semibold text-accent-sage-light">
              Friends
            </h4>
            <p className="mt-1 text-sm text-foreground-muted">
              Add friends to see what they&apos;re cooking. Save their recipes
              to your &ldquo;Want to Try&rdquo; list with one tap.
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-foreground-muted">
          Head to the <span className="font-medium text-foreground">Friends</span> tab
          to search by name or email and send invites.
        </p>
      </>
    ),
    icon: (
      <svg className="h-12 w-12 text-accent-wine-light" viewBox="0 0 48 48" fill="none">
        <circle cx="18" cy="16" r="6" stroke="currentColor" strokeWidth="2" />
        <circle cx="32" cy="16" r="6" stroke="currentColor" strokeWidth="2" />
        <path d="M6 38c0-6.627 5.373-12 12-12h1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M29 26h1c6.627 0 12 5.373 12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M22 34h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Your Feed",
    subtitle: "See what everyone's cooking",
    content: () => (
      <>
        <p className="text-foreground-muted leading-relaxed">
          The <span className="font-medium text-foreground">Feed</span> shows
          activity from you and your friends: new recipes added, dishes cooked,
          and new favorites discovered.
        </p>
        <div className="mt-3 rounded-xl border border-border bg-background p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-accent-sage" />
            <span className="text-foreground-muted">
              Someone cooked a recipe
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-accent-amber" />
            <span className="text-foreground-muted">
              A new favorite was discovered
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-accent-copper" />
            <span className="text-foreground-muted">
              A new recipe was added
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm text-foreground-muted">
          See something that looks good? Save it to your library and try it
          yourself.
        </p>
      </>
    ),
    icon: (
      <svg className="h-12 w-12 text-accent-copper" viewBox="0 0 48 48" fill="none">
        <rect x="6" y="10" width="36" height="8" rx="3" stroke="currentColor" strokeWidth="2" />
        <rect x="6" y="22" width="36" height="8" rx="3" stroke="currentColor" strokeWidth="2" />
        <rect x="6" y="34" width="36" height="8" rx="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="14" r="1.5" fill="currentColor" />
        <circle cx="12" cy="26" r="1.5" fill="currentColor" />
        <circle cx="12" cy="38" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
];

export function OnboardingModal({ userName }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  async function finish() {
    setClosing(true);
    await fetch("/api/onboarding", { method: "POST" });
    setTimeout(() => setVisible(false), 300);
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center px-4 transition-opacity duration-300 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md rounded-2xl border border-border bg-background-elevated p-6 shadow-2xl transition-all duration-300 ${
          closing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {/* Step indicator */}
        <div className="mb-6 flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-8 bg-accent-amber"
                  : i < step
                    ? "w-4 bg-accent-amber/40"
                    : "w-4 bg-border-light"
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="flex justify-center">{current.icon}</div>

        {/* Title */}
        <h2 className="mt-4 text-center font-[family-name:var(--font-display)] text-xl font-semibold text-foreground">
          {current.title}
        </h2>
        <p className="mt-1 text-center text-sm text-foreground-muted">
          {current.subtitle}
        </p>

        {/* Body */}
        <div className="mt-5">{current.content(userName)}</div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors hover:bg-background-hover hover:text-foreground"
            >
              Back
            </button>
          ) : (
            <button
              onClick={finish}
              className="text-sm text-foreground-muted transition-colors hover:text-foreground"
            >
              Skip
            </button>
          )}

          <button
            onClick={isLast ? finish : () => setStep(step + 1)}
            className="rounded-lg bg-accent-amber px-6 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-amber-light"
          >
            {isLast ? "Let\u2019s Cook" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
