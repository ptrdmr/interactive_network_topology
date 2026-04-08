"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp, Circle, Plus } from "lucide-react";
import type { Device } from "@/types/device";
import { DeviceMapDockPanel } from "@/components/map/DeviceMapHoverCard";

const HOVER_GAP_PX = 8;
const POPOVER_Z = 100;
const VIEW_MARGIN_PX = 8;

function viewportHeight(): number {
  if (typeof window === "undefined") return 800;
  return window.visualViewport?.height ?? window.innerHeight;
}

interface ServerRackStackProps {
  rackColor: string;
  /** Layer name for hovered-unit preview (same for all units in this rack). */
  layerName: string;
  resolveDeviceTypeColor: (typeId: Device["deviceTypeId"]) => string;
  children: Device[];
  onSelectDevice: (device: Device) => void;
  onAddUnit: () => void;
  onMoveUnit: (childId: string, direction: -1 | 1) => void;
}

type PopoverPos = { top: number; left: number; maxWidth: number };

export function ServerRackStack({
  rackColor,
  layerName,
  resolveDeviceTypeColor,
  children,
  onSelectDevice,
  onAddUnit,
  onMoveUnit,
}: ServerRackStackProps) {
  const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<PopoverPos | null>(null);
  const hoverClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const popoverWrapperRef = useRef<HTMLDivElement | null>(null);

  const childrenSig = useMemo(() => children.map((c) => c.id).join(","), [children]);

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
      setHoveredUnitId(null);
      setPopoverPos(null);
      hoverClearTimerRef.current = null;
    }, 220);
  }, []);

  const updatePopoverPosition = useCallback((unitId: string) => {
    const el = rowRefs.current.get(unitId);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceLeft = rect.left - HOVER_GAP_PX - 8;
    const maxWidth = Math.min(320, Math.max(120, spaceLeft));
    const idealTop = rect.top;
    const vh = viewportHeight();

    let top = idealTop;
    const wrap = popoverWrapperRef.current;
    if (wrap) {
      const h = wrap.getBoundingClientRect().height;
      if (h > 0) {
        top = Math.max(
          VIEW_MARGIN_PX,
          Math.min(idealTop, vh - VIEW_MARGIN_PX - h)
        );
      }
    }

    setPopoverPos((prev) => {
      const next = {
        top,
        left: rect.left - HOVER_GAP_PX,
        maxWidth,
      };
      if (
        prev &&
        Math.abs(prev.top - next.top) < 0.5 &&
        Math.abs(prev.left - next.left) < 0.5 &&
        prev.maxWidth === next.maxWidth
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      cancelHoverClear();
    };
  }, [cancelHoverClear]);

  useLayoutEffect(() => {
    if (hoveredUnitId) {
      updatePopoverPosition(hoveredUnitId);
    }
  }, [hoveredUnitId, childrenSig, updatePopoverPosition]);

  /** After the portal mounts, measure height and clamp vertical position within the viewport. */
  useLayoutEffect(() => {
    if (hoveredUnitId && popoverPos) {
      updatePopoverPosition(hoveredUnitId);
    }
  }, [hoveredUnitId, popoverPos, layerName, childrenSig, updatePopoverPosition]);

  useEffect(() => {
    const onResize = () => {
      if (hoveredUnitId) updatePopoverPosition(hoveredUnitId);
    };
    window.addEventListener("resize", onResize);
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", onResize);
      vv.addEventListener("scroll", onResize);
    }
    return () => {
      window.removeEventListener("resize", onResize);
      if (vv) {
        vv.removeEventListener("resize", onResize);
        vv.removeEventListener("scroll", onResize);
      }
    };
  }, [hoveredUnitId, updatePopoverPosition]);

  /** Keep alignment when the rack list or the device panel scrolls. */
  useEffect(() => {
    if (!hoveredUnitId) return;
    let raf = 0;
    const onScrollCapture = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => updatePopoverPosition(hoveredUnitId));
    };
    document.addEventListener("scroll", onScrollCapture, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("scroll", onScrollCapture, true);
    };
  }, [hoveredUnitId, updatePopoverPosition]);

  const handleRowHover = useCallback(
    (id: string | null) => {
      if (id) {
        cancelHoverClear();
        setHoveredUnitId(id);
      } else {
        scheduleHoverClear();
      }
    },
    [cancelHoverClear, scheduleHoverClear]
  );

  const hoveredUnit =
    hoveredUnitId != null ? children.find((u) => u.id === hoveredUnitId) : undefined;

  const rackHoverPopover =
    typeof document !== "undefined" &&
    hoveredUnit &&
    popoverPos &&
    createPortal(
      <div
        ref={popoverWrapperRef}
        className="pointer-events-auto overflow-y-auto overscroll-contain"
        style={{
          position: "fixed",
          top: popoverPos.top,
          left: popoverPos.left,
          transform: "translateX(-100%)",
          width: popoverPos.maxWidth,
          maxWidth: popoverPos.maxWidth,
          maxHeight: "calc(100dvh - 16px)",
          zIndex: POPOVER_Z,
        }}
        onMouseEnter={cancelHoverClear}
        onMouseLeave={scheduleHoverClear}
      >
        <DeviceMapDockPanel device={hoveredUnit} layerName={layerName} />
      </div>,
      document.body
    );

  return (
    <div className="rounded-xl border-2 border-border bg-gradient-to-b from-bg-card to-bg-primary/80 overflow-hidden shadow-inner flex flex-col">
      {rackHoverPopover}

      {/* Rack frame */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-border/80 bg-bg-primary/60 shrink-0"
        style={{ borderLeftWidth: 3, borderLeftColor: rackColor }}
      >
        <div className="h-8 w-1 rounded-full bg-border/80 shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Rack stack
          </p>
          <p className="text-[11px] text-text-muted">Top → bottom (units are ordered)</p>
        </div>
        <div className="h-8 w-1 rounded-full bg-border/80 shrink-0" aria-hidden />
      </div>

      <div
        className="overflow-y-auto p-2 space-y-1.5 max-h-[min(60vh,420px)] min-h-0"
        onScroll={() => {
          if (hoveredUnitId) updatePopoverPosition(hoveredUnitId);
        }}
      >
        {children.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-6 px-2">
            No units yet. Add hardware to build the rack layout — each unit has its own documentation.
          </p>
        ) : (
          children.map((unit, index) => (
            <div
              key={unit.id}
              ref={(el) => {
                if (el) rowRefs.current.set(unit.id, el);
                else rowRefs.current.delete(unit.id);
              }}
              className="group flex items-stretch gap-1 rounded-lg border border-border/60 bg-bg-card/90 hover:border-accent/40 transition-colors overflow-hidden"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
              onMouseEnter={() => handleRowHover(unit.id)}
              onMouseLeave={() => handleRowHover(null)}
            >
              <div
                className="flex flex-col items-center justify-center gap-0.5 px-1 py-1 bg-bg-primary/70 border-r border-border/50 shrink-0"
                style={{ minWidth: "2.25rem" }}
              >
                <button
                  type="button"
                  className="p-0.5 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary disabled:opacity-25"
                  disabled={index === 0}
                  onClick={() => onMoveUnit(unit.id, -1)}
                  title="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono font-bold text-text-muted tabular-nums">
                  U{index + 1}
                </span>
                <button
                  type="button"
                  className="p-0.5 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary disabled:opacity-25"
                  disabled={index === children.length - 1}
                  onClick={() => onMoveUnit(unit.id, 1)}
                  title="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => onSelectDevice(unit)}
                className="flex-1 flex items-center gap-2 min-w-0 text-left py-2 pr-2 pl-1"
              >
                <div
                  className="w-1 self-stretch rounded-full shrink-0 opacity-90"
                  style={{
                    backgroundColor: resolveDeviceTypeColor(unit.deviceTypeId),
                  }}
                />
                <Circle
                  className={`w-2.5 h-2.5 shrink-0 fill-current ${
                    unit.status === "online"
                      ? "text-status-online"
                      : unit.status === "offline"
                      ? "text-status-offline"
                      : "text-status-maintenance"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{unit.name}</p>
                  <p className="text-[10px] text-text-muted truncate">
                    {unit.description ||
                      (unit.properties[0]
                        ? `${unit.properties[0].key}: ${unit.properties[0].value}`
                        : "Tap to open docs")}
                  </p>
                </div>
              </button>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={onAddUnit}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-accent-light bg-bg-primary/50 hover:bg-bg-hover border-t border-border transition-colors shrink-0"
      >
        <Plus className="w-4 h-4" />
        Add unit to rack
      </button>
    </div>
  );
}
