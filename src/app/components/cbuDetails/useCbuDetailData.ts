import { useMemo } from "react";
import {
  useCbuDetailQuery,
  useComponentBreakdownsQuery,
  useDemandQuery,
  usePlantComponentsQuery,
} from "../../queries/cbuQueries";
import {
  demandMonths,
  type AggregatedComponent,
  type CBURow,
  type DemandRow,
  type PlantComponentRow,
} from "../data";
import { getClusterLabels, getPlantProductionPlan } from "./utils";

export interface CbuDetailData {
  row: CBURow | null | undefined;
  isLoading: boolean;
  isError: boolean;
  demand: DemandRow | null | undefined;
  peakMonth: string | null;
  components: AggregatedComponent[];
  highContribComps: AggregatedComponent[];
  uniqueRM: number;
  uniquePM: number;
  plants: string[];
  clusters: string[];
  plantRows: PlantComponentRow[];
  peakPlant: string;
  uniqueComponents: string[];
  fgTotal: number;
  demand12: number;
}

function findPeakMonth(demand: DemandRow | null | undefined): string | null {
  if (!demand) return null;
  return demandMonths.reduce(
    (best, m) => ((demand.monthly[m] ?? 0) > (demand.monthly[best] ?? 0) ? m : best),
    demandMonths[0],
  );
}

/** "Peak Production Plant" means the plant with the largest share of the
 * CBU's 12-month production plan — the same per-plant figure the RM/PM
 * table's "Production plan" column shows — not the plant holding the most
 * on-hand stock, which is a different (and often contradictory) signal. */
function findPeakPlant(plants: string[], srNo: number, demand12M: number): string {
  const totals = plants.map((plant) => [
    plant,
    getPlantProductionPlan(plant, srNo, demand12M),
  ] as const);
  return totals.sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
}

function countUniqueMaterialType(
  components: AggregatedComponent[],
  materialType: string,
): number {
  return new Set(
    components
      .filter((c) => c.componentMaterialType === materialType)
      .map((c) => c.componentCode),
  ).size;
}

/** Fetches a CBU row plus every piece of derived data its detail page needs
 * (demand, component/plant breakdowns, peak month/plant), keeping that
 * data-assembly logic out of the page component itself. */
export function useCbuDetailData(srNo: number): CbuDetailData {
  const { data: row, isLoading: isRowLoading, isError: isRowError } = useCbuDetailQuery(srNo);
  const { data: demand, isLoading: isDemandLoading, isError: isDemandError } = useDemandQuery(row?.cbuCode);
  const breakdownRows = useMemo(() => (row ? [row] : []), [row]);
  const { data: breakdowns, isLoading: isBreakdownsLoading, isError: isBreakdownsError } = useComponentBreakdownsQuery(breakdownRows);
  const { data: plantData, isLoading: isPlantLoading, isError: isPlantError } = usePlantComponentsQuery(row);

  const isLoading =
    isRowLoading || (row != null && (isDemandLoading || isBreakdownsLoading || isPlantLoading));
  const isError =
    isRowError || (row != null && (isDemandError || isBreakdownsError || isPlantError));

  const components = row ? breakdowns?.[row.srNo]?.components ?? [] : [];
  const highContribComps = row ? breakdowns?.[row.srNo]?.highContributing ?? [] : [];
  const { plants, rows: plantRows } = plantData ?? { plants: [], rows: [] };

  return {
    row,
    isLoading,
    isError,
    demand,
    peakMonth: findPeakMonth(demand),
    components,
    highContribComps,
    uniqueRM: countUniqueMaterialType(components, "1002"),
    uniquePM: countUniqueMaterialType(components, "1003"),
    plants,
    clusters: getClusterLabels(plants),
    plantRows,
    peakPlant: findPeakPlant(plants, row?.srNo ?? 0, row?.demand.next12Months ?? 0),
    uniqueComponents: [...new Set(plantRows.map((r) => r.componentCode))],
    fgTotal: row?.fg.totalStock ?? 0,
    demand12: row?.demand.next12Months ?? 0,
  };
}
