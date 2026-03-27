import { Circle } from "lucide-react";
import type { DeviceStatus } from "@/types/device";

const statusConfig: Record<DeviceStatus, { label: string; colorClass: string }> = {
  online: { label: "Online", colorClass: "text-status-online" },
  offline: { label: "Offline", colorClass: "text-status-offline" },
  maintenance: { label: "Maintenance", colorClass: "text-status-maintenance" },
};

interface BadgeProps {
  status: DeviceStatus;
}

export function Badge({ status }: BadgeProps) {
  const config = statusConfig[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <Circle className={`w-2 h-2 fill-current ${config.colorClass}`} />
      <span className={config.colorClass}>{config.label}</span>
    </span>
  );
}
