"use client";

import { ChevronDown, ChevronUp, Circle, Plus } from "lucide-react";
import type { Device } from "@/types/device";

interface ServerRackStackProps {
  rackColor: string;
  children: Device[];
  onSelectDevice: (device: Device) => void;
  onAddUnit: () => void;
  onMoveUnit: (childId: string, direction: -1 | 1) => void;
}

export function ServerRackStack({
  rackColor,
  children,
  onSelectDevice,
  onAddUnit,
  onMoveUnit,
}: ServerRackStackProps) {
  return (
    <div className="rounded-xl border-2 border-border bg-gradient-to-b from-bg-card to-bg-primary/80 overflow-hidden shadow-inner">
      {/* Rack frame */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-border/80 bg-bg-primary/60"
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

      <div className="p-2 space-y-1.5 max-h-[min(60vh,420px)] overflow-y-auto">
        {children.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-6 px-2">
            No units yet. Add hardware to build the server layout — each unit has its own documentation.
          </p>
        ) : (
          children.map((unit, index) => (
            <div
              key={unit.id}
              className="group flex items-stretch gap-1 rounded-lg border border-border/60 bg-bg-card/90 hover:border-accent/40 transition-colors overflow-hidden"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
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
                  style={{ backgroundColor: rackColor }}
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
        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-accent-light bg-bg-primary/50 hover:bg-bg-hover border-t border-border transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add unit to rack
      </button>
    </div>
  );
}
