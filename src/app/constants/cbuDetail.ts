import type { UomFilter, StockViewLevel } from "../components/cbuDetails/types";

// ─── Page chrome (CBUDetail.tsx) ───────────────────────────────────────────────

export const PAGE_TITLE_SUFFIX = " — CBU Detail";

export const pageBreadcrumbs = (
  cbuCode: string,
  onBackToDashboard: () => void,
) => [
  { label: "SAMARTH" },
  { label: "Network Planner" },
  { label: "CBU Transition (National View)", onClick: onBackToDashboard },
  { label: cbuCode },
];

export const OPEN_SIMULATION_LABEL = "Open Simulation";
export const openSimulationTitle = (cbuCode: string) =>
  `Open a what-if simulation for ${cbuCode}`;

export const BACK_TO_DASHBOARD_LABEL = "Back to CBU Transition (National View)";
export const BACK_TO_DASHBOARD_TITLE =
  "Return to the CBU Transition (National View) dashboard";

export const noRowsMessage = (isPlantView: boolean) =>
  `No ${isPlantView ? "plant" : "cluster"} data available.`;

// ─── Loading / error status (CbuDetailStatus.tsx) ──────────────────────────────

export const LOADING_TEXT = "Loading CBU detail…";
export const ERROR_TEXT = "Could not load this CBU.";
export const ERROR_BACK_LABEL = "Back to National Dashboard";

// ─── KPI row (CbuDetailKpiRow.tsx) ─────────────────────────────────────────────

export const KPI_LABELS = {
  uniqueRm: { label: "UNIQUE RM COMPONENTS", sub: "Raw Material (1002)" },
  uniquePm: { label: "UNIQUE PM COMPONENTS", sub: "Packaging Material (1003)" },
  demand12: { label: "TOTAL 12-MONTH DEMAND", sub: "units (EA)" },
  fgStock: { label: "TOTAL FG STOCK", sub: "at all locations" },
  peakMonth: { label: "PEAK DEMAND MONTH", sub: "Highest planned production" },
  peakPlant: { label: "PEAK PRODUCTION PLANT", sub: "Largest share of 12M plan" },
  highContributing: {
    label: "HIGH CONTRIBUTING COMPONENTS",
    subFallback: "≥70% of demand",
  },
};

// ─── Stock table header (StockTableHeader.tsx) ─────────────────────────────────

export const STOCK_TABLE_HEADER_LABELS = {
  view: "View",
  onHandStock: "On-Hand Stock",
  uom: "UOM",
  collapse: "Collapse",
  expandBreakdown: "Expand breakdown",
};

export const stockTableSectionTitle = (isPlantView: boolean) =>
  `RM/PM Stock vs Required — By ${isPlantView ? "Plant" : "Cluster"}`;

export function formatUomLabel(uom: UomFilter): string {
  if (uom === "RMPM") return "All values in RM/PM base units";
  if (uom === "MT") return "All values in FG Equivalent (Tonnes)";
  return "All values in FG Equivalent (EA)";
}

export const CLUSTER_DRILLDOWN_HINT = " · Click a cluster to drill down to plants";

export const onHandToggleTitle = (anyExpanded: boolean) =>
  anyExpanded
    ? "Collapse on-hand stock breakdown for every component"
    : "Expand on-hand stock into Unrestricted / Quality / STV / Blocked for every component";

// ─── Stock table (StockTable.tsx) ──────────────────────────────────────────────

export const TOTAL_ROW_LABEL = "TOTAL";
export const NO_CLUSTER_PLANT_DATA_MESSAGE = "No plant data for this cluster";

export const clusterToggleTitle = (cluster: string, isExpanded: boolean) =>
  isExpanded
    ? `Collapse ${cluster} and hide its plants`
    : `Expand ${cluster} to see its individual plants`;

export const rowHeaderSubtext = (isPlantView: boolean) =>
  isPlantView ? "Code: Cluster" : "Region";

