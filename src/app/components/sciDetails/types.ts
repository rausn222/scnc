import type { CBURow } from "../data";
import type { TRANSFER_SCENARIO_CONFIG } from "./constants";

export interface Props {
  row: CBURow | null;
}

export type ScenarioRow = {
  id: string;
  name: string;
  businessWaste: string | null;
  wasteSavings?: string | null;
  wasteColor?: "orange" | "teal";
  fgDaysCover: string | null;
  isBest: boolean;
  comingSoon?: boolean;
  disabled?: boolean;
  nextActionPrefix: string;
  nextAction: string;
  icon: "no-action" | "iut" | "iut-moq" | "moq" | "break" | "custom";
  feasibleProducible: number;
  productionStopDate: string;
  dailyRunRate: number;
};

export type CompBreakdownRow = {
  plant: string;
  productionPlan: string;
  componentCode: string;
  description: string;
  type: "RM" | "PM";
  onHandStock: string;
  openPO: string;
  supplierStock: string;
  unitPrice: string;
};

export type CustomOverrideRow = {
  id: string;
  plantId: string;
  type: string;
  componentCode: string;
  description: string;
  onHandStock: string;
  openPOQty: string;
  supplierStock: string;
  supplierFeedStock?: string;
  inTransitStock?: string;
  stvStock?: string;
  conversionFactor: string;
};

export type PlantGroup = {
  id: string;
  name: string;
};

export type IUTOption = {
  id: string;
  label: string;
  isBest: boolean;
  routeFrom: string;
  routeTo: string;
  material: string;
  transferQty: number;
  businessWasteBefore: number;
  businessWasteAfter: number;
  reductionVsNoAction: number;
  laneAvailable: boolean | null;
  costPerTrip: number;
  transferLeadTime: string;
  initiationDate: string;
  prodStopSource: string;
  prodStopDest: string;
};

export type TransferScenarioId = keyof typeof TRANSFER_SCENARIO_CONFIG;

export type MOQSupplierData = {
  id: string;
  name: string;
  moq: number;
  pricePerUnit: number;
  bizWaste: number;
  productionDate: string;
};

export type MOQPlantOption = {
  id: string;
  plant: string;
  isBest: boolean;
  material: string;
  orderQty: number;
  moqBroken?: number | null;
  totalPrice?: number | null;
  suppliers: MOQSupplierData[];
};

export type OnHandBreakdown = {
  unrestricted: string;
  quality: string;
  stv: string;
  blocked: string;
  total: string;
};

export type ComponentBreakdownRow = {
  component: string;
  description: string;
  type: "PM" | "RM";
  conversionFactor: string;
  isBottleneck?: boolean;
  onHandStock: string;
  onHandBreakdown: OnHandBreakdown;
  openPoQty: string;
  uom: string;
  fgEquivalentStock: string;
  fgUnitsProducible: string;
  fgUom: string;
  consumed: string;
  leftoverQty: string;
  leftoverValue: string;
  prodStopDate: string;
  highlightLeftover?: boolean;
};

export type TransitionState = "before" | "after" | "final";

export type PlantRole = "source" | "destination" | "ordering";

export type MoqBreakMaterial = {
  type: "RM" | "PM";
  code: string;
  description: string;
  badgeBg: string;
  badgeColor: string;
  sharedCbus?: string[];
};

export type MoqBreakSupplier = {
  name: string;
  /** Number of times this supplier has broken MOQ in the last 12 months. */
  moqBreakOccurrences12mo: number;
  /** MOQ this supplier holds this material to, in the material's base UOM. */
  moqAgainstSupplier: number;
  /** Lowest MOQ actually accepted from this supplier in the last 12 months. */
  minMoqLast12mo: number;
};

export type IutLaneMaterialReq = {
  type: "RM" | "PM";
  code: string;
  description: string;
  requiredQty: number;
  uom: string;
};

export type OpenPoAssumptionLine = {
  id: string;
  plantCode: string;
  plantName: string;
  siteCluster: string;
  componentCode: string;
  description: string;
  date: string; // "dd-mm-yyyy" — material delivery date, as per PO (SAP); read-only
  /** "dd-mm-yyyy" — latest status, editable by the planner independent of the PO-sourced date. */
  eta: string;
  vendorName: string;
  poNumber: string;
  qty: number;
  uom: string;
  poCreationDate: string; // "dd-mm-yyyy"
  averageLeadTimeDays: number;
};

export type FeedStockStatus = "unique" | "shared" | "needed";
