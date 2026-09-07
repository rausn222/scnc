import { getComponentDescriptionByCode } from "../data";
import type {
  ScenarioRow,
  CompBreakdownRow,
  IUTOption,
  MOQPlantOption,
  ComponentBreakdownRow,
  MoqBreakMaterial,
  MoqBreakSupplier,
  IutLaneMaterialReq,
} from "./types";

export const C = {
  navy: "#003087",
  blue: "#1565C0",
  teal: "#00695C",
  green: "#16a34a",
  bgBlue: "#EFF4FB",
  borderBlue: "#93c5fd",
};

export const SCENARIOS: ScenarioRow[] = [
  {
    id: "no-action",
    name: "No Action",
    businessWaste: "₹5,541",
    wasteColor: "orange",
    fgDaysCover: "23d",
    isBest: false,
    nextActionPrefix: "NEXT ACTION",
    nextAction: "Stop Production",
    icon: "no-action",
    feasibleProducible: 55200,
    productionStopDate: "29 May 2026",
    dailyRunRate: 3865,
  },
  {
    id: "iut",
    name: "IUT",
    businessWaste: "₹2,852",
    wasteSavings: "₹2,689",
    wasteColor: "orange",
    fgDaysCover: "25d",
    isBest: false,
    nextActionPrefix: "",
    nextAction: "Raise STO",
    icon: "iut",
    // 55,200 base + 12,589 PM transferred from UTR
    feasibleProducible: 67789,
    productionStopDate: "19 Jun 2026",
    dailyRunRate: 3865,
  },
  {
    id: "iut-moq",
    name: "IUT + Procurement",
    businessWaste: "₹2,695",
    wasteSavings: "₹2,846",
    wasteColor: "teal",
    fgDaysCover: "25d",
    isBest: true,
    nextActionPrefix: "NEXT ACTION",
    nextAction: "Raise STO + PO",
    icon: "iut-moq",
    // IUT (67,789) + MOQ procurement top-up
    feasibleProducible: 70214,
    productionStopDate: "22 Jun 2026",
    dailyRunRate: 3865,
  },
  {
    id: "moq",
    name: "Procurement",
    businessWaste: "₹5,385",
    wasteSavings: "₹156",
    wasteColor: "orange",
    fgDaysCover: "23d",
    isBest: false,
    nextActionPrefix: "NEXT ACTION",
    nextAction: "Raise PO",
    icon: "moq",
    // 55,200 base + small slot addition
    feasibleProducible: 56840,
    productionStopDate: "04 Jun 2026",
    dailyRunRate: 3865,
  },
  {
    id: "iut-moq-break",
    name: "IUT + Procurement (Break MOQ)",
    businessWaste: "₹2,412",
    wasteSavings: "₹3,129",
    wasteColor: "teal",
    fgDaysCover: "26d",
    isBest: false,
    nextActionPrefix: "NEXT ACTION",
    nextAction: "Raise STO + PO (break MOQ)",
    icon: "break",
    // IUT (67,789) + break-MOQ smaller lot adds more coverage
    feasibleProducible: 74356,
    productionStopDate: "28 Jun 2026",
    dailyRunRate: 3865,
  },
];

export const CUSTOM_SCENARIO: ScenarioRow = {
  id: "custom",
  name: "Custom",
  businessWaste: null,
  fgDaysCover: null,
  isBest: false,
  nextActionPrefix: "",
  nextAction: "—",
  icon: "custom",
  feasibleProducible: 0,
  productionStopDate: "—",
  dailyRunRate: 0,
};

export const COMP_BREAKDOWN_ROWS: CompBreakdownRow[] = [
  {
    plant: "U535",
    productionPlan: "4,44,444 EA",
    componentCode: "65428959",
    description: getComponentDescriptionByCode("65428959"),
    type: "PM",
    onHandStock: "55,200",
    openPO: "—",
    supplierStock: "2,000",
    unitPrice: "₹0.50",
  },
  {
    plant: "U535",
    productionPlan: "4,44,444 EA",
    componentCode: "65284824",
    description: getComponentDescriptionByCode("65284824"),
    type: "RM",
    onHandStock: "1,00,000",
    openPO: "1,500",
    supplierStock: "8,000",
    unitPrice: "₹15.00",
  },
  {
    plant: "UTR",
    productionPlan: "1,11,111 EA",
    componentCode: "65428959",
    description: getComponentDescriptionByCode("65428959"),
    type: "PM",
    onHandStock: "11,700",
    openPO: "1,12,000",
    supplierStock: "3,000",
    unitPrice: "₹0.06",
  },
  {
    plant: "UTR",
    productionPlan: "1,11,111 EA",
    componentCode: "65284824",
    description: getComponentDescriptionByCode("65284824"),
    type: "RM",
    onHandStock: "140",
    openPO: "1,000",
    supplierStock: "5,000",
    unitPrice: "₹15.00",
  },
];

