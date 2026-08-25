import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Boxes, LineChart, PackageSearch, Sparkles } from "lucide-react";

import { ApiSettings } from "@/components/ApiSettings";
import { StageNav } from "@/components/StageNav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Auto Inventory — Smart Forecasting & Replenishment" },
      {
        name: "description",
        content:
          "Manage products, track inventory, record sales, forecast demand and automate replenishment from one intelligent platform.",
      },
      { property: "og:title", content: "Auto Inventory — Smart Forecasting & Replenishment" },
      {
        property: "og:description",
        content:
          "An intelligent inventory platform for demand forecasting and automated replenishment.",
      },
    ],
  }),
  component: WelcomePage,
});

const FEATURES = [
  {
    icon: PackageSearch,
    title: "Live inventory",
    text: "Real stock levels, safety stock and status straight from your API.",
  },
  {
    icon: LineChart,
    title: "Demand forecast",
    text: "Actual sales vs. 7-day forecast rendered with Chart.js.",
  },
  {
    icon: BarChart3,
    title: "Smart replenishment",
    text: "Reorder points and suggested quantities per product.",
  },
];

function WelcomePage() {
  return (
    <div className="surface-gradient min-h-screen bg-background">
      <StageNav />

      <main className="mx-auto max-w-6xl px-4 pt-16 pb-24 sm:px-6">
        <div className="animate-fade-up flex flex-col items-center text-center">
          <span className="glass-card inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide">
            <Sparkles className="size-3.5 text-primary" />
            SIH-ready inventory intelligence
          </span>

          <h1 className="mt-7 text-5xl font-extrabold tracking-tight sm:text-7xl">
            Auto <span className="brand-gradient bg-clip-text text-transparent">Inventory</span>
          </h1>

          <p
            className="animate-fade-up mt-5 text-lg font-semibold text-foreground/90 sm:text-2xl"
            style={{ animationDelay: "120ms" }}
          >
            Smart Inventory Forecasting &amp; Automated Replenishment
          </p>

          <p
            className="animate-fade-up mt-5 max-w-2xl text-sm text-muted-foreground sm:text-base"
            style={{ animationDelay: "220ms" }}
          >
            Manage products, track inventory, record sales, forecast demand and make smarter
            replenishment decisions from one intelligent platform.
          </p>

          <Link
            to="/add-product"
            className="brand-gradient animate-pop mt-10 inline-flex items-center gap-3 rounded-2xl px-9 py-4 text-base font-bold text-primary-foreground shadow-[var(--shadow-glow)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
            style={{ animationDelay: "340ms" }}
          >
            USE THIS <ArrowRight className="size-5" />
          </Link>
        </div>

        <div className="mt-20 grid gap-5 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="glass-card animate-fade-up rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1.5"
              style={{ animationDelay: `${420 + i * 110}ms` }}
            >
              <span className="brand-gradient mb-4 flex size-11 items-center justify-center rounded-2xl text-primary-foreground">
                <f.icon className="size-5" />
              </span>
              <h2 className="text-base font-bold">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>

        <div className="animate-fade-up mt-14" style={{ animationDelay: "780ms" }}>
          <ApiSettings />
        </div>

        <div
          className="animate-float mt-16 flex justify-center text-muted-foreground"
          aria-hidden="true"
        >
          <Boxes className="size-8 opacity-40" />
        </div>
      </main>
    </div>
  );
}
