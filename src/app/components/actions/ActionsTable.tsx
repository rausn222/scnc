import { Fragment, useMemo, useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import {
  ageingColor,
  EXECUTION_STATUS_THEME,
  formatRoute,
  scenarioLabel,
  type ActionRow,
  type ActionStatus,
} from "./actionsData";
import { StatusDropdownCell } from "./StatusDropdownCell";
import { EmailActionCell } from "./EmailActionCell";

type SortCol = "actionId" | "owner" | "slaHrs" | "ageingDays" | "status" | null;
type SortDir = "asc" | "desc";

// ─── Theme — blue-only, matches CBUDetail's report table language. ───────────
const BORDER = "#e2e8f0";
const HEAD_BG = "#003087";
const BAND_BG = "#EDF1F7";
const BAND_ACCENT = "#1565C0";

const ACTION_COLS: Array<{
  label: string;
  width: number;
  align: "left" | "right";
  sort?: Exclude<SortCol, null>;
}> = [
  { label: "Action ID", width: 100, align: "left", sort: "actionId" },
  { label: "Description", width: 240, align: "left" },
  { label: "Owner", width: 170, align: "left", sort: "owner" },
  { label: "SLA", width: 76, align: "right", sort: "slaHrs" },
  { label: "Ageing", width: 76, align: "right", sort: "ageingDays" },
  { label: "Status", width: 120, align: "left", sort: "status" },
  { label: "Action", width: 130, align: "left" },
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
      className={`inline-flex items-center gap-1 select-none cursor-pointer text-xs font-semibold ${align === "right" ? "flex-row-reverse" : ""}`}
    >
      {label}
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
}: {
  row: ActionRow;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const exec = EXECUTION_STATUS_THEME[row.executionStatus];
  return (
    <tr>
      <td
        colSpan={ACTION_COLS.length}
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
}

export function ActionsTable({ rows, onDecision }: Props) {
  const [sortCol, setSortCol] = useState<SortCol>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [collapsedItems, setCollapsedItems] = useState<Set<number>>(new Set());

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

  // Unsorted: rows stay grouped under one banner per unique scenario instance
  // (e.g. "IUT 1", "IUT 2") so every distinct lane/request is visually
  // combined and its action trail reads directly underneath it. Sorting by
  // an action-level column breaks that grouping, so it falls back to a flat
  // list with an inline scenario tag per row instead.
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

  const statusCounts = useMemo(() => {
    const counts: Record<ActionStatus, number> = {
      PENDING: 0, "IN PROGRESS": 0, COMPLETED: 0,
    };
    for (const r of rows) counts[r.status]++;
    return counts;
  }, [rows]);

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

  const grouped = sortCol ? null : groupByItem(sortedRows);
  const colCount = ACTION_COLS.length + (sortCol ? 1 : 0);

  return (
    <div className="overflow-auto shadow-lg" style={{ border: "1px solid #d1d5db" }}>
      <table className="text-xs border-collapse w-full" style={{ minWidth: sortCol ? 1350 : 1180 }}>
        <thead>
          <tr style={{ backgroundColor: HEAD_BG }} className="text-white">
            {sortCol && (
              <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap" style={{ borderRight: "1px solid rgba(255,255,255,0.15)", position: "sticky", top: 0, zIndex: 21, minWidth: 190 }}>
                Scenario
              </th>
            )}
            {ACTION_COLS.map((col, i) => (
              <th
                key={col.label}
                className={`px-3 py-2.5 font-semibold whitespace-nowrap ${col.align === "right" ? "text-right" : "text-left"} ${i === ACTION_COLS.length - 1 ? "pr-6" : ""}`}
                style={{
                  borderRight: i < ACTION_COLS.length - 1 ? "1px solid rgba(255,255,255,0.15)" : undefined,
                  position: "sticky",
                  top: 0,
                  zIndex: 21,
                  minWidth: col.width,
                }}
              >
                {col.sort ? (
                  <SortHeader label={col.label} col={col.sort} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align={col.align} />
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grouped
            ? grouped.map(([item, groupRows]) => {
                const collapsed = collapsedItems.has(item);
                return (
                  <Fragment key={item}>
                    <ScenarioBand
                      row={groupRows[0]}
                      count={groupRows.length}
                      collapsed={collapsed}
                      onToggle={() => toggleItem(item)}
                    />
                    {!collapsed &&
                      groupRows.map((row) => (
                        <ActionRowLine key={row.id} row={row} onDecision={onDecision} />
                      ))}
                  </Fragment>
                );
              })
            : sortedRows.map((row) => (
                <ActionRowLine key={row.id} row={row} onDecision={onDecision} showScenario />
              ))}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: HEAD_BG }} className="text-white font-semibold">
            <td colSpan={colCount} className="px-3 pr-6 py-2.5">
              <span className="inline-flex items-center gap-4 flex-wrap">
                <span>TOTAL — {rows.length} action{rows.length === 1 ? "" : "s"}</span>
                {(Object.keys(statusCounts) as ActionStatus[])
                  .filter((s) => statusCounts[s] > 0)
                  .map((s) => (
                    <span key={s} className="font-normal" style={{ color: "rgba(255,255,255,0.85)" }}>
                      {s}: <span className="font-semibold text-white">{statusCounts[s]}</span>
                    </span>
                  ))}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
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

function ActionRowLine({
  row,
  onDecision,
  showScenario = false,
}: {
  row: ActionRow;
  onDecision: (rowId: string, action: string) => void;
  showScenario?: boolean;
}) {
  return (
    <tr style={{ backgroundColor: "#ffffff" }} className="hover:bg-blue-50 transition-colors">
      {showScenario && (
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
      )}
      <td className="px-3 py-2.5 font-semibold whitespace-nowrap" style={{ borderRight: `1px solid ${BORDER}`, color: "#1565C0" }}>
        {row.actionId}
      </td>
      <td className="px-3 py-2.5" style={{ borderRight: `1px solid ${BORDER}`, color: "#111827" }}>
        {row.description}
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap" style={{ borderRight: `1px solid ${BORDER}`, color: "#374151" }}>
        {row.owner}
      </td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap" style={{ borderRight: `1px solid ${BORDER}`, color: "#374151" }}>
        {row.slaHrs} hrs
      </td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap font-semibold" style={{ borderRight: `1px solid ${BORDER}`, color: ageingColor(row.ageingDays) }}>
        {row.ageingDays === null ? "—" : `${row.ageingDays}d`}
      </td>
      <td className="px-3 py-2.5" style={{ borderRight: `1px solid ${BORDER}` }}>
        <StatusDropdownCell row={row} onConfirm={onDecision} />
      </td>
      <td className="px-3 pr-6 py-2.5">
        <EmailActionCell row={row} />
      </td>
    </tr>
  );
}
