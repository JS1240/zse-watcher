import { useState, useEffect, useCallback } from "react";
import { createLogger } from "@/lib/logger";

const logger = createLogger("LastUpdated");

// Global timestamp tracker (survives route changes)
let globalTimestamp: number | null = null;

export function useLastUpdated(source: string = "general") {
  const [lastUpdated, setLastUpdated] = useState<number | null>(globalTimestamp);
  const [isStale, setIsStale] = useState(false);

  const updateTimestamp = useCallback((timestamp: number) => {
    globalTimestamp = timestamp;
    setLastUpdated(timestamp);
    setIsStale(false);
    logger.debug(`Updated to ${new Date(timestamp).toISOString()}`, { source });
  }, []);

  // Mark as stale after 5 minutes
  useEffect(() => {
    if (!lastUpdated) return;

    const staleTimer = setTimeout(() => {
      setIsStale(true);
    }, 5 * 60 * 1000);

    return () => clearTimeout(staleTimer);
  }, [lastUpdated]);

  return { lastUpdated, isStale, updateTimestamp };
}

// Singleton for tracking across the app
const trackedSources: Record<string, number> = {};

export function getLastUpdatedForSource(source: string): number | null {
  return trackedSources[source] ?? null;
}

export function setLastUpdatedForSource(source: string, timestamp: number = Date.now()) {
  trackedSources[source] = timestamp;
  globalTimestamp = timestamp;
}

// Global hook for the footer
export function useAppLastUpdated() {
  const [lastUpdated, setLastUpdated] = useState<number | null>(globalTimestamp);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(globalTimestamp);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return lastUpdated;
}