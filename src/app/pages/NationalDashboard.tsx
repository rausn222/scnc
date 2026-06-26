import React from "react";
import { useState, useRef, Fragment, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import {
  cbuData,
  getAggregatedComponents,
  getRowFgMaterial,
  getComponentDescription,
  getRowFilterAttributes,
  getRowBasePackCode,
  getRowBasePackDescription,
  buildFilterOptions,
  STATIC_FILTER_OPTIONS,
  type CBURow,
  type AggregatedComponent,
} from "../components/data";
import { DemandModal } from "../components/DemandModal";
import { PageHeader } from "../components/PageHeader";
import {
  ALL_FILTER_DEFINITIONS,
  DEFAULT_FILTER_ORDER,
  DEFAULT_VISIBLE_FILTER_IDS,
  MoreFiltersPanel,
  type FilterId,
} from "../components/MoreFiltersPanel";
import { FilterDropdown, FilterToggle } from "../components/FilterDropdown";
import { useNav } from "../App";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  RefreshCw,
  Download,
  Search,
  GripVertical,
  ExternalLink,
  Cpu,
  Zap,
  Bot,
  SlidersHorizontal,
  Info,
  Settings2,
  Eye,
  EyeOff,
  RotateCcw,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type UomFilter = "EA" | "MT";
type TypeFilter = "ALL" | "RM" | "PM";
type ColumnGroup =
  | "meta"
  | "fg"
  | "rmpm"
  | "demand"
  | "summary"
  | "cover";

interface ColDef {
  id: string;
  group: ColumnGroup;
  label: string;
  minWidth: number;
}

interface EffRmpm {
  physicalStock: number;
  qualityStock: number;
  openPOStock: number;
  totalStock: number;
  blockedStock: number;
}
interface CoverResult {
  days: number | null;
  date: string;
}

type SortDir = "asc" | "desc";

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

// ─── Column definitions ───────────────────────────────────────────────────────

const ALL_COLS: ColDef[] = [
  {
    id: "cbuCode",
    group: "meta",
    label: "CBU",
    minWidth: 118,
  },
  {
    id: "cbuDescription",
    group: "meta",
    label: "CBU Description",
    minWidth: 215,
  },
  {
    id: "basePack",
    group: "meta",
    label: "BasePack",
    minWidth: 90,
  },
  {
    id: "basePackDescription",
    group: "meta",
    label: "BasePack Description",
    minWidth: 220,
  },
  {
    id: "smallC",
    group: "meta",
    label: "Small C",
    minWidth: 72,
  },
  {
    id: "bg",
    group: "meta",
    label: "BG",
    minWidth: 56,
  },
  {
    id: "format",
    group: "meta",
    label: "Format",
    minWidth: 140,
  },
  {
    id: "fg_dc",
    group: "fg",
    label: "DC Stock",
    minWidth: 100,
  },
  {
    id: "fg_intransit",
    group: "fg",
    label: "In-Transit",
    minWidth: 90,
  },
  {
    id: "fg_factory",
    group: "fg",
    label: "Factory Stock",
    minWidth: 100,
  },
  {
    id: "fg_total",
    group: "fg",
    label: "Total Stock",
    minWidth: 100,
  },
  {
    id: "rmpm_physical",
    group: "rmpm",
    label: "Physical Stock",
    minWidth: 100,
  },
  {
    id: "rmpm_quality",
    group: "rmpm",
    label: "Quality Stock",
    minWidth: 90,
  },
  {
    id: "rmpm_openpo",
    group: "rmpm",
    label: "Open PO Stock",
    minWidth: 90,
  },
  {
    id: "rmpm_intransit",
    group: "rmpm",
    label: "In-Transit",
    minWidth: 90,
  },
  {
    id: "rmpm_supplier",
    group: "rmpm",
    label: "Supplier Inventory",
    minWidth: 110,
  },
  {
    id: "rmpm_total",
    group: "rmpm",
    label: "Total Stock",
    minWidth: 100,
  },
  {
    id: "rmpm_blocked",
    group: "rmpm",
    label: "Blocked Stock",
    minWidth: 90,
  },
  {
    id: "demand_3tdp",
    group: "demand",
    label: "Next 3 TDP",
    minWidth: 90,
  },
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
  {
    id: "total_fg",
    group: "summary",
    label: "Total FG",
    minWidth: 100,
  },
  {
    id: "fg_cover_days",
    group: "summary",
    label: "Total FG Cover (Days)",
    minWidth: 115,
  },
  {
    id: "cover_fg",
    group: "cover",
    label: "FG Cover",
    minWidth: 100,
  },
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

const DEFAULT_GROUP_ORDER: ColumnGroup[] = [
  "meta",
  "fg",
  "rmpm",
  "demand",
  "summary",
  "cover",
];

function buildDefaultColOrderByGroup(): Record<ColumnGroup, string[]> {
  const result = {} as Record<ColumnGroup, string[]>;
  for (const group of DEFAULT_GROUP_ORDER) {
    result[group] = ALL_COLS.filter((c) => c.group === group).map(
      (c) => c.id,
    );
  }
  return result;
}

function buildOrderedCols(
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

function countVisibleColumns(
  groupOrder: ColumnGroup[],
  colOrderByGroup: Record<ColumnGroup, string[]>,
  hiddenGroups: Set<ColumnGroup>,
  hiddenCols: Set<string>,
): number {
  return groupOrder
    .filter((g) => !hiddenGroups.has(g))
    .reduce(
      (sum, g) =>
        sum +
        colOrderByGroup[g].filter((id) => !hiddenCols.has(id)).length,
      0,
    );
}

// ─── Theme colours ────────────────────────────────────────────────────────────
// Group header backgrounds (dark, rich)
const G: Record<ColumnGroup, { hdr: string; sub: string }> = {
  meta: { hdr: "#003087", sub: "#e8edf6" },
  fg: { hdr: "#1565C0", sub: "#1256a8" },
  rmpm: { hdr: "#00695C", sub: "#005548" },
  demand: { hdr: "#0277BD", sub: "#0166a0" },
  summary: { hdr: "#003087", sub: "#EDF1F7" },
  cover: { hdr: "#003087", sub: "#EDF1F7" },
};

const G_LABEL: Record<ColumnGroup, string> = {
  meta: "Product Info",
  fg: "FG Stock Across All Locations",
  rmpm: "FG Equivalent RMPM Stock (Max)",
  demand: "Demand",
  summary: "FG Summary",
  cover: "Cover (Production End Date)",
};

// ─── Frozen column widths ─────────────────────────────────────────────────────
const W_SR = 46;

function metaColsWidth(cols: ColDef[]): number {
  return cols.reduce((sum, col) => sum + col.minWidth, 0);
}

function metaColLeft(cols: ColDef[], index: number): number {
  return W_SR + cols.slice(0, index).reduce((sum, col) => sum + col.minWidth, 0);
}

function mapSmallCDisplay(smallC: string): string {
  if (smallC === "Skin Care") return "SKIN";
  if (smallC === "Hair Care") return "HAIR";
  if (smallC === "Oral Care") return "ORAL";
  return smallC.toUpperCase();
}

function mapBgDisplay(bg: string): string {
  if (bg === "HPC") return "B&W";
  return bg.toUpperCase();
}

function inferFormatDisplay(description: string): string {
  const mlMatch = description.match(/(\d+)\s*ML/i);
  const ml = mlMatch ? parseInt(mlMatch[1], 10) : 200;
  if (ml <= 100) return "SKIN BOTTLES (SMALL)";
  if (ml <= 300) return "SKIN BOTTLES (MED)";
  return "SKIN BOTTLES (LARGE)";
}

function getMetaColumnValue(row: CBURow, colId: string): string {
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

// ─── Constants ────────────────────────────────────────────────────────────────
const TODAY = new Date(2026, 5, 11);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcCover(
  stock: number,
  demand12M: number,
): CoverResult {
  if (stock <= 0 || demand12M <= 0)
    return { days: null, date: "N/A" };
  const days = Math.round(stock / (demand12M / 365));
  const dt = new Date(TODAY.getTime() + days * 86_400_000);
  return {
    days,
    date: `${String(dt.getDate()).padStart(2, "0")}-${String(dt.getMonth() + 1).padStart(2, "0")}-${dt.getFullYear()}`,
  };
}

function parseCoverDate(s: string): number {
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

function getEffRmpmForRow(
  row: CBURow,
  typeFilter: TypeFilter,
  componentCache: Record<number, AggregatedComponent[]>,
  selectedComponents: Record<number, Set<string>>,
): EffRmpm {
  const comps =
    componentCache[row.srNo] ??
    getAggregatedComponents(row.cbuCode, getRowFgMaterial(row));
  const selected =
    selectedComponents[row.srNo] ??
    new Set(comps.map((c) => c.componentCode));
  return computeEffRmpm(comps, selected, typeFilter, row);
}

function getRowSortValue(
  row: CBURow,
  colId: string,
  typeFilter: TypeFilter,
  componentCache: Record<number, AggregatedComponent[]>,
  selectedComponents: Record<number, Set<string>>,
): string | number {
  const eff = getEffRmpmForRow(
    row,
    typeFilter,
    componentCache,
    selectedComponents,
  );
  const totalFG = row.fg.totalStock + eff.totalStock;
  const fgCov = calcCover(row.fg.totalStock, row.demand.next12Months);
  const totCov = calcCover(totalFG, row.demand.next12Months);
  const exclCov = calcCover(
    row.fg.totalStock + eff.physicalStock,
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

function compareSortValues(
  a: string | number,
  b: string | number,
  dir: SortDir,
): number {
  const mult = dir === "asc" ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") {
    return (a - b) * mult;
  }
  return (
    String(a).localeCompare(String(b), undefined, { numeric: true }) * mult
  );
}

function getVisiblePages(
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

function SortIndicator({
  colId,
  sortCol,
  sortDir,
  light = false,
}: {
  colId: string;
  sortCol: string | null;
  sortDir: SortDir;
  light?: boolean;
}) {
  const active = sortCol === colId;
  const color = light ? "rgba(255,255,255,0.9)" : undefined;
  if (!active) {
    return (
      <span
        className="inline-flex flex-col leading-none"
        style={{ opacity: light ? 0.5 : 0.35, color }}
      >
        <ChevronUp size={9} style={{ marginBottom: -3 }} />
        <ChevronDown size={9} />
      </span>
    );
  }
  return sortDir === "asc" ? (
    <ChevronUp size={12} style={{ color }} />
  ) : (
    <ChevronDown size={12} style={{ color }} />
  );
}

function TablePagination({
  page,
  rowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
}: {
  page: number;
  rowsPerPage: number;
  totalRows: number;
  onPageChange: (p: number) => void;
  onRowsPerPageChange: (n: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = totalRows === 0 ? 0 : (safePage - 1) * rowsPerPage + 1;
  const end = Math.min(safePage * rowsPerPage, totalRows);
  const pages = getVisiblePages(safePage, totalPages);

  return (
    <div
      className="shrink-0 px-4 py-2.5 flex items-center justify-between border-t text-xs"
      style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span style={{ color: "#374151" }}>Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            className="border rounded px-2 py-1 text-xs cursor-pointer bg-white"
            style={{ borderColor: "#d1d5db", color: "#374151" }}
          >
            {ROWS_PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <span style={{ color: "#6b7280" }}>
          {start}-{end} of {totalRows}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          style={{ color: "#374151" }}
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span
              key={`ellipsis-${i}`}
              className="px-1.5 select-none"
              style={{ color: "#6b7280" }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className="min-w-[28px] h-7 px-1.5 rounded text-xs font-medium transition-colors"
              style={
                p === safePage
                  ? {
                      backgroundColor: "#1565C0",
                      color: "#ffffff",
                    }
                  : { color: "#374151" }
              }
              onMouseEnter={(e) => {
                if (p !== safePage) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#f3f4f6";
                }
              }}
              onMouseLeave={(e) => {
                if (p !== safePage) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "transparent";
                }
              }}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          style={{ color: "#374151" }}
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function fmtN(
  n: number,
  wt: number,
  uom: UomFilter,
): React.ReactNode {
  if (n === 0)
    return <span style={{ color: "#d1d5db" }}>—</span>;
  if (uom === "MT") {
    const t = (n * wt) / 1000;
    return <span>{t < 1 ? t.toFixed(3) : t.toFixed(2)}</span>;
  }
  return <span>{n.toLocaleString()}</span>;
}

function fmtDays(d: number | null): React.ReactNode {
  if (d === null)
    return <span style={{ color: "#d1d5db" }}>—</span>;
  const cls =
    d < 30 ? "#ef4444" : d < 90 ? "#f59e0b" : "#22c55e";
  return (
    <span style={{ color: cls, fontWeight: 700 }}>{d}d</span>
  );
}

function fmtDate(s: string): React.ReactNode {
  if (!s || s === "N/A")
    return (
      <span
        style={{
          color: "#d1d5db",
          fontStyle: "italic",
          fontSize: 11,
        }}
      >
        N/A
      </span>
    );
  return <span className="text-[#2d2e2e]">{s}</span>;
}

function computeGroupRuns(cols: ColDef[]) {
  const runs: Array<{ group: ColumnGroup; count: number }> = [];
  for (const col of cols) {
    const last = runs[runs.length - 1];
    if (last?.group === col.group) last.count++;
    else runs.push({ group: col.group, count: 1 });
  }
  return runs;
}

function computeEffRmpm(
  components: AggregatedComponent[],
  selected: Set<string>,
  typeFilter: TypeFilter,
  row: CBURow,
): EffRmpm {
  if (components.length === 0) return row.rmpm;
  const tf = components.filter(
    (c) =>
      typeFilter === "ALL" ||
      (typeFilter === "RM" &&
        c.componentMaterialType === "1002") ||
      (typeFilter === "PM" &&
        c.componentMaterialType === "1003"),
  );
  const active = tf.filter((c) =>
    selected.has(c.componentCode),
  );
  if (active.length === 0)
    return {
      physicalStock: 0,
      qualityStock: 0,
      openPOStock: 0,
      totalStock: 0,
      blockedStock: 0,
    };
  if (
    typeFilter === "ALL" &&
    active.length === components.length
  )
    return row.rmpm;
  const phy = active.reduce(
    (s, c) => s + c.unrestrictedStock,
    0,
  );
  const qty = active.reduce((s, c) => s + c.qualityStock, 0);
  const opo = active.reduce((s, c) => s + c.openPOStock, 0);
  const blk = active.reduce((s, c) => s + c.blockedStock, 0);
  return {
    physicalStock: phy,
    qualityStock: qty,
    openPOStock: opo,
    totalStock: phy + qty + opo,
    blockedStock: blk,
  };
}

// ─── Cell renderers ───────────────────────────────────────────────────────────

function metaCell(
  col: ColDef,
  row: CBURow,
  rowBg: string,
  isExpanded: boolean,
  onCbuClick: (row: CBURow) => void,
  onSciDetail: (srNo: number) => void,
  onCbuDetail: (srNo: number) => void,
  stickyLeft: number,
): React.ReactNode {
  const baseStyle: React.CSSProperties = {
    ...stickyBody(stickyLeft, col.minWidth, rowBg),
    borderColor: "#e5e7eb",
  };

  if (col.id === "cbuCode") {
    return (
      <td
        key={col.id}
        className="px-2 py-1 border font-semibold cursor-pointer"
        style={baseStyle}
        onClick={() => onCbuClick(row)}
      >
        <span
          className="flex items-center gap-1.5 whitespace-nowrap"
          style={{ color: "#1565C0" }}
        >
          {isExpanded ? (
            <ChevronDown size={13} style={{ color: "#1565C0", flexShrink: 0 }} />
          ) : (
            <ChevronRight size={13} style={{ color: "#1565C0", flexShrink: 0 }} />
          )}
          {row.cbuCode}
        </span>
      </td>
    );
  }

  if (col.id === "cbuDescription") {
    return (
      <td key={col.id} className="px-2 py-1 border" style={baseStyle}>
        <div className="flex items-center justify-between gap-1">
          <span
            className="truncate hover:underline cursor-pointer"
            style={{ color: "#374151", maxWidth: col.minWidth - 28 }}
            title={row.cbuDescription}
            onClick={() => onSciDetail(row.srNo)}
          >
            {row.cbuDescription}
          </span>
          <button
            onClick={() => onCbuDetail(row.srNo)}
            title="View CBU Detail"
            className="shrink-0 p-1 rounded transition-colors"
            style={{ color: "#1565C0" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#EDF5F4";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "transparent";
            }}
          >
            <FlaskConical size={12} aria-hidden="true" />
          </button>
        </div>
      </td>
    );
  }

  const value = getMetaColumnValue(row, col.id);
  return (
    <td
      key={col.id}
      className="px-2 py-1 border truncate"
      style={{ ...baseStyle, color: "#374151" }}
      title={value}
    >
      {value || "—"}
    </td>
  );
}

function mainCell(
  colId: string,
  row: CBURow,
  eff: EffRmpm,
  uom: UomFilter,
  totalFG: number,
  fgCov: CoverResult,
  totCov: CoverResult,
  exclCov: CoverResult,
  onDemand: (
    e: React.MouseEvent,
    period: "3tdp" | "6m" | "12m",
  ) => void,
): React.ReactNode {
  const s = (cid: string, n: number) =>
    fmtNWithTheme(n, row.weightKg, uom, getColTheme(cid).text);
  switch (colId) {
    case "fg_dc":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right"
        >
          {s(colId, row.fg.dcStock)}
        </td>
      );
    case "fg_factory":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right"
        >
          {s(colId, row.fg.factoryStock)}
        </td>
      );
    case "fg_intransit":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right"
        >
          {s(colId, row.fg.inTransitStock)}
        </td>
      );
    case "fg_total":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right font-semibold"
        >
          {s(colId, row.fg.totalStock)}
        </td>
      );
    case "rmpm_physical":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right"
        >
          {s(colId, eff.physicalStock)}
        </td>
      );
    case "rmpm_quality":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right"
        >
          {s(colId, eff.qualityStock)}
        </td>
      );
    case "rmpm_openpo":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right"
        >
          {s(colId, eff.openPOStock)}
        </td>
      );
    case "rmpm_intransit":
    case "rmpm_supplier":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right"
        />
      );
    case "rmpm_total":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right font-semibold"
        >
          {s(colId, eff.totalStock)}
        </td>
      );
    case "rmpm_blocked":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right"
        >
          {s(colId, eff.blockedStock)}
        </td>
      );
    case "demand_3tdp":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right cursor-pointer transition-colors font-medium hover:underline"
          onClick={(e) => onDemand(e, "3tdp")}
        >
          {s(colId, row.demand.sumNext3TDP)}
        </td>
      );
    case "demand_6m":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right cursor-pointer transition-colors font-medium hover:underline"
          onClick={(e) => onDemand(e, "6m")}
        >
          {s(colId, row.demand.next6Months)}
        </td>
      );
    case "demand_12m":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right cursor-pointer transition-colors font-semibold hover:underline"
          onClick={(e) => onDemand(e, "12m")}
        >
          {s(colId, row.demand.next12Months)}
        </td>
      );
    case "total_fg":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right font-semibold"
        >
          {s(colId, totalFG)}
        </td>
      );
    case "fg_cover_days":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right"
        >
          {fmtDaysThemed(totCov.days, getColTheme(colId).text)}
        </td>
      );
    case "cover_fg":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right whitespace-nowrap"
        >
          {fmtDateThemed(fgCov.date, getColTheme(colId).text)}
        </td>
      );
    case "cover_total":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right whitespace-nowrap"
        >
          {fmtDateThemed(totCov.date, getColTheme(colId).text)}
        </td>
      );
    case "cover_excl":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right whitespace-nowrap"
        >
          {fmtDateThemed(exclCov.date, getColTheme(colId).text)}
        </td>
      );
    default:
      return (
        <td
          key={colId}
          className="px-2 py-1 border border-gray-100"
        />
      );
  }
}

