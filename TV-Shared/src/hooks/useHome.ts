import { useCallback, useEffect, useState } from "react";
import { getHome } from "../api/client";
import type { HomeResponse } from "../api/types";

/** How often to re-check live status and the latest content. */
const REFRESH_MS = 60_000;

/**
 * The home feed, shared by the home screen, the Watch Live screen and the
 * menu's LIVE tag. Refreshes every minute unless `paused` (during playback).
 */
export function useHome(paused: boolean) {
  const [home, setHome] = useState<HomeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setHome(await getHome());
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
    }
  }, []);

  useEffect(() => {
    if (paused) {
      return;
    }
    reload();
    const timer = setInterval(reload, REFRESH_MS);
    return () => clearInterval(timer);
  }, [paused, reload]);

  return { home, error, reload };
}
