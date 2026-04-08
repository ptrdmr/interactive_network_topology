"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/ui/Sidebar";
import { LandscapeHint } from "@/components/ui/LandscapeHint";
import { LayerForm } from "@/components/layers/LayerForm";
import { TopologyCanvas } from "./TopologyCanvas";
import type { FocusHopMode } from "./TopologyControls";
import { DeviceDetailPanel } from "@/components/devices/DeviceDetailPanel";
import { useAppState } from "@/hooks/useAppState";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Device } from "@/types/device";
import type { Layer } from "@/types/layer";

interface TopologyWorkspaceProps {
  floorId: string;
}

export function TopologyWorkspace({ floorId }: TopologyWorkspaceProps) {
  const router = useRouter();

  const {
    layers,
    devices,
    floorPlans,
    activeFloorPlanId,
    setActiveFloorPlanId,
    hydrated,
    layerById,
    deviceById,
    childrenOf,
    connectedTo,
    toggleLayerVisibility,
    showAllLayers,
    hideAllLayers,
    exportCsv,
    importJson,
    floorPlanDataUrl,
    uploadFloorPlanFromFile,
    clearFloorPlan,
    cloudSyncEnabled,
    resolveDeviceTypeColor,
    deleteDevice,
    addDevice,
    addLayer,
    updateLayer,
    deleteLayer,
    setActiveLayerId,
    activeLayerId,
    deviceCountByLayer,
    stats,
    updateDevice,
  } = useAppState();

  const activeFloorName = useMemo(
    () =>
      floorPlans.find((fp) => fp.id === activeFloorPlanId)?.name ?? "Floor",
    [floorPlans, activeFloorPlanId]
  );

  const [search, setSearch] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [focusDeviceId, setFocusDeviceId] = useState<string | null>(null);
  const [focusHopMode, setFocusHopMode] = useState<FocusHopMode>(3);
  const [layerFormOpen, setLayerFormOpen] = useState(false);
  const [layerFormLayer, setLayerFormLayer] = useState<Layer | null>(null);

  const isLg = useMediaQuery("(min-width: 1024px)");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  useLayoutEffect(() => {
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

  useEffect(() => {
    setFocusDeviceId(null);
  }, [floorId]);

  const floorSynced =
    hydrated &&
    floorPlans.some((fp) => fp.id === floorId) &&
    activeFloorPlanId === floorId;

  const deviceOptions = useMemo(
    () =>
      [...devices]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((d) => ({ id: d.id, name: d.name })),
    [devices]
  );

  const selectedDevice = selectedDeviceId
    ? deviceById(selectedDeviceId) ?? null
    : null;

  const handleSelectDevice = useCallback(
    (device: Device) => {
      const fp = floorPlans.find((f) => f.devices.some((d) => d.id === device.id));
      if (fp && fp.id !== floorId) {
        router.push(`/topology/${fp.id}`);
        return;
      }
      setSelectedDeviceId(device.id);
    },
    [floorPlans, floorId, router]
  );

  const handleClosePanel = useCallback(() => {
    setSelectedDeviceId(null);
  }, []);

  const resolveLayerMeta = useCallback(
    (id: string) => {
      const l = layerById(id);
      return { name: l?.name ?? "Unknown layer", color: l?.color ?? "#64748b" };
    },
    [layerById]
  );

  const openLayerCreate = useCallback(() => {
    setLayerFormLayer(null);
    setLayerFormOpen(true);
  }, []);

  const openLayerEdit = useCallback(
    (layerId: string) => {
      const l = layerById(layerId);
      if (l) {
        setLayerFormLayer(l);
        setLayerFormOpen(true);
      }
    },
    [layerById]
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

  const handleAddRackUnit = useCallback(
    (parent: Device) => {
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
      setSelectedDeviceId(id);
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

  if (!hydrated) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary text-text-muted text-sm">
        Loading topology…
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
        Loading topology…
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <Sidebar
        activeFloorName={activeFloorName}
        search={search}
        onSearchChange={setSearch}
        searchHint={
          search.trim()
            ? "Showing only matching devices as nodes in the graph."
            : "Filters which devices appear in the topology view (name, description, IP, properties, ports…)."
        }
        layers={layers}
        activeLayerId={activeLayerId}
        onClearActiveLayer={() => setActiveLayerId(null)}
        onActivateLayer={setActiveLayerId}
        onToggleLayer={toggleLayerVisibility}
        onShowAll={showAllLayers}
        onHideAll={hideAllLayers}
        onNewLayer={openLayerCreate}
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
          href: `/map/${floorId}`,
          label: "Floor plan map",
          icon: "map",
        }}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      <main
        className={`flex-1 h-full min-h-0 transition-all duration-300 relative ${
          isLg ? (sidebarCollapsed ? "lg:ml-16" : "lg:ml-80") : "ml-0"
        }`}
      >
        <TopologyCanvas
          floorDevices={devices}
          layers={layers}
          resolveDeviceTypeColor={resolveDeviceTypeColor}
          selectedDeviceId={selectedDeviceId}
          onSelectDeviceId={setSelectedDeviceId}
          onToggleLayer={toggleLayerVisibility}
          onShowAllLayers={showAllLayers}
          onHideAllLayers={hideAllLayers}
          searchQuery={search}
          focusDeviceId={focusDeviceId}
          onFocusDeviceId={setFocusDeviceId}
          focusHopMode={focusHopMode}
          onFocusHopMode={setFocusHopMode}
          deviceOptions={deviceOptions}
        />
      </main>

      <LayerForm
        open={layerFormOpen}
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

      {selectedDevice && (() => {
        const selLayer = layerById(selectedDevice.layerId);
        const isServerRackRoot =
          selectedDevice.deviceTypeId === "rack" && !selectedDevice.parentId;
        const parentDevice = selectedDevice.parentId
          ? deviceById(selectedDevice.parentId)
          : null;
        return (
          <DeviceDetailPanel
            device={selectedDevice}
            layerName={selLayer?.name ?? "Unknown layer"}
            rackColor={selLayer?.color ?? "#64748b"}
            resolveLayerMeta={resolveLayerMeta}
            resolveDeviceTypeColor={resolveDeviceTypeColor}
            // eslint-disable-next-line react/no-children-prop -- matches DeviceDetailPanel rack-units prop name
            children={childrenOf(selectedDevice.id)}
            connectedDevices={connectedTo(selectedDevice.id)}
            getDeviceById={deviceById}
            onClose={handleClosePanel}
            onBackToParent={
              parentDevice
                ? () => setSelectedDeviceId(parentDevice.id)
                : undefined
            }
            parentDeviceName={parentDevice?.name}
            onSelectDevice={handleSelectDevice}
            onEdit={() => {
              router.push(
                `/map/${floorId}?select=${encodeURIComponent(selectedDevice.id)}`
              );
            }}
            onDelete={() => {
              deleteDevice(selectedDevice.id);
              setSelectedDeviceId(null);
            }}
            onAddRackUnit={
              isServerRackRoot
                ? () => handleAddRackUnit(selectedDevice)
                : undefined
            }
            onMoveRackUnit={
              isServerRackRoot
                ? (childId, direction) =>
                    handleMoveRackUnit(selectedDevice.id, childId, direction)
                : undefined
            }
            canRepositionOnMap={false}
            onFocusInTopology={() => {
              setFocusDeviceId(selectedDevice.id);
            }}
          />
        );
      })()}

      <LandscapeHint />
    </div>
  );
}
