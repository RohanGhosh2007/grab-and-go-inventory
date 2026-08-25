import { Plug } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { getApiUrl, setApiUrl } from "@/lib/api";

/**
 * The original app used a same-origin API base (`const API_URL = ""`).
 * This keeps that default but lets you point the UI at your running
 * FastAPI backend (e.g. http://localhost:8000) without touching code.
 */
export function ApiSettings() {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(getApiUrl());
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setApiUrl(value);
        toast.success("Backend URL saved", { description: value || "same origin" });
        window.location.reload();
      }}
      className="glass-card flex flex-wrap items-center gap-3 rounded-2xl p-4"
    >
      <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
        <Plug className="size-4 text-primary" /> API base
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. http://localhost:8000 (blank = same origin)"
        className="min-w-0 flex-1 rounded-xl border border-input bg-background/60 px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
      />
      <button className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary/70">
        Save
      </button>
    </form>
  );
}
