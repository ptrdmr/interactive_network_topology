"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Plus, Minus } from "lucide-react";
import type { Device, DeviceProperty, DeviceStatus } from "@/types/device";

interface DeviceFormProps {
  open: boolean;
  device: Device | null;
  mode: "create" | "edit";
  onSave: (patch: Partial<Device>) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const emptyProperty = (): DeviceProperty => ({ key: "", value: "" });

export function DeviceForm({
  open,
  device,
  mode,
  onSave,
  onDelete,
  onClose,
}: DeviceFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<DeviceStatus>("online");
  const [properties, setProperties] = useState<DeviceProperty[]>([]);

  useEffect(() => {
    if (!open || !device) return;
    setName(device.name);
    setDescription(device.description);
    setStatus(device.status);
    setProperties(
      device.properties.length > 0 ? device.properties.map((p) => ({ ...p })) : [emptyProperty()]
    );
  }, [open, device]);

  if (!open || !device) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const cleanedProps = properties
      .filter((p) => p.key.trim() || p.value.trim())
      .map((p) => ({ key: p.key.trim(), value: p.value.trim() }));
    onSave({
      name: trimmed,
      description: description.trim(),
      status,
      properties: cleanedProps,
    });
  };

  const addRow = () => setProperties((prev) => [...prev, emptyProperty()]);
  const removeRow = (index: number) =>
    setProperties((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  const updateProp = (index: number, field: keyof DeviceProperty, value: string) => {
    setProperties((prev) =>
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
