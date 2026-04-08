"use client";

import { useState, useCallback, useMemo, useEffect, useLayoutEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/ui/Sidebar";
import { LandscapeHint } from "@/components/ui/LandscapeHint";
import { MapCanvas } from "./MapCanvas";
import { DeviceDetailPanel } from "@/components/devices/DeviceDetailPanel";
import { DeviceForm } from "@/components/devices/DeviceForm";
import { LayerForm } from "@/components/layers/LayerForm";
import { useAppState } from "@/hooks/useAppState";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Layer } from "@/types/layer";
import type { Device } from "@/types/device";
import type { Zone } from "@/types/zone";
import { FLOOR_PLAN_HEIGHT, FLOOR_PLAN_WIDTH } from "@/constants/floorPlan";
import {
  REPOSITION_SHIFT_MULT,
  REPOSITION_STEP_PX,
} from "@/constants/reposition";
import { deviceMatchesSearch } from "@/lib/deviceSearch";
import {
  DEVICE_TYPE_LABELS,
  type DeviceTypeId,
} from "@/constants/deviceTypes";

const zones: Zone[] = [];

const DEFAULT_FLOOR_PLAN_HREF = "/floor-plan.jpg";

interface MapWorkspaceProps {
  floorId: string;
}

export function MapWorkspace({ floorId }: MapWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    layers,
    devices,
    allDevicesFlat,
    floorPlans,
    activeFloorPlanId,
    setActiveFloorPlanId,
    activeLayerId,
    setActiveLayerId,
    hydrated,
    layerById,
    deviceById,
    childrenOf,
    connectedTo,
    visibleDevices,
    deviceCountByLayer,
    stats,
    addLayer,
    updateLayer,
    deleteLayer,
    mergeLayers,
    toggleLayerVisibility,
    showAllLayers,
    hideAllLayers,
    addDevice,
    updateDevice,
    deleteDevice,
    exportCsv,
    importJson,
    floorPlanDataUrl,
    uploadFloorPlanFromFile,
    clearFloorPlan,
    cloudSyncEnabled,
    resolveDeviceTypeColor,
  } = useAppState();

  const activeFloorName = useMemo(
    () =>
      floorPlans.find((fp) => fp.id === activeFloorPlanId)?.name ?? "Floor",
    [floorPlans, activeFloorPlanId]
  );

  const [search, setSearch] = useState("");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<
    DeviceTypeId | "all"
  >("all");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [deviceFormId, setDeviceFormId] = useState<string | null>(null);
  const [deviceFormMode, setDeviceFormMode] = useState<"create" | "edit">("create");
  const [layerFormOpen, setLayerFormOpen] = useState(false);
  const [layerFormLayer, setLayerFormLayer] = useState<Layer | null>(null);
  const [mergeFormOpen, setMergeFormOpen] = useState(false);
  const [mergeSelectedIds, setMergeSelectedIds] = useState<string[]>([]);
  const [repositionMode, setRepositionMode] = useState(false);

  const isLg = useMediaQuery("(min-width: 1024px)");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  useLayoutEffect(() => {
    // Open docked sidebar on desktop after first paint; SSR has no window.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync to viewport width
    setSidebarCollapsed(window.innerWidth < 1024);
  }, []);

  useLayoutEffect(() => {
    if (!hydrated) return;
    const exists = floorPlans.some((fp) => fp.id === floorId);
    if (!exists) {
      router.replace("/");
      return;
    }
    setActiveFloorPlanId(floorId);
  }, [hydrated, floorId, floorPlans, router, setActiveFloorPlanId]);

  const floorSynced =
    hydrated &&
    floorPlans.some((fp) => fp.id === floorId) &&
    activeFloorPlanId === floorId;

  const selectParam = searchParams.get("select");
  useEffect(() => {
    if (!selectParam || !hydrated) return;
    setSelectedDeviceId(selectParam);
    router.replace(`/map/${floorId}`, { scroll: false });
  }, [hydrated, floorId, selectParam, router]);

  const mergeLayerInitial = useMemo((): Layer | null => {
    if (mergeSelectedIds.length < 2) return null;
    const picked = layers.filter((l) => mergeSelectedIds.includes(l.id));
    if (picked.length < 2) return null;
    const kind = picked.some((l) => l.kind === "rack") ? "rack" : "standard";
    return {
      id: "__merge__",
      name: picked.map((l) => l.name).join(" / "),
      icon: picked[0].icon,
      color: picked[0].color,
      description: "",
      visible: true,
      kind,
    };
  }, [layers, mergeSelectedIds]);

  const typeFilteredDevices = useMemo(() => {
    if (deviceTypeFilter === "all") return visibleDevices;
    return visibleDevices.filter((d) => d.deviceTypeId === deviceTypeFilter);
  }, [visibleDevices, deviceTypeFilter]);

  const filteredDevices = useMemo(() => {
    const q = search.trim();
    if (!q) return typeFilteredDevices;
    return typeFilteredDevices.filter((d) => deviceMatchesSearch(d, q));
  }, [typeFilteredDevices, search]);

  const handleDeviceClick = useCallback(
    (device: Device) => {
      const fp = floorPlans.find((f) => f.devices.some((d) => d.id === device.id));
      if (fp && fp.id !== floorId) {
        router.push(`/map/${fp.id}?select=${encodeURIComponent(device.id)}`);
        return;
      }
      setDeviceFormId(null);
      setRepositionMode(false);
      setSelectedDeviceId(device.id);
    },
    [floorPlans, floorId, router]
  );

  const handleClosePanel = useCallback(() => {
    setRepositionMode(false);
    setSelectedDeviceId(null);
  }, []);

  const handleEnterRepositionMode = useCallback(() => {
    setActiveLayerId(null);
    setRepositionMode(true);
  }, [setActiveLayerId]);

  const handleExitRepositionMode = useCallback(() => {
    setRepositionMode(false);
  }, []);

  useEffect(() => {
    if (activeLayerId) setRepositionMode(false);
  }, [activeLayerId]);

  useEffect(() => {
    if (!repositionMode || !selectedDeviceId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable)
      ) {
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setRepositionMode(false);
        return;
      }

      if (
        e.key !== "ArrowUp" &&
        e.key !== "ArrowDown" &&
        e.key !== "ArrowLeft" &&
        e.key !== "ArrowRight"
      ) {
        return;
      }

      const device = devices.find((d) => d.id === selectedDeviceId);
      if (!device || device.parentId) return;

      e.preventDefault();
      const step = e.shiftKey
        ? REPOSITION_STEP_PX * REPOSITION_SHIFT_MULT
        : REPOSITION_STEP_PX;
      let dx = 0;
      let dy = 0;
      if (e.key === "ArrowLeft") dx = -step;
      if (e.key === "ArrowRight") dx = step;
      if (e.key === "ArrowUp") dy = -step;
      if (e.key === "ArrowDown") dy = step;
      const nx = Math.min(
        FLOOR_PLAN_WIDTH,
        Math.max(0, device.position.x + dx)
      );
      const ny = Math.min(
        FLOOR_PLAN_HEIGHT,
        Math.max(0, device.position.y + dy)
      );
      updateDevice(device.id, { position: { x: nx, y: ny } });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [repositionMode, selectedDeviceId, devices, updateDevice]);

  const handleRepositionNudge = useCallback(
    (dx: number, dy: number) => {
      if (!selectedDeviceId) return;
      const device = devices.find((d) => d.id === selectedDeviceId);
      if (!device || device.parentId) return;
      const nx = Math.min(
        FLOOR_PLAN_WIDTH,
        Math.max(0, device.position.x + dx)
      );
      const ny = Math.min(
        FLOOR_PLAN_HEIGHT,
        Math.max(0, device.position.y + dy)
      );
      updateDevice(device.id, { position: { x: nx, y: ny } });
    },
    [selectedDeviceId, devices, updateDevice]
  );

  const handlePlaceAt = useCallback(
    (position: { x: number; y: number }) => {
      if (!activeLayerId) return;
      setRepositionMode(false);
      const layer = layerById(activeLayerId);
      const id = addDevice({
        name: layer?.kind === "rack" ? "New rack" : "New device",
        layerId: activeLayerId,
        position,
        status: "online",
        description: "",
        deviceTypeId: layer?.kind === "rack" ? "rack" : "other",
        properties: [],
        portSlots: [],
        tags: [],
      });
      setSelectedDeviceId(null);
      setDeviceFormMode("create");
      setDeviceFormId(id);
    },
    [activeLayerId, addDevice, layerById]
  );

  const handleAddRackUnit = useCallback(
    (parent: Device) => {
      setRepositionMode(false);
      const siblings = devices.filter((d) => d.parentId === parent.id);
      const nextOrder =
        siblings.length === 0
          ? 1
          : Math.max(...siblings.map((c) => c.rackOrder ?? 0), 0) + 1;
      const id = addDevice({
        name: "New unit",
        layerId: parent.layerId,
        parentId: parent.id,
        position: { ...parent.position },
        rackOrder: nextOrder,
        status: "online",
        description: "",
        deviceTypeId: "other",
        properties: [],
        portSlots: [],
        tags: [],
      });
      setSelectedDeviceId(null);
      setDeviceFormMode("create");
      setDeviceFormId(id);
    },
    [addDevice, devices]
  );

  const handleMoveRackUnit = useCallback(
    (parentId: string, childId: string, direction: -1 | 1) => {
      const siblings = childrenOf(parentId);
      const idx = siblings.findIndex((c) => c.id === childId);
      if (idx < 0) return;
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= siblings.length) return;
      const a = siblings[idx];
      const b = siblings[swapIdx];
      const ao = a.rackOrder ?? idx + 1;
      const bo = b.rackOrder ?? swapIdx + 1;
      updateDevice(a.id, { rackOrder: bo });
      updateDevice(b.id, { rackOrder: ao });
    },
    [childrenOf, updateDevice]
  );

  const closeDeviceForm = useCallback(() => {
    setDeviceFormId(null);
  }, []);

  const handleDeviceFormClose = useCallback(() => {
    setRepositionMode(false);
    if (deviceFormMode === "create" && deviceFormId) {
      deleteDevice(deviceFormId);
    }
    closeDeviceForm();
  }, [deviceFormMode, deviceFormId, deleteDevice, closeDeviceForm]);

  const deviceFormDevice = deviceFormId ? deviceById(deviceFormId) : null;

  const selectedDevice = selectedDeviceId
    ? deviceById(selectedDeviceId) ?? null
    : null;

  const openLayerCreate = useCallback(() => {
    setMergeFormOpen(false);
    setMergeSelectedIds([]);
    setLayerFormLayer(null);
    setLayerFormOpen(true);
  }, []);

  const openLayerEdit = useCallback(
    (layerId: string) => {
      setMergeFormOpen(false);
      setMergeSelectedIds([]);
      const l = layerById(layerId);
      if (l) {
        setLayerFormLayer(l);
        setLayerFormOpen(true);
      }
    },
    [layerById]
  );

  const openMergeLayers = useCallback(() => {
    setLayerFormOpen(false);
    setLayerFormLayer(null);
    setMergeFormOpen(true);
    setMergeSelectedIds([]);
  }, []);

  const handleMergeLayerSave = useCallback(
    (data: Omit<Layer, "id">) => {
      const id = mergeLayers(mergeSelectedIds, data);
      if (id) {
        setMergeFormOpen(false);
        setMergeSelectedIds([]);
      }
    },
    [mergeSelectedIds, mergeLayers]
  );

  const handleLayerSave = useCallback(
    (data: Omit<Layer, "id">) => {
      if (layerFormLayer) {
        updateLayer(layerFormLayer.id, data);
      } else {
        const id = addLayer(data);
        setActiveLayerId(id);
      }
      setLayerFormOpen(false);
      setLayerFormLayer(null);
    },
    [layerFormLayer, updateLayer, addLayer, setActiveLayerId]
  );

  if (!hydrated) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary text-text-muted text-sm">
        Loading map…
      </div>
    );
  }

  if (!floorPlans.some((fp) => fp.id === floorId)) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary text-text-muted text-sm">
        Redirecting…
      </div>
    );
  }

  if (!floorSynced) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary text-text-muted text-sm">
        Loading map…
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <Sidebar
        activeFloorName={activeFloorName}
        search={search}
        onSearchChange={setSearch}
        deviceTypeFilter={deviceTypeFilter}
        onDeviceTypeFilterChange={setDeviceTypeFilter}
        searchHint={
          search.trim()
            ? `Showing ${filteredDevices.length} of ${typeFilteredDevices.length} on the floor plan after search.`
            : deviceTypeFilter !== "all"
              ? `${typeFilteredDevices.length} device(s) with type “${DEVICE_TYPE_LABELS[deviceTypeFilter]}” on visible layers. Use search to narrow by name, tags, IP, and more.`
              : "Filters which devices appear as markers on the map (name, description, IP, properties, ports, tags…)."
        }
        layers={layers}
        activeLayerId={activeLayerId}
        onClearActiveLayer={() => setActiveLayerId(null)}
        onActivateLayer={setActiveLayerId}
        onToggleLayer={toggleLayerVisibility}
        onShowAll={showAllLayers}
        onHideAll={hideAllLayers}
        onNewLayer={openLayerCreate}
        onOpenMerge={openMergeLayers}
        onEditLayer={openLayerEdit}
        onDeleteLayer={deleteLayer}
        deviceCountByLayer={deviceCountByLayer}
        stats={stats}
        onExport={exportCsv}
        onImport={importJson}
        cloudSyncEnabled={cloudSyncEnabled}
        hasCustomFloorPlan={!!floorPlanDataUrl}
        onFloorPlanUpload={uploadFloorPlanFromFile}
        onFloorPlanReset={clearFloorPlan}
        alternateView={{
          href: `/topology/${floorId}`,
          label: "Topology view",
          icon: "network",
        }}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      <main
        className={`flex-1 h-full min-h-0 transition-all duration-300 ${
          isLg ? (sidebarCollapsed ? "lg:ml-16" : "lg:ml-80") : "ml-0"
        }`}
      >
        <MapCanvas
          zones={zones}
          devices={filteredDevices}
          layers={layers}
          selectedDeviceId={selectedDeviceId}
          onDeviceClick={handleDeviceClick}
          floorPlanImageHref={floorPlanDataUrl ?? DEFAULT_FLOOR_PLAN_HREF}
          placeMode={!!activeLayerId}
          onPlaceAt={handlePlaceAt}
          repositionMode={repositionMode}
          repositionDeviceName={
            repositionMode && selectedDevice ? selectedDevice.name : null
          }
          onExitReposition={handleExitRepositionMode}
          onRepositionNudge={handleRepositionNudge}
          resolveDeviceTypeColor={resolveDeviceTypeColor}
        />
      </main>

      <LayerForm
        open={layerFormOpen && !mergeFormOpen}
        mode={layerFormLayer ? "edit" : "create"}
        initial={layerFormLayer}
        onSave={handleLayerSave}
        onDelete={
          layerFormLayer
            ? () => {
                deleteLayer(layerFormLayer.id);
                setLayerFormOpen(false);
                setLayerFormLayer(null);
              }
            : undefined
        }
        onClose={() => {
          setLayerFormOpen(false);
          setLayerFormLayer(null);
        }}
      />

      <LayerForm
        key={mergeSelectedIds.slice().sort().join("|")}
        open={mergeFormOpen}
        mode="merge"
        initial={mergeLayerInitial}
        submitDisabled={mergeSelectedIds.length < 2}
        topSlot={
          <div className="space-y-2 pb-4 border-b border-border">
            <p className="text-xs text-text-muted leading-relaxed">
              Select at least two layers to combine. All devices on those layers move to the new layer below; nothing is deleted except the old layer entries.
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {layers.map((layer) => (
                <label
                  key={layer.id}
                  className="flex items-center gap-2 text-sm cursor-pointer rounded-md px-1 py-0.5 hover:bg-bg-hover/80"
                >
                  <input
                    type="checkbox"
                    checked={mergeSelectedIds.includes(layer.id)}
                    onChange={(e) => {
                      setMergeSelectedIds((prev) =>
                        e.target.checked
                          ? [...prev, layer.id]
                          : prev.filter((id) => id !== layer.id)
                      );
                    }}
                    className="rounded border-border shrink-0"
                  />
                  <span className="flex-1 min-w-0 truncate text-text-primary">
                    {layer.name}
                  </span>
                  <span className="text-[10px] text-text-muted tabular-nums shrink-0">
                    {deviceCountByLayer[layer.id] ?? 0}
                  </span>
                </label>
              ))}
            </div>
          </div>
        }
        onSave={handleMergeLayerSave}
        onClose={() => {
          setMergeFormOpen(false);
          setMergeSelectedIds([]);
        }}
      />

      {deviceFormDevice && (
        <DeviceForm
          open={!!deviceFormId}
          device={deviceFormDevice}
          mode={deviceFormMode}
          lockDeviceTypeToRack={
            layerById(deviceFormDevice.layerId)?.kind === "rack" &&
            !deviceFormDevice.parentId
          }
          allDevices={allDevicesFlat}
          excludeDeviceId={deviceFormDevice.id}
          onSave={(patch) => {
            updateDevice(deviceFormDevice.id, patch);
            setDeviceFormId(null);
            setSelectedDeviceId(deviceFormDevice.id);
          }}
          onDelete={() => {
            deleteDevice(deviceFormDevice.id);
            setDeviceFormId(null);
            setSelectedDeviceId(null);
          }}
          onClose={handleDeviceFormClose}
        />
      )}

      {selectedDevice && !deviceFormId && (() => {
        const selLayer = layerById(selectedDevice.layerId);
        const isRackEnclosureRoot =
          selLayer?.kind === "rack" && !selectedDevice.parentId;
        const parentDevice = selectedDevice.parentId
          ? deviceById(selectedDevice.parentId)
          : null;
        return (
          <DeviceDetailPanel
            device={selectedDevice}
            layerName={selLayer?.name ?? "Unknown layer"}
            layerKind={selLayer?.kind ?? "standard"}
            rackColor={selLayer?.color ?? "#64748b"}
            resolveDeviceTypeColor={resolveDeviceTypeColor}
            children={childrenOf(selectedDevice.id)}
            connectedDevices={connectedTo(selectedDevice.id)}
            getDeviceById={deviceById}
            onClose={handleClosePanel}
            onBackToParent={
              parentDevice ? () => setSelectedDeviceId(parentDevice.id) : undefined
            }
            parentDeviceName={parentDevice?.name}
            onSelectDevice={handleDeviceClick}
            onEdit={() => {
              setRepositionMode(false);
              setDeviceFormMode("edit");
              setDeviceFormId(selectedDevice.id);
              setSelectedDeviceId(null);
            }}
            canRepositionOnMap={!selectedDevice.parentId}
            repositionMode={repositionMode}
            onEnterRepositionMode={handleEnterRepositionMode}
            onExitRepositionMode={handleExitRepositionMode}
            onDelete={() => {
              deleteDevice(selectedDevice.id);
              setSelectedDeviceId(null);
            }}
            onAddRackUnit={
              isRackEnclosureRoot ? () => handleAddRackUnit(selectedDevice) : undefined
            }
            onMoveRackUnit={
              isRackEnclosureRoot
                ? (childId, direction) =>
                    handleMoveRackUnit(selectedDevice.id, childId, direction)
                : undefined
            }
          />
        );
      })()}

      <LandscapeHint />
    </div>
  );
}
