/** Built-in device categories for map fill color; layer still shows as an outer ring. */
export const DEVICE_TYPE_IDS = [
  "switch",
  "router",
  "access_point",
  "firewall",
  "server",
  "camera",
  "printer",
  "patch_panel",
  "other",
] as const;

export type DeviceTypeId = (typeof DEVICE_TYPE_IDS)[number];

export const DEVICE_TYPE_LABELS: Record<DeviceTypeId, string> = {
  switch: "Switch",
  router: "Router",
  access_point: "Access point",
  firewall: "Firewall",
  server: "Server",
  camera: "Camera",
  printer: "Printer",
  patch_panel: "Patch panel",
  other: "Other",
};

/** Default fill colors for markers (overridable in settings). */
export const DEFAULT_DEVICE_TYPE_COLORS: Record<DeviceTypeId, string> = {
  switch: "#22c55e",
  router: "#3b82f6",
  access_point: "#a855f7",
  firewall: "#f97316",
  server: "#64748b",
  camera: "#ec4899",
  printer: "#eab308",
  patch_panel: "#14b8a6",
  other: "#94a3b8",
};

export function isDeviceTypeId(s: string): s is DeviceTypeId {
  return (DEVICE_TYPE_IDS as readonly string[]).includes(s);
}

export function normalizeDeviceTypeId(raw: unknown): DeviceTypeId {
  if (typeof raw === "string" && isDeviceTypeId(raw)) return raw;
  return "other";
}
