import type { Layer } from "@/types/layer";
import type { Device, PortSlot } from "@/types/device";
import type { FloorPlanDocument } from "@/types/floorPlan";
import { normalizeDeviceTypeId } from "@/constants/deviceTypes";
import { getSupabaseBrowserClient } from "./client";

export interface PersistedMapState {
  floorPlans: FloorPlanDocument[];
  activeFloorPlanId: string | null;
  /** User overrides for device type fill colors (hex). Keys are deviceTypeId. */
  deviceTypeColorOverrides: Record<string, string>;
}

function newFloorPlanId(): string {
  return `floor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyPersistedMapState(): PersistedMapState {
  const id = newFloorPlanId();
  return {
    floorPlans: [
      {
        id,
        name: "Main floor",
        floorPlanDataUrl: null,
        layers: [],
        devices: [],
      },
    ],
    activeFloorPlanId: id,
    deviceTypeColorOverrides: {},
  };
}

function normalizeLayer(raw: Layer): Layer {
  return {
    ...raw,
    kind: raw.kind === "server" ? "server" : "standard",
  };
}

function normalizePortSlot(raw: unknown): PortSlot {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const slot: PortSlot = {};
  if (typeof o.label === "string") slot.label = o.label;
  if (typeof o.notes === "string") slot.notes = o.notes;
  if (typeof o.connectedDeviceId === "string") slot.connectedDeviceId = o.connectedDeviceId;
  if (typeof o.remotePort === "string") slot.remotePort = o.remotePort;
  return slot;
}

function normalizeDevice(raw: Device): Device {
  const portSlots = Array.isArray((raw as { portSlots?: unknown }).portSlots)
    ? (raw as { portSlots: unknown[] }).portSlots.map(normalizePortSlot)
    : [];
  const deviceTypeId = normalizeDeviceTypeId(
    (raw as { deviceTypeId?: unknown }).deviceTypeId
  );
  return {
    ...raw,
    deviceTypeId,
    portSlots,
  };
}

function normalizeDeviceTypeColorOverrides(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string" && /^#[0-9a-fA-F]{3,8}$/.test(v.trim())) {
      out[k] = v.trim();
    }
  }
  return out;
}

function normalizeFloorPlanDocument(raw: unknown): FloorPlanDocument | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.name !== "string") return null;
  const layers = Array.isArray(o.layers)
    ? (o.layers as Layer[]).map((l) => normalizeLayer(l))
    : [];
  const devices = Array.isArray(o.devices)
    ? (o.devices as Device[]).map((d) => normalizeDevice(d))
    : [];
  return {
    id: o.id,
    name: o.name,
    floorPlanDataUrl:
      typeof o.floorPlanDataUrl === "string" ? o.floorPlanDataUrl : null,
    layers,
    devices,
  };
}

/** Legacy v1 shape: flat layers, devices, optional floorPlanDataUrl (no real floorPlans). */
function isLegacyV1Shape(o: Record<string, unknown>): boolean {
  return (
    Array.isArray(o.layers) &&
    Array.isArray(o.devices) &&
    (!Array.isArray(o.floorPlans) || o.floorPlans.length === 0)
  );
}

function migrateLegacyV1(o: Record<string, unknown>): PersistedMapState {
  const id = newFloorPlanId();
  return {
    floorPlans: [
      {
        id,
        name: "Main floor",
        floorPlanDataUrl:
          typeof o.floorPlanDataUrl === "string" ? o.floorPlanDataUrl : null,
        layers: (o.layers as Layer[]).map((l) => normalizeLayer(l)),
        devices: (o.devices as Device[]).map((d) => normalizeDevice(d)),
      },
    ],
    activeFloorPlanId: id,
    deviceTypeColorOverrides: normalizeDeviceTypeColorOverrides(
      o.deviceTypeColorOverrides
    ),
  };
}

function ensureAtLeastOneFloor(state: PersistedMapState): PersistedMapState {
  const overrides =
    state.deviceTypeColorOverrides &&
    typeof state.deviceTypeColorOverrides === "object"
      ? normalizeDeviceTypeColorOverrides(state.deviceTypeColorOverrides)
      : {};
  const base: PersistedMapState = { ...state, deviceTypeColorOverrides: overrides };
  if (state.floorPlans.length > 0) return base;
  const id = newFloorPlanId();
  return {
    ...base,
    floorPlans: [
      {
        id,
        name: "Main floor",
        floorPlanDataUrl: null,
        layers: [],
        devices: [],
      },
    ],
    activeFloorPlanId: id,
  };
}

export function parsePersistedMapState(raw: unknown): PersistedMapState | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  if (isLegacyV1Shape(o)) {
    return ensureAtLeastOneFloor(migrateLegacyV1(o));
  }

  if (Array.isArray(o.floorPlans) && o.floorPlans.length > 0) {
    const floorPlans = o.floorPlans
      .map(normalizeFloorPlanDocument)
      .filter((fp): fp is FloorPlanDocument => fp != null);
    if (floorPlans.length === 0) return null;
    let activeFloorPlanId: string | null =
      typeof o.activeFloorPlanId === "string" ? o.activeFloorPlanId : null;
    if (!activeFloorPlanId || !floorPlans.some((fp) => fp.id === activeFloorPlanId)) {
      activeFloorPlanId = floorPlans[0].id;
    }
    const deviceTypeColorOverrides = normalizeDeviceTypeColorOverrides(
      o.deviceTypeColorOverrides
    );
    return ensureAtLeastOneFloor({
      floorPlans,
      activeFloorPlanId,
      deviceTypeColorOverrides,
    });
  }

  return null;
}

const ROW_ID = "default";

export async function fetchMapStateFromSupabase(): Promise<PersistedMapState | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("map_state")
    .select("data")
    .eq("id", ROW_ID)
    .maybeSingle();

  if (error) {
    console.warn("[Supabase] load failed:", error.message);
    return null;
  }
  if (!data?.data) return null;
  return parsePersistedMapState(data.data);
}

export async function saveMapStateToSupabase(
  state: PersistedMapState
): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const payload = {
    id: ROW_ID,
    data: {
      floorPlans: state.floorPlans,
      activeFloorPlanId: state.activeFloorPlanId,
      deviceTypeColorOverrides: state.deviceTypeColorOverrides,
    },
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("map_state").upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    console.warn("[Supabase] save failed:", error.message);
    return false;
  }
  return true;
}
