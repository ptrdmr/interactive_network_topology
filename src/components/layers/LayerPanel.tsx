"use client";

import { Eye, EyeOff, GitMerge, Plus } from "lucide-react";
import type { Layer } from "@/types/layer";
import { LayerToggle } from "./LayerToggle";

interface LayerPanelProps {
  layers: Layer[];
  activeLayerId: string | null;
  onActivateLayer: (layerId: string) => void;
  onToggleLayer: (layerId: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onNewLayer: () => void;
  /** Combine multiple layers into one (map workflow). */
  onOpenMerge?: () => void;
  onEditLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  deviceCountByLayer: Record<string, number>;
}

export function LayerPanel({
  layers,
  activeLayerId,
  onActivateLayer,
  onToggleLayer,
  onShowAll,
  onHideAll,
  onNewLayer,
  onOpenMerge,
  onEditLayer,
  onDeleteLayer,
  deviceCountByLayer,
}: LayerPanelProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 mb-1 gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Layers
        </h3>
        <div className="flex gap-1 items-center flex-wrap justify-end">
          <button
            type="button"
            onClick={onNewLayer}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-accent/20 text-accent-light hover:bg-accent/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
          {onOpenMerge && layers.length >= 2 && (
            <button
              type="button"
              onClick={onOpenMerge}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-bg-card border border-border text-text-primary hover:bg-bg-hover transition-colors"
              title="Merge selected layers into a new layer"
            >
              <GitMerge className="w-3.5 h-3.5" />
              Merge
            </button>
          )}
          <button
            type="button"
            onClick={onShowAll}
            className="p-1.5 rounded hover:bg-bg-hover transition-colors text-text-muted hover:text-text-primary"
            title="Show all layers"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onHideAll}
            className="p-1.5 rounded hover:bg-bg-hover transition-colors text-text-muted hover:text-text-primary"
            title="Hide all layers"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {layers.length === 0 ? (
        <p className="text-xs text-text-muted px-1 py-2">
          No layers yet. Click <span className="text-accent-light">New</span> to create one, then select it and click the map to place devices.
        </p>
      ) : (
        <div className="space-y-1">
          {layers.map((layer) => (
            <LayerToggle
              key={layer.id}
              layer={layer}
              isActive={activeLayerId === layer.id}
              isVisible={layer.visible}
              onActivate={() => onActivateLayer(layer.id)}
              onToggleVisibility={() => onToggleLayer(layer.id)}
              onEdit={() => onEditLayer(layer.id)}
              onDelete={() => onDeleteLayer(layer.id)}
              deviceCount={deviceCountByLayer[layer.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
