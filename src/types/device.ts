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
  /** Vertical order inside a server rack (lower = top of stack). */
  rackOrder?: number;
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
}
