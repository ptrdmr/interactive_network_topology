"use client";

import { useState } from "react";
import { Layers, Plus, Pencil, Trash2 } from "lucide-react";
import type { FloorPlanDocument } from "@/types/floorPlan";

interface FloorPlanPickerProps {
  floorPlans: FloorPlanDocument[];
  activeFloorPlanId: string | null;
  onSelectFloor: (id: string) => void;
  onAddFloor: () => void;
  onRenameFloor: (id: string, name: string) => void;
  onDeleteFloor: (id: string) => void;
}

export function FloorPlanPicker({
  floorPlans,
  activeFloorPlanId,
  onSelectFloor,
  onAddFloor,
  onRenameFloor,
  onDeleteFloor,
}: FloorPlanPickerProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const startRename = (fp: FloorPlanDocument) => {
    setRenamingId(fp.id);
    setRenameDraft(fp.name);
  };

  const commitRename = () => {
    if (renamingId && renameDraft.trim()) {
      onRenameFloor(renamingId, renameDraft.trim());
    }
    setRenamingId(null);
  };

  const handleDelete = (fp: FloorPlanDocument) => {
    if (floorPlans.length <= 1) return;
    const hasContent =
      fp.layers.length > 0 ||
      fp.devices.length > 0 ||
      !!fp.floorPlanDataUrl;
    if (
      hasContent &&
      !confirm(
        `Delete “${fp.name}”? This removes its layers, devices, and background image. This cannot be undone.`
      )
    ) {
      return;
    }
    if (
      !hasContent &&
      !confirm(`Delete “${fp.name}”?`)
    ) {
      return;
    }
    onDeleteFloor(fp.id);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          Floor plans
        </h3>
        <button
          type="button"
          onClick={onAddFloor}
          className="p-1 rounded-md hover:bg-bg-hover text-accent-light"
          title="Add floor plan"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[10px] text-text-muted px-1 leading-relaxed">
        Each floor has its own image, layers, and devices. Switch to edit a different map.
      </p>
      <ul className="space-y-1">
        {floorPlans.map((fp) => {
          const active = fp.id === activeFloorPlanId;
          return (
            <li key={fp.id}>
              {renamingId === fp.id ? (
                <div className="flex gap-1 items-center">
                  <input
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="flex-1 min-w-0 px-2 py-1.5 rounded-md bg-bg-card border border-border text-xs"
                    autoFocus
                  />
                </div>
              ) : (
                <div
                  className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 ${
                    active
                      ? "border-accent/50 bg-accent/10"
                      : "border-border/50 bg-bg-card/50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectFloor(fp.id)}
                    className={`flex-1 min-w-0 text-left text-xs font-medium truncate ${
                      active ? "text-accent-light" : "text-text-primary hover:text-accent-light"
                    }`}
                  >
                    {fp.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => startRename(fp)}
                    className="p-1 rounded hover:bg-bg-hover text-text-muted shrink-0"
                    title="Rename"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={floorPlans.length <= 1}
                    onClick={() => handleDelete(fp)}
                    className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-status-offline shrink-0 disabled:opacity-30"
                    title={
                      floorPlans.length <= 1
                        ? "Cannot delete the only floor plan"
                        : "Delete floor plan"
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
