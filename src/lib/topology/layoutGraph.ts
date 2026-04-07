import dagre from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";
import type { TopologyGroupNodeData, TopologyNodeData } from "./types";
import {
  TOPOLOGY_GROUP_HEIGHT,
  TOPOLOGY_GROUP_WIDTH,
  TOPOLOGY_NODE_HEIGHT,
  TOPOLOGY_NODE_WIDTH,
} from "./types";

export type LayoutDirection = "TB" | "LR";

type AnyTopoNode = Node<TopologyNodeData | TopologyGroupNodeData>;

function dimensionsFor(node: AnyTopoNode): { width: number; height: number } {
  if (node.type === "topologyGroup") {
    return { width: TOPOLOGY_GROUP_WIDTH, height: TOPOLOGY_GROUP_HEIGHT };
  }
  return { width: TOPOLOGY_NODE_WIDTH, height: TOPOLOGY_NODE_HEIGHT };
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
    g.setNode(node.id, { width, height });
  }

  for (const e of edges) {
    if (g.hasNode(e.source) && g.hasNode(e.target)) {
      g.setEdge(e.source, e.target);
    }
  }

  dagre.layout(g);

  return nodes.map((node) => {
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
}