export const SCENARIO_COMP_VALUES: Record<
  string,
  Record<string, { producible: string; leftoverQty: string; leftoverVal: string }>
> = {
  "no-action": {
    "65428959": { producible: "55,200", leftoverQty: "Nil", leftoverVal: "Nil" },
    "65284824": { producible: "55,200", leftoverQty: "1,025", leftoverVal: "₹15,375" },
  },
  iut: {
    "65428959": { producible: "67,789", leftoverQty: "Nil", leftoverVal: "Nil" },
    "65284824": { producible: "67,789", leftoverQty: "184", leftoverVal: "₹2,756" },
  },
  "iut-moq": {
    "65428959": { producible: "70,214", leftoverQty: "Nil", leftoverVal: "Nil" },
    "65284824": { producible: "70,214", leftoverQty: "173", leftoverVal: "₹2,600" },
  },
  moq: {
    "65428959": { producible: "56,840", leftoverQty: "Nil", leftoverVal: "Nil" },
    "65284824": { producible: "56,840", leftoverQty: "315", leftoverVal: "₹4,723" },
  },
  "iut-moq-break": {
    "65428959": { producible: "74,356", leftoverQty: "Nil", leftoverVal: "Nil" },
    "65284824": { producible: "74,356", leftoverQty: "100", leftoverVal: "₹1,500" },
  },
};

export const SITE_PRODUCTION_STOP_DATES: Record<string, Record<string, string>> = {
  "no-action": { U535: "29 May 2026" },
  iut: { UTR: "25 May 2026", U535: "19 Jun 2026" },
  "iut-moq": { UTR: "25 May 2026", U535: "22 Jun 2026" },
  moq: { U535: "04 Jun 2026" },
  "iut-moq-break": { UTR: "25 May 2026", U535: "28 Jun 2026" },
};

export const MONTH_INDEX: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

export const MONTH_NAMES = Object.keys(MONTH_INDEX);

export const TRANSFER_OPTION_BASE = {
  componentType: "PM" as const,
  componentCode: "64330490",
  componentDescription: getComponentDescriptionByCode("64330490"),
  transferQty: 1510,
  transferValue: 1,
  isFullTransfer: true,
  productionPlant: "U535",
  productionBeforeEa: 53412,
  productionAfterEa: 54922,
  wasteBefore: 6036,
  wasteAfter: 5406,
  saved: 630,
};

export const TRANSFER_SCENARIO_CONFIG = {
  iut: {
    routeFrom: "UTR",
    routeTo: "U535",
    wasteBeforeLabel: "Before IUT",
    wasteAfterLabel: "After IUT",
  },
  moq: {
    routeFrom: "PO",
    routeTo: "Apex Packaging Ltd",
    wasteBeforeLabel: "Before MOQ",
    wasteAfterLabel: "After MOQ",
  },
} as const;

export const IUT_TRANSFER_OPTIONS: IUTOption[] = [
  {
    id: "opt1",
    label: "Option 1",
    isBest: true,
    routeFrom: "UTR",
    routeTo: "U535",
    material: "RM 10045872",
    transferQty: 12589,
    businessWasteBefore: 5541,
    businessWasteAfter: 2852,
    reductionVsNoAction: 2689,
    laneAvailable: true,
    costPerTrip: 300,
    transferLeadTime: "3 days",
    initiationDate: "22 May 2026",
    prodStopSource: "25 May 2026",
    prodStopDest: "19 Jun 2026",
  },
  {
    id: "opt2",
    label: "Option 2",
    isBest: false,
    routeFrom: "U535",
    routeTo: "UTR",
    material: "PM 20018734",
    transferQty: 12589,
    businessWasteBefore: 5541,
    businessWasteAfter: 3104,
    reductionVsNoAction: 2437,
    laneAvailable: true,
    costPerTrip: 300,
    transferLeadTime: "2 days",
    initiationDate: "27 May 2026",
    prodStopSource: "29 May 2026",
    prodStopDest: "15 Jun 2026",
  },
  {
    id: "opt3",
    label: "Option 3",
    isBest: false,
    routeFrom: "UTR",
    routeTo: "U535",
    material: "PM 30098721",
    transferQty: 8200,
    businessWasteBefore: 5541,
    businessWasteAfter: 3890,
    reductionVsNoAction: 1651,
    laneAvailable: null,
    costPerTrip: 450,
    transferLeadTime: "4 days",
    initiationDate: "18 May 2026",
    prodStopSource: "22 May 2026",
    prodStopDest: "12 Jun 2026",
  },
];

