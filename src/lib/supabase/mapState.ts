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
  const k = (raw as { kind?: string }).kind;
  const kind: Layer["kind"] =
    k === "rack" || k === "server" ? "rack" : "standard";
  return {
    ...raw,
    kind,
  };
}

/** Normalize devices and force `deviceTypeId: rack` for every device on a rack layer. */
function normalizeDevicesForFloor(layers: Layer[], rawDevices: unknown): Device[] {
  if (!Array.isArray(rawDevices)) return [];
  return (rawDevices as Device[]).map((d) => {
    const dev = normalizeDevice(d);
    const layer = layers.find((l) => l.id === dev.layerId);
    if (layer?.kind === "rack") {
      return { ...dev, deviceTypeId: "rack" };
    }
    return dev;
  });
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

function trimOptString(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const t = raw.trim();
  return t === "" ? undefined : t;
}

/** Keep only plausible `YYYY-MM-DD` values from persisted JSON. */
function normalizeInstallDate(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const t = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return undefined;
  return t;
}

function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const t = item.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function normalizeDevice(raw: Device): Device {
  const portSlots = Array.isArray((raw as { portSlots?: unknown }).portSlots)
    ? (raw as { portSlots: unknown[] }).portSlots.map(normalizePortSlot)
    : [];
  const deviceTypeId = normalizeDeviceTypeId(
    (raw as { deviceTypeId?: unknown }).deviceTypeId
  );
  const tags = normalizeTags((raw as { tags?: unknown }).tags);
  return {
    ...raw,
    deviceTypeId,
    tags,
    portSlots,
    brand: trimOptString((raw as { brand?: unknown }).brand),
    ipAddress: trimOptString((raw as { ipAddress?: unknown }).ipAddress),
    macAddress: trimOptString((raw as { macAddress?: unknown }).macAddress),
    physicalLocation: trimOptString((raw as { physicalLocation?: unknown }).physicalLocation),
    serialNumber: trimOptString((raw as { serialNumber?: unknown }).serialNumber),
    installDate: normalizeInstallDate((raw as { installDate?: unknown }).installDate),
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
  const devices = normalizeDevicesForFloor(layers, o.devices);
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
        devices: normalizeDevicesForFloor(
          (o.layers as Layer[]).map((l) => normalizeLayer(l)),
          o.devices
        ),
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
