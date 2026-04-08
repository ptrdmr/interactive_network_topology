import type { Device } from "@/types/device";

/** Case-insensitive match against common device text (name, description, custom fields, ports, properties). */
export function deviceMatchesSearch(device: Device, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const str = (s: string | undefined) => (s ?? "").toLowerCase();
  if (str(device.name).includes(q)) return true;
  if (str(device.description).includes(q)) return true;

  for (const f of [
    device.brand,
    device.ipAddress,
    device.macAddress,
    device.physicalLocation,
    device.serialNumber,
    device.installDate,
  ]) {
    if (str(f).includes(q)) return true;
  }

  for (const p of device.properties) {
    if (str(p.key).includes(q) || str(p.value).includes(q)) return true;
  }

  for (const t of device.tags) {
    if (str(t).includes(q)) return true;
  }

  for (const slot of device.portSlots ?? []) {
    if (
      str(slot.label).includes(q) ||
      str(slot.notes).includes(q) ||
      str(slot.remotePort).includes(q)
    ) {
      return true;
    }
  }

  return false;
}
