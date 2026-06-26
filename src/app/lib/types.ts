export type FG = { code: string; description: string };

export type FGPORow = {
  plant: string;
  component: string;
  uom: string;
  openPoQty: number;
  key: string;
};

export type ComponentSummary = {
  component: string;
  componentType: string;
  typeLabel: string;
  isRMorPM: boolean;
  conversionFactor: number;
  totalStock: number;
  openPoQty: number;
  unitPrice: number;
  fgUnitsFromStock: number;
  fgUnitsFromStockAndPO: number;
};

export type DailyPlanPoint = {
  date: string;
  daily: number;
  cumulative: number;
  isWeekly: boolean;
};

export type ScenarioKey = "stockOnly" | "stockPlusPO" | "fullPlan" | "moq" | "iut";

export type StrandedWasteRow = {
  plant: string;
  component: string;
  componentType: string;
  strandedQty: number;
  unitPrice: number;
  strandedValue: number;
};

export type ComponentBreakdownRow = {
  component: string;
  componentType: string;
  typeLabel: string;
  uomLabel: string;
  convFactor: number;
  onHandStock: number;
  openPo: number;
  unitPrice: number;
  fgUnits: number;
  consumed: number;
  leftover: number;
  leftoverValue: number;
  isBottleneck: boolean;
};

export type PlantComponentBreakdownRow = {
  plant: string;
  component: string;
  componentType: string;
  typeLabel: string;
  uomLabel: string;
  convFactor: number;
  onHandStock: number;
  openPo: number;
  unitPrice: number;
  fgUnits: number;
  consumed: number;
  leftover: number;
  leftoverValue: number;
  isProducing: boolean;
  isBottleneck: boolean;
  productionPlanQty: number;
  plantProducible: number;
  productionStopDate: string | null;
  transferDelta?: number;
  moqQtyOrdered?: number | null;
  moqNotApplicable?: boolean;
  moqNotOrdered?: boolean;
};

export type IutTransfer = {
  component: string;
  typeLabel: string;
  fromPlant: string;
  toPlant: string;
  qty: number;
  unitPrice: number;
  value: number;
  isPartial: boolean;
};

export type IutOption = {
  id: string;
  label: string;
  recommended: boolean;
  transfers: IutTransfer[];
  resultingWaste: number;
  wasteSaved: number;
  feasibleProduced: number;
  productionStopDate: string | null;
  plantComponentRows: PlantComponentBreakdownRow[];
};

export type ScenarioResult = {
  key: ScenarioKey;
  label: string;
  blurb: string;
  producibleCeiling: number;
  bottleneckComponent: string | null;
  delistDate: string | null;
  cumulativeAtDelist: number;
  feasibleProduced: number;
  leftoverByComponent: Array<{
    component: string;
    componentType: string;
    leftoverQty: number;
    unitPrice: number;
    leftoverValue: number;
  }>;
  totalLeftoverValue: number;
  planExceedsCeiling: boolean;
  totalPlannedUnits: number;
  additionalByComponent: Array<{
    component: string;
    componentType: string;
    additionalQty: number;
    unitPrice: number;
    additionalValue: number;
  }>;
  totalAdditionalValue: number;
  strandedWaste?: StrandedWasteRow[];
  componentRows?: ComponentBreakdownRow[];
};

export type EvaluateResult = {
  cumulative: number;
  feasibleProduced: number;
  ceiling: number;
  fulfilmentPct: number;
  unitsNotProduced: number;
  leftoverByComponent: ScenarioResult["leftoverByComponent"];
  totalLeftoverValue: number;
  leftoverByPlant: Array<{
    plant: string;
    strandedUnits: number;
    isBottleneck: boolean;
  }>;
  additionalByComponent: Array<{
    component: string;
    componentType: string;
    additionalQty: number;
    unitPrice: number;
    additionalValue: number;
  }>;
  totalAdditionalValue: number;
  componentRows?: ComponentBreakdownRow[];
  plantComponentRows?: PlantComponentBreakdownRow[];
  positions: Array<{
    component: string;
    componentType: string;
    available: number;
    requiredForPlan: number;
    balance: number;
    unitPrice: number;
    balanceValue: number;
  }>;
};

export type PlantWeeklyPoint = {
  date: string;
  qty: number;
  cumulative: number;
};

export type PlantRmpmDetail = {
  component: string;
  componentType: string;
  totalStock: number;
  conversionFactor: number;
  fgUnitsFromStock: number;
  requiredForPlan: number;
  balance: number;
};

export type PlantBreakdownRow = {
  plant: string;
  producible: number;
  planned: number;
  surplus: number;
  bottleneckComponent: string | null;
  weeklyPlan: PlantWeeklyPoint[];
  rmpmDetail: PlantRmpmDetail[];
};

export type InventoryComponent = {
  component: string;
  componentType: string;
  unrestricted: number;
  quality: number;
  blocked: number;
  total: number;
  openPo: number;
};

export type TransitionRow = {
  code: string;
  description: string;
  bg: string | null;
  smallC: string | null;
  format: string | null;
  dcStock: number | null;
  factoryStock: number | null;
  inTransit: number | null;
  lateGrn: number | null;
  pureIntransit: number | null;
  totalFgStock: number | null;
  coverMonths: number | null;
  physicalStock: number;
  qualityStock: number;
  openPoStock: number;
  totalRmpmStock: number;
  blockedStock: number;
  next3tdp: number;
  next6m: number;
  next12m: number;
  totalDemand: number;
  fgCover: number | null;
  fgCoverDate: string | null;
  coverDate: string | null;
  coverDateExclPo: string | null;
};

export type SubsetStock = {
  physicalStock: number;
  qualityStock: number;
  openPoStock: number;
  totalRmpmStock: number;
  blockedStock: number;
  fgCoverDate: string | null;
  coverDate: string | null;
  coverDateExclPo: string | null;
};

export type TransitionResponse = {
  rows: TransitionRow[];
  total: number;
  inTransition: number;
};

export type CbuDetailSummary = {
  uniqueRmCount: number;
  uniquePmCount: number;
  total12mDemand: number;
  currentFgStock: number;
  peakDemandMonth: string | null;
  peakProductionPlant: string | null;
};

export type PlantComponentRow = {
  component: string;
  componentType: string;
  plant: string;
  totalStock: number;
  openPoQty: number;
  convFactor: number;
  qtyRequired: number;
  unitPrice: number;
  stockAvailable: number;
  status: "surplus" | "shortfall" | "none";
};

export type CbuStockCover = {
  dcStock: number;
  factoryStock: number;
  inTransit: number;
  totalFgStock: number;
  physicalRmpmStock: number;
  qualityRmpmStock: number;
  blockedRmpmStock: number;
  openPoStock: number;
  withPoRmpmStock: number;
  coverDateStockOnly: string | null;
  coverDateWithPo: string | null;
  total12mDemand: number;
  next3tdpDemand: number;
  next6mDemand: number;
};
