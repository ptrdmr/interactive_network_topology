"use client";

import Link from "next/link";
import { PanelLeftClose, PanelLeft, MapPin, LayoutGrid, Network, X } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { LayerPanel } from "@/components/layers/LayerPanel";
import { ExportImport } from "./ExportImport";
import { FloorPlanUpload } from "./FloorPlanUpload";
import type { Layer } from "@/types/layer";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface SidebarProps {
  /** Current floor name (map view). */
  activeFloorName: string;
  search: string;
  onSearchChange: (value: string) => void;
  layers: Layer[];
  activeLayerId: string | null;
  onClearActiveLayer: () => void;
  onActivateLayer: (layerId: string) => void;
  onToggleLayer: (layerId: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onNewLayer: () => void;
  onEditLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  deviceCountByLayer: Record<string, number>;
  stats?: { total: number; online: number; offline: number; maintenance: number };
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
  cloudSyncEnabled?: boolean;
  hasCustomFloorPlan: boolean;
  onFloorPlanUpload: (file: File) => Promise<void>;
  onFloorPlanReset: () => void;
  /** Optional link to switch between map and topology (same floor). */
  alternateView?: {
    href: string;
    label: string;
    /** `map` = floor plan; `network` = topology graph */
    icon?: "map" | "network";
  } | null;
  /** Controlled drawer/sidebar: `true` = hidden rail or off-canvas overlay. */
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function Sidebar({
  activeFloorName,
  search,
  onSearchChange,
  layers,
  activeLayerId,
  onClearActiveLayer,
  onActivateLayer,
  onToggleLayer,
  onShowAll,
  onHideAll,
  onNewLayer,
  onEditLayer,
  onDeleteLayer,
  deviceCountByLayer,
  stats,
  onExport,
  onImport,
  cloudSyncEnabled,
  hasCustomFloorPlan,
  onFloorPlanUpload,
  onFloorPlanReset,
  alternateView,
  collapsed,
  onCollapsedChange,
}: SidebarProps) {
  const isLg = useMediaQuery("(min-width: 1024px)");
  const AlternateNavIcon = alternateView?.icon === "map" ? MapPin : Network;

  const showOverlayBackdrop = !isLg && !collapsed;

  return (
    <>
      {showOverlayBackdrop && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/55 lg:hidden"
          onClick={() => onCollapsedChange(true)}
        />
      )}

      {/* Mobile / narrow: open map; overlay closed: show menu */}
      <button
        type="button"
        onClick={() => onCollapsedChange(!collapsed)}
        className="fixed z-50 p-2.5 rounded-lg bg-bg-card border border-border text-text-primary shadow-lg lg:hidden left-[max(1rem,env(safe-area-inset-left))] top-[max(1rem,env(safe-area-inset-top))]"
        aria-expanded={!collapsed}
        aria-controls="app-sidebar"
      >
        {collapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
      </button>

      <aside
        id="app-sidebar"
        className={`fixed top-0 left-0 h-full z-40 flex flex-col bg-bg-secondary border-r border-border transition-all duration-300 ${
          collapsed ? "-translate-x-full lg:translate-x-0 lg:w-16" : "w-[min(100vw-3rem,20rem)] sm:w-80 translate-x-0"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center border-b border-border shrink-0 ${
            collapsed ? "lg:justify-center lg:px-2 lg:py-4" : "px-4 py-4 gap-3"
          }`}
        >
          {collapsed ? (
            <button
              type="button"
              onClick={() => onCollapsedChange(false)}
              className="hidden lg:block p-1 rounded hover:bg-bg-hover"
              aria-label="Expand sidebar"
            >
              <PanelLeft className="w-5 h-5 text-text-muted" />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/20 shrink-0">
                  <MapPin className="w-5 h-5 text-accent-light" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold truncate tracking-wide">CONCOURSE</h1>
                  <p className="text-xs text-text-muted truncate">{activeFloorName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onCollapsedChange(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-bg-hover transition-colors shrink-0"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
              <button
                type="button"
                onClick={() => onCollapsedChange(true)}
                className="hidden lg:block p-1.5 rounded hover:bg-bg-hover transition-colors"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4 text-text-muted" />
              </button>
            </>
          )}
        </div>

        {!collapsed && (
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-6 flex flex-col min-h-0">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-bg-card text-sm font-medium text-text-primary hover:bg-bg-hover hover:border-accent/40 transition-colors"
            >
              <LayoutGrid className="w-4 h-4 shrink-0 text-accent-light" />
              All floor plans
            </Link>

            {alternateView && (
              <Link
                href={alternateView.href}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-bg-card text-sm font-medium text-text-primary hover:bg-bg-hover hover:border-accent/40 transition-colors"
              >
                <AlternateNavIcon className="w-4 h-4 shrink-0 text-accent-light" />
                {alternateView.label}
              </Link>
            )}

            <SearchBar value={search} onChange={onSearchChange} />

            <LayerPanel
              layers={layers}
              activeLayerId={activeLayerId}
              onActivateLayer={onActivateLayer}
              onToggleLayer={onToggleLayer}
              onShowAll={onShowAll}
              onHideAll={onHideAll}
              onNewLayer={onNewLayer}
              onEditLayer={onEditLayer}
              onDeleteLayer={onDeleteLayer}
              deviceCountByLayer={deviceCountByLayer}
            />

            {activeLayerId && (
              <button
                type="button"
                onClick={onClearActiveLayer}
                className="text-xs text-accent-light hover:underline px-1 -mt-2 text-left"
              >
                Exit place mode
              </button>
            )}

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted px-1">
                Summary
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-bg-card rounded-lg p-3 border border-border">
                  <p className="text-2xl font-bold text-text-primary">{stats?.total ?? 0}</p>
                  <p className="text-xs text-text-muted">Total Devices</p>
                </div>
                <div className="bg-bg-card rounded-lg p-3 border border-border">
                  <p className="text-2xl font-bold text-status-online">{stats?.online ?? 0}</p>
                  <p className="text-xs text-text-muted">Online</p>
                </div>
                <div className="bg-bg-card rounded-lg p-3 border border-border">
                  <p className="text-2xl font-bold text-status-offline">{stats?.offline ?? 0}</p>
                  <p className="text-xs text-text-muted">Offline</p>
                </div>
                <div className="bg-bg-card rounded-lg p-3 border border-border">
                  <p className="text-2xl font-bold text-status-maintenance">{stats?.maintenance ?? 0}</p>
                  <p className="text-xs text-text-muted">Maintenance</p>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-4" />

            <FloorPlanUpload
              floorName={activeFloorName}
              hasCustomFloorPlan={hasCustomFloorPlan}
              onUpload={onFloorPlanUpload}
              onReset={onFloorPlanReset}
            />

            <ExportImport onExport={onExport} onImport={onImport} />
            {cloudSyncEnabled && (
              <p className="text-[10px] text-text-muted px-1 -mt-2">
                Cloud sync: map data is saved to Supabase (shared for all visitors).
              </p>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
