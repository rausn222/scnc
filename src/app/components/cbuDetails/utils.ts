import { PLANT_CLUSTER_MAP, toFgEquivalent, type PlantComponentRow } from "../data";
import {
  ON_HAND_BREAKDOWN_COUNT,
  ON_HAND_BREAKDOWN_COLUMNS,
  DEMAND_COVER_COLUMNS,
  STOCK_COLUMNS,
  STOCK_COL_TOOLTIPS,
  CLUSTER_ORDER,
} from "../../constants/cbuDetail";
import type { OnHandBreakdown, StockMetrics, UomFilter } from "./types";

export function isOnHandParentColumn(colIdx: number, expanded: boolean) {
  return expanded && colIdx === 0;
}

export function isBreakdownColumn(colIdx: number, expanded: boolean) {
  return expanded && colIdx >= 1 && colIdx <= ON_HAND_BREAKDOWN_COUNT;
}

/** Optional metric columns in a fixed order — "On hand stock" and "Total"
 * are always shown and aren't part of this list (see STOCK_COLUMN_DEFS). */
const OPTIONAL_METRIC_COLS: { id: string; label: string }[] = [
  { id: "openPO", label: "Open PO" },
  { id: "inTransit", label: "In transit" },
  { id: "supplier", label: "Supplier inventory" },
];

export function getSubColumns(
  expanded: boolean,
  hiddenCols: Set<string>,
): string[] {
  const cols: string[] = ["On hand stock"];
  if (expanded) cols.push(...ON_HAND_BREAKDOWN_COLUMNS);
  for (const { id, label } of OPTIONAL_METRIC_COLS) {
    if (!hiddenCols.has(id)) cols.push(label);
  }
  cols.push(STOCK_COLUMNS[STOCK_COLUMNS.length - 1]);
  if (!hiddenCols.has("cover")) cols.push(...DEMAND_COVER_COLUMNS);
  return cols;
}

export function colsForComponent(
  expanded: boolean,
  hiddenCols: Set<string>,
): number {
  return getSubColumns(expanded, hiddenCols).length;
}

export function getStockColumnTooltip(label: string): string {
  return STOCK_COL_TOOLTIPS[label] ?? "";
}

export const emptyBreakdown = (): OnHandBreakdown => ({
  unrestricted: 0,
  quality: 0,
  stv: 0,
  blocked: 0,
  total: 0,
});

export function plantBaseMetrics(
  pr: PlantComponentRow | undefined,
  demand12M: number,
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
    total: onHand + openPO + inTransit + supplier,
    demand: Math.round(demand12M * cf),
  };
}

export function plantFgOnHandBreakdown(
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

export function plantFgMetrics(
  pr: PlantComponentRow | undefined,
  demand12M: number,
): StockMetrics {
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
      total: onHand + openPO + inTransit + supplier,
      demand: demand12M,
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
    total: onHand + openPO + inTransit + supplier,
    demand: demand12M,
  };
}

export function getPlantStockMetrics(
  pr: PlantComponentRow | undefined,
  uom: UomFilter,
  demand12M: number,
): StockMetrics {
  return uom === "RMPM"
    ? plantBaseMetrics(pr, demand12M)
    : plantFgMetrics(pr, demand12M);
}

export function metricsToValues(
  m: StockMetrics,
  onHandExpanded: boolean,
  hiddenCols: Set<string>,
): number[] {
  const vals: number[] = [m.onHand];
  if (onHandExpanded) {
    const b = m.onHandBreakdown;
    vals.push(b.unrestricted, b.quality, b.stv, b.blocked);
  }
  if (!hiddenCols.has("openPO")) vals.push(m.openPO);
  if (!hiddenCols.has("inTransit")) vals.push(m.inTransit);
  if (!hiddenCols.has("supplier")) vals.push(m.supplier);
  vals.push(m.total);
  return vals;
}

/** Rolls up several plants' metrics into one Cluster/Total row. Every field is
 * additive across plants except Total Stock, which reflects the single
 * highest-holding plant rather than their sum — a deliberate "bottleneck"
 * convention (matching the National Dashboard's RMPM Max aggregation) rather
 * than double-counting stock that physically sits in different locations. */
export function aggregateMetrics(metrics: StockMetrics[]): StockMetrics {
  const summed = metrics.reduce(
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
      return acc;
    },
    {
      onHand: 0,
      onHandBreakdown: emptyBreakdown(),
      openPO: 0,
      inTransit: 0,
      supplier: 0,
    },
  );
  // Demand is a fixed CBU-level target, not additive across plants/clusters —
  // summing per-row demand would multiply it by the number of matching rows.
  return {
    ...summed,
    total: Math.max(0, ...metrics.map((m) => m.total)),
    demand: metrics[0]?.demand ?? 0,
  };
}

export function getClusterLabels(plants: string[]): string[] {
  const set = new Set<string>();
  for (const plant of plants) {
    set.add(PLANT_CLUSTER_MAP[plant] ?? plant);
  }
  return CLUSTER_ORDER.filter((cluster) => set.has(cluster));
}

export function getPlantsForCluster(
  cluster: string,
  plants: string[],
): string[] {
  return plants.filter(
    (plant) => (PLANT_CLUSTER_MAP[plant] ?? plant) === cluster,
  );
}

export function aggregateClusterMetrics(
  cluster: string,
  compCode: string,
  plantRows: PlantComponentRow[],
  uom: UomFilter,
  demand12M: number,
): StockMetrics {
  const matching = plantRows.filter(
    (pr) =>
      pr.componentCode === compCode &&
      (PLANT_CLUSTER_MAP[pr.plantco] ?? pr.plantco) === cluster,
  );
  return aggregateMetrics(
    matching.map((pr) => getPlantStockMetrics(pr, uom, demand12M)),
  );
}

export function getPlantMetricsGetter(
  plantRows: PlantComponentRow[],
  uom: UomFilter,
  demand12M: number,
) {
  return (plant: string, compCode: string) =>
    getPlantStockMetrics(
      plantRows.find((r) => r.plantco === plant && r.componentCode === compCode),
      uom,
      demand12M,
    );
}

export function getRowMetricsGetter(
  isPlantView: boolean,
  plantRows: PlantComponentRow[],
  uom: UomFilter,
  demand12M: number,
) {
  if (isPlantView) return getPlantMetricsGetter(plantRows, uom, demand12M);
  return (cluster: string, compCode: string) =>
    aggregateClusterMetrics(cluster, compCode, plantRows, uom, demand12M);
}

export function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleString("en", { month: "short", year: "numeric" });
}

/** No per-plant production-plan quantity exists in the data model yet, so
 * this derives a stable, plausible-looking figure from the CBU's own 12-month
 * demand — seeded by plant code + srNo so it's deterministic across renders
 * but varies per plant, same convention as the other synthetic generators in
 * data.ts (e.g. buildInTransitRows). */
export function getPlantProductionPlan(
  plantCode: string,
  srNo: number,
  demand12M: number,
): number {
  if (demand12M <= 0) return 0;
  const charSum = Array.from(plantCode).reduce(
    (sum, ch) => sum + ch.charCodeAt(0),
    0,
  );
  const seed = (srNo * 9301 + charSum * 49297) % 233280;
  const fraction = 0.05 + (seed / 233280) * 0.06;
  return Math.round(demand12M * fraction);
}
