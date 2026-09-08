import { Fragment, useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight, ChevronUp, X } from "lucide-react";
import {
  ageingColor,
  EXECUTION_STATUS_THEME,
  formatRoute,
  scenarioLabel,
  type ActionRow,
} from "./actionsData";
import { StatusDropdownCell } from "./StatusDropdownCell";
import { EmailActionCell } from "./EmailActionCell";
import { TrackingOverviewSection } from "../tracking/TrackingOverviewSection";
import type { AcceptedScenarioDetails } from "../../App";
import { TablePagination } from "../nationalDashboard/TablePagination";

type SortCol = "actionId" | "owner" | "slaHrs" | "ageingDays" | "status" | null;
type SortDir = "asc" | "desc";

// ─── Theme — blue-only, matches CBUDetail's report table language. ───────────
const BORDER = "#e2e8f0";
const HEAD_BG = "#003087";
const BAND_BG = "#EDF1F7";
const BAND_ACCENT = "#1565C0";

export const REQUIRED_TRACKING_COLUMNS = new Set([
  "networkId",
  "scenarioType",
  "actionId",
  "description",
  "status",
  "action",
]);

const ACTION_COLS: Array<{
  id: string;
  label: string;
  width: number;
  align: "left" | "right";
  sort?: Exclude<SortCol, null>;
}> = [
  { id: "networkId", label: "Network ID", width: 76, align: "left" },
  { id: "actionId", label: "Action ID", width: 110, align: "left", sort: "actionId" },
  { id: "description", label: "Description", width: 240, align: "left" },
  { id: "owner", label: "Action Owner", width: 170, align: "left", sort: "owner" },
    { id: "sla", label: "SLA", width: 76, align: "left", sort: "slaHrs" },
    { id: "ageing", label: "Ageing", width: 76, align: "left", sort: "ageingDays" },
  { id: "status", label: "Status", width: 120, align: "left", sort: "status" },
  { id: "action", label: "Action", width: 130, align: "left" },
];

function SortHeader({
  label,
  col,
  sortCol,
  sortDir,
  onSort,
  align,
}: {
  label: string;
  col: Exclude<SortCol, null>;
  sortCol: SortCol;
  sortDir: SortDir;
  onSort: (c: Exclude<SortCol, null>) => void;
  align: "left" | "right";
}) {
  const active = sortCol === col;
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      className={`inline-flex items-center justify-${align === "right" ? "end" : "start"} gap-1 select-none cursor-pointer text-xs font-semibold`}
      style={{ width: "100%" }}
    >
      <span>{label}</span>
      <span className="inline-flex flex-col leading-none" style={{ opacity: active ? 1 : 0.4 }}>
        {active && sortDir === "desc" ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
      </span>
    </button>
  );
}

function sortValue(row: ActionRow, col: Exclude<SortCol, null>): string | number {
  switch (col) {
    case "actionId": return row.actionId;
    case "owner": return row.owner;
    case "slaHrs": return row.slaHrs;
    case "ageingDays": return row.ageingDays ?? -1;
    case "status": return row.status;
  }
}

function ScenarioBand({
  row,
  count,
  collapsed,
  onToggle,
  colSpan,
}: {
  row: ActionRow;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  colSpan: number;
}) {
  const exec = EXECUTION_STATUS_THEME[row.executionStatus];
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-3 pr-6 py-2 cursor-pointer select-none"
        style={{ backgroundColor: BAND_BG, borderLeft: `4px solid ${BAND_ACCENT}`, borderBottom: `1px solid ${BORDER}` }}
        onClick={onToggle}
        role="button"
        aria-expanded={!collapsed}
        title={collapsed ? "Expand actions" : "Collapse actions"}
      >
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded font-bold text-xs whitespace-nowrap"
            style={{ backgroundColor: BAND_ACCENT, color: "#ffffff" }}
          >
            {scenarioLabel(row.scenarioType, row.seq)}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-xs whitespace-nowrap" style={{ color: "#003087" }}>
            {formatRoute(row.plant).includes("→") ? (
              formatRoute(row.plant).split(" → ").map((leg, i, arr) => (
                <Fragment key={i}>
                  {leg}
                  {i < arr.length - 1 && <ArrowRight size={11} style={{ color: "#1565C0" }} />}
                </Fragment>
              ))
            ) : (
              formatRoute(row.plant)
            )}
          </span>
          <span className="text-xs" style={{ color: "#5b6b85" }}>
            Material <b style={{ color: "#334155" }}>{row.material}</b> · Qty <b style={{ color: "#334155" }}>{row.quantity}</b>
          </span>
          {collapsed && (
            <span className="text-xs" style={{ color: "#5b6b85" }}>
              ({count} action{count === 1 ? "" : "s"})
            </span>
          )}
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ml-auto"
            style={{ backgroundColor: exec.bg, color: exec.text }}
          >
            {row.executionStatus}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="flex items-center justify-center w-5 h-5 rounded shrink-0 transition-colors cursor-pointer"
            style={{ color: "#1565C0" }}
            title={collapsed ? "Expand actions" : "Collapse actions"}
            aria-label={collapsed ? "Expand actions" : "Collapse actions"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </td>
    </tr>
  );
}

