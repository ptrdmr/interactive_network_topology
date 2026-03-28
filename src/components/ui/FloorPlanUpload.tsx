"use client";

import { useRef, useState } from "react";
import { ImageIcon, RotateCcw } from "lucide-react";

interface FloorPlanUploadProps {
  hasCustomFloorPlan: boolean;
  onUpload: (file: File) => Promise<void>;
  onReset: () => void;
}

export function FloorPlanUpload({
  hasCustomFloorPlan,
  onUpload,
  onReset,
}: FloorPlanUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not use image");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted px-1">
        Floor plan
      </h3>
      <p className="text-[10px] text-text-muted px-1 leading-relaxed">
        Upload a PNG or JPG. It&apos;s fitted to the map grid and saved in this browser (and in JSON export).
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-50"
        >
          <ImageIcon className="w-4 h-4 shrink-0" />
          {hasCustomFloorPlan ? "Replace image" : "Upload image"}
        </button>
        {hasCustomFloorPlan && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setError(null);
              onReset();
            }}
            className="flex items-center justify-center px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            title="Use built-in default floor plan"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          className="hidden"
          onChange={handleChange}
        />
      </div>
      {error && (
        <p className="text-xs text-status-offline px-1">{error}</p>
      )}
    </div>
  );
}