export const MOQ_PLANT_OPTIONS: MOQPlantOption[] = [
  {
    id: "p_u535",
    plant: "U535",
    isBest: true,
    material: "PM 64330490",
    orderQty: 15000,
    suppliers: [
      { id: "sup_reliance", name: "Reliance Ind.", moq: 5000, pricePerUnit: 42, bizWaste: 3200, productionDate: "19 Jun 2026" },
      { id: "sup_tata", name: "Tata Chemicals", moq: 3000, pricePerUnit: 38, bizWaste: 3800, productionDate: "22 Jun 2026" },
    ],
  },
  {
    id: "p_utr",
    plant: "UTR",
    isBest: false,
    material: "RM 10045872",
    orderQty: 10000,
    suppliers: [
      { id: "sup_basf", name: "BASF India", moq: 4000, pricePerUnit: 45, bizWaste: 4100, productionDate: "15 Jun 2026" },
      { id: "sup_evonik", name: "Evonik India", moq: 2000, pricePerUnit: 50, bizWaste: 4500, productionDate: "18 Jun 2026" },
    ],
  },
  {
    id: "p_u635_pm",
    plant: "U635",
    isBest: false,
    material: "PM 64330490",
    orderQty: 12000,
    suppliers: [
      { id: "sup_croda", name: "Croda Int'l", moq: 2500, pricePerUnit: 48, bizWaste: 3760, productionDate: "21 Jun 2026" },
      { id: "sup_reliance_utr", name: "Reliance Ind.", moq: 5000, pricePerUnit: 42, bizWaste: 4180, productionDate: "23 Jun 2026" },
    ],
  },
  {
    id: "p_u886_rm",
    plant: "U886",
    isBest: false,
    material: "RM 10045872",
    orderQty: 22000,
    suppliers: [
      { id: "sup_evonik_u535", name: "Evonik India", moq: 2000, pricePerUnit: 50, bizWaste: 4020, productionDate: "18 Jun 2026" },
      { id: "sup_basf_u535", name: "BASF India", moq: 4000, pricePerUnit: 45, bizWaste: 3890, productionDate: "17 Jun 2026" },
    ],
  },
];

export const MOQ_PLANT_OPTIONS_BREAK: MOQPlantOption[] = [
  {
    id: "brk_u535",
    plant: "U535",
    isBest: true,
    material: "PM 64330490",
    orderQty: 2400,
    moqBroken: 2500,
    totalPrice: 100000,
    suppliers: [
      { id: "brk_sup_reliance", name: "Reliance Ind.", moq: 5000, pricePerUnit: 40, bizWaste: 2412, productionDate: "26 Jun 2026" },
      { id: "brk_sup_tata", name: "Tata Chemicals", moq: 3000, pricePerUnit: 36, bizWaste: 2680, productionDate: "28 Jun 2026" },
    ],
  },
  {
    id: "brk_utr",
    plant: "UTR",
    isBest: false,
    material: "RM 10045872",
    orderQty: 10000,
    moqBroken: null,
    suppliers: [
      { id: "brk_sup_basf", name: "BASF India", moq: 4000, pricePerUnit: 43, bizWaste: 2870, productionDate: "24 Jun 2026" },
      { id: "brk_sup_evonik", name: "Evonik India", moq: 2000, pricePerUnit: 48, bizWaste: 3040, productionDate: "27 Jun 2026" },
    ],
  },
];

export const ON_HAND_EXPAND_COLUMNS = [
  "Unrestricted Stock",
  "Stock in Quality",
  "STV stock",
  "Blocked Stock",
  "Total Stock",
] as const;

export const BREAKDOWN_TAIL_COLUMNS = [
  "UOM",
  "FG equivalent stock",
  "FG units producible",
  "FG UOM",
  "Consumed",
  "Leftover qty",
  "Leftover value (₹)",
  "Prod. stop date",
] as const;

export const EXPANDED_ONHAND_HEADER_BG = "#dbeafe";

export const EXPANDED_BREAKDOWN_HEADER_BG = "#eff6ff";

