"use client";

import type { Device, DeviceStatus } from "@/types/device";

interface DeviceMarkerProps {
  device: Device;
  /** Fill color from device type (+ optional user overrides). */
  fillColor: string;
  /** Stroke color from map layer (outer ring). */
  layerRingColor: string;
  isSelected: boolean;
  onClick: (device: Device) => void;
  /** When false, hover popover is suppressed (e.g. reposition mode). */
  hoverEnabled?: boolean;
  onHoverChange?: (device: Device | null) => void;
  /** When true and `device.mapLabel` is set, show label below the marker. */
  showLabel?: boolean;
}

const statusRing: Record<DeviceStatus, string> = {
  online: "transparent",
  offline: "#ef4444",
  maintenance: "#f59e0b",
};

function tooltipTitle(device: Device): string {
  const extra =
    device.ipAddress?.trim() ||
    device.properties.find((p) => p.key.toLowerCase() === "ip")?.value?.trim() ||
    device.properties[0]?.value;
  if (extra) return `${device.name} (${extra})`;
  return device.name;
}

export function DeviceMarker({
  device,
  fillColor,
  layerRingColor,
  isSelected,
  onClick,
  hoverEnabled = true,
  onHoverChange,
  showLabel = false,
}: DeviceMarkerProps) {
  const r = isSelected ? 14 : 10;
  const mapLabel = device.mapLabel?.trim() ?? "";
  const labelY = device.position.y + r + 16;
  const labelFontSize = isSelected ? 9 : 7;

  return (
    <g
      className="cursor-pointer"
      aria-label={tooltipTitle(device)}
      onClick={(e) => {
        e.stopPropagation();
        onClick(device);
      }}
      onMouseEnter={() => {
        if (hoverEnabled) onHoverChange?.(device);
      }}
      onMouseLeave={() => {
        if (hoverEnabled) onHoverChange?.(null);
      }}
    >
      {/* Pulse ring for maintenance */}
      {device.status === "maintenance" && (
        <circle
          cx={device.position.x}
          cy={device.position.y}
          r={r + 6}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          className="animate-pulse-marker"
          opacity="0.6"
        />
      )}

      {/* Layer ring (map layer color) — outermost semantic ring */}
      <circle
        cx={device.position.x}
        cy={device.position.y}
        r={r + 8}
        fill="none"
        stroke={layerRingColor}
        strokeWidth="2.5"
        opacity="0.95"
      />

      {/* Status ring (offline / maintenance) */}
      {device.status !== "online" && (
        <circle
          cx={device.position.x}
          cy={device.position.y}
          r={r + 3}
          fill="none"
          stroke={statusRing[device.status]}
          strokeWidth="2"
        />
      )}

      {/* Selection ring */}
      {isSelected && (
        <circle
          cx={device.position.x}
          cy={device.position.y}
          r={r + 5}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          opacity="0.85"
        />
      )}

      {/* Main marker — device type fill */}
      <circle
        cx={device.position.x}
        cy={device.position.y}
        r={r}
        fill={fillColor}
        stroke="#0a0f1a"
        strokeWidth="2.5"
        opacity="0.95"
      />

      <circle
        cx={device.position.x}
        cy={device.position.y}
        r={3}
        fill="#0a0f1a"
        opacity="0.5"
      />

      {showLabel && mapLabel && (
        <text
          x={device.position.x}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="central"
          fill={fillColor}
          stroke="#ffffff"
          strokeWidth="2.5"
          paintOrder="stroke"
          fontSize={labelFontSize}
          fontWeight="bold"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          className="select-none"
          style={{ pointerEvents: "none" }}
        >
          {mapLabel}
        </text>
      )}
    </g>
  );
}
