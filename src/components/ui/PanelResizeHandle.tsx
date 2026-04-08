"use client";

import type { PointerEvent as ReactPointerEvent } from "react";

interface PanelResizeHandleProps {
  edge: "left" | "right";
  /** Screen-space position of the handle center (px from left viewport edge). */
  positionLeftPx: number;
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  ariaLabel: string;
}

/**
 * Narrow hit target on the edge between two panes. `positionLeftPx` is the horizontal
 * center of the handle (so it sits on the seam).
 */
export function PanelResizeHandle({
  edge,
  positionLeftPx,
  onPointerDown,
  disabled,
  ariaLabel,
}: PanelResizeHandleProps) {
  if (disabled) return null;

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      className={`fixed top-0 z-[41] h-full w-3 -translate-x-1/2 cursor-col-resize touch-none bg-transparent hover:bg-accent/15 active:bg-accent/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
        edge === "left" ? "border-r border-border/40" : "border-l border-border/40"
      }`}
      style={{ left: positionLeftPx }}
    />
  );
}
