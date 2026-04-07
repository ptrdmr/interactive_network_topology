"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Circle } from "lucide-react";
import type { TopologyNodeData } from "@/lib/topology/types";

type TopoNode = Node<TopologyNodeData, "topologyDevice">;

const statusDot: Record<TopologyNodeData["status"], string> = {
  online: "text-status-online",
  offline: "text-status-offline",
  maintenance: "text-status-maintenance",
};

export function TopologyDeviceNode({ data, selected }: NodeProps<TopoNode>) {
  const hop = data.focusHopDistance;
  const fade =
    hop != null && hop > 0 && !data.isFocusRoot
      ? Math.max(0.5, 1 - hop * 0.07)
      : 1;

  return (
    <div
      className={`rounded-lg border-2 bg-bg-card px-3 py-2 shadow-md min-w-[180px] max-w-[220px] transition-[box-shadow,border-color,opacity] ${
        data.isFocusRoot
          ? "ring-2 ring-accent-light ring-offset-2 ring-offset-bg-primary"
          : ""
      } ${
        selected
          ? "border-accent-light shadow-[0_0_0_2px_rgba(76,175,80,0.35)]"
          : "border-transparent"
      }`}
      style={{
        borderColor: selected ? undefined : data.layerColor,
        opacity: fade,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!size-2 !border-border !bg-bg-secondary"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!size-2 !border-border !bg-bg-secondary"
      />

      <div className="flex items-start gap-2">
        <div
          className="mt-0.5 size-8 shrink-0 rounded-md border-2 border-white/10"
          style={{ backgroundColor: data.fillColor }}
          title={data.deviceTypeLabel}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <Circle
              className={`w-2 h-2 shrink-0 fill-current ${statusDot[data.status]}`}
              aria-hidden
            />
            <span className="text-sm font-semibold text-text-primary truncate leading-tight">
              {data.name}
              {data.isFocusRoot && (
                <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide text-accent-light">
                  Focus
                </span>
              )}
            </span>
          </div>
          <p className="text-[11px] text-text-muted truncate mt-0.5">
            {data.deviceTypeLabel}
          </p>
          <p
            className="text-[10px] truncate mt-1 font-medium"
            style={{ color: data.layerColor }}
            title={data.layerName}
          >
            {data.layerName}
          </p>
        </div>
      </div>
    </div>
  );
}