export const EXPANDED_ONHAND_CELL_BG = "#f0f9ff";

export const EXPANDED_BREAKDOWN_CELL_BG = "#f8fafc";

export const EXPANDED_GROUP_BORDER = "1px solid #93c5fd";

export const NO_ACTION_PLANT = {
  code: "U535",
  totalProductionPlan: "2,35,294 EA",
  totalProductionPlanQty: 235294,
  prodStopDate: "29 May 2026",
  plantCount: 4,
  componentCount: 2,
  rows: [
    {
      component: "65428959",
      description: "85ml Bottle Cap & Shrink Sleeve PM",
      type: "PM" as const,
      conversionFactor: "1",
      isBottleneck: true,
      onHandStock: "55,200",
      onHandBreakdown: {
        unrestricted: "52,000",
        quality: "2,000",
        stv: "800",
        blocked: "400",
        total: "55,200",
      },
      openPoQty: "—",
      uom: "EA",
      fgEquivalentStock: "55,200",
      fgUnitsProducible: "55,200",
      fgUom: "EA",
      consumed: "55,200",
      leftoverQty: "Nil",
      leftoverValue: "Nil",
      prodStopDate: "29 May 2026",
    },
    {
      component: "65284824",
      description: "Mineral Oil Base — BP Grade RM",
      type: "RM" as const,
      conversionFactor: "0.0104",
      onHandStock: "100",
      onHandBreakdown: {
        unrestricted: "85",
        quality: "10",
        stv: "3",
        blocked: "2",
        total: "100",
      },
      openPoQty: "1,500",
      uom: "Tonnes",
      fgEquivalentStock: "1,44,231",
      fgUnitsProducible: "1,44,231",
      fgUom: "EA",
      consumed: "1,43,206",
      leftoverQty: "1,025",
      leftoverValue: "₹15,375",
      prodStopDate: "29 May 2026",
      highlightLeftover: true,
    },
  ] satisfies ComponentBreakdownRow[],
};

export const TRANSITIONING_COMPONENT_CODE = "65428959";

export const UTR_PLANT_BASE = {
  code: "UTR",
  totalProductionPlan: "58,900 EA",
  totalProductionPlanQty: 58900,
  prodStopDate: "10 Jul 2026",
  rows: [
    {
      component: "65428959",
      description: "85ml Bottle Cap & Shrink Sleeve PM",
      type: "PM" as const,
      conversionFactor: "1",
      onHandStock: "72,000",
      onHandBreakdown: {
        unrestricted: "68,000",
        quality: "2,500",
        stv: "1,000",
        blocked: "500",
        total: "72,000",
      },
      openPoQty: "—",
      uom: "EA",
      fgEquivalentStock: "72,000",
      fgUnitsProducible: "72,000",
      fgUom: "EA",
      consumed: "59,411",
      leftoverQty: "12,589",
      leftoverValue: "₹18,884",
      prodStopDate: "10 Jul 2026",
    },
    {
      component: "65284824",
      description: "Mineral Oil Base — BP Grade RM",
      type: "RM" as const,
      conversionFactor: "0.0104",
      onHandStock: "140",
      onHandBreakdown: {
        unrestricted: "120",
        quality: "12",
        stv: "5",
        blocked: "3",
        total: "140",
      },
      openPoQty: "1,000",
      uom: "Tonnes",
      fgEquivalentStock: "89,423",
      fgUnitsProducible: "89,423",
      fgUom: "EA",
      consumed: "58,900",
      leftoverQty: "30,523",
      leftoverValue: "₹22,890",
      prodStopDate: "10 Jul 2026",
    },
  ] satisfies ComponentBreakdownRow[],
};

export const PLANT_BREAKDOWN_BASE: Record<
  string,
  {
    code: string;
    totalProductionPlan: string;
    totalProductionPlanQty: number;
    prodStopDate: string;
    rows: ComponentBreakdownRow[];
  }
> = {
  [NO_ACTION_PLANT.code]: NO_ACTION_PLANT,
  [UTR_PLANT_BASE.code]: UTR_PLANT_BASE,
};

export const PROJECT_NAME_OPTIONS = [
  "CBU Transition Q1 2026",
  "Pack Change — Southern Plants",
  "MOQ Rationalisation FY27",
  "SKU Rationalisation Project",
  "Network Optimisation Wave 2",
];

