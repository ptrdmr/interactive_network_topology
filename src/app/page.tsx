"use client";

import { useCallback } from "react";
import Link from "next/link";
import { MapPin, Palette } from "lucide-react";
import { FloorPlansHome } from "@/components/home/FloorPlansHome";
import { ExportImport } from "@/components/ui/ExportImport";
import { useAppState } from "@/hooks/useAppState";

export default function HomePage() {
  const {
    floorPlans,
    hydrated,
    addFloorPlan,
    renameFloorPlan,
    deleteFloorPlan,
    exportJson,
    importJson,
    cloudSyncEnabled,
  } = useAppState();

  const handleAddFloor = useCallback(() => {
    return addFloorPlan();
  }, [addFloorPlan]);

  if (!hydrated) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary text-text-muted text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-bg-primary">
      <header className="border-b border-border bg-bg-secondary/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/20 shrink-0">
              <MapPin className="w-5 h-5 text-accent-light" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-text-primary tracking-tight truncate">
                Concourse
              </h1>
              <p className="text-xs text-text-muted">Network map</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/settings/device-types"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-border/60 transition-colors"
            >
              <Palette className="w-4 h-4 text-accent-light" />
              Device type colors
            </Link>
            <p className="text-[10px] text-text-muted hidden lg:block text-right max-w-xs">
              Pick a floor plan to edit the map, layers, and devices for that floor only.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16">
        <FloorPlansHome
          floorPlans={floorPlans}
          onAddFloor={handleAddFloor}
          onRenameFloor={renameFloorPlan}
          onDeleteFloor={deleteFloorPlan}
        />

        <div className="mt-12 pt-8 border-t border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
            Project data
          </h3>
          <ExportImport onExport={exportJson} onImport={importJson} />
          {cloudSyncEnabled && (
            <p className="text-[10px] text-text-muted mt-3">
              Cloud sync: map data is saved to Supabase (shared for all visitors).
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
