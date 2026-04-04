import type { Device } from "@/types/device";
import type { Layer } from "@/types/layer";

/** One floor’s map: layers, devices, and optional background image (data URL). */
export interface FloorPlanDocument {
  id: string;
  name: string;
  floorPlanDataUrl: string | null;
  layers: Layer[];
  devices: Device[];
}
