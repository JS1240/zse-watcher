import { useState, useEffect } from "react";

/**
 * Hook to detect online/offline network status.
 * Returns true if the browser is online, false if offline.
 * 
 * Useful for showing stale data warnings or offline banners
 * to Croatian retail investors on mobile connections.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
