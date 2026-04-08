"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { Layers } from "lucide-react";
import type { TopologyGroupNodeData } from "@/lib/topology/types";
import { TopologyNodeHandles } from "./TopologyNodeHandles";

type GroupNode = Node<TopologyGroupNodeData, "topologyGroup">;

export function TopologyGroupNode({ data, selected }: NodeProps<GroupNode>) {
  return (
    <div
      className={`rounded-xl border-2 px-4 py-3 shadow-lg min-w-[200px] max-w-[260px] transition-[box-shadow,border-color] ${
        selected
          ? "border-accent-light shadow-[0_0_0_2px_rgba(76,175,80,0.35)]"
          : "border-white/20"
      }`}
      style={{
        backgroundColor: `${data.layerColor}22`,
        borderColor: selected ? undefined : data.layerColor,
      }}
    >
      <TopologyNodeHandles />

      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg border-2 border-white/15"
          style={{ backgroundColor: `${data.layerColor}44` }}
        >
          <Layers className="size-5 text-text-primary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            Collapsed layer
          </p>
          <p className="text-sm font-bold text-text-primary truncate leading-tight mt-0.5">
            {data.layerName}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {data.deviceCount} device{data.deviceCount === 1 ? "" : "s"}
          </p>
          <p className="text-[10px] text-text-muted mt-1">Click to expand</p>
        </div>
      </div>
    </div>
  );
}
