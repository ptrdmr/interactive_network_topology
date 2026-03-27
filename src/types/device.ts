export type DeviceStatus = "online" | "offline" | "maintenance";

export interface DeviceProperty {
  key: string;
  value: string;
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
}
