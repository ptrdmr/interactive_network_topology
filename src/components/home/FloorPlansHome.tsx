"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, Plus, Pencil, Trash2, MapPin, ChevronRight } from "lucide-react";
import type { FloorPlanDocument } from "@/types/floorPlan";

interface FloorPlansHomeProps {
  floorPlans: FloorPlanDocument[];
  onAddFloor: () => string;
  onRenameFloor: (id: string, name: string) => void;
  onDeleteFloor: (id: string) => void;
}

export function FloorPlansHome({
  floorPlans,
  onAddFloor,
  onRenameFloor,
  onDeleteFloor,
}: FloorPlansHomeProps) {
  const router = useRouter();
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
    if (!hasContent && !confirm(`Delete “${fp.name}”?`)) {
      return;
    }
    onDeleteFloor(fp.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary tracking-tight">
            Your floor plans
          </h2>
          <p className="text-sm text-text-muted mt-1 max-w-xl">
            Choose a floor to open the map. Each floor has its own image, layers, and devices.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const id = onAddFloor();
            router.push(`/map/${id}`);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-bg-primary text-sm font-medium hover:opacity-90 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New floor plan
        </button>
      </div>

      {floorPlans.length === 0 ? (
        <p className="text-sm text-text-muted">No floor plans yet. Create one to get started.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {floorPlans.map((fp) => {
            const deviceCount = fp.devices.filter((d) => !d.parentId).length;
            const rackUnits = fp.devices.filter((d) => d.parentId).length;
            const totalDevices = fp.devices.length;

            return (
              <li key={fp.id}>
                <div className="group rounded-xl border border-border bg-bg-secondary overflow-hidden shadow-sm hover:border-accent/40 transition-colors flex flex-col h-full">
                  <div className="aspect-[16/10] bg-bg-primary relative border-b border-border/60">
                    {fp.floorPlanDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={fp.floorPlanDataUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-text-muted">
                        <Layers className="w-12 h-12 opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    {renamingId === fp.id ? (
                      <input
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        className="w-full px-2 py-1.5 rounded-md bg-bg-card border border-border text-sm font-medium"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-semibold text-text-primary truncate flex items-center gap-2 min-w-0">
                          <MapPin className="w-4 h-4 shrink-0 text-accent-light" />
                          {fp.name}
                        </h3>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => startRename(fp)}
                            className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted"
                            title="Rename"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={floorPlans.length <= 1}
                            onClick={() => handleDelete(fp)}
                            className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted hover:text-status-offline disabled:opacity-30"
                            title={
                              floorPlans.length <= 1
                                ? "Cannot delete the only floor plan"
                                : "Delete"
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-text-muted">
                      {fp.layers.length} layer{fp.layers.length !== 1 ? "s" : ""} ·{" "}
                      {totalDevices} device{totalDevices !== 1 ? "s" : ""}
                      {rackUnits > 0 ? ` (${rackUnits} in racks)` : ""}
                    </p>
                    <Link
                      href={`/map/${fp.id}`}
                      className="mt-auto inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-border bg-bg-card text-sm font-medium text-text-primary hover:bg-bg-hover hover:border-accent/40 transition-colors"
                    >
                      Open map
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