export const plantCellTooltip = (plantCode: string, cluster: string) =>
  `Plant Code: ${plantCode}
  Cluster: ${cluster}`;

export const clusterCellTooltip = (cluster: string) => `Region: ${cluster}`;

// ─── Filter/UOM/view options (constants shared with utils) ────────────────────

export const UOM_OPTIONS: { id: UomFilter; label: string; description: string }[] = [
  {
    id: "EA",
    label: "EA",
    description: "Show quantities in eaches, converted to FG-equivalent units.",
  },
  {
    id: "MT",
    label: "Tonnes",
    description: "Show quantities in metric tonnes, converted to FG-equivalent weight.",
  },
  {
    id: "RMPM",
    label: "FG-UOM",
    description: "Show quantities in each RM/PM component's own base unit — no FG-equivalent conversion applied.",
  },
];

export const STOCK_VIEW_OPTIONS: {
  id: StockViewLevel;
  label: string;
  description: string;
}[] = [
  {
    id: "plant",
    label: "Plant Based View",
    description: "List every plant individually, each with its own RM/PM stock and cover.",
  },
  {
    id: "cluster",
    label: "Cluster Based View",
    description: "Group plants by cluster; click a cluster row to drill down to its plants.",
  },
];

export const STOCK_COLUMNS = [
  "On hand stock",
  "Open PO",
  "In transit",
  "Supplier inventory",
  "Total FG equivalent RM PM stock",
] as const;

export const ON_HAND_BREAKDOWN_COLUMNS = [
  "Unrestricted Stock",
  "Stock in Quality",
  "STV stock",
  "Blocked Stock",
] as const;

export const DEMAND_COVER_COLUMNS = ["FG Cover (Date)"] as const;

// Column-header tooltips for the RM/PM stock table.
export const STOCK_COL_TOOLTIPS: Record<string, string> = {
  "On hand stock":
    "Physical stock currently at this location: Unrestricted + Stock in Quality + STV + Blocked. Click to expand/collapse this breakdown for every component.",
  "Unrestricted Stock": "Stock freely available for consumption or production.",
  "Stock in Quality": "Stock held pending quality inspection — not yet usable.",
  "STV stock": "Stock in transit within the internal warehouse network (Stock Transfer Voucher), awaiting putaway.",
  "Blocked Stock": "Stock blocked or on hold — not available for use.",
  "Open PO": "Quantity on open purchase orders, not yet received. Included in Total FG equivalent RM PM stock and the FG Cover (Date) calculation here.",
  "In transit": "Stock dispatched but not yet received at this location. Included in Total FG equivalent RM PM stock and the cover calculation.",
  "Supplier inventory": "Stock held at the supplier's location and earmarked for this plant. Included in Total FG equivalent RM PM stock and the cover calculation.",
  "Total FG equivalent RM PM stock":
    "On-hand stock + Open PO + In transit + Supplier inventory. For a Cluster or the grand Total row, this is the highest single plant's total, not the sum across plants.",
  "FG Cover (Date)":
    "Days of forward demand covered by Total FG equivalent RM PM stock (On-hand + Open PO + In transit + Supplier inventory), shown as the projected stock-out date.",
};

export const PRODUCTION_PLAN_LABEL = "Production plan";
export const PRODUCTION_PLAN_COL_WIDTH = 130;
export const productionPlanCellTitle = (plantCode: string) =>
  `View the production plan breakdown for ${plantCode}`;

export const ON_HAND_BREAKDOWN_COUNT = ON_HAND_BREAKDOWN_COLUMNS.length;

export const ROW_HEADER_COL_WIDTH = 150;
export const METRIC_COL_WIDTH = 122;

// Trailing, CBU-level FG summary columns appended once at the end of every
// row (they don't vary by plant/cluster/component — same values repeat down
// the table so they sit alongside the per-plant RM/PM breakdown for reference).
export const FG_SUMMARY_COLUMNS = [
  "FG Cover Date for On-Hand Stock Only (Max)",
  "FG Cover for On-Hand and Open PO Stock (Max)",
  "FG Available at Plant",
] as const;
export const FG_SUMMARY_COL_WIDTH = 132;

