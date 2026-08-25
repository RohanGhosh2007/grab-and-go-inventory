/**
 * Auto Inventory — API layer.
 *
 * This is the ORIGINAL application logic from auto_inventory_single_file.html,
 * refactored from inline <script> into typed modules. Endpoints, payload shapes
 * and business rules are unchanged:
 *
 *   GET  /inventory/summary
 *   GET  /purchase-orders
 *   GET  /products
 *   POST /products
 *   GET  /sales
 *   POST /sales
 *   GET  /replenishment/{product_id}
 *   GET  /forecast/{product_id}
 */

const API_BASE_STORAGE_KEY = "auto-inventory:api-url";

/** Original file used `const API_URL = ""` (same-origin). Kept as default. */
export const DEFAULT_API_URL: string =
  (import.meta.env["VITE_API_URL"] as string | undefined) ?? "";

export function getApiUrl(): string {
  if (typeof window === "undefined") return DEFAULT_API_URL;
  const stored = window.localStorage.getItem(API_BASE_STORAGE_KEY);
  return (stored ?? DEFAULT_API_URL).replace(/\/$/, "");
}

export function setApiUrl(url: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(API_BASE_STORAGE_KEY, url.trim().replace(/\/$/, ""));
}

export interface Product {
  id: number;
  name: string;
  category: string;
  current_stock: number;
  safety_stock: number;
  unit_price?: number;
  lead_time?: number;
}

export interface InventorySummary {
  total_products: number;
  low_stock_items: number;
  out_of_stock_items: number;
}

export interface Replenishment {
  product_name: string;
  current_stock: number;
  average_daily_demand: number;
  reorder_point: number;
  reorder_required: boolean;
  suggested_quantity: number;
}

export interface Sale {
  product_id: number;
  quantity: number;
  sale_date: string;
}

export interface Forecast {
  average_daily_demand: number;
  forecast_next_7_days: number;
}

export interface NewProduct {
  name: string;
  category: string;
  current_stock: number;
  unit_price: number;
  lead_time: number;
  safety_stock: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, init);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((data && (data.detail as string)) || `Request failed: ${path}`);
  }
  return data as T;
}

export const loadInventorySummary = () => request<InventorySummary>("/inventory/summary");

export const loadPurchaseOrders = () => request<unknown[]>("/purchase-orders");

export const loadProducts = () => request<Product[]>("/products");

export const loadSales = () => request<Sale[]>("/sales");

export const loadReplenishmentFor = (productId: number) =>
  request<Replenishment>(`/replenishment/${productId}`);

export const loadForecastFor = (productId: number | string) =>
  request<Forecast>(`/forecast/${productId}`);

export const createProduct = (product: NewProduct) =>
  request<Product>("/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });

export const createSale = (sale: Sale) =>
  request<unknown>("/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sale),
  });

/** Original loadReplenishment(): fetch all products, then /replenishment/{id} each. */
export async function loadReplenishmentTable() {
  const products = await loadProducts();
  const rows: Array<Replenishment & { id: number }> = [];
  for (const product of products) {
    const data = await loadReplenishmentFor(product.id);
    rows.push({ ...data, id: product.id });
  }
  return rows;
}

/** Original stock-status rule — unchanged. */
export function stockStatus(product: Product) {
  if (product.current_stock === 0) return "OUT OF STOCK" as const;
  if (product.current_stock <= product.safety_stock) return "LOW STOCK" as const;
  return "NORMAL" as const;
}
