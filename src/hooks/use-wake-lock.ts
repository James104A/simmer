"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // Already released
      }
      wakeLockRef.current = null;
    }
    setIsActive(false);
  }, []);

  const request = useCallback(async () => {
    if (!("wakeLock" in navigator)) {
      return false;
    }
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      wakeLockRef.current.addEventListener("release", () => {
        // Only update state if we didn't intentionally release
        if (wakeLockRef.current === null) return;
        wakeLockRef.current = null;
      });
      setIsActive(true);
      return true;
    } catch {
      setIsActive(false);
      return false;
    }
  }, []);

  // Re-acquire wake lock when tab becomes visible again
  useEffect(() => {
    if (!isActive) return;

    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && isActive && !wakeLockRef.current) {
        navigator.wakeLock.request("screen").then((sentinel) => {
          wakeLockRef.current = sentinel;
        }).catch(() => {
          // Failed to reacquire
        });
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, []);

  const isSupported = typeof window !== "undefined" && "wakeLock" in navigator;

  return { isActive, isSupported, request, release };
}