function compCell(
  colId: string,
  comp: AggregatedComponent,
  row: CBURow,
  uom: UomFilter,
): React.ReactNode {
  const s = (cid: string, n: number) =>
    fmtNWithTheme(n, row.weightKg, uom, getColTheme(cid).text);
  const avail =
    comp.unrestrictedStock +
    comp.qualityStock +
    comp.openPOStock;
  const cov = calcCover(avail, row.demand.next12Months);
  const covFg = calcCover(
    comp.unrestrictedStock,
    row.demand.next12Months,
  );
  const covExcl = calcCover(
    comp.unrestrictedStock + comp.qualityStock,
    row.demand.next12Months,
  );
  const blank = (
    <td
      key={colId}
      className="border"
      style={{
        ...cellBaseStyle(colId),
        borderColor: "#c8d8e8",
      }}
    />
  );
  switch (colId) {
    case "fg_dc":
    case "fg_factory":
    case "fg_intransit":
    case "fg_total":
      return blank;
    case "rmpm_physical":
      return (
        <td
          key={colId}
          className="px-3 py-2 text-right font-medium"
          style={cellBaseStyle(colId)}
        >
          {s(colId, comp.unrestrictedStock)}
        </td>
      );
    case "rmpm_quality":
      return (
        <td
          key={colId}
          className="px-3 py-2 text-right"
          style={cellBaseStyle(colId)}
        >
          {s(colId, comp.qualityStock)}
        </td>
      );
    case "rmpm_openpo":
      return (
        <td
          key={colId}
          className="px-3 py-2 text-right"
          style={cellBaseStyle(colId)}
        >
          {s(colId, comp.openPOStock)}
        </td>
      );
    case "rmpm_intransit":
    case "rmpm_supplier":
      return blank;
    case "rmpm_total":
      return (
        <td
          key={colId}
          className="px-3 py-2 text-right font-semibold"
          style={cellBaseStyle(colId)}
        >
          {s(colId, avail)}
        </td>
      );
    case "rmpm_blocked":
      return (
        <td
          key={colId}
          className="px-3 py-2 text-right"
          style={cellBaseStyle(colId)}
        >
          {s(colId, comp.blockedStock)}
        </td>
      );
    case "demand_3tdp":
    case "demand_6m":
    case "demand_12m":
    case "total_fg":
      return blank;
    case "fg_cover_days":
      return (
        <td
          key={colId}
          className="px-3 py-2 text-right"
          style={cellBaseStyle(colId)}
        >
          {fmtDaysThemed(cov.days, getColTheme(colId).text)}
        </td>
      );
    case "cover_fg":
      return (
        <td
          key={colId}
          className="px-3 py-2 text-right whitespace-nowrap"
          style={cellBaseStyle(colId)}
        >
          {fmtDateThemed(covFg.date, getColTheme(colId).text)}
        </td>
      );
    case "cover_total":
      return (
        <td
          key={colId}
          className="px-3 py-2 text-right whitespace-nowrap"
          style={cellBaseStyle(colId)}
        >
          {fmtDateThemed(cov.date, getColTheme(colId).text)}
        </td>
      );
    case "cover_excl":
      return (
        <td
          key={colId}
          className="px-3 py-2 text-right whitespace-nowrap"
          style={cellBaseStyle(colId)}
        >
          {fmtDateThemed(covExcl.date, getColTheme(colId).text)}
        </td>
      );
    default:
      return blank;
  }
}

