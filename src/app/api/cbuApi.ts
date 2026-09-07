import {
  cbuData,
  demandData,
  getAggregatedComponents,
  getComponentsByPlant,
  getDcStockBreakdown,
  getFactoryStockBreakdown,
  getInTransitBreakdown,
  getHighContributingComponents,
  getRowFgMaterial,
  type AggregatedComponent,
  type CBURow,
  type DcStockRow,
  type DemandRow,
  type PlantComponentRow,
} from "../components/data";

const SIMULATED_LATENCY_MS = 300;

function delay<T>(value: T, ms = SIMULATED_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** GET /api/cbus */
export async function fetchCbuList(): Promise<CBURow[]> {
  return delay(cbuData);
}

/** GET /api/cbus/:srNo */
export async function fetchCbuBySrNo(srNo: number): Promise<CBURow | null> {
  const row = cbuData.find((r) => r.srNo === srNo) ?? null;
  return delay(row);
}

export interface ComponentBreakdown {
  components: AggregatedComponent[];
  highContributing: AggregatedComponent[];
}

/** GET /api/cbus/components — batched component breakdown for the given CBU rows */
export async function fetchComponentBreakdowns(
  rows: CBURow[],
): Promise<Record<number, ComponentBreakdown>> {
  const result: Record<number, ComponentBreakdown> = {};
  for (const row of rows) {
    result[row.srNo] = {
      components: getAggregatedComponents(row.cbuCode, getRowFgMaterial(row)),
      highContributing: getHighContributingComponents(row.cbuCode),
    };
  }
  return delay(result);
}

/** GET /api/cbus/:cbuCode/demand */
export async function fetchDemandData(
  cbuCode: string,
): Promise<DemandRow | null> {
  const row = demandData.find((d) => d.cbu === cbuCode) ?? null;
  return delay(row);
}

/** GET /api/cbus/:srNo/stock-breakdown?kind=dc|factory|transit */
export async function fetchStockBreakdown(
  kind: "dc" | "factory" | "transit",
  row: CBURow,
): Promise<DcStockRow[]> {
  const rows =
    kind === "dc"
      ? getDcStockBreakdown(row)
      : kind === "factory"
        ? getFactoryStockBreakdown(row)
        : getInTransitBreakdown(row);
  return delay(rows);
}

/** GET /api/cbus/:srNo/plant-components */
export async function fetchPlantComponents(
  row: CBURow,
): Promise<{ plants: string[]; rows: PlantComponentRow[] }> {
  const result = getComponentsByPlant(
    row.cbuCode,
    row.demand.next12Months,
    getRowFgMaterial(row),
  );
  return delay(result);
}
