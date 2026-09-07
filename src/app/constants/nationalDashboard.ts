import type { ColDef, ColumnGroup } from "../components/nationalDashboard/types";

// ─── Page chrome ───────────────────────────────────────────────────────────────

export const PAGE_TITLE = "National Level Transition Dashboard";

export const PAGE_BREADCRUMBS = [
  { label: "SAMARTH" },
  { label: "Network Planner" },
  { label: "CBU Transition (National View)" },
];

export const REFRESH_BUTTON_TITLE = "Refresh";
export const EXPORT_BUTTON_TITLE = "Export";

export const SEARCH_PLACEHOLDER = "Search";
export const SEARCH_TOOLTIP =
  "Search by CBU code/description, material code/description, base pack, BG, Small C, Format, or Brand.";

export const HIGH_CONTRIBUTING_LABEL = "High Contributing (≥70%)";
export const highContributingToggleTitle = (showing: boolean) =>
  `${showing ? "Hide" : "Show"} components contributing ≥70% of demand`;

export const LOADING_TEXT = "Loading CBU data…";
export const ERROR_TEXT = "Could not load CBU data.";

// Auto-refresh cadence for the CBU list + component breakdowns. Paused while
// the browser tab is hidden (see useCbuListQuery/useComponentBreakdownsQuery's
// refetchIntervalInBackground: false) so it doesn't poll an unwatched tab.
export const DASHBOARD_REFETCH_INTERVAL_MS = 60_000;

export const NO_CBU_DATA_MESSAGE = "No CBU data available.";
export const NO_SEARCH_RESULTS_MESSAGE = "No CBUs match your search or filters.";
export const CLEAR_FILTERS_LABEL = "Clear filters";

export const FOOTER_ORG_LABEL = "FMCG Network Planning";
export const FOOTER_AGENT_LABEL = "Network Planner Agent";
export const footerDataAsOf = (formattedDate: string) =>
  `Data as of ${formattedDate} · ${FOOTER_ORG_LABEL}`;

// ─── Demand modal (DemandModal.tsx) ────────────────────────────────────────────

export const DEMAND_LOADING_TEXT = "Loading demand data…";
export const DEMAND_EMPTY_TEXT = "No demand data available";
export const DEMAND_ERROR_TEXT = "Could not load demand data.";

// ─── Stock location breakdown modal (StockLocationBreakdownModal.tsx) ─────────

export const STOCK_BREAKDOWN_LOADING_TEXT = "Loading stock breakdown…";
export const STOCK_BREAKDOWN_ERROR_TEXT = "Could not load stock breakdown.";

// ─── Filter option lists ───────────────────────────────────────────────────────

export const MATERIAL_TYPE_FILTER_OPTIONS = ["ALL", "RM", "PM"];
export const UOM_FILTER_OPTIONS = ["EA", "MT"];

export const MATERIAL_TYPE_TOGGLE_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "RM", label: "RM" },
  { value: "PM", label: "PM" },
];

export const UOM_TOGGLE_OPTIONS = [
  { value: "EA", label: "EA" },
  { value: "MT", label: "Tonnes" },
];

// ─── Column customizer (ColumnCustomizer.tsx) ──────────────────────────────────

