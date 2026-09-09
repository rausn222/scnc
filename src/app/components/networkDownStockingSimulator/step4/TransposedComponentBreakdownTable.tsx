import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { PLANT_CLUSTER_MAP } from "../../data";
import type { ComponentBreakdownRow, OnHandBreakdown, PlantRole } from "../../sciDetails/types";
import {
  C,
  PLANT_BREAKDOWN_BASE,
  EXPANDED_ONHAND_CELL_BG,
  EXPANDED_GROUP_BORDER,
  RM_BADGE,
  PM_BADGE,
} from "../../sciDetails/constants";
import { parseIndianNumber, formatIndianNumber, parseDMYDate } from "../../sciDetails/utils";
import { TablePagination } from "../../nationalDashboard/TablePagination";

const DEFAULT_ROWS_PER_PAGE = 10;

const ON_HAND_BREAKDOWN_ROWS: { key: keyof OnHandBreakdown; label: string }[] = [
  { key: "unrestricted", label: "UNRESTRICTED STOCK" },
  { key: "quality", label: "STOCK IN QUALITY" },
  { key: "stv", label: "STV STOCK" },
  { key: "blocked", label: "BLOCKED STOCK" },
];

const TRANSPOSED_METRICS = [
  { id: "onHand", label: "ON-HAND STOCK" },
  { id: "openPo", label: "OPEN PO" },
  { id: "fgProducible", label: "FG PRODUCIBLE (EA)" },
  // { id: "consumed", label: "CONSUMED" },
  { id: "leftoverQty", label: "LEFTOVER QTY" },
  { id: "leftoverValue", label: "LEFTOVER VALUE ₹", highlight: true },
  { id: "prodStop", label: "PROD. STOP DATE" },
] as const;

type TransposedMetricId = (typeof TRANSPOSED_METRICS)[number]["id"];

const PLANT_COL_WIDTH = 150;
const MATERIAL_COL_WIDTH = 180;
const METRIC_COL_WIDTH = 180;
const SUB_COL_WIDTH = 150;
const ROW_HEIGHT = 50;

export type TransposedBreakdownColumn = {
  key: string;
  plantCode: string;
  roles: PlantRole[];
  before: ComponentBreakdownRow;
  after: ComponentBreakdownRow | null;
  plantMeta: (typeof PLANT_BREAKDOWN_BASE)[string];
};

/**
 * One production-stop date per plant, not one per RM/PM row. Prefers the
 * component flagged as the bottleneck (it's the one that actually constrains
 * the plant); falls back to whichever component's date the scenario changed
 * from baseline, then to the earliest date across the plant's components.
 */
function getGroupProdStopDate(cols: TransposedBreakdownColumn[]): string {
  const dateOf = (col: TransposedBreakdownColumn) => (col.after ?? col.before).prodStopDate;

  const bottleneck = cols.find((c) => c.before.isBottleneck);
  if (bottleneck) return dateOf(bottleneck);

  const changed = cols.find((c) => c.after && c.after.prodStopDate !== c.before.prodStopDate);
  if (changed) return dateOf(changed);

  const dates = cols.map(dateOf).filter(Boolean);
  if (dates.length === 0) return "—";
  return dates.reduce((earliest, d) =>
    parseDMYDate(d).getTime() < parseDMYDate(earliest).getTime() ? d : earliest,
  );
}

