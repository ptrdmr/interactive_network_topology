"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TopologyDeviceNode } from "./TopologyDeviceNode";
import { TopologyGroupNode } from "./TopologyGroupNode";
import {
  TopologyControls,
  type EdgeKindToggles,
  type FocusHopMode,
} from "./TopologyControls";
import { deviceMatchesSearch } from "@/lib/deviceSearch";
import {
  buildDeviceContextList,
  buildGraph,
  filterDevicesForTopology,
} from "@/lib/topology/buildGraph";
import { collapseLayerGroups } from "@/lib/topology/collapseGroups";
import { applyNearestHandles } from "@/lib/topology/edgeHandles";
import { filterDevicesForFocus } from "@/lib/topology/focusSubgraph";
import { layoutGraph, type LayoutDirection } from "@/lib/topology/layoutGraph";
import type {
  TopologyEdgeData,
  TopologyGroupNodeData,
  TopologyNodeData,
} from "@/lib/topology/types";
import type { Device } from "@/types/device";
import type { Layer } from "@/types/layer";

function styleEdges(edges: Edge<TopologyEdgeData>[]): Edge<TopologyEdgeData>[] {
  return edges.map((e) => {
    const kind = e.data?.kind ?? "port";
    const label = e.data?.label ?? "";

    if (kind === "port") {
      return {
        ...e,
        label,
        style: {
          stroke: "#94a3b8",
          strokeWidth: 2,
        },
        labelStyle: { fill: "#e2e8f0", fontSize: 10 },
        labelBgStyle: { fill: "#1a2332", fillOpacity: 0.92 },
        labelBgPadding: [4, 4] as [number, number],
        markerEnd: undefined,
      };
    }

    return {
      ...e,
      label,
      style: {
        stroke: "#eab308",
        strokeWidth: 1.5,
        strokeDasharray: "2 5",
      },
      labelStyle: { fill: "#fde047", fontSize: 10 },
      labelBgStyle: { fill: "#1a2332", fillOpacity: 0.92 },
      labelBgPadding: [4, 4] as [number, number],
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#eab308",
        width: 16,
        height: 16,
      },
    };
  });
}

function FitViewOnChange({
  revision,
  nodeCount,
}: {
  revision: number;
  nodeCount: number;
}) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (nodeCount === 0) return;
    const id = requestAnimationFrame(() => {
      void fitView({ padding: 0.18, duration: 220 });
    });
    return () => cancelAnimationFrame(id);
  }, [revision, nodeCount, fitView]);

  return null;
}

function FitViewOnResize({ nodeCount }: { nodeCount: number }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (nodeCount === 0) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        void fitView({ padding: 0.18, duration: 200 });
      }, 120);
    };
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
    };
  }, [fitView, nodeCount]);

  return null;
}

const defaultEdgeToggles: EdgeKindToggles = {
  port: true,
  property: true,
};

export interface TopologyCanvasInnerProps {
  /** All devices on the active floor (for focus + graph). */
  floorDevices: Device[];
  layers: Layer[];
  resolveDeviceTypeColor: (typeId: Device["deviceTypeId"]) => string;
  selectedDeviceId: string | null;
  onSelectDeviceId: (id: string | null) => void;
  onToggleLayer: (layerId: string) => void;
  onShowAllLayers: () => void;
  onHideAllLayers: () => void;
  /** Sidebar search: filter devices (same fields as map search) after focus/layer filter. */
  searchQuery: string;
  focusDeviceId: string | null;
  onFocusDeviceId: (id: string | null) => void;
  focusHopMode: FocusHopMode;
  onFocusHopMode: (mode: FocusHopMode) => void;
  deviceOptions: { id: string; name: string }[];
}

