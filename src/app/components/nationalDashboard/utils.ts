import {
  getRowFilterAttributes,
  getRowBasePackCode,
  getRowBasePackDescription,
  getAggregatedComponents,
  getComponentDescription,
  getRowFgMaterial,
  PLANT_CLUSTER_MAP,
  TODAY,
  type CBURow,
  type AggregatedComponent,
  type CBURowFilterAttributes,
} from "../data";
import {
  ALL_COLS,
  W_SR,
  SMALL_C_DISPLAY_LABELS,
  BG_DISPLAY_LABELS,
  FORMAT_DISPLAY_LABELS,
  NO_STOCK_MESSAGE,
} from "../../constants/nationalDashboard";
import type {
  ColDef,
  ColumnGroup,
  CoverResult,
  EffRmpm,
  SortDir,
  TypeFilter,
} from "./types";

// ─── Column ordering / visibility ─────────────────────────────────────────────

export function buildDefaultColOrderByGroup(): Record<ColumnGroup, string[]> {
  const result = {} as Record<ColumnGroup, string[]>;
  for (const group of [
    "meta",
    "fg",
    "rmpm",
    "demand",
    "summary",
    "cover",
  ] as ColumnGroup[]) {
    result[group] = ALL_COLS.filter((c) => c.group === group).map(
      (c) => c.id,
    );
  }
  return result;
}

export function buildOrderedCols(
  groupOrder: ColumnGroup[],
  colOrderByGroup: Record<ColumnGroup, string[]>,
  hiddenGroups: Set<ColumnGroup>,
  hiddenCols: Set<string>,
): ColDef[] {
  return groupOrder
    .filter((g) => !hiddenGroups.has(g))
    .flatMap((g) =>
      colOrderByGroup[g]
        .map((id) => ALL_COLS.find((c) => c.id === id)!)
        .filter((col) => col && !hiddenCols.has(col.id)),
    );
}

export function countVisibleColumns(
  groupOrder: ColumnGroup[],
  colOrderByGroup: Record<ColumnGroup, string[]>,
  hiddenGroups: Set<ColumnGroup>,
  hiddenCols: Set<string>,
): number {
  return groupOrder
    .filter((g) => !hiddenGroups.has(g))
    .reduce(
      (sum, g) =>
        sum + colOrderByGroup[g].filter((id) => !hiddenCols.has(id)).length,
      0,
    );
}

export function computeGroupRuns(cols: ColDef[]) {
  const runs: Array<{ group: ColumnGroup; count: number }> = [];
  for (const col of cols) {
    const last = runs[runs.length - 1];
    if (last?.group === col.group) last.count++;
    else runs.push({ group: col.group, count: 1 });
  }
  return runs;
}

export function metaColsWidth(cols: ColDef[]): number {
  return cols.reduce((sum, col) => sum + col.minWidth, 0);
}

export function metaColLeft(cols: ColDef[], index: number): number {
  return W_SR + cols.slice(0, index).reduce((sum, col) => sum + col.minWidth, 0);
}

// ─── Display formatting ────────────────────────────────────────────────────────

export function mapSmallCDisplay(smallC: string): string {
  return SMALL_C_DISPLAY_LABELS[smallC] ?? smallC.toUpperCase();
}

export function mapBgDisplay(bg: string): string {
  return BG_DISPLAY_LABELS[bg] ?? bg.toUpperCase();
}

export function inferFormatDisplay(description: string): string {
  const mlMatch = description.match(/(\d+)\s*ML/i);
  const ml = mlMatch ? parseInt(mlMatch[1], 10) : 200;
  if (ml <= 100) return FORMAT_DISPLAY_LABELS.small;
  if (ml <= 300) return FORMAT_DISPLAY_LABELS.medium;
  return FORMAT_DISPLAY_LABELS.large;
}

export function formatBasePackOption(row: CBURow): string {
  return `${getRowBasePackCode(row)}: ${getRowBasePackDescription(row)}`;
}

export function formatCbuOption(row: CBURow): string {
  return `${row.cbuCode}: ${row.cbuDescription}`;
}

export function formatMaterialOptions(row: CBURow): string[] {
  const fgMaterial = getRowFgMaterial(row);
  return getAggregatedComponents(row.cbuCode, fgMaterial).map(
    (c) => `${c.componentCode}: ${getComponentDescription(c)}`,
  );
}

