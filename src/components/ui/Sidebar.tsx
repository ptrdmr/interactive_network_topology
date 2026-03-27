"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeft, MapPin } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { LayerPanel } from "@/components/layers/LayerPanel";
import { ExportImport } from "./ExportImport";
import type { Layer } from "@/types/layer";

interface SidebarProps {
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
}

export function Sidebar({
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
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-bg-card border border-border text-text-primary md:hidden"
      >
        {collapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
      </button>

      <aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col bg-bg-secondary border-r border-border transition-all duration-300 ${
          collapsed ? "-translate-x-full md:translate-x-0 md:w-16" : "w-80"
        }`}
      >
        {/* Header */}
        <div className={`flex items-center border-b border-border ${collapsed ? "md:justify-center md:px-2 md:py-4" : "px-4 py-4 gap-3"}`}>
          {collapsed ? (
            <button onClick={() => setCollapsed(false)} className="hidden md:block p-1 rounded hover:bg-bg-hover">
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
                  <p className="text-xs text-text-muted truncate">Network Map</p>
                </div>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="hidden md:block p-1.5 rounded hover:bg-bg-hover transition-colors"
              >
                <PanelLeftClose className="w-4 h-4 text-text-muted" />
              </button>
            </>
          )}
        </div>

        {/* Content — hidden when collapsed on desktop */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 flex flex-col min-h-0">
            {/* Search */}
            <SearchBar value={search} onChange={onSearchChange} />

            {/* Layer toggles */}
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

            {/* Stats summary */}
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

            <ExportImport onExport={onExport} onImport={onImport} />
          </div>
        )}
      </aside>
    </>
  );
}
