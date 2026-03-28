"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { Layer } from "@/types/layer";
import type { Device } from "@/types/device";
import { normalizeFloorPlanImage } from "@/lib/floorPlanImage";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  emptyPersistedMapState,
  parsePersistedMapState,
  fetchMapStateFromSupabase,
  saveMapStateToSupabase,
  type PersistedMapState,
} from "@/lib/supabase/mapState";

const STORAGE_KEY = "concourse-map-data";
const SUPABASE_SAVE_DEBOUNCE_MS = 800;

function loadFromStorage(): PersistedMapState {
  if (typeof window === "undefined") {
    return emptyPersistedMapState();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyPersistedMapState();
    const parsed = JSON.parse(raw) as unknown;
    return parsePersistedMapState(parsed) ?? emptyPersistedMapState();
  } catch {
    return emptyPersistedMapState();
  }
}

function saveToStorage(
  layers: Layer[],
  devices: Device[],
  floorPlanDataUrl: string | null
) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ layers, devices, floorPlanDataUrl })
    );
  } catch {
    // ignore quota / private mode
  }
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useAppState() {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [floorPlanDataUrl, setFloorPlanDataUrl] = useState<string | null>(null);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cloudSyncEnabled = isSupabaseConfigured();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const local = loadFromStorage();
      let initial: PersistedMapState = local;

      if (cloudSyncEnabled) {
        const remote = await fetchMapStateFromSupabase();
        if (!cancelled && remote) {
          initial = remote;
          saveToStorage(
            remote.layers,
            remote.devices,
            remote.floorPlanDataUrl ?? null
          );
        }
      }

      if (cancelled) return;
      setLayers(initial.layers);
      setDevices(initial.devices);
      setFloorPlanDataUrl(initial.floorPlanDataUrl ?? null);
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [cloudSyncEnabled]);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(layers, devices, floorPlanDataUrl);
  }, [layers, devices, floorPlanDataUrl, hydrated]);

  useEffect(() => {
    if (!hydrated || !cloudSyncEnabled) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void saveMapStateToSupabase({
        layers,
        devices,
        floorPlanDataUrl: floorPlanDataUrl ?? null,
      });
    }, SUPABASE_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [layers, devices, floorPlanDataUrl, hydrated, cloudSyncEnabled]);

  const layerById = useCallback(
    (id: string) => layers.find((x) => x.id === id),
    [layers]
  );

  const deviceById = useCallback(
    (id: string) => devices.find((x) => x.id === id),
    [devices]
  );

  const childrenOf = useCallback(
    (parentId: string) =>
      devices
        .filter((d) => d.parentId === parentId)
        .sort((a, b) => {
          const ao = a.rackOrder ?? 0;
          const bo = b.rackOrder ?? 0;
          if (ao !== bo) return ao - bo;
          return a.name.localeCompare(b.name);
        }),
    [devices]
  );

  const connectedTo = useCallback(
    (deviceId: string) =>
      devices.filter(
        (d) =>
          d.id !== deviceId &&
          d.properties.some((p) => p.value.trim() === deviceId)
      ),
    [devices]
  );

  const visibleDevices = useMemo(() => {
    const visibleLayerIds = new Set(
      layers.filter((l) => l.visible).map((l) => l.id)
    );
    return devices.filter(
      (d) => visibleLayerIds.has(d.layerId) && !d.parentId
    );
  }, [devices, layers]);

  const deviceCountByLayer = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of layers) {
      counts[l.id] = devices.filter(
        (d) => d.layerId === l.id && !d.parentId
      ).length;
    }
    return counts;
  }, [devices, layers]);

  const stats = useMemo(() => {
    return {
      total: devices.length,
      online: devices.filter((d) => d.status === "online").length,
      offline: devices.filter((d) => d.status === "offline").length,
      maintenance: devices.filter((d) => d.status === "maintenance").length,
    };
  }, [devices]);

  const addLayer = useCallback((layer: Omit<Layer, "id">) => {
    const id = newId("layer");
    setLayers((prev) => [...prev, { ...layer, id }]);
    return id;
  }, []);

  const updateLayer = useCallback((id: string, patch: Partial<Layer>) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  }, []);

  const deleteLayer = useCallback((id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    setDevices((prev) => prev.filter((d) => d.layerId !== id));
    setActiveLayerId((cur) => (cur === id ? null : cur));
  }, []);

  const toggleLayerVisibility = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  }, []);

  const showAllLayers = useCallback(() => {
    setLayers((prev) => prev.map((l) => ({ ...l, visible: true })));
  }, []);

  const hideAllLayers = useCallback(() => {
    setLayers((prev) => prev.map((l) => ({ ...l, visible: false })));
  }, []);

  const addDevice = useCallback(
    (device: Omit<Device, "id">) => {
      const id = newId("device");
      setDevices((prev) => [...prev, { ...device, id }]);
      return id;
    },
    []
  );

  const updateDevice = useCallback((id: string, patch: Partial<Device>) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch } : d))
    );
  }, []);

  const deleteDevice = useCallback((id: string) => {
    setDevices((prev) =>
      prev.filter((d) => d.id !== id && d.parentId !== id)
    );
  }, []);

  const exportJson = useCallback(() => {
    const data: PersistedMapState = {
      layers,
      devices,
      floorPlanDataUrl: floorPlanDataUrl ?? null,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `concourse-map-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [layers, devices, floorPlanDataUrl]);

  const importJson = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string) as unknown;
          const state = parsePersistedMapState(parsed);
          if (!state) {
            reject(new Error("Invalid file: expected layers and devices"));
            return;
          }
          setLayers(state.layers);
          setDevices(state.devices);
          setFloorPlanDataUrl(state.floorPlanDataUrl ?? null);
          setActiveLayerId(null);
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }, []);

  const resetAll = useCallback(() => {
    setLayers([]);
    setDevices([]);
    setFloorPlanDataUrl(null);
    setActiveLayerId(null);
  }, []);

  const clearFloorPlan = useCallback(() => {
    setFloorPlanDataUrl(null);
  }, []);

  const uploadFloorPlanFromFile = useCallback(async (file: File) => {
    const dataUrl = await normalizeFloorPlanImage(file);
    setFloorPlanDataUrl(dataUrl);
  }, []);

  return {
    layers,
    devices,
    floorPlanDataUrl,
    setFloorPlanDataUrl,
    clearFloorPlan,
    uploadFloorPlanFromFile,
    activeLayerId,
    setActiveLayerId,
    hydrated,
    cloudSyncEnabled,
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
    resetAll,
  };
}
