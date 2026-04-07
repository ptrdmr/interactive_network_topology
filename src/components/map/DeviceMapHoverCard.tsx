import type { Device } from "@/types/device";
import { DEVICE_TYPE_LABELS } from "@/constants/deviceTypes";

function formatInstallDateLabel(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

const STATUS_LABEL: Record<Device["status"], string> = {
  online: "Online",
  offline: "Offline",
  maintenance: "Maintenance",
};

function statusClass(status: Device["status"]): string {
  if (status === "online") return "text-status-online";
  if (status === "offline") return "text-status-offline";
  return "text-status-maintenance";
}

/** Large docked panel for device info while hovering a map marker (screen space, not SVG). */
export function DeviceMapDockPanel({
  device,
  layerName,
}: {
  device: Device;
  layerName: string;
}) {
  const typeLabel = DEVICE_TYPE_LABELS[device.deviceTypeId] ?? "Device";
  const desc = device.description?.trim();
  const portCount = device.portSlots?.length ?? 0;
  const hasStructuredDetails =
    !!device.brand?.trim() ||
    !!device.ipAddress?.trim() ||
    !!device.macAddress?.trim() ||
    !!device.physicalLocation?.trim() ||
    !!device.serialNumber?.trim() ||
    !!device.installDate?.trim();

  return (
    <div className="rounded-xl border-2 border-accent/50 bg-bg-card/98 shadow-2xl backdrop-blur-md text-left overflow-hidden flex flex-col max-h-[min(42vh,22rem)] w-full">
      <div className="px-4 py-3 border-b border-border bg-bg-secondary/80 shrink-0">
        <p className="text-lg font-semibold text-text-primary leading-snug">{device.name}</p>
        <p className="mt-1 text-sm text-text-muted">
          {typeLabel}
          <span className="text-border"> · </span>
          {layerName}
        </p>
        <p className={`mt-2 text-sm font-semibold ${statusClass(device.status)}`}>
          {STATUS_LABEL[device.status]}
        </p>
      </div>
      <div className="px-4 py-3 space-y-3 overflow-y-auto min-h-0 flex-1">
        {desc ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Description</p>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap break-words">{desc}</p>
          </div>
        ) : null}
        {hasStructuredDetails ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted mb-2">Device details</p>
            <dl className="space-y-2 text-sm">
              {device.brand?.trim() ? (
                <div className="grid grid-cols-[minmax(5rem,32%)_1fr] gap-x-2">
                  <dt className="text-text-muted">Brand</dt>
                  <dd className="text-text-primary break-words">{device.brand.trim()}</dd>
                </div>
              ) : null}
              {device.ipAddress?.trim() ? (
                <div className="grid grid-cols-[minmax(5rem,32%)_1fr] gap-x-2">
                  <dt className="text-text-muted">IP</dt>
                  <dd className="text-text-primary font-mono break-all">{device.ipAddress.trim()}</dd>
                </div>
              ) : null}
              {device.macAddress?.trim() ? (
                <div className="grid grid-cols-[minmax(5rem,32%)_1fr] gap-x-2">
                  <dt className="text-text-muted">MAC</dt>
                  <dd className="text-text-primary font-mono break-all">{device.macAddress.trim()}</dd>
                </div>
              ) : null}
              {device.physicalLocation?.trim() ? (
                <div className="grid grid-cols-[minmax(5rem,32%)_1fr] gap-x-2">
                  <dt className="text-text-muted">Location</dt>
                  <dd className="text-text-primary break-words">{device.physicalLocation.trim()}</dd>
                </div>
              ) : null}
              {device.serialNumber?.trim() ? (
                <div className="grid grid-cols-[minmax(5rem,32%)_1fr] gap-x-2">
                  <dt className="text-text-muted">Serial</dt>
                  <dd className="text-text-primary font-mono break-all">{device.serialNumber.trim()}</dd>
                </div>
              ) : null}
              {device.installDate?.trim() ? (
                <div className="grid grid-cols-[minmax(5rem,32%)_1fr] gap-x-2">
                  <dt className="text-text-muted">Installed</dt>
                  <dd className="text-text-primary">
                    {formatInstallDateLabel(device.installDate.trim())}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}
        {portCount > 0 ? (
          <p className="text-sm text-text-muted">
            <span className="font-medium text-text-secondary">Ports</span> — {portCount} configured
          </p>
        ) : null}
        {device.properties.length > 0 ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted mb-2">Properties</p>
            <dl className="space-y-2">
              {device.properties.map((p, i) => (
                <div
                  key={`${p.key}-${i}`}
                  className="grid grid-cols-[minmax(6rem,30%)_1fr] gap-x-3 gap-y-1 text-sm border-b border-border/40 pb-2 last:border-0 last:pb-0"
                >
                  <dt className="font-medium text-text-secondary shrink-0">{p.key}</dt>
                  <dd className="text-text-primary break-words">{p.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
        {!desc &&
        portCount === 0 &&
        device.properties.length === 0 &&
        !hasStructuredDetails ? (
          <p className="text-sm text-text-muted italic">No extra details for this device.</p>
        ) : null}
      </div>
    </div>
  );
}
