import { redis } from "@/lib/redis";
import { getWorkingNitter } from "./getWorkingNitter";
import { isAlive } from "./isAlive";

// This file is now a wrapper that delegates to getWorkingNitter.ts
// getWorkingNitter.ts now handles Redis caching internally

export async function getCachedNitterInstance(): Promise<string> {
  // Simply delegate to getWorkingNitter which now handles caching internally
  return getWorkingNitter();
}