export const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export const ALL_COLS: ColDef[] = [
  { id: "cbuCode", group: "meta", label: "CBU", minWidth: 118 },
  {
    id: "cbuDescription",
    group: "meta",
    label: "CBU Description",
    minWidth: 215,
  },
  { id: "basePack", group: "meta", label: "BasePack", minWidth: 90 },
  {
    id: "basePackDescription",
    group: "meta",
    label: "BasePack Description",
    minWidth: 220,
  },
  { id: "smallC", group: "meta", label: "Small C", minWidth: 72 },
  { id: "bg", group: "meta", label: "BG", minWidth: 56 },
  { id: "format", group: "meta", label: "Format", minWidth: 140 },
  { id: "fg_dc", group: "fg", label: "DC Stock", minWidth: 100 },
  { id: "fg_intransit", group: "fg", label: "In-Transit", minWidth: 90 },
  { id: "fg_factory", group: "fg", label: "Factory Stock", minWidth: 100 },
  { id: "fg_total", group: "fg", label: "Total Stock", minWidth: 100 },
  {
    id: "rmpm_physical",
    group: "rmpm",
    label: "Physical Stock",
    minWidth: 100,
  },
  { id: "rmpm_quality", group: "rmpm", label: "Quality Stock", minWidth: 90 },
  {
    id: "rmpm_openpo",
    group: "rmpm",
    label: "Open PO Stock",
    minWidth: 90,
  },
  { id: "rmpm_intransit", group: "rmpm", label: "In-Transit", minWidth: 90 },
  {
    id: "rmpm_supplier",
    group: "rmpm",
    label: "Supplier Inventory",
    minWidth: 110,
  },
  { id: "rmpm_total", group: "rmpm", label: "Total Stock", minWidth: 100 },
  {
    id: "rmpm_blocked",
    group: "rmpm",
    label: "Blocked Stock",
    minWidth: 90,
  },
  { id: "demand_3tdp", group: "demand", label: "Next 3 TDP", minWidth: 90 },
  {
    id: "demand_6m",
    group: "demand",
    label: "Next 6 Months",
    minWidth: 90,
  },
  {
    id: "demand_12m",
    group: "demand",
    label: "Next 12 Months",
    minWidth: 100,
  },
  { id: "total_fg", group: "summary", label: "Total FG", minWidth: 100 },
  {
    id: "fg_cover_days",
    group: "summary",
    label: "Total FG Cover (Days)",
    minWidth: 115,
  },
  { id: "cover_fg", group: "cover", label: "FG Cover", minWidth: 100 },
  {
    id: "cover_total",
    group: "cover",
    label: "Total FG Cover",
    minWidth: 100,
  },
  {
    id: "cover_excl",
    group: "cover",
    label: "Excl. Open PO",
    minWidth: 100,
  },
];

/** Meta columns hidden on first load — sticky area shows CBU + description only. */
export const DEFAULT_HIDDEN_COLS = new Set([
  "basePack",
  "basePackDescription",
  "smallC",
  "bg",
  "format",
]);

export const DEFAULT_GROUP_ORDER: ColumnGroup[] = [
  "meta",
  "fg",
  "rmpm",
  "demand",
  "summary",
  "cover",
];

// ─── Theme colours ────────────────────────────────────────────────────────────
// Group header backgrounds (dark, rich)
export const G: Record<ColumnGroup, { hdr: string; sub: string }> = {
  meta: { hdr: "#003087", sub: "#e8edf6" },
  fg: { hdr: "#1565C0", sub: "#1256a8" },
  rmpm: { hdr: "#00695C", sub: "#005548" },
  demand: { hdr: "#0277BD", sub: "#0166a0" },
  summary: { hdr: "#003087", sub: "#EDF1F7" },
  cover: { hdr: "#003087", sub: "#EDF1F7" },
};

export const G_LABEL: Record<ColumnGroup, string> = {
  meta: "Product Info",
  fg: "FG Stock Across All Locations",
  rmpm: "FG Equivalent RMPM Stock (Max)",
  demand: "Demand",
  summary: "FG Summary",
  cover: "Cover (Production End Date)",
};

export const COVER_COL_TOOLTIPS: Record<string, string> = {
  cover_fg:
    "Days of forward demand covered by on-hand FG stock alone (excludes RM/PM and Open PO).",
  // Formula: FG stock ÷ (Next 12-month demand ÷ 365).
  cover_total:
    "Days of forward demand covered by on-hand FG stock and the FG-equivalent of all available RM/PM (unrestricted stock, stock in quality, and Open PO)",
  // Formula: (FG stock + RM/PM total FG-equivalent) ÷ (Next 12-month demand ÷ 365).
  cover_excl:
    "Days of forward demand covered by on-hand FG stock and the FG-equivalent of RM/PM (unrestricted stock and stock in quality) - excludes Open PO.",
  // Formula: (FG stock + RM/PM unrestricted + quality FG-equivalent) ÷ (Next 12-month demand ÷ 365).
};

