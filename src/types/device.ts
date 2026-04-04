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
  position: { x: number; y: number };
  parentId?: string;
  /** Vertical order inside a server rack (lower = top of stack). */
  rackOrder?: number;
  status: DeviceStatus;
  description: string;
  properties: DeviceProperty[];
  /** Port count = length; each slot holds optional label, notes, and link to another device. */
  portSlots?: PortSlot[];
}
