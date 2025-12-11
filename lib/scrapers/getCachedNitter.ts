import { getWorkingNitter } from "./getWorkingNitter";

// This file is a thin wrapper that delegates to getWorkingNitter().
export async function getCachedNitterInstance(): Promise<string> {
  return getWorkingNitter();
}