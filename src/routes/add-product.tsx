import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, PackagePlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/PageShell";
import { createProduct } from "@/lib/api";

export const Route = createFileRoute("/add-product")({
  head: () => ({
    meta: [
      { title: "Add Product — Auto Inventory" },
      {
        name: "description",
        content:
          "Register a product with category, stock, unit price, lead time and safety stock in Auto Inventory.",
      },
      { property: "og:title", content: "Add Product — Auto Inventory" },
      {
        property: "og:description",
        content: "Register products into your Auto Inventory catalogue.",
      },
    ],
  }),
  component: AddProductPage,
});

const FIELDS = [
  { id: "name", label: "Product Name", type: "text", placeholder: "Wireless Mouse" },
  { id: "category", label: "Category", type: "text", placeholder: "Accessories" },
  { id: "current_stock", label: "Current Stock", type: "number", placeholder: "120" },
  { id: "unit_price", label: "Unit Price", type: "number", placeholder: "499" },
  { id: "lead_time", label: "Lead Time (days)", type: "number", placeholder: "7" },
  { id: "safety_stock", label: "Safety Stock", type: "number", placeholder: "20" },
] as const;

function AddProductPage() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<null | { name: string; category: string }>(null);
  const [error, setError] = useState("");

  // Original addProduct(event) logic — same payload, same POST /products.
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);

    const product = {
      name: String(fd.get("name") ?? ""),
      category: String(fd.get("category") ?? ""),
      current_stock: Number(fd.get("current_stock")),
      unit_price: Number(fd.get("unit_price")),
      lead_time: Number(fd.get("lead_time")),
      safety_stock: Number(fd.get("safety_stock")),
    };

    setSaving(true);
    setError("");
    try {
      await createProduct(product);
      setSaved({ name: product.name, category: product.category });
      toast.success("Product added successfully.", {
        description: `${product.name} · ${product.category}`,
      });
      form.reset();
      // Refresh inventory data (original called loadDashboard + loadSaleProducts).
      await queryClient.invalidateQueries();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add product";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      stage={2}
      eyebrow="Step 02"
      title="Add Product"
      description="Register a new SKU in your catalogue. Values are posted to your live /products endpoint."
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={onSubmit} className="glass-card animate-fade-up rounded-3xl p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="brand-gradient flex size-10 items-center justify-center rounded-2xl text-primary-foreground">
              <PackagePlus className="size-5" />
            </span>
            <h2 className="text-lg font-bold">Product details</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {FIELDS.map((field, i) => (
              <label
                key={field.id}
                className="animate-fade-up block"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span className="mb-1.5 block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  {field.label}
                </span>
                <input
                  name={field.id}
                  type={field.type}
                  placeholder={field.placeholder}
                  required
                  min={field.type === "number" ? 0 : undefined}
                  step={field.id === "unit_price" ? "any" : undefined}
                  className="w-full rounded-xl border border-input bg-background/60 px-4 py-3 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
                />
              </label>
            ))}
          </div>

          {error && <p className="mt-5 text-sm font-medium text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="brand-gradient mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold tracking-wide text-primary-foreground shadow-[var(--shadow-glow)] transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "SAVING…" : "SAVE PRODUCT"}
          </button>
        </form>

        <aside className="glass-card animate-fade-up rounded-3xl p-6 sm:p-8">
          <h2 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
            Last saved
          </h2>
          {saved ? (
            <div className="animate-pop mt-6 text-center">
              <CheckCircle2 className="mx-auto size-14 text-success" />
              <p className="mt-4 text-lg font-bold">{saved.name}</p>
              <p className="text-sm text-muted-foreground">{saved.category}</p>
              <p className="mt-4 rounded-xl bg-success/10 px-4 py-2 text-xs font-semibold text-success">
                Product added successfully — inventory refreshed
              </p>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">
              Saved products appear here instantly and are pushed into the inventory, sales and
              forecast views.
            </p>
          )}
        </aside>
      </div>
    </PageShell>
  );
}
