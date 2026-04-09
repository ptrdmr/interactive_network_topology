"use client";

import type { Device } from "@/types/device";
import {
  CAMERA_VARIANT_COLORS,
  CAMERA_VARIANT_FOV_DEG,
} from "@/constants/cameraVariants";
import { cameraFovSectorPath } from "@/lib/cameraGeometry";

interface CameraFovLayerProps {
  devices: Device[];
  selectedDeviceId: string | null;
}

function hasCameraFov(d: Device): d is Device & {
  cameraVariant: NonNullable<Device["cameraVariant"]>;
  cameraBearingDeg: number;
  cameraRangePx: number;
} {
  return (
    d.deviceTypeId === "camera" &&
    d.cameraVariant != null &&
    d.cameraBearingDeg != null &&
    d.cameraRangePx != null
  );
}

export function CameraFovLayer({ devices, selectedDeviceId }: CameraFovLayerProps) {
  const cameras = devices.filter(hasCameraFov);

  return (
    <g aria-hidden style={{ pointerEvents: "none" }}>
      {cameras.map((device) => {
        const fovDeg = CAMERA_VARIANT_FOV_DEG[device.cameraVariant];
        const { x: cx, y: cy } = device.position;
        const dPath = cameraFovSectorPath(cx, cy, device.cameraBearingDeg, fovDeg, device.cameraRangePx);
        if (!dPath) return null;

        const fill = CAMERA_VARIANT_COLORS[device.cameraVariant];
        const selected = selectedDeviceId === device.id;

        return (
          <path
            key={device.id}
            d={dPath}
            fill={fill}
            fillOpacity={selected ? 0.35 : 0.2}
            stroke={fill}
            strokeOpacity={0.55}
            strokeWidth={1.5}
          />
        );
      })}
    </g>
  );
}