export const MOQ_BREAK_MATERIALS: MoqBreakMaterial[] = [
  {
    type: "RM",
    code: "65284824",
    description: getComponentDescriptionByCode("65284824"),
    badgeBg: "#dcfce7",
    badgeColor: "#166534",
  },
  {
    type: "PM",
    code: "65428959",
    description: getComponentDescriptionByCode("65428959"),
    badgeBg: "#dbeafe",
    badgeColor: "#1d4ed8",
  },
  {
    type: "RM",
    code: "RM-XCBU-01",
    description: "Shared raw material feed stock used across multiple CBUs",
    badgeBg: "#dcfce7",
    badgeColor: "#166534",
    sharedCbus: ["VAFA1R3", "VAFB1R0"],
  },
];

export const MOQ_BREAK_SUPPLIERS: Record<string, MoqBreakSupplier[]> = {
  "65284824": [
    { name: "BASF SE", confidenceScore: 72, sob: 65, leadTimeDays: 10 },
    { name: "Indian Oil Corp.", confidenceScore: 48, sob: 35, leadTimeDays: 21 },
  ],
  "65428959": [
    { name: "Apex Packaging Ltd", confidenceScore: 68, sob: 80, leadTimeDays: 18 },
    { name: "Huhtamaki", confidenceScore: 41, sob: 20, leadTimeDays: 25 },
  ],
};

// "Can break MOQ" is tracked per material+supplier, not per material — a material
// can have one supplier able to break MOQ and another that can't.
export function moqSupplierKey(materialCode: string, supplierName: string): string {
  return `${materialCode}::${supplierName}`;
}

export type OpenPoStatus = "In Transit" | "Open" | "Partially Delivered";

export interface OpenPoLine {
  id: string;
  plant: string;
  siteCluster: string;
  componentCode: string;
  type: "RM" | "PM";
  qty: number;
  uom: string;
  status: OpenPoStatus;
  supplierInventory: number;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  /** ISO (yyyy-mm-dd). */
  poDeliveryDate: string;
  /** ISO (yyyy-mm-dd). */
  poCreationDate: string;
  averageLeadTimeDays: number;
}

export const OPEN_PO_STATUS_STYLE: Record<OpenPoStatus, { bg: string; color: string }> = {
  "In Transit": { bg: "#dbeafe", color: "#1d4ed8" },
  Open: { bg: "#dcfce7", color: "#166534" },
  "Partially Delivered": { bg: "#fef3c7", color: "#b45309" },
};

// In-transit and partially delivered lines already have stock in motion —
// it can't be pulled back, so only fully open lines can be cancelled.
export function isOpenPoLineCancellable(status: OpenPoStatus) {
  return status === "Open";
}

// RMPM readiness for the New CBU's material — only "po_available" carries a
// real delivery date; the other three describe how far the BOM/PO process
// has gotten, so the popup shows an explanatory message instead of a date.
export type RmpmConnectivityStatus =
  | "po_available"
  | "bom_not_available"
  | "contract_pending"
  | "po_creation_pending";

export const RMPM_CONNECTIVITY_STATUS_OPTIONS: { id: RmpmConnectivityStatus; label: string }[] = [
  { id: "po_available", label: "PO available" },
  { id: "bom_not_available", label: "BOM not available" },
  { id: "contract_pending", label: "BOM created, contract issue pending with procurement" },
  { id: "po_creation_pending", label: "BOM created, PO creation pending with factory" },
];

export const RMPM_CONNECTIVITY_STATUS_MESSAGE: Record<Exclude<RmpmConnectivityStatus, "po_available">, string> = {
  bom_not_available:
    "BOM is not available yet for this CBU — the connectivity date can't be set until the BOM is created.",
  contract_pending:
    "BOM has been created, but a contract issue is pending with procurement.",
  po_creation_pending:
    "BOM has been created, but PO creation is pending with the factory.",
};

// Short label for the Step 2 tile summary pill.
export const RMPM_CONNECTIVITY_STATUS_PILL_LABEL: Record<Exclude<RmpmConnectivityStatus, "po_available">, string> = {
  bom_not_available: "BOM not available",
  contract_pending: "Contract pending",
  po_creation_pending: "PO creation pending",
};

// The two "BOM exists, PO doesn't" statuses each have their own popup (BOM
// details + a manual date) instead of the plain inline date field used for
// "no CBU" / "no BOM" — these drive that popup's tile label and headline.
export type RmpmBomPendingStatus = Exclude<RmpmConnectivityStatus, "po_available" | "bom_not_available">;

