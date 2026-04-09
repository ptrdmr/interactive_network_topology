import type { DeviceTypeId } from "@/constants/deviceTypes";

/**
 * Vertical tier for topology layout (lower = higher in top-to-bottom graphs).
 * Aligns with common network diagram conventions: core at top, endpoints/infra lower.
 */
export const TOPOLOGY_TIER: Record<DeviceTypeId, number> = {
  router: 0,
  firewall: 0,
  switch: 1,
  patch_panel: 1,
  data_drop: 2,
  access_point: 2,
  server: 3,
  server_backup: 3,
  dvr: 3,
  satellite_cable_tv: 3,
  camera: 3,
  printer: 3,
  power_supply: 4,
  battery_backup: 4,
  power_conditioner: 4,
  rack: 5,
  other: 5,
};

/** Collapsed layer group nodes sit mid-stack so edges can route sensibly. */
export const TOPOLOGY_GROUP_RANK = 2;

export const TOPOLOGY_TIER_LABELS: Record<number, string> = {
  0: "Core",
  1: "Distribution",
  2: "Access",
  3: "Endpoints",
  4: "Infrastructure",
  5: "Other",
};

/**
 * Physical links are undirected; dagre uses edge direction for TB layout.
 * Orient core/WAN-side types (lower tier number) → downstream so hierarchy matches reality.
 */
export function orientEdgeForStackLayout(
  idA: string,
  tierA: number,
  idB: string,
  tierB: number
): { source: string; target: string } {
  if (tierA !== tierB) {
    return tierA < tierB
      ? { source: idA, target: idB }
      : { source: idB, target: idA };
  }
  return idA < idB
    ? { source: idA, target: idB }
    : { source: idB, target: idA };
}
