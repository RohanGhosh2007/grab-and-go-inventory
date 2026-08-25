import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, ReceiptText } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/PageShell";
import { ErrorBlock } from "@/components/StateBlocks";
import { createSale, loadProducts } from "@/lib/api";

export const Route = createFileRoute("/record-sale")({
  head: () => ({
    meta: [
      { title: "Record Sale — Auto Inventory" },
      {
        name: "description",
        content: "Record product sales with quantity and sale date to keep demand data accurate.",
      },
      { property: "og:title", content: "Record Sale — Auto Inventory" },
      {
        property: "og:description",
        content: "Log sales transactions that feed Auto Inventory demand forecasting.",
      },
    ],
  }),
  component: RecordSalePage,
});

function RecordSalePage() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Original loadSaleProducts() — GET /products for the dropdown.
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: loadProducts });

  // Original recordSale(event) — same payload, same POST /sales.
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);

    const sale = {
      product_id: Number(fd.get("product_id")),
      quantity: Number(fd.get("quantity")),
      sale_date: String(fd.get("sale_date") ?? ""),
    };

    setSaving(true);
    setError("");
    try {
      await createSale(sale);
      setSuccess(`Sale recorded successfully — ${sale.quantity} units on ${sale.sale_date}`);
      toast.success("Sale recorded successfully.");
      form.reset();
      await queryClient.invalidateQueries();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to record sale";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      stage={3}
      eyebrow="Step 03"
      title="Record Sale"
      description="Log a sale against a product. Every sale feeds the demand forecast and replenishment engine."
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={onSubmit} className="glass-card animate-fade-up rounded-3xl p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="brand-gradient flex size-10 items-center justify-center rounded-2xl text-primary-foreground">
              <ReceiptText className="size-5" />
            </span>
            <h2 className="text-lg font-bold">Sale details</h2>
          </div>

          <div className="grid gap-5">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Product
              </span>
              <select
                name="product_id"
                required
                className="w-full rounded-xl border border-input bg-background/60 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
              >
                <option value="">Select Product</option>
                {productsQuery.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.current_stock})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Quantity
              </span>
              <input
                name="quantity"
                type="number"
                min={1}
                placeholder="Quantity"
                required
                className="w-full rounded-xl border border-input bg-background/60 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Sale Date
              </span>
              <input
                name="sale_date"
                type="date"
                required
                className="w-full rounded-xl border border-input bg-background/60 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
              />
            </label>
          </div>

          {error && <p className="mt-5 text-sm font-medium text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="brand-gradient mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold tracking-wide text-primary-foreground shadow-[var(--shadow-glow)] transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "SAVING…" : "SAVE SALE"}
          </button>
        </form>

        <aside className="space-y-4">
          {productsQuery.isError && <ErrorBlock error={productsQuery.error} />}
          <div className="glass-card animate-fade-up rounded-3xl p-6 sm:p-8">
            <h2 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
              Status
            </h2>
            {success ? (
              <div className="animate-pop mt-6 text-center">
                <CheckCircle2 className="mx-auto size-14 text-success" />
                <p className="mt-4 text-sm font-semibold text-success">{success}</p>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">
                {productsQuery.data?.length ?? 0} products available in the selector. Recording a
                sale refreshes inventory and the product list automatically.
              </p>
            )}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
