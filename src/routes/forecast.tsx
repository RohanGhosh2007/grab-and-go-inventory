import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import Chart from "chart.js/auto";
import { Activity, CalendarRange, Gauge } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PageShell } from "@/components/PageShell";
import { ErrorBlock } from "@/components/StateBlocks";
import {
  loadForecastFor,
  loadProducts,
  loadSales,
  type Forecast,
} from "@/lib/api";

export const Route = createFileRoute("/forecast")({
  head: () => ({
    meta: [
      { title: "Demand Forecast — Auto Inventory" },
      {
        name: "description",
        content:
          "Actual sales versus a 7-day demand forecast rendered with Chart.js.",
      },
      {
        property: "og:title",
        content: "Demand Forecast — Auto Inventory",
      },
      {
        property: "og:description",
        content:
          "Visualise product demand and forecast the next 7 days.",
      },
    ],
  }),
  component: ForecastPage,
});


function ForecastPage() {

  // =====================================================
  // LOAD PRODUCTS
  // =====================================================

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: loadProducts,
  });


  // =====================================================
  // MULTIPLE PRODUCT SELECTION
  // =====================================================

  const [productIds, setProductIds] = useState<string[]>([]);


  // =====================================================
  // FORECAST DATA FOR ALL SELECTED PRODUCTS
  // =====================================================

  const [forecasts, setForecasts] = useState<
    { productId: string; forecast: Forecast }[]
  >([]);


  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);


  // =====================================================
  // CHART REFERENCES
  // =====================================================

  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const chartRef =
    useRef<Chart | null>(null);


  // =====================================================
  // LOAD FORECASTS FOR ALL SELECTED PRODUCTS
  // =====================================================

  useEffect(() => {

    // No product selected
    if (productIds.length === 0) {

      setForecasts([]);
      setError("");
      setLoading(false);

      if (chartRef.current) {

        chartRef.current.destroy();

        chartRef.current = null;
      }

      return;
    }


    let cancelled = false;


    (async () => {

      setLoading(true);
      setError("");


      try {

        // =================================================
        // LOAD SALES DATA ONCE
        // =================================================

        const sales = await loadSales();


        // =================================================
        // LOAD FORECAST FOR EVERY SELECTED PRODUCT
        // =================================================

        const results =
          await Promise.all(

            productIds.map(
              async (productId) => {

                const forecast =
                  await loadForecastFor(productId);

                return {
                  productId,
                  forecast,
                };
              }
            )
          );


        if (cancelled) return;


        setForecasts(results);


        // =================================================
        // CREATE NEXT 7 DAYS
        // =================================================

        const forecastLabels: string[] = [];

        const today = new Date();


        for (let i = 1; i <= 7; i++) {

          const date = new Date(today);

          date.setDate(
            today.getDate() + i
          );

          forecastLabels.push(
            date.toISOString().slice(0, 10)
          );
        }


        // =================================================
        // COLLECT ALL ACTUAL SALES DATES
        // =================================================

        const actualDateSet = new Set<string>();


        productIds.forEach((productId) => {

          sales
            .filter(
              (sale) =>
                sale.product_id ===
                Number(productId)
            )
            .forEach((sale) => {

              actualDateSet.add(
                sale.sale_date
              );

            });

        });


        // =================================================
        // COMBINE ACTUAL + FORECAST DATES
        // =================================================

        const allLabels = Array.from(
          new Set([
            ...Array.from(actualDateSet),
            ...forecastLabels,
          ])
        ).sort(
          (a, b) =>
            new Date(a).getTime() -
            new Date(b).getTime()
        );


        // =================================================
        // CREATE CHART DATASETS
        // =================================================

        const datasets: any[] = [];


        // =================================================
        // CREATE DATA FOR EACH SELECTED PRODUCT
        // =================================================

        productIds.forEach((productId, index) => {

          const selectedProduct =
            productsQuery.data?.find(
              (product) =>
                product.id ===
                Number(productId)
            );


          const productName =
            selectedProduct?.name ??
            `Product ${productId}`;


          // -----------------------------------------------
          // Product's actual sales
          // -----------------------------------------------

          const productSales =
            sales
              .filter(
                (sale) =>
                  sale.product_id ===
                  Number(productId)
              )
              .sort(
                (a, b) =>
                  new Date(a.sale_date).getTime() -
                  new Date(b.sale_date).getTime()
              );


          // -----------------------------------------------
          // Actual sales data
          // -----------------------------------------------

          const actualData =
            allLabels.map((date) => {

              const sale =
                productSales.find(
                  (item) =>
                    item.sale_date === date
                );


              return sale
                ? sale.quantity
                : null;

            });


          // -----------------------------------------------
          // Forecast value
          // -----------------------------------------------

          const forecastValue =
            Number(
              results[index]
                ?.forecast
                .average_daily_demand
            ) || 0;


          // -----------------------------------------------
          // Forecast data
          // -----------------------------------------------

          const forecastData =
            allLabels.map((date) => {

              return forecastLabels.includes(date)
                ? forecastValue
                : null;

            });


          // =================================================
          // ACTUAL SALES DATASET
          // =================================================

          datasets.push({

            label:
              `${productName} - Actual`,

            data:
              actualData,

            borderWidth: 2,

            tension: 0.3,

            borderColor: getChartColor(index),

            backgroundColor:
              getChartColor(index, 0.12),

            fill: false,

            pointRadius: 3,

            pointHoverRadius: 6,

            pointBackgroundColor:
              getChartColor(index),

          });


          // =================================================
          // FORECAST DATASET
          // =================================================

          datasets.push({

            label:
              `${productName} - Forecast`,

            data:
              forecastData,

            borderWidth: 2,

            borderDash: [5, 5],

            tension: 0.3,

            borderColor:
              getChartColor(index),

            backgroundColor:
              "transparent",

            fill: false,

            pointRadius: 3,

            pointHoverRadius: 6,

            pointBackgroundColor:
              getChartColor(index),

          });

        });


        // =================================================
        // DESTROY OLD CHART
        // =================================================

        if (chartRef.current) {

          chartRef.current.destroy();

          chartRef.current = null;
        }


        const canvas =
          canvasRef.current;


        if (!canvas) return;


        const ctx =
          canvas.getContext("2d");


        if (!ctx) return;


        // =================================================
        // CREATE NEW CHART
        // =================================================

        chartRef.current =
          new Chart(ctx, {

            type: "line",

            data: {

              labels:
                allLabels,

              datasets:
                datasets,

            },


            options: {

              responsive: true,

              maintainAspectRatio: false,


              animation: {

                duration: 900,

                easing: "easeOutQuart",

              },


              interaction: {

                mode: "index",

                intersect: false,

              },


              plugins: {

                legend: {

                  labels: {

                    color:
                      "rgba(226,232,240,0.85)",

                    usePointStyle: true,

                    pointStyle: "circle",

                    boxWidth: 8,

                    font: {

                      size: 12,

                      weight: 600,

                    },

                  },

                },


                tooltip: {

                  backgroundColor:
                    "rgba(15,20,38,0.94)",

                  borderColor:
                    "rgba(124,109,247,0.5)",

                  borderWidth: 1,

                  padding: 12,

                  cornerRadius: 12,

                  titleColor: "#fff",

                  bodyColor:
                    "rgba(226,232,240,0.9)",

                  displayColors: true,

                  usePointStyle: true,

                },

              },


              scales: {

                y: {

                  beginAtZero: true,

                  title: {

                    display: true,

                    text: "Units Sold",

                    color:
                      "rgba(148,163,184,0.9)",

                  },

                  ticks: {

                    color:
                      "rgba(148,163,184,0.8)",

                  },

                  grid: {

                    color:
                      "rgba(148,163,184,0.12)",

                  },

                },


                x: {

                  title: {

                    display: true,

                    text: "Date",

                    color:
                      "rgba(148,163,184,0.9)",

                  },

                  ticks: {

                    color:
                      "rgba(148,163,184,0.8)",

                    maxRotation: 0,

                    autoSkip: true,

                  },

                  grid: {

                    display: false,

                  },

                },

              },

            },

          });


      } catch (err) {

        if (!cancelled) {

          setError(
            err instanceof Error
              ? err.message
              : "Failed to load forecast"
          );

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    })();


    return () => {

      cancelled = true;

    };

  }, [productIds, productsQuery.data]);


  // =====================================================
  // DESTROY CHART WHEN PAGE IS CLOSED
  // =====================================================

  useEffect(() => {

    return () => {

      chartRef.current?.destroy();

    };

  }, []);


  // =====================================================
  // HANDLE MULTIPLE PRODUCT SELECTION
  // =====================================================

  const handleProductChange =
    (
      event:
        React.ChangeEvent<HTMLSelectElement>
    ) => {

      const selected =
        Array.from(
          event.target.selectedOptions
        )
          .map(
            (option) =>
              option.value
          )
          .filter(
            (value) =>
              value !== ""
          );


      setProductIds(selected);

    };


  // =====================================================
  // COMBINED FORECAST VALUES
  // =====================================================

  const totalDailyDemand =
    forecasts.reduce(
      (total, item) =>
        total +
        Number(
          item.forecast
            .average_daily_demand
        ),
      0
    );


  const totalSevenDayForecast =
    forecasts.reduce(
      (total, item) =>
        total +
        Number(
          item.forecast
            .forecast_next_7_days
        ),
      0
    );


  // =====================================================
  // PAGE
  // =====================================================

  return (

    <PageShell

      stage={6}

      eyebrow="Step 06"

      title="Demand Forecast"

      description="Compare actual sales history against the next 7 forecast days for one or multiple products."

    >


      {/* =================================================
          ERROR
      ================================================= */}

      {(productsQuery.isError || error) && (

        <div className="mb-6">

          <ErrorBlock
            error={
              productsQuery.error ??
              new Error(error)
            }
          />

        </div>

      )}


      {/* =================================================
          PRODUCT SELECTOR
      ================================================= */}

      <div className="glass-card animate-fade-up mb-6 flex flex-wrap items-center gap-3 rounded-3xl p-5">

        <label
          htmlFor="forecast-product"
          className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
        >
          Products
        </label>


        <select

          id="forecast-product"

          multiple

          value={productIds}

          onChange={handleProductChange}

          className="min-h-[110px] min-w-[260px] flex-1 rounded-xl border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"

        >

          {productsQuery.data?.map(
            (p) => (

              <option
                key={p.id}
                value={p.id}
              >
                {p.name}
              </option>

            )
          )}

        </select>


        {/* Selection information */}

        <div className="w-full text-xs text-muted-foreground">

          {productIds.length === 0
            ? "Select one or more products. Hold Ctrl/Cmd to select multiple products."
            : `${productIds.length} product${
                productIds.length > 1
                  ? "s"
                  : ""
              } selected.`}

        </div>

      </div>


      {/* =================================================
          CHART + INSIGHTS
      ================================================= */}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">


        {/* =================================================
            CHART
        ================================================= */}

        <div className="glass-card animate-fade-up rounded-3xl p-5 sm:p-6">

          <div className="h-[380px]">

            {loading && (
              <div className="skeleton h-full w-full" />
            )}


            <canvas
              ref={canvasRef}
              className={
                loading
                  ? "hidden"
                  : ""
              }
            />

          </div>


          {!loading &&
            productIds.length === 0 && (

              <p className="mt-4 text-center text-sm text-muted-foreground">

                Select one or more products
                to render their demand curves.

              </p>

            )}

        </div>


        {/* =================================================
            INSIGHTS
        ================================================= */}

        <div className="space-y-5">


          {/* Average Daily Demand */}

          <InsightCard

            icon={Gauge}

            label="Combined daily demand"

            value={
              forecasts.length > 0
                ? `${totalDailyDemand.toFixed(2)} units`
                : "—"
            }

            hint={
              forecasts.length > 0
                ? `Combined demand across ${forecasts.length} selected product${
                    forecasts.length > 1
                      ? "s"
                      : ""
                  }.`
                : "Select products to generate forecast."
            }

          />


          {/* 7 Day Forecast */}

          <InsightCard

            icon={CalendarRange}

            label="Combined 7-day forecast"

            value={
              forecasts.length > 0
                ? `${totalSevenDayForecast.toFixed(2)} units`
                : "—"
            }

            hint={
              forecasts.length > 0
                ? "Projected total demand for the selected products."
                : "Pick products to generate the forecast."
            }

          />


          {/* Forecast Insight */}

          <InsightCard

            icon={Activity}

            label="Forecast insight"

            value={
              forecasts.length > 0
                ? "Demand signal detected"
                : "—"
            }

            hint={
              forecasts.length > 0
                ? `${forecasts.length} product${
                    forecasts.length > 1
                      ? "s"
                      : ""
                  } currently included in the forecast.`
                : "Select one or more products to generate insight."
            }

          />

        </div>

      </div>


      {/* =================================================
          INDIVIDUAL PRODUCT FORECAST DETAILS
      ================================================= */}

      {forecasts.length > 0 && (

        <div className="glass-card animate-fade-up mt-6 rounded-3xl p-5 sm:p-6">

          <h3 className="mb-4 text-sm font-bold tracking-wider uppercase">

            Product Forecast Details

          </h3>


          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

            {forecasts.map(
              (item) => {

                const product =
                  productsQuery.data?.find(
                    (p) =>
                      p.id ===
                      Number(
                        item.productId
                      )
                  );


                return (

                  <div
                    key={
                      item.productId
                    }
                    className="rounded-2xl border border-border/50 bg-background/30 p-4"
                  >

                    <p className="font-bold">

                      {product?.name ??
                        `Product ${item.productId}`}

                    </p>


                    <p className="mt-2 text-sm text-muted-foreground">

                      Daily demand:{" "}

                      <span className="font-semibold text-foreground">

                        {
                          item.forecast
                            .average_daily_demand
                        }{" "}
                        units

                      </span>

                    </p>


                    <p className="mt-1 text-sm text-muted-foreground">

                      7-day forecast:{" "}

                      <span className="font-semibold text-foreground">

                        {
                          item.forecast
                            .forecast_next_7_days
                        }{" "}
                        units

                      </span>

                    </p>

                  </div>

                );

              }
            )}

          </div>

        </div>

      )}

    </PageShell>

  );
}


// =====================================================
// CHART COLORS
// =====================================================

function getChartColor(
  index: number,
  alpha?: number
) {

  const colors = [

    "124,109,247",

    "56,189,248",

    "34,197,94",

    "251,146,60",

    "244,63,94",

    "168,85,247",

    "14,165,233",

    "234,179,8",

  ];


  const color =
    colors[
      index %
        colors.length
    ];


  if (alpha !== undefined) {

    return `rgba(${color},${alpha})`;

  }


  return `rgb(${color})`;

}


// =====================================================
// INSIGHT CARD
// =====================================================

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


      <p className="mt-3 text-2xl font-extrabold">

        {value}

      </p>


      <p className="mt-2 text-xs text-muted-foreground">

        {hint}

      </p>

    </div>

  );

}
