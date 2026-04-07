"use client";

import { useState } from "react";
import { Panel } from "@xyflow/react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReactFlow } from "@xyflow/react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  LayoutGrid,
  Maximize2,
  RefreshCw,
  Target,
} from "lucide-react";
import type { Layer } from "@/types/layer";
import type { LayoutDirection } from "@/lib/topology/layoutGraph";

export type EdgeKindToggles = {
  port: boolean;
  rack: boolean;
  property: boolean;
};

export type FocusHopMode = 1 | 2 | 3 | 4 | "all";

interface TopologyControlsProps {
  layers: Layer[];
  onToggleLayer: (layerId: string) => void;
  collapsedLayerIds: string[];
  onToggleLayerCollapse: (layerId: string) => void;
  direction: LayoutDirection;
  onDirectionChange: (d: LayoutDirection) => void;
  edgeToggles: EdgeKindToggles;
  onEdgeTogglesChange: (next: EdgeKindToggles) => void;
  onRelayout: () => void;
  deviceOptions: { id: string; name: string }[];
  focusDeviceId: string | null;
  onFocusDeviceId: (id: string | null) => void;
  focusHopMode: FocusHopMode;
  onFocusHopMode: (mode: FocusHopMode) => void;
}

export function TopologyControls({
  layers,
  onToggleLayer,
  collapsedLayerIds,
  onToggleLayerCollapse,
  direction,
  onDirectionChange,
  edgeToggles,
  onEdgeTogglesChange,
  onRelayout,
  deviceOptions,
  focusDeviceId,
  onFocusDeviceId,
  focusHopMode,
  onFocusHopMode,
}: TopologyControlsProps) {
  const { fitView } = useReactFlow();
  const collapsedSet = new Set(collapsedLayerIds);
  const [panelOpen, setPanelOpen] = useState(true);
  const narrowPanel = useMediaQuery("(max-width: 520px)");

  return (
    <Panel
      position="top-left"
      className={`!m-0 mb-3 mr-3 max-w-[min(100%,calc(100vw-2.5rem-env(safe-area-inset-left)-env(safe-area-inset-right)))] rounded-lg border border-border bg-bg-card/95 shadow-lg backdrop-blur-sm text-xs text-text-primary ml-[max(0.75rem,env(safe-area-inset-left))] mt-[max(0.75rem,env(safe-area-inset-top))] ${
        panelOpen
          ? "p-3 max-h-[min(90vh,42rem)] overflow-y-auto"
          : "p-2 overflow-hidden"
      }`}
    >
      <button
        type="button"
        onClick={() => setPanelOpen((o) => !o)}
        className="flex items-center gap-2 w-full min-h-[28px] rounded-md -m-0.5 px-0.5 py-0.5 text-left hover:bg-bg-hover/80 transition-colors"
        aria-expanded={panelOpen}
        title={panelOpen ? "Collapse topology panel" : "Expand topology panel"}
      >
        <LayoutGrid className="w-4 h-4 text-accent-light shrink-0" />
        <span className="font-semibold text-sm text-text-primary truncate flex-1 min-w-0">
          {narrowPanel ? "Graph" : "Topology"}
        </span>
        {panelOpen ? (
          <ChevronUp className="w-4 h-4 text-text-muted shrink-0" aria-hidden />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-muted shrink-0" aria-hidden />
        )}
      </button>

      {panelOpen && (
        <div className="space-y-3 mt-3 pt-3 border-t border-border/60">
        <div>
          <p className="text-text-muted mb-1.5 uppercase tracking-wide text-[10px]">
            Focus
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-text-muted">Device</span>
              <select
                className="w-full rounded-md border border-border bg-bg-secondary px-2 py-1.5 text-xs text-text-primary"
                value={focusDeviceId ?? ""}
                onChange={(e) =>
                  onFocusDeviceId(e.target.value ? e.target.value : null)
                }
              >
                <option value="">Full floor (no focus)</option>
                {deviceOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-text-muted">Max hops</span>
              <select
                className="w-full rounded-md border border-border bg-bg-secondary px-2 py-1.5 text-xs text-text-primary"
                value={focusHopMode === "all" ? "all" : String(focusHopMode)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "all") onFocusHopMode("all");
                  else onFocusHopMode(Number(v) as 1 | 2 | 3 | 4);
                }}
                disabled={!focusDeviceId}
              >
                <option value="1">1 hop</option>
                <option value="2">2 hops</option>
                <option value="3">3 hops</option>
                <option value="4">4 hops</option>
                <option value="all">All (full component)</option>
              </select>
            </label>
            {focusDeviceId && (
              <button
                type="button"
                onClick={() => onFocusDeviceId(null)}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-bg-secondary/80 hover:bg-bg-hover text-[11px] font-medium"
              >
                <Target className="w-3.5 h-3.5" />
                Clear focus
              </button>
            )}
          </div>
        </div>

        <div>
          <p className="text-text-muted mb-1.5 uppercase tracking-wide text-[10px]">
            Layout
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onDirectionChange("TB")}
              className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors ${
                direction === "TB"
                  ? "border-accent-light bg-accent/20 text-text-primary"
                  : "border-border bg-bg-secondary/80 hover:bg-bg-hover"
              }`}
            >
              Top → bottom
            </button>
            <button
              type="button"
              onClick={() => onDirectionChange("LR")}
              className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors ${
                direction === "LR"
                  ? "border-accent-light bg-accent/20 text-text-primary"
                  : "border-border bg-bg-secondary/80 hover:bg-bg-hover"
              }`}
            >
              Left → right
            </button>
            <button
              type="button"
              onClick={() => onRelayout()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-bg-secondary/80 hover:bg-bg-hover text-[11px] font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-layout
            </button>
            <button
              type="button"
              onClick={() => void fitView({ padding: 0.2, duration: 200 })}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-bg-secondary/80 hover:bg-bg-hover text-[11px] font-medium"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Fit view
            </button>
          </div>
        </div>

        <div>
          <p className="text-text-muted mb-1.5 uppercase tracking-wide text-[10px]">
            Edge types
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-border"
                checked={edgeToggles.port}
                onChange={(e) =>
                  onEdgeTogglesChange({ ...edgeToggles, port: e.target.checked })
                }
              />
              <span>Port links (solid)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-border"
                checked={edgeToggles.rack}
                onChange={(e) =>
                  onEdgeTogglesChange({ ...edgeToggles, rack: e.target.checked })
                }
              />
              <span>Rack hierarchy (dashed)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-border"
                checked={edgeToggles.property}
                onChange={(e) =>
                  onEdgeTogglesChange({
                    ...edgeToggles,
                    property: e.target.checked,
                  })
                }
              />
              <span>Property refs (dotted)</span>
            </label>
          </div>
        </div>

        {layers.length > 0 && (
          <div>
            <p className="text-text-muted mb-1.5 uppercase tracking-wide text-[10px]">
              Layers
            </p>
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              {layers.map((layer) => {
                const isCollapsed = collapsedSet.has(layer.id);
                return (
                  <div
                    key={layer.id}
                    className="flex items-center gap-1.5 min-w-0"
                  >
                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        checked={layer.visible}
                        onChange={() => onToggleLayer(layer.id)}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={!layer.visible}
                      onClick={() => onToggleLayerCollapse(layer.id)}
                      className="p-1 rounded hover:bg-bg-hover text-text-muted disabled:opacity-30 disabled:pointer-events-none shrink-0"
                      title={
                        isCollapsed ? "Expand layer on graph" : "Collapse layer"
                      }
                    >
                      {isCollapsed ? (
                        <ChevronsUpDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronsDownUp className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span
                      className="truncate flex items-center gap-1.5 flex-1 min-w-0 text-[11px]"
                      title={layer.name}
                    >
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: layer.color }}
                      />
                      {layer.name}
                      {isCollapsed && (
                        <span className="text-text-muted">(collapsed)</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </div>
      )}
    </Panel>
  );
}
