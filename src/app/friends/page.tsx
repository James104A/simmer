import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NavBar } from "@/components/nav-bar";
import { PartnerSection } from "@/components/partner-section";
import { FriendRequests } from "@/components/friend-requests";
import { FriendSearch } from "@/components/friend-search";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [pendingRequests, friends] = await Promise.all([
    prisma.friendRequest.findMany({
      where: { receiverId: user.id, status: "pending" },
      include: {
        sender: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Get accepted friends
    prisma.friendRequest
      .findMany({
        where: {
          status: "accepted",
          OR: [{ senderId: user.id }, { receiverId: user.id }],
        },
        include: {
          sender: { select: { id: true, name: true, email: true } },
          receiver: { select: { id: true, name: true, email: true } },
        },
      })
      .then((requests) =>
        requests.map((r) =>
          r.senderId === user.id ? r.receiver : r.sender
        )
      ),
  ]);

  return (
    <main className="min-h-screen">
      <NavBar
        user={{ id: user.id, name: user.name }}
        pendingRequestCount={pendingRequests.length}
      />
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground">
          Friends &amp; Partner
        </h2>

        {/* Partner vault */}
        <div className="mt-8">
          <PartnerSection />
        </div>

        {/* Pending requests */}
        {pendingRequests.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium uppercase tracking-wider text-foreground-muted">
              Pending Requests
            </h3>
            <FriendRequests
              requests={pendingRequests.map((r) => ({
                id: r.id,
                sender: r.sender,
              }))}
            />
          </div>
        )}

        {/* Add friends */}
        <div className="mt-8">
          <h3 className="text-sm font-medium uppercase tracking-wider text-foreground-muted">
            Add a Friend
          </h3>
          <FriendSearch />
        </div>

        {/* Current friends */}
        <div className="mt-8">
          <h3 className="text-sm font-medium uppercase tracking-wider text-foreground-muted">
            Your Friends ({friends.length})
          </h3>
          {friends.length === 0 ? (
            <p className="mt-4 text-sm text-foreground-muted">
              No friends yet. Search by name or email above to add friends.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background-elevated p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-amber/20 text-sm font-semibold text-accent-amber">
                    {friend.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {friend.name}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {friend.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