function TransposedMetricCell({
  metricId,
  before,
  after,
}: {
  metricId: TransposedMetricId;
  before: ComponentBreakdownRow;
  after: ComponentBreakdownRow | null;
}) {
  const afterRow = after ?? before;

  const renderChange = (
    beforeVal: string,
    afterVal: string,
    render: (value: string) => React.ReactNode,
    colorize = false,
  ) => {
    // "—" means zero (no on-hand / no Open PO) — compare numerically so, e.g., Open
    // PO going from "—" to a real quantity under a procurement scenario still counts as a change.
    const beforeNum = parseIndianNumber(beforeVal);
    const afterNum = parseIndianNumber(afterVal);
    const changed = after != null && afterNum !== beforeNum;
    if (!changed) return render(afterVal);

    const delta = afterNum - beforeNum;
    const deltaColor = delta > 0 ? C.green : "#dc2626";
    // "—" reads as zero for the delta math above, but "no prior value" is a confusing
    // thing to show a delta against — show the actual 0 baseline instead.
    const beforeDisplay = beforeVal === "—" ? "0" : beforeVal;

    return (
      <div className="flex flex-col items-center text-center leading-tight">
        <div className="text-[12px]" style={{ fontWeight: 700, color: colorize ? deltaColor : "#111827" }}>
          {render(afterVal)}
        </div>
        <div className="mt-0.5 text-[10px] leading-tight" style={{ color: "#94a3b8" }}>
          from {beforeDisplay}
          {(metricId === "onHand" || metricId === "openPo") && delta !== 0 && (
            // Parenthesized rather than dot-separated — a "·" sitting right next to digits
            // (e.g. "0 · +2,400") can still read as a decimal point at this font size,
            // parentheses can't be misread that way regardless of rendering.
            <>
              {" ("}
              <span style={{ color: deltaColor, fontWeight: 700 }}>
                {delta > 0 ? "+" : ""}
                {formatIndianNumber(delta)}
              </span>
              {")"}
            </>
          )}
        </div>
      </div>
    );
  };

  switch (metricId) {
    case "onHand": {
      const suffix = before.uom === "EA" ? " EA" : "";
      return renderChange(
        before.onHandStock,
        afterRow.onHandStock,
        (v) => `${v}${suffix}`,
        true,
      );
    }
    case "openPo":
      return renderChange(
        before.openPoQty,
        afterRow.openPoQty,
        (v) => (
          <span
            className="text-[12px] font-semibold tabular-nums"
            style={{ color: v !== "—" ? C.blue : "#cbd5e1" }}
          >
            {v}
          </span>
        ),
      );
    case "fgProducible":
      return renderChange(
        before.fgUnitsProducible,
        afterRow.fgUnitsProducible,
        (v) => v,
        true,
      );
    // case "consumed":
    //   return (
    //     <span className="text-[12px] tabular-nums font-medium" style={{ color: "#374151" }}>
    //       {afterRow.consumed}
    //     </span>
    //   );
    case "leftoverQty":
      return (
        <span
          className="text-[12px] font-bold tabular-nums"
          style={{
            color:
              afterRow.leftoverQty === "Nil"
                ? C.green
                : afterRow.highlightLeftover
                  ? "#dc2626"
                  : "#374151",
          }}
        >
          {afterRow.leftoverQty}
        </span>
      );
    case "leftoverValue":
      return (
        <span
          className="text-[12px] font-bold tabular-nums"
          style={{
            color:
              afterRow.leftoverValue === "Nil"
                ? C.green
                : afterRow.highlightLeftover
                  ? "#dc2626"
                  : "#374151",
          }}
        >
          {afterRow.leftoverValue}
        </span>
      );
    case "prodStop":
      return (
        <span className="text-[12px] font-bold whitespace-nowrap" style={{ color: C.blue }}>
          {afterRow.prodStopDate}
        </span>
      );
    default:
      return null;
  }
}

function TransposedOnHandBreakdownCell({
  breakdownKey,
  before,
  after,
}: {
  breakdownKey: keyof OnHandBreakdown;
  before: ComponentBreakdownRow;
  after: ComponentBreakdownRow | null;
}) {
  const beforeVal = before.onHandBreakdown[breakdownKey];
  const afterVal = (after ?? before).onHandBreakdown[breakdownKey];
  const changed = after != null && afterVal !== beforeVal && beforeVal !== "—" && afterVal !== "—";

  if (!changed) {
    return (
      <span className="text-[12px] tabular-nums font-medium" style={{ color: "#374151" }}>
        {afterVal}
      </span>
    );
  }

  const delta = parseIndianNumber(afterVal) - parseIndianNumber(beforeVal);
  const deltaColor = delta > 0 ? C.green : "#dc2626";

  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-[12px] font-semibold tabular-nums" style={{ color: "#111827" }}>
        {afterVal}
      </span>
      <span className="mt-0.5 text-[10px] leading-tight" style={{ color: "#94a3b8" }}>
        from {beforeVal}
        {delta !== 0 && (
          <>
            {" ("}
            <span style={{ color: deltaColor, fontWeight: 700 }}>
              {delta > 0 ? "+" : ""}
              {formatIndianNumber(delta)}
            </span>
            {")"}
          </>
        )}
      </span>
    </div>
  );
}

