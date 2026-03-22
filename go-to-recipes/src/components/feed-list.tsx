"use client";

import { FeedItem } from "./feed-item";
import { useFeedPolling } from "@/hooks/use-feed-polling";

export interface FeedItemData {
  id: string;
  eventType: string;
  createdAt: string;
  notes: string | null;
  user: { id: string; name: string };
  recipe: {
    id: string;
    title: string;
    imageUrl: string | null;
    descriptionShort: string | null;
    cuisineTypes: string | null;
    dishTypes: string | null;
    totalTimeMinutes: number | null;
    rating: number | null;
  };
  isSaved: boolean;
}

interface FeedListProps {
  items: FeedItemData[];
}

export function FeedList({ items: initialItems }: FeedListProps) {
  const { items, newCount, showNewItems } = useFeedPolling(initialItems);

  if (items.length === 0 && newCount === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-foreground-muted">Nothing here yet</p>
        <p className="mt-2 text-sm text-foreground-muted/70">
          Add friends to see what they&apos;ve been up to!
        </p>
        <a
          href="/friends"
          className="mt-4 inline-block rounded-lg bg-accent-amber px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-amber-light"
        >
          Find Friends
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {newCount > 0 && (
        <button
          onClick={showNewItems}
          className="w-full rounded-lg bg-accent-amber/10 px-4 py-2.5 text-sm font-medium text-accent-amber-light transition-colors hover:bg-accent-amber/20"
        >
          {newCount} new {newCount === 1 ? "update" : "updates"}
        </button>
      )}
      {items.map((item) => (
        <FeedItem key={item.id} item={item} />
      ))}
    </div>
  );
}
