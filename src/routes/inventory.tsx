import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpDown, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { PageShell } from "@/components/PageShell";
import { ErrorBlock, SkeletonRows } from "@/components/StateBlocks";
import { loadProducts, stockStatus, type Product } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory Management — Auto Inventory" },
      {
        name: "description",
        content:
          "Search, filter and sort your full product inventory with live stock status badges.",
      },
      { property: "og:title", content: "Inventory Management — Auto Inventory" },
      {
        property: "og:description",
        content: "Enterprise-grade inventory table with live stock status.",
      },
    ],
  }),
  component: InventoryPage,
});

type SortKey = "id" | "name" | "category" | "current_stock" | "safety_stock";

const STATUS_STYLES: Record<string, string> = {
  "OUT OF STOCK": "bg-destructive/15 text-destructive border-destructive/30",
  "LOW STOCK": "bg-warning/15 text-warning border-warning/30",
  NORMAL: "bg-success/15 text-success border-success/30",
};

function InventoryPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["products"],
    queryFn: loadProducts,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "id", dir: 1 });

  const rows = useMemo(() => {
    let list: Product[] = data ? [...data] : [];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          String(p.id).includes(q),
      );
    }
    if (status !== "ALL") list = list.filter((p) => stockStatus(p) === status);
    list.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * sort.dir;
      return String(av).localeCompare(String(bv)) * sort.dir;
    });
    return list;
  }, [data, search, status, sort]);

  const columns: Array<{ key: SortKey; label: string }> = [
    { key: "id", label: "ID" },
    { key: "name", label: "Product" },
    { key: "category", label: "Category" },
    { key: "current_stock", label: "Stock" },
    { key: "safety_stock", label: "Safety Stock" },
  ];

  return (
    <PageShell
      stage={5}
      eyebrow="Step 05"
      title="Inventory Management"
      description="Every SKU from /products with the original stock-status rules applied."
    >
      {isError && (
        <div className="mb-6">
          <ErrorBlock error={error} />
        </div>
      )}

      <div className="glass-card animate-fade-up overflow-hidden rounded-3xl">
        <div className="flex flex-wrap items-center gap-3 border-b border-border/70 p-5">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, category or ID…"
              className="w-full rounded-xl border border-input bg-background/60 py-2.5 pr-4 pl-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="ALL">All statuses</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW STOCK">Low stock</option>
            <option value="OUT OF STOCK">Out of stock</option>
          </select>
          <span className="rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-muted-foreground">
            {rows.length} items
          </span>
        </div>

        {isLoading ? (
          <SkeletonRows />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="bg-secondary/50 text-left">
                  {columns.map((col) => (
                    <th key={col.key} className="px-5 py-3.5">
                      <button
                        onClick={() =>
                          setSort((s) =>
                            s.key === col.key
                              ? { key: col.key, dir: s.dir === 1 ? -1 : 1 }
                              : { key: col.key, dir: 1 },
                          )
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground"
                      >
                        {col.label}
                        <ArrowUpDown
                          className={cn("size-3", sort.key === col.key && "text-primary")}
                        />
                      </button>
                    </th>
                  ))}
                  <th className="px-5 py-3.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((product, i) => {
                  const st = stockStatus(product);
                  return (
                    <tr
                      key={product.id}
                      className="animate-fade-up border-t border-border/60 transition-colors hover:bg-secondary/40"
                      style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
                    >
                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                        #{product.id}
                      </td>
                      <td className="px-5 py-4 font-semibold">{product.name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{product.category}</td>
                      <td className="px-5 py-4 tabular-nums">{product.current_stock}</td>
                      <td className="px-5 py-4 tabular-nums text-muted-foreground">
                        {product.safety_stock}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide",
                            STATUS_STYLES[st],
                          )}
                        >
                          {st}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-sm text-muted-foreground">
                      No products match your filters.
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
