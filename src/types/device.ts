import type { CameraVariantId } from "@/constants/cameraVariants";
import type { DeviceTypeId } from "@/constants/deviceTypes";

export type DeviceStatus = "online" | "offline" | "maintenance";

export interface DeviceProperty {
  key: string;
  value: string;
}

/** One physical/logical port on a device; array index + 1 is the port number in the UI. */
export interface PortSlot {
  label?: string;
  notes?: string;
  /** Another device on the map this port connects to. */
  connectedDeviceId?: string;
  /** Far-end port name or identifier (free text). */
  remotePort?: string;
}

export interface Device {
  id: string;
  name: string;
  layerId: string;
  /** Map marker fill color family; layer color draws as an outer ring. */
  deviceTypeId: DeviceTypeId;
  position: { x: number; y: number };
  parentId?: string;
  /** Vertical order inside a rack enclosure (lower = top of stack). */
  rackOrder?: number;
  /** Front vs rear of the enclosure (rack units only; default front). */
  rackFace?: "front" | "back";
  status: DeviceStatus;
  description: string;
  /** Vendor / manufacturer (may match a per–device-type suggestion or a custom value). */
  brand?: string;
  ipAddress?: string;
  macAddress?: string;
  /** Where the hardware lives (room, rack, facade, etc.). */
  physicalLocation?: string;
  serialNumber?: string;
  /** ISO date string `YYYY-MM-DD` when known. */
  installDate?: string;
  properties: DeviceProperty[];
  /** Port count = length; each slot holds optional label, notes, and link to another device. */
  portSlots?: PortSlot[];
  /** Free-form labels for filtering and search (normalized when saved). */
  tags: string[];
  /** Camera model / coverage type; FOV angle comes from `CAMERA_VARIANT_FOV_DEG[cameraVariant]`. */
  cameraVariant?: CameraVariantId;
  /** Bearing on the floor plan: 0° = north (up), clockwise. */
  cameraBearingDeg?: number;
  /** Wedge radius in floor-plan SVG units. */
  cameraRangePx?: number;
}
