import type { Edge, Node } from "@xyflow/react";
import { Position } from "@xyflow/react";
import {
  TOPOLOGY_GROUP_HEIGHT,
  TOPOLOGY_GROUP_WIDTH,
  TOPOLOGY_NODE_HEIGHT,
  TOPOLOGY_NODE_WIDTH,
} from "./types";

/** Pick the side of `self` whose outward normal best faces `peerCenter`. */
function sideFacingPeer(
  selfTopLeft: { x: number; y: number },
  selfW: number,
  selfH: number,
  peerCenter: { x: number; y: number }
): Position {
  const cx = selfTopLeft.x + selfW / 2;
  const cy = selfTopLeft.y + selfH / 2;
  const dx = peerCenter.x - cx;
  const dy = peerCenter.y - cy;
  const eps = 1e-6;
  if (Math.abs(dx) < eps && Math.abs(dy) < eps) {
    return Position.Bottom;
  }
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? Position.Right : Position.Left;
  }
  return dy > 0 ? Position.Bottom : Position.Top;
}

export function getTopologyNodeDimensions(node: Node): {
  width: number;
  height: number;
} {
  if (node.type === "topologyGroup") {
    return {
      width: node.width ?? node.measured?.width ?? TOPOLOGY_GROUP_WIDTH,
      height: node.height ?? node.measured?.height ?? TOPOLOGY_GROUP_HEIGHT,
    };
  }
  return {
    width: node.width ?? node.measured?.width ?? TOPOLOGY_NODE_WIDTH,
    height: node.height ?? node.measured?.height ?? TOPOLOGY_NODE_HEIGHT,
  };
}

export function getNearestHandleIds(
  sourceNode: Node,
  targetNode: Node
): { sourceHandle: string; targetHandle: string } {
  const sw = getTopologyNodeDimensions(sourceNode);
  const tw = getTopologyNodeDimensions(targetNode);

  const scx = sourceNode.position.x + sw.width / 2;
  const scy = sourceNode.position.y + sw.height / 2;
  const tcx = targetNode.position.x + tw.width / 2;
  const tcy = targetNode.position.y + tw.height / 2;
  const cdx = tcx - scx;
  const cdy = tcy - scy;
  if (Math.abs(cdx) < 1e-6 && Math.abs(cdy) < 1e-6) {
    return {
      sourceHandle: `s-${Position.Bottom}`,
      targetHandle: `t-${Position.Top}`,
    };
  }

  const targetCenter = { x: tcx, y: tcy };
  const sourceCenter = { x: scx, y: scy };

  const sourceSide = sideFacingPeer(
    sourceNode.position,
    sw.width,
    sw.height,
    targetCenter
  );
  const targetSide = sideFacingPeer(
    targetNode.position,
    tw.width,
    tw.height,
    sourceCenter
  );

  return {
    sourceHandle: `s-${sourceSide}`,
    targetHandle: `t-${targetSide}`,
  };
}

export function applyNearestHandles<E extends Record<string, unknown>>(
  nodes: Node[],
  edges: Edge<E>[]
): Edge<E>[] {
  const map = new Map(nodes.map((n) => [n.id, n]));
  return edges.map((e) => {
    const s = map.get(e.source);
    const t = map.get(e.target);
    if (!s || !t) return e;
    const { sourceHandle, targetHandle } = getNearestHandleIds(s, t);
    return { ...e, sourceHandle, targetHandle };
  });
}
