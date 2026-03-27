"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";

interface ExportImportProps {
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
}

export function ExportImport({ onExport, onImport }: ExportImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      await onImport(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted px-1">
        Data
      </h3>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onExport}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary hover:bg-bg-hover transition-colors"
        >
          <Download className="w-4 h-4 shrink-0" />
          Export JSON
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-50"
        >
          <Upload className="w-4 h-4 shrink-0" />
          Import
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {error && (
        <p className="text-xs text-status-offline px-1">{error}</p>
      )}
    </div>
  );
}
