"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import {
  DEVICE_TYPE_IDS,
  DEVICE_TYPE_LABELS,
  DEFAULT_DEVICE_TYPE_COLORS,
} from "@/constants/deviceTypes";
import { useAppState } from "@/hooks/useAppState";

export default function DeviceTypeColorsSettingsPage() {
  const {
    hydrated,
    deviceTypeColorOverrides,
    resolveDeviceTypeColor,
    setDeviceTypeColorOverride,
    resetDeviceTypeColorOverrides,
  } = useAppState();

  if (!hydrated) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary text-text-muted text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-bg-primary">
      <header className="border-b border-border bg-bg-secondary/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-accent-light hover:underline mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to floor plans
          </Link>
          <h1 className="text-lg font-bold text-text-primary">Device type colors</h1>
          <p className="text-sm text-text-muted mt-1">
            Map markers use these colors for the <strong className="text-text-secondary">fill</strong>{" "}
            by device type. Each device&apos;s <strong className="text-text-secondary">layer</strong> still
            appears as the outer ring on the map.
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-16 space-y-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  "Reset all device type colors to built-in defaults? Your custom colors will be removed."
                )
              ) {
                resetDeviceTypeColorOverrides();
              }
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-text-muted hover:text-text-primary hover:bg-bg-hover"
          >
            <RotateCcw className="w-4 h-4" />
            Reset all to defaults
          </button>
        </div>

        <ul className="rounded-xl border border-border bg-bg-secondary divide-y divide-border/60 overflow-hidden">
          {DEVICE_TYPE_IDS.map((id) => {
            const defaultHex = DEFAULT_DEVICE_TYPE_COLORS[id];
            const effective = resolveDeviceTypeColor(id);
            const isOverridden = deviceTypeColorOverrides[id] != null;

            return (
              <li
                key={id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-bg-card/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {DEVICE_TYPE_LABELS[id]}
                  </p>
                  <p className="text-[10px] text-text-muted font-mono mt-0.5">
                    Default: {defaultHex}
                    {isOverridden && ` · saved: ${deviceTypeColorOverrides[id]}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className="w-10 h-10 rounded-lg border border-border shrink-0"
                    style={{ backgroundColor: effective }}
                    title={effective}
                  />
                  <input
                    type="color"
                    value={effective}
                    onChange={(e) => {
                      setDeviceTypeColorOverride(id, e.target.value);
                    }}
                    className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent"
                  />
                  <button
                    type="button"
                    disabled={!isOverridden}
                    onClick={() => setDeviceTypeColorOverride(id, null)}
                    className="text-xs text-accent-light hover:underline disabled:opacity-30 disabled:no-underline"
                  >
                    Use default
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
