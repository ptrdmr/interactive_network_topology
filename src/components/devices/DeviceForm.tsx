"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Trash2, Plus, Minus } from "lucide-react";
import type { Device, DeviceProperty, DeviceStatus, PortSlot } from "@/types/device";
import type { Layer } from "@/types/layer";
import {
  DEVICE_TYPE_IDS,
  DEVICE_TYPE_LABELS,
  type DeviceTypeId,
} from "@/constants/deviceTypes";
import { getBrandOptionsForDeviceType } from "@/constants/deviceBrands";

interface DeviceFormProps {
  open: boolean;
  device: Device | null;
  mode: "create" | "edit";
  /** For “Connected device” port dropdown; excludes the device being edited. */
  allDevices: Device[];
  /** Layers on the current floor (for assigning logical layer). */
  layers: Layer[];
  excludeDeviceId: string;
  onSave: (patch: Partial<Device>) => void;
  onDelete?: () => void;
  onClose: () => void;
  /** Rack **enclosure** only (root on a rack layer, no parent): type is always Rack. */
  lockDeviceTypeToRack?: boolean;
}

const emptyProperty = (): DeviceProperty => ({ key: "", value: "" });

const emptyPortSlot = (): PortSlot => ({});

function slotHasData(s: PortSlot): boolean {
  return !!(
    s.label?.trim() ||
    s.notes?.trim() ||
    s.connectedDeviceId?.trim() ||
    s.remotePort?.trim()
  );
}

function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const tr = t.trim();
    if (!tr) continue;
    const k = tr.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(tr);
  }
  return out;
}

function cleanPortSlots(slots: PortSlot[]): PortSlot[] {
  return slots.map((s) => {
    const out: PortSlot = {};
    if (s.label?.trim()) out.label = s.label.trim();
    if (s.notes?.trim()) out.notes = s.notes.trim();
    if (s.connectedDeviceId?.trim()) out.connectedDeviceId = s.connectedDeviceId.trim();
    if (s.remotePort?.trim()) out.remotePort = s.remotePort.trim();
    return out;
  });
}

