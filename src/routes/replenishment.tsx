import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ShieldAlert, TrendingUp } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { ErrorBlock, SkeletonRows } from "@/components/StateBlocks";
import { loadReplenishmentTable } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/replenishment")({
  head: () => ({
    meta: [
      { title: "Smart Replenishment — Auto Inventory" },
      {
        name: "description",
        content:
          "Reorder points, daily demand and suggested purchase quantities for every product.",
      },
      { property: "og:title", content: "Smart Replenishment — Auto Inventory" },
      {
        property: "og:description",
        content: "Automated reorder recommendations from your Auto Inventory engine.",
      },
    ],
  }),
  component: ReplenishmentPage,
});

function ReplenishmentPage() {
  // Original loadReplenishment(): /products then /replenishment/{product.id}.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["replenishment"],
    queryFn: loadReplenishmentTable,
  });

  const needsReorder = data?.filter((r) => r.reorder_required) ?? [];
  const healthy = data?.filter((r) => !r.reorder_required) ?? [];

  return (
    <PageShell
      stage={7}
      eyebrow="Step 07"
      title="Smart Replenishment"
      description="Per-product reorder intelligence pulled from /replenishment/{id}."
    >
      {isError && (
        <div className="mb-6">
          <ErrorBlock error={error} />
        </div>
      )}

      <div className="mb-6 grid gap-5 sm:grid-cols-3">
        {[
          {
            label: "Reorder required",
            value: needsReorder.length,
            icon: ShieldAlert,
            accent: "text-destructive",
          },
          {
            label: "Stock healthy",
            value: healthy.length,
            icon: CheckCircle2,
            accent: "text-success",
          },
          {
            label: "Suggested units",
            value: needsReorder.reduce((sum, r) => sum + (r.suggested_quantity ?? 0), 0),
            icon: TrendingUp,
            accent: "text-primary",
          },
        ].map((c, i) => (
          <div
            key={c.label}
            className="glass-card animate-fade-up rounded-3xl p-6 transition-transform hover:-translate-y-1"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                {c.label}
              </span>
              <c.icon className={cn("size-5", c.accent)} />
            </div>
            <p className="mt-4 text-4xl font-extrabold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card animate-fade-up overflow-hidden rounded-3xl">
        {isLoading ? (
          <SkeletonRows cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="bg-secondary/50 text-left text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Current Stock</th>
                  <th className="px-5 py-3.5">Daily Demand</th>
                  <th className="px-5 py-3.5">Reorder Point</th>
                  <th className="px-5 py-3.5">Reorder Required</th>
                  <th className="px-5 py-3.5">Suggested Quantity</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((row, i) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "animate-fade-up border-t border-border/60 transition-colors hover:bg-secondary/40",
                      row.reorder_required && "bg-destructive/5",
                    )}
                    style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
                  >
                    <td className="px-5 py-4 font-semibold">{row.product_name}</td>
                    <td className="px-5 py-4 tabular-nums">{row.current_stock}</td>
                    <td className="px-5 py-4 tabular-nums">{row.average_daily_demand}</td>
                    <td className="px-5 py-4 tabular-nums">{row.reorder_point}</td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide",
                          row.reorder_required
                            ? "border-destructive/30 bg-destructive/15 text-destructive"
                            : "border-success/30 bg-success/15 text-success",
                        )}
                      >
                        {row.reorder_required ? "REORDER REQUIRED" : "STOCK HEALTHY"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold tabular-nums">{row.suggested_quantity}</td>
                  </tr>
                ))}
                {data?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-sm text-muted-foreground">
                      No products yet — add one to see recommendations.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}
