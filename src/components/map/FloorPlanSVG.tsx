"use client";

import type { Zone } from "@/types/zone";
import type { Device } from "@/types/device";
import type { Layer } from "@/types/layer";
import type { DeviceTypeId } from "@/constants/deviceTypes";
import { DeviceMarker } from "./DeviceMarker";
import { FLOOR_PLAN_HEIGHT, FLOOR_PLAN_WIDTH } from "@/constants/floorPlan";

interface FloorPlanSVGProps {
  zones: Zone[];
  hoveredZone: string | null;
  onZoneHover: (zoneId: string | null) => void;
  devices: Device[];
  layers: Layer[];
  selectedDeviceId: string | null;
  onDeviceClick: (device: Device) => void;
  onDeviceHover: (deviceId: string | null) => void;
  /** When false, device hover popover is disabled (e.g. reposition mode). */
  deviceHoverEnabled?: boolean;
  /** Bundled path or data URL from upload */
  floorPlanImageHref: string;
  /** Resolve device type fill color (defaults + user overrides). */
  resolveDeviceTypeColor: (typeId: DeviceTypeId) => string;
  devMode?: boolean;
  placeMode?: boolean;
  onSvgClick?: (e: React.MouseEvent<SVGSVGElement>) => void;
  onSvgMouseDown?: (e: React.MouseEvent<SVGSVGElement>) => void;
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

const IMG_WIDTH = FLOOR_PLAN_WIDTH;
const IMG_HEIGHT = FLOOR_PLAN_HEIGHT;

export function FloorPlanSVG({
  zones,
  hoveredZone,
  onZoneHover,
  devices,
  layers,
  selectedDeviceId,
  onDeviceClick,
  onDeviceHover,
  deviceHoverEnabled = true,
  floorPlanImageHref,
  resolveDeviceTypeColor,
  devMode,
  placeMode,
  onSvgClick,
  onSvgMouseDown,
  svgRef,
}: FloorPlanSVGProps) {
  const layerRingForDevice = (device: Device): string => {
    const layer = layers.find((l) => l.id === device.layerId);
    return layer?.color ?? "#64748b";
  };

  const cursor =
    devMode || placeMode ? "crosshair" : undefined;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${IMG_WIDTH} ${IMG_HEIGHT}`}
      className="w-full h-full max-md:min-w-0 md:min-w-[800px]"
      style={{ cursor }}
      onClick={onSvgClick}
      onMouseDown={onSvgMouseDown}
    >
      {/* Floor plan image underlay */}
      <image
        href={floorPlanImageHref}
        x="0"
        y="0"
        width={IMG_WIDTH}
        height={IMG_HEIGHT}
        preserveAspectRatio="none"
        style={{ opacity: 0.45 }}
      />

      {/* Zone overlays */}
      {zones.map((zone) => {
        const isHovered = hoveredZone === zone.id;
        const showOutline = devMode || isHovered;
        return (
          <g key={zone.id}>
            <rect
              x={zone.bounds.x}
              y={zone.bounds.y}
              width={zone.bounds.width}
              height={zone.bounds.height}
              fill={isHovered ? "rgba(46, 125, 50, 0.18)" : devMode ? "rgba(46, 125, 50, 0.08)" : "transparent"}
              stroke={showOutline ? (isHovered ? "#4CAF50" : "#22c55e") : "transparent"}
              strokeWidth={isHovered ? 4 : devMode ? 3 : 0}
              strokeDasharray={devMode && !isHovered ? "12 6" : undefined}
              rx="4"
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => onZoneHover(zone.id)}
              onMouseLeave={() => onZoneHover(null)}
            />
            {devMode && (
              <text
                x={zone.bounds.x + zone.bounds.width / 2}
                y={zone.bounds.y + zone.bounds.height / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#4CAF50"
                fontSize="16"
                fontFamily="monospace"
                fontWeight="bold"
                style={{ pointerEvents: "none" }}
              >
                {zone.id}
              </text>
            )}
          </g>
        );
      })}

      {/* Device markers */}
      {devices.map((device) => (
        <DeviceMarker
          key={device.id}
          device={device}
          fillColor={resolveDeviceTypeColor(device.deviceTypeId)}
          layerRingColor={layerRingForDevice(device)}
          isSelected={selectedDeviceId === device.id}
          onClick={onDeviceClick}
          hoverEnabled={deviceHoverEnabled}
          onHoverChange={(d) => onDeviceHover(d?.id ?? null)}
        />
      ))}

      {/* Zone label tooltip on hover */}
      {hoveredZone && (() => {
        const zone = zones.find((z) => z.id === hoveredZone);
        if (!zone) return null;
        const tx = zone.bounds.x + zone.bounds.width / 2;
        const ty = zone.bounds.y - 14;
        return (
          <g>
            <rect x={tx - 110} y={ty - 32} width="220" height="36" fill="#1a2332" stroke="#2E7D32" strokeWidth="1.5" rx="6" />
            <text x={tx} y={ty - 9} textAnchor="middle" fill="#e2e8f0" fontSize="18" fontFamily="sans-serif" fontWeight="500">
              {zone.name}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}
