"use client";

import * as LucideIcons from "lucide-react";
import { Pencil, Trash2 } from "lucide-react";
import type { Layer } from "@/types/layer";

interface LayerToggleProps {
  layer: Layer;
  isActive: boolean;
  isVisible: boolean;
  deviceCount: number;
  onActivate: () => void;
  onToggleVisibility: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function LayerToggle({
  layer,
  isActive,
  isVisible,
  deviceCount,
  onActivate,
  onToggleVisibility,
  onEdit,
  onDelete,
}: LayerToggleProps) {
  const IconComponent =
    (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[layer.icon] ??
    LucideIcons.Circle;

  return (
    <div
      className={`flex items-center gap-1 rounded-lg transition-all text-sm border ${
        isActive
          ? "border-accent ring-1 ring-accent/40 bg-bg-card"
          : "border-transparent hover:bg-bg-card/50"
      }`}
    >
      <button
        type="button"
        onClick={onActivate}
        className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-l-lg min-w-0 text-left text-text-primary"
        title="Set as active layer for placing devices"
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded-md shrink-0 transition-opacity"
          style={{
            backgroundColor: isVisible ? `${layer.color}20` : "transparent",
            borderColor: layer.color,
            borderWidth: "1px",
            borderStyle: "solid",
            opacity: isVisible ? 1 : 0.4,
          }}
        >
          <IconComponent className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5 leading-tight truncate">
            <span className="truncate">{layer.name}</span>
            {layer.kind === "server" && (
              <span className="shrink-0 text-[9px] uppercase tracking-wide px-1 py-0.5 rounded bg-accent/25 text-accent-light font-semibold">
                Rack
              </span>
            )}
          </span>
          <span className="block text-xs text-text-muted">
            {layer.kind === "server" ? `${deviceCount} on map` : `${deviceCount} devices`}
          </span>
        </div>
      </button>

      <div className="flex items-center gap-0.5 pr-1 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted hover:text-text-primary"
          title="Edit layer"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete layer "${layer.name}" and all its devices?`)) onDelete();
          }}
          className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted hover:text-status-offline"
          title="Delete layer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
            isVisible ? "bg-accent" : "bg-border"
          }`}
          title={isVisible ? "Hide layer" : "Show layer"}
          role="switch"
          aria-checked={isVisible}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
              isVisible ? "translate-x-[18px]" : "translate-x-[3px]"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
