export const CAMERA_VARIANT_IDS = [
  "outdoor_turret",
  "varifocal_dome",
  "panoramic_bullet",
  "indoor_dome",
  "mini_dome",
  "ptz",
  "other_camera",
] as const;

export type CameraVariantId = (typeof CAMERA_VARIANT_IDS)[number];

export const CAMERA_VARIANT_LABELS: Record<CameraVariantId, string> = {
  outdoor_turret: "Outdoor turret",
  varifocal_dome: "Varifocal dome",
  panoramic_bullet: "Panoramic bullet",
  indoor_dome: "Indoor dome",
  mini_dome: "Mini dome",
  ptz: "PTZ",
  other_camera: "Other",
};

export const CAMERA_VARIANT_COLORS: Record<CameraVariantId, string> = {
  outdoor_turret: "#ef4444",
  varifocal_dome: "#22c55e",
  panoramic_bullet: "#6366f1",
  indoor_dome: "#3b82f6",
  mini_dome: "#eab308",
  ptz: "#f97316",
  other_camera: "#ec4899",
};

/** Fixed horizontal FOV angle (degrees) per variant — not editable per camera. */
export const CAMERA_VARIANT_FOV_DEG: Record<CameraVariantId, number> = {
  outdoor_turret: 80,
  varifocal_dome: 110,
  panoramic_bullet: 180,
  indoor_dome: 360,
  mini_dome: 90,
  ptz: 60,
  other_camera: 90,
};

export function isCameraVariantId(s: string): s is CameraVariantId {
  return (CAMERA_VARIANT_IDS as readonly string[]).includes(s);
}

export function normalizeCameraVariantId(raw: unknown): CameraVariantId | undefined {
  if (typeof raw !== "string") return undefined;
  return isCameraVariantId(raw) ? raw : undefined;
}