/** Lowercased haystack of every filterable field/value for a row, for the free-text search box. */
export function buildRowSearchText(
  row: CBURow,
  attrs: CBURowFilterAttributes,
): string {
  return [
    formatCbuOption(row),
    formatBasePackOption(row),
    ...formatMaterialOptions(row),
    attrs.bg,
    attrs.smallC,
    attrs.format,
    attrs.brand,
  ]
    .join(" ")
    .toLowerCase();
}

export function getMetaColumnValue(row: CBURow, colId: string): string {
  const attrs = getRowFilterAttributes(row);
  const basePackDescription = getRowBasePackDescription(row);
  switch (colId) {
    case "cbuCode":
      return row.cbuCode;
    case "cbuDescription":
      return row.cbuDescription;
    case "basePack":
      return getRowBasePackCode(row);
    case "basePackDescription":
      return basePackDescription;
    case "smallC":
      return mapSmallCDisplay(attrs.smallC);
    case "bg":
      return mapBgDisplay(attrs.bg);
    case "format":
      return inferFormatDisplay(basePackDescription);
    default:
      return "";
  }
}

// ─── FG stock location bifurcation ────────────────────────────────────────────
// No per-route In-Transit data exists in the mock dataset, so each row's
// In-Transit total is deterministically split across the app's real plant
// codes and regions (seeded by srNo, so it's stable across re-renders).
// DC Stock and Factory Stock have real per-location breakdown data instead —
// see DC_STOCK_BREAKDOWN / FACTORY_STOCK_BREAKDOWN in data.ts, surfaced via a
// click-through popup rather than a tooltip.
const ALL_PLANT_CODES = Object.keys(PLANT_CLUSTER_MAP);
const TRANSIT_DESTINATIONS = ["PATH", "NCRH", "HRIH"];

export function pickSeeded<T>(items: T[], count: number, seed: number): T[] {
  const n = Math.min(count, items.length);
  const start = ((seed % items.length) + items.length) % items.length;
  return Array.from({ length: n }, (_, i) => items[(start + i) % items.length]);
}

export function splitBySeed(
  total: number,
  labels: string[],
  seed: number,
): Array<{ label: string; value: number }> {
  if (total <= 0 || labels.length === 0) {
    return labels.map((label) => ({ label, value: 0 }));
  }
  let s = seed || 1;
  const weights = labels.map(() => {
    s = (s * 9301 + 49297) % 233280;
    return 0.4 + s / 233280;
  });
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => Math.round((total * w) / weightSum));
  const diff = total - raw.reduce((a, b) => a + b, 0);
  raw[raw.length - 1] += diff;
  return labels.map((label, i) => ({ label, value: raw[i] }));
}

export function transitTooltip(total: number, seed: number): string {
  if (total <= 0) return NO_STOCK_MESSAGE;
  const plants = pickSeeded(ALL_PLANT_CODES, 2, seed + 2);
  const routeLabels = plants.map(
    (p, i) => `${p} → ${TRANSIT_DESTINATIONS[(seed + i * 7) % TRANSIT_DESTINATIONS.length]}`,
  );
  const parts = splitBySeed(total, routeLabels, seed + 2);
  return (
    "In-Transit by route:\n" +
    parts.map((p) => `${p.label}: ${p.value.toLocaleString("en-IN")}`).join("\n")
  );
}

// ─── Cover / sort helpers ──────────────────────────────────────────────────────

export function calcCover(stock: number, demand12M: number): CoverResult {
  if (stock <= 0 || demand12M <= 0) return { days: null, date: "N/A" };
  const days = Math.round(stock / (demand12M / 365));
  const dt = new Date(TODAY.getTime() + days * 86_400_000);
  return {
    days,
    date: `${String(dt.getDate()).padStart(2, "0")}-${String(dt.getMonth() + 1).padStart(2, "0")}-${dt.getFullYear()}`,
  };
}