// ─── Frozen column widths ─────────────────────────────────────────────────────
export const W_SR = 46;

export const COLUMN_CUSTOMIZER_LABELS = {
  toggleButton: "Customise",
  panelTitle: "Customise Table",
  reset: "Reset",
  hintText: "DRAG SECTIONS OR COLUMNS · TOGGLE TO SHOW/HIDE",
  done: "Done",
  showSection: "Show section",
  hideSection: "Hide section",
  showColumn: "Show column",
  hideColumn: "Hide column",
};

// ─── Table hints bar (TableHintsBar.tsx) ───────────────────────────────────────

export const QUICK_TIPS_LABEL = "Quick tips";

export const TABLE_HINTS = [
  {
    target: "CBU Code",
    action: "Expand RM/PM components",
  },
  {
    target: "CBU Description",
    action: "Open CBU Detail",
  },
  {
    iconBg: "#e0f2f1",
    iconColor: "#00695C",
    target: "Flask icon",
    action: "Open Scenario Simulation",
  },
  {
    iconBg: "#dbeafe",
    iconColor: "#1565C0",
    target: "DC Stock",
    action: "View DC-level stock breakdown",
  },
  {
    iconBg: "#ffedd5",
    iconColor: "#ea580c",
    target: "Demand value",
    action: "View month breakdown",
  },
];

// ─── Pagination (TablePagination.tsx) ──────────────────────────────────────────

export const ROWS_PER_PAGE_LABEL = "Rows per page:";
export const PREV_PAGE_ARIA_LABEL = "Previous page";
export const NEXT_PAGE_ARIA_LABEL = "Next page";

// ─── Dashboard table (DashboardTable.tsx) ──────────────────────────────────────

export const SR_NO_LABEL = "Sr No";

export const noComponentDataMessage = (typeFilter: "ALL" | "RM" | "PM") =>
  `No component data for ${
    typeFilter !== "ALL"
      ? `type ${typeFilter === "RM" ? "1002 (RM)" : "1003 (PM)"}`
      : "this CBU"
  }`;

export const UNIQUE_COMPONENTS_LABEL = "Unique Components";
export const FILTERED_BADGE_LABEL = "filtered";
export const HIGH_CONTRIBUTING_GROUP_LABEL = "High Contributing Components (≥70%)";
export const HIGH_CONTRIBUTING_EMPTY_MESSAGE =
  "No high-contributing components for this CBU";

// ─── Cell renderers (cellRenderers.tsx) ────────────────────────────────────────

export const CELL_TOOLTIPS = {
  viewCbuDetail: "View CBU Detail",
  openScenarioSimulation: "Open Scenario Simulation",
  viewDcBreakdown: "Click to view the DC-level stock breakdown",
  noFactoryStock: "No factory stock currently recorded.",
  viewFactoryBreakdown: "Click to view the factory-level stock breakdown",
  noTransitStock: "No stock currently in transit.",
  viewTransitBreakdown: "Click to view the full in-transit stock breakdown",
};

export const EMPTY_CELL_PLACEHOLDER = "—";

// ─── Display-value formatting (utils.ts) ───────────────────────────────────────

export const SMALL_C_DISPLAY_LABELS: Record<string, string> = {
  "Skin Care": "SKIN",
  "Hair Care": "HAIR",
  "Oral Care": "ORAL",
};

export const BG_DISPLAY_LABELS: Record<string, string> = {
  HPC: "B&W",
};

export const FORMAT_DISPLAY_LABELS = {
  small: "SKIN BOTTLES (SMALL)",
  medium: "SKIN BOTTLES (MED)",
  large: "SKIN BOTTLES (LARGE)",
};

export const NO_STOCK_MESSAGE = "No stock currently recorded.";
