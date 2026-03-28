import type { Layer } from "@/types/layer";
import type { Device } from "@/types/device";
import { getSupabaseBrowserClient } from "./client";

export interface PersistedMapState {
  layers: Layer[];
  devices: Device[];
  floorPlanDataUrl?: string | null;
}

export function emptyPersistedMapState(): PersistedMapState {
  return { layers: [], devices: [], floorPlanDataUrl: null };
}

function normalizeLayer(raw: Layer): Layer {
  return {
    ...raw,
    kind: raw.kind === "server" ? "server" : "standard",
  };
}

export function parsePersistedMapState(raw: unknown): PersistedMapState | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.layers) || !Array.isArray(o.devices)) return null;
  return {
    layers: (o.layers as Layer[]).map((l) => normalizeLayer(l)),
    devices: o.devices as Device[],
    floorPlanDataUrl:
      typeof o.floorPlanDataUrl === "string" ? o.floorPlanDataUrl : null,
  };
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
      layers: state.layers,
      devices: state.devices,
      floorPlanDataUrl: state.floorPlanDataUrl ?? null,
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
