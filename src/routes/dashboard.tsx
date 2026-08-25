import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Boxes, ShoppingCart, XCircle } from "lucide-react";

import { CountUp } from "@/components/CountUp";
import { PageShell } from "@/components/PageShell";
import { ErrorBlock } from "@/components/StateBlocks";
import { loadInventorySummary, loadPurchaseOrders } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Inventory Dashboard — Auto Inventory" },
      {
        name: "description",
        content:
          "Live KPIs for total products, low stock, out of stock and open purchase orders.",
      },
      { property: "og:title", content: "Inventory Dashboard — Auto Inventory" },
      {
        property: "og:description",
        content: "Real-time inventory KPIs powered by your Auto Inventory API.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  // Original loadInventorySummary() + loadPurchaseOrders().
  const summary = useQuery({ queryKey: ["inventory-summary"], queryFn: loadInventorySummary });
  const purchaseOrders = useQuery({ queryKey: ["purchase-orders"], queryFn: loadPurchaseOrders });

  const cards = [
    {
      label: "Total Products",
      value: summary.data?.total_products ?? 0,
      icon: Boxes,
      tint: "from-primary/25 to-primary/5",
      accent: "text-primary",
    },
    {
      label: "Low Stock",
      value: summary.data?.low_stock_items ?? 0,
      icon: AlertTriangle,
      tint: "from-warning/25 to-warning/5",
      accent: "text-warning",
    },
    {
      label: "Out of Stock",
      value: summary.data?.out_of_stock_items ?? 0,
      icon: XCircle,
      tint: "from-destructive/25 to-destructive/5",
      accent: "text-destructive",
    },
    {
      label: "Purchase Orders",
      value: purchaseOrders.data?.length ?? 0,
      icon: ShoppingCart,
      tint: "from-accent/25 to-accent/5",
      accent: "text-accent",
    },
  ];

  const loading = summary.isLoading || purchaseOrders.isLoading;
  const error = summary.error ?? purchaseOrders.error;

  return (
    <PageShell
      stage={4}
      eyebrow="Step 04"
      title="Inventory Dashboard"
      description="Live operational KPIs streamed from /inventory/summary and /purchase-orders."
    >
      {error && (
        <div className="mb-6">
          <ErrorBlock error={error} />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, i) => (
          <div
            key={card.label}
            className="glass-card animate-fade-up group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-glow)]"
            style={{ animationDelay: `${i * 110}ms` }}
          >
            <div
              className={`absolute inset-0 -z-10 bg-gradient-to-br ${card.tint} opacity-70 transition-opacity duration-300 group-hover:opacity-100`}
            />
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                {card.label}
              </span>
              <card.icon className={`size-5 ${card.accent}`} />
            </div>
            {loading ? (
              <div className="skeleton mt-6 h-10 w-24" />
            ) : (
              <p className="mt-5 text-5xl font-extrabold tracking-tight tabular-nums">
                <CountUp value={card.value} />
              </p>
            )}
            <div className="mt-5 h-1 w-full rounded-full bg-background/50">
              <div
                className="brand-gradient h-full rounded-full transition-all duration-1000"
                style={{ width: loading ? "10%" : "100%" }}
              />
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
