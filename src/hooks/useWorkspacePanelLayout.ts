"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

const STORAGE_KEY = "concourse-panel-fracs-v1";

/** Collapsed rail width (Tailwind `w-16`). */
export const WORKSPACE_LEFT_COLLAPSED_PX = 64;

const DEFAULT_LEFT_FRAC = 320 / 1440;
const DEFAULT_RIGHT_FRAC = 384 / 1440;

const MIN_LEFT = 220;
const MAX_LEFT = 560;
const MIN_RIGHT = 260;
const MAX_RIGHT = 640;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function readStored(): { left: number; right: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as { left?: unknown; right?: unknown };
    if (typeof j.left === "number" && typeof j.right === "number") {
      return { left: j.left, right: j.right };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function useWorkspacePanelLayout(isLg: boolean, sidebarCollapsed: boolean) {
  const [vw, setVw] = useState(0);
  const [fracs, setFracs] = useState(() => {
    if (typeof window === "undefined") {
      return { left: DEFAULT_LEFT_FRAC, right: DEFAULT_RIGHT_FRAC };
    }
    const s = readStored();
    return {
      left: s?.left ?? DEFAULT_LEFT_FRAC,
      right: s?.right ?? DEFAULT_RIGHT_FRAC,
    };
  });
  const leftFrac = fracs.left;
  const rightFrac = fracs.right;
  const [dragging, setDragging] = useState<"left" | "right" | null>(null);

  useLayoutEffect(() => {
    const r = () => setVw(window.innerWidth);
    r();
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  useEffect(() => {
    if (dragging) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ left: leftFrac, right: rightFrac })
      );
    } catch {
      /* ignore */
    }
  }, [leftFrac, rightFrac, dragging]);

  const leftExpandedPx =
    vw > 0 ? clamp(leftFrac * vw, MIN_LEFT, MAX_LEFT) : 320;
  const rightPx = vw > 0 ? clamp(rightFrac * vw, MIN_RIGHT, MAX_RIGHT) : 384;

  const mainMarginLeft = isLg
    ? sidebarCollapsed
      ? WORKSPACE_LEFT_COLLAPSED_PX
      : leftExpandedPx
    : 0;

  const onLeftResizePointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (!isLg || sidebarCollapsed) return;
      e.preventDefault();
      const startX = e.clientX;
      const startFrac = leftFrac;
      setDragging("left");

      const onMove = (ev: PointerEvent) => {
        const innerW = window.innerWidth;
        const delta = ev.clientX - startX;
        const startPx = clamp(startFrac * innerW, MIN_LEFT, MAX_LEFT);
        const newPx = clamp(startPx + delta, MIN_LEFT, MAX_LEFT);
        setFracs((prev) => ({ ...prev, left: newPx / innerW }));
      };

      const onUp = () => {
        setDragging(null);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [isLg, sidebarCollapsed, leftFrac]
  );

  const onRightResizePointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (!isLg) return;
      e.preventDefault();
      const startX = e.clientX;
      const startFrac = rightFrac;
      setDragging("right");

      const onMove = (ev: PointerEvent) => {
        const innerW = window.innerWidth;
        const delta = startX - ev.clientX;
        const startPx = clamp(startFrac * innerW, MIN_RIGHT, MAX_RIGHT);
        const newPx = clamp(startPx + delta, MIN_RIGHT, MAX_RIGHT);
        setFracs((prev) => ({ ...prev, right: newPx / innerW }));
      };

      const onUp = () => {
        setDragging(null);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [isLg, rightFrac]
  );

  useEffect(() => {
    if (!dragging) return;
    const prev = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = prev;
    };
  }, [dragging]);

  return {
    viewportWidth: vw,
    leftExpandedPx,
    rightPanelPx: rightPx,
    mainMarginLeft,
    dragging,
    onLeftResizePointerDown,
    onRightResizePointerDown,
  };
}