export function DeviceForm({
  open,
  device,
  mode,
  allDevices,
  layers,
  excludeDeviceId,
  onSave,
  onDelete,
  onClose,
  lockDeviceTypeToRack = false,
}: DeviceFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<DeviceStatus>("online");
  const [properties, setProperties] = useState<DeviceProperty[]>([]);
  const [portSlots, setPortSlots] = useState<PortSlot[]>([]);
  /** String so users can type multi-digit counts before blur. */
  const [portCountDraft, setPortCountDraft] = useState("0");
  const [deviceTypeId, setDeviceTypeId] = useState<DeviceTypeId>("other");
  const [brand, setBrand] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [physicalLocation, setPhysicalLocation] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [installDate, setInstallDate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  /** True when the user chose “Other…” or the saved brand isn’t in the current type’s list. */
  const [brandIsCustom, setBrandIsCustom] = useState(false);
  const [layerId, setLayerId] = useState("");
  const [rackFace, setRackFace] = useState<"front" | "back">("front");

  const effectiveTypeId: DeviceTypeId = lockDeviceTypeToRack ? "rack" : deviceTypeId;

  const brandOptions = useMemo(
    () => [...getBrandOptionsForDeviceType(effectiveTypeId)],
    [effectiveTypeId]
  );

  const brandSelectValue = useMemo(() => {
    if (!brand.trim() && !brandIsCustom) return "";
    if (brandIsCustom) return "__other__";
    if (brandOptions.includes(brand)) return brand;
    return "__other__";
  }, [brand, brandOptions, brandIsCustom]);

  const connectionOptions = useMemo(
    () =>
      [...allDevices]
        .filter((d) => d.id !== excludeDeviceId)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allDevices, excludeDeviceId]
  );

  useEffect(() => {
    if (!open || !device) return;
    setName(device.name);
    setDescription(device.description);
    setStatus(device.status);
    setProperties(
      device.properties.length > 0 ? device.properties.map((p) => ({ ...p })) : [emptyProperty()]
    );
    const slots = device.portSlots;
    const list =
      Array.isArray(slots) && slots.length > 0 ? slots.map((s) => ({ ...s })) : [];
    setPortSlots(list);
    setPortCountDraft(String(list.length));
    const tid = lockDeviceTypeToRack
      ? "rack"
      : (device.deviceTypeId ?? "other");
    setDeviceTypeId(tid);
    const opts = [...getBrandOptionsForDeviceType(tid)];
    const br = device.brand?.trim() ?? "";
    if (!br) {
      setBrand("");
      setBrandIsCustom(false);
    } else if (opts.includes(br)) {
      setBrand(br);
      setBrandIsCustom(false);
    } else {
      setBrand(device.brand ?? "");
      setBrandIsCustom(true);
    }
    setIpAddress(device.ipAddress ?? "");
    setMacAddress(device.macAddress ?? "");
    setPhysicalLocation(device.physicalLocation ?? "");
    setSerialNumber(device.serialNumber ?? "");
    setInstallDate(device.installDate ?? "");
    setTags(device.tags?.length ? [...device.tags] : []);
    setTagInput("");
    setLayerId(device.layerId);
    setRackFace(device.rackFace === "back" ? "back" : "front");
  }, [open, device, lockDeviceTypeToRack]);

  if (!open || !device) return null;

  const parentForRackFace =
    device.parentId != null
      ? allDevices.find((d) => d.id === device.parentId)
      : undefined;
  const showRackFaceSelector =
    !!device.parentId && parentForRackFace?.deviceTypeId === "rack";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const cleanedProps = properties
      .filter((p) => p.key.trim() || p.value.trim())
      .map((p) => ({ key: p.key.trim(), value: p.value.trim() }));
    const brandTrim = brand.trim();
    onSave({
      name: trimmed,
      layerId,
      description: description.trim(),
      status,
      deviceTypeId: lockDeviceTypeToRack ? "rack" : deviceTypeId,
      rackFace: showRackFaceSelector ? rackFace : undefined,
      brand: brandTrim || undefined,
      ipAddress: ipAddress.trim() || undefined,
      macAddress: macAddress.trim() || undefined,
      physicalLocation: physicalLocation.trim() || undefined,
      serialNumber: serialNumber.trim() || undefined,
      installDate: installDate.trim() || undefined,
      properties: cleanedProps,
      portSlots: cleanPortSlots(portSlots),
      tags: dedupeTags(tags),
    });
  };

  const addTagFromInput = () => {
    const t = tagInput.trim();
    if (!t) return;
    setTags((prev) => dedupeTags([...prev, t]));
    setTagInput("");
  };

  const addRow = () => setProperties((prev) => [...prev, emptyProperty()]);
  const removeRow = (index: number) =>
    setProperties((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  const updateProp = (index: number, field: keyof DeviceProperty, value: string) => {
    setProperties((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const applyPortCount = (n: number): boolean => {
    if (n === portSlots.length) return true;
    if (n < portSlots.length) {
      const tail = portSlots.slice(n);
      if (tail.some(slotHasData)) {
        if (
          !confirm(
            "Remove ports from the end? Any label, notes, or connection data on those ports will be lost."
          )
        ) {
          return false;
        }
      }
    }
    const next = portSlots.slice(0, n);
    while (next.length < n) next.push(emptyPortSlot());
    setPortSlots(next);
    return true;
  };

  const updatePortSlot = (index: number, field: keyof PortSlot, value: string) => {
    setPortSlots((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  return (
    <div className="fixed inset-0 z-[56] flex justify-end pointer-events-none">
      <button
        type="button"
        className="flex-1 bg-black/40 pointer-events-auto"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="pointer-events-auto w-full max-w-md h-full bg-bg-secondary border-l border-border shadow-2xl flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold text-text-primary">
            {mode === "create" ? "New device" : "Edit device"}
          </h2>
          <div className="flex items-center gap-1">
            {mode === "edit" && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this device?")) {
                    onDelete();
                    onClose();
                  }
                }}
                className="p-2 rounded-lg hover:bg-bg-hover text-status-offline"
                title="Delete device"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-bg-hover">
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="Device name"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Layer</label>
            <select
              value={layerId}
              onChange={(e) => setLayerId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              {layers.some((l) => l.id === layerId) ? null : (
                <option value={layerId}>Unknown layer</option>
              )}
              {layers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {showRackFaceSelector && (
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Rack side
              </label>
              <select
                value={rackFace}
                onChange={(e) =>
                  setRackFace(e.target.value === "back" ? "back" : "front")
                }
                className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                <option value="front">Front</option>
                <option value="back">Back</option>
              </select>
              <p className="text-[10px] text-text-muted mt-1.5">
                Equipment mounted on the front or rear of the enclosure.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DeviceStatus)}
              className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Device type</label>
            {lockDeviceTypeToRack ? (
              <>
                <div className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary">
                  {DEVICE_TYPE_LABELS.rack}
                </div>
                <p className="text-[10px] text-text-muted mt-1.5">
                  Rack enclosures always use this type. Layer color still shows as the outer ring on the map.
                </p>
              </>
            ) : (
              <>
                <p className="text-[10px] text-text-muted mb-1.5">
                  Fill color on the map. Layer color still shows as the outer ring.
                </p>
                <select
                  value={deviceTypeId}
                  onChange={(e) => {
                    const next = e.target.value as DeviceTypeId;
                    setDeviceTypeId(next);
                    const opts = [...getBrandOptionsForDeviceType(next)];
                    const b = brand.trim();
                    if (!b) setBrandIsCustom(false);
                    else if (!opts.includes(b)) setBrandIsCustom(true);
                    else setBrandIsCustom(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  {DEVICE_TYPE_IDS.map((id) => (
                    <option key={id} value={id}>
                      {DEVICE_TYPE_LABELS[id]}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Brand</label>
            <p className="text-[10px] text-text-muted mb-1.5">
              Suggestions depend on device type; choose Other to type any brand.
            </p>
            <select
              value={brandSelectValue}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  setBrand("");
                  setBrandIsCustom(false);
                } else if (v === "__other__") {
                  setBrandIsCustom(true);
                } else {
                  setBrand(v);
                  setBrandIsCustom(false);
                }
              }}
              className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="">— None —</option>
              {brandOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
              <option value="__other__">Other…</option>
            </select>
            {brandSelectValue === "__other__" && (
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="Brand name"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 resize-y min-h-[72px]"
              placeholder="Notes about this device…"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Tags</label>
            <p className="text-[10px] text-text-muted mb-1.5">
              Used for map search. Separate with comma or Enter; duplicates are ignored.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-bg-card border border-border text-xs text-text-primary"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                    className="p-0.5 rounded hover:bg-bg-hover text-text-muted"
                    aria-label={`Remove tag ${t}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTagFromInput();
                }
              }}
              onBlur={() => {
                if (tagInput.trim()) addTagFromInput();
              }}
              className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="e.g. building-a, wifi"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-text-muted mb-1.5">IP address</label>
              <input
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="e.g. 192.168.1.10"
                autoComplete="off"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-text-muted mb-1.5">MAC address</label>
              <input
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="e.g. aa:bb:cc:dd:ee:ff"
                autoComplete="off"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Physical location
              </label>
              <input
                value={physicalLocation}
                onChange={(e) => setPhysicalLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="Room, rack, building, landmark…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Serial number</label>
              <input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="Asset / OEM serial"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Install date</label>
              <input
                type="date"
                value={installDate}
                onChange={(e) => setInstallDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Number of ports</label>
            <input
              type="number"
              min={0}
              value={portCountDraft}
              onChange={(e) => setPortCountDraft(e.target.value)}
              onBlur={() => {
                const n = Math.max(0, Math.floor(Number(portCountDraft)) || 0);
                if (applyPortCount(n)) setPortCountDraft(String(n));
                else setPortCountDraft(String(portSlots.length));
              }}
              className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            <p className="text-[10px] text-text-muted mt-1">
              Set how many ports this device has, then fill in labels, notes, or links per port.
            </p>
          </div>

          {portSlots.length > 0 && (
            <div className="max-h-[min(50vh,320px)] overflow-y-auto rounded-lg border border-border/60 bg-bg-primary/30 p-2 space-y-3">
              {portSlots.map((slot, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border/50 bg-bg-card/80 p-3 space-y-2"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                    Port {index + 1}
                  </p>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-0.5">Label</label>
                    <input
                      value={slot.label ?? ""}
                      onChange={(e) => updatePortSlot(index, "label", e.target.value)}
                      placeholder="e.g. Gi0/1"
                      className="w-full px-2 py-1.5 rounded-md bg-bg-card border border-border text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-0.5">Notes</label>
                    <input
                      value={slot.notes ?? ""}
                      onChange={(e) => updatePortSlot(index, "notes", e.target.value)}
                      placeholder="VLAN, patch, etc."
                      className="w-full px-2 py-1.5 rounded-md bg-bg-card border border-border text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-0.5">Connected device</label>
                    <select
                      value={slot.connectedDeviceId ?? ""}
                      onChange={(e) => updatePortSlot(index, "connectedDeviceId", e.target.value)}
                      className="w-full px-2 py-1.5 rounded-md bg-bg-card border border-border text-xs"
                    >
                      <option value="">— None —</option>
                      {connectionOptions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-0.5">Remote port</label>
                    <input
                      value={slot.remotePort ?? ""}
                      onChange={(e) => updatePortSlot(index, "remotePort", e.target.value)}
                      placeholder="Far-end port name or number"
                      className="w-full px-2 py-1.5 rounded-md bg-bg-card border border-border text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-text-muted">Properties</label>
              <button
                type="button"
                onClick={addRow}
                className="text-xs flex items-center gap-1 text-accent-light hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add row
              </button>
            </div>
            <div className="space-y-2">
              {properties.map((prop, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <input
                    value={prop.key}
                    onChange={(e) => updateProp(index, "key", e.target.value)}
                    placeholder="Key"
                    className="flex-1 min-w-0 px-2 py-1.5 rounded-md bg-bg-card border border-border text-xs font-mono"
                  />
                  <input
                    value={prop.value}
                    onChange={(e) => updateProp(index, "value", e.target.value)}
                    placeholder="Value"
                    className="flex-1 min-w-0 px-2 py-1.5 rounded-md bg-bg-card border border-border text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="p-1.5 rounded hover:bg-bg-hover text-text-muted shrink-0"
                    title="Remove row"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm hover:bg-bg-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-2.5 rounded-lg bg-accent text-bg-primary text-sm font-medium hover:opacity-90 disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
