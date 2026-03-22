"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FriendRequestsProps {
  requests: {
    id: string;
    sender: { id: string; name: string; email: string };
  }[];
}

export function FriendRequests({ requests }: FriendRequestsProps) {
  const router = useRouter();
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  async function handleAction(requestId: string, action: "accept" | "decline") {
    setProcessing((prev) => ({ ...prev, [requestId]: true }));
    try {
      await fetch(`/api/friends/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } finally {
      setProcessing((prev) => ({ ...prev, [requestId]: false }));
    }
  }

  return (
    <div className="mt-4 space-y-3">
      {requests.map((req) => (
        <div
          key={req.id}
          className="flex items-center justify-between rounded-xl border border-accent-amber/30 bg-accent-amber/5 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-amber/20 text-sm font-semibold text-accent-amber">
              {req.sender.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {req.sender.name}
              </p>
              <p className="text-xs text-foreground-muted">
                {req.sender.email}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(req.id, "accept")}
              disabled={processing[req.id]}
              className="rounded-lg bg-accent-sage px-3 py-1.5 text-sm font-medium text-background transition-colors hover:bg-accent-sage-light disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={() => handleAction(req.id, "decline")}
              disabled={processing[req.id]}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground-muted transition-colors hover:text-foreground disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