export function parseCoverDate(s: string): number {
  if (!s || s === "N/A" || s === "—") return Number.NEGATIVE_INFINITY;
  const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  if (ddmmyyyy) {
    return new Date(
      Number(ddmmyyyy[3]),
      Number(ddmmyyyy[2]) - 1,
      Number(ddmmyyyy[1]),
    ).getTime();
  }
  const yyyymm = /^(\d{4})-(\d{2})$/.exec(s);
  if (yyyymm) {
    return new Date(Number(yyyymm[1]), Number(yyyymm[2]) - 1, 1).getTime();
  }
  return 0;
}

/** The CBU-level RM/PM figure is bounded by whichever listed component peaks
 * highest (not their sum) — e.g. a CBU's physical stock can't exceed the max
 * of its components' physical stock. High-contributing components are only
 * folded into that max when their group is actually shown, since they're a
 * separately-sourced list (see DashboardTable.tsx). */
export function computeEffRmpm(
  components: AggregatedComponent[],
  highContribComponents: AggregatedComponent[],
  showHighContributing: boolean,
  selected: Set<string>,
  typeFilter: TypeFilter,
  row: CBURow,
): EffRmpm {
  if (components.length === 0 && highContribComponents.length === 0) return row.rmpm;
  const matchesType = (c: AggregatedComponent) =>
    typeFilter === "ALL" ||
    (typeFilter === "RM" && c.componentMaterialType === "1002") ||
    (typeFilter === "PM" && c.componentMaterialType === "1003");
  const pool = [
    ...components,
    ...(showHighContributing ? highContribComponents : []),
  ].filter(matchesType);
  const active = pool.filter((c) => selected.has(c.componentCode));
  if (active.length === 0)
    return {
      physicalStock: 0,
      qualityStock: 0,
      openPOStock: 0,
      totalStock: 0,
      blockedStock: 0,
    };
  const phy = Math.max(...active.map((c) => c.unrestrictedStock));
  const qty = Math.max(...active.map((c) => c.qualityStock));
  const opo = Math.max(...active.map((c) => c.openPOStock));
  const blk = Math.max(...active.map((c) => c.blockedStock));
  return {
    physicalStock: phy,
    qualityStock: qty,
    openPOStock: opo,
    totalStock: phy + qty + opo,
    blockedStock: blk,
  };
}

export function getEffRmpmForRow(
  row: CBURow,
  typeFilter: TypeFilter,
  componentCache: Record<number, AggregatedComponent[]>,
  selectedComponents: Record<number, Set<string>>,
  highContributingCache: Record<number, AggregatedComponent[]>,
  showHighContributing: boolean,
): EffRmpm {
  const comps = componentCache[row.srNo] ?? [];
  const highComps = highContributingCache[row.srNo] ?? [];
  const selected =
    selectedComponents[row.srNo] ??
    new Set([...comps.map((c) => c.componentCode), ...highComps.map((c) => c.componentCode)]);
  return computeEffRmpm(comps, highComps, showHighContributing, selected, typeFilter, row);
}

export function getRowSortValue(
  row: CBURow,
  colId: string,
  typeFilter: TypeFilter,
  componentCache: Record<number, AggregatedComponent[]>,
  selectedComponents: Record<number, Set<string>>,
  highContributingCache: Record<number, AggregatedComponent[]>,
  showHighContributing: boolean,
): string | number {
  const eff = getEffRmpmForRow(
    row,
    typeFilter,
    componentCache,
    selectedComponents,
    highContributingCache,
    showHighContributing,
  );
  const totalFG = row.fg.totalStock + eff.totalStock;
  const fgCov = calcCover(row.fg.totalStock, row.demand.next12Months);
  const totCov = calcCover(totalFG, row.demand.next12Months);
  const exclCov = calcCover(
    row.fg.totalStock + eff.physicalStock + eff.qualityStock,
    row.demand.next12Months,
  );

  switch (colId) {
    case "srNo":
      return row.srNo;
    case "cbuCode":
      return row.cbuCode;
    case "cbuDescription":
      return row.cbuDescription.toLowerCase();
    case "basePack":
      return getRowBasePackCode(row);
    case "basePackDescription":
      return getRowBasePackDescription(row).toLowerCase();
    case "smallC":
      return mapSmallCDisplay(getRowFilterAttributes(row).smallC);
    case "bg":
      return mapBgDisplay(getRowFilterAttributes(row).bg);
    case "format":
      return inferFormatDisplay(getRowBasePackDescription(row));
    case "fg_dc":
      return row.fg.dcStock;
    case "fg_intransit":
      return row.fg.inTransitStock;
    case "fg_factory":
      return row.fg.factoryStock;
    case "fg_total":
      return row.fg.totalStock;
    case "rmpm_physical":
      return eff.physicalStock;
    case "rmpm_quality":
      return eff.qualityStock;
    case "rmpm_openpo":
      return eff.openPOStock;
    case "rmpm_intransit":
    case "rmpm_supplier":
      return 0;
    case "rmpm_total":
      return eff.totalStock;
    case "rmpm_blocked":
      return eff.blockedStock;
    case "demand_3tdp":
      return row.demand.sumNext3TDP;
    case "demand_6m":
      return row.demand.next6Months;
    case "demand_12m":
      return row.demand.next12Months;
    case "total_fg":
      return totalFG;
    case "fg_cover_days":
      return fgCov.days ?? -1;
    case "cover_fg":
      return parseCoverDate(fgCov.date);
    case "cover_total":
      return parseCoverDate(totCov.date);
    case "cover_excl":
      return parseCoverDate(exclCov.date);
    default:
      return 0;
  }
}