interface Props {
  rows: ActionRow[];
  onDecision: (rowId: string, action: string) => void;
  hiddenColumns?: Set<string>;
  overviewScenario?: AcceptedScenarioDetails;
  overviewDeviations?: string[];
  onResimulate?: () => void;
}

export function ActionsTable({ rows, onDecision, hiddenColumns = new Set(), overviewScenario, overviewDeviations = [], onResimulate = () => undefined }: Readonly<Props>) {
  const [sortCol, setSortCol] = useState<SortCol>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [collapsedItems, setCollapsedItems] = useState<Set<number>>(new Set());
  const [overviewNetworkId, setOverviewNetworkId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  useEffect(() => {
    setPage(1);
  }, [rows, sortCol, sortDir, rowsPerPage]);

  function toggleItem(item: number) {
    setCollapsedItems((prev) => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  }

  function handleSort(col: Exclude<SortCol, null>) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  // Rows stay grouped under one banner per unique scenario instance so the
  // Network ID and Scenario Type cells remain merged while sorting.
  const sortedRows = useMemo(() => {
    if (!sortCol) return rows;
    const copy = [...rows];
    const mult = sortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      const av = sortValue(a, sortCol);
      const bv = sortValue(b, sortCol);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * mult;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * mult;
    });
    return copy;
  }, [rows, sortCol, sortDir]);

  if (rows.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-16 text-sm"
        style={{ color: "#6b7280", backgroundColor: "#fff", border: `1px solid ${BORDER}` }}
      >
        No actions match the selected filters.
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pagedRows = sortedRows.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);
  const pagedGrouped = groupByItem(pagedRows);
  const showScenarioColumn = !hiddenColumns.has("scenario");
  const visibleActionCols = ACTION_COLS.filter((col) => REQUIRED_TRACKING_COLUMNS.has(col.id) || !hiddenColumns.has(col.id));
  const visibleNonNetworkCols = visibleActionCols.filter((col) => col.id !== "networkId");
  const colCount = visibleActionCols.length + (showScenarioColumn ? 1 : 0);

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ border: "1px solid #d1d5db" }}>
      <div className="min-h-0 flex-1 overflow-auto shadow-lg">
      <table className="text-xs border-collapse w-full" style={{ minWidth: showScenarioColumn ? 1390 : 1180 }}>
        <thead className="sticky top-0 z-20" style={{ backgroundColor: HEAD_BG }}>
          <tr style={{ backgroundColor: HEAD_BG }} className="text-white">
            <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap" style={{ backgroundColor: HEAD_BG, borderRight: "1px solid rgba(255,255,255,0.15)", position: "sticky", top: 0, zIndex: 21, minWidth: 100 }}>
              Network ID
            </th>
            {showScenarioColumn && (
              <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap" style={{ backgroundColor: HEAD_BG, borderRight: "1px solid rgba(255,255,255,0.15)", position: "sticky", top: 0, zIndex: 21, minWidth: 220 }}>
                Scenario Type
              </th>
            )}
            {visibleNonNetworkCols.map((col, i) => (
              <th
                key={col.label}
                className={`px-3 py-2.5 font-semibold whitespace-nowrap ${col.align === "right" ? "text-right" : "text-left"} ${i === visibleNonNetworkCols.length - 1 ? "pr-6" : ""}`}
                style={{
                  backgroundColor: HEAD_BG,
                  borderRight: i < visibleNonNetworkCols.length - 1 ? "1px solid rgba(255,255,255,0.15)" : undefined,
                  position: "sticky",
                  top: 0,
                  zIndex: 21,
                  minWidth: col.width,
                }}
              >
                {col.sort ? (
                  <SortHeader label={col.label} col={col.sort} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align={col.align} />
                ) : (
                  <span className="inline-flex items-center w-full justify-start">{col.label}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pagedGrouped
            ? pagedGrouped.map(([item, groupRows]) => {
                const collapsed = collapsedItems.has(item);
                if (collapsed) {
                  return (
                    <Fragment key={item}>
                        <ScenarioBand
                        row={groupRows[0]}
                        count={groupRows.length}
                        collapsed={collapsed}
                        onToggle={() => toggleItem(item)}
                          colSpan={colCount}
                      />
                    </Fragment>
                  );
                }

                return (
                  <Fragment key={item}>
                    <tr className="group-row-outline" style={{ height: 0 }}>
                      <td colSpan={colCount} style={{ height: 0, padding: 0, border: 0 }} />
                    </tr>
                    {groupRows.map((row, index) => (
                      <ActionRowLine
                        key={row.id}
                        row={row}
                        onDecision={onDecision}
                        hiddenColumns={hiddenColumns}
                        onNetworkClick={setOverviewNetworkId}
                        networkRowSpan={index === 0 ? groupRows.length : undefined}
                        scenarioCell={!hiddenColumns.has("scenario") && index === 0 ? { rowSpan: groupRows.length, summary: groupRows[0] } : undefined}
                        groupBorderTop={index === 0}
                        groupBorderBottom={index === groupRows.length - 1}
                      />
                    ))}
                  </Fragment>
                );
              })
            : sortedRows.map((row) => (
                <ActionRowLine key={row.id} row={row} onDecision={onDecision} showScenario hiddenColumns={hiddenColumns} onNetworkClick={setOverviewNetworkId} networkRowSpan={1} />
              ))}
        </tbody>
      </table>
      </div>
      <TablePagination
        page={safePage}
        rowsPerPage={rowsPerPage}
        totalRows={sortedRows.length}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />
      {overviewNetworkId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4" role="dialog" aria-modal="true" aria-label="Project overview">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-white shadow-2xl" style={{ border: `2px solid ${HEAD_BG}` }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: HEAD_BG, color: "#ffffff" }}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#bfdbfe" }}>Project Overview</p>
                <h2 className="mt-1 text-sm font-bold">{overviewNetworkId}</h2>
              </div>
              <button type="button" onClick={() => setOverviewNetworkId(null)} title="Close project overview" aria-label="Close project overview" className="flex h-8 w-8 items-center justify-center rounded-lg cursor-pointer" style={{ color: "#ffffff" }}>
                <X size={16} />
              </button>
            </div>
            <div className="p-5">
              <TrackingOverviewSection
                effectiveScenario={overviewScenario}
                isManualMode={false}
                manualScenarioId={null}
                onManualScenarioChange={() => undefined}
                deviations={overviewDeviations}
                onResimulate={onResimulate}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function groupByItem(rows: ActionRow[]): Array<[number, ActionRow[]]> {
  const map = new Map<number, ActionRow[]>();
  for (const row of rows) {
    const bucket = map.get(row.item);
    if (bucket) bucket.push(row);
    else map.set(row.item, [row]);
  }
  return Array.from(map.entries());
}

function ScenarioSummaryCell({ row, count }: { row: ActionRow; count?: number }) {
  const route = formatRoute(row.plant);
  const countLabel = count ? `${count} action${count === 1 ? "" : "s"}` : "1 action";

  return (
    <td
      className="px-3 py-3 align-top"
      rowSpan={count ?? 1}
      style={{
        width: 210,
        borderLeft: `1px solid ${HEAD_BG}`,
        borderRight: `1px solid ${BORDER}`,
        borderTop: `1px solid ${HEAD_BG}`,
        borderBottom: `1px solid ${HEAD_BG}`,
        backgroundColor: "#f8fbff",
        verticalAlign: "middle",
      }}
    >
      <div className="flex h-full min-h-[82px] flex-col justify-center gap-1.5 pt-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center rounded px-2 py-1 font-bold text-[11px] leading-none tracking-wide"
            style={{ backgroundColor: BAND_ACCENT, color: "#ffffff" }}
          >
            {scenarioLabel(row.scenarioType, row.seq)}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "#64748b" }}>
            {countLabel}
          </span>
        </div>

        <div className="space-y-1 text-xs" style={{ color: "#475569" }}>
          <div>
            <span className="font-semibold" style={{ color: "#0f172a" }}>Scenario:</span>{" "}
            <span className="font-medium" style={{ color: "#1f2937" }}>{scenarioLabel(row.scenarioType, row.seq)}</span>
          </div>
          <div>
            <span className="font-semibold" style={{ color: "#0f172a" }}>Route:</span>{" "}
            <span className="font-medium" style={{ color: "#1f2937" }}>{route}</span>
          </div>
          <div>
            <span className="font-semibold" style={{ color: "#0f172a" }}>Material:</span>{" "}
            <span className="font-medium" style={{ color: "#1f2937" }}>{row.material}</span>
          </div>
          <div>
            <span className="font-semibold" style={{ color: "#0f172a" }}>Qty:</span>{" "}
            <span className="font-medium" style={{ color: "#1f2937" }}>{row.quantity}</span>
          </div>
        </div>
      </div>
    </td>
  );
}

function ActionRowLine({
  row,
  onDecision,
  showScenario = false,
  scenarioCell,
  groupBorderTop = false,
  groupBorderBottom = false,
  hiddenColumns,
  onNetworkClick,
  networkRowSpan,
}: {
  row: ActionRow;
  onDecision: (rowId: string, action: string) => void;
  showScenario?: boolean;
  scenarioCell?: { rowSpan: number; summary: ActionRow };
  groupBorderTop?: boolean;
  groupBorderBottom?: boolean;
  hiddenColumns: Set<string>;
  onNetworkClick: (networkId: string) => void;
  networkRowSpan?: number;
}) {
  const firstCell = showScenario ? (
    <td className="px-3 py-2.5 whitespace-nowrap" style={{ borderRight: `1px solid ${BORDER}` }}>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded font-bold text-xs"
          style={{ backgroundColor: BAND_ACCENT, color: "#ffffff" }}
        >
          {scenarioLabel(row.scenarioType, row.seq)}
        </span>
        <span className="text-xs" style={{ color: "#5b6b85" }}>
          {formatRoute(row.plant)}
        </span>
      </span>
    </td>
  ) : scenarioCell ? (
    <ScenarioSummaryCell row={scenarioCell.summary} count={scenarioCell.rowSpan} />
  ) : null;

  return (
    <tr
      style={{
        backgroundColor: "#ffffff",
        borderTop: groupBorderTop ? `1px solid ${HEAD_BG}` : "1px solid #dfe7f3",
        borderBottom: groupBorderBottom ? `2px solid ${HEAD_BG}` : "1px solid #dfe7f3",
      }}
      className="hover:bg-blue-50 transition-colors"
    >
      {networkRowSpan && <td rowSpan={networkRowSpan} className="px-3 py-2.5 whitespace-nowrap font-semibold align-middle" style={{ borderRight: `1px solid ${BORDER}`, borderBottom: groupBorderBottom ? `2px solid ${HEAD_BG}` : "1px solid #dfe7f3", color: "#1565C0", textAlign: "left", backgroundColor: "#f8fbff" }}>
        <button type="button" onClick={() => onNetworkClick(row.networkId)} className="cursor-pointer text-xs font-semibold underline underline-offset-2" title="View project overview">
          {row.networkId}
        </button>
      </td>}
      {firstCell}
      {(REQUIRED_TRACKING_COLUMNS.has("actionId") || !hiddenColumns.has("actionId")) && <td className="px-3 py-2.5 whitespace-nowrap font-semibold" style={{ borderRight: `1px solid ${BORDER}`, borderBottom: groupBorderBottom ? `2px solid ${HEAD_BG}` : "1px solid #dfe7f3", color: "#1565C0", textAlign: "left" }}>
        {row.actionId}
      </td>}
      {(REQUIRED_TRACKING_COLUMNS.has("description") || !hiddenColumns.has("description")) && <td className="px-3 py-2.5" style={{ borderRight: `1px solid ${BORDER}`, borderBottom: groupBorderBottom ? `2px solid ${HEAD_BG}` : "1px solid #dfe7f3", color: "#111827" }}>
        {row.description}
      </td>}
      {!hiddenColumns.has("owner") && <td className="px-3 py-2.5 whitespace-nowrap" style={{ borderRight: `1px solid ${BORDER}`, borderBottom: groupBorderBottom ? `2px solid ${HEAD_BG}` : "1px solid #dfe7f3", color: "#374151" }}>
        {row.owner}
      </td>}
      {!hiddenColumns.has("sla") && <td className="px-3 py-2.5 whitespace-nowrap" style={{ borderRight: `1px solid ${BORDER}`, borderBottom: groupBorderBottom ? `2px solid ${HEAD_BG}` : "1px solid #dfe7f3", color: "#374151", textAlign: "left" }}>
        {row.slaHrs} hrs
      </td>}
      {!hiddenColumns.has("ageing") && <td className="px-3 py-2.5 whitespace-nowrap font-semibold" style={{ borderRight: `1px solid ${BORDER}`, borderBottom: groupBorderBottom ? `2px solid ${HEAD_BG}` : "1px solid #dfe7f3", color: ageingColor(row.ageingDays), textAlign: "left" }}>
        {row.ageingDays === null ? "—" : `${row.ageingDays}d`}
      </td>}
      {(REQUIRED_TRACKING_COLUMNS.has("status") || !hiddenColumns.has("status")) && <td className="px-3 py-2.5" style={{ borderRight: `1px solid ${BORDER}`, borderBottom: groupBorderBottom ? `2px solid ${HEAD_BG}` : "1px solid #dfe7f3" }}>
        <StatusDropdownCell row={row} onConfirm={onDecision} />
      </td>}
      {(REQUIRED_TRACKING_COLUMNS.has("action") || !hiddenColumns.has("action")) && <td className="px-3 pr-6 py-2.5" style={{ borderBottom: groupBorderBottom ? `2px solid ${HEAD_BG}` : "1px solid #dfe7f3" }}>
        <EmailActionCell row={row} />
      </td>}
    </tr>
  );
}
