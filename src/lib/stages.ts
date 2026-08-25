export interface Stage {
  index: string;
  label: string;
  to: string;
}

export const STAGES: Stage[] = [
  { index: "01", label: "Welcome", to: "/" },
  { index: "02", label: "Add Product", to: "/add-product" },
  { index: "03", label: "Record Sale", to: "/record-sale" },
  { index: "04", label: "Dashboard", to: "/dashboard" },
  { index: "05", label: "Inventory", to: "/inventory" },
  { index: "06", label: "Forecast", to: "/forecast" },
  { index: "07", label: "Replenishment", to: "/replenishment" },
];
