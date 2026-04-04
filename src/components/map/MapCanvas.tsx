"use client";

import { useState, useRef, useCallback } from "react";
import { FloorPlanSVG } from "./FloorPlanSVG";
import { MapControls } from "./MapControls";
import { useMapTransform } from "@/hooks/useMapTransform";
import { Crosshair } from "lucide-react";
import type { Zone } from "@/types/zone";
import type { Device } from "@/types/device";
import type { Layer } from "@/types/layer";
import type { DeviceTypeId } from "@/constants/deviceTypes";

interface MapCanvasProps {
  zones: Zone[];
  devices: Device[];
  layers: Layer[];
  selectedDeviceId: string | null;
  onDeviceClick: (device: Device) => void;
  floorPlanImageHref: string;
  /** When set, map click places a device (unless dev mode is on). */
  placeMode?: boolean;
  onPlaceAt?: (position: { x: number; y: number }) => void;
  /** Arrow keys move the selected map device (handled in page). */
  repositionMode?: boolean;
  repositionDeviceName?: string | null;
  onExitReposition?: () => void;
  resolveDeviceTypeColor: (typeId: DeviceTypeId) => string;
}

export function MapCanvas({
  zones,
  devices,
  layers,
  selectedDeviceId,
  onDeviceClick,
  floorPlanImageHref,
  placeMode,
  onPlaceAt,
  repositionMode,
  repositionDeviceName,
  onExitReposition,
  resolveDeviceTypeColor,
}: MapCanvasProps) {
  const { transform, handlers, zoomIn, zoomOut, resetView } = useMapTransform();
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);
  const [coordLog, setCoordLog] = useState<{ x: number; y: number }[]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const svgPointFromEvent = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: Math.round(svgPt.x), y: Math.round(svgPt.y) };
  }, []);

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const coord = svgPointFromEvent(e);
      if (!coord) return;

      if (devMode) {
        setClickCoords(coord);
        setCoordLog((prev) => [...prev.slice(-19), coord]);
        return;
      }

      if (placeMode && onPlaceAt) {
        onPlaceAt(coord);
      }
    },
    [devMode, placeMode, onPlaceAt, svgPointFromEvent]
  );

  const handleSvgMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (devMode || placeMode) {
        e.stopPropagation();
      }
    },
    [devMode, placeMode]
  );

  return (
    <div className="relative w-full h-full overflow-hidden blueprint-grid bg-bg-primary">
      <div className="w-full h-full cursor-grab active:cursor-grabbing" {...handlers}>
        <div
          className="origin-top-left transition-none"
          style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
        >
          <div className="p-8">
            <FloorPlanSVG
              zones={zones}
              hoveredZone={hoveredZone}
              onZoneHover={setHoveredZone}
              devices={devices}
              layers={layers}
              selectedDeviceId={selectedDeviceId}
              onDeviceClick={onDeviceClick}
              floorPlanImageHref={floorPlanImageHref}
              resolveDeviceTypeColor={resolveDeviceTypeColor}
              devMode={devMode}
              placeMode={placeMode && !devMode}
              onSvgClick={handleSvgClick}
              onSvgMouseDown={handleSvgMouseDown}
              svgRef={svgRef}
            />
          </div>
        </div>
      </div>

      <MapControls onZoomIn={zoomIn} onZoomOut={zoomOut} onResetView={resetView} scale={transform.scale} />

      {/* Dev mode toggle */}
      <button
        onClick={() => {
          setDevMode((p) => !p);
          if (devMode) {
            setClickCoords(null);
            setCoordLog([]);
          }
        }}
        className={`absolute top-4 right-4 z-10 p-2 rounded-lg border transition-colors ${devMode ? "bg-accent/30 border-accent-light text-accent-light" : "bg-bg-card/90 border-border text-text-muted hover:text-text-primary"}`}
        title="Toggle dev mode (coordinate logging)"
      >
        <Crosshair className="w-4 h-4" />
      </button>

      {placeMode && !devMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-bg-card/95 backdrop-blur border border-accent/50 rounded-lg shadow-lg max-w-md text-center">
          <p className="text-sm font-medium text-accent-light">Place mode</p>
          <p className="text-xs text-text-muted">Click the floor plan to add a device</p>
        </div>
      )}

      {repositionMode && repositionDeviceName && onExitReposition && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[min(92vw,28rem)] px-4 py-3 bg-bg-card/95 backdrop-blur border border-amber-500/50 rounded-xl shadow-xl space-y-2">
          <p className="text-sm font-semibold text-amber-200">Reposition: {repositionDeviceName}</p>
          <p className="text-xs text-text-secondary leading-relaxed">
            Use <kbd className="px-1 py-0.5 rounded bg-bg-primary border border-border font-mono text-[10px]">↑</kbd>{" "}
            <kbd className="px-1 py-0.5 rounded bg-bg-primary border border-border font-mono text-[10px]">↓</kbd>{" "}
            <kbd className="px-1 py-0.5 rounded bg-bg-primary border border-border font-mono text-[10px]">←</kbd>{" "}
            <kbd className="px-1 py-0.5 rounded bg-bg-primary border border-border font-mono text-[10px]">→</kbd>{" "}
            to move the marker. Hold <kbd className="px-1 py-0.5 rounded bg-bg-primary border border-border font-mono text-[10px]">Shift</kbd> for larger steps.
            Press <kbd className="px-1 py-0.5 rounded bg-bg-primary border border-border font-mono text-[10px]">Esc</kbd> or Done when finished.
          </p>
          <button
            type="button"
            onClick={onExitReposition}
            className="w-full py-2 rounded-lg bg-bg-primary border border-border text-sm font-medium text-text-primary hover:bg-bg-hover transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {devMode && (
        <div className="absolute top-14 right-4 z-10 w-56 bg-bg-card/95 backdrop-blur border border-accent-light/50 rounded-lg p-3 space-y-2 shadow-lg">
          <p className="text-xs font-mono text-accent-light font-bold">DEV MODE — Click for coords</p>
          {clickCoords && <p className="text-sm font-mono text-text-primary">x: {clickCoords.x}, y: {clickCoords.y}</p>}
          {coordLog.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {coordLog.map((c, i) => <p key={i} className="text-[10px] font-mono text-text-muted">{i + 1}. ({c.x}, {c.y})</p>)}
            </div>
          )}
          {coordLog.length > 0 && (
            <button onClick={() => { setCoordLog([]); setClickCoords(null); }} className="text-[10px] text-text-muted hover:text-text-primary">Clear log</button>
          )}
        </div>
      )}

      {hoveredZone && (() => {
        const zone = zones.find((z) => z.id === hoveredZone);
        if (!zone) return null;
        return (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-bg-card/95 backdrop-blur border border-border rounded-lg shadow-lg">
            <p className="text-sm font-medium text-text-primary">{zone.name}</p>
            <p className="text-xs text-text-muted">{zone.description}</p>
          </div>
        );
      })()}
    </div>
  );
}
