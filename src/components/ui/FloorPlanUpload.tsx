"use client";

import { useRef, useState } from "react";
import { ImageIcon, RotateCcw, X } from "lucide-react";

interface FloorPlanUploadProps {
  floorName: string;
  hasCustomFloorPlan: boolean;
  onUpload: (file: File) => Promise<void>;
  onReset: () => void;
}

export function FloorPlanUpload({
  floorName,
  hasCustomFloorPlan,
  onUpload,
  onReset,
}: FloorPlanUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ackReplace, setAckReplace] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    setAckReplace(false);
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setAckReplace(false);
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      await onUpload(file);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not use image");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    if (
      !confirm(
        "Remove the custom background for this floor and use the built-in default image? Device positions on the map are not changed."
      )
    ) {
      return;
    }
    setError(null);
    onReset();
    handleClose();
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted px-1">
        Background image
      </h3>
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary hover:bg-bg-hover transition-colors"
      >
        <ImageIcon className="w-4 h-4 shrink-0" />
        Floor plan image…
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 pointer-events-auto"
            aria-label="Close dialog"
            onClick={handleClose}
          />
          <div
            className="relative z-10 w-full max-w-md rounded-xl border border-border bg-bg-secondary shadow-2xl p-5 pointer-events-auto"
            role="dialog"
            aria-labelledby="floor-plan-image-title"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <h2
                id="floor-plan-image-title"
                className="text-sm font-bold text-text-primary"
              >
                Floor plan image
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-bg-hover text-text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-text-muted mb-3">
              Changes apply to <span className="text-text-primary font-medium">{floorName}</span>{" "}
              only. Placing and moving devices uses the same coordinate grid; only the bitmap
              underneath is replaced.
            </p>

            <label className="flex items-start gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={ackReplace}
                onChange={(e) => setAckReplace(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <span className="text-xs text-text-secondary leading-snug">
                I understand this replaces the background image for this floor.
              </span>
            </label>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={busy || !ackReplace}
                onClick={() => inputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-accent text-bg-primary text-sm font-medium hover:opacity-90 disabled:opacity-40"
              >
                <ImageIcon className="w-4 h-4 shrink-0" />
                {hasCustomFloorPlan ? "Choose new image" : "Upload image"}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={handleChange}
              />
              {hasCustomFloorPlan && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-status-offline hover:bg-bg-hover"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  Reset to default image
                </button>
              )}
            </div>
            {error && (
              <p className="text-xs text-status-offline mt-3">{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
