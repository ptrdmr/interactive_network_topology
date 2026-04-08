"use client";

import { useState, useEffect, type ReactNode } from "react";
import * as LucideIcons from "lucide-react";
import { X, Trash2 } from "lucide-react";
import type { Layer, LayerKind } from "@/types/layer";

const ICON_OPTIONS = [
  "Layers",
  "Wifi",
  "Router",
  "Server",
  "Cable",
  "HardDrive",
  "Monitor",
  "Smartphone",
  "Radio",
  "Antenna",
  "Network",
  "EthernetPort",
  "Usb",
  "Zap",
  "MapPin",
] as const;

const DEFAULTS: Omit<Layer, "id"> = {
  name: "",
  icon: "Layers",
  color: "#3b82f6",
  description: "",
  visible: true,
  kind: "standard",
};

interface LayerFormProps {
  open: boolean;
  mode: "create" | "edit" | "merge";
  initial?: Layer | null;
  /** Extra content above the form (e.g. layer checkboxes for merge). */
  topSlot?: ReactNode;
  /** When true, submit stays disabled (e.g. fewer than two layers selected to merge). */
  submitDisabled?: boolean;
  onSave: (layer: Omit<Layer, "id">) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function LayerForm({
  open,
  mode,
  initial,
  topSlot,
  submitDisabled = false,
  onSave,
  onDelete,
  onClose,
}: LayerFormProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>(DEFAULTS.icon);
  const [color, setColor] = useState(DEFAULTS.color);
  const [description, setDescription] = useState("");
  const [visible, setVisible] = useState(true);
  const [kind, setKind] = useState<LayerKind>("standard");

  useEffect(() => {
    if (!open) return;
    const src = initial;
    if (src) {
      setName(src.name);
      setIcon(src.icon);
      setColor(src.color);
      setDescription(src.description);
      setVisible(src.visible);
      setKind(src.kind === "server" ? "server" : "standard");
    } else {
      setName(DEFAULTS.name);
      setIcon(DEFAULTS.icon);
      setColor(DEFAULTS.color);
      setDescription(DEFAULTS.description);
      setVisible(DEFAULTS.visible);
      setKind("standard");
    }
  }, [open, initial, mode]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({
      name: trimmed,
      icon,
      color,
      description: description.trim(),
      visible,
      kind,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[55] flex justify-end pointer-events-none">
      <button
        type="button"
        className="flex-1 bg-black/40 pointer-events-auto"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="pointer-events-auto w-full max-w-md h-full bg-bg-secondary border-l border-border shadow-2xl flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold text-text-primary">
            {mode === "create"
              ? "New layer"
              : mode === "merge"
                ? "Merge layers"
                : "Edit layer"}
          </h2>
          <div className="flex items-center gap-1">
            {mode === "edit" && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this layer and all its devices?")) {
                    onDelete();
                    onClose();
                  }
                }}
                className="p-2 rounded-lg hover:bg-bg-hover text-status-offline"
                title="Delete layer"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-bg-hover"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {topSlot}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Layer type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setKind("standard")}
                className={`px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                  kind === "standard"
                    ? "border-accent bg-accent/15 text-text-primary"
                    : "border-border bg-bg-card text-text-muted hover:bg-bg-hover"
                }`}
              >
                <span className="block font-medium">Standard</span>
                <span className="block text-[10px] text-text-muted mt-0.5">One device per map click</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setKind("server");
                  if (!initial && icon === "Layers") setIcon("Server");
                }}
                className={`px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                  kind === "server"
                    ? "border-accent bg-accent/15 text-text-primary"
                    : "border-border bg-bg-card text-text-muted hover:bg-bg-hover"
                }`}
              >
                <span className="block font-medium">Server rack</span>
                <span className="block text-[10px] text-text-muted mt-0.5">Map = enclosure; stack units inside</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="e.g. Access Points"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Color</label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 rounded cursor-pointer border border-border bg-transparent"
              />
              <input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-bg-card border border-border text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Icon</label>
            <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1">
              {ICON_OPTIONS.map((nameOpt) => {
                const Cmp =
                  (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[nameOpt] ??
                  LucideIcons.Circle;
                const sel = icon === nameOpt;
                return (
                  <button
                    key={nameOpt}
                    type="button"
                    onClick={() => setIcon(nameOpt)}
                    className={`p-2 rounded-lg border transition-colors ${
                      sel ? "border-accent bg-accent/20" : "border-border hover:bg-bg-hover"
                    }`}
                    title={nameOpt}
                  >
                    <Cmp className="w-5 h-5 mx-auto" />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 resize-y min-h-[100px]"
              placeholder="What this layer represents…"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm text-text-primary">Visible on map</span>
          </label>

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
              disabled={!name.trim() || submitDisabled}
              className="flex-1 py-2.5 rounded-lg bg-accent text-bg-primary text-sm font-medium hover:opacity-90 disabled:opacity-40"
            >
              {mode === "create"
                ? "Create"
                : mode === "merge"
                  ? "Merge layers"
                  : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
