import type { CBURow, PlantComponentRow } from "../data";

export type UomFilter = "EA" | "MT" | "RMPM";
export type StockViewLevel = "plant" | "cluster";

export type OnHandBreakdown = {
  unrestricted: number;
  quality: number;
  stv: number;
  blocked: number;
  total: number;
};

export type StockMetrics = {
  onHand: number;
  onHandBreakdown: OnHandBreakdown;
  openPO: number;
  inTransit: number;
  supplier: number;
  total: number;
  demand: number;
};

export interface StockTableProps {
  row: CBURow;
  uom: UomFilter;
  rowHeader: string;
  rowHeaderSubtext?: string;
  rowLabels: string[];
  plantRows: PlantComponentRow[];
  uniqueComponents: string[];
  getMetrics: (rowLabel: string, compCode: string) => StockMetrics;
  getPlantMetrics?: (plant: string, compCode: string) => StockMetrics;
  expandedComponents: Set<string>;
  onToggleComponentExpanded: (compCode: string) => void;
  onPlantProductionClick: (plantCode: string) => void;
  clusterDrilldown?: boolean;
  allPlants?: string[];
  expandedCluster?: string | null;
  onClusterClick?: (cluster: string) => void;
  hiddenCols: Set<string>;
}
