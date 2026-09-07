import { Fragment } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PLANT_CLUSTER_MAP } from "../data";
import {
  ON_HAND_BREAKDOWN_COUNT,
  ROW_HEADER_COL_WIDTH,
  METRIC_COL_WIDTH,
  PRODUCTION_PLAN_LABEL,
  PRODUCTION_PLAN_COL_WIDTH,
  productionPlanCellTitle,
  EXPANDED_ONHAND_HEADER_BG,
  EXPANDED_BREAKDOWN_HEADER_BG,
  EXPANDED_ONHAND_CELL_BG,
  EXPANDED_BREAKDOWN_CELL_BG,
  EXPANDED_BREAKDOWN_CELL_BG_ALT,
  EXPANDED_GROUP_BORDER,
  EXPANDED_TOTAL_ONHAND_BG,
  EXPANDED_TOTAL_BREAKDOWN_BG,
  EXPANDED_HEADER_TEXT,
  EXPANDED_BREAKDOWN_HEADER_TEXT,
  FG_SUMMARY_COLUMNS,
  FG_SUMMARY_COL_WIDTH,
  FG_SUMMARY_COL_TOOLTIPS,
  FG_SUMMARY_COL_IDS,
  TOTAL_ROW_LABEL,
  NO_CLUSTER_PLANT_DATA_MESSAGE,
  clusterToggleTitle,
  plantCellTooltip,
  clusterCellTooltip,
} from "../../constants/cbuDetail";
import {
  isOnHandParentColumn,
  isBreakdownColumn,
  getSubColumns,
  colsForComponent,
  getPlantsForCluster,
  getStockColumnTooltip,
  getPlantProductionPlan,
  metricsToValues,
  aggregateMetrics,
} from "./utils";
import { fmt, fmtFg, fmtCoverDate, calcCoverDate } from "./format";
import { ComponentHeader } from "./ComponentHeader";
import type { StockMetrics, StockTableProps } from "./types";

const isBoldColumn = (colIdx: number, totalCols: number) =>
  // Total Stock is the last value in the row (the cover-date cell is appended
  // separately, outside this array).
  colIdx === totalCols - 1;

const productionPlanColStyle = (bg: string): React.CSSProperties => ({
  position: "sticky",
  left: ROW_HEADER_COL_WIDTH,
  zIndex: 10,
  backgroundColor: bg,
  borderRight: "1px solid #e2e8f0",
});

const subHeaderStyle = (
  colIdx: number,
  isLastInGroup: boolean,
  isOnHandToggle: boolean,
  expanded: boolean,
): React.CSSProperties => {
  const base: React.CSSProperties = {
    borderRight: isLastInGroup
      ? "1px solid rgba(255,255,255,0.15)"
      : "1px solid rgba(255,255,255,0.06)",
    fontSize: 10,
    cursor: isOnHandToggle ? "pointer" : undefined,
  };

  if (!expanded) {
    return { ...base, color: "#bfdbfe" };
  }

  if (isOnHandParentColumn(colIdx, true)) {
    return {
      ...base,
      backgroundColor: EXPANDED_ONHAND_HEADER_BG,
      color: EXPANDED_HEADER_TEXT,
      fontWeight: 600,
      borderLeft: EXPANDED_GROUP_BORDER,
    };
  }

  if (isBreakdownColumn(colIdx, true)) {
    return {
      ...base,
      backgroundColor: EXPANDED_BREAKDOWN_HEADER_BG,
      color: EXPANDED_BREAKDOWN_HEADER_TEXT,
      borderRight:
        colIdx === ON_HAND_BREAKDOWN_COUNT
          ? EXPANDED_GROUP_BORDER
          : "1px solid #dbeafe",
    };
  }

  return { ...base, color: "#bfdbfe" };
};

