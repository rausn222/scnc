import React from "react";
import { useState, Fragment } from "react";
import { useNav } from "../App";
import {
  type CBURow,
  getAggregatedComponents,
  getComponentsByPlant,
  getRowFgMaterial,
  getComponentDescription,
  PLANT_CLUSTER_MAP,
  toFgEquivalent,
  type PlantComponentRow,
  demandData,
  demandMonths,
} from "../components/data";
import {
  TrendingUp,
  Package,
  Boxes,
  Calendar,
  BarChart2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";

type UomFilter = "EA" | "MT" | "RMPM";
type StockViewLevel = "plant" | "cluster";

const UOM_OPTIONS: { id: UomFilter; label: string }[] = [
  { id: "EA", label: "EA" },
  { id: "MT", label: "Tonnes" },
  { id: "RMPM", label: "FG-UOM" },
];

const STOCK_VIEW_OPTIONS: { id: StockViewLevel; label: string }[] = [
  { id: "plant", label: "Plant Based View" },
  { id: "cluster", label: "Cluster Based View" },
];

const STOCK_COLUMNS = [
  "On hand stock",
  "Open PO",
  "In transit",
  "Supplier inventory",
  "Total",
] as const;

const ON_HAND_BREAKDOWN_COLUMNS = [
  "Unrestricted Stock",
  "Stock in Quality",
  "STV stock",
  "Blocked Stock",
  "Total Stock",
] as const;

const OTHER_STOCK_COLUMNS = [
  "Open PO",
  "In transit",
  "Supplier inventory",
  "Total",
] as const;

const ON_HAND_BREAKDOWN_COUNT = ON_HAND_BREAKDOWN_COLUMNS.length;

const COLLAPSED_COL_COUNT = STOCK_COLUMNS.length;
const EXPANDED_COL_COUNT =
  1 + ON_HAND_BREAKDOWN_COUNT + OTHER_STOCK_COLUMNS.length;

const EXPANDED_ONHAND_HEADER_BG = "#dbeafe";
const EXPANDED_BREAKDOWN_HEADER_BG = "#eff6ff";
const EXPANDED_ONHAND_CELL_BG = "#f0f9ff";
const EXPANDED_BREAKDOWN_CELL_BG = "#f8fafc";
const EXPANDED_BREAKDOWN_CELL_BG_ALT = "#f1f5f9";
const EXPANDED_GROUP_BORDER = "1px solid #93c5fd";
const EXPANDED_TOTAL_ONHAND_BG = "#475569";
const EXPANDED_TOTAL_BREAKDOWN_BG = "#64748b";
const EXPANDED_HEADER_TEXT = "#1e40af";
const EXPANDED_BREAKDOWN_HEADER_TEXT = "#334155";

function isOnHandParentColumn(colIdx: number, expanded: boolean) {
  return expanded && colIdx === 0;
}

function isBreakdownColumn(colIdx: number, expanded: boolean) {
  return expanded && colIdx >= 1 && colIdx <= ON_HAND_BREAKDOWN_COUNT;
}

function getSubColumns(expanded: boolean): string[] {
  return expanded
    ? ["On hand stock", ...ON_HAND_BREAKDOWN_COLUMNS, ...OTHER_STOCK_COLUMNS]
    : [...STOCK_COLUMNS];
}

function colsForComponent(expanded: boolean): number {
  return expanded ? EXPANDED_COL_COUNT : COLLAPSED_COL_COUNT;
}

const CLUSTER_ORDER = ["North", "West", "Central", "Haridwar", "DDP", "East", "South"] as const;

type OnHandBreakdown = {
  unrestricted: number;
  quality: number;
  stv: number;
  blocked: number;
  total: number;
};

type StockMetrics = {
  onHand: number;
  onHandBreakdown: OnHandBreakdown;
  openPO: number;
  inTransit: number;
  supplier: number;
  total: number;
};

const emptyBreakdown = (): OnHandBreakdown => ({
  unrestricted: 0,
  quality: 0,
  stv: 0,
  blocked: 0,
  total: 0,
});

const fmt = (n: number) =>
  n === 0 ? "—" : n.toLocaleString("en-IN");

function fmtFg(
  fgUnits: number,
  uom: UomFilter,
  weightKg: number,
  bold = false,
  light = false,
): React.ReactNode {
  if (fgUnits === 0)
    return (
      <span style={{ color: light ? "rgba(255,255,255,0.35)" : "#cbd5e1" }}>
        —
      </span>
    );
  const style: React.CSSProperties = {
    color: light ? "#ffffff" : bold ? "#003087" : "#0f172a",
    fontWeight: bold || light ? 600 : 400,
  };
  if (uom === "MT") {
    const t = (fgUnits * weightKg) / 1000;
    return (
      <span style={style}>
        {t < 1 ? t.toFixed(3) : t.toFixed(2)}
      </span>
    );
  }
  if (uom === "RMPM") {
    return (
      <span style={style}>{fgUnits.toLocaleString("en-IN")}</span>
    );
  }
  return (
    <span style={style}>{fgUnits.toLocaleString("en-IN")}</span>
  );
}

function plantBaseMetrics(
  pr: PlantComponentRow | undefined,
): StockMetrics {
  const cf = pr?.conversionFactor ?? 0;
  const onHand =
    pr?.onHandStock && pr.onHandStock > 0
      ? pr.onHandStock
      : pr?.fgPhysicalStock != null && cf > 0
        ? Math.round(pr.fgPhysicalStock * cf)
        : (pr?.onHandStock ?? 0);
  const openPO =
    pr?.openPOStock && pr.openPOStock > 0
      ? pr.openPOStock
      : pr?.fgOpenPOStock != null && cf > 0
        ? Math.round(pr.fgOpenPOStock * cf)
        : (pr?.openPOStock ?? 0);
  const inTransit = pr?.inTransitStock ?? 0;
  const supplier = pr?.supplierInventory ?? 0;
  const unrestricted = pr?.unrestrictedStock ?? 0;
  const quality = pr?.qualityStock ?? 0;
  const stv = pr?.stvStock ?? 0;
  const blocked = pr?.blockedStock ?? 0;
  const breakdownTotal = unrestricted + quality + stv + blocked;
  return {
    onHand,
    onHandBreakdown: {
      unrestricted,
      quality,
      stv,
      blocked,
      total: breakdownTotal > 0 ? breakdownTotal : onHand,
    },
    openPO,
    inTransit,
    supplier,
    total: onHand + inTransit + supplier,
  };
}

function plantFgOnHandBreakdown(
  pr: PlantComponentRow | undefined,
): OnHandBreakdown {
  const cf = pr?.conversionFactor ?? 0;
  if (
    pr?.fgUnrestrictedStock != null ||
    pr?.fgQualityStock != null ||
    pr?.fgStvStock != null ||
    pr?.fgBlockedStock != null
  ) {
    const unrestricted = pr.fgUnrestrictedStock ?? 0;
    const quality = pr.fgQualityStock ?? 0;
    const stv = pr.fgStvStock ?? 0;
    const blocked = pr.fgBlockedStock ?? 0;
    const total = unrestricted + quality + stv + blocked;
    return {
      unrestricted,
      quality,
      stv,
      blocked,
      total: total > 0 ? total : (pr.fgPhysicalStock ?? 0),
    };
  }
  return {
    unrestricted: toFgEquivalent(pr?.unrestrictedStock ?? 0, cf),
    quality: toFgEquivalent(pr?.qualityStock ?? 0, cf),
    stv: toFgEquivalent(pr?.stvStock ?? 0, cf),
    blocked: toFgEquivalent(pr?.blockedStock ?? 0, cf),
    total: toFgEquivalent(pr?.onHandStock ?? 0, cf),
  };
}

function plantFgMetrics(pr: PlantComponentRow | undefined): StockMetrics {
  const onHandBreakdown = plantFgOnHandBreakdown(pr);
  if (pr?.fgPhysicalStock != null || pr?.fgOpenPOStock != null) {
    const onHand = pr.fgPhysicalStock ?? onHandBreakdown.total;
    const openPO = pr.fgOpenPOStock ?? 0;
    const cf = pr.conversionFactor ?? 0;
    const inTransit = toFgEquivalent(pr.inTransitStock ?? 0, cf);
    const supplier = toFgEquivalent(pr.supplierInventory ?? 0, cf);
    return {
      onHand,
      onHandBreakdown,
      openPO,
      inTransit,
      supplier,
      total: onHand + inTransit + supplier,
    };
  }
  const cf = pr?.conversionFactor ?? 0;
  const onHand = toFgEquivalent(pr?.onHandStock ?? 0, cf);
  const openPO = toFgEquivalent(pr?.openPOStock ?? 0, cf);
  const inTransit = toFgEquivalent(pr?.inTransitStock ?? 0, cf);
  const supplier = toFgEquivalent(pr?.supplierInventory ?? 0, cf);
  return {
    onHand,
    onHandBreakdown,
    openPO,
    inTransit,
    supplier,
    total: onHand + inTransit + supplier,
  };
}

function getPlantStockMetrics(
  pr: PlantComponentRow | undefined,
  uom: UomFilter,
): StockMetrics {
  return uom === "RMPM" ? plantBaseMetrics(pr) : plantFgMetrics(pr);
}

function metricsToValues(m: StockMetrics, onHandExpanded: boolean): number[] {
  if (onHandExpanded) {
    const b = m.onHandBreakdown;
    return [
      m.onHand,
      b.unrestricted,
      b.quality,
      b.stv,
      b.blocked,
      b.total,
      m.openPO,
      m.inTransit,
      m.supplier,
      m.total,
    ];
  }
  return [m.onHand, m.openPO, m.inTransit, m.supplier, m.total];
}

function sumMetrics(metrics: StockMetrics[]): StockMetrics {
  return metrics.reduce(
    (acc, m) => {
      acc.onHand += m.onHand;
      acc.onHandBreakdown.unrestricted += m.onHandBreakdown.unrestricted;
      acc.onHandBreakdown.quality += m.onHandBreakdown.quality;
      acc.onHandBreakdown.stv += m.onHandBreakdown.stv;
      acc.onHandBreakdown.blocked += m.onHandBreakdown.blocked;
      acc.onHandBreakdown.total += m.onHandBreakdown.total;
      acc.openPO += m.openPO;
      acc.inTransit += m.inTransit;
      acc.supplier += m.supplier;
      acc.total += m.total;
      return acc;
    },
    {
      onHand: 0,
      onHandBreakdown: emptyBreakdown(),
      openPO: 0,
      inTransit: 0,
      supplier: 0,
      total: 0,
    },
  );
}

function getClusterLabels(
  plants: string[],
): string[] {
  const set = new Set<string>();
  for (const plant of plants) {
    set.add(PLANT_CLUSTER_MAP[plant] ?? plant);
  }
  return CLUSTER_ORDER.filter((cluster) => set.has(cluster));
}

function getPlantsForCluster(cluster: string, plants: string[]): string[] {
  return plants.filter(
    (plant) => (PLANT_CLUSTER_MAP[plant] ?? plant) === cluster,
  );
}

function aggregateClusterMetrics(
  cluster: string,
  compCode: string,
  plantRows: PlantComponentRow[],
  uom: UomFilter,
): StockMetrics {
  const matching = plantRows.filter(
    (pr) =>
      pr.componentCode === compCode &&
      (PLANT_CLUSTER_MAP[pr.plantco] ?? pr.plantco) === cluster,
  );
  return sumMetrics(matching.map((pr) => getPlantStockMetrics(pr, uom)));
}

function componentHeader(
  compCode: string,
  plantRows: PlantComponentRow[],
): React.ReactNode {
  const firstRow = plantRows.find((r) => r.componentCode === compCode);
  const isRM = firstRow?.componentMaterialType === "1002";
  const description = getComponentDescription({
    componentCode: compCode,
    componentMaterialType: firstRow?.componentMaterialType ?? "1002",
    unrestrictedStock: 0,
    qualityStock: 0,
    blockedStock: 0,
    totalStock: 0,
    openPOStock: 0,
  });
  return (
    <div className="flex flex-col items-center gap-0.5 leading-tight">
      <span className="inline-flex items-center justify-center gap-1.5 flex-wrap">
        <span>{compCode}</span>
        <span
          className="inline-block px-1.5 py-0.5 rounded-full font-semibold"
          style={{
            backgroundColor: isRM
              ? "rgba(219,234,254,0.2)"
              : "rgba(237,233,254,0.2)",
            color: isRM ? "#bfdbfe" : "#ddd6fe",
            fontSize: 9,
          }}
        >
          {isRM ? "RM" : "PM"}
        </span>
      </span>
      <span
        className="font-normal truncate max-w-[220px] px-1"
        style={{ color: "#bfdbfe", fontSize: 9 }}
        title={description}
      >
        {description}
      </span>
    </div>
  );
}

interface StockTableProps {
  row: CBURow;
  uom: UomFilter;
  rowHeader: string;
  rowLabels: string[];
  plantRows: PlantComponentRow[];
  uniqueComponents: string[];
  getMetrics: (rowLabel: string, compCode: string) => StockMetrics;
  getPlantMetrics?: (plant: string, compCode: string) => StockMetrics;
  expandedComponents: Set<string>;
  onToggleComponentExpanded: (compCode: string) => void;
  clusterDrilldown?: boolean;
  allPlants?: string[];
  expandedCluster?: string | null;
  onClusterClick?: (cluster: string) => void;
}

function StockTable({
  row,
  uom,
  rowHeader,
  rowLabels,
  plantRows,
  uniqueComponents,
  getMetrics,
  getPlantMetrics,
  expandedComponents,
  onToggleComponentExpanded,
  clusterDrilldown = false,
  allPlants = [],
  expandedCluster = null,
  onClusterClick,
}: StockTableProps) {
  const isBoldColumn = (
    colIdx: number,
    totalCols: number,
    expanded: boolean,
  ) => {
    if (colIdx === totalCols - 1) return true;
    if (expanded && colIdx === ON_HAND_BREAKDOWN_COUNT) return true;
    return false;
  };

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
      minWidth: 88,
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

  const renderMetricCells = (
    label: string,
    rowIndex: number,
    resolveMetrics: (rowLabel: string, compCode: string) => StockMetrics,
  ) =>
    uniqueComponents.map((compCode) => {
      const expanded = expandedComponents.has(compCode);
      const values = metricsToValues(
        resolveMetrics(label, compCode),
        expanded,
      );
      return (
        <Fragment key={`${label}-${compCode}`}>
          {values.map((val, colIdx) => (
            <td
              key={`${label}-${compCode}-${colIdx}`}
              className="px-3 py-2.5 text-right"
              style={bodyCellStyle(colIdx, rowIndex, expanded)}
            >
              {fmtFg(
                val,
                uom,
                row.weightKg,
                isBoldColumn(colIdx, values.length, expanded),
              )}
            </td>
          ))}
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
            onClick={() => onClusterClick?.(cluster)}
            onMouseEnter={(e) => {
              if (!isExpanded) {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  "#EDF5F4";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = rowBg;
            }}
          >
            <td
              className="px-3 py-2.5 font-semibold whitespace-nowrap"
              style={{
                color: "#1565C0",
                borderRight: "1px solid #e2e8f0",
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                {isExpanded ? (
                  <ChevronDown size={13} style={{ flexShrink: 0 }} />
                ) : (
                  <ChevronRight size={13} style={{ flexShrink: 0 }} />
                )}
                {cluster}
              </span>
            </td>
            {renderMetricCells(cluster, pi, getMetrics)}
          </tr>

          {isExpanded &&
            (clusterPlants.length === 0 ? (
              <tr key={`${cluster}-empty`}>
                <td
                  colSpan={
                    1 +
                    uniqueComponents.reduce(
                      (sum, code) =>
                        sum +
                        colsForComponent(expandedComponents.has(code)),
                      0,
                    )
                  }
                  className="px-4 py-3 text-center italic"
                  style={{
                    backgroundColor: "#EDF5F4",
                    color: "#64748b",
                    borderBottom: "1px solid rgba(21,101,192,0.12)",
                  }}
                >
                  No plant data for this cluster
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
                      className="px-3 py-2.5 whitespace-nowrap"
                      style={{
                        borderRight: "1px solid #e2e8f0",
                        backgroundColor: plantBg,
                      }}
                    >
                      <span className="inline-flex items-center gap-1.5 pl-4 text-xs">
                        <span style={{ color: "rgba(21,101,192,0.6)" }}>⌞</span>
                        <span
                          className="font-semibold"
                          style={{ color: "#003087" }}
                        >
                          {plant}
                        </span>
                      </span>
                    </td>
                    {renderMetricCells(plant, pi + ci + 1, plantMetrics)}
                  </tr>
                );
              })
            ))}
        </Fragment>
      );
    });

  const renderFlatRows = () =>
    rowLabels.map((rowLabel, pi) => (
      <tr
        key={rowLabel}
        style={{ backgroundColor: pi % 2 === 0 ? "#fff" : "#f8fafc" }}
        className="hover:bg-blue-50 transition-colors"
      >
        <td
          className="px-3 py-2.5 font-semibold whitespace-nowrap"
          style={{ color: "#003087", borderRight: "1px solid #e2e8f0" }}
        >
          {rowLabel}
        </td>
        {renderMetricCells(rowLabel, pi, getMetrics)}
      </tr>
    ));

  return (
    <table className="text-xs border-collapse" style={{ width: "100%" }}>
      <thead>
        <tr style={{ backgroundColor: "#003087" }} className="text-white">
          <th
            rowSpan={2}
            className="px-3 py-2.5 text-left font-semibold whitespace-nowrap"
            style={{
              borderRight: "1px solid rgba(255,255,255,0.15)",
              minWidth: 110,
            }}
          >
            {rowHeader}
          </th>
          {uniqueComponents.map((compCode) => {
            const expanded = expandedComponents.has(compCode);
            return (
              <th
                key={`gh-${compCode}`}
                colSpan={colsForComponent(expanded)}
                className="px-3 py-2 text-center font-semibold whitespace-nowrap"
                style={{
                  borderRight: "1px solid rgba(255,255,255,0.15)",
                  borderBottom: "1px solid rgba(255,255,255,0.18)",
                }}
              >
                {componentHeader(compCode, plantRows)}
              </th>
            );
          })}
        </tr>
        <tr style={{ backgroundColor: "#1565C0" }} className="text-white">
          {uniqueComponents.map((compCode) => {
            const expanded = expandedComponents.has(compCode);
            const subColumns = getSubColumns(expanded);
            return (
              <Fragment key={`sub-${compCode}`}>
                {subColumns.map((label, colIdx) => {
                  const isOnHandToggle =
                    colIdx === 0 && label === "On hand stock";
                  const isLastInGroup = colIdx === subColumns.length - 1;
                  return (
                    <th
                      key={`${compCode}-${label}-${colIdx}`}
                      className="px-3 py-1.5 text-right font-medium whitespace-nowrap"
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
                          ? expanded
                            ? "Collapse on-hand stock for this component"
                            : "Expand on-hand stock for this component"
                          : undefined
                      }
                    >
                      {isOnHandToggle ? (
                        <span className="inline-flex items-center justify-end gap-1 w-full">
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
              className="px-3 py-2.5 whitespace-nowrap"
              style={{ borderRight: "1px solid rgba(255,255,255,0.15)" }}
            >
              TOTAL
            </td>
            {uniqueComponents.map((compCode) => {
              const expanded = expandedComponents.has(compCode);
              const totals = sumMetrics(
                rowLabels.map((rowLabel) => getMetrics(rowLabel, compCode)),
              );
              const totalValues = metricsToValues(totals, expanded);
              return (
                <Fragment key={`total-${compCode}`}>
                  {totalValues.map((val, colIdx) => (
                    <td
                      key={`total-${compCode}-${colIdx}`}
                      className="px-3 py-2.5 text-right"
                      style={totalCellStyle(
                        colIdx,
                        totalValues.length,
                        expanded,
                      )}
                    >
                      {fmtFg(
                        val,
                        uom,
                        row.weightKg,
                        isBoldColumn(colIdx, totalValues.length, expanded),
                        true,
                      )}
                    </td>
                  ))}
                </Fragment>
              );
            })}
          </tr>
        )}
      </tbody>
    </table>
  );
}

function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleString("en", { month: "short", year: "numeric" });
}

interface Props {
  row: CBURow;
}

export default function CBUDetail({ row }: Props) {
  const { navigate } = useNav();
  const [uom, setUom] = useState<UomFilter>("EA");
  const [stockView, setStockView] = useState<StockViewLevel>("plant");
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(
    new Set(),
  );
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

  const demand = demandData.find((d) => d.cbu === row.cbuCode);
  const fgMaterial = getRowFgMaterial(row);
  const components = getAggregatedComponents(row.cbuCode, fgMaterial);

  const uniqueRM = new Set(
    components
      .filter((c) => c.componentMaterialType === "1002")
      .map((c) => c.componentCode),
  ).size;
  const uniquePM = new Set(
    components
      .filter((c) => c.componentMaterialType === "1003")
      .map((c) => c.componentCode),
  ).size;

  const peakMonth = demand
    ? demandMonths.reduce(
        (best, m) =>
          (demand.monthly[m] ?? 0) > (demand.monthly[best] ?? 0) ? m : best,
        demandMonths[0],
      )
    : null;

  const { plants, rows: plantRows } = getComponentsByPlant(
    row.cbuCode,
    row.demand.next12Months,
    fgMaterial,
  );
  const clusters = getClusterLabels(plants);
  const plantStockTotals: Record<string, number> = {};
  for (const pr of plantRows) {
    plantStockTotals[pr.plantco] =
      (plantStockTotals[pr.plantco] ?? 0) + pr.onHandStock;
  }
  const peakPlant =
    Object.entries(plantStockTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "—";

  const fgTotal = row.fg.totalStock;
  const demand12 = row.demand.next12Months;

  const uniqueComponents = [
    ...new Set(plantRows.map((r) => r.componentCode)),
  ];

  const anyOnHandExpanded = expandedComponents.size > 0;

  const toggleAllOnHandExpanded = () => {
    if (anyOnHandExpanded) {
      setExpandedComponents(new Set());
    } else {
      setExpandedComponents(new Set(uniqueComponents));
    }
  };

  const toggleComponentOnHandExpanded = (compCode: string) => {
    setExpandedComponents((prev) => {
      const next = new Set(prev);
      if (next.has(compCode)) next.delete(compCode);
      else next.add(compCode);
      return next;
    });
  };

  const isPlantView = stockView === "plant";
  const rowLabels = isPlantView ? plants : clusters;
  const hasRows = rowLabels.length > 0;

  const getMetrics = isPlantView
    ? (rowLabel: string, compCode: string) =>
        getPlantStockMetrics(
          plantRows.find(
            (r) => r.plantco === rowLabel && r.componentCode === compCode,
          ),
          uom,
        )
    : (rowLabel: string, compCode: string) =>
        aggregateClusterMetrics(rowLabel, compCode, plantRows, uom);

  const getPlantMetrics = (plant: string, compCode: string) =>
    getPlantStockMetrics(
      plantRows.find(
        (r) => r.plantco === plant && r.componentCode === compCode,
      ),
      uom,
    );

  const handleClusterClick = (cluster: string) => {
    setExpandedCluster((prev) => (prev === cluster ? null : cluster));
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "#f5f7fa" }}
    >
      <PageHeader
        title={`${row.cbuCode} — CBU Detail`}
        breadcrumbs={[
          { label: "SAMARTH" },
          { label: "Network Planner" },
          {
            label: "CBU Transition (National View)",
            onClick: () => navigate({ page: "dashboard" }),
          },
          { label: row.cbuCode },
        ]}
      >
        <button
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ backgroundColor: "#ffffff24", color: "#fff" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor =
              "#ffffff40";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor =
              "#ffffff24";
          }}
        >
          Open Simulation
        </button>
      </PageHeader>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            icon={<Package size={16} style={{ color: "#1565C0" }} />}
            label="UNIQUE RM COMPONENTS"
            value={String(uniqueRM || "—")}
            sub="Raw Material (1002)"
            iconBg="#dbeafe"
            valueColor="#003087"
          />
          <KpiCard
            icon={<Package size={16} style={{ color: "#003087" }} />}
            label="UNIQUE PM COMPONENTS"
            value={String(uniquePM || "—")}
            sub="Packaging Material (1003)"
            iconBg="#dbeafe"
            valueColor="#003087"
          />
          <KpiCard
            icon={<TrendingUp size={16} style={{ color: "#1565C0" }} />}
            label="TOTAL 12-MONTH DEMAND"
            value={fmt(demand12)}
            sub="units (EA)"
            iconBg="#dbeafe"
            valueColor="#003087"
          />
          <KpiCard
            icon={<Boxes size={16} style={{ color: "#1565C0" }} />}
            label="CURRENT FG STOCK"
            value={fmt(fgTotal)}
            sub="at locations"
            iconBg="#dbeafe"
            valueColor="#003087"
          />
          <KpiCard
            icon={<Calendar size={16} style={{ color: "#16a34a" }} />}
            label="PEAK DEMAND MONTH"
            value={peakMonth ? monthLabel(peakMonth) : "—"}
            sub="Highest planned production"
            iconBg="#f0fdf4"
            valueColor="#14532d"
          />
          <KpiCard
            icon={<BarChart2 size={16} style={{ color: "#d97706" }} />}
            label="PEAK PRODUCTION PLANT"
            value={peakPlant}
            sub="Largest share of 12M plan"
            iconBg="#fffbeb"
            valueColor="#78350f"
          />
        </div>

        <div
          className="bg-white rounded-xl p-5"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Package size={15} style={{ color: "#1565C0" }} />
                <span
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: "#1565C0" }}
                >
                  RM/PM Stock vs Required — By{" "}
                  {isPlantView ? "Plant" : "Cluster"}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                {uom === "RMPM"
                  ? "All values in RM/PM base units"
                  : `All values in FG Equivalent${uom === "MT" ? " (Tonnes)" : " (EA)"}`}
                {!isPlantView && " · Click a cluster to drill down to plants"}
              </p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#374151" }}
                >
                  View
                </span>
                <div
                  className="flex rounded-full overflow-hidden text-xs"
                  style={{
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: "#d1d5db",
                  }}
                >
                  {STOCK_VIEW_OPTIONS.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => {
                        setStockView(id);
                        if (id === "plant") setExpandedCluster(null);
                      }}
                      className="px-3 py-1.5 transition-colors font-medium whitespace-nowrap"
                      style={{
                        backgroundColor: stockView === id ? "#003087" : "#ffffff",
                        color: stockView === id ? "#ffffff" : "#374151",
                        fontSize: 11,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#374151" }}
                >
                  On-Hand Stock
                </span>
                <button
                  type="button"
                  onClick={toggleAllOnHandExpanded}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
                  style={{
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: anyOnHandExpanded ? "#93c5fd" : "#d1d5db",
                    backgroundColor: anyOnHandExpanded ? "#eff6ff" : "#ffffff",
                    color: anyOnHandExpanded ? "#1e40af" : "#374151",
                  }}
                >
                  {anyOnHandExpanded ? "Collapse" : "Expand breakdown"}
                  {anyOnHandExpanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold"
                style={{ color: "#374151" }}
              >
                UOM
              </span>
              <div
                className="flex rounded-full overflow-hidden text-xs"
                style={{
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: "#d1d5db",
                }}
              >
                {UOM_OPTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setUom(id)}
                    className="px-4 py-1.5 transition-colors font-medium"
                    style={{
                      backgroundColor: uom === id ? "#1565C0" : "#ffffff",
                      color: uom === id ? "#ffffff" : "#374151",
                      fontSize: 12,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              </div>
            </div>
          </div>

          {!hasRows ? (
            <p className="text-sm italic" style={{ color: "#94a3b8" }}>
              No {isPlantView ? "plant" : "cluster"} data available.
            </p>
          ) : (
            <div
              className="overflow-x-auto rounded-lg"
              style={{ border: "1px solid #e2e8f0" }}
            >
              <StockTable
                row={row}
                uom={uom}
                rowHeader={isPlantView ? "Plant" : "Cluster"}
                rowLabels={rowLabels}
                plantRows={plantRows}
                uniqueComponents={uniqueComponents}
                getMetrics={getMetrics}
                getPlantMetrics={getPlantMetrics}
                expandedComponents={expandedComponents}
                onToggleComponentExpanded={toggleComponentOnHandExpanded}
                clusterDrilldown={!isPlantView}
                allPlants={plants}
                expandedCluster={expandedCluster}
                onClusterClick={handleClusterClick}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  iconBg,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  iconBg: string;
  valueColor: string;
}) {
  return (
    <div
      className="rounded-xl p-4 bg-white flex items-start gap-3"
      style={{ border: "1px solid #e2e8f0" }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className="font-bold uppercase tracking-wide mb-0.5"
          style={{ color: "#94a3b8", fontSize: 9 }}
        >
          {label}
        </p>
        <p
          className="font-bold truncate"
          style={{ color: valueColor, fontSize: 16 }}
        >
          {value}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: "#94a3b8" }}>
          {sub}
        </p>
      </div>
    </div>
  );
}