function TopologyCanvasInner({
  floorDevices,
  layers,
  resolveDeviceTypeColor,
  selectedDeviceId,
  onSelectDeviceId,
  onToggleLayer,
  onShowAllLayers,
  onHideAllLayers,
  searchQuery,
  focusDeviceId,
  onFocusDeviceId,
  focusHopMode,
  onFocusHopMode,
  deviceOptions,
}: TopologyCanvasInnerProps) {
  const [direction, setDirection] = useState<LayoutDirection>("TB");
  const [edgeToggles, setEdgeToggles] =
    useState<EdgeKindToggles>(defaultEdgeToggles);
  const [layoutRevision, setLayoutRevision] = useState(0);
  const [collapsedLayerIds, setCollapsedLayerIds] = useState<string[]>([]);

  const focusMaxHops =
    focusHopMode === "all" ? Number.POSITIVE_INFINITY : focusHopMode;

  const toggleLayerCollapse = useCallback((layerId: string) => {
    setCollapsedLayerIds((prev) => {
      const s = new Set(prev);
      if (s.has(layerId)) s.delete(layerId);
      else s.add(layerId);
      return Array.from(s);
    });
  }, []);

  const nodeTypes = useMemo(
    () => ({
      topologyDevice: TopologyDeviceNode,
      topologyGroup: TopologyGroupNode,
    }),
    []
  );

  const computeLaidOut = useCallback(() => {
    let pool: Device[];
    let hopDist: Map<string, number> | null = null;

    if (focusDeviceId) {
      const { devices, distances } = filterDevicesForFocus(
        floorDevices,
        focusDeviceId,
        focusMaxHops
      );
      pool = filterDevicesForTopology(devices, layers);
      hopDist = new Map<string, number>();
      for (const d of pool) {
        const dist = distances.get(d.id);
        if (dist !== undefined) hopDist.set(d.id, dist);
      }
    } else {
      pool = filterDevicesForTopology(floorDevices, layers);
    }

    const q = searchQuery.trim();
    if (q) {
      pool = pool.filter((d) => deviceMatchesSearch(d, q));
    }

    const ctx = buildDeviceContextList(pool, layers, resolveDeviceTypeColor);
    const built = buildGraph(ctx, {
      includePort: edgeToggles.port,
      includeProperty: edgeToggles.property,
    });
    let { nodes } = built;
    const { edges } = built;

    nodes = nodes.map((n) => {
      const extra: Partial<TopologyNodeData> =
        focusDeviceId && hopDist
          ? {
              isFocusRoot: n.id === focusDeviceId,
              focusHopDistance: hopDist.get(n.id),
            }
          : {};
      return {
        ...n,
        data: { ...n.data, ...extra },
      };
    });

    const collapsed = new Set(collapsedLayerIds);
    const afterCollapse = collapseLayerGroups(nodes, edges, collapsed, layers);
    const laidOut = layoutGraph(afterCollapse.nodes, afterCollapse.edges, direction);
    const styled = styleEdges(afterCollapse.edges);
    return { nodes: laidOut, edges: styled };
  }, [
    floorDevices,
    layers,
    resolveDeviceTypeColor,
    direction,
    edgeToggles.port,
    edgeToggles.property,
    focusDeviceId,
    focusMaxHops,
    searchQuery,
    collapsedLayerIds,
  ]);

  const graph = useMemo(() => computeLaidOut(), [computeLaidOut]);

  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  const edgesWithHandles = useMemo(
    () => applyNearestHandles(nodes, edges),
    [nodes, edges]
  );

  const selectedIdRef = useRef(selectedDeviceId);

  useEffect(() => {
    selectedIdRef.current = selectedDeviceId;
  }, [selectedDeviceId]);

  useEffect(() => {
    const sel = selectedIdRef.current;
    setNodes(
      graph.nodes.map((n) => ({
        ...n,
        selected: n.id === sel,
      }))
    );
    setEdges(graph.edges);
    const id = requestAnimationFrame(() => {
      setLayoutRevision((r) => r + 1);
    });
    return () => cancelAnimationFrame(id);
  }, [graph, setNodes, setEdges]);

  const onRelayout = useCallback(() => {
    const next = computeLaidOut();
    setNodes(
      next.nodes.map((n) => ({
        ...n,
        selected: n.id === selectedDeviceId,
      }))
    );
    setEdges(next.edges);
    setLayoutRevision((r) => r + 1);
  }, [computeLaidOut, selectedDeviceId, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "topologyGroup") {
        const lid = (node.data as TopologyGroupNodeData).layerId;
        setCollapsedLayerIds((prev) => prev.filter((x) => x !== lid));
        return;
      }
      onSelectDeviceId(node.id);
    },
    [onSelectDeviceId]
  );

  const onPaneClick = useCallback(() => {
    onSelectDeviceId(null);
  }, [onSelectDeviceId]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: n.id === selectedDeviceId,
      }))
    );
  }, [selectedDeviceId, setNodes]);

  const empty = graph.nodes.length === 0;

  return (
    <div className="relative h-full w-full blueprint-grid bg-bg-primary">
      <ReactFlow
        nodes={nodes}
        edges={edgesWithHandles}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        minZoom={0.08}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
        className="bg-transparent"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(148, 163, 184, 0.12)"
        />
        <Controls className="!bg-bg-card !border-border !shadow-lg !mb-[max(0.5rem,env(safe-area-inset-bottom))] !ml-[max(0.5rem,env(safe-area-inset-left))] [&_button]:!bg-bg-card [&_button]:!border-border [&_button:hover]:!bg-bg-hover [&_svg]:!fill-text-primary" />
        <MiniMap
          className="!bg-bg-card/95 !border-border max-lg:hidden !mb-[max(0.5rem,env(safe-area-inset-bottom))]"
          nodeStrokeWidth={2}
          nodeColor={(node) => {
            if (node.type === "topologyGroup") {
              const d = node.data as TopologyGroupNodeData | undefined;
              return d?.layerColor ?? "#64748b";
            }
            const data = node.data as TopologyNodeData | undefined;
            return data?.fillColor ?? "#64748b";
          }}
          maskColor="rgba(10, 15, 26, 0.75)"
        />
        <FitViewOnChange
          revision={layoutRevision}
          nodeCount={nodes.length}
        />
        <FitViewOnResize nodeCount={nodes.length} />
        <TopologyControls
          layers={layers}
          onToggleLayer={onToggleLayer}
          onShowAllLayers={onShowAllLayers}
          onHideAllLayers={onHideAllLayers}
          collapsedLayerIds={collapsedLayerIds}
          onToggleLayerCollapse={toggleLayerCollapse}
          direction={direction}
          onDirectionChange={setDirection}
          edgeToggles={edgeToggles}
          onEdgeTogglesChange={setEdgeToggles}
          onRelayout={onRelayout}
          deviceOptions={deviceOptions}
          focusDeviceId={focusDeviceId}
          onFocusDeviceId={onFocusDeviceId}
          focusHopMode={focusHopMode}
          onFocusHopMode={onFocusHopMode}
        />
      </ReactFlow>

      {empty && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
          <p className="text-center text-sm text-text-muted max-w-md bg-bg-card/90 border border-border/60 rounded-lg px-4 py-3 backdrop-blur-sm">
            No devices match the current filters, or no relationships to draw.
            Adjust focus, search, or layers; add port links on the floor plan map.
          </p>
        </div>
      )}
    </div>
  );
}

export function TopologyCanvas(props: TopologyCanvasInnerProps) {
  return (
    <ReactFlowProvider>
      <TopologyCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
