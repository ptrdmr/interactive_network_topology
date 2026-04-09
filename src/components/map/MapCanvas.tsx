"use client";

import { useState, useRef, useCallback, useLayoutEffect, useEffect, useMemo } from "react";
import { FloorPlanSVG } from "./FloorPlanSVG";
import { DeviceMapDockPanel } from "./DeviceMapHoverCard";
import { MapControls } from "./MapControls";
import { useMapTransform } from "@/hooks/useMapTransform";
import { Crosshair, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { Zone } from "@/types/zone";
import type { Device } from "@/types/device";
import type { Layer } from "@/types/layer";
import type { DeviceTypeId } from "@/constants/deviceTypes";
import { REPOSITION_STEP_PX } from "@/constants/reposition";

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
  /** Nudge selected device on map (pixels in floor-plan space). */
  onRepositionNudge?: (dx: number, dy: number) => void;
  resolveDeviceTypeColor: (typeId: DeviceTypeId) => string;
  showCameraFov?: boolean;
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
  onRepositionNudge,
  resolveDeviceTypeColor,
  showCameraFov = true,
}: MapCanvasProps) {
  const { transform, handlers, zoomIn, zoomOut, fitContentToContainer } = useMapTransform();
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [hoveredDeviceId, setHoveredDeviceId] = useState<string | null>(null);
  const hoverClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);
  const [coordLog, setCoordLog] = useState<{ x: number; y: number }[]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const scheduleFit = useCallback(() => {
    const c = containerRef.current;
    const inner = contentRef.current;
    if (!c || !inner) return;
    const cr = c.getBoundingClientRect();
    const w = inner.scrollWidth;
    const h = inner.scrollHeight;
    if (w < 8 || h < 8) return;
    fitContentToContainer(cr.width, cr.height, w, h);
  }, [fitContentToContainer]);

  useLayoutEffect(() => {
    scheduleFit();
  }, [scheduleFit, floorPlanImageHref]);

  useEffect(() => {
    const c = containerRef.current;
    const inner = contentRef.current;
    if (!c || !inner) return;
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(scheduleFit);
    });
    ro.observe(c);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [scheduleFit]);

  const cancelHoverClear = useCallback(() => {
    if (hoverClearTimerRef.current !== null) {
      clearTimeout(hoverClearTimerRef.current);
      hoverClearTimerRef.current = null;
    }
  }, []);

  const scheduleHoverClear = useCallback(() => {
    if (hoverClearTimerRef.current !== null) {
      clearTimeout(hoverClearTimerRef.current);
    }
    hoverClearTimerRef.current = setTimeout(() => {
      setHoveredDeviceId(null);
      hoverClearTimerRef.current = null;
    }, 220);
  }, []);

  const handleDeviceHover = useCallback(
    (id: string | null) => {
      if (id) {
        cancelHoverClear();
        setHoveredDeviceId(id);
      } else {
        scheduleHoverClear();
      }
    },
    [cancelHoverClear, scheduleHoverClear]
  );

  useEffect(() => {
    return () => {
      cancelHoverClear();
    };
  }, [cancelHoverClear]);

  useEffect(() => {
    if (repositionMode) {
      cancelHoverClear();
      setHoveredDeviceId(null);
    }
  }, [repositionMode, cancelHoverClear]);

  const hoverDock = useMemo(() => {
    if (!hoveredDeviceId) return null;
    const device = devices.find((d) => d.id === hoveredDeviceId);
    if (!device) return null;
    const layer = layers.find((l) => l.id === device.layerId);
    return { device, layerName: layer?.name ?? "Unknown layer" };
  }, [devices, layers, hoveredDeviceId]);

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
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        {...handlers}
      >
        <div
          className="origin-top-left transition-none"
          style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
        >
          <div ref={contentRef} className="p-8">
            <FloorPlanSVG
              zones={zones}
              hoveredZone={hoveredZone}
              onZoneHover={setHoveredZone}
              devices={devices}
              layers={layers}
              selectedDeviceId={selectedDeviceId}
              onDeviceClick={onDeviceClick}
              onDeviceHover={handleDeviceHover}
              deviceHoverEnabled={!repositionMode}
              floorPlanImageHref={floorPlanImageHref}
              resolveDeviceTypeColor={resolveDeviceTypeColor}
              showCameraFov={showCameraFov}
              devMode={devMode}
              placeMode={placeMode && !devMode}
              onSvgClick={handleSvgClick}
              onSvgMouseDown={handleSvgMouseDown}
              svgRef={svgRef}
            />
          </div>
        </div>
      </div>

      {hoverDock && !repositionMode && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[25] flex justify-start pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(4.5rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
          onMouseEnter={cancelHoverClear}
          onMouseLeave={scheduleHoverClear}
        >
          <div className="pointer-events-auto w-full max-w-lg min-w-0 motion-safe:transition-opacity motion-safe:duration-200">
            <DeviceMapDockPanel device={hoverDock.device} layerName={hoverDock.layerName} />
          </div>
        </div>
      )}

      <MapControls onZoomIn={zoomIn} onZoomOut={zoomOut} onResetView={scheduleFit} scale={transform.scale} />

      {/* Dev mode toggle */}
      <button
        type="button"
        onClick={() => {
          setDevMode((p) => !p);
          if (devMode) {
            setClickCoords(null);
            setCoordLog([]);
          }
        }}
        className={`absolute z-10 p-2 rounded-lg border transition-colors right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] ${devMode ? "bg-accent/30 border-accent-light text-accent-light" : "bg-bg-card/90 border-border text-text-muted hover:text-text-primary"}`}
        title="Toggle dev mode (coordinate logging)"
      >
        <Crosshair className="w-4 h-4" />
      </button>

      {placeMode && !devMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-bg-card/95 backdrop-blur border border-accent/50 rounded-lg shadow-lg max-w-md text-center mt-[env(safe-area-inset-top)]">
          <p className="text-sm font-medium text-accent-light">Place mode</p>
          <p className="text-xs text-text-muted">Click the floor plan to add a device</p>
        </div>
      )}

      {repositionMode && repositionDeviceName && onExitReposition && (
        <div className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-20 w-[min(92vw,28rem)] px-4 py-3 bg-bg-card/95 backdrop-blur border border-amber-500/50 rounded-xl shadow-xl space-y-3">
          <p className="text-sm font-semibold text-amber-200">Reposition: {repositionDeviceName}</p>
          <p className="text-xs text-text-secondary leading-relaxed max-sm:hidden">
            Use <kbd className="px-1 py-0.5 rounded bg-bg-primary border border-border font-mono text-[10px]">↑</kbd>{" "}
            <kbd className="px-1 py-0.5 rounded bg-bg-primary border border-border font-mono text-[10px]">↓</kbd>{" "}
            <kbd className="px-1 py-0.5 rounded bg-bg-primary border border-border font-mono text-[10px]">←</kbd>{" "}
            <kbd className="px-1 py-0.5 rounded bg-bg-primary border border-border font-mono text-[10px]">→</kbd> to move. Hold{" "}
            <kbd className="px-1 py-0.5 rounded bg-bg-primary border border-border font-mono text-[10px]">Shift</kbd> for larger steps.{" "}
            <kbd className="px-1 py-0.5 rounded bg-bg-primary border border-border font-mono text-[10px]">Esc</kbd> or Done to finish.
          </p>
          {onRepositionNudge && (
            <div className="flex flex-col items-center gap-2 sm:hidden">
              <p className="text-[10px] text-text-muted text-center">Tap arrows to nudge the marker</p>
              <div className="grid grid-cols-3 gap-1.5 w-[9rem] place-items-center">
                <span />
                <button
                  type="button"
                  aria-label="Nudge up"
                  className="p-3 rounded-lg bg-bg-primary border border-border text-text-primary active:bg-bg-hover"
                  onClick={() => onRepositionNudge(0, -REPOSITION_STEP_PX)}
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <span />
                <button
                  type="button"
                  aria-label="Nudge left"
                  className="p-3 rounded-lg bg-bg-primary border border-border text-text-primary active:bg-bg-hover"
                  onClick={() => onRepositionNudge(-REPOSITION_STEP_PX, 0)}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Nudge down"
                  className="p-3 rounded-lg bg-bg-primary border border-border text-text-primary active:bg-bg-hover"
                  onClick={() => onRepositionNudge(0, REPOSITION_STEP_PX)}
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Nudge right"
                  className="p-3 rounded-lg bg-bg-primary border border-border text-text-primary active:bg-bg-hover"
                  onClick={() => onRepositionNudge(REPOSITION_STEP_PX, 0)}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
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
        <div className="absolute top-14 z-10 w-56 bg-bg-card/95 backdrop-blur border border-accent-light/50 rounded-lg p-3 space-y-2 shadow-lg right-[max(1rem,env(safe-area-inset-right))]">
          <p className="text-xs font-mono text-accent-light font-bold">DEV MODE — Click for coords</p>
          {clickCoords && <p className="text-sm font-mono text-text-primary">x: {clickCoords.x}, y: {clickCoords.y}</p>}
          {coordLog.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {coordLog.map((c, i) => <p key={i} className="text-[10px] font-mono text-text-muted">{i + 1}. ({c.x}, {c.y})</p>)}
            </div>
          )}
          {coordLog.length > 0 && (
            <button type="button" onClick={() => { setCoordLog([]); setClickCoords(null); }} className="text-[10px] text-text-muted hover:text-text-primary">Clear log</button>
          )}
        </div>
      )}

      {hoveredZone && (() => {
        const zone = zones.find((z) => z.id === hoveredZone);
        if (!zone) return null;
        return (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-bg-card/95 backdrop-blur border border-border rounded-lg shadow-lg mt-[env(safe-area-inset-top)]">
            <p className="text-sm font-medium text-text-primary">{zone.name}</p>
            <p className="text-xs text-text-muted">{zone.description}</p>
          </div>
        );
      })()}
    </div>
  );
}
