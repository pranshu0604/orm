// app/hooks/useSyncClient.tsx

"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";

export function UseSyncClient() {
  const { isSignedIn, userId } = useAuth();

  useEffect(() => {
    if (isSignedIn && userId) {
      axios.post("/api/sync-user", { userId })
        .catch((err) => {
          console.error("User sync failed:", err);
        });
    }
  }, [isSignedIn, userId]);

  return null;
}