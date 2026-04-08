import { DEVICE_TYPE_LABELS } from "@/constants/deviceTypes";
import type { Device, DeviceProperty } from "@/types/device";
import type { FloorPlanDocument } from "@/types/floorPlan";

/** Escape one CSV field (RFC-style: quote if needed). */
export function csvEscapeCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatProperties(props: DeviceProperty[]): string {
  if (!props.length) return "";
  return props
    .filter((p) => p.key.trim() || p.value.trim())
    .map((p) => `${p.key.trim()}=${p.value.trim()}`)
    .join("; ");
}

function formatTags(tags: string[] | undefined): string {
  if (!tags?.length) return "";
  return tags.join("; ");
}

function formatPorts(device: Device, nameById: Map<string, string>): string {
  const slots = device.portSlots ?? [];
  if (slots.length === 0) return "";
  return slots
    .map((slot, i) => {
      const bits: string[] = [];
      if (slot.label?.trim()) bits.push(slot.label.trim());
      if (slot.notes?.trim()) bits.push(slot.notes.trim());
      if (slot.connectedDeviceId) {
        const target =
          nameById.get(slot.connectedDeviceId) ?? slot.connectedDeviceId;
        bits.push(`→${target}`);
      }
      if (slot.remotePort?.trim()) bits.push(`remote:${slot.remotePort.trim()}`);
      const inner = bits.length ? bits.join(" ") : "empty";
      return `P${i + 1}:${inner}`;
    })
    .join(" | ");
}

const HEADERS = [
  "floor_name",
  "layer_name",
  "device_id",
  "name",
  "device_type",
  "status",
  "description",
  "brand",
  "ip_address",
  "mac_address",
  "physical_location",
  "serial_number",
  "install_date",
  "parent_device_name",
  "rack_order",
  "rack_face",
  "map_x",
  "map_y",
  "properties",
  "tags",
  "ports_summary",
] as const;

/**
 * Flat inventory of every device on every floor — opens in Excel/Sheets.
 * Does not replace a JSON backup (no round-trip restore from this file).
 */
export function buildDeviceInventoryCsv(floors: FloorPlanDocument[]): string {
  const lines: string[] = [HEADERS.map((h) => csvEscapeCell(h)).join(",")];

  for (const fp of floors) {
    const layerName = new Map(fp.layers.map((l) => [l.id, l.name]));
    const nameById = new Map(fp.devices.map((d) => [d.id, d.name]));

    for (const d of fp.devices) {
      const parentName = d.parentId ? (nameById.get(d.parentId) ?? "") : "";
      const row = [
        fp.name,
        layerName.get(d.layerId) ?? "",
        d.id,
        d.name,
        DEVICE_TYPE_LABELS[d.deviceTypeId] ?? d.deviceTypeId,
        d.status,
        d.description ?? "",
        d.brand ?? "",
        d.ipAddress ?? "",
        d.macAddress ?? "",
        d.physicalLocation ?? "",
        d.serialNumber ?? "",
        d.installDate ?? "",
        parentName,
        d.rackOrder != null ? String(d.rackOrder) : "",
        d.rackFace ?? "",
        String(d.position?.x ?? ""),
        String(d.position?.y ?? ""),
        formatProperties(d.properties),
        formatTags(d.tags),
        formatPorts(d, nameById),
      ];
      lines.push(row.map((c) => csvEscapeCell(c)).join(","));
    }
  }

  return lines.join("\r\n");
}