export function TransposedComponentBreakdownTable({
  columns,
  onOpenProductionPlan,
}: {
  columns: TransposedBreakdownColumn[];
  onOpenProductionPlan: (plantCode: string) => void;
}) {
  const [stockExpanded, setStockExpanded] = useState(false);

  // ── Pagination — each `col` (one plant×material combination) is one table row, shared by both
  // the frozen (Plant/Material) pane and the scrolling (metrics) pane below. Both panes render
  // from the same `plantGroups`, so pagination slices the flat, ordered `columns` prop first and
  // `plantGroups` is re-derived from just that page's slice — this keeps every Plant-name rowSpan
  // (frozen pane) and Prod. Stop Date rowSpan (scrolling pane) correctly sized for what's actually
  // rendered on the page. A plant group that straddles a page boundary will show a smaller rowSpan
  // on each page it appears on — that's expected, correct paginated behavior, not a bug.
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const totalRows = columns.length;
  useEffect(() => {
    setPage(1);
  }, [totalRows]);
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(page, totalPages);

  const plantGroups = useMemo(() => {
    const pageStart = (safePage - 1) * rowsPerPage;
    const pagedColumns = columns.slice(pageStart, pageStart + rowsPerPage);

    const groups: {
      plantCode: string;
      roles: PlantRole[];
      plantMeta: (typeof PLANT_BREAKDOWN_BASE)[string];
      columns: TransposedBreakdownColumn[];
    }[] = [];

    for (const col of pagedColumns) {
      const existing = groups.find((g) => g.plantCode === col.plantCode);
      if (existing) existing.columns.push(col);
      else {
        groups.push({
          plantCode: col.plantCode,
          roles: col.roles,
          plantMeta: col.plantMeta,
          columns: [col],
        });
      }
    }
    return groups;
  }, [columns, safePage, rowsPerPage]);

  if (columns.length === 0) {
    return (
      <div className="px-3 py-6 text-center italic text-[12px]" style={{ color: "#94a3b8" }}>
        No components match your filter
      </div>
    );
  }

  const cornerHeaderStyle: React.CSSProperties = {
    backgroundColor: C.bgBlue,
    color: C.navy,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.04em",
    borderRight: `1px solid ${C.borderBlue}`,
    textAlign: "center",
  };

  const metricHeaderStyle = (highlight?: boolean): React.CSSProperties => ({
    backgroundColor: highlight ? "#fff7ed" : C.bgBlue,
    color: C.navy,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.03em",
    borderRight: highlight ? "2px solid #ea580c" : `1px solid ${C.borderBlue}`,
    borderBottom: `1px solid ${C.borderBlue}`,
    textAlign: "center",
  });

  const metricsWidth = TRANSPOSED_METRICS.reduce((sum, metric) => {
    if (metric.id !== "onHand") {
      return sum + METRIC_COL_WIDTH;
    }
    return (
      sum +
      METRIC_COL_WIDTH +
      (stockExpanded
        ? ON_HAND_BREAKDOWN_ROWS.length * SUB_COL_WIDTH
        : 0)
    );
  }, 0);

  return (
    <div className="flex flex-col">
    <div className="flex">
      {/* Frozen pane — Plant + Material never scroll horizontally, so they sit outside
          the scrolling pane entirely rather than relying on sticky positioning. */}
      <div style={{ flexShrink: 0 }}>
        <table
          className="text-[12px]"
          style={{
            borderCollapse: "collapse",
            width: PLANT_COL_WIDTH + MATERIAL_COL_WIDTH,
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: PLANT_COL_WIDTH }} />
            <col style={{ width: MATERIAL_COL_WIDTH }} />
          </colgroup>
          <thead style={{ position: "sticky", top: 0, zIndex: 4 }}>
            <tr style={{ backgroundColor: C.bgBlue }}>
              <th className="px-1.5 py-1 align-middle uppercase" style={cornerHeaderStyle}>
                Plant
              </th>
              <th className="px-1.5 py-1 align-middle uppercase" style={{ ...cornerHeaderStyle, borderBottom: `1px solid ${C.borderBlue}` }}>
                Material
              </th>
            </tr>
          </thead>
          <tbody>
            {plantGroups.map((group) => {
              const cluster = PLANT_CLUSTER_MAP[group.plantCode];
              const groupSize = group.columns.length;

              return group.columns.map((col, i) => (
                <tr key={col.key}>
                  {i === 0 && (
                    <td
                      rowSpan={groupSize}
                      className="px-1.5 py-1.5 align-middle"
                      style={{
                        backgroundColor: "#ffffff",
                        borderRight: "1px solid #e2e8f0",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <div className="flex flex-col items-center text-center gap-1">
                        <span className="text-[11px] font-bold" style={{ color: C.navy }}>
                          {group.plantCode}
                          {cluster && (
                            <span className="ml-1 font-normal" style={{ color: C.blue }}>
                              ({cluster})
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenProductionPlan(group.plantCode)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums cursor-pointer transition-all hover:brightness-95 active:scale-[0.98] normal-case"
                          style={{
                            color: C.navy,
                            backgroundColor: "#ffffff",
                            border: `1px solid ${C.blue}`,
                            boxShadow: "0 1px 4px rgba(0,0,0,0.14)",
                          }}
                          title="View 19-week production plan breakdown"
                        >
                          Production Plan {group.plantMeta?.totalProductionPlan}
                          <ExternalLink size={9} strokeWidth={2.5} style={{ color: C.blue }} />
                        </button>
                      </div>
                    </td>
                  )}
                  <td
                    className="px-1.5 py-1 align-middle"
                    style={{
                      backgroundColor: "#ffffff",
                      borderRight: "1px solid #e2e8f0",
                      borderBottom: "1px solid #e2e8f0",
                      height: ROW_HEIGHT,
                    }}
                  >
                    <div className="flex flex-col items-center text-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-bold tabular-nums">{col.before.component}</span>
                        <span
                          className="px-0.5 py-px rounded text-[10px] font-bold leading-none"
                          style={{
                            backgroundColor: col.before.type === "PM" ? PM_BADGE.bg : RM_BADGE.bg,
                            color: col.before.type === "PM" ? PM_BADGE.color : RM_BADGE.color,
                          }}
                        >
                          {col.before.type}
                        </span>
                      </div>
                      {col.before.isBottleneck && (
                        <span
                          className="px-1 py-px rounded text-[10px] font-bold uppercase leading-none"
                          style={{ backgroundColor: "#ea580c", color: "#fff" }}
                        >
                          Bottleneck
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      {/* Scrolling pane — only the metric columns get a horizontal scrollbar. */}
      <div className="cbp-scroll" style={{ overflowX: "auto", overflowY: "hidden", flex: "1 1 0%", minWidth: 0 }}>
        <style>{`
          .cbp-scroll { scrollbar-width: auto; scrollbar-color: ${C.blue} ${C.bgBlue}; }
          .cbp-scroll::-webkit-scrollbar { height: 8px; }
          .cbp-scroll::-webkit-scrollbar-track { background: ${C.bgBlue}; border-radius: 4px; }
          .cbp-scroll::-webkit-scrollbar-thumb { background: ${C.blue}; border-radius: 4px; border: 1px solid ${C.bgBlue}; }
          .cbp-scroll::-webkit-scrollbar-thumb:hover { background: ${C.navy}; }
        `}</style>
        <table
          className="text-[12px]"
          style={{
            borderCollapse: "collapse",
            width: `max(${metricsWidth}px, 100%)`,
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            {TRANSPOSED_METRICS.map((metric) =>
              metric.id === "onHand" ? (
                <Fragment key="onhand-cols">
                  <col style={{ width: METRIC_COL_WIDTH }} />
                  {stockExpanded &&
                    ON_HAND_BREAKDOWN_ROWS.map((sub) => (
                      <col
                        key={sub.key}
                        style={{ width: SUB_COL_WIDTH }}
                      />
                    ))}
                </Fragment>
              ) : (
                <col key={metric.id} style={{ width: METRIC_COL_WIDTH }} />
              ),
            )}
          </colgroup>
          <thead style={{ position: "sticky", top: 0, zIndex: 4 }}>
            <tr style={{ backgroundColor: C.bgBlue }}>
              {TRANSPOSED_METRICS.map((metric) => {
                if (metric.id === "onHand") {
                  return (
                    <Fragment key="onHand-headers">
                      <th
                        className="px-1.5 py-1 uppercase"
                        style={metricHeaderStyle()}
                      >
                        <button
                          type="button"
                          onClick={() => setStockExpanded((previous) => !previous)}
                          className="inline-flex items-center justify-center gap-1 uppercase w-full cursor-pointer hover:opacity-80"
                          style={{
                            color: "inherit",
                            font: "inherit",
                            letterSpacing: "inherit",
                          }}
                          title={
                            stockExpanded
                              ? "Hide on-hand stock breakdown"
                              : "Show on-hand stock breakdown"
                          }
                        >
                          On-Hand Stock

                          {stockExpanded ? (
                            <ChevronDown size={9} />
                          ) : (
                            <ChevronRight size={9} />
                          )}
                        </button>
                      </th>

                      {stockExpanded &&
                        ON_HAND_BREAKDOWN_ROWS.map((subColumn) => (
                          <th
                            key={subColumn.key}
                            className="px-1.5 py-1 uppercase"
                            style={metricHeaderStyle()}
                          >
                            {subColumn.label}
                          </th>
                        ))}
                    </Fragment>
                  );
                }

                return (
                  <th
                    key={metric.id}
                    className="px-1.5 py-1 uppercase"
                    style={metricHeaderStyle(
                      "highlight" in metric && metric.highlight === true,
                    )}
                  >
                    {metric.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {plantGroups.map((group) => {
              const groupSize = group.columns.length;
              const prodStopDate = getGroupProdStopDate(group.columns);

              return group.columns.map((col, i) => (
                <tr key={col.key}>
                  {TRANSPOSED_METRICS.map((metric) => {
                    if (metric.id === "prodStop") {
                      if (i !== 0) return null;
                      return (
                        <td
                          key="prodStop"
                          rowSpan={groupSize}
                          className="px-1.5 py-1 text-center align-middle tabular-nums leading-tight"
                          style={{
                            backgroundColor: "#ffffff",
                            borderRight: "1px solid #e2e8f0",
                            borderBottom: "1px solid #e2e8f0",
                          }}
                        >
                          <span className="text-[12px] font-bold whitespace-nowrap" style={{ color: C.blue }}>
                            {prodStopDate}
                          </span>
                        </td>
                      );
                    }

                    const isHighlight = "highlight" in metric && metric.highlight === true;
                    const dataBg = isHighlight ? "#fffbeb" : "#ffffff";
                    const dataBorderRight = isHighlight ? "2px solid #ea580c" : "1px solid #e2e8f0";

                    if (metric.id === "onHand") {
                      return (
                        <Fragment key="onHand">

                          {/* Main On-Hand Stock Column */}
                          <td
                            className="px-1.5 py-1 text-center align-middle tabular-nums leading-tight"
                            style={{
                              backgroundColor: dataBg,
                              borderRight: stockExpanded
                                ? "1px solid #e2e8f0"
                                : dataBorderRight,
                              borderBottom: "1px solid #e2e8f0",
                              height: ROW_HEIGHT,
                            }}
                          >
                            <div className="flex justify-center items-center h-full">
                              <TransposedMetricCell
                                metricId="onHand"
                                before={col.before}
                                after={col.after}
                              />
                            </div>
                          </td>

                          {/* Additional Breakdown Columns */}
                          {stockExpanded &&
                            ON_HAND_BREAKDOWN_ROWS.map((sub) => (
                              <td
                                key={sub.key}
                                className="px-1.5 py-1 text-center align-middle tabular-nums leading-tight"
                                style={{
                                  backgroundColor:
                                    EXPANDED_ONHAND_CELL_BG,
                                  borderRight: "1px solid #e2e8f0",
                                  borderBottom: "1px solid #e2e8f0",
                                  borderTop: EXPANDED_GROUP_BORDER,
                                  height: ROW_HEIGHT,
                                }}
                              >
                                <div className="flex justify-center items-center h-full">
                                  <TransposedOnHandBreakdownCell
                                    breakdownKey={sub.key}
                                    before={col.before}
                                    after={col.after}
                                  />
                                </div>
                              </td>
                            ))}
                        </Fragment>
                      );
                    }

                    return (
                      <td
                        key={metric.id}
                        className="px-1.5 py-1 text-center align-middle tabular-nums leading-tight"
                        style={{
                          backgroundColor: dataBg,
                          borderRight: dataBorderRight,
                          borderBottom: "1px solid #e2e8f0",
                          height: ROW_HEIGHT,
                        }}
                      >
                        <div className="flex justify-center items-center h-full">
                          <TransposedMetricCell metricId={metric.id} before={col.before} after={col.after} />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
      {totalRows > rowsPerPage && (
        <TablePagination
          page={safePage}
          rowsPerPage={rowsPerPage}
          totalRows={totalRows}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      )}
    </div>
  );
}
