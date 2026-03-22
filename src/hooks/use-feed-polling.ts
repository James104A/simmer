"use client";

import { useState, useEffect, useRef } from "react";
import { FeedItemData } from "@/components/feed-list";

export function useFeedPolling(
  initialItems: FeedItemData[],
  intervalMs = 30000
) {
  const [items, setItems] = useState(initialItems);
  const [newCount, setNewCount] = useState(0);
  const latestRef = useRef(
    initialItems[0]?.createdAt ?? new Date().toISOString()
  );
  const pendingRef = useRef<FeedItemData[]>([]);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/feed?since=${encodeURIComponent(latestRef.current)}`
        );
        if (!res.ok) return;
        const newItems: FeedItemData[] = await res.json();
        if (newItems.length > 0) {
          pendingRef.current = [...newItems, ...pendingRef.current];
          latestRef.current = newItems[0].createdAt;
          setNewCount(pendingRef.current.length);
        }
      } catch {
        // Silently ignore polling errors
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  function showNewItems() {
    setItems((prev) => [...pendingRef.current, ...prev]);
    pendingRef.current = [];
    setNewCount(0);
  }

  return { items, newCount, showNewItems };
}
