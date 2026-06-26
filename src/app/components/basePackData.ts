import type { CBURow } from "./data";
import {
  getRowBasePackCode,
  getRowBasePackDescription,
  getAggregatedComponents,
  getRowFgMaterial,
} from "./data";

export interface BasePackRow {
  srNo: number;
  cbuCode: string;
  basePackCode: string;
  basePackDescription: string;
  smallC: string;
  bg: string;
  format: string;
  // FG Stock across all locations (EA)
  fgStock: number;
  fgIntransitPlantDc: number;
  fgIntransitDcDc: number;
  fgAllStock: number;
  // FG equivalent RMPM stock (Max)
  fgEqPmStock: number;
  fgEqRmStock: number;
  fgEqIutStock: number;
  fgEqStock: number;
  fgEqStockMax: number;
  // Demand
  forecast: number;
  netForecast: number;
  totalForecast: number;
  // Total FG
  fgEquiIutTotal: number;
  // Cover (Production End Date)
  coverFgStock: string;
  coverFgEqui: string;
  coverFgEquiIut: string;
}

function inferFormatFromDescription(description: string): string {
  const mlMatch = description.match(/(\d+)\s*ML/i);
  const ml = mlMatch ? parseInt(mlMatch[1], 10) : 200;
  if (ml <= 100) return "SKIN BOTTLES (SMALL)";
  if (ml <= 300) return "SKIN BOTTLES (MED)";
  return "SKIN BOTTLES (LARGE)";
}

function formatCover(value: string, noDemand: boolean, noStock: boolean): string {
  if (noStock && (value === "N/A" || value === "—")) {
    return "No stock available";
  }
  if (noDemand && (value === "N/A" || value === "—")) {
    return "No demand data available";
  }
  if (value === "N/A" || value === "—") return "Surplus";
  return value;
}

function splitFgIntransit(total: number): [number, number] {
  const plantDc = Math.round(total * 0.55);
  return [plantDc, total - plantDc];
}

function computeRmpmSplit(row: CBURow): {
  pm: number;
  rm: number;
  total: number;
  max: number;
} {
  const comps = getAggregatedComponents(
    row.cbuCode,
    getRowFgMaterial(row),
  );
  let pm = 0;
  let rm = 0;
  for (const c of comps) {
    const eq = c.unrestrictedStock + c.openPOStock;
    if (c.componentMaterialType === "1003") pm += eq;
    else rm += eq;
  }
  const total = row.rmpm.physicalStock + row.rmpm.openPOStock;
  const max = Math.max(total, pm + rm);
  return { pm, rm, total, max };
}

export function cbuToBasePackRow(row: CBURow): BasePackRow {
  const basePackDescription = getRowBasePackDescription(row);
  const [plantDc, dcDc] = splitFgIntransit(row.fg.inTransitStock);
  const rmpm = computeRmpmSplit(row);
  const noDemand = row.demand.next12Months <= 0;
  const noStock = row.fg.totalStock <= 0 && row.rmpm.totalStock <= 0;
  const netForecast = row.totalFG - row.demand.next12Months;

  return {
    srNo: row.srNo,
    cbuCode: row.cbuCode,
    basePackCode: getRowBasePackCode(row),
    basePackDescription,
    smallC: "SKIN",
    bg: "B&W",
    format: inferFormatFromDescription(basePackDescription),
    fgStock: row.fg.dcStock + row.fg.factoryStock,
    fgIntransitPlantDc: plantDc,
    fgIntransitDcDc: dcDc,
    fgAllStock: row.fg.totalStock,
    fgEqPmStock: rmpm.pm,
    fgEqRmStock: rmpm.rm,
    fgEqIutStock: 0,
    fgEqStock: rmpm.total,
    fgEqStockMax: rmpm.max,
    forecast: row.demand.next6Months,
    netForecast,
    totalForecast: row.demand.next12Months,
    fgEquiIutTotal: row.totalFG,
    coverFgStock: formatCover(row.cover.fgCoverDate, noDemand, noStock),
    coverFgEqui: formatCover(row.cover.coverExclOpenPO, noDemand, noStock),
    coverFgEquiIut: formatCover(row.cover.totalCoverDate, noDemand, noStock),
  };
}

export function buildBasePackRows(rows: CBURow[]): BasePackRow[] {
  return rows.map(cbuToBasePackRow);
}

export type BasePackSortCol =
  | "srNo"
  | "basePackCode"
  | "basePackDescription"
  | "smallC"
  | "bg"
  | "format"
  | "fgStock"
  | "fgIntransitPlantDc"
  | "fgIntransitDcDc"
  | "fgAllStock"
  | "fgEqPmStock"
  | "fgEqRmStock"
  | "fgEqIutStock"
  | "fgEqStock"
  | "fgEqStockMax"
  | "forecast"
  | "netForecast"
  | "totalForecast"
  | "fgEquiIutTotal"
  | "coverFgStock"
  | "coverFgEqui"
  | "coverFgEquiIut";

export function getBasePackSortValue(
  row: BasePackRow,
  col: BasePackSortCol,
): string | number {
  if (
    col === "coverFgStock" ||
    col === "coverFgEqui" ||
    col === "coverFgEquiIut"
  ) {
    return row[col];
  }
  return row[col as keyof BasePackRow] as string | number;
}
