"use client";

import { useState, useEffect } from "react";
import {
  X,
  Server,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Circle,
  ArrowUpRight,
  Pencil,
  Trash2,
  Move,
  Network,
} from "lucide-react";
import type { Device } from "@/types/device";
import { DEVICE_TYPE_LABELS } from "@/constants/deviceTypes";
import { Badge } from "@/components/ui/Badge";
import { ServerRackStack } from "./ServerRackStack";

interface DeviceDetailPanelProps {
  device: Device;
  layerName: string;
  rackColor: string;
  /** Per-unit layer name/color for rack stack rows (units may differ from enclosure). */
  resolveLayerMeta: (layerId: string) => { name: string; color: string };
  /** Map marker fill colors for device types (rack unit accent + hover preview). */
  resolveDeviceTypeColor: (typeId: Device["deviceTypeId"]) => string;
  children: Device[];
  connectedDevices: Device[];
  /** Resolve port link targets by id (for names and navigation). */
  getDeviceById: (id: string) => Device | undefined;
  onClose: () => void;
  /** Rack units: return to the enclosure (parent) view */
  onBackToParent?: () => void;
  parentDeviceName?: string;
  onSelectDevice: (device: Device) => void;
  onEdit: () => void;
  onDelete: () => void;
  /** Rack layer + map-level enclosure: visual stack + add units */
  onAddRackUnit?: () => void;
  onMoveRackUnit?: (childId: string, direction: -1 | 1) => void;
  /** Map-only devices: arrow-key reposition mode */
  canRepositionOnMap?: boolean;
  repositionMode?: boolean;
  onEnterRepositionMode?: () => void;
  onExitRepositionMode?: () => void;
  /** Topology view: narrow graph to this device's neighborhood */
  onFocusInTopology?: () => void;
}

function formatInstallDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

