"use client";

import { useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const STORAGE_KEY = "concourse-landscape-hint-dismissed";

export function LandscapeHint() {
  const [dismissed, setDismissed] = useState(false);
  const portrait = useMediaQuery("(orientation: portrait)");
  const narrow = useMediaQuery("(max-width: 1023px)");
  const show = portrait && narrow;

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- read external session flag once
        setDismissed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  if (dismissed || !show) return null;

  return (
    <div className="pointer-events-auto fixed bottom-0 left-0 right-0 z-[60] border-t border-border bg-bg-card/95 px-4 py-3 text-center text-xs text-text-secondary shadow-[0_-8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md sm:text-sm pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <p className="text-text-primary">
        Rotating your device to landscape gives a wider view of the map.
      </p>
      <button
        type="button"
        className="mt-2 text-accent-light underline underline-offset-2"
        onClick={() => {
          try {
            sessionStorage.setItem(STORAGE_KEY, "1");
          } catch {
            /* ignore */
          }
          setDismissed(true);
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
