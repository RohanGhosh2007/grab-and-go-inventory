import { Link, useRouterState } from "@tanstack/react-router";
import { Boxes } from "lucide-react";

import { STAGES } from "@/lib/stages";
import { cn } from "@/lib/utils";

export function StageNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeIdx = Math.max(
    0,
    STAGES.findIndex((s) => s.to === pathname),
  );
  const progress = (activeIdx / (STAGES.length - 1)) * 100;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="brand-gradient flex size-9 items-center justify-center rounded-xl text-primary-foreground shadow-[var(--shadow-glow)]">
            <Boxes className="size-5" />
          </span>
          <span className="text-sm font-extrabold tracking-tight">Auto Inventory</span>
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-1 overflow-x-auto">
          {STAGES.map((stage, i) => {
            const active = i === activeIdx;
            const done = i < activeIdx;
            return (
              <Link
                key={stage.to}
                to={stage.to}
                className={cn(
                  "group flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-300",
                  active
                    ? "brand-gradient text-primary-foreground shadow-[var(--shadow-glow)]"
                    : done
                      ? "text-foreground/85 hover:bg-secondary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <span className={cn("font-mono text-[10px]", !active && "text-primary")}>
                  {stage.index}
                </span>
                <span className="hidden sm:inline">{stage.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="h-0.5 w-full bg-secondary">
        <div
          className="brand-gradient h-full transition-[width] duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </header>
  );
}
