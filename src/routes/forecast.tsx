import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import Chart from "chart.js/auto";
import { Activity, CalendarRange, Gauge } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PageShell } from "@/components/PageShell";
import { ErrorBlock } from "@/components/StateBlocks";
import { loadForecastFor, loadProducts, loadSales, type Forecast } from "@/lib/api";

export const Route = createFileRoute("/forecast")({
  head: () => ({
    meta: [
      { title: "Demand Forecast — Auto Inventory" },
      {
        name: "description",
        content: "Actual sales versus a 7-day demand forecast rendered with Chart.js.",
      },
      { property: "og:title", content: "Demand Forecast — Auto Inventory" },
      {
        property: "og:description",
        content: "Visualise product demand and forecast the next 7 days.",
      },
    ],
  }),
  component: ForecastPage,
});

function ForecastPage() {
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: loadProducts });
  const [productId, setProductId] = useState("");
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  // Original loadForecast(productId) — same data flow, Chart.js preserved.
  useEffect(() => {
    if (!productId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const sales = await loadSales();

        const productSales = sales
          .filter((sale) => sale.product_id === Number(productId))
          .sort((a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime());

        const forecastData = await loadForecastFor(productId);
        if (cancelled) return;
        setForecast(forecastData);

        const labels = productSales.map((sale) => sale.sale_date);
        const actualData = productSales.map((sale) => sale.quantity);
        const forecastValue = forecastData.average_daily_demand;

        const forecastLabels: string[] = [];
        const today = new Date();
        for (let i = 1; i <= 7; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          forecastLabels.push(date.toISOString().split("T")[0]);
        }

        const allLabels = [...labels, ...forecastLabels];
        const forecastSeries = [
          ...new Array(actualData.length).fill(null),
          ...new Array(7).fill(forecastValue),
        ];

        if (chartRef.current) chartRef.current.destroy();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const actualFill = ctx.createLinearGradient(0, 0, 0, 340);
        actualFill.addColorStop(0, "rgba(124,109,247,0.35)");
        actualFill.addColorStop(1, "rgba(124,109,247,0)");

        chartRef.current = new Chart(ctx, {
          type: "line",
          data: {
            labels: allLabels,
            datasets: [
              {
                label: "Actual Sales",
                data: [...actualData, ...new Array(7).fill(null)],
                borderWidth: 2,
                tension: 0.3,
                borderColor: "#7c6df7",
                backgroundColor: actualFill,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: "#7c6df7",
              },
              {
                label: "Forecast",
                data: forecastSeries,
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.3,
                borderColor: "#38bdf8",
                backgroundColor: "rgba(56,189,248,0.12)",
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: "#38bdf8",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 900, easing: "easeOutQuart" },
            interaction: { mode: "index", intersect: false },
            plugins: {
              legend: {
                labels: {
                  color: "rgba(226,232,240,0.85)",
                  usePointStyle: true,
                  pointStyle: "circle",
                  boxWidth: 8,
                  font: { size: 12, weight: 600 },
                },
              },
              tooltip: {
                backgroundColor: "rgba(15,20,38,0.94)",
                borderColor: "rgba(124,109,247,0.5)",
                borderWidth: 1,
                padding: 12,
                cornerRadius: 12,
                titleColor: "#fff",
                bodyColor: "rgba(226,232,240,0.9)",
                displayColors: true,
                usePointStyle: true,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: "Units Sold", color: "rgba(148,163,184,0.9)" },
                ticks: { color: "rgba(148,163,184,0.8)" },
                grid: { color: "rgba(148,163,184,0.12)" },
              },
              x: {
                title: { display: true, text: "Date", color: "rgba(148,163,184,0.9)" },
                ticks: { color: "rgba(148,163,184,0.8)", maxRotation: 0, autoSkip: true },
                grid: { display: false },
              },
            },
          },
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load forecast");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => () => chartRef.current?.destroy(), []);

  return (
    <PageShell
      stage={6}
      eyebrow="Step 06"
      title="Demand Forecast"
      description="Actual sales history against the next 7 forecast days, straight from /sales and /forecast/{id}."
    >
      {(productsQuery.isError || error) && (
        <div className="mb-6">
          <ErrorBlock error={productsQuery.error ?? new Error(error)} />
        </div>
      )}

      <div className="glass-card animate-fade-up mb-6 flex flex-wrap items-center gap-3 rounded-3xl p-5">
        <label
          htmlFor="forecast-product"
          className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
        >
          Product
        </label>
        <select
          id="forecast-product"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="min-w-[220px] flex-1 rounded-xl border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
        >
          <option value="">Select Product</option>
          {productsQuery.data?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="glass-card animate-fade-up rounded-3xl p-5 sm:p-6">
          <div className="h-[380px]">
            {loading && <div className="skeleton h-full w-full" />}
            <canvas ref={canvasRef} className={loading ? "hidden" : ""} />
          </div>
          {!productId && !loading && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Select a product to render its demand curve.
            </p>
          )}
        </div>

        <div className="space-y-5">
          <InsightCard
            icon={Gauge}
            label="Average daily demand"
            value={forecast ? `${forecast.average_daily_demand} units` : "—"}
            hint="Rolling demand rate used for reorder points."
          />
          <InsightCard
            icon={CalendarRange}
            label="7-day forecast"
            value={forecast ? `${forecast.forecast_next_7_days} units` : "—"}
            hint="Projected total demand over the next week."
          />
          <InsightCard
            icon={Activity}
            label="Forecast insight"
            value={
              forecast
                ? forecast.average_daily_demand > 0
                  ? "Demand signal detected"
                  : "No demand recorded yet"
                : "—"
            }
            hint={
              forecast
                ? `Plan for roughly ${forecast.forecast_next_7_days} units of cover this week.`
                : "Pick a product to generate insight."
            }
          />
        </div>
      </div>
    </PageShell>
  );
}

function InsightCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="glass-card animate-fade-up rounded-3xl p-6 transition-transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
        <Icon className="size-5 text-primary" />
      </div>
      <p className="mt-3 text-2xl font-extrabold">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
