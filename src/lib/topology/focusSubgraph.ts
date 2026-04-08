import type { Device } from "@/types/device";

/** Build undirected adjacency from port links and property refs. */
export function buildAdjacencyMap(devices: Device[]): Map<string, Set<string>> {
  const ids = new Set(devices.map((d) => d.id));
  const adj = new Map<string, Set<string>>();

  function addEdge(a: string, b: string) {
    if (a === b || !ids.has(a) || !ids.has(b)) return;
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  }

  for (const d of devices) {
    const slots = d.portSlots ?? [];
    for (const slot of slots) {
      const t = slot.connectedDeviceId;
      if (t) addEdge(d.id, t);
    }
    for (const p of d.properties) {
      const raw = p.value.trim();
      if (raw && raw !== d.id && ids.has(raw)) {
        addEdge(d.id, raw);
      }
    }
  }

  for (const d of devices) {
    if (!adj.has(d.id)) adj.set(d.id, new Set());
  }

  return adj;
}

/**
 * Shortest-hop distances from `startId` (start = 0). Neighbors are at 1, etc.
 * Stops expanding beyond `maxHops` (inclusive). `Infinity` = full connected component.
 */
export function bfsReachable(
  startId: string,
  adj: Map<string, Set<string>>,
  maxHops: number
): Map<string, number> {
  const dist = new Map<string, number>();
  const unlimited = !Number.isFinite(maxHops);

  if (!adj.has(startId)) {
    dist.set(startId, 0);
    return dist;
  }

  const queue: string[] = [startId];
  dist.set(startId, 0);
  let qi = 0;

  while (qi < queue.length) {
    const id = queue[qi++];
    const d = dist.get(id)!;
    for (const nb of adj.get(id) ?? []) {
      if (dist.has(nb)) continue;
      const nd = d + 1;
      if (!unlimited && nd > maxHops) continue;
      dist.set(nb, nd);
      queue.push(nb);
    }
  }

  return dist;
}

export function filterDevicesForFocus(
  allDevices: Device[],
  focusDeviceId: string,
  maxHops: number
): { devices: Device[]; distances: Map<string, number> } {
  const found = allDevices.some((d) => d.id === focusDeviceId);
  if (!found) {
    return { devices: [], distances: new Map() };
  }
  const adj = buildAdjacencyMap(allDevices);
  const distances = bfsReachable(focusDeviceId, adj, maxHops);
  const devices = allDevices.filter((d) => distances.has(d.id));
  return { devices, distances };
}
