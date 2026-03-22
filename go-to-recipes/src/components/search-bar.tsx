"use client";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      type="text"
      placeholder="Search recipes..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border bg-background-elevated px-4 py-2 text-sm text-foreground placeholder:text-foreground-muted transition-colors focus:border-accent-amber/50 focus:outline-none focus:ring-1 focus:ring-accent-amber/30 sm:max-w-md"
    />
  );
}