function fmtNWithTheme(
  n: number,
  wt: number,
  uom: UomFilter,
  textColor: string,
): React.ReactNode {
  if (n === 0)
    return <span style={{ color: "#d1d5db" }}>—</span>;
  if (uom === "MT") {
    const t = (n * wt) / 1000;
    return (
      <span style={{ color: textColor }}>
        {t < 1 ? t.toFixed(3) : t.toFixed(2)}
      </span>
    );
  }
  return (
    <span style={{ color: textColor }}>{n.toLocaleString()}</span>
  );
}

function fmtDaysThemed(
  d: number | null,
  textColor: string,
): React.ReactNode {
  if (d === null)
    return <span style={{ color: "#d1d5db" }}>—</span>;
  return (
    <span style={{ color: textColor, fontWeight: 700 }}>{d}d</span>
  );
}

function fmtDateThemed(
  s: string,
  textColor: string,
): React.ReactNode {
  if (!s || s === "N/A")
    return (
      <span
        style={{
          color: "#d1d5db",
          fontStyle: "italic",
          fontSize: 11,
        }}
      >
        N/A
      </span>
    );
  return <span style={{ color: textColor }}>{s}</span>;
}

function getColTheme(colId: string): { bg: string; text: string } {
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
  if (
    ["fg_dc", "fg_factory", "fg_intransit", "fg_total"].includes(colId)
  ) {
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
    [
      "total_fg",
      "fg_cover_days",
      "cover_fg",
      "cover_total",
      "cover_excl",
    ].includes(colId)
  ) {
    return { bg: "#EDF1F7", text: "#003087" };
  }
  return { bg: "#EDF5FA", text: "#374151" };
}