const bodyCellStyle = (
  colIdx: number,
  rowIndex: number,
  expanded: boolean,
): React.CSSProperties => {
  const base: React.CSSProperties = { borderRight: "1px solid #e2e8f0" };

  if (!expanded) return base;

  if (isOnHandParentColumn(colIdx, true)) {
    return {
      ...base,
      backgroundColor: EXPANDED_ONHAND_CELL_BG,
      borderLeft: EXPANDED_GROUP_BORDER,
    };
  }

  if (isBreakdownColumn(colIdx, true)) {
    return {
      ...base,
      backgroundColor:
        rowIndex % 2 === 0
          ? EXPANDED_BREAKDOWN_CELL_BG
          : EXPANDED_BREAKDOWN_CELL_BG_ALT,
      borderRight:
        colIdx === ON_HAND_BREAKDOWN_COUNT
          ? EXPANDED_GROUP_BORDER
          : "1px solid #e2e8f0",
    };
  }

  return base;
};

const totalCellStyle = (
  colIdx: number,
  totalCols: number,
  expanded: boolean,
): React.CSSProperties => {
  const base: React.CSSProperties = {
    borderRight:
      colIdx === totalCols - 1
        ? "1px solid rgba(255,255,255,0.15)"
        : "1px solid rgba(255,255,255,0.1)",
  };

  if (!expanded) return base;

  if (isOnHandParentColumn(colIdx, true)) {
    return {
      ...base,
      backgroundColor: EXPANDED_TOTAL_ONHAND_BG,
      borderLeft: EXPANDED_GROUP_BORDER,
    };
  }

  if (isBreakdownColumn(colIdx, true)) {
    return {
      ...base,
      backgroundColor: EXPANDED_TOTAL_BREAKDOWN_BG,
      borderRight:
        colIdx === ON_HAND_BREAKDOWN_COUNT
          ? EXPANDED_GROUP_BORDER
          : "1px solid rgba(255,255,255,0.15)",
    };
  }

  return base;
};

