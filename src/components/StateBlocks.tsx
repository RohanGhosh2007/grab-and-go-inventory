import { AlertTriangle } from "lucide-react";

export function SkeletonRows({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="skeleton h-6" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ErrorBlock({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return (
    <div className="glass-card animate-fade-up flex items-start gap-3 rounded-2xl p-5">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
      <div className="text-sm">
        <p className="font-semibold">Couldn&apos;t reach the inventory API</p>
        <p className="mt-1 text-muted-foreground">{message}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Start your backend and set the API base URL on the welcome page.
        </p>
      </div>
    </div>
  );
}