export const RMPM_BOM_PENDING_TILE_LABEL: Record<RmpmBomPendingStatus, string> = {
  contract_pending: "Contract to be created",
  po_creation_pending: "PO to be created",
};

export const RMPM_BOM_PENDING_LIES_WITH: Record<RmpmBomPendingStatus, string> = {
  contract_pending: "Lies with Procurement",
  po_creation_pending: "Lies with factory",
};

export const OPEN_PO_LINES: OpenPoLine[] = [
  {
    id: "po-1",
    plant: "U535",
    siteCluster: "DDF",
    componentCode: "65284824",
    type: "RM",
    qty: 1500,
    uom: "EA",
    status: "In Transit",
    supplierInventory: 8200,
    poNumber: "6002916576",
    vendorId: "1022275",
    vendorName: "BASF SE",
    poDeliveryDate: "2026-09-30",
    poCreationDate: "2026-05-26",
    averageLeadTimeDays: 10,
  },
  {
    id: "po-2",
    plant: "U535",
    siteCluster: "DDF",
    componentCode: "65428959",
    type: "PM",
    qty: 900,
    uom: "EA",
    status: "Partially Delivered",
    supplierInventory: 450,
    poNumber: "6002897032",
    vendorId: "1042646",
    vendorName: "Apex Packaging Ltd",
    poDeliveryDate: "2026-08-01",
    poCreationDate: "2026-04-26",
    averageLeadTimeDays: 18,
  },
  {
    id: "po-3",
    plant: "UTR",
    siteCluster: "Haridwar",
    componentCode: "RM-XCBU-01",
    type: "RM",
    qty: 2200,
    uom: "EA",
    status: "Open",
    supplierInventory: 15600,
    poNumber: "6002945146",
    vendorId: "51706538",
    vendorName: "Creative Labels Private Limited",
    poDeliveryDate: "2026-08-27",
    poCreationDate: "2026-07-11",
    averageLeadTimeDays: 30,
  },
];

export const OPEN_PO_CANCELLABLE_LINES = OPEN_PO_LINES.filter((l) => isOpenPoLineCancellable(l.status));

export const IUT_TRANSFER_LANES = [
  { from: "U535", to: "UTR", keepType: "PM", qtyLabel: "Qty available for transfer", transitTime: "2 days", confidenceScore: 65 },
  { from: "UTR", to: "U535", keepType: "RM", qtyLabel: "Qty available for transfer", transitTime: "3 days", confidenceScore: 82 },
] as const;

export const IUT_LANE_REQUIREMENTS: Record<string, IutLaneMaterialReq[]> = {
  "UTR→U535": [
    {
      type: "PM",
      code: "64330490",
      description: getComponentDescriptionByCode("64330490"),
      requiredQty: 1510,
      uom: "EA",
    },
    {
      type: "RM",
      code: "64322546",
      description: getComponentDescriptionByCode("64322546"),
      requiredQty: 865,
      uom: "EA",
    },
  ],
  "U535→UTR": [
    {
      type: "PM",
      code: "65428959",
      description: getComponentDescriptionByCode("65428959"),
      requiredQty: 5200,
      uom: "EA",
    },
    {
      type: "RM",
      code: "65284824",
      description: getComponentDescriptionByCode("65284824"),
      requiredQty: 28,
      uom: "Tonnes",
    },
  ],
};

export const RM_BADGE = { bg: "#dcfce7", color: "#166534" };

export const PM_BADGE = { bg: "#dbeafe", color: "#1d4ed8" };

export const PLANT_DISPLAY_NAMES: Record<string, string> = {
  UTR: "Unilever Taloja (UTR)",
  U871: "Unilever Khopoli (U871)",
  U535: "Unilever Doom Dooma (U535)",
  ULU: "Unilever Lucknow (ULU)",
  U872: "Unilever Haridwar (U872)",
};

export const PO_WEEK_OPTIONS = ["1", "2", "3", "4", "5"] as const;

export const PREDEFINED_DETAIL = {
  businessWaste: "₹2,580",
  wasteSavings: "₹2,961",
  fgDaysCover: "26d",
  transfer: {
    from: "UTR",
    to: "U535",
    qty: 12589,
    laneAvailable: true,
    costPerTrip: 300,
  },
  moq: {
    qty: 15000,
    supplier: "Reliance Ind.",
    costPerUnit: 42,
    originalCostPerUnit: 48,
    totalOrderCost: 630000,
    originalOrderCost: 720000,
  },
};

export const NO_ACTION_WASTE = 5541;