export function StockTable({
  row,
  uom,
  rowHeader,
  rowHeaderSubtext,
  rowLabels,
  plantRows,
  uniqueComponents,
  getMetrics,
  getPlantMetrics,
  expandedComponents,
  onToggleComponentExpanded,
  onPlantProductionClick,
  clusterDrilldown = false,
  allPlants = [],
  expandedCluster = null,
  onClusterClick,
  hiddenCols,
}: StockTableProps) {
  const showProductionPlan = !hiddenCols.has("productionPlan");
  const showCover = !hiddenCols.has("cover");
  const visibleFgSummary = FG_SUMMARY_COLUMNS.filter(
    (_, i) => !hiddenCols.has(FG_SUMMARY_COL_IDS[i]),
  );
  const visibleFgSummaryCount = visibleFgSummary.length;
  // CBU-level FG summary — same for every row, so computed once rather than
  // per plant/cluster. Recomputed from row.fg/row.rmpm (kept live-synced from
  // aggregated components) rather than row.totalFG/row.cover, which are only
  // ever set once from static seed data and can drift out of sync.
  const fgOnlyTotal = row.fg.totalStock;
  const fgPresentTotal = fgOnlyTotal + row.rmpm.totalStock;
  const fgCoverPhysicalOnly = calcCoverDate(fgOnlyTotal, row.demand.next12Months);
  const fgCoverPhysicalPlusOpenPO = calcCoverDate(
    fgPresentTotal,
    row.demand.next12Months,
  );
  const fgSummaryUom = uom === "RMPM" ? "EA" : uom;

  const fgSummaryCellContent: Record<string, React.ReactNode> = {
    fgCoverOnHand: fmtCoverDate(fgCoverPhysicalOnly, false),
    fgCoverOnHandOpenPO: fmtCoverDate(fgCoverPhysicalPlusOpenPO, false),
    fgAvailable: fmtFg(fgPresentTotal, fgSummaryUom, row.weightKg, true),
  };
  const fgSummaryCellContentLight: Record<string, React.ReactNode> = {
    fgCoverOnHand: fmtCoverDate(fgCoverPhysicalOnly, false, true),
    fgCoverOnHandOpenPO: fmtCoverDate(fgCoverPhysicalPlusOpenPO, false, true),
    fgAvailable: fmtFg(fgPresentTotal, fgSummaryUom, row.weightKg, true, true),
  };

  const renderFgSummaryCells = (keyPrefix: string, light = false) => (
    <Fragment key={`${keyPrefix}-fg-summary`}>
      {visibleFgSummary.map((label, i) => {
        const id = FG_SUMMARY_COL_IDS[FG_SUMMARY_COLUMNS.indexOf(label)];
        return (
          <td
            key={`${keyPrefix}-fg-summary-${id}`}
            className="px-3 py-2.5 text-center whitespace-nowrap"
            style={
              i === 0
                ? {
                    borderLeft: light
                      ? "2px solid rgba(255,255,255,0.3)"
                      : "2px solid #93c5fd",
                  }
                : undefined
            }
          >
            {light ? fgSummaryCellContentLight[id] : fgSummaryCellContent[id]}
          </td>
        );
      })}
    </Fragment>
  );

  const renderProductionPlanCell = (
    plantCode: string | null,
    bg: string,
    light = false,
  ) => {
    if (!showProductionPlan) return null;
    if (!plantCode) {
      return (
        <td className="px-3 py-2.5 text-center" style={productionPlanColStyle(bg)}>
          <span style={{ color: light ? "rgba(255,255,255,0.35)" : "#cbd5e1" }}>
            —
          </span>
        </td>
      );
    }
    const value = getPlantProductionPlan(
      plantCode,
      row.srNo,
      row.demand.next12Months,
    );
    return (
      <td
        className="px-3 py-2.5 text-center cursor-pointer hover:underline"
        style={{ ...productionPlanColStyle(bg), color: "#1565C0", fontWeight: 600 }}
        title={productionPlanCellTitle(plantCode)}
        onClick={(e) => {
          e.stopPropagation();
          onPlantProductionClick(plantCode);
        }}
      >
        {fmt(value)}
      </td>
    );
  };

  const renderMetricCells = (
    label: string,
    rowIndex: number,
    resolveMetrics: (rowLabel: string, compCode: string) => StockMetrics,
  ) =>
    uniqueComponents.map((compCode) => {
      const expanded = expandedComponents.has(compCode);
      const metrics = resolveMetrics(label, compCode);
      const values = metricsToValues(metrics, expanded, hiddenCols);
      const coverDate = calcCoverDate(metrics.total, metrics.demand);
      return (
        <Fragment key={`${label}-${compCode}`}>
          {values.map((val, colIdx) => (
            <td
              key={`${label}-${compCode}-${colIdx}`}
              className="px-3 py-2.5 text-center"
              style={bodyCellStyle(colIdx, rowIndex, expanded)}
            >
              {fmtFg(
                val,
                uom,
                row.weightKg,
                isBoldColumn(colIdx, values.length),
              )}
            </td>
          ))}
          {showCover && (
            <td
              key={`${label}-${compCode}-cover`}
              className="px-3 py-2.5 text-center whitespace-nowrap"
              style={bodyCellStyle(values.length, rowIndex, expanded)}
            >
              {fmtCoverDate(coverDate)}
            </td>
          )}
        </Fragment>
      );
    });

  const renderClusterDrilldownRows = () =>
    rowLabels.map((cluster, pi) => {
      const isExpanded = expandedCluster === cluster;
      const clusterPlants = getPlantsForCluster(cluster, allPlants);
      const rowBg = isExpanded ? "#EDF5F4" : pi % 2 === 0 ? "#fff" : "#f8fafc";

      return (
        <Fragment key={cluster}>
          <tr
            className="transition-colors cursor-pointer"
            style={{
              backgroundColor: rowBg,
              outline: isExpanded ? "2px solid #1565C0" : undefined,
              outlineOffset: isExpanded ? "-1px" : undefined,
            }}
            title={clusterToggleTitle(cluster, isExpanded)}
            onClick={() => onClusterClick?.(cluster)}
            onMouseEnter={(e) => {
              if (!isExpanded) {
                const tr = e.currentTarget as HTMLElement;
                tr.style.backgroundColor = "#EDF5F4";
                const firstTd = tr.querySelector("td");
                if (firstTd)
                  (firstTd as HTMLElement).style.backgroundColor = "#EDF5F4";
              }
            }}
            onMouseLeave={(e) => {
              const tr = e.currentTarget as HTMLElement;
              tr.style.backgroundColor = rowBg;
              const firstTd = tr.querySelector("td");
              if (firstTd)
                (firstTd as HTMLElement).style.backgroundColor = rowBg;
            }}
          >
            <td
              title={clusterCellTooltip(cluster)}
              className="px-3 py-2.5 text-center font-semibold whitespace-nowrap"
              style={{
                color: "#1565C0",
                borderRight: "1px solid #e2e8f0",
                backgroundColor: rowBg,
                position: "sticky",
                left: 0,
                zIndex: 10,
              }}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                {isExpanded ? (
                  <ChevronDown size={13} style={{ flexShrink: 0 }} />
                ) : (
                  <ChevronRight size={13} style={{ flexShrink: 0 }} />
                )}
                {cluster}
              </span>
            </td>
            {renderProductionPlanCell(null, rowBg)}
            {renderMetricCells(cluster, pi, getMetrics)}
            {renderFgSummaryCells(cluster)}
          </tr>

          {isExpanded &&
            (clusterPlants.length === 0 ? (
              <tr key={`${cluster}-empty`}>
                <td
                  colSpan={
                    1 +
                    (showProductionPlan ? 1 : 0) +
                    uniqueComponents.reduce(
                      (sum, code) =>
                        sum +
                        colsForComponent(
                          expandedComponents.has(code),
                          hiddenCols,
                        ),
                      0,
                    ) +
                    visibleFgSummaryCount
                  }
                  className="px-4 py-3 text-center italic"
                  style={{
                    backgroundColor: "#EDF5F4",
                    color: "#64748b",
                    borderBottom: "1px solid rgba(21,101,192,0.12)",
                  }}
                >
                  {NO_CLUSTER_PLANT_DATA_MESSAGE}
                </td>
              </tr>
            ) : (
              clusterPlants.map((plant, ci) => {
                const plantBg = ci % 2 === 0 ? "#F0F4FC" : "#ffffff";
                const plantMetrics =
                  getPlantMetrics ??
                  ((plantLabel, compCode) => getMetrics(plantLabel, compCode));
                return (
                  <tr
                    key={`${cluster}-${plant}`}
                    style={{ backgroundColor: plantBg }}
                    className="transition-colors"
                  >
                    <td
                      title={plantCellTooltip(plant, cluster)}
                      className="px-3 py-2.5 text-center whitespace-nowrap"
                      style={{
                        borderRight: "1px solid #e2e8f0",
                        backgroundColor: plantBg,
                        position: "sticky",
                        left: 0,
                        zIndex: 10,
                      }}
                    >
                      <span className="inline-flex items-center justify-center gap-1.5 text-xs">
                        <span style={{ color: "rgba(21,101,192,0.6)" }}>⌞</span>
                        <span
                          className="font-semibold"
                          style={{ color: "#003087" }}
                        >
                          {plant}
                        </span>
                      </span>
                    </td>
                    {renderProductionPlanCell(plant, plantBg)}
                    {renderMetricCells(plant, pi + ci + 1, plantMetrics)}
                    {renderFgSummaryCells(`${cluster}-${plant}`)}
                  </tr>
                );
              })
            ))}
        </Fragment>
      );
    });

  const renderFlatRows = () =>
    rowLabels.map((rowLabel, pi) => {
      const rowBg = pi % 2 === 0 ? "#fff" : "#f8fafc";
      const cluster = PLANT_CLUSTER_MAP[rowLabel];
      const displayLabel = cluster ? `${rowLabel}: ${cluster}` : rowLabel;
      const cellTooltip = cluster
        ? plantCellTooltip(rowLabel, cluster)
        : rowLabel;
      return (
        <tr
          key={rowLabel}
          style={{ backgroundColor: rowBg }}
          className="hover:bg-blue-50 transition-colors"
          onMouseEnter={(e) => {
            const firstTd = (e.currentTarget as HTMLElement).querySelector(
              "td",
            );
            if (firstTd)
              (firstTd as HTMLElement).style.backgroundColor = "#eff6ff";
          }}
          onMouseLeave={(e) => {
            const firstTd = (e.currentTarget as HTMLElement).querySelector(
              "td",
            );
            if (firstTd)
              (firstTd as HTMLElement).style.backgroundColor = rowBg;
          }}
        >
          <td
            title={cellTooltip}
            className="px-3 py-2.5 text-center font-semibold whitespace-nowrap"
            style={{
              color: "#003087",
              borderRight: "1px solid #e2e8f0",
              backgroundColor: rowBg,
              position: "sticky",
              left: 0,
              zIndex: 10,
            }}
          >
            {displayLabel}
          </td>
          {renderProductionPlanCell(rowLabel, rowBg)}
          {renderMetricCells(rowLabel, pi, getMetrics)}
          {renderFgSummaryCells(rowLabel)}
        </tr>
      );
    });

  const totalMetricCols = uniqueComponents.reduce(
    (sum, compCode) =>
      sum + colsForComponent(expandedComponents.has(compCode), hiddenCols),
    0,
  );
  const tableWidth =
    ROW_HEADER_COL_WIDTH +
    (showProductionPlan ? PRODUCTION_PLAN_COL_WIDTH : 0) +
    totalMetricCols * METRIC_COL_WIDTH +
    visibleFgSummaryCount * FG_SUMMARY_COL_WIDTH;

  return (
    <table
      className="text-xs border-collapse"
      style={{ width: `max(${tableWidth}px, 100%)`, tableLayout: "fixed" }}
    >
      <colgroup>
        <col style={{ width: ROW_HEADER_COL_WIDTH }} />
        {showProductionPlan && (
          <col style={{ width: PRODUCTION_PLAN_COL_WIDTH }} />
        )}
        {Array.from({ length: totalMetricCols }).map((_, i) => (
          <col key={`col-${i}`} style={{ width: METRIC_COL_WIDTH }} />
        ))}
        {visibleFgSummary.map((label) => (
          <col key={`fg-summary-col-${label}`} style={{ width: FG_SUMMARY_COL_WIDTH }} />
        ))}
      </colgroup>
      <thead>
        <tr style={{ backgroundColor: "#003087" }} className="text-white">
          <th
            rowSpan={2}
            className="px-3 py-2.5 text-center font-semibold whitespace-nowrap"
            style={{
              borderRight: "1px solid rgba(255,255,255,0.15)",
              position: "sticky",
              left: 0,
              zIndex: 20,
              backgroundColor: "#003087",
            }}
          >
            {rowHeader}
            {rowHeaderSubtext && (
              <span
                className="block font-normal normal-case"
                style={{ fontSize: 10, color: "#bfdbfe" }}
              >
                {rowHeaderSubtext}
              </span>
            )}
          </th>
          {showProductionPlan && (
            <th
              rowSpan={2}
              className="px-3 py-2.5 text-center font-semibold whitespace-nowrap"
              style={{
                borderRight: "1px solid rgba(255,255,255,0.15)",
                position: "sticky",
                left: ROW_HEADER_COL_WIDTH,
                zIndex: 20,
                backgroundColor: "#003087",
              }}
            >
              {PRODUCTION_PLAN_LABEL}
            </th>
          )}
          {uniqueComponents.map((compCode) => {
            const expanded = expandedComponents.has(compCode);
            return (
              <th
                key={`gh-${compCode}`}
                colSpan={colsForComponent(expanded, hiddenCols)}
                className="px-3 py-2 text-center font-semibold whitespace-nowrap"
                style={{
                  borderRight: "1px solid rgba(255,255,255,0.15)",
                  borderBottom: "1px solid rgba(255,255,255,0.18)",
                }}
              >
                <ComponentHeader compCode={compCode} plantRows={plantRows} />
              </th>
            );
          })}
          {visibleFgSummary.map((label, i) => (
            <th
              key={`fg-summary-${label}`}
              rowSpan={2}
              title={FG_SUMMARY_COL_TOOLTIPS[label]}
              className="px-2 py-2 text-center font-semibold leading-tight"
              style={{
                borderLeft:
                  i === 0
                    ? "2px solid rgba(255,255,255,0.3)"
                    : "1px solid rgba(255,255,255,0.15)",
                borderRight: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              {label}
            </th>
          ))}
        </tr>
        <tr style={{ backgroundColor: "#1565C0" }} className="text-white">
          {uniqueComponents.map((compCode) => {
            const expanded = expandedComponents.has(compCode);
            const subColumns = getSubColumns(expanded, hiddenCols);
            return (
              <Fragment key={`sub-${compCode}`}>
                {subColumns.map((label, colIdx) => {
                  const isOnHandToggle =
                    colIdx === 0 && label === "On hand stock";
                  const isLastInGroup = colIdx === subColumns.length - 1;
                  return (
                    <th
                      key={`${compCode}-${label}-${colIdx}`}
                      className="px-2 py-1.5 text-center font-medium leading-tight"
                      style={subHeaderStyle(
                        colIdx,
                        isLastInGroup,
                        isOnHandToggle,
                        expanded,
                      )}
                      onClick={
                        isOnHandToggle
                          ? () => onToggleComponentExpanded(compCode)
                          : undefined
                      }
                      title={
                        isOnHandToggle
                          ? `${expanded ? "Collapse" : "Expand"} on-hand stock for this component — ${getStockColumnTooltip(label)}`
                          : getStockColumnTooltip(label)
                      }
                    >
                      {isOnHandToggle ? (
                        <span className="inline-flex items-center justify-center gap-1 w-full">
                          {label}
                          {expanded ? (
                            <ChevronDown size={12} />
                          ) : (
                            <ChevronRight size={12} />
                          )}
                        </span>
                      ) : (
                        label
                      )}
                    </th>
                  );
                })}
              </Fragment>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {clusterDrilldown ? renderClusterDrilldownRows() : renderFlatRows()}
        {rowLabels.length > 0 && (
          <tr
            style={{ backgroundColor: "#003087" }}
            className="text-white font-semibold"
          >
            <td
              className="px-3 py-2.5 text-center whitespace-nowrap"
              style={{
                borderRight: "1px solid rgba(255,255,255,0.15)",
                position: "sticky",
                left: 0,
                zIndex: 10,
                backgroundColor: "#003087",
              }}
            >
              {TOTAL_ROW_LABEL}
            </td>
            {renderProductionPlanCell(null, "#003087", true)}
            {uniqueComponents.map((compCode) => {
              const expanded = expandedComponents.has(compCode);
              const totals = aggregateMetrics(
                rowLabels.map((rowLabel) => getMetrics(rowLabel, compCode)),
              );
              const totalValues = metricsToValues(totals, expanded, hiddenCols);
              const totalCoverDate = calcCoverDate(
                totals.total,
                totals.demand,
              );
              // +1 accounts for the trailing cover-date cell (when shown),
              // which is the true last column and gets the thicker
              // group-boundary border.
              const colsWithCover = totalValues.length + (showCover ? 1 : 0);
              return (
                <Fragment key={`total-${compCode}`}>
                  {totalValues.map((val, colIdx) => (
                    <td
                      key={`total-${compCode}-${colIdx}`}
                      className="px-3 py-2.5 text-center"
                      style={totalCellStyle(colIdx, colsWithCover, expanded)}
                    >
                      {fmtFg(
                        val,
                        uom,
                        row.weightKg,
                        isBoldColumn(colIdx, totalValues.length),
                        true,
                      )}
                    </td>
                  ))}
                  {showCover && (
                    <td
                      key={`total-${compCode}-cover`}
                      className="px-3 py-2.5 text-center whitespace-nowrap"
                      style={totalCellStyle(
                        totalValues.length,
                        colsWithCover,
                        expanded,
                      )}
                    >
                      {fmtCoverDate(totalCoverDate, false, true)}
                    </td>
                  )}
                </Fragment>
              );
            })}
            {renderFgSummaryCells("total", true)}
          </tr>
        )}
      </tbody>
    </table>
  );
}