export function compareSortValues(
  a: string | number,
  b: string | number,
  dir: SortDir,
): number {
  const mult = dir === "asc" ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") {
    return (a - b) * mult;
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true }) * mult;
}

export function getVisiblePages(
  page: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 1) return [1];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: Array<number | "ellipsis"> = [1];
  if (page > 3) pages.push("ellipsis");
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (page < totalPages - 2) pages.push("ellipsis");
  pages.push(totalPages);
  const deduped: Array<number | "ellipsis"> = [];
  for (const p of pages) {
    const prev = deduped[deduped.length - 1];
    if (p === "ellipsis" && prev === "ellipsis") continue;
    if (typeof p === "number" && p === prev) continue;
    deduped.push(p);
  }
  return deduped;
}

// ─── Cell theming / sticky-column styles ──────────────────────────────────────

export function getColTheme(colId: string): { bg: string; text: string } {
  if (
    [
      "cbuCode",
      "cbuDescription",
      "basePack",
      "basePackDescription",
      "smallC",
      "bg",
      "format",
    ].includes(colId)
  ) {
    return { bg: "#e8edf6", text: "#003087" };
  }
  if (["fg_dc", "fg_factory", "fg_intransit", "fg_total"].includes(colId)) {
    return { bg: "#dbeafe", text: "#1565C0" };
  }
  if (
    [
      "rmpm_physical",
      "rmpm_quality",
      "rmpm_openpo",
      "rmpm_intransit",
      "rmpm_supplier",
      "rmpm_total",
      "rmpm_blocked",
    ].includes(colId)
  ) {
    return { bg: "#ecfdf5", text: "#00695C" };
  }
  if (["demand_3tdp", "demand_6m", "demand_12m"].includes(colId)) {
    return { bg: "#daeefb", text: "#0277BD" };
  }
  if (
    ["total_fg", "fg_cover_days", "cover_fg", "cover_total", "cover_excl"].includes(
      colId,
    )
  ) {
    return { bg: "#EDF1F7", text: "#003087" };
  }
  return { bg: "#EDF5FA", text: "#374151" };
}

export function cellBaseStyle(colId: string): React.CSSProperties {
  const theme = getColTheme(colId);
  return {
    color: theme.text,
    border: "1px solid #c8d8e8",
  };
}

// Returns header + body cell colours aligned per column group
export function subHdrStyle(colId: string): React.CSSProperties {
  const theme = getColTheme(colId);
  return { backgroundColor: theme.bg, color: theme.text };
}

export function stickyHead(left: number, minWidth: number): React.CSSProperties {
  return {
    position: "sticky",
    left,
    zIndex: 30,
    minWidth,
    maxWidth: minWidth,
  };
}

export function stickyBody(
  left: number,
  minWidth: number,
  bg: string,
): React.CSSProperties {
  return {
    position: "sticky",
    left,
    zIndex: 5,
    minWidth,
    maxWidth: minWidth,
    backgroundColor: bg,
  };
}
