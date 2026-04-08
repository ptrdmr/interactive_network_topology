import type { Device, DeviceStatus } from "@/types/device";
import type { DeviceTypeId } from "@/constants/deviceTypes";

/** Fixed dimensions for dagre layout (must match device node UI). */
export const TOPOLOGY_NODE_WIDTH = 200;
export const TOPOLOGY_NODE_HEIGHT = 76;

/** Collapsed layer group node (must match TopologyGroupNode). */
export const TOPOLOGY_GROUP_WIDTH = 220;
export const TOPOLOGY_GROUP_HEIGHT = 88;

export type TopologyEdgeKind = "port" | "property";

export type TopologyNodeData = {
  deviceId: string;
  name: string;
  status: DeviceStatus;
  deviceTypeId: DeviceTypeId;
  layerId: string;
  layerName: string;
  layerColor: string;
  fillColor: string;
  deviceTypeLabel: string;
  /** Focus mode: root device */
  isFocusRoot?: boolean;
  /** Hops from focus device (0 = root); used for subtle emphasis */
  focusHopDistance?: number;
};

export type TopologyGroupNodeData = {
  layerId: string;
  layerName: string;
  layerColor: string;
  deviceCount: number;
};

export type TopologyEdgeData = {
  kind: TopologyEdgeKind;
  /** Port / link description for tooltips and edge labels */
  label: string;
};

export type BuildGraphOptions = {
  /** Include port-based links (solid). Default true. */
  includePort?: boolean;
  /** Include property-reference links (dotted). Default true. */
  includeProperty?: boolean;
};

export type DeviceWithLayerContext = {
  device: Device;
  layerName: string;
  layerColor: string;
  fillColor: string;
  deviceTypeLabel: string;
};
