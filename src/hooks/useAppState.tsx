"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { Layer } from "@/types/layer";
import type { Device } from "@/types/device";
import type { FloorPlanDocument } from "@/types/floorPlan";
import {
  DEFAULT_DEVICE_TYPE_COLORS,
  type DeviceTypeId,
} from "@/constants/deviceTypes";
import { normalizeFloorPlanImage } from "@/lib/floorPlanImage";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { buildDeviceInventoryCsv } from "@/lib/exportCsv";
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

function saveToStorage(state: PersistedMapState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function useAppStateImpl() {
  const [floorPlans, setFloorPlans] = useState<FloorPlanDocument[]>([]);
  const [activeFloorPlanId, setActiveFloorPlanId] = useState<string | null>(null);
  const [deviceTypeColorOverrides, setDeviceTypeColorOverrides] = useState<
    Record<string, string>
  >({});
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * JSON snapshot of state right after initial load (local + optional Supabase).
   * Used to skip debounced cloud saves until the user (or import) actually changes
   * something — otherwise a failed Supabase read + empty localStorage could upload
   * empty state and wipe the shared cloud row.
   */
  const initialPersistedSnapshotRef = useRef<string | null>(null);

  const cloudSyncEnabled = isSupabaseConfigured();

  const activeFloor = useMemo(() => {
    if (floorPlans.length === 0) return null;
    const found = activeFloorPlanId
      ? floorPlans.find((fp) => fp.id === activeFloorPlanId)
      : undefined;
    return found ?? floorPlans[0];
  }, [floorPlans, activeFloorPlanId]);

  const layers = activeFloor?.layers ?? [];
  const devices = activeFloor?.devices ?? [];
  const floorPlanDataUrl = activeFloor?.floorPlanDataUrl ?? null;

  const allDevicesFlat = useMemo(
    () => floorPlans.flatMap((fp) => fp.devices),
    [floorPlans]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const local = loadFromStorage();
      let initial: PersistedMapState = local;

      if (cloudSyncEnabled) {
        const remote = await fetchMapStateFromSupabase();
        if (!cancelled && remote) {
          initial = remote;
          saveToStorage(initial);
        }
      }

      if (cancelled) return;
      initialPersistedSnapshotRef.current = JSON.stringify({
        floorPlans: initial.floorPlans,
        activeFloorPlanId: initial.activeFloorPlanId,
        deviceTypeColorOverrides: initial.deviceTypeColorOverrides ?? {},
      });
      setFloorPlans(initial.floorPlans);
      setActiveFloorPlanId(initial.activeFloorPlanId);
      setDeviceTypeColorOverrides(initial.deviceTypeColorOverrides ?? {});
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [cloudSyncEnabled]);

  useEffect(() => {
    if (
      activeFloorPlanId &&
      !floorPlans.some((fp) => fp.id === activeFloorPlanId)
    ) {
      setActiveFloorPlanId(floorPlans[0]?.id ?? null);
      setActiveLayerId(null);
    }
  }, [floorPlans, activeFloorPlanId]);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage({
      floorPlans,
      activeFloorPlanId,
      deviceTypeColorOverrides,
    });
  }, [floorPlans, activeFloorPlanId, deviceTypeColorOverrides, hydrated]);

  useEffect(() => {
    if (!hydrated || !cloudSyncEnabled) return;

    const payload: PersistedMapState = {
      floorPlans,
      activeFloorPlanId,
      deviceTypeColorOverrides,
    };
    if (
      initialPersistedSnapshotRef.current !== null &&
      JSON.stringify(payload) === initialPersistedSnapshotRef.current
    ) {
      return;
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void saveMapStateToSupabase(payload);
    }, SUPABASE_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [floorPlans, activeFloorPlanId, deviceTypeColorOverrides, hydrated, cloudSyncEnabled]);

  const resolveDeviceTypeColor = useCallback(
    (typeId: DeviceTypeId) =>
      deviceTypeColorOverrides[typeId] ??
      DEFAULT_DEVICE_TYPE_COLORS[typeId] ??
      DEFAULT_DEVICE_TYPE_COLORS.other,
    [deviceTypeColorOverrides]
  );

  const setDeviceTypeColorOverride = useCallback(
    (typeId: DeviceTypeId, hex: string | null) => {
      setDeviceTypeColorOverrides((prev) => {
        const next = { ...prev };
        if (hex == null || hex === DEFAULT_DEVICE_TYPE_COLORS[typeId]) {
          delete next[typeId];
        } else {
          next[typeId] = hex;
        }
        return next;
      });
    },
    []
  );

  const resetDeviceTypeColorOverrides = useCallback(() => {
    setDeviceTypeColorOverrides({});
  }, []);

  const layerById = useCallback(
    (id: string) => layers.find((x) => x.id === id),
    [layers]
  );

  const deviceById = useCallback(
    (id: string) => allDevicesFlat.find((x) => x.id === id),
    [allDevicesFlat]
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

  const patchActiveFloor = useCallback(
    (
      updater: (fp: FloorPlanDocument) => FloorPlanDocument
    ) => {
      const id = activeFloor?.id;
      if (!id) return;
      setFloorPlans((prev) =>
        prev.map((fp) => (fp.id === id ? updater(fp) : fp))
      );
    },
    [activeFloor?.id]
  );

  const addLayer = useCallback(
    (layer: Omit<Layer, "id">) => {
      const layerId = newId("layer");
      patchActiveFloor((fp) => ({
        ...fp,
        layers: [...fp.layers, { ...layer, id: layerId }],
      }));
      return layerId;
    },
    [patchActiveFloor]
  );

  const updateLayer = useCallback(
    (id: string, patch: Partial<Layer>) => {
      patchActiveFloor((fp) => ({
        ...fp,
        layers: fp.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      }));
    },
    [patchActiveFloor]
  );

  const deleteLayer = useCallback(
    (id: string) => {
      patchActiveFloor((fp) => ({
        ...fp,
        layers: fp.layers.filter((l) => l.id !== id),
        devices: fp.devices.filter((d) => d.layerId !== id),
      }));
      setActiveLayerId((cur) => (cur === id ? null : cur));
    },
    [patchActiveFloor]
  );

  /**
   * Combine multiple layers into one new layer: reassigns all devices on source layers,
   * removes source layer rows (devices are kept). Requires at least two distinct layer ids.
   */
  const mergeLayers = useCallback(
    (sourceLayerIds: string[], newLayer: Omit<Layer, "id">) => {
      const uniq = [...new Set(sourceLayerIds)].filter(Boolean);
      if (uniq.length < 2) return null;
      const newLayerId = newId("layer");
      let applied = false;
      patchActiveFloor((fp) => {
        const sourceSet = new Set(uniq);
        if (!uniq.every((id) => fp.layers.some((l) => l.id === id))) {
          return fp;
        }
        applied = true;
        return {
          ...fp,
          layers: [
            ...fp.layers.filter((l) => !sourceSet.has(l.id)),
            { ...newLayer, id: newLayerId },
          ],
          devices: fp.devices.map((d) =>
            sourceSet.has(d.layerId) ? { ...d, layerId: newLayerId } : d
          ),
        };
      });
      if (!applied) return null;
      setActiveLayerId(newLayerId);
      return newLayerId;
    },
    [patchActiveFloor]
  );

  const toggleLayerVisibility = useCallback(
    (id: string) => {
      patchActiveFloor((fp) => ({
        ...fp,
        layers: fp.layers.map((l) =>
          l.id === id ? { ...l, visible: !l.visible } : l
        ),
      }));
    },
    [patchActiveFloor]
  );

  const showAllLayers = useCallback(() => {
    patchActiveFloor((fp) => ({
      ...fp,
      layers: fp.layers.map((l) => ({ ...l, visible: true })),
    }));
  }, [patchActiveFloor]);

  const hideAllLayers = useCallback(() => {
    patchActiveFloor((fp) => ({
      ...fp,
      layers: fp.layers.map((l) => ({ ...l, visible: false })),
    }));
  }, [patchActiveFloor]);

  const addDevice = useCallback(
    (device: Omit<Device, "id">) => {
      const devId = newId("device");
      patchActiveFloor((fp) => ({
        ...fp,
        devices: [...fp.devices, { ...device, id: devId }],
      }));
      return devId;
    },
    [patchActiveFloor]
  );

  const updateDevice = useCallback((id: string, patch: Partial<Device>) => {
    setFloorPlans((prev) =>
      prev.map((fp) => {
        if (!fp.devices.some((d) => d.id === id)) return fp;
        return {
          ...fp,
          devices: fp.devices.map((d) =>
            d.id === id ? { ...d, ...patch } : d
          ),
        };
      })
    );
  }, []);

  const deleteDevice = useCallback((id: string) => {
    setFloorPlans((prev) =>
      prev.map((fp) => ({
        ...fp,
        devices: fp.devices.filter((d) => d.id !== id && d.parentId !== id),
      }))
    );
  }, []);

  /** Spreadsheet-friendly device inventory (all floors). Not a full backup. */
  const exportCsv = useCallback(() => {
    const text = buildDeviceInventoryCsv(floorPlans);
    const blob = new Blob(["\ufeff", text], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `concourse-devices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [floorPlans]);

  const importJson = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string) as unknown;
          const state = parsePersistedMapState(parsed);
          if (!state) {
            reject(new Error("Invalid file: expected floor plans and devices"));
            return;
          }
          setFloorPlans(state.floorPlans);
          setActiveFloorPlanId(state.activeFloorPlanId);
          setDeviceTypeColorOverrides(state.deviceTypeColorOverrides ?? {});
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
    const empty = emptyPersistedMapState();
    setFloorPlans(empty.floorPlans);
    setActiveFloorPlanId(empty.activeFloorPlanId);
    setDeviceTypeColorOverrides(empty.deviceTypeColorOverrides);
    setActiveLayerId(null);
  }, []);

  const clearFloorPlan = useCallback(() => {
    patchActiveFloor((fp) => ({ ...fp, floorPlanDataUrl: null }));
  }, [patchActiveFloor]);

  const uploadFloorPlanFromFile = useCallback(
    async (file: File) => {
      const dataUrl = await normalizeFloorPlanImage(file);
      patchActiveFloor((fp) => ({ ...fp, floorPlanDataUrl: dataUrl }));
    },
    [patchActiveFloor]
  );

  const addFloorPlan = useCallback((name?: string) => {
    const id = newId("floor");
    setFloorPlans((prev) => [
      ...prev,
      {
        id,
        name: name?.trim() || `Floor ${prev.length + 1}`,
        floorPlanDataUrl: null,
        layers: [],
        devices: [],
      },
    ]);
    setActiveFloorPlanId(id);
    setActiveLayerId(null);
    return id;
  }, []);

  const renameFloorPlan = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setFloorPlans((prev) =>
      prev.map((fp) => (fp.id === id ? { ...fp, name: trimmed } : fp))
    );
  }, []);

  const deleteFloorPlan = useCallback((id: string) => {
    setFloorPlans((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((fp) => fp.id !== id);
    });
  }, []);

  return {
    layers,
    devices,
    allDevicesFlat,
    floorPlanDataUrl,
    floorPlans,
    activeFloorPlanId,
    setActiveFloorPlanId,
    clearFloorPlan,
    uploadFloorPlanFromFile,
    addFloorPlan,
    renameFloorPlan,
    deleteFloorPlan,
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
    mergeLayers,
    toggleLayerVisibility,
    showAllLayers,
    hideAllLayers,
    addDevice,
    updateDevice,
    deleteDevice,
    exportCsv,
    importJson,
    resetAll,
    deviceTypeColorOverrides,
    resolveDeviceTypeColor,
    setDeviceTypeColorOverride,
    resetDeviceTypeColorOverrides,
  };
}

const AppStateContext = createContext<ReturnType<typeof useAppStateImpl> | null>(
  null
);

/** Mount once in the root layout so map, home, and settings share one store (avoids losing data on client navigation). */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const value = useAppStateImpl();
  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return ctx;
}
