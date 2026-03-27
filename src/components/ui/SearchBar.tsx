"use client";

import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search devices..." }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-bg-card border border-border rounded-lg pl-9 pr-8 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-light transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-bg-hover transition-colors"
        >
          <X className="w-3.5 h-3.5 text-text-muted" />
        </button>
      )}
    </div>
  );
}
