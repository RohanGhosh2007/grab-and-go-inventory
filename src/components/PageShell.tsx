import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { StageNav } from "@/components/StageNav";
import { STAGES } from "@/lib/stages";

interface PageShellProps {
  stage: number; // 1-based
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function PageShell({
  stage,
  eyebrow,
  title,
  description,
  children,
  actions,
}: PageShellProps) {
  const prev = STAGES[stage - 2];
  const next = STAGES[stage];

  return (
    <div className="surface-gradient min-h-screen bg-background">
      <StageNav />
      <main key={stage} className="animate-fade-up mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          {eyebrow && (
            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">{eyebrow}</p>
          )}
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          {description && (
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {description}
            </p>
          )}
        </div>

        {children}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-6">
          {prev ? (
            <Link
              to={prev.to}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-5 py-2.5 text-sm font-semibold transition-all hover:-translate-x-0.5 hover:bg-secondary"
            >
              <ArrowLeft className="size-4" /> BACK
            </Link>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            {actions}
            {next && (
              <Link
                to={next.to}
                className="brand-gradient inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] transition-all hover:translate-x-0.5 hover:brightness-110"
              >
                NEXT <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
