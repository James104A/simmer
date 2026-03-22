"use client";

import { useState, useEffect } from "react";

interface Partner {
  id: string;
  name: string;
  email: string;
}

interface PartnerInfo {
  id: string;
  partner: Partner;
  createdAt: string;
}

interface PendingInvite {
  id: string;
  sender: Partner;
  createdAt: string;
}

export function PartnerSection() {
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/partner").then((r) => r.json()),
      fetch("/api/partner/requests").then((r) => r.json()),
    ]).then(([partner, invites]) => {
      setPartnerInfo(partner);
      setPendingInvites(invites);
      setLoading(false);
    });
  }, []);

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to send invite");
      } else {
        setEmail("");
        setError(null);
        // Refresh state
        const partner = await fetch("/api/partner").then((r) => r.json());
        setPartnerInfo(partner);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleRespond(partnershipId: string, action: string) {
    const res = await fetch("/api/partner/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnershipId, action }),
    });
    if (res.ok) {
      setPendingInvites((prev) =>
        prev.filter((i) => i.id !== partnershipId)
      );
      if (action === "accept") {
        const partner = await fetch("/api/partner").then((r) => r.json());
        setPartnerInfo(partner);
      }
    }
  }

  async function handleUnlink() {
    const res = await fetch("/api/partner", { method: "DELETE" });
    if (res.ok) {
      setPartnerInfo(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-background-elevated p-6">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
          Partner Vault
        </h3>
        <p className="mt-2 text-sm text-foreground-muted">Loading...</p>
      </div>
    );
  }

  // Active partner
  if (partnerInfo) {
    return (
      <div className="rounded-xl border border-accent-sage/30 bg-accent-sage/5 p-6">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
          Partner Vault
        </h3>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-sage/20 text-sm font-semibold text-accent-sage-light">
            {partnerInfo.partner.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {partnerInfo.partner.name}
            </p>
            <p className="text-xs text-foreground-muted">
              {partnerInfo.partner.email}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-foreground-muted">
          You share a recipe vault. Both of you can add, edit, and delete
          recipes.
        </p>
        <button
          onClick={handleUnlink}
          className="mt-3 text-xs text-accent-wine-light hover:underline"
        >
          Unlink Partner
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background-elevated p-6">
      <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
        Partner Vault
      </h3>
      <p className="mt-1 text-sm text-foreground-muted">
        Link with a partner to share a recipe collection. Both of you can add,
        edit, and browse recipes together.
      </p>

      {/* Pending invites received */}
      {pendingInvites.length > 0 && (
        <div className="mt-4 space-y-3">
          {pendingInvites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between rounded-lg border border-accent-amber/30 bg-accent-amber/5 p-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {invite.sender.name}
                </p>
                <p className="text-xs text-foreground-muted">
                  wants to be your partner
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRespond(invite.id, "accept")}
                  className="rounded-lg bg-accent-sage px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-accent-sage-light"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRespond(invite.id, "decline")}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground-muted transition-colors hover:text-foreground"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Send invite form */}
      <form onSubmit={handleSendInvite} className="mt-4 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Partner's email"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50"
        />
        <button
          type="submit"
          disabled={!email.trim() || sending}
          className="rounded-lg bg-accent-amber px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-amber-light disabled:opacity-50"
        >
          {sending ? "..." : "Invite"}
        </button>
      </form>
      {error && (
        <p className="mt-2 text-xs text-accent-wine-light">{error}</p>
      )}
    </div>
  );
}