function DeviceListItem({ device, onClick }: { device: Device; onClick: () => void }) {
  const subtitle =
    device.ipAddress?.trim() ||
    (device.properties[0] != null
      ? `${device.properties[0].key}: ${device.properties[0].value}`
      : device.description || "—");

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-bg-primary/50 hover:bg-bg-hover border border-border/30 transition-colors text-left group"
    >
      <Circle
        className={`w-2.5 h-2.5 shrink-0 fill-current ${
          device.status === "online"
            ? "text-status-online"
            : device.status === "offline"
            ? "text-status-offline"
            : "text-status-maintenance"
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-text-primary truncate">{device.name}</p>
        <p className="text-[10px] text-text-muted truncate">{subtitle}</p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  );
}

export function DeviceDetailPanel({
  device,
  layerName,
  rackColor,
  resolveLayerMeta,
  resolveDeviceTypeColor,
  children,
  connectedDevices,
  getDeviceById,
  onClose,
  onBackToParent,
  parentDeviceName,
  onSelectDevice,
  onEdit,
  onDelete,
  onAddRackUnit,
  onMoveRackUnit,
  canRepositionOnMap,
  repositionMode,
  onEnterRepositionMode,
  onExitRepositionMode,
  onFocusInTopology,
}: DeviceDetailPanelProps) {
  const [portsExpanded, setPortsExpanded] = useState(false);

  useEffect(() => {
    setPortsExpanded(false);
  }, [device.id]);

  const showRackStack =
    device.deviceTypeId === "rack" &&
    !device.parentId &&
    onAddRackUnit &&
    onMoveRackUnit;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-full flex-col border-l border-border bg-bg-secondary shadow-2xl animate-slide-in sm:max-w-md lg:w-96 lg:max-w-[24rem] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)]">
      {/* Header */}
      <div className="flex flex-col gap-2 px-5 py-4 border-b border-border">
        {onBackToParent && (
          <button
            type="button"
            onClick={onBackToParent}
            className="self-start flex items-center gap-1.5 rounded-lg px-2 py-1.5 -ml-2 text-xs font-medium text-accent-light hover:bg-bg-hover transition-colors"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            Back to {parentDeviceName ?? "rack"}
          </button>
        )}
        <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-text-primary truncate">{device.name}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge status={device.status} />
            <span className="text-xs text-text-muted">{layerName}</span>
            <span className="text-[10px] text-text-muted/90 px-1.5 py-0.5 rounded bg-bg-card border border-border/50">
              {DEVICE_TYPE_LABELS[device.deviceTypeId]}
            </span>
            {device.deviceTypeId === "rack" && !device.parentId && (
              <span className="text-[10px] uppercase tracking-wide text-accent-light font-semibold">
                Enclosure
              </span>
            )}
          </div>
          {(device.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(device.tags ?? []).map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-1.5 py-0.5 rounded-md bg-bg-card border border-border/60 text-text-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-bg-hover text-text-muted hover:text-accent-light"
            title="Edit device"
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete “${device.name}”?`)) onDelete();
            }}
            className="p-2 rounded-lg hover:bg-bg-hover text-text-muted hover:text-status-offline"
            title="Delete device"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>
        </div>
      </div>

      {canRepositionOnMap && onEnterRepositionMode && onExitRepositionMode && (
        <div className="px-5 py-3 border-b border-border bg-amber-500/10">
          {repositionMode ? (
            <button
              type="button"
              onClick={onExitRepositionMode}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-amber-500/50 bg-bg-card text-sm font-medium text-amber-100 hover:bg-bg-hover transition-colors"
            >
              Done moving
            </button>
          ) : (
            <button
              type="button"
              onClick={onEnterRepositionMode}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border bg-bg-card text-sm font-medium text-text-primary hover:bg-bg-hover transition-colors"
            >
              <Move className="w-4 h-4 shrink-0" />
              Move on map (arrow keys)
            </button>
          )}
        </div>
      )}

      {onFocusInTopology && (
        <div className="px-5 py-3 border-b border-border bg-accent/10">
          <button
            type="button"
            onClick={onFocusInTopology}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-accent/40 bg-bg-card text-sm font-medium text-accent-light hover:bg-bg-hover transition-colors"
          >
            <Network className="w-4 h-4 shrink-0" />
            Focus topology on this device
          </button>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {device.description && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Description</h3>
            <p className="text-xs text-text-secondary bg-bg-card rounded-lg px-3 py-2.5 leading-relaxed">
              {device.description}
            </p>
          </section>
        )}

        {(!!device.brand?.trim() ||
          !!device.ipAddress?.trim() ||
          !!device.macAddress?.trim() ||
          !!device.physicalLocation?.trim() ||
          !!device.serialNumber?.trim() ||
          !!device.installDate?.trim()) && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
              Device details
            </h3>
            <div className="bg-bg-card rounded-lg px-3 py-1 divide-y divide-border/40">
              {device.brand?.trim() && (
                <div className="flex justify-between gap-2 py-2 first:pt-1 last:pb-1">
                  <span className="text-xs text-text-muted shrink-0">Brand</span>
                  <span className="text-xs text-text-primary text-right break-words">{device.brand.trim()}</span>
                </div>
              )}
              {device.ipAddress?.trim() && (
                <div className="flex justify-between gap-2 py-2 first:pt-1 last:pb-1">
                  <span className="text-xs text-text-muted shrink-0">IP address</span>
                  <span className="text-xs text-text-primary font-mono text-right break-all">
                    {device.ipAddress.trim()}
                  </span>
                </div>
              )}
              {device.macAddress?.trim() && (
                <div className="flex justify-between gap-2 py-2 first:pt-1 last:pb-1">
                  <span className="text-xs text-text-muted shrink-0">MAC address</span>
                  <span className="text-xs text-text-primary font-mono text-right break-all">
                    {device.macAddress.trim()}
                  </span>
                </div>
              )}
              {device.physicalLocation?.trim() && (
                <div className="flex justify-between gap-2 py-2 first:pt-1 last:pb-1">
                  <span className="text-xs text-text-muted shrink-0">Physical location</span>
                  <span className="text-xs text-text-primary text-right break-words">
                    {device.physicalLocation.trim()}
                  </span>
                </div>
              )}
              {device.serialNumber?.trim() && (
                <div className="flex justify-between gap-2 py-2 first:pt-1 last:pb-1">
                  <span className="text-xs text-text-muted shrink-0">Serial number</span>
                  <span className="text-xs text-text-primary font-mono text-right break-all">
                    {device.serialNumber.trim()}
                  </span>
                </div>
              )}
              {device.installDate?.trim() && (
                <div className="flex justify-between gap-2 py-2 first:pt-1 last:pb-1">
                  <span className="text-xs text-text-muted shrink-0">Install date</span>
                  <span className="text-xs text-text-primary text-right">
                    {formatInstallDate(device.installDate.trim())}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {device.properties.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" /> Properties
            </h3>
            <div className="bg-bg-card rounded-lg px-3 py-1 divide-y divide-border/40">
              {device.properties.map((prop, i) => (
                <div key={i} className="flex justify-between gap-2 py-2 first:pt-1 last:pb-1">
                  <span className="text-xs text-text-muted shrink-0">{prop.key || "—"}</span>
                  <span className="text-xs text-text-primary font-mono text-right break-all">{prop.value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {device.portSlots && device.portSlots.length > 0 && (
          <section>
            <button
              type="button"
              onClick={() => setPortsExpanded((v) => !v)}
              className="w-full flex items-center gap-2 mb-2 text-left rounded-lg px-2 py-1.5 -mx-2 hover:bg-bg-hover/80 transition-colors"
            >
              {portsExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 shrink-0 text-text-muted" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 shrink-0 text-text-muted" />
              )}
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5" /> Ports ({device.portSlots.length})
              </span>
            </button>
            {portsExpanded && (
            <div className="space-y-2">
              {device.portSlots.map((slot, i) => {
                const target = slot.connectedDeviceId
                  ? getDeviceById(slot.connectedDeviceId)
                  : undefined;
                const hasBody =
                  !!(slot.label?.trim() ||
                    slot.notes?.trim() ||
                    slot.connectedDeviceId?.trim() ||
                    slot.remotePort?.trim());
                if (!hasBody) {
                  return (
                    <div
                      key={i}
                      className="rounded-lg border border-border/50 bg-bg-card/60 px-3 py-2 text-xs text-text-muted"
                    >
                      Port {i + 1} — <span className="italic">empty</span>
                    </div>
                  );
                }
                return (
                  <div
                    key={i}
                    className="rounded-lg border border-border/50 bg-bg-card/90 px-3 py-2 space-y-1"
                  >
                    <p className="text-xs font-medium text-text-primary">
                      Port {i + 1}
                      {slot.label?.trim() ? (
                        <span className="text-text-muted font-mono font-normal"> · {slot.label.trim()}</span>
                      ) : null}
                    </p>
                    {slot.notes?.trim() && (
                      <p className="text-[11px] text-text-secondary leading-snug">{slot.notes.trim()}</p>
                    )}
                    {(slot.connectedDeviceId || slot.remotePort?.trim()) && (
                      <p className="text-[11px] text-text-muted flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                        {slot.connectedDeviceId ? (
                          target ? (
                            <button
                              type="button"
                              onClick={() => onSelectDevice(target)}
                              className="text-accent-light hover:underline text-left"
                            >
                              → {target.name}
                            </button>
                          ) : (
                            <span>→ Unknown device ({slot.connectedDeviceId})</span>
                          )
                        ) : null}
                        {slot.connectedDeviceId && slot.remotePort?.trim() ? (
                          <span className="text-text-muted">·</span>
                        ) : null}
                        {slot.remotePort?.trim() ? (
                          <span className="text-text-secondary">{slot.remotePort.trim()}</span>
                        ) : null}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </section>
        )}

        {showRackStack && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" /> Server stack
            </h3>
            <ServerRackStack
              rackColor={rackColor}
              resolveLayerMeta={resolveLayerMeta}
              resolveDeviceTypeColor={resolveDeviceTypeColor}
              // eslint-disable-next-line react/no-children-prop -- ServerRackStack rack units list
              children={children}
              onSelectDevice={onSelectDevice}
              onAddUnit={onAddRackUnit}
              onMoveUnit={(childId, direction) => onMoveRackUnit(childId, direction)}
            />
          </section>
        )}

        {!showRackStack && children.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" /> Contains ({children.length})
            </h3>
            <div className="space-y-1.5">
              {children.map((child) => (
                <DeviceListItem
                  key={child.id}
                  device={child}
                  onClick={() => onSelectDevice(child)}
                />
              ))}
            </div>
          </section>
        )}

        {connectedDevices.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> Linked devices ({connectedDevices.length})
            </h3>
            <p className="text-[10px] text-text-muted mb-2">
              Devices with a property value matching this device&apos;s id.
            </p>
            <div className="space-y-1.5">
              {connectedDevices.map((cd) => (
                <DeviceListItem
                  key={cd.id}
                  device={cd}
                  onClick={() => onSelectDevice(cd)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
