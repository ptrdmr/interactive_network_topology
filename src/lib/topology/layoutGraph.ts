import dagre from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";
import type { TopologyGroupNodeData, TopologyNodeData } from "./types";
import {
  TOPOLOGY_GROUP_HEIGHT,
  TOPOLOGY_GROUP_WIDTH,
  TOPOLOGY_NODE_HEIGHT,
  TOPOLOGY_NODE_WIDTH,
} from "./types";
import { TOPOLOGY_GROUP_RANK, TOPOLOGY_TIER } from "./tiers";

export type LayoutDirection = "TB" | "LR";

type AnyTopoNode = Node<TopologyNodeData | TopologyGroupNodeData>;

const COMPONENT_GAP = 120;

function dimensionsFor(node: AnyTopoNode): { width: number; height: number } {
  if (node.type === "topologyGroup") {
    return { width: TOPOLOGY_GROUP_WIDTH, height: TOPOLOGY_GROUP_HEIGHT };
  }
  return { width: TOPOLOGY_NODE_WIDTH, height: TOPOLOGY_NODE_HEIGHT };
}

function rankForNode(node: AnyTopoNode): number {
  if (node.type === "topologyGroup") {
    return TOPOLOGY_GROUP_RANK;
  }
  const data = node.data as TopologyNodeData;
  return TOPOLOGY_TIER[data.deviceTypeId];
}

function findConnectedComponents(
  nodeIds: readonly string[],
  edges: Edge[]
): string[][] {
  const adj = new Map<string, Set<string>>();
  for (const id of nodeIds) {
    adj.set(id, new Set());
  }
  for (const e of edges) {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.add(e.target);
      adj.get(e.target)!.add(e.source);
    }
  }
  const visited = new Set<string>();
  const components: string[][] = [];
  for (const id of nodeIds) {
    if (visited.has(id)) continue;
    const comp: string[] = [];
    const stack: string[] = [id];
    visited.add(id);
    while (stack.length) {
      const v = stack.pop()!;
      comp.push(v);
      for (const w of adj.get(v) ?? []) {
        if (!visited.has(w)) {
          visited.add(w);
          stack.push(w);
        }
      }
    }
    components.push(comp);
  }
  return components;
}

function bboxForComponent(
  ids: readonly string[],
  nodes: AnyTopoNode[]
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const byId = new Map(nodes.map((n) => [n.id, n] as const));
  for (const id of ids) {
    const n = byId.get(id);
    if (!n) continue;
    const { width, height } = dimensionsFor(n);
    const { x, y } = n.position;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  return { minX, minY, maxX, maxY };
}

/**
 * When multiple disconnected subgraphs exist, place each component side-by-side
 * with a fixed gap so they do not overlap.
 */
function tileDisconnectedComponents(
  nodes: AnyTopoNode[],
  edges: Edge[]
): AnyTopoNode[] {
  if (nodes.length === 0) return [];

  const ids = nodes.map((n) => n.id);
  const components = findConnectedComponents(ids, edges);
  if (components.length <= 1) {
    return nodes;
  }

  const bboxes = components.map((c) => ({
    ids: c,
    ...bboxForComponent(c, nodes),
  }));

  bboxes.sort((a, b) => b.maxX - b.minX - (a.maxX - a.minX));

  const idToDelta = new Map<string, { dx: number; dy: number }>();
  let cursorX = 0;

  for (const b of bboxes) {
    const width = b.maxX - b.minX;
    const dx = cursorX - b.minX;
    const dy = -b.minY;
    for (const id of b.ids) {
      idToDelta.set(id, { dx, dy });
    }
    cursorX += width + COMPONENT_GAP;
  }

  return nodes.map((n) => {
    const d = idToDelta.get(n.id);
    if (!d) return n;
    return {
      ...n,
      position: {
        x: n.position.x + d.dx,
        y: n.position.y + d.dy,
      },
    };
  });
}

export function layoutGraph(
  nodes: AnyTopoNode[],
  edges: Edge[],
  direction: LayoutDirection = "TB"
): AnyTopoNode[] {
  if (nodes.length === 0) return [];

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 48,
    ranksep: 72,
    marginx: 24,
    marginy: 24,
  });

  for (const node of nodes) {
    const { width, height } = dimensionsFor(node);
    g.setNode(node.id, {
      width,
      height,
      rank: rankForNode(node),
    });
  }

  for (const e of edges) {
    if (g.hasNode(e.source) && g.hasNode(e.target)) {
      g.setEdge(e.source, e.target);
    }
  }

  dagre.layout(g);

  const positioned: AnyTopoNode[] = nodes.map((node) => {
    const pos = g.node(node.id);
    if (!pos) {
      return node;
    }
    const { width, height } = dimensionsFor(node);
    return {
      ...node,
      position: {
        x: pos.x - width / 2,
        y: pos.y - height / 2,
      },
    };
  });

  return tileDisconnectedComponents(positioned, edges);
}
