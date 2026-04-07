"use client";

import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  scale: number;
}

export function MapControls({ onZoomIn, onZoomOut, onResetView, scale }: MapControlsProps) {
  const percent = Math.round(scale * 100);

  return (
    <div className="absolute z-10 flex flex-col items-center gap-1 bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]">
      <button
        type="button"
        onClick={onZoomIn}
        className="p-2.5 rounded-lg bg-bg-card/90 backdrop-blur border border-border text-text-primary hover:bg-bg-hover transition-colors"
        title="Zoom in"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <span className="text-[10px] font-mono text-text-muted tabular-nums w-12 text-center bg-bg-card/80 rounded px-1 py-0.5 border border-border">
        {percent}%
      </span>

      <button
        type="button"
        onClick={onZoomOut}
        className="p-2.5 rounded-lg bg-bg-card/90 backdrop-blur border border-border text-text-primary hover:bg-bg-hover transition-colors"
        title="Zoom out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <div className="w-px h-2 bg-border" />

      <button
        type="button"
        onClick={onResetView}
        className="p-2.5 rounded-lg bg-bg-card/90 backdrop-blur border border-border text-text-primary hover:bg-bg-hover transition-colors"
        title="Fit map to view"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  );
}
