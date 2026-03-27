"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Sidebar } from "@/components/ui/Sidebar";
import { MapCanvas } from "@/components/map/MapCanvas";
import { DeviceDetailPanel } from "@/components/devices/DeviceDetailPanel";
import { DeviceForm } from "@/components/devices/DeviceForm";
import { LayerForm } from "@/components/layers/LayerForm";
import { useAppState } from "@/hooks/useAppState";
import type { Layer } from "@/types/layer";
import type { Device } from "@/types/device";
import type { Zone } from "@/types/zone";
import { FLOOR_PLAN_HEIGHT, FLOOR_PLAN_WIDTH } from "@/constants/floorPlan";

const zones: Zone[] = [];

const REPOSITION_STEP = 4;
const REPOSITION_SHIFT_MULT = 5;

export default function Home() {
  const {
    layers,
    devices,
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
    toggleLayerVisibility,
    showAllLayers,
    hideAllLayers,
    addDevice,
    updateDevice,
    deleteDevice,
    exportJson,
    importJson,
  } = useAppState();

  const [search, setSearch] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [deviceFormId, setDeviceFormId] = useState<string | null>(null);
  const [deviceFormMode, setDeviceFormMode] = useState<"create" | "edit">("create");
  const [layerFormOpen, setLayerFormOpen] = useState(false);
  const [layerFormLayer, setLayerFormLayer] = useState<Layer | null>(null);
  const [repositionMode, setRepositionMode] = useState(false);

  const filteredDevices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visibleDevices;
    return visibleDevices.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
    );
  }, [visibleDevices, search]);

  const handleDeviceClick = useCallback((device: Device) => {
    setDeviceFormId(null);
    setRepositionMode(false);
    setSelectedDeviceId(device.id);
  }, []);

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
        ? REPOSITION_STEP * REPOSITION_SHIFT_MULT
        : REPOSITION_STEP;
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

  const handlePlaceAt = useCallback(
    (position: { x: number; y: number }) => {
      if (!activeLayerId) return;
      setRepositionMode(false);
      const layer = layerById(activeLayerId);
      const id = addDevice({
        name: layer?.kind === "server" ? "New rack" : "New device",
        layerId: activeLayerId,
        position,
        status: "online",
        description: "",
        properties: [],
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
        properties: [],
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

  const selectedDevice = selectedDeviceId ? deviceById(selectedDeviceId) : null;

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

  if (!hydrated) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary text-text-muted text-sm">
        Loading map…
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <Sidebar
        search={search}
        onSearchChange={setSearch}
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
        onExport={exportJson}
        onImport={importJson}
      />

      <main className="flex-1 ml-0 md:ml-80 h-full transition-all duration-300">
        <MapCanvas
          zones={zones}
          devices={filteredDevices}
          layers={layers}
          selectedDeviceId={selectedDeviceId}
          onDeviceClick={handleDeviceClick}
          placeMode={!!activeLayerId}
          onPlaceAt={handlePlaceAt}
          repositionMode={repositionMode}
          repositionDeviceName={
            repositionMode && selectedDevice ? selectedDevice.name : null
          }
          onExitReposition={handleExitRepositionMode}
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

      {deviceFormDevice && (
        <DeviceForm
          open={!!deviceFormId}
          device={deviceFormDevice}
          mode={deviceFormMode}
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
        const isServerRackRoot = selLayer?.kind === "server" && !selectedDevice.parentId;
        return (
          <DeviceDetailPanel
            device={selectedDevice}
            layerName={selLayer?.name ?? "Unknown layer"}
            layerKind={selLayer?.kind ?? "standard"}
            rackColor={selLayer?.color ?? "#64748b"}
            children={childrenOf(selectedDevice.id)}
            connectedDevices={connectedTo(selectedDevice.id)}
            onClose={handleClosePanel}
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
              isServerRackRoot ? () => handleAddRackUnit(selectedDevice) : undefined
            }
            onMoveRackUnit={
              isServerRackRoot
                ? (childId, direction) =>
                    handleMoveRackUnit(selectedDevice.id, childId, direction)
                : undefined
            }
          />
        );
      })()}
    </div>
  );
}