function cellBaseStyle(colId: string): React.CSSProperties {
  const theme = getColTheme(colId);
  return {
    color: theme.text,
    border: "1px solid #c8d8e8",
  };
}

// Returns header + body cell colours aligned per column group
function subHdrStyle(colId: string): React.CSSProperties {
  const theme = getColTheme(colId);
  return { backgroundColor: theme.bg, color: theme.text };
}

function stickyHead(left: number, minWidth: number): React.CSSProperties {
  return {
    position: "sticky",
    left,
    zIndex: 30,
    minWidth,
    maxWidth: minWidth,
  };
}

function stickyBody(
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function NationalDashboard() {
  const { navigate } = useNav();
  const [groupOrder, setGroupOrder] = useState<ColumnGroup[]>(
    DEFAULT_GROUP_ORDER,
  );
  const [colOrderByGroup, setColOrderByGroup] = useState<
    Record<ColumnGroup, string[]>
  >(buildDefaultColOrderByGroup);
  const [hiddenGroups, setHiddenGroups] = useState<Set<ColumnGroup>>(
    new Set(),
  );
  const [expandedSrNo, setExpandedSrNo] = useState<number | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<
    Record<number, Set<string>>
  >({});
  const [componentCache, setComponentCache] = useState<
    Record<number, AggregatedComponent[]>
  >({});
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [demandModal, setDemandModal] = useState<{
    code: string;
    desc: string;
    period: "3tdp" | "6m" | "12m";
  } | null>(null);
  const [search, setSearch] = useState("");
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(
    new Set(),
  );
  const [filterOrder, setFilterOrder] =
    useState<FilterId[]>(DEFAULT_FILTER_ORDER);
  const [visibleFilters, setVisibleFilters] = useState<Set<FilterId>>(
    () => new Set(DEFAULT_VISIBLE_FILTER_IDS),
  );
  const [dropdownFilters, setDropdownFilters] = useState<
    Record<FilterId, string>
  >({
    bg: "All",
    smallC: "All",
    format: "All",
    materialType: "ALL",
    uom: "EA",
    brand: "All",
    materialCode: "All",
    materialDescription: "All",
    cbuCode: "All",
    cbuDescription: "All",
    basePack: "All",
    basePackDescription: "All",
  });

  const orderedCols = buildOrderedCols(
    groupOrder,
    colOrderByGroup,
    hiddenGroups,
    hiddenCols,
  );
  const orderedMetaCols = useMemo(
    () => orderedCols.filter((col) => col.group === "meta"),
    [orderedCols],
  );
  const orderedDataCols = useMemo(
    () => orderedCols.filter((col) => col.group !== "meta"),
    [orderedCols],
  );
  const groupRuns = useMemo(
    () => computeGroupRuns(orderedDataCols),
    [orderedDataCols],
  );
  const metaWidth = metaColsWidth(orderedMetaCols);
  const tableMinWidth =
    W_SR +
    metaWidth +
    orderedDataCols.reduce((sum, col) => sum + col.minWidth, 0);
  const stickyColCount = 1 + orderedMetaCols.length;

  const uom = dropdownFilters.uom as UomFilter;
  const typeFilter = dropdownFilters.materialType as TypeFilter;

  function setUom(next: UomFilter) {
    setDropdownFilters((prev) => ({ ...prev, uom: next }));
  }

  function setTypeFilter(next: TypeFilter) {
    setDropdownFilters((prev) => ({ ...prev, materialType: next }));
  }

  function setDropdownFilter(id: FilterId, value: string) {
    setDropdownFilters((prev) => ({ ...prev, [id]: value }));
  }

  function getFilterOptions(id: FilterId): string[] {
    if (id === "materialType") return ["ALL", "RM", "PM"];
    if (id === "uom") return ["EA", "MT"];
    if (id in STATIC_FILTER_OPTIONS) {
      return STATIC_FILTER_OPTIONS[
        id as keyof typeof STATIC_FILTER_OPTIONS
      ]!;
    }
    return buildFilterOptions(
      id as keyof ReturnType<typeof getRowFilterAttributes>,
    );
  }

  const toolbarFilters = filterOrder.filter((id) => visibleFilters.has(id));

  const activeHiddenFilterCount = filterOrder.filter(
    (id) =>
      !visibleFilters.has(id) &&
      dropdownFilters[id] !== "All" &&
      dropdownFilters[id] !== "ALL" &&
      !(id === "uom" && dropdownFilters[id] === "EA"),
  ).length;

  const filtered = cbuData.filter((row) => {
    const attrs = getRowFilterAttributes(row);
    const q = search.toLowerCase();

    if (
      q &&
      !row.cbuCode.toLowerCase().includes(q) &&
      !row.cbuDescription.toLowerCase().includes(q)
    ) {
      return false;
    }

    const checks: Array<[FilterId, string]> = [
      ["bg", attrs.bg],
      ["smallC", attrs.smallC],
      ["format", attrs.format],
      ["brand", attrs.brand],
      ["materialCode", attrs.materialCode],
      ["materialDescription", attrs.materialDescription],
      ["cbuCode", attrs.cbuCode],
      ["cbuDescription", attrs.cbuDescription],
      ["basePack", attrs.basePack],
      ["basePackDescription", attrs.basePackDescription],
    ];

    for (const [filterId, rowValue] of checks) {
      const selected = dropdownFilters[filterId];
      if (selected !== "All" && rowValue !== selected) return false;
    }

    return true;
  });

  const sortedRows = useMemo(() => {
    if (!sortCol) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) =>
      compareSortValues(
        getRowSortValue(
          a,
          sortCol,
          typeFilter,
          componentCache,
          selectedComponents,
        ),
        getRowSortValue(
          b,
          sortCol,
          typeFilter,
          componentCache,
          selectedComponents,
        ),
        sortDir,
      ),
    );
    return copy;
  }, [
    filtered,
    sortCol,
    sortDir,
    typeFilter,
    componentCache,
    selectedComponents,
  ]);

  const activeRowCount = sortedRows.length;

  const totalPages = Math.max(1, Math.ceil(activeRowCount / rowsPerPage));
  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(
    () =>
      sortedRows.slice(
        (safePage - 1) * rowsPerPage,
        safePage * rowsPerPage,
      ),
    [sortedRows, safePage, rowsPerPage],
  );

  useEffect(() => {
    setPage(1);
  }, [search, dropdownFilters, sortCol, sortDir, rowsPerPage]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function handleSort(colId: string) {
    if (sortCol === colId) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(colId);
      setSortDir("asc");
    }
  }

  function handleCBUClick(row: CBURow) {
    if (expandedSrNo === row.srNo) {
      setExpandedSrNo(null);
      return;
    }
    setExpandedSrNo(row.srNo);
    if (!componentCache[row.srNo]) {
      const comps = getAggregatedComponents(
        row.cbuCode,
        getRowFgMaterial(row),
      );
      setComponentCache((prev) => ({ ...prev, [row.srNo]: comps }));
      setSelectedComponents((prev) => ({
        ...prev,
        [row.srNo]: new Set(comps.map((c) => c.componentCode)),
      }));
    }
  }

  function toggleComp(srNo: number, code: string) {
    setSelectedComponents((prev) => {
      const s = new Set(prev[srNo] ?? []);
      s.has(code) ? s.delete(code) : s.add(code);
      return { ...prev, [srNo]: s };
    });
  }

  function toggleAll(
    srNo: number,
    comps: AggregatedComponent[],
    allSel: boolean,
  ) {
    setSelectedComponents((prev) => ({
      ...prev,
      [srNo]: allSel
        ? new Set()
        : new Set(comps.map((c) => c.componentCode)),
    }));
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <PageHeader
          title="National Level Transition Dashboard"
          breadcrumbs={[
            { label: "SAMARTH" },
            { label: "Network Planner" },
            { label: "CBU Transition (National View)" },
          ]}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Refresh"
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{
              backgroundColor: "#ffffff24",
              color: "#fff",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "#e5e7eb",
            }}
          >
            <RefreshCw size={14} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Export"
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{
              backgroundColor: "#ffffff24",
              color: "#fff",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "#e5e7eb",
            }}
          >
            <Download size={14} />
          </motion.button>
        </PageHeader>

        {/* ── Row 1: Search + UOM + Customise ── */}
        <div
          className="px-5 py-2 shrink-0 flex items-center gap-3"
          style={{
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div
            className="relative"
            style={{ maxWidth: 300, flex: 1 }}
          >
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "#9ca3af" }}
            />
            <input
              type="text"
              placeholder="Search CBU/Material code or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-full text-xs focus:outline-none transition-all"
              style={{
                backgroundColor: "#f9fafb",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "#d1d5db",
                color: "#111827",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
              onFocus={(e) =>
                ((
                  e.currentTarget as HTMLElement
                ).style.borderColor = "#1565C0")
              }
              onBlur={(e) =>
                ((
                  e.currentTarget as HTMLElement
                ).style.borderColor = "#d1d5db")
              }
            />
          </div>

      
        

          <div className="ml-auto flex items-center gap-2">
            <ColumnCustomizer
              groupOrder={groupOrder}
              setGroupOrder={setGroupOrder}
              colOrderByGroup={colOrderByGroup}
              setColOrderByGroup={setColOrderByGroup}
              hiddenGroups={hiddenGroups}
              setHiddenGroups={setHiddenGroups}
              hiddenCols={hiddenCols}
              setHiddenCols={setHiddenCols}
            />
          </div>
        </div>

        {/* ── Row 2: Filters dropdowns ── */}
        <div
          className="px-5 py-2 shrink-0 flex items-end min-w-0 gap-3"
          style={{
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div className="flex items-end gap-2 flex-1 min-w-0 overflow-hidden flex-nowrap">
          
      

            {toolbarFilters.map((filterId, index) => {
            const def = ALL_FILTER_DEFINITIONS.find((f) => f.id === filterId);
            if (!def) return null;

            if (def.kind === "toggle" && filterId === "materialType") {
              return (
                <Fragment key={filterId}>
                  {/* {index > 0 && (
                    <div
                      className="w-px shrink-0 self-stretch my-0.5"
                      style={{ backgroundColor: "#d1d5db" }}
                    />
                  )} */}
                  <FilterToggle
                    label={def.label}
                    value={typeFilter}
                    onChange={(v) => setTypeFilter(v as TypeFilter)}
                    options={[
                      { value: "ALL", label: "All" },
                      { value: "RM", label: "RM" },
                      { value: "PM", label: "PM" },
                    ]}
                  />
                </Fragment>
              );
            }

            if (def.kind === "toggle" && filterId === "uom") {
              return (
                <Fragment key={filterId}>
                  {/* {index > 0 && (
                    <div
                      className="w-px shrink-0 self-stretch my-0.5"
                      style={{ backgroundColor: "#d1d5db" }}
                    />
                  )} */}
                  <FilterToggle
                    label={def.label}
                    value={uom}
                    onChange={(v) => setUom(v as UomFilter)}
                    activeColor="#1565C0"
                    options={[
                      { value: "EA", label: "EA" },
                      { value: "MT", label: "Tonnes" },
                    ]}
                  />
                </Fragment>
              );
            }

            return (
              <Fragment key={filterId}>
                {/* {index > 0 && (
                  <div
                    className="w-px shrink-0 self-stretch my-0.5"
                    style={{ backgroundColor: "#d1d5db" }}
                  />
                )} */}
                <FilterDropdown
                  label={def.label}
                  value={dropdownFilters[filterId]}
                  options={getFilterOptions(filterId)}
                  onChange={(value) => setDropdownFilter(filterId, value)}
                />
              </Fragment>
            );
          })}
          </div>

          <div
            className="shrink-0 flex items-end pb-0.5 pl-3"
          >
            <MoreFiltersPanel
              filterOrder={filterOrder}
              setFilterOrder={setFilterOrder}
              visibleFilters={visibleFilters}
              setVisibleFilters={setVisibleFilters}
              activeHiddenCount={activeHiddenFilterCount}
              dropdownFilters={dropdownFilters}
              onDropdownChange={setDropdownFilter}
              getFilterOptions={getFilterOptions}
            />
          </div>
        </div>

        {/* ── Row 3: Info bar ── */}
        <TableHintsBar />

        {/* Table container */}
        <div
          className="flex-1 overflow-auto"
          style={{ backgroundColor: "#ffffff" }}
        >
          <div
            className="overflow-auto shadow-lg"
            style={{
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "#d1d5db",
              boxShadow: "0 0 30px rgba(0,200,240,0.05)",
            }}
          >
            <table
              className="text-xs border-collapse"
              style={{
                backgroundColor: "#EDF5FA",
                minWidth: `${tableMinWidth}px`,
                width: "100%",
              }}
            >
              <thead>
                {/* Group header row */}
                <tr style={{ height: 38 }}>
                  <th
                    rowSpan={2}
                    className="text-white border px-3 py-2 font-semibold whitespace-nowrap cursor-pointer select-none"
                    style={{
                      ...stickyHead(0, W_SR),
                      top: 0,
                      backgroundColor: "#003087",
                      borderColor: "rgba(255,255,255,0.15)",
                      zIndex: 35,
                      textAlign: "center",
                    }}
                    onClick={() => handleSort("srNo")}
                  >
                    <span className="inline-flex items-center gap-1 justify-center">
                      Sr No
                      <SortIndicator
                        colId="srNo"
                        sortCol={sortCol}
                        sortDir={sortDir}
                        light
                      />
                    </span>
                  </th>
                  {orderedMetaCols.map((col, index) => (
                    <th
                      key={`meta-hdr-${col.id}`}
                      rowSpan={2}
                      className="text-white border px-3 py-2 text-left font-semibold whitespace-nowrap cursor-pointer select-none"
                      style={{
                        ...stickyHead(metaColLeft(orderedMetaCols, index), col.minWidth),
                        top: 0,
                        backgroundColor: "#003087",
                        borderColor: "rgba(255,255,255,0.15)",
                        zIndex: 35,
                      }}
                      onClick={() => handleSort(col.id)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        <SortIndicator
                          colId={col.id}
                          sortCol={sortCol}
                          sortDir={sortDir}
                          light
                        />
                      </span>
                    </th>
                  ))}
                  {groupRuns.map((run, i) => (
                    <th
                      key={`${run.group}-${i}`}
                      colSpan={run.count}
                      className="text-white border px-3 py-2 text-center font-semibold whitespace-nowrap"
                      style={{
                        backgroundColor: G[run.group].hdr,
                        position: "sticky",
                        top: 0,
                        zIndex: 20,
                        borderColor: "rgba(255,255,255,0.12)",
                      }}
                    >
                      {G_LABEL[run.group]}
                    </th>
                  ))}
                </tr>

                {/* Sub-header row — data columns only (meta + Sr No span 2 rows) */}
                <tr style={{ height: 34 }}>
                  {orderedDataCols.map((col) => (
                    <th
                      key={col.id}
                      className="border px-3 py-2 font-medium whitespace-nowrap cursor-pointer select-none"
                      style={{
                        ...subHdrStyle(col.id),
                        position: "sticky",
                        top: 38,
                        zIndex: 20,
                        minWidth: col.minWidth,
                        borderColor: "#c8d8e8",
                        fontWeight: 600,
                      }}
                      onClick={() => handleSort(col.id)}
                    >
                      <span className="text-right flex items-center justify-end gap-1">
                        {col.label}
                        <SortIndicator
                          colId={col.id}
                          sortCol={sortCol}
                          sortDir={sortDir}
                        />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {paginatedRows.map((row, idx) => {
                  const isExpanded = expandedSrNo === row.srNo;
                  const isEven = idx % 2 === 0;
                  const rowBg = isExpanded
                    ? "#EDF5F4"
                    : "#ffffff";

                  const components: AggregatedComponent[] =
                    componentCache[row.srNo] ?? [];
                  const selected: Set<string> =
                    selectedComponents[row.srNo] ??
                    new Set(
                      components.map((c) => c.componentCode),
                    );

                  const visibleComps = components.filter(
                    (c) => {
                      if (typeFilter === "ALL") return true;

                      if (typeFilter === "RM") {
                        return (
                          c.componentMaterialType === "1002"
                        );
                      }

                      if (typeFilter === "PM") {
                        return (
                          c.componentMaterialType === "1003"
                        );
                      }

                      return true;
                    },
                  );

                  const allSel =
                    visibleComps.length > 0 &&
                    visibleComps.every((c) =>
                      selected.has(c.componentCode),
                    );
                  const someSel =
                    !allSel &&
                    visibleComps.some((c) =>
                      selected.has(c.componentCode),
                    );

                  const isFiltered = typeFilter !== "ALL";

                  const effRmpm = computeEffRmpm(
                    components,
                    selected,
                    typeFilter,
                    row,
                  );
                  const totalFG =
                    row.fg.totalStock + effRmpm.totalStock;
                  const fgCov = calcCover(
                    row.fg.totalStock,
                    row.demand.next12Months,
                  );
                  const totCov = calcCover(
                    totalFG,
                    row.demand.next12Months,
                  );
                  const exclCov = calcCover(
                    row.fg.totalStock + effRmpm.physicalStock,
                    row.demand.next12Months,
                  );

                  return (
                    <Fragment key={`row-${row.srNo}`}>
                      <tr
                        className="transition-all group"
                        style={{
                          backgroundColor: rowBg,
                          outline: isExpanded
                            ? "2px solid #1565C0"
                            : undefined,
                          outlineOffset: isExpanded
                            ? "-1px"
                            : undefined,
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded)
                            (
                              e.currentTarget as HTMLElement
                            ).style.backgroundColor = "#EDF5F4";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLElement
                          ).style.backgroundColor = rowBg;
                        }}
                      >
                        {/* Frozen: Sr No */}
                        <td
                          className="px-2 py-1 border text-center"
                          style={{
                            ...stickyBody(0, W_SR, rowBg),
                            borderColor: "#e5e7eb",
                            color: "#1565C0",
                          }}
                        >
                          {row.srNo}
                        </td>

                        {orderedMetaCols.map((col, index) =>
                          metaCell(
                            col,
                            row,
                            rowBg,
                            isExpanded,
                            handleCBUClick,
                            (srNo) => navigate({ page: "sci-detail", srNo }),
                            (srNo) => navigate({ page: "cbu-detail", srNo }),
                            metaColLeft(orderedMetaCols, index),
                          ),
                        )}

                        {/* Dynamic columns */}
                        {orderedDataCols.map((col) =>
                          mainCell(
                            col.id,
                            row,
                            effRmpm,
                            uom,
                            totalFG,
                            fgCov,
                            totCov,
                            exclCov,
                            (e, period) => {
                              e.stopPropagation();
                              setDemandModal({
                                code: row.cbuCode,
                                desc: row.cbuDescription,
                                period,
                              });
                            },
                          ),
                        )}
                      </tr>

                      {/* Expanded component rows */}
                      {isExpanded &&
                        (visibleComps.length === 0 ? (
                          <tr key={`empty-${row.srNo}`}>
                            <td
                              colSpan={stickyColCount + orderedDataCols.length}
                              className="px-4 py-3 text-center italic"
                              style={{
                                backgroundColor: "#fef2f2",
                                color: "#00695C",
                                borderBottom:
                                  "1px solid rgba(124,58,237,0.15)",
                              }}
                            >
                              No component data for{" "}
                              {typeFilter !== "ALL"
                                ? `type ${typeFilter === "RM" ? "1002 (RM)" : "1003 (PM)"}`
                                : "this CBU"}
                            </td>
                          </tr>
                        ) : (
                          <>
                            {/* Component sub-header */}
                            <tr key={`subhdr-${row.srNo}`}>
                              <td
                                className="px-3 py-1.5 border text-center"
                                style={{
                                  ...stickyBody(
                                    0,
                                    W_SR,
                                    "#EDF5FA",
                                  ),
                                  borderColor:
                                    "rgba(21,101,192,0.12)",
                                  backgroundColor: "#EDF5F4",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={allSel}
                                  ref={(el) => {
                                    if (el)
                                      el.indeterminate =
                                        someSel;
                                  }}
                                  onChange={() =>
                                    toggleAll(
                                      row.srNo,
                                      visibleComps,
                                      allSel,
                                    )
                                  }
                                  className="w-3.5 h-3.5 cursor-pointer"
                                  style={{
                                    accentColor: "#6366f1",
                                  }}
                                />
                              </td>
                              {orderedMetaCols.length > 0 ? (
                                <td
                                  colSpan={orderedMetaCols.length}
                                  className="px-3 py-1.5 border"
                                  style={{
                                    ...stickyBody(
                                      W_SR,
                                      metaWidth,
                                      "#EDF5FA",
                                    ),
                                    borderColor:
                                      "rgba(21,101,192,0.12)",
                                    backgroundColor: "#EDF5F4",
                                  }}
                                >
                                  <span
                                    className="flex items-center gap-2 text-xs font-semibold"
                                    style={{ color: "#1565C0" }}
                                  >
                                    <span
                                      style={{
                                        color: "rgba(21,101,192,0.6)",
                                      }}
                                    >
                                      └
                                    </span>
                                    Components{" "}
                                    {typeFilter === "ALL"
                                      ? "(all locations)"
                                      : typeFilter === "RM"
                                        ? "(RM)"
                                        : "(PM)"}
                                    {isFiltered && (
                                      <span
                                        className="px-1.5 py-0.5 rounded text-xs font-medium"
                                        style={{
                                          backgroundColor:
                                            "rgba(0,105,92,0.15)",
                                          color: "#00695C",
                                        }}
                                      >
                                        filtered
                                      </span>
                                    )}
                                  </span>
                                </td>
                              ) : null}
                              {orderedDataCols.map((col) => (
                                <td
                                  key={col.id}
                                  className="border"
                                  style={{
                                    backgroundColor: "#EDF5F4",
                                    borderColor:
                                      "rgba(21,101,192,0.12)",
                                  }}
                                />
                              ))}
                            </tr>

                            {visibleComps.map((comp, ci) => {
                              const isChecked = selected.has(
                                comp.componentCode,
                              );
                              const compBg = isChecked
                                ? "#F0F4FC"
                                : "#ffffff";
                              return (
                                <tr
                                  key={`comp-${row.srNo}-${ci}`}
                                  className="cursor-pointer transition-all"
                                  style={{
                                    backgroundColor: compBg,
                                    opacity: isChecked
                                      ? 1
                                      : 0.55,
                                  }}
                                  onClick={() =>
                                    toggleComp(
                                      row.srNo,
                                      comp.componentCode,
                                    )
                                  }
                                >
                                  <td
                                    className="px-3 py-2 border text-center"
                                    style={{
                                      ...stickyBody(
                                        0,
                                        W_SR,
                                        compBg,
                                      ),
                                      borderColor:
                                        "rgba(21,101,192,0.12)",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() =>
                                        toggleComp(
                                          row.srNo,
                                          comp.componentCode,
                                        )
                                      }
                                      onClick={(e) =>
                                        e.stopPropagation()
                                      }
                                      className="w-3.5 h-3.5 cursor-pointer"
                                      style={{
                                        accentColor: "#6366f1",
                                      }}
                                    />
                                  </td>

                                  {orderedMetaCols.map((col, index) => {
                                    const left = metaColLeft(
                                      orderedMetaCols,
                                      index,
                                    );
                                    const cellStyle = {
                                      ...stickyBody(
                                        left,
                                        col.minWidth,
                                        compBg,
                                      ),
                                      borderColor:
                                        "rgba(21,101,192,0.12)",
                                    };

                                    if (col.id === "cbuCode") {
                                      return (
                                        <td
                                          key={`comp-meta-${col.id}`}
                                          className="px-3 py-2 border"
                                          style={cellStyle}
                                        >
                                          <span className="flex items-center gap-1.5 whitespace-nowrap text-xs">
                                            <span
                                              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                                              style={{
                                                backgroundColor:
                                                  "rgba(0,105,92,0.15)",
                                                color: "#00695C",
                                              }}
                                            >
                                              {comp.componentMaterialType ===
                                              "1002"
                                                ? "RM"
                                                : "PM"}
                                            </span>
                                            <span
                                              style={{
                                                color:
                                                  "rgba(21,101,192,0.6)",
                                              }}
                                            >
                                              ⌞
                                            </span>
                                            <span
                                              className="font-mono font-medium"
                                              style={{ color: "#1565C0" }}
                                            >
                                              {comp.componentCode}
                                            </span>
                                          </span>
                                        </td>
                                      );
                                    }

                                    if (col.id === "cbuDescription") {
                                      return (
                                        <td
                                          key={`comp-meta-${col.id}`}
                                          className="px-3 py-2 border"
                                          style={cellStyle}
                                        >
                                          <span
                                            className="truncate text-xs block"
                                            style={{ color: "#374151" }}
                                            title={getComponentDescription(
                                              comp,
                                            )}
                                          >
                                            {getComponentDescription(comp)}
                                          </span>
                                        </td>
                                      );
                                    }

                                    return (
                                      <td
                                        key={`comp-meta-${col.id}`}
                                        className="border"
                                        style={cellStyle}
                                      />
                                    );
                                  })}

                                  {orderedDataCols.map((col) =>
                                    compCell(
                                      col.id,
                                      comp,
                                      row,
                                      uom,
                                    ),
                                  )}
                                </tr>
                              );
                            })}
                          </>
                        ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <TablePagination
          page={safePage}
          rowsPerPage={rowsPerPage}
          totalRows={activeRowCount}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />

        {/* Footer */}
        <div
          className="px-5 py-2 shrink-0 flex items-center justify-between text-xs"
          style={{
            backgroundColor: "#ffffff",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <span
            style={{
              color: "#6b7280",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
            }}
          >
            Data as of 09-Jun-2026 · FMCG Network Planning
          </span>
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: "#1565C0",
                display: "inline-block",
              }}
            />
            <span
              style={{
                color: "#6b7280",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
              }}
            >
              Network Planner Agent
            </span>
          </div>
        </div>
      </div>

      {demandModal && (
        <DemandModal
          cbuCode={demandModal.code}
          cbuDescription={demandModal.desc}
          period={demandModal.period}
          onClose={() => setDemandModal(null)}
        />
      )}
    </>
  );
}

// ─── Table hints bar ──────────────────────────────────────────────────────────

type TableHint = {
  target: string;
  action: string;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
};

function TableHintsBar() {
  const hints: TableHint[] = [
    {
      iconBg: "",
      iconColor: "",
      target: "CBU Code",
      action: "Expand RM/PM components",
    },
    {
      iconBg: "",
      iconColor: "",
      target: "CBU Description",
      action: "Open Scenario Simulation",
    },
    {
      icon: FlaskConical,
      iconBg: "#e0f2f1",
      iconColor: "#00695C",
      target: "Flask icon",
      action: "Open CBU Detail",
    },
    {
      iconBg: "#ffedd5",
      iconColor: "#ea580c",
      target: "Demand value",
      action: "View month breakdown",
    },
  ];

  return (
    <div
      className="shrink-0 px-5 py-2.5 border-b"
      style={{
        background:
          "linear-gradient(90deg, rgba(21,101,192,0.06) 0%, rgba(21,101,192,0.02) 100%)",
        borderColor: "rgba(21, 101, 192, 0.12)",
      }}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div
          className="inline-flex items-center gap-2 shrink-0 pr-4"
          style={{ borderRight: "1px solid rgba(21, 101, 192, 0.15)" }}
        >
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-md"
            style={{ backgroundColor: "rgba(21, 101, 192, 0.1)" }}
          >
            <Info size={13} style={{ color: "#1565C0" }} aria-hidden="true" />
          </span>
          <span
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{
              color: "#003087",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Quick tips
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {hints.map((hint) => {
            const Icon = hint.icon;
            return (
              <div
                key={hint.target}
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg shrink-0"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(21, 101, 192, 0.12)",
                  boxShadow: "0 1px 2px rgba(0, 48, 135, 0.04)",
                }}
              >
                {Icon && (
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-md shrink-0"
                    style={{ backgroundColor: hint.iconBg }}
                  >
                    <Icon size={11} style={{ color: hint.iconColor }} />
                  </span>
                )}
                <span
                  className="text-[10px] font-bold whitespace-nowrap"
                  style={{ color: "#003087" }}
                >
                  {hint.target}
                </span>
                <ChevronRight
                  size={10}
                  style={{ color: "rgba(21, 101, 192, 0.25)" }}
                  aria-hidden="true"
                />
                <span
                  className="text-[10px] font-medium whitespace-nowrap"
                  style={{ color: "#374151" }}
                >
                  {hint.action}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Column Customizer ────────────────────────────────────────────────────────

type ColDragTarget = { group: ColumnGroup; index: number };

function ColumnCustomizer({
  groupOrder,
  setGroupOrder,
  colOrderByGroup,
  setColOrderByGroup,
  hiddenGroups,
  setHiddenGroups,
  hiddenCols,
  setHiddenCols,
}: {
  groupOrder: ColumnGroup[];
  setGroupOrder: React.Dispatch<React.SetStateAction<ColumnGroup[]>>;
  colOrderByGroup: Record<ColumnGroup, string[]>;
  setColOrderByGroup: React.Dispatch<
    React.SetStateAction<Record<ColumnGroup, string[]>>
  >;
  hiddenGroups: Set<ColumnGroup>;
  setHiddenGroups: React.Dispatch<React.SetStateAction<Set<ColumnGroup>>>;
  hiddenCols: Set<string>;
  setHiddenCols: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const [open, setOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<ColumnGroup>>(
    () => new Set(DEFAULT_GROUP_ORDER),
  );
  const [dragGroupIdx, setDragGroupIdx] = useState<number | null>(null);
  const [dragOverGroupIdx, setDragOverGroupIdx] = useState<number | null>(
    null,
  );
  const [dragCol, setDragCol] = useState<ColDragTarget | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColDragTarget | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      )
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () =>
      document.removeEventListener("mousedown", handler);
  }, [open]);

  function toggleGroupExpanded(group: ColumnGroup) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  }

  function toggleGroupVisibility(group: ColumnGroup) {
    setHiddenGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  }

  function toggleCol(id: string) {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function onGroupDragStart(index: number) {
    setDragGroupIdx(index);
    setDragCol(null);
  }

  function onGroupDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverGroupIdx(index);
  }

  function onGroupDrop(index: number) {
    if (dragGroupIdx === null || dragGroupIdx === index) {
      setDragGroupIdx(null);
      setDragOverGroupIdx(null);
      return;
    }
    setGroupOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragGroupIdx, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragGroupIdx(null);
    setDragOverGroupIdx(null);
  }

  function onColDragStart(group: ColumnGroup, index: number) {
    setDragCol({ group, index });
    setDragGroupIdx(null);
  }

  function onColDragOver(
    e: React.DragEvent,
    group: ColumnGroup,
    index: number,
  ) {
    e.preventDefault();
    if (dragCol?.group === group) {
      setDragOverCol({ group, index });
    }
  }

  function onColDrop(group: ColumnGroup, index: number) {
    if (
      !dragCol ||
      dragCol.group !== group ||
      dragCol.index === index
    ) {
      setDragCol(null);
      setDragOverCol(null);
      return;
    }
    setColOrderByGroup((prev) => {
      const groupCols = [...prev[group]];
      const [moved] = groupCols.splice(dragCol.index, 1);
      groupCols.splice(index, 0, moved);
      return { ...prev, [group]: groupCols };
    });
    setDragCol(null);
    setDragOverCol(null);
  }

  function resetCustomization() {
    setGroupOrder(DEFAULT_GROUP_ORDER);
    setColOrderByGroup(buildDefaultColOrderByGroup());
    setHiddenGroups(new Set());
    setHiddenCols(new Set());
    setExpandedGroups(new Set(DEFAULT_GROUP_ORDER));
  }

  const visibleColCount = countVisibleColumns(
    groupOrder,
    colOrderByGroup,
    hiddenGroups,
    hiddenCols,
  );
  const totalColCount = ALL_COLS.length;
  const visibleGroupCount = groupOrder.filter(
    (g) => !hiddenGroups.has(g),
  ).length;

  return (
    <div className="relative flex flex-col gap-1" ref={panelRef}>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium transition-colors"
        style={{
          backgroundColor: open
            ? "rgba(0,200,240,0.18)"
            : "rgba(21,101,192,0.08)",
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: open ? "#5a8fbf" : "#1565C0",
          color: "#374151",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <Settings2 size={12} />
        Customise
        <span
          className="px-1.5 py-0.5 rounded-full text-xs"
          style={{
            backgroundColor: "rgba(21,101,192,0.15)",
            color: "#1565C0",
            fontSize: 9,
          }}
        >
          {visibleColCount}/{totalColCount}
        </span>
      </motion.button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full mt-2 right-0 z-50 rounded-xl overflow-hidden"
          style={{
            width: 340,
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgba(21,101,192,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid #e5e7eb" }}
          >
            <div className="flex items-center gap-2">
              <Settings2 size={13} style={{ color: "#1565C0" }} />
              <span
                className="text-xs font-bold"
                style={{
                  color: "#003087",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Customise Table
              </span>
            </div>
            <button
              onClick={resetCustomization}
              className="flex items-center gap-1 text-xs transition-colors"
              style={{
                color: "#1565C0",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
              }}
            >
              <RotateCcw size={10} /> Reset
            </button>
          </div>

          <div
            className="px-4 py-2"
            style={{ borderBottom: "1px solid #f3f4f6" }}
          >
            <p
              style={{
                color: "#6b7280",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
              }}
            >
              DRAG SECTIONS OR COLUMNS · TOGGLE TO SHOW/HIDE
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto py-2">
            {groupOrder.map((group, groupIdx) => {
              const isGroupHidden = hiddenGroups.has(group);
              const isExpanded = expandedGroups.has(group);
              const isGroupDragging = dragGroupIdx === groupIdx;
              const isGroupOver = dragOverGroupIdx === groupIdx;
              const groupColIds = colOrderByGroup[group] ?? [];
              const visibleInGroup = groupColIds.filter(
                (id) => !hiddenCols.has(id),
              ).length;

              return (
                <div key={group} className="mb-1">
                  <div
                    draggable
                    onDragStart={() => onGroupDragStart(groupIdx)}
                    onDragOver={(e) => onGroupDragOver(e, groupIdx)}
                    onDrop={() => onGroupDrop(groupIdx)}
                    onDragEnd={() => {
                      setDragGroupIdx(null);
                      setDragOverGroupIdx(null);
                    }}
                    className="flex items-center gap-2 px-3 py-2 cursor-grab transition-all select-none"
                    style={{
                      opacity: isGroupDragging ? 0.45 : 1,
                      backgroundColor: isGroupOver
                        ? "rgba(21,101,192,0.08)"
                        : isGroupHidden
                          ? "rgba(0,0,0,0.03)"
                          : "transparent",
                      borderLeft: isGroupOver
                        ? "3px solid #1565C0"
                        : "3px solid transparent",
                    }}
                  >
                    <GripVertical
                      size={13}
                      style={{
                        color: "rgba(0,48,135,0.35)",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: G[group].hdr }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleGroupExpanded(group)}
                      className="shrink-0 p-0.5 rounded transition-colors"
                      style={{ color: "#64748b" }}
                    >
                      {isExpanded ? (
                        <ChevronDown size={12} />
                      ) : (
                        <ChevronRight size={12} />
                      )}
                    </button>
                    <span
                      className="flex-1 text-xs font-semibold truncate text-left"
                      style={{
                        color: isGroupHidden ? "#9ca3af" : "#111827",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        textDecoration: isGroupHidden
                          ? "line-through"
                          : "none",
                      }}
                    >
                      {G_LABEL[group]}
                    </span>
                    <span
                      className="text-[9px] shrink-0 px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "rgba(21,101,192,0.08)",
                        color: "#1565C0",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {isGroupHidden ? 0 : visibleInGroup}/{groupColIds.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleGroupVisibility(group)}
                      className="shrink-0 transition-colors"
                      style={{ color: "#1565C0" }}
                      title={
                        isGroupHidden
                          ? "Show section"
                          : "Hide section"
                      }
                    >
                      {isGroupHidden ? (
                        <EyeOff size={13} />
                      ) : (
                        <Eye size={13} />
                      )}
                    </button>
                  </div>

                  {isExpanded &&
                    groupColIds.map((colId, colIdx) => {
                      const col = ALL_COLS.find((c) => c.id === colId);
                      if (!col) return null;
                      const isColHidden =
                        isGroupHidden || hiddenCols.has(colId);
                      const isColDragging =
                        dragCol?.group === group &&
                        dragCol.index === colIdx;
                      const isColOver =
                        dragOverCol?.group === group &&
                        dragOverCol.index === colIdx;

                      return (
                        <div
                          key={colId}
                          draggable={!isGroupHidden}
                          onDragStart={() =>
                            onColDragStart(group, colIdx)
                          }
                          onDragOver={(e) =>
                            onColDragOver(e, group, colIdx)
                          }
                          onDrop={() => onColDrop(group, colIdx)}
                          onDragEnd={() => {
                            setDragCol(null);
                            setDragOverCol(null);
                          }}
                          className="flex items-center gap-2 pl-9 pr-3 py-1.5 transition-all select-none"
                          style={{
                            opacity: isColDragging
                              ? 0.45
                              : isGroupHidden
                                ? 0.5
                                : 1,
                            cursor: isGroupHidden
                              ? "not-allowed"
                              : "grab",
                            backgroundColor: isColOver
                              ? "rgba(21,101,192,0.06)"
                              : "transparent",
                            borderLeft: isColOver
                              ? "3px solid #90caf9"
                              : "3px solid transparent",
                          }}
                        >
                          <GripVertical
                            size={11}
                            style={{
                              color: "rgba(0,48,135,0.25)",
                              flexShrink: 0,
                            }}
                          />
                          <span
                            className="flex-1 text-xs truncate"
                            style={{
                              color: isColHidden ? "#9ca3af" : "#374151",
                              fontFamily:
                                "'Plus Jakarta Sans', sans-serif",
                              textDecoration: isColHidden
                                ? "line-through"
                                : "none",
                            }}
                          >
                            {col.label}
                          </span>
                          <button
                            type="button"
                            disabled={isGroupHidden}
                            onClick={() => toggleCol(colId)}
                            className="shrink-0 transition-colors disabled:opacity-30"
                            style={{ color: "#1565C0" }}
                            title={
                              isColHidden
                                ? "Show column"
                                : "Hide column"
                            }
                          >
                            {isColHidden ? (
                              <EyeOff size={12} />
                            ) : (
                              <Eye size={12} />
                            )}
                          </button>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>

          <div
            className="px-4 py-2.5 flex items-center justify-between"
            style={{ borderTop: "1px solid #e5e7eb" }}
          >
            <span
              style={{
                color: "#6b7280",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
              }}
            >
              {visibleGroupCount}/{groupOrder.length} sections ·{" "}
              {visibleColCount} visible · {hiddenCols.size} cols hidden
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-xs px-3 py-1 rounded-lg transition-colors"
              style={{
                backgroundColor: "#EDF5FA",
                color: "#374151",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "rgba(21,101,192,0.2)",
              }}
            >
              Done
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}