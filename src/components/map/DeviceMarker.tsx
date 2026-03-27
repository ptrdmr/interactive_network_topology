"use client";

import type { Device, DeviceStatus } from "@/types/device";

interface DeviceMarkerProps {
  device: Device;
  color: string;
  isSelected: boolean;
  onClick: (device: Device) => void;
}

const statusRing: Record<DeviceStatus, string> = {
  online: "transparent",
  offline: "#ef4444",
  maintenance: "#f59e0b",
};

function tooltipTitle(device: Device): string {
  const extra =
    device.properties.find((p) => p.key.toLowerCase() === "ip")?.value ??
    device.properties[0]?.value;
  if (extra) return `${device.name} (${extra})`;
  return device.name;
}

export function DeviceMarker({ device, color, isSelected, onClick }: DeviceMarkerProps) {
  const r = isSelected ? 14 : 10;

  return (
    <g
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onClick(device);
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

      {/* Outer status ring */}
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
          opacity="0.8"
        />
      )}

      {/* Main marker */}
      <circle
        cx={device.position.x}
        cy={device.position.y}
        r={r}
        fill={color}
        stroke="#0a0f1a"
        strokeWidth="2.5"
        opacity="0.95"
      />

      {/* Inner dot */}
      <circle
        cx={device.position.x}
        cy={device.position.y}
        r={3}
        fill="#0a0f1a"
        opacity="0.5"
      />

      <title>{tooltipTitle(device)}</title>
    </g>
  );
}
