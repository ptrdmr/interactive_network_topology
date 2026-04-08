import type { Edge, Node } from "@xyflow/react";
import type { Device } from "@/types/device";
import type { Layer } from "@/types/layer";
import { DEVICE_TYPE_LABELS } from "@/constants/deviceTypes";
import type {
  BuildGraphOptions,
  DeviceWithLayerContext,
  TopologyEdgeData,
  TopologyNodeData,
} from "./types";

function layerMeta(
  layers: Layer[],
  layerId: string
): { name: string; color: string; visible: boolean } {
  const l = layers.find((x) => x.id === layerId);
  return {
    name: l?.name ?? "Unknown layer",
    color: l?.color ?? "#64748b",
    visible: l?.visible ?? true,
  };
}

/** Devices on visible layers only. Rack enclosures are excluded (floor-plan container only); rack-mounted gear is included. */
export function filterDevicesForTopology(devices: Device[], layers: Layer[]): Device[] {
  const visible = new Set(
    layers.filter((l) => l.visible).map((l) => l.id)
  );
  return devices.filter(
    (d) => visible.has(d.layerId) && d.deviceTypeId !== "rack"
  );
}

export function buildDeviceContextList(
  devices: Device[],
  layers: Layer[],
  resolveDeviceTypeColor: (typeId: Device["deviceTypeId"]) => string
): DeviceWithLayerContext[] {
  return devices.map((device) => {
    const meta = layerMeta(layers, device.layerId);
    return {
      device,
      layerName: meta.name,
      layerColor: meta.color,
      fillColor: resolveDeviceTypeColor(device.deviceTypeId),
      deviceTypeLabel: DEVICE_TYPE_LABELS[device.deviceTypeId],
    };
  });
}

/**
 * Build React Flow nodes and edges from floor devices.
 * Only includes devices on visible layers; edges require both endpoints present.
 */
export function buildGraph(
  contextList: DeviceWithLayerContext[],
  options: BuildGraphOptions = {}
): { nodes: Node<TopologyNodeData>[]; edges: Edge<TopologyEdgeData>[] } {
  const includePort = options.includePort !== false;
  const includeProperty = options.includeProperty !== false;

  const idSet = new Set(contextList.map((c) => c.device.id));
  const idToName = new Map(
    contextList.map((c) => [c.device.id, c.device.name] as const)
  );

  const nodes: Node<TopologyNodeData>[] = contextList.map((c) => {
    const d = c.device;
    const data: TopologyNodeData = {
      deviceId: d.id,
      name: d.name,
      status: d.status,
      deviceTypeId: d.deviceTypeId,
      layerId: d.layerId,
      layerName: c.layerName,
      layerColor: c.layerColor,
      fillColor: c.fillColor,
      deviceTypeLabel: c.deviceTypeLabel,
    };
    return {
      id: d.id,
      type: "topologyDevice",
      position: { x: 0, y: 0 },
      data,
    };
  });

  const edges: Edge<TopologyEdgeData>[] = [];

  // Port links – merge both sides into one edge: "portA ↔ portB" (no device names; nodes show that)
  if (includePort) {
    type PortPair = {
      a: string;
      b: string;
      aPort: string | null;
      bPort: string | null;
    };
    const portPairs = new Map<string, PortPair>();

    for (const c of contextList) {
      const d = c.device;
      const slots = d.portSlots ?? [];
      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        const targetId = slot.connectedDeviceId;
        if (!targetId || !idSet.has(targetId)) continue;

        const a = d.id < targetId ? d.id : targetId;
        const b = d.id < targetId ? targetId : d.id;
        const key = `${a}|${b}`;
        const localPort = slot.label?.trim() || `Port ${i + 1}`;

        let pair = portPairs.get(key);
        if (!pair) {
          pair = { a, b, aPort: null, bPort: null };
          portPairs.set(key, pair);
        }

        if (d.id === a) {
          pair.aPort = pair.aPort ?? localPort;
        } else {
          pair.bPort = pair.bPort ?? localPort;
        }
      }
    }

    for (const { a, b, aPort, bPort } of portPairs.values()) {
      let label: string;
      if (aPort && bPort) {
        label = `${aPort} ↔ ${bPort}`;
      } else {
        label = aPort ?? bPort ?? "Port link";
      }

      edges.push({
        id: `port-${a}-${b}`,
        source: a,
        target: b,
        type: "smoothstep",
        data: { kind: "port", label },
      });
    }
  }

  // Property back-refs: device whose property value equals another device's id
  if (includeProperty) {
    const seenProp = new Set<string>();
    for (const c of contextList) {
      const d = c.device;
      for (const p of d.properties) {
        const raw = p.value.trim();
        if (!raw || raw === d.id) continue;
        if (!idSet.has(raw)) continue;
        const a = d.id;
        const b = raw;
        const key = `${a}|${b}`;
        if (seenProp.has(key)) continue;
        seenProp.add(key);

        const keyLabel = p.key.trim() || "property";
        const targetName = idToName.get(b) ?? "device";
        edges.push({
          id: `prop-${a}-${b}`,
          source: a,
          target: b,
          type: "smoothstep",
          data: {
            kind: "property",
            label: `${keyLabel} → ${targetName}`,
          },
        });
      }
    }
  }

  return { nodes, edges };
}