// Column-customizer ids for FG_SUMMARY_COLUMNS, index-aligned — see
// STOCK_COLUMN_DEFS' "extra" group.
export const FG_SUMMARY_COL_IDS = [
  "fgCoverOnHand",
  "fgCoverOnHandOpenPO",
  "fgAvailable",
] as const;

export const FG_SUMMARY_COL_TOOLTIPS: Record<string, string> = {
  "FG Cover Date for On-Hand Stock Only (Max)":
    "Days of forward demand covered by Finished Goods physical stock alone, shown as the projected stock-out date.",
  "FG Cover for On-Hand and Open PO Stock (Max)":
    "Days of forward demand covered by Finished Goods stock plus all available RM/PM (physical + quality + Open PO), shown as the projected stock-out date.",
  "FG Available at Plant":
    "CBU-level total: Finished Goods stock (DC + Factory + In-transit) plus all available RM/PM (physical + quality + Open PO).",
};

export const EXPANDED_ONHAND_HEADER_BG = "#dbeafe";
export const EXPANDED_BREAKDOWN_HEADER_BG = "#eff6ff";
export const EXPANDED_ONHAND_CELL_BG = "#f0f9ff";
export const EXPANDED_BREAKDOWN_CELL_BG = "#f8fafc";
export const EXPANDED_BREAKDOWN_CELL_BG_ALT = "#f1f5f9";
export const EXPANDED_GROUP_BORDER = "1px solid #93c5fd";
export const EXPANDED_TOTAL_ONHAND_BG = "#475569";
export const EXPANDED_TOTAL_BREAKDOWN_BG = "#64748b";
export const EXPANDED_HEADER_TEXT = "#1e40af";
export const EXPANDED_BREAKDOWN_HEADER_TEXT = "#334155";

export const CLUSTER_ORDER = [
  "North",
  "West",
  "Central",
  "Haridwar",
  "DDP",
  "East",
  "South",
] as const;

// ─── Stock table column customization (CbuColumnCustomizer.tsx) ───────────────

export type StockColGroup = "metric" | "extra";

export interface StockColDef {
  id: string;
  group: StockColGroup;
  label: string;
}

// "On hand stock" and "Total FG equivalent RM PM stock" are always shown per
// component — they're the two figures the table exists to surface — so only
// the remaining per-component metrics and the trailing summary columns are
// customizable.
export const STOCK_COLUMN_DEFS: StockColDef[] = [
  { id: "openPO", group: "metric", label: "Open PO" },
  { id: "inTransit", group: "metric", label: "In transit" },
  { id: "supplier", group: "metric", label: "Supplier inventory" },
  { id: "cover", group: "metric", label: "FG Cover (Date)" },
  { id: "productionPlan", group: "extra", label: "Production plan" },
  {
    id: "fgCoverOnHand",
    group: "extra",
    label: "FG Cover Date for On-Hand Stock Only (Max)",
  },
  {
    id: "fgCoverOnHandOpenPO",
    group: "extra",
    label: "FG Cover for On-Hand and Open PO Stock (Max)",
  },
  { id: "fgAvailable", group: "extra", label: "FG Available at Plant" },
];

export const STOCK_COL_GROUP_LABELS: Record<StockColGroup, string> = {
  metric: "Per-Component Stock Metrics",
  extra: "Production Plan & FG Summary",
};

export const DEFAULT_HIDDEN_STOCK_COLS = ["inTransit", "supplier"];

export const STOCK_COLUMN_CUSTOMIZER_LABELS = {
  toggleButton: "Customise",
  panelTitle: "Customise Columns",
  reset: "Reset",
  hintText: "TOGGLE TO SHOW/HIDE COLUMNS",
  done: "Done",
  showColumn: "Show column",
  hideColumn: "Hide column",
};
