import type { Edge, Node } from "@xyflow/react";
import type { Layer } from "@/types/layer";
import type { TopologyEdgeData, TopologyGroupNodeData, TopologyNodeData } from "./types";
import {
  TOPOLOGY_GROUP_RANK,
  TOPOLOGY_TIER,
  orientEdgeForStackLayout,
} from "./tiers";

export const LAYER_GROUP_PREFIX = "layer-group-";

export function layerGroupNodeId(layerId: string): string {
  return `${LAYER_GROUP_PREFIX}${layerId}`;
}

function isDeviceNode(n: Node): n is Node<TopologyNodeData> {
  return n.type === "topologyDevice" && n.data != null;
}

/**
 * Replace devices on collapsed layers with one summary node per layer; re-route and dedupe edges.
 */
export function collapseLayerGroups(
  nodes: Node<TopologyNodeData>[],
  edges: Edge<TopologyEdgeData>[],
  collapsedLayerIds: Set<string>,
  layers: Layer[]
): { nodes: Node<TopologyNodeData | TopologyGroupNodeData>[]; edges: Edge<TopologyEdgeData>[] } {
  if (collapsedLayerIds.size === 0) {
    return { nodes, edges };
  }

  const layerById = new Map(layers.map((l) => [l.id, l] as const));

  const removedIds = new Set<string>();
  const removedLayerCounts = new Map<string, number>();

  for (const n of nodes) {
    if (!isDeviceNode(n)) continue;
    const lid = n.data.layerId;
    if (collapsedLayerIds.has(lid)) {
      removedIds.add(n.id);
      removedLayerCounts.set(lid, (removedLayerCounts.get(lid) ?? 0) + 1);
    }
  }

  const keptNodes: Node<TopologyNodeData | TopologyGroupNodeData>[] = [];

  for (const n of nodes) {
    if (!isDeviceNode(n)) continue;
    if (removedIds.has(n.id)) continue;
    keptNodes.push(n);
  }

  for (const layerId of collapsedLayerIds) {
    const count = removedLayerCounts.get(layerId) ?? 0;
    if (count === 0) continue;
    const meta = layerById.get(layerId);
    const data: TopologyGroupNodeData = {
      layerId,
      layerName: meta?.name ?? "Layer",
      layerColor: meta?.color ?? "#64748b",
      deviceCount: count,
    };
    keptNodes.push({
      id: layerGroupNodeId(layerId),
      type: "topologyGroup",
      position: { x: 0, y: 0 },
      data,
    });
  }

  const nodeById = new Map<
    string,
    Node<TopologyNodeData | TopologyGroupNodeData>
  >(keptNodes.map((n) => [n.id, n] as const));

  function tierForEndpoint(id: string): number {
    const n = nodeById.get(id);
    if (!n) return TOPOLOGY_TIER.other;
    if (n.type === "topologyGroup") return TOPOLOGY_GROUP_RANK;
    if (isDeviceNode(n)) {
      return TOPOLOGY_TIER[n.data.deviceTypeId];
    }
    return TOPOLOGY_TIER.other;
  }

  function mapEndpoint(id: string): string {
    if (!removedIds.has(id)) return id;
    const node = nodes.find((x) => x.id === id);
    if (!node || !isDeviceNode(node)) return id;
    return layerGroupNodeId(node.data.layerId);
  }

  const portBuckets = new Map<
    string,
    { a: string; b: string; labels: string[] }
  >();
  const directedOut: Edge<TopologyEdgeData>[] = [];
  let dirIdx = 0;

  for (const e of edges) {
    const s = mapEndpoint(e.source);
    const t = mapEndpoint(e.target);
    if (s === t) continue;

    const kind = e.data?.kind ?? "port";
    const label = (e.data?.label ?? "").trim();

    if (kind === "port") {
      const a = s < t ? s : t;
      const b = s < t ? t : s;
      const pk = `${a}|${b}`;
      const cur = portBuckets.get(pk);
      if (!cur) {
        portBuckets.set(pk, { a, b, labels: label ? [label] : [] });
      } else if (label) {
        cur.labels.push(label);
      }
    } else {
      dirIdx += 1;
      directedOut.push({
        ...e,
        id: `${kind}-${s}-${t}-${dirIdx}`,
        source: s,
        target: t,
        type: "smoothstep",
        data: {
          kind,
          label: label || `${kind} link`,
        },
      });
    }
  }

  const portEdges: Edge<TopologyEdgeData>[] = [];
  for (const { a, b, labels } of portBuckets.values()) {
    const mergedLabel =
      labels.length === 0
        ? "Link"
        : labels.length === 1
          ? labels[0]!
          : `${labels.length} links`;
    const { source, target } = orientEdgeForStackLayout(
      a,
      tierForEndpoint(a),
      b,
      tierForEndpoint(b)
    );
    portEdges.push({
      id: `port-${a}-${b}`,
      source,
      target,
      type: "smoothstep",
      data: { kind: "port", label: mergedLabel },
    });
  }

  const nextEdges = [...portEdges, ...directedOut];

  return { nodes: keptNodes, edges: nextEdges };
}
