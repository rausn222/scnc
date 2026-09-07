import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  AlertTriangle,
  Box,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Cpu,
  ArrowLeftRight,
  ExternalLink,
  Link2Off,
  Maximize2,
  Minimize2,
  Pencil,
  Plus,
  Search,
  Send,
  ShoppingCart,
  Shuffle,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";
import { useNav } from "../App";
import { cbuData, type CBURow, PLANT_CLUSTER_MAP, getComponentDescriptionByCode, getComponentsByPlant, getRowFgMaterial, getAggregatedComponents } from "../components/data";
import { VCBL1R0_OPEN_POS } from "../components/productionPlanData";
import { PageHeader } from "../components/PageHeader";
import { ProductionPlanModal, generateWeeklyProduction } from "../components/ProductionPlanModal";
import { ScenarioComparisonStep } from "../components/sciDetails4/ScenarioComparisonReportTable";

export const C = {
  navy: "#003087",
  blue: "#1565C0",
  teal: "#00695C",
  green: "#16a34a",
  bgBlue: "#EFF4FB",
  borderBlue: "#93c5fd",
};

interface Props {
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
    name: "IUT + Break MOQ",
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

export const MOQ_PLANT_OPTIONS: MOQPlantOption[] = [
  {
    id: "p_u535",
    plant: "U535",
    isBest: true,
    material: "PM 64330490",
    orderQty: 15000,
    moqBroken: 2500,
    totalPrice: 100000,
    suppliers: [
      { id: "sup_reliance", name: "Reliance Ind.",   moq: 5000, pricePerUnit: 42, bizWaste: 3200, productionDate: "19 Jun 2026" },
      { id: "sup_tata",     name: "Tata Chemicals",  moq: 3000, pricePerUnit: 38, bizWaste: 3800, productionDate: "22 Jun 2026" },
    ],
  },
  {
    id: "p_utr",
    plant: "UTR",
    isBest: false,
    material: "RM 10045872",
    orderQty: 10000,
    moqBroken: null,
    suppliers: [
      { id: "sup_basf",   name: "BASF India",   moq: 4000, pricePerUnit: 45, bizWaste: 4100, productionDate: "15 Jun 2026" },
      { id: "sup_evonik", name: "Evonik India",  moq: 2000, pricePerUnit: 50, bizWaste: 4500, productionDate: "18 Jun 2026" },
    ],
  },
];

const ON_HAND_EXPAND_COLUMNS = [
  "Unrestricted Stock",
  "Stock in Quality",
  "STV stock",
  "Blocked Stock",
  "Total Stock",
] as const;

const BREAKDOWN_TAIL_COLUMNS = [
  "UOM",
  "FG equivalent stock",
  "FG units producible",
  "FG UOM",
  "Consumed",
  "Leftover qty",
  "Leftover value (₹)",
  "Prod. stop date",
] as const;

const EXPANDED_ONHAND_HEADER_BG = "#dbeafe";
const EXPANDED_BREAKDOWN_HEADER_BG = "#eff6ff";
const EXPANDED_ONHAND_CELL_BG = "#f0f9ff";
const EXPANDED_BREAKDOWN_CELL_BG = "#f8fafc";
const EXPANDED_GROUP_BORDER = "1px solid #93c5fd";

type OnHandBreakdown = {
  unrestricted: string;
  quality: string;
  stv: string;
  blocked: string;
  total: string;
};

type ComponentBreakdownRow = {
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
  highlightFgEquiv?: boolean;
  highlightLeftover?: boolean;
};

const NO_ACTION_PLANT = {
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
      highlightFgEquiv: true,
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

// UTR only carries the one component that actually moves in an IUT transfer in
// this view (65428959) — it's the surplus plant that can ship the bottleneck
// PM component to U535 (or receive it, if the reverse route is picked).
// The one component that actually moves between plants in an IUT transfer —
// used to identify which row's numbers should shift across Before/After
// Transition states, regardless of which plant is showing it.
const TRANSITIONING_COMPONENT_CODE = "65428959";

const UTR_PLANT_BASE = {
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

type TransitionState = "before" | "after" | "final";

export type PlantRole = "source" | "destination" | "ordering";

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

function parseIndianNumber(value: string): number {
  return Number(value.replace(/,/g, "")) || 0;
}

export function formatIndianNumber(value: number): string {
  return value.toLocaleString("en-IN");
}

// Which plants are touched by the currently selected IUT option / MOQ plant,
// and in what role — this is what drives which plant blocks (and which
// direction their numbers move) show up in the breakdown below.
function getActivePlantRoles(
  scenarioId: string,
  selectedTransfer: IUTOption | null,
  selectedMoq: MOQPlantOption | null,
): { code: string; roles: PlantRole[] }[] {
  const touchesIUT = scenarioId === "iut" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break";
  const touchesMOQ = scenarioId === "moq" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break";

  // Every known plant always shows, even if the current scenario/option
  // selection gives it no active role — it just renders as flat baseline data.
  const roleMap = new Map<string, Set<PlantRole>>();
  for (const code of Object.keys(PLANT_BREAKDOWN_BASE)) {
    roleMap.set(code, new Set());
  }
  const addRole = (code: string, role: PlantRole) => {
    if (!roleMap.has(code)) roleMap.set(code, new Set());
    roleMap.get(code)!.add(role);
  };

  if (touchesIUT && selectedTransfer) {
    addRole(selectedTransfer.routeFrom, "source");
    addRole(selectedTransfer.routeTo, "destination");
  }
  if (touchesMOQ && selectedMoq) {
    addRole(selectedMoq.plant, "ordering");
  }

  return Array.from(roleMap.entries()).map(([code, roles]) => ({
    code,
    roles: Array.from(roles),
  }));
}

// For the default/accepted option on each side, reuse the already-authored
// SCENARIOS figures (feasibleProducible / productionStopDate) so this table
// stays consistent with the scenario cards above it. Only falls back to raw
// transferQty/orderQty math when the user picks a non-default option — an
// exploratory "what if" with no authoritative number to match.
export function computeAfterQtyAndDate(
  plantCode: string,
  roles: PlantRole[],
  scenarioId: string,
  selectedTransfer: IUTOption | null,
  selectedMoq: MOQPlantOption | null,
  moqSuppliers: Record<string, string>,
  baseQty: number,
  baseDate: string,
): { qty: number; date: string } {
  const selectedSupplier = selectedMoq
    ? selectedMoq.suppliers.find((s) => s.id === moqSuppliers[selectedMoq.id]) ?? selectedMoq.suppliers[0]
    : null;
  const isBestTransfer = !selectedTransfer || selectedTransfer.isBest;
  const isBestMoq = !selectedMoq || (selectedMoq.isBest && selectedSupplier?.id === selectedMoq.suppliers[0]?.id);

  if (plantCode === NO_ACTION_PLANT.code && isBestTransfer && isBestMoq) {
    const meta = SCENARIOS.find((s) => s.id === scenarioId);
    if (meta) return { qty: meta.feasibleProducible, date: meta.productionStopDate };
  }

  let qty = baseQty;
  let date = baseDate;
  if (roles.includes("destination") && selectedTransfer) {
    qty += selectedTransfer.transferQty;
    date = selectedTransfer.prodStopDest;
  }
  if (roles.includes("source") && selectedTransfer) {
    qty -= selectedTransfer.transferQty;
    date = selectedTransfer.prodStopSource;
  }
  if (roles.includes("ordering") && selectedMoq) {
    qty += selectedMoq.orderQty;
    date = selectedSupplier?.productionDate ?? date;
  }
  return { qty, date };
}

// Builds the Before / After Transition / Final row sets for one plant. Only
// the row that actually participates in the transfer/order (the bottleneck
// PM at the destination plant, or UTR's only tracked component when it's the
// source) changes across states — everything else repeats unchanged.
function computeTransitionRows(
  plantCode: string,
  roles: PlantRole[],
  scenarioId: string,
  selectedTransfer: IUTOption | null,
  selectedMoq: MOQPlantOption | null,
  moqSuppliers: Record<string, string>,
): Record<TransitionState, ComponentBreakdownRow[]> {
  const base = PLANT_BREAKDOWN_BASE[plantCode];
  if (!base) return { before: [], after: [], final: [] };

  const before: ComponentBreakdownRow[] = [];
  const after: ComponentBreakdownRow[] = [];
  const final: ComponentBreakdownRow[] = [];

  for (const row of base.rows) {
    before.push(row);

    const isAffected = row.component === TRANSITIONING_COMPONENT_CODE;
    if (!isAffected) {
      after.push(row);
      final.push(row);
      continue;
    }

    const baseQty = parseIndianNumber(row.onHandStock);
    const { qty, date } = computeAfterQtyAndDate(
      plantCode,
      roles,
      scenarioId,
      selectedTransfer,
      selectedMoq,
      moqSuppliers,
      baseQty,
      row.prodStopDate,
    );
    const formattedQty = formatIndianNumber(qty);
    const delta = qty - baseQty;
    const afterBreakdown: OnHandBreakdown = {
      ...row.onHandBreakdown,
      unrestricted: formatIndianNumber(parseIndianNumber(row.onHandBreakdown.unrestricted) + delta),
      total: formattedQty,
    };

    const afterRow: ComponentBreakdownRow = {
      ...row,
      onHandStock: formattedQty,
      onHandBreakdown: afterBreakdown,
      fgEquivalentStock: formattedQty,
      fgUnitsProducible: formattedQty,
      consumed: "—",
      leftoverQty: "—",
      leftoverValue: "—",
      prodStopDate: date,
    };
    const finalRow: ComponentBreakdownRow = {
      ...afterRow,
      consumed: formattedQty,
      leftoverQty: "Nil",
      leftoverValue: "Nil",
    };

    after.push(afterRow);
    final.push(finalRow);
  }

  return { before, after, final };
}

type PlantProductionPlanRow = {
  plant: string;
  productionPlanEA: number | null;
  producibleFG: number;
  bottleneckCode: string | null;
};

const PRODUCTION_PLAN_BY_PLANT: PlantProductionPlanRow[] = [
  { plant: "U535", productionPlanEA: 75000, producibleFG: 2591, bottleneckCode: "64330490" },
  { plant: "UTR", productionPlanEA: null, producibleFG: 1510, bottleneckCode: "64330490" },
];

// Per-plant production plan derived from the selected CBU's real component/stock
// data, reusing the same allocation getComponentsByPlant already performs.
// Each plant's producible FG is bottleneck-limited (min across its components);
// the national 12-month demand is then split across plants in proportion to
// that producible capacity, so plants with more usable stock take a bigger
// share of the plan.
function computeProductionPlanByPlant(row: CBURow): PlantProductionPlanRow[] {
  const fgMaterial = getRowFgMaterial(row);
    if (fgMaterial === "VCBL1R0" || row.cbuCode === "VCBL1R0" || row.cbuCode === "VAFA1R") {
    return PRODUCTION_PLAN_BY_PLANT;
  }

  const { plants, rows } = getComponentsByPlant(
    row.cbuCode,
    row.demand.next12Months,
    fgMaterial,
  );

  const perPlant = plants.map((plant) => {
    const plantRows = rows.filter((r) => r.plantco === plant);
    if (plantRows.length === 0) {
      return { plant, producibleFG: 0, bottleneckCode: null as string | null };
    }
    const bottleneck = plantRows.reduce((min, r) =>
      (r.fgPhysicalStock ?? 0) < (min.fgPhysicalStock ?? 0) ? r : min,
    );
    return {
      plant,
      producibleFG: Math.round(bottleneck.fgPhysicalStock ?? 0),
      bottleneckCode: bottleneck.componentCode as string | null,
    };
  });

  const totalProducible = perPlant.reduce((sum, p) => sum + p.producibleFG, 0);

  return perPlant.map((p) => ({
    plant: p.plant,
    productionPlanEA:
      totalProducible > 0
        ? Math.round((row.demand.next12Months * p.producibleFG) / totalProducible)
        : null,
    producibleFG: p.producibleFG,
    bottleneckCode: p.bottleneckCode,
  }));
}

const PROJECT_NAME_OPTIONS = [
  "CBU Transition Q1 2026",
  "Pack Change — Southern Plants",
  "MOQ Rationalisation FY27",
  "SKU Rationalisation Project",
  "Network Optimisation Wave 2",
];

export default function SCIDetail4({ row }: Props) {
  const { navigate } = useNav();
  const [newCbuSrNo, setNewCbuSrNo] = useState<number | null>(null);
  const [projectName, setProjectName] = useState("");
  const [acceptedId, setAcceptedId] = useState<string | null>(null);

  // Shared IUT option / MOQ supplier selection — a single source of truth so
  // the expandable scenario row (ScenarioDetailCard) and the Component
  // Breakdown by Plant table (ScenarioDetailView) always agree.
  const [selTransfer, setSelTransfer] = useState<string>(
    () => IUT_TRANSFER_OPTIONS.find((o) => o.isBest)?.id ?? IUT_TRANSFER_OPTIONS[0].id,
  );
  const [moqSuppliers, setMoqSuppliers] = useState<Record<string, string>>(
    () => Object.fromEntries(MOQ_PLANT_OPTIONS.map((p) => [p.id, p.suppliers[0].id])),
  );
  const handleMoqSupplier = (plantId: string, supplierId: string) =>
    setMoqSuppliers((prev) => ({ ...prev, [plantId]: supplierId }));

  const oldRow = row;
  const newRow = useMemo(
    () =>
      newCbuSrNo != null
        ? cbuData.find((r) => r.srNo === newCbuSrNo) ?? null
        : null,
    [newCbuSrNo],
  );
  const hasCbu = oldRow != null;

  useEffect(() => {
    setNewCbuSrNo(null);
    setAcceptedId(null);
  }, [oldRow?.srNo]);

  const handleOldCbuChange = (srNo: number) => {
    navigate({ page: "sci-detail4", srNo });
  };

  const handleNewCbuChange = (srNo: number) => {
    setNewCbuSrNo(srNo);
  };

  const selectAccepted = (id: string) => {
    const scenario = SCENARIOS.find((s) => s.id === id);
    if (scenario?.disabled || scenario?.comingSoon) return;
    setAcceptedId((prev) => (prev === id ? null : id));
  };

  const detailScenarioId = acceptedId;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "#f5f7fa" }}
    >
      <PageHeader
        title="Supply Chain Intelligence"
        breadcrumbs={[
          { label: "SAMARTH" },
          { label: "Network Planner" },
          {
            label: "CBU Transition (National View)",
            onClick: () => navigate({ page: "dashboard" }),
          },
          ...(oldRow && newRow
            ? [{ label: `${oldRow.cbuCode} → ${newRow.cbuCode}` }]
            : oldRow
              ? [{ label: oldRow.cbuCode }]
              : []),
        ]}
      />

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <StepSection
          step={1}
          title="Select CBU"
          subtitle="Choose the old finished good to simulate. New CBU is optional."
          overflowVisible
        >
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <CBUSearchDropdown
              label="Old CBU"
              row={oldRow}
              onSelect={handleOldCbuChange}
              placeholder="Select Old CBU"
            />
            <CBUSearchDropdown
              label="New CBU"
              row={newRow}
              onSelect={handleNewCbuChange}
              placeholder="Select New CBU (optional)"
              disabled={!oldRow}
            />
            <ProjectNameInput
              value={projectName}
              onChange={setProjectName}
              disabled={!oldRow}
            />
          </div>
        </StepSection>

        {!hasCbu && <SelectCbuPlaceholder />}

        {hasCbu && oldRow && (
          <>
            {/* <ProductionPlanByPlantCard row={oldRow} /> */}
            <SimulationAssumptionsStep
              newCbuRow={newRow}
            />
            <ScenarioComparisonStep
              acceptedId={acceptedId}
              onSelect={selectAccepted}
              selTransfer={selTransfer}
              onSelTransfer={setSelTransfer}
              moqSuppliers={moqSuppliers}
              onMoqSupplier={handleMoqSupplier}
            />
            {detailScenarioId && (
              <ScenarioDetailView
                row={oldRow}
                scenarioId={detailScenarioId}
                selTransfer={selTransfer}
                onSelTransfer={setSelTransfer}
                moqSuppliers={moqSuppliers}
                onMoqSupplier={handleMoqSupplier}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function StepSection({
  step,
  title,
  subtitle,
  children,
  overflowVisible = false,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  overflowVisible?: boolean;
}) {
  return (
    <div
      className={`rounded-xl bg-white ${overflowVisible ? "overflow-visible" : "overflow-hidden"}`}
      style={{
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 4px rgba(0,48,135,0.06)",
      }}
    >
      <div
        className="px-5 py-4 flex items-start gap-3"
        style={{ borderBottom: "1px solid #e2e8f0" }}
      >
        <span
          className="shrink-0 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider text-white"
          style={{ backgroundColor: C.blue }}
        >
          STEP {step}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-bold tracking-wide uppercase"
            style={{ color: C.navy }}
          >
            {title}
          </p>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SelectCbuPlaceholder() {
  return (
    <div
      className="rounded-xl flex flex-col items-center justify-center text-center px-6 py-16"
      style={{
        border: "2px dashed #cbd5e1",
        backgroundColor: "#f8fafc",
      }}
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: C.bgBlue }}
      >
        <Cpu size={28} style={{ color: C.blue }} />
      </div>
      <p className="text-base font-bold mb-2" style={{ color: C.navy }}>
        Select Old CBU to begin simulation
      </p>
      <p className="text-sm mb-4" style={{ color: "#64748b" }}>
        The No Action scenario will compute automatically
      </p>
      <p className="text-xs" style={{ color: "#94a3b8" }}>
        → Choose an old finished good above. New CBU is optional for transition
        scenarios.
      </p>
    </div>
  );
}

function PlanStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <p
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: "#94a3b8" }}
      >
        {label}
      </p>
      <p className="text-sm font-bold mt-0.5 tabular-nums" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

const PRODUCTION_PLAN_TABLE_HEADERS = [
  "Plant",
  "Production Plan (EA)",
  "Producible (FG)",
  "Balance",
  "Bottleneck",
  "Schedule",
] as const;

const PRODUCTION_PLAN_COLUMN_WIDTHS = ["12%", "20%", "16%", "16%", "20%", "16%"] as const;

function ProductionPlanByPlantCard({ row }: { row: CBURow }) {
  const [expandedPlant, setExpandedPlant] = useState<string | null>(null);

  const productionPlanByPlant = useMemo(
    () => computeProductionPlanByPlant(row),
    [row],
  );

  const plantsPlanned = productionPlanByPlant.filter(
    (p) => p.productionPlanEA != null,
  ).length;
  const totalPlan = productionPlanByPlant.reduce(
    (sum, p) => sum + (p.productionPlanEA ?? 0),
    0,
  );
  const producibleNow = productionPlanByPlant.reduce(
    (sum, p) => sum + p.producibleFG,
    0,
  );
  const shortfall = totalPlan - producibleNow;

  return (
    <div
      className="rounded-xl overflow-hidden bg-white"
      style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex flex-wrap items-center gap-3"
        style={{ borderBottom: "1px solid #e2e8f0" }}
      >
        <span
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider text-white uppercase"
          style={{ backgroundColor: C.blue }}
        >
          <Calendar size={12} />
          Production Plan
        </span>
        <div className="min-w-0">
          <p
            className="text-sm font-bold tracking-wide uppercase"
            style={{ color: C.navy }}
          >
            Production Plan by Plant
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
            Planned output, what's producible from current stock, and the weekly schedule per plant
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div
        className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4"
        style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#fafbfc" }}
      >
        <PlanStat label="Plants Planned" value={String(plantsPlanned)} color={C.navy} />
        <PlanStat label="Total Plan" value={`${totalPlan.toLocaleString("en-IN")} EA`} color={C.navy} />
        <PlanStat label="Producible Now" value={`${producibleNow.toLocaleString("en-IN")} FG`} color={C.blue} />
        <PlanStat label="Shortfall" value={`${shortfall.toLocaleString("en-IN")} FG`} color="#dc2626" />
      </div>

      {/* Per-plant table */}
      <div className="overflow-x-auto">
        <table
          className="w-full text-xs"
          style={{ borderCollapse: "collapse", tableLayout: "fixed" }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              {PRODUCTION_PLAN_TABLE_HEADERS.map((h, i) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-center font-semibold whitespace-nowrap"
                  style={{ color: "#64748b", width: PRODUCTION_PLAN_COLUMN_WIDTHS[i] }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {productionPlanByPlant.map((p, idx) => {
              const balance = p.producibleFG - (p.productionPlanEA ?? 0);
              return (
                <React.Fragment key={p.plant}>
                <tr
                  style={{ borderTop: idx === 0 ? undefined : "1px solid #f1f5f9" }}
                >
                  <td className="px-3 py-3 text-center font-bold" style={{ color: C.blue }}>
                    {p.plant}
                  </td>
                  <td
                    className="px-3 py-3 text-center tabular-nums"
                    style={{ color: p.productionPlanEA != null ? "#111827" : "#94a3b8" }}
                  >
                    {p.productionPlanEA != null
                      ? p.productionPlanEA.toLocaleString("en-IN")
                      : "—"}
                  </td>
                  <td
                    className="px-3 py-3 text-center tabular-nums font-semibold"
                    style={{ color: C.blue }}
                  >
                    {p.producibleFG.toLocaleString("en-IN")}
                  </td>
                  <td
                    className="px-3 py-3 text-center tabular-nums font-bold"
                    style={{ color: balance < 0 ? "#dc2626" : C.green }}
                  >
                    {balance < 0 ? "−" : "+"}
                    {Math.abs(balance).toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {p.bottleneckCode ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: "#fef3c7", color: "#b45309" }}
                      >
                        <AlertTriangle size={11} />
                        {p.bottleneckCode}
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {p.productionPlanEA != null ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPlant((prev) => (prev === p.plant ? null : p.plant))
                        }
                        className="inline-flex cursor-pointer items-center gap-0.5 font-semibold hover:underline"
                        style={{ color: C.blue, fontSize: 11 }}
                      >
                        {expandedPlant === p.plant ? (
                          <>
                            Hide weekly
                            <ChevronDown size={10} />
                          </>
                        ) : (
                          <>
                            View weekly
                            <ChevronRight size={10} />
                          </>
                        )}
                      </button>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                </tr>
                {expandedPlant === p.plant && p.productionPlanEA != null && (
                  <WeeklyScheduleRow
                    key={`${p.plant}-schedule`}
                    plant={p.plant}
                    totalProduction={p.productionPlanEA}
                    colSpan={PRODUCTION_PLAN_TABLE_HEADERS.length}
                  />
                )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const WEEKLY_SCHEDULE_BASE_DATE = "25 May 2026";

function addDays(dateStr: string, days: number): string {
  const [day, mon, year] = dateStr.split(" ");
  const d = new Date(parseInt(year, 10), MONTH_INDEX[mon], parseInt(day, 10));
  d.setDate(d.getDate() + days);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function generateWeekStartDates(count: number, baseDate: string): string[] {
  return Array.from({ length: count }, (_, i) => addDays(baseDate, i * 7));
}

function WeeklyScheduleRow({
  plant,
  totalProduction,
  colSpan,
}: {
  plant: string;
  totalProduction: number;
  colSpan: number;
}) {
  const weeks = useMemo(
    () => generateWeeklyProduction(totalProduction),
    [totalProduction],
  );
  const weekDates = useMemo(
    () => generateWeekStartDates(weeks.length, WEEKLY_SCHEDULE_BASE_DATE),
    [weeks.length],
  );
  const cumulative = useMemo(() => {
    let running = 0;
    return weeks.map((w) => (running += w.production));
  }, [weeks]);

  const reportRowLabelStyle: React.CSSProperties = {
    color: "#64748b",
    borderRight: "1px solid #e2e8f0",
  };

  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          padding: 0,
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #f1f5f9",
          maxWidth: 0,
        }}
      >
        <div className="px-4 py-3" style={{ maxWidth: "100%" }}>
          <p
            className="text-[10px] font-semibold uppercase tracking-wide mb-2"
            style={{ color: "#94a3b8" }}
          >
            Weekly Production Schedule — {plant}
          </p>
          <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid #e2e8f0" }}>
            <table className="text-[11px]" style={{ borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ backgroundColor: "#eff4fb" }}>
                  <td className="px-3 py-1.5 font-semibold whitespace-nowrap" style={reportRowLabelStyle}>
                    Week of
                  </td>
                  {weekDates.map((d, i) => (
                    <td
                      key={i}
                      className="px-3 py-1.5 text-right font-semibold whitespace-nowrap"
                      style={{ color: "#64748b" }}
                    >
                      {d}
                    </td>
                  ))}
                </tr>
                <tr style={{ backgroundColor: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
                  <td className="px-3 py-1.5 font-semibold whitespace-nowrap" style={reportRowLabelStyle}>
                    Planned (EA)
                  </td>
                  {weeks.map((w, i) => (
                    <td
                      key={i}
                      className="px-3 py-1.5 text-center tabular-nums font-bold whitespace-nowrap"
                      style={{ color: C.navy }}
                    >
                      {w.production.toLocaleString("en-IN")}
                    </td>
                  ))}
                </tr>
                <tr style={{ backgroundColor: "#ffffff", borderTop: "1px solid #f1f5f9" }}>
                  <td className="px-3 py-1.5 font-semibold whitespace-nowrap" style={reportRowLabelStyle}>
                    Cumulative
                  </td>
                  {cumulative.map((c, i) => (
                    <td
                      key={i}
                      className="px-3 py-1.5 text-center tabular-nums font-semibold whitespace-nowrap"
                      style={{ color: "#b45309" }}
                    >
                      {c.toLocaleString("en-IN")}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </td>
    </tr>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
  labelMuted = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  labelMuted?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer shrink-0">
      <span
        className="text-xs font-medium"
        style={{ color: labelMuted ? "#94a3b8" : "#64748b" }}
      >
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative w-10 h-5 rounded-full transition-colors"
        style={{ backgroundColor: checked ? C.blue : "#cbd5e1" }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
          style={{ left: checked ? 22 : 2 }}
        />
      </button>
    </label>
  );
}

function AssumptionDateInput({
  value,
  onChange,
  min,
  required = false,
}: {
  value: string;
  onChange: (next: string) => void;
  min?: string;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const empty = required && !value;
  return (
    <div className="relative shrink-0">
      <input
        ref={inputRef}
        type="date"
        value={value}
        min={min}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs px-3 py-1.5 rounded-lg w-36 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
        style={{
          border: `1px solid ${empty ? "#f87171" : "#d1d5db"}`,
          color: value ? C.navy : "#94a3b8",
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => inputRef.current?.showPicker()}
              className="absolute right-2 cursor-pointer top-1/2 -translate-y-1/2"
        style={{ lineHeight: 0 }}
      >
        <Calendar size={14} style={{ color: "#94a3b8" }} />
      </button>
    </div>
  );
}

type MoqBreakMaterial = {
  type: "RM" | "PM";
  code: string;
  description: string;
  badgeBg: string;
  badgeColor: string;
  sharedCbus?: string[];
};

const MOQ_BREAK_MATERIALS: MoqBreakMaterial[] = [
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

type MoqBreakSupplier = {
  name: string;
  confidenceScore: number;
};

const MOQ_BREAK_SUPPLIERS: Record<string, MoqBreakSupplier[]> = {
  "65284824": [
    { name: "BASF SE", confidenceScore: 72 },
    { name: "Indian Oil Corp.", confidenceScore: 48 },
  ],
  "65428959": [
    { name: "Apex Packaging Ltd", confidenceScore: 68 },
    { name: "Huhtamaki", confidenceScore: 41 },
  ],
};

function confidenceMeta(score: number) {
  if (score >= 70) return { color: C.green, label: "High" };
  if (score >= 45) return { color: "#d97706", label: "Medium" };
  return { color: "#dc2626", label: "Low" };
}

function ConfidenceScoreBar({ score }: { score: number }) {
  const { color, label } = confidenceMeta(score);
  return (
    <div className="text-right shrink-0 min-w-[128px]">
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs font-bold tabular-nums" style={{ color }}>
          {score}%
        </span>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {label}
        </span>
      </div>
      <div
        className="mt-1 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "#e2e8f0" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>
        Break confidence
      </p>
    </div>
  );
}

const IUT_TRANSFER_LANES = [
  { from: "U535", to: "UTR", keepType: "PM", qtyLabel: "Qty available for transfer" },
  { from: "UTR", to: "U535", keepType: "RM", qtyLabel: "Qty available for transfer" },
] as const;

type IutLaneMaterialReq = {
  type: "RM" | "PM";
  code: string;
  description: string;
  requiredQty: number;
  uom: string;
};

const IUT_LANE_REQUIREMENTS: Record<string, IutLaneMaterialReq[]> = {
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

function PlantRouteLabel({ from, to }: { from: string; to: string }) {
  const fromCluster = PLANT_CLUSTER_MAP[from] ?? from;
  const toCluster = PLANT_CLUSTER_MAP[to] ?? to;
  return (
    <span className="text-sm">
      <span className="font-semibold" style={{ color: C.blue }}>
        {from}
      </span>
      <span className="text-xs ml-1" style={{ color: "#64748b" }}>
        ({fromCluster})
      </span>
      <span className="mx-1.5" style={{ color: "#94a3b8" }}>
        →
      </span>
      <span className="font-semibold" style={{ color: C.blue }}>
        {to}
      </span>
      <span className="text-xs ml-1" style={{ color: "#64748b" }}>
        ({toCluster})
      </span>
    </span>
  );
}

function ComponentCodeWithDesc({
  code,
  description,
  className = "text-xs",
}: {
  code: string;
  description?: string;
  className?: string;
}) {
  const desc = description ?? getComponentDescriptionByCode(code);
  return (
    <div className={className}>
      <span className="font-medium" style={{ color: C.navy }}>
        {code}
      </span>
      {desc ? (
        <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "#64748b" }}>
          {desc}
        </p>
      ) : null}
    </div>
  );
}

function IutLaneRow({
  lane,
  possible,
  expanded,
  onToggleExpand,
  onTogglePossible,
}: {
  lane: (typeof IUT_TRANSFER_LANES)[number];
  possible: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onTogglePossible: () => void;
}) {
  const laneKey = `${lane.from}→${lane.to}`;
  const materials = (IUT_LANE_REQUIREMENTS[laneKey] ?? []).filter(
    (m) => m.type === lane.keepType,
  );

  return (
    <div style={{ borderTop: "1px solid #f8fafc" }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 transition-colors cursor-pointer"
        style={{
          backgroundColor: expanded ? "#EDF5F4" : undefined,
          outline: expanded ? "2px solid #1565C0" : undefined,
          outlineOffset: expanded ? -1 : undefined,
        }}
      >
        <span className="flex items-center gap-1.5 text-left min-w-0">
          {expanded ? (
            <ChevronDown size={13} style={{ color: C.blue, flexShrink: 0 }} />
          ) : (
            <ChevronRight size={13} style={{ color: C.blue, flexShrink: 0 }} />
          )}
          <PlantRouteLabel from={lane.from} to={lane.to} />
        </span>
        <label
          className="flex items-center gap-2 cursor-pointer shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <span
            className="text-xs font-semibold"
            style={{ color: possible ? C.green : "#94a3b8" }}
          >
            {possible ? "Possible" : "Not possible"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={possible}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePossible();
            }}
            className="relative w-10 h-5 rounded-full transition-colors"
            style={{ backgroundColor: possible ? C.green : "#cbd5e1" }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
              style={{ left: possible ? 22 : 2 }}
            />
          </button>
        </label>
      </div>

      {expanded && (
        <div
          style={{
            backgroundColor: "#EDF5F4",
            borderTop: "1px solid rgba(21,101,192,0.12)",
          }}
        >
          <div className="px-4 py-2">
            <span
              className="flex items-center gap-2 text-xs font-semibold"
              style={{ color: C.blue }}
            >
              <span style={{ color: "rgba(21,101,192,0.6)" }}>└</span>
              RM/PM required for transfer
            </span>
          </div>
          {materials.length === 0 ? (
            <p
              className="px-4 pb-3 text-xs italic"
              style={{ color: "#64748b" }}
            >
              No RM/PM requirements for this lane
            </p>
          ) : (
            materials.map((mat, idx) => {
              const badge = mat.type === "RM" ? RM_BADGE : PM_BADGE;
              return (
                <div
                  key={mat.code}
                  className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3"
                  style={{
                    borderTop: "1px solid rgba(21,101,192,0.08)",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0 pl-3">
                    <span
                      className="text-xs shrink-0"
                      style={{ color: "rgba(21,101,192,0.6)" }}
                    >
                      ⌞
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {mat.type}
                    </span>
                    <ComponentCodeWithDesc
                      code={mat.code}
                      description={mat.description}
                    />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px]" style={{ color: "#64748b" }}>
                      Required qty
                    </p>
                    <p
                      className="text-xs font-bold tabular-nums"
                      style={{ color: C.navy }}
                    >
                      {mat.requiredQty.toLocaleString("en-IN")} {mat.uom}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

const PLANT_DISPLAY_NAMES: Record<string, string> = {
  UTR: "Unilever Taloja (UTR)",
  U871: "Unilever Khopoli (U871)",
  U535: "Unilever Doom Dooma (U535)",
  ULU: "Unilever Lucknow (ULU)",
  U872: "Unilever Haridwar (U872)",
};

const PO_WEEK_OPTIONS = ["1", "2", "3", "4", "5"] as const;

function getPlantDisplayName(plantCode: string): string {
  if (plantCode === "All plants") return "All plants";
  return (
    PLANT_DISPLAY_NAMES[plantCode] ??
    PLANT_CLUSTER_MAP[plantCode] ??
    plantCode
  );
}

function defaultWeekMonth(): { week: string; month: string } {
  const now = new Date();
  return {
    week: String(Math.min(5, Math.ceil(now.getDate() / 7))),
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  };
}

function weekMonthFromTxDate(txDate: string): { week: string; month: string } {
  const parts = txDate.split("-");
  if (parts.length !== 3) return defaultWeekMonth();
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return defaultWeekMonth();
  return {
    week: String(Math.min(5, Math.ceil(d / 7))),
    month: `${y}-${String(m).padStart(2, "0")}`,
  };
}

type OpenPoAssumptionLine = {
  id: string;
  plantCode: string;
  plantName: string;
  componentCode: string;
  description: string;
  date: string; // "dd-mm-yyyy"
};

function todayDdMmYyyy(): string {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;
}

function buildOpenPoLinesForCbu(row: CBURow): OpenPoAssumptionLine[] {
  const fgMaterial = getRowFgMaterial(row);
  const defaultDate = todayDdMmYyyy();

  if (fgMaterial === "VCBL1R0" || row.cbuCode === "VCBL1R0") {
    return VCBL1R0_OPEN_POS.map((po) => ({
      id: `${po.plant}__${po.componentCode}`,
      plantCode: po.plant,
      plantName: getPlantDisplayName(po.plant),
      componentCode: po.componentCode,
      description: getComponentDescriptionByCode(po.componentCode),
      date: po.txDate, // already "dd-mm-yyyy"
    }));
  }

  const { rows } = getComponentsByPlant(
    row.cbuCode,
    row.demand.next12Months,
    fgMaterial,
  );

  const plantLines = rows
    .filter((r) => r.openPOStock > 0)
    .map((r) => ({
      id: `${r.plantco}__${r.componentCode}`,
      plantCode: r.plantco,
      plantName: getPlantDisplayName(r.plantco),
      componentCode: r.componentCode,
      description: getComponentDescriptionByCode(r.componentCode),
      date: defaultDate,
    }));

  if (plantLines.length > 0) return plantLines;

  return getAggregatedComponents(row.cbuCode, fgMaterial)
    .filter((c) => c.openPOStock > 0)
    .map((c) => ({
      id: `all__${c.componentCode}`,
      plantCode: "—",
      plantName: "All plants",
      componentCode: c.componentCode,
      description: getComponentDescriptionByCode(c.componentCode),
      date: defaultDate,
    }));
}

function MonthYearInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const hiddenRef = useRef<HTMLInputElement>(null);

  const toDisplay = (v: string) =>
    v.length === 7 ? `${v.slice(5, 7)}-${v.slice(0, 4)}` : "";

  const [text, setText] = useState(() => toDisplay(value));

  useEffect(() => {
    setText(toDisplay(value));
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    const m = raw.match(/^(\d{2})-(\d{4})$/);
    if (m) onChange(`${m[2]}-${m[1]}`);
  };

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        value={text}
        onChange={handleTextChange}
        placeholder="mm-yyyy"
        maxLength={7}
        className="text-xs px-2 py-1 pr-7 rounded-lg"
        style={{ border: "1px solid #d1d5db", color: text ? C.navy : "#94a3b8", width: 90 }}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => (hiddenRef.current as any)?.showPicker?.()}
        className="absolute right-1.5 top-1/2 -translate-y-1/2"
      >
        <Calendar size={12} style={{ color: "#94a3b8" }} />
      </button>
      <input
        ref={hiddenRef}
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        className="absolute opacity-0 pointer-events-none w-0 h-0"
      />
    </div>
  );
}

function OpenPoWeekMonthEditor({
  week,
  month,
  onWeekChange,
  onMonthChange,
}: {
  week: string;
  month: string;
  onWeekChange: (week: string) => void;
  onMonthChange: (month: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <MonthYearInput value={month} onChange={onMonthChange} />
      <label className="flex items-center gap-1.5">
        <span className="text-[10px] font-medium shrink-0" style={{ color: "#64748b" }}>
          Wk
        </span>
        <select
          value={week}
          onChange={(e) => onWeekChange(e.target.value)}
          className="text-xs px-2 py-1 rounded-lg"
          style={{ border: "1px solid #d1d5db", color: week ? C.navy : "#94a3b8", minWidth: 52 }}
        >
          <option value="" disabled>Week</option>
          {PO_WEEK_OPTIONS.map((w) => (
            <option key={w} value={w}>
              W{w}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function DateWeekEditor({
  date,
  onChange,
}: {
  date: string; // "dd-mm-yyyy"
  onChange: (date: string) => void;
}) {
  const hiddenRef = useRef<HTMLInputElement>(null);

  const toIso = (v: string) => {
    const m = v.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
  };

  const fromIso = (v: string) => {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
  };

  const calcWeek = (v: string) => {
    const m = v.match(/^(\d{2})-\d{2}-\d{4}$/);
    return m ? Math.min(5, Math.ceil(parseInt(m[1]) / 7)) : null;
  };

  const [text, setText] = useState(date);

  useEffect(() => {
    setText(date);
  }, [date]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) onChange(raw);
  };

  const week = calcWeek(date);

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center">
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder="dd-mm-yyyy"
          maxLength={10}
          className="text-xs px-2 py-1 pr-7 rounded-lg"
          style={{ border: "1px solid #d1d5db", color: text ? C.navy : "#94a3b8", width: 130 }}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => (hiddenRef.current as any)?.showPicker?.()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2"
        >
          <Calendar size={12} style={{ color: "#94a3b8" }} />
        </button>
        <input
          ref={hiddenRef}
          type="date"
          value={toIso(date)}
          onChange={(e) => onChange(fromIso(e.target.value))}
          tabIndex={-1}
          className="absolute opacity-0 pointer-events-none w-0 h-0"
        />
      </div>
      {week !== null && (
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap"
          style={{ backgroundColor: C.bgBlue, color: C.blue }}
        >
          Wk {week}
        </span>
      )}
    </div>
  );
}

function OpenPoAssumptionsPanel({ lines }: { lines: OpenPoAssumptionLine[] }) {
  const lineKey = useMemo(() => lines.map((l) => l.id).join("|"), [lines]);
  const [lineDates, setLineDates] = useState<Record<string, string>>({});

  useEffect(() => {
    setLineDates(Object.fromEntries(lines.map((l) => [l.id, l.date])));
  }, [lineKey, lines]);

  return (
    <div style={{ borderTop: "1px solid #f1f5f9" }}>
      <div className="px-4 py-4">
        <p className="text-xs font-semibold mb-2" style={{ color: C.navy }}>
          Open PO
        </p>
        <div
          className="overflow-x-auto rounded-lg"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                {[
                  "Plant code",
                  "Plant name",
                  "Component code",
                  "Desc",
                  "Date · Week",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                    style={{ color: "#64748b" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center italic"
                    style={{ color: "#94a3b8" }}
                  >
                    No open POs for this CBU
                  </td>
                </tr>
              ) : (
                lines.map((line) => {
                  const date = lineDates[line.id] ?? line.date;
                  return (
                    <tr key={line.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: C.blue }}>
                        {line.plantCode}
                      </td>
                      <td className="px-3 py-2.5 font-medium" style={{ color: C.navy }}>
                        {line.plantName}
                      </td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: C.navy }}>
                        {line.componentCode}
                      </td>
                      <td
                        className="px-3 py-2.5 max-w-[200px] truncate"
                        style={{ color: "#64748b" }}
                        title={line.description}
                      >
                        {line.description}
                      </td>
                      <td className="px-3 py-2.5">
                        <DateWeekEditor
                          date={date}
                          onChange={(d) =>
                            setLineDates((prev) => ({ ...prev, [line.id]: d }))
                          }
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MoqBreakMaterialRow({
  mat,
  canBreak,
  expanded,
  onToggleExpand,
  onToggleBreak,
}: {
  mat: (typeof MOQ_BREAK_MATERIALS)[number];
  canBreak: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleBreak: (next: boolean) => void;
}) {
  const suppliers = MOQ_BREAK_SUPPLIERS[mat.code] ?? [];

  return (
    <div style={{ borderTop: "1px solid #f8fafc" }}>
      <div
        className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 transition-colors"
        style={{
          backgroundColor: expanded ? "#EDF5F4" : undefined,
          outline: expanded ? "2px solid #1565C0" : undefined,
          outlineOffset: expanded ? -1 : undefined,
        }}
      >
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex items-center gap-2 min-w-0 text-left"
        >
          {expanded ? (
            <ChevronDown size={13} style={{ color: C.blue, flexShrink: 0 }} />
          ) : (
            <ChevronRight size={13} style={{ color: C.blue, flexShrink: 0 }} />
          )}
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
            style={{ backgroundColor: mat.badgeBg, color: mat.badgeColor }}
          >
            {mat.type}
          </span>
          <ComponentCodeWithDesc code={mat.code} description={mat.description} />
        </button>
        <ToggleSwitch
          checked={canBreak}
          onChange={onToggleBreak}
          label={canBreak ? "Can break" : "Cannot break"}
        />
      </div>

      {expanded && (
        <div
          style={{
            backgroundColor: "#EDF5F4",
            borderTop: "1px solid rgba(21,101,192,0.12)",
          }}
        >
          <div className="px-4 py-2">
            <span
              className="flex items-center gap-2 text-xs font-semibold"
              style={{ color: C.blue }}
            >
              <span style={{ color: "rgba(21,101,192,0.6)" }}>└</span>
              Suppliers &amp; MOQ break confidence
            </span>
          </div>
          {suppliers.length === 0 ? (
            <p
              className="px-4 pb-3 text-xs italic"
              style={{ color: "#64748b" }}
            >
              No supplier data for this material
            </p>
          ) : (
            suppliers.map((supplier) => (
              <div
                key={supplier.name}
                className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3"
                style={{
                  borderTop: "1px solid rgba(21,101,192,0.08)",
                  backgroundColor: "#ffffff",
                }}
              >
                <div className="flex items-center gap-2 min-w-0 pl-3">
                  <span
                    className="text-xs shrink-0"
                    style={{ color: "rgba(21,101,192,0.6)" }}
                  >
                    ⌞
                  </span>
                  <span className="text-xs font-semibold" style={{ color: C.navy }}>
                    {supplier.name}
                  </span>
                </div>
                <ConfidenceScoreBar score={supplier.confidenceScore} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

type FeedStockStatus = "unique" | "shared" | "needed";

function feedStockStatus(
  code: string,
  feedStockIds: Record<string, string>,
  materials: MoqBreakMaterial[],
): FeedStockStatus {
  const val = (feedStockIds[code] ?? "").trim();
  if (!val) return "needed";
  const mat = materials.find((m) => m.code === code);
  if (mat?.sharedCbus && mat.sharedCbus.length > 0) return "shared";
  return "unique";
}

const FEED_STOCK_STATUS_META: Record<
  FeedStockStatus,
  { bg: string; color: string; label: string }
> = {
  unique: { bg: "#dcfce7", color: "#166534", label: "Unique" },
  shared: { bg: "#dbeafe", color: "#1d4ed8", label: "Shared across CBUs" },
  needed: { bg: "#fef3c7", color: "#b45309", label: "Data needed" },
};

function FeedStockAllocationRow({
  mat,
  value,
  conv,
  status,
  selectedCbu,
  onChange,
  onConvChange,
  onSelectCbu,
}: {
  mat: MoqBreakMaterial;
  value: string;
  conv: string;
  status: FeedStockStatus;
  selectedCbu?: string;
  onChange: (next: string) => void;
  onConvChange: (next: string) => void;
  onSelectCbu?: (cbu: string) => void;
}) {
  const statusMeta = FEED_STOCK_STATUS_META[status];
  const isShared = status === "shared";
  const isNeeded = status === "needed";

  return (
    <div
      className="px-4 py-2.5"
      style={{
        borderTop: "1px solid #f8fafc",
        backgroundColor: isShared ? "#eff6ff" : undefined,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
          style={{ backgroundColor: mat.badgeBg, color: mat.badgeColor }}
        >
          {mat.type}
        </span>
        <span className="text-sm font-medium" style={{ color: C.navy }}>
          {mat.code}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Feed stock name / ID"
          className="px-3 py-1.5 rounded-lg text-xs focus:outline-none"
          style={{ border: "1px solid #d1d5db", minWidth: 200, color: "#111827" }}
        />
        <input
          type="text"
          value={conv}
          onChange={(e) => onConvChange(e.target.value)}
          placeholder="Conv."
          className="px-3 py-1.5 rounded-lg text-xs text-center focus:outline-none"
          style={{ border: "1px solid #d1d5db", width: 68, color: "#111827" }}
        />
        <span
          className="px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap text-center"
          style={{ backgroundColor: statusMeta.bg, color: statusMeta.color, minWidth: 92 }}
        >
          {statusMeta.label}
        </span>
      </div>
      </div>

      {isNeeded && (
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <span className="text-xs" style={{ color: "#b45309" }}>
            Feed stock not available? Request it from the supplier.
          </span>
          <button
            type="button"
            onClick={() =>
              toast.success(`Feed stock request sent to supplier for ${mat.code}`)
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: "#b45309" }}
          >
            <Send size={12} />
            Request from supplier
          </button>
        </div>
      )}

      {isShared && (
        <div className="mt-2.5">
          <p className="text-xs" style={{ color: "#1d4ed8" }}>
            Feed stock <span className="font-bold">{value}</span> is available, but it
            feeds multiple CBUs. Select which CBU to continue producing with, then send
            that choice to the supplier.
          </p>
          <p
            className="uppercase mt-2.5 mb-1.5"
            style={{
              color: "#1d4ed8",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.08em",
              fontWeight: 700,
            }}
          >
            Continue with CBU
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {mat.sharedCbus?.map((cbu) => {
              const isSelected = cbu === selectedCbu;
              return (
                <button
                  key={cbu}
                  type="button"
                  onClick={() => onSelectCbu?.(cbu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={
                    isSelected
                      ? { backgroundColor: C.navy, color: "#ffffff" }
                      : {
                          backgroundColor: "#ffffff",
                          color: C.navy,
                          border: "1px solid #93c5fd",
                        }
                  }
                >
                  {isSelected && <Check size={12} />}
                  {cbu}
                  {isSelected ? " (this CBU)" : ""}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() =>
              toast.success(
                `Sent CBU choice (${selectedCbu ?? "—"}) to supplier for ${mat.code}`,
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white mt-2.5"
            style={{ backgroundColor: C.blue }}
          >
            <Send size={12} />
            Send to supplier
          </button>
        </div>
      )}
    </div>
  );
}

function SimulationAssumptionsStep({
  newCbuRow,
}: {
  newCbuRow: CBURow | null;
}) {
  const [networkTransitionDate, setNetworkTransitionDate] = useState("");
  const [openPoCancel, setOpenPoCancel] = useState(false);
  const [poIncluded, setPoIncluded] = useState(true);
  const [rmpmWeek, setRmpmWeek] = useState("");
  const [rmpmMonth, setRmpmMonth] = useState("");
  const [moqBreak, setMoqBreak] = useState<Record<string, boolean>>({
    "65284824": false,
    "65428959": false,
    "RM-XCBU-01": false,
  });
  const [iutLanes, setIutLanes] = useState<Record<string, boolean>>({
    "U535→UTR": true,
    "UTR→U535": true,
  });
  const [expandedIutLanes, setExpandedIutLanes] = useState<Record<string, boolean>>({});
  const [expandedMoqMaterials, setExpandedMoqMaterials] = useState<Record<string, boolean>>({});
  const [feedStockIds, setFeedStockIds] = useState<Record<string, string>>({
    "65284824": "FS-65284824",
    "65428959": "",
    "RM-XCBU-01": "FS-XCBU-77",
  });
  const [feedStockConv, setFeedStockConv] = useState<Record<string, string>>({
    "65284824": "1.00",
    "65428959": "",
    "RM-XCBU-01": "1.25",
  });
  const [feedStockSelectedCbu, setFeedStockSelectedCbu] = useState<Record<string, string>>({
    "RM-XCBU-01": "VAFA1R3",
  });

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const newCbuOpenPoLines = useMemo(
    () => (newCbuRow ? buildOpenPoLinesForCbu(newCbuRow) : []),
    [newCbuRow],
  );

  return (
    <StepSection
      step={2}
      title="Simulation Assumptions"
      subtitle="Configure assumptions before running scenarios."
    >
      <div className="space-y-3">
        <div
          className="rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: C.bgBlue }}
            >
              <Clock size={18} style={{ color: C.blue }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: C.navy }}>
                Network transition pre-defined date
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                Transition date (today onwards)
              </p>
            </div>
          </div>
          <AssumptionDateInput
            value={networkTransitionDate}
            onChange={setNetworkTransitionDate}
            min={todayIso}
          />
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: C.bgBlue }}
              >
                <ShoppingCart size={18} style={{ color: C.blue }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: C.navy }}>
                  Open PO assumptions
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                  1 PO line — 1,500 units total
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={openPoCancel}
              onChange={setOpenPoCancel}
              label="Open POs can be cancelled"
            />
          </div>

          {openPoCancel && (
            <div
              className="px-4 pb-4"
              style={{ borderTop: "1px solid #f1f5f9" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
                <span style={{ color: "#64748b" }}>
                  1 of 1 included — 1,500 units active
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex text-xs items-center gap-1 px-2.5 py-1 rounded-full font-semibold transition-colors"
                    style={{
                      backgroundColor: poIncluded ? "#dcfce7" : "#f1f5f9",
                      color: poIncluded ? "#166534" : "#94a3b8",
                    }}
                    onClick={() => setPoIncluded(true)}
                  >
                    <Check size={12} />
                    Include all
                  </button>
                  <button
                    type="button"
                    className="flex text-xs items-center gap-1 px-2.5 py-1 rounded-full font-semibold transition-colors"
                    style={{
                      backgroundColor: !poIncluded ? "#fee2e2" : "#f1f5f9",
                      color: !poIncluded ? "#b91c1c" : "#94a3b8",
                    }}
                    onClick={() => setPoIncluded(false)}
                  >
                    <X size={12} />
                    Exclude all
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid #e2e8f0" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc" }}>
                      {["INCL.", "PLANT", "COMPONENT", "OPEN PO QTY", "UOM", "STATUS"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-3 py-2 text-left font-semibold"
                            style={{ color: "#64748b" }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={poIncluded}
                          onChange={(e) => setPoIncluded(e.target.checked)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium">U535</td>
                      <td className="px-3 py-2">
                        <ComponentCodeWithDesc code="65284824" />
                      </td>
                      <td className="px-3 py-2 font-bold">1,500</td>
                      <td className="px-3 py-2">EA</td>
                      <td className="px-3 py-2">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{
                            backgroundColor: poIncluded ? "#dcfce7" : "#fee2e2",
                            color: poIncluded ? "#166534" : "#b91c1c",
                          }}
                        >
                          {poIncluded ? "Included" : "Excluded"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: C.bgBlue }}
              >
                <Calendar size={18} style={{ color: C.blue }} />
              </div>
              <div>
                <p className="text-sm font-bold flex items-center gap-2" style={{ color: C.navy }}>
                  RMPM connectivity date
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}
                  >
                    Mandatory
                  </span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                  {newCbuRow
                    ? `RM/PM material delivery date · New CBU ${newCbuRow.cbuCode}`
                    : "RM/PM material delivery date"}
                </p>
              </div>
            </div>
            {!newCbuRow && (
              <OpenPoWeekMonthEditor
                week={rmpmWeek}
                month={rmpmMonth}
                onWeekChange={setRmpmWeek}
                onMonthChange={setRmpmMonth}
              />
            )}
          </div>

          {newCbuRow && (
            <OpenPoAssumptionsPanel lines={newCbuOpenPoLines} />
          )}
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <div className="px-4 py-3 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: C.bgBlue }}
            >
              <ArrowLeftRight size={18} style={{ color: C.blue }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: C.navy }}>
                IUT feasibility
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                Mark which plant-to-plant lanes are possible for inter-unit transfers
              </p>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #f1f5f9" }}>
            {IUT_TRANSFER_LANES.map((lane) => {
              const laneKey = `${lane.from}→${lane.to}`;
              return (
                <IutLaneRow
                  key={laneKey}
                  lane={lane}
                  possible={iutLanes[laneKey]}
                  expanded={!!expandedIutLanes[laneKey]}
                  onToggleExpand={() =>
                    setExpandedIutLanes((prev) => ({ ...prev, [laneKey]: !prev[laneKey] }))
                  }
                  onTogglePossible={() =>
                    setIutLanes((prev) => ({ ...prev, [laneKey]: !prev[laneKey] }))
                  }
                />
              );
            })}
          </div>
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <div className="px-4 py-3 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: C.bgBlue }}
            >
              <Box size={18} style={{ color: C.blue }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: C.navy }}>
                MOQ break possibility
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                Mark whether the MOQ can be broken for each material
              </p>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #f1f5f9" }}>
            {MOQ_BREAK_MATERIALS.map((mat) => (
              <MoqBreakMaterialRow
                key={mat.code}
                mat={mat}
                canBreak={moqBreak[mat.code]}
                expanded={!!expandedMoqMaterials[mat.code]}
                onToggleExpand={() =>
                  setExpandedMoqMaterials((prev) => ({ ...prev, [mat.code]: !prev[mat.code] }))
                }
                onToggleBreak={(next) =>
                  setMoqBreak((prev) => ({ ...prev, [mat.code]: next }))
                }
              />
            ))}
          </div>
        </div>

        {/* <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <div className="px-4 py-3 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: C.bgBlue }}
            >
              <Shuffle size={18} style={{ color: C.blue }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: C.navy }}>
                Feed stock allocation
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                Sample availability is pre-filled to illustrate each state — edit as needed. If one feed stock makes several materials, confirm with the supplier which to produce.
              </p>
            </div>
          </div>

          {(() => {
            const neededCount = MOQ_BREAK_MATERIALS.filter(
              (mat) => feedStockStatus(mat.code, feedStockIds, MOQ_BREAK_MATERIALS) === "needed",
            ).length;
            if (neededCount === 0) return null;
            return (
              <div className="px-4 pb-3">
                <div
                  className="px-3 py-2 flex items-center gap-2 rounded-lg"
                  style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}
                >
                  <AlertTriangle size={13} style={{ color: "#d97706", flexShrink: 0 }} />
                  <span className="text-xs" style={{ color: "#92400e" }}>
                    <span className="font-bold">Feed stock data needed</span> for{" "}
                    {neededCount} material{neededCount > 1 ? "s" : ""}. Request feed
                    stock details from the supplier/user to validate these scenarios.
                  </span>
                </div>
              </div>
            );
          })()}

          <div style={{ borderTop: "1px solid #f1f5f9" }}>
            {MOQ_BREAK_MATERIALS.map((mat) => (
              <FeedStockAllocationRow
                key={mat.code}
                mat={mat}
                value={feedStockIds[mat.code] ?? ""}
                conv={feedStockConv[mat.code] ?? ""}
                status={feedStockStatus(mat.code, feedStockIds, MOQ_BREAK_MATERIALS)}
                selectedCbu={feedStockSelectedCbu[mat.code]}
                onChange={(next) =>
                  setFeedStockIds((prev) => ({ ...prev, [mat.code]: next }))
                }
                onConvChange={(next) =>
                  setFeedStockConv((prev) => ({ ...prev, [mat.code]: next }))
                }
                onSelectCbu={(cbu) =>
                  setFeedStockSelectedCbu((prev) => ({ ...prev, [mat.code]: cbu }))
                }
              />
            ))}
          </div>
        </div> */}
      </div>
    </StepSection>
  );
}

const PREDEFINED_DETAIL = {
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


export function ScenarioIcon({
  icon,
  isAccepted,
}: {
  icon: ScenarioRow["icon"];
  isAccepted?: boolean;
}) {
  const base = "w-8 h-8 rounded-full flex items-center justify-center shrink-0";
  switch (icon) {
    case "no-action":
      return (
        <div
          className={base}
          style={{ backgroundColor: isAccepted ? C.blue : C.bgBlue }}
        >
          <Check
            size={16}
            color={isAccepted ? "#fff" : C.blue}
            strokeWidth={isAccepted ? 3 : 2}
          />
        </div>
      );
    case "iut":
      return (
        <div className={base} style={{ backgroundColor: C.bgBlue }}>
          <ArrowLeftRight size={16} style={{ color: C.blue }} />
        </div>
      );
    case "iut-moq":
      return (
        <div
          className={base}
          style={{ backgroundColor: isAccepted ? C.blue : "#ede9fe" }}
        >
          <Star
            size={16}
            style={{ color: isAccepted ? "#fff" : "#7c3aed" }}
            fill={isAccepted ? "currentColor" : "none"}
          />
        </div>
      );
    case "moq":
      return (
        <div className={base} style={{ backgroundColor: "#f3e8ff" }}>
          <ShoppingCart size={16} style={{ color: "#9333ea" }} />
        </div>
      );
    case "break":
      return (
        <div className={base} style={{ backgroundColor: "#fef3c7" }}>
          <Zap size={16} style={{ color: "#d97706" }} />
        </div>
      );
    case "custom":
      return (
        <div className={base} style={{ backgroundColor: "#ecfdf5" }}>
          <Pencil size={16} style={{ color: "#e11d48" }} />
        </div>
      );
  }
}

function ProjectNameInput({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (name: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const updatePanelPosition = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setPanelStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest("[data-project-dropdown-panel]")
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = PROJECT_NAME_OPTIONS.filter(
    (opt) => !value.trim() || opt.toLowerCase().includes(value.toLowerCase()),
  );

  const panel =
    open && filtered.length > 0 ? (
      <div
        data-project-dropdown-panel
        className="rounded-xl overflow-hidden"
        style={{
          ...panelStyle,
          backgroundColor: "#ffffff",
          border: `1.5px solid ${C.borderBlue}`,
          boxShadow: "0 8px 24px rgba(21,101,192,0.15)",
        }}
      >
        <ul className="max-h-48 overflow-y-auto py-1" role="listbox">
          {filtered.map((opt) => {
            const selected = value === opt;
            return (
              <li key={opt}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{ backgroundColor: selected ? C.bgBlue : "transparent" }}
                  onMouseEnter={(e) => {
                    if (!selected)
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    if (!selected)
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  }}
                >
                  <span
                    className="flex-1 text-sm"
                    style={{ color: selected ? C.blue : "#111827" }}
                  >
                    {opt}
                  </span>
                  {selected && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: C.blue }}
                    >
                      <Check size={12} color="#ffffff" strokeWidth={3} />
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    ) : null;

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <p className="text-xs font-semibold mb-1.5" style={{ color: disabled ? "#94a3b8" : C.navy }}>
        Project Name
      </p>
      <div
        ref={wrapperRef}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          backgroundColor: disabled ? "#f8fafc" : "#ffffff",
          border: `1.5px solid ${disabled ? "#e2e8f0" : open ? C.borderBlue : "#d1d5db"}`,
          boxShadow: disabled ? "none" : open ? "0 4px 16px rgba(21,101,192,0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
          cursor: disabled ? "not-allowed" : undefined,
        }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: disabled ? "#f1f5f9" : C.bgBlue, color: disabled ? "#cbd5e1" : C.blue }}
        >
          <Sparkles size={18} />
        </div>
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => { if (!disabled) setOpen(true); }}
          placeholder={disabled ? "Select Old CBU first" : "Type or select project name..."}
          className="flex-1 min-w-0 text-sm bg-transparent focus:outline-none"
          style={{ color: value ? "#111827" : undefined, cursor: disabled ? "not-allowed" : undefined }}
        />
        <ChevronDown size={18} style={{ color: disabled ? "#cbd5e1" : "#94a3b8" }} className="shrink-0" />
      </div>
      {panel && createPortal(panel, document.body)}
    </div>
  );
}

function CBUSearchDropdown({
  label,
  row,
  onSelect,
  placeholder = "Select a CBU",
  disabled = false,
}: {
  label: string;
  row: CBURow | null;
  onSelect: (srNo: number) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updatePanelPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPanelStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest("[data-cbu-dropdown-panel]")
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = cbuData.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      item.cbuCode.toLowerCase().includes(q) ||
      item.cbuDescription.toLowerCase().includes(q)
    );
  });

  const handleSelect = (srNo: number) => {
    onSelect(srNo);
    setOpen(false);
    setSearch("");
  };

  const panel = open ? (
    <div
      data-cbu-dropdown-panel
      className="rounded-xl overflow-hidden"
      style={{
        ...panelStyle,
        backgroundColor: "#ffffff",
        border: `1.5px solid ${C.borderBlue}`,
        boxShadow: "0 8px 24px rgba(21,101,192,0.15)",
      }}
    >
      <div className="p-3" style={{ borderBottom: "1px solid #e5e7eb" }}>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "#94a3b8" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or description..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none"
            style={{
              border: `1.5px solid ${C.borderBlue}`,
              color: "#111827",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            autoFocus
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
        {filtered.length === 0 ? (
          <li
            className="px-4 py-6 text-center text-sm"
            style={{ color: "#94a3b8" }}
          >
            No CBU found
          </li>
        ) : (
          filtered.map((item) => {
            const selected = row != null && item.srNo === row.srNo;
            return (
              <li key={item.srNo}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleSelect(item.srNo)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{
                    backgroundColor: selected ? C.bgBlue : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "#f8fafc";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "transparent";
                    }
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: selected ? "#dbeafe" : "#f1f5f9",
                      color: selected ? C.blue : "#94a3b8",
                    }}
                  >
                    <Box size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-sm truncate"
                      style={{ color: selected ? C.blue : "#111827" }}
                    >
                      {item.cbuCode}
                    </p>
                    <p
                      className="text-xs truncate mt-0.5"
                      style={{ color: "#64748b" }}
                    >
                      {item.cbuDescription}
                    </p>
                  </div>
                  {selected && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: C.blue }}
                    >
                      <Check size={12} color="#ffffff" strokeWidth={3} />
                    </div>
                  )}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  ) : null;

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <p
        className="text-xs font-semibold mb-1.5"
        style={{ color: disabled ? "#94a3b8" : C.navy }}
      >
        {label}
      </p>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => { if (!disabled) setOpen((o) => !o); }}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
        style={{
          backgroundColor: disabled ? "#f8fafc" : "#ffffff",
          border: `1.5px solid ${disabled ? "#e2e8f0" : open ? C.borderBlue : "#d1d5db"}`,
          boxShadow: disabled ? "none" : open ? "0 4px 16px rgba(21,101,192,0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
          cursor: disabled ? "not-allowed" : undefined,
        }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: disabled ? "#f1f5f9" : C.bgBlue, color: disabled ? "#cbd5e1" : C.blue }}
        >
          <Box size={18} />
        </div>
        <div className="flex-1 min-w-0">
          {row ? (
            <>
              <p
                className="font-bold text-sm truncate"
                style={{ color: C.blue }}
              >
                {row.cbuCode}
              </p>
              <p
                className="text-xs truncate mt-0.5"
                style={{ color: "#64748b" }}
              >
                {row.cbuDescription}
              </p>
            </>
          ) : (
            <p className="font-medium text-sm" style={{ color: disabled ? "#cbd5e1" : "#94a3b8" }}>
              {disabled ? "Select Old CBU first" : placeholder}
            </p>
          )}
        </div>
        <ChevronDown size={18} style={{ color: disabled ? "#cbd5e1" : "#94a3b8" }} className="shrink-0" />
      </button>

      {panel && createPortal(panel, document.body)}
    </div>
  );
}

function MetricPod({
  label,
  value,
  valueColor = C.navy,
  muted = false,
  preview = false,
}: {
  label: string;
  value: string | null;
  valueColor?: string;
  muted?: boolean;
  preview?: boolean;
}) {
  return (
    <div
      className="flex-1 min-w-[100px] px-3 py-2 rounded-xl"
      style={{
        backgroundColor: preview ? "#f1f5f9" : "#f8fafc",
        border: preview ? "1px dashed #cbd5e1" : undefined,
      }}
    >
      <p
        className="text-[10px] font-semibold tracking-wide mb-0.5 uppercase"
        style={{ color: "#94a3b8" }}
      >
        {label}{preview ? " (projected)" : ""}
      </p>
      <p
        className="text-sm font-bold truncate"
        style={{
          color: muted
            ? preview
              ? "#94a3b8"
              : "#e2e8f0"
            : valueColor,
        }}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}

function getStockSubColumns(stockExpanded: boolean): string[] {
  if (!stockExpanded) return ["On-hand stock", "Open PO qty"];
  return ["On-hand stock", ...ON_HAND_EXPAND_COLUMNS, "Open PO qty"];
}

function getBreakdownColumnCount(stockExpanded: boolean): number {
  return 1 + getStockSubColumns(stockExpanded).length + BREAKDOWN_TAIL_COLUMNS.length;
}

function getStockColumnCount(stockExpanded: boolean): number {
  return getStockSubColumns(stockExpanded).length;
}

function isOnHandParentCol(colIdx: number, stockExpanded: boolean) {
  return stockExpanded && colIdx === 1;
}

function isStockBreakdownCol(colIdx: number, stockExpanded: boolean) {
  return stockExpanded && colIdx >= 2 && colIdx <= 1 + ON_HAND_EXPAND_COLUMNS.length;
}

function getBorderIndices(stockExpanded: boolean) {
  const stockColCount = getStockColumnCount(stockExpanded);
  const uomIdx = 1 + stockColCount;
  const fgUomIdx = uomIdx + 3;
  const section = new Set([0, uomIdx, fgUomIdx]);
  const column = new Set([fgUomIdx + 1, fgUomIdx + 2, fgUomIdx + 3]);
  return { section, column };
}

function breakdownColBorder(
  colIndex: number,
  stockExpanded: boolean,
  isHeader = false,
): React.CSSProperties {
  const { section, column } = getBorderIndices(stockExpanded);

  if (section.has(colIndex)) {
    return {
      borderRight: isHeader
        ? "1px solid rgba(255,255,255,0.3)"
        : "1px solid #cbd5e1",
    };
  }

  if (column.has(colIndex)) {
    return {
      borderRight: isHeader
        ? "1px solid rgba(255,255,255,0.2)"
        : "1px solid #e5e7eb",
    };
  }

  return {
    borderRight: isHeader
      ? "1px solid rgba(255,255,255,0.12)"
      : "1px solid #f1f5f9",
  };
}

function breakdownHeaderStyle(
  colIdx: number,
  stockExpanded: boolean,
  isOnHandToggle: boolean,
): React.CSSProperties {
  const base: React.CSSProperties = {
    color: "#ffffff",
    fontSize: 9,
    cursor: isOnHandToggle ? "pointer" : undefined,
    ...breakdownColBorder(colIdx, stockExpanded, true),
  };

  if (!stockExpanded) return base;

  if (isOnHandParentCol(colIdx, true)) {
    return {
      ...base,
      backgroundColor: EXPANDED_ONHAND_HEADER_BG,
      color: "#1e40af",
      fontWeight: 700,
      borderLeft: EXPANDED_GROUP_BORDER,
    };
  }

  if (isStockBreakdownCol(colIdx, true)) {
    const lastBreakdown = 1 + ON_HAND_EXPAND_COLUMNS.length;
    return {
      ...base,
      backgroundColor: EXPANDED_BREAKDOWN_HEADER_BG,
      color: "#334155",
      borderRight:
        colIdx === lastBreakdown
          ? EXPANDED_GROUP_BORDER
          : "1px solid #dbeafe",
    };
  }

  return base;
}

function breakdownBodyStyle(
  colIdx: number,
  rowIndex: number,
  stockExpanded: boolean,
): React.CSSProperties {
  const base = breakdownColBorder(colIdx, stockExpanded);

  if (!stockExpanded) return base;

  if (isOnHandParentCol(colIdx, true)) {
    return {
      ...base,
      backgroundColor: EXPANDED_ONHAND_CELL_BG,
      borderLeft: EXPANDED_GROUP_BORDER,
    };
  }

  if (isStockBreakdownCol(colIdx, true)) {
    const lastBreakdown = 1 + ON_HAND_EXPAND_COLUMNS.length;
    return {
      ...base,
      backgroundColor: EXPANDED_BREAKDOWN_CELL_BG,
      borderRight:
        colIdx === lastBreakdown
          ? EXPANDED_GROUP_BORDER
          : "1px solid #e2e8f0",
    };
  }

  return base;
}

function getStockCellValues(comp: ComponentBreakdownRow, stockExpanded: boolean): string[] {
  if (!stockExpanded) {
    return [comp.onHandStock, comp.openPoQty];
  }

  return [
    comp.onHandStock,
    comp.onHandBreakdown.unrestricted,
    comp.onHandBreakdown.quality,
    comp.onHandBreakdown.stv,
    comp.onHandBreakdown.blocked,
    comp.onHandBreakdown.total,
    comp.openPoQty,
  ];
}

function getTailCellValues(comp: ComponentBreakdownRow): string[] {
  return [
    comp.uom,
    comp.fgEquivalentStock,
    comp.fgUnitsProducible,
    comp.fgUom,
    comp.consumed,
    comp.leftoverQty,
    comp.leftoverValue,
    comp.prodStopDate,
  ];
}

function tailCellColor(comp: ComponentBreakdownRow, tailIdx: number): string {
  if (tailIdx === 1 && comp.highlightFgEquiv) return "#ea580c";
  if (tailIdx === 5) {
    if (comp.leftoverQty === "Nil") return C.green;
    if (comp.highlightLeftover) return "#dc2626";
  }
  if (tailIdx === 6) {
    if (comp.leftoverValue === "Nil") return C.green;
    if (comp.highlightLeftover) return "#dc2626";
  }
  return "#374151";
}

export function CompactScenarioCard({
  scenario,
  transferId,
}: {
  scenario: ScenarioRow;
  transferId: TransferScenarioId | null;
}) {
  const transfer = transferId
    ? { ...TRANSFER_OPTION_BASE, ...TRANSFER_SCENARIO_CONFIG[transferId] }
    : null;

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col bg-white"
      style={{
        border: `1.5px solid ${scenario.isBest ? C.blue : "#e2e8f0"}`,
        boxShadow: scenario.isBest
          ? "0 4px 12px rgba(21,101,192,0.10)"
          : "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 flex items-center gap-2.5"
        style={{
          backgroundColor: scenario.isBest ? C.navy : "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <ScenarioIcon icon={scenario.icon} isAccepted={scenario.isBest} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-bold text-sm"
              style={{ color: scenario.isBest ? "#fff" : C.navy }}
            >
              {scenario.id.includes("iut") ? `Stock Transfer Options (IUT)` : scenario.name}
            </span>
            {scenario.isBest && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: C.green, color: "#fff" }}
              >
                <Star size={9} fill="currentColor" />
                Best
              </span>
            )}
          </div>
          <p
            className="text-[11px] mt-0.5"
            style={{ color: scenario.isBest ? "rgba(255,255,255,0.6)" : "#64748b" }}
          >
            Next action: {scenario.nextAction}
          </p>
        </div>
      </div>

      {/* 2 × 2 metrics */}
      <div
        className="grid grid-cols-2 divide-x divide-y divide-[#f1f5f9]"
        style={{ borderBottom: transfer ? "1px solid #e2e8f0" : undefined }}
      >
        <div className="px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#94a3b8" }}>
            Business waste
          </p>
          <p className="text-sm font-bold tabular-nums" style={{ color: scenario.wasteColor === "teal" ? C.teal : "#ea580c" }}>
            {scenario.businessWaste ?? "—"}
          </p>
          {scenario.wasteSavings && (
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: C.green }}>
              ↓ {scenario.wasteSavings} saved
            </p>
          )}
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#94a3b8" }}>
            FG days cover
          </p>
          <p className="text-sm font-bold" style={{ color: C.navy }}>{scenario.fgDaysCover}</p>
          <p className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>
            {scenario.dailyRunRate.toLocaleString("en-IN")} units/day
          </p>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#94a3b8" }}>
            Feasible producible
          </p>
          <p className="text-sm font-bold tabular-nums" style={{ color: C.navy }}>
            {scenario.feasibleProducible.toLocaleString("en-IN")} EA
          </p>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#94a3b8" }}>
            Production stop
          </p>
          <p className="text-sm font-bold" style={{ color: C.navy }}>
            {scenario.productionStopDate}
          </p>
        </div>
      </div>

      {/* Transfer summary — compact inline */}
      {transfer && (
        <div className="px-4 py-2.5 space-y-1" style={{ backgroundColor: "#f8fafc" }}>
          <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
            LP Optimal Transfer
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <span
              className="px-1 py-0.5 rounded text-[9px] font-bold"
              style={{
                backgroundColor: transfer.componentType === "RM" ? RM_BADGE.bg : PM_BADGE.bg,
                color: transfer.componentType === "RM" ? RM_BADGE.color : PM_BADGE.color,
              }}
            >
              {transfer.componentType}
            </span>
            <span className="font-semibold" style={{ color: C.navy }}>{transfer.componentCode}</span>
            <span style={{ color: "#64748b" }}>
              {transfer.routeFrom}
              {PLANT_CLUSTER_MAP[transfer.routeFrom] ? ` (${PLANT_CLUSTER_MAP[transfer.routeFrom]})` : ""}
              {" → "}
              {transfer.routeTo}
              {PLANT_CLUSTER_MAP[transfer.routeTo] ? ` (${PLANT_CLUSTER_MAP[transfer.routeTo]})` : ""}
            </span>
            <span className="font-medium" style={{ color: "#374151" }}>
              {transfer.transferQty.toLocaleString("en-IN")} EA
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs" style={{ color: "#64748b" }}>
            <span>
              {transfer.wasteBeforeLabel}{" "}
              <span className="font-semibold" style={{ color: "#991b1b" }}>
                ₹{transfer.wasteBefore.toLocaleString("en-IN")}
              </span>
            </span>
            <span>→</span>
            <span>
              {transfer.wasteAfterLabel}{" "}
              <span className="font-semibold" style={{ color: "#c2410c" }}>
                ₹{transfer.wasteAfter.toLocaleString("en-IN")}
              </span>
            </span>
            <span>
              · Saved{" "}
              <span className="font-semibold" style={{ color: C.green }}>
                ₹{transfer.saved.toLocaleString("en-IN")}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}


export function StockTransferOptionsPanel({ count }: { count: number }) {
  const options = IUT_TRANSFER_OPTIONS.slice(0, count);
  const [selectedId, setSelectedId] = useState<string>("opt1");

  return (
    <div
      className="rounded-xl overflow-hidden bg-white"
      style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}
    >
      {/* Panel header */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid #e2e8f0" }}
      >
        <div className="flex items-center gap-2">
          <ArrowLeftRight size={15} style={{ color: C.blue }} />
          <div>
            <p className="text-sm font-bold" style={{ color: C.navy }}>
              Stock Transfer Options
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
              {options.length} transfer options · Select one to preview its impact on production and waste
            </p>
          </div>
        </div>
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase"
          style={{ backgroundColor: C.bgBlue, color: C.blue }}
        >
          LP Optimised
        </span>
      </div>

      {/* Option cards side by side */}
      <div className="p-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          const saving = opt.businessWasteBefore - opt.businessWasteAfter;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedId(opt.id)}
              className="text-left rounded-xl overflow-hidden transition-all"
              style={{
                border: isSelected
                  ? `2px solid ${C.blue}`
                  : opt.isBest
                  ? `1.5px solid ${C.blue}`
                  : "1.5px solid #e2e8f0",
                boxShadow: isSelected
                  ? "0 4px 14px rgba(21,101,192,0.16)"
                  : opt.isBest
                  ? "0 2px 8px rgba(21,101,192,0.10)"
                  : "0 1px 3px rgba(0,0,0,0.04)",
                background: "white",
              }}
            >
              {/* Card header */}
              <div
                className="px-4 py-2.5 flex items-center justify-between"
                style={{
                  backgroundColor: isSelected || opt.isBest ? C.navy : "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="font-bold text-sm"
                    style={{ color: isSelected || opt.isBest ? "#fff" : C.navy }}
                  >
                    {opt.routeFrom}
                    <span className="mx-1.5 opacity-70">→</span>
                    <span style={{ color: isSelected || opt.isBest ? "#93c5fd" : C.blue }}>
                      {opt.routeTo}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {opt.isBest && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: C.green, color: "#fff" }}
                    >
                      <Star size={9} fill="currentColor" />
                      Best
                    </span>
                  )}
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: isSelected || opt.isBest ? "rgba(255,255,255,0.15)" : "#e2e8f0",
                      color: isSelected || opt.isBest ? "rgba(255,255,255,0.8)" : "#64748b",
                    }}
                  >
                    {opt.label}
                  </span>
                </div>
              </div>

              {/* Detail rows */}
              <div className="divide-y divide-[#f1f5f9]">
                {/* Business waste */}
                <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                    Business Waste
                  </span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: "#dc2626" }}>
                              ₹{opt.businessWasteAfter.toLocaleString("en-IN")} 
                              <span className="inline-flex items-center gap-1 text-xs tabular-nums" style={{ color: C.green }}>
                                  ↓ ₹{saving.toLocaleString("en-IN")}
                              </span>
                  </span>
                </div>

                {/* Material */}
                <div className="px-4 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                    Material
                  </span>
                  {(() => {
                    const [type, ...rest] = opt.material.split(" ");
                    const badge = type === "RM" ? RM_BADGE : type === "PM" ? PM_BADGE : { bg: "#f1f5f9", color: "#64748b" };
                    return (
                      <span className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>
                          {type}
                        </span>
                        <span className="text-[10px] font-bold" style={{ color: C.navy }}>{rest.join(" ")}</span>
                      </span>
                    );
                  })()}
                </div>

                {/* Transfer quantity */}
                <div className="px-4 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                    Transfer Quantity
                  </span>
                  <span className="text-xs font-medium tabular-nums" style={{ color: "#374151" }}>
                    {opt.transferQty.toLocaleString("en-IN")} units
                  </span>
                </div>

                {/* Lane availability */}
                <div className="px-4 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                    Lane Availability
                  </span>
                  {opt.laneAvailable === true ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.green }}>
                      <Check size={12} strokeWidth={2.5} />
                      Available
                    </span>
                  ) : opt.laneAvailable === false ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#ea580c" }}>
                      <Link2Off size={11} />
                      Unavailable
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#d97706" }}>
                      <Clock size={11} />
                      Not configured
                    </span>
                  )}
                </div>

                {/* Cost of transfer */}
                <div className="px-4 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                    Cost of Transfer
                  </span>
                  <span className="text-xs font-medium" style={{ color: "#374151" }}>
                    ₹{opt.costPerTrip.toLocaleString("en-IN")}/trip
                  </span>
                </div>

                {/* Production stop date */}
                <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                    Production Stop Date
                  </span>
                  <span className="text-xs font-semibold" style={{ color: C.navy }}>
                    {opt.prodStopDest}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected option action hint */}
      {selectedId && (
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}
        >
          <p className="text-xs" style={{ color: "#64748b" }}>
            <span className="font-semibold" style={{ color: C.navy }}>
              {options.find((o) => o.id === selectedId)?.label}
            </span>{" "}
            selected · Review the component breakdown below to confirm impact
          </p>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            style={{ backgroundColor: C.navy, color: "#fff" }}
          >
            Raise STO
          </button>
        </div>
      )}
    </div>
  );
}

export function MOQProcurementOptionsPanel() {
  const [selectedPlant, setSelectedPlant] = useState<string>("p_u535");
  const [suppliers, setSuppliers] = useState<Record<string, string>>(
    () => Object.fromEntries(MOQ_PLANT_OPTIONS.map((p) => [p.id, p.suppliers[0].id]))
  );

  return (
    <div
      className="rounded-xl overflow-hidden bg-white"
      style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}
    >
      {/* Panel header */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid #e2e8f0" }}
      >
        <div className="flex items-center gap-2">
          <div>
            <p className="text-sm font-bold" style={{ color: C.navy }}>Procurement Options</p>
            <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
              {MOQ_PLANT_OPTIONS.length} plant options · Select supplier to update procurement data
            </p>
          </div>
        </div>
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase"
          style={{ backgroundColor: C.bgBlue, color: C.blue }}
        >
          LP Optimised
        </span>
      </div>

      {/* Plant option cards */}
      <div className="p-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${MOQ_PLANT_OPTIONS.length}, minmax(0, 1fr))` }}>
        {MOQ_PLANT_OPTIONS.map((plant) => {
          const isSelected = selectedPlant === plant.id;
          const selSup = plant.suppliers.find((s) => s.id === suppliers[plant.id]) ?? plant.suppliers[0];
          return (
            <button
              key={plant.id}
              type="button"
              onClick={() => setSelectedPlant(plant.id)}
              className="text-left rounded-xl overflow-hidden transition-all"
              style={{
                border: isSelected
                  ? `2px solid ${C.blue}`
                  : plant.isBest
                  ? `1.5px solid ${C.blue}`
                  : "1.5px solid #e2e8f0",
                boxShadow: isSelected
                  ? "0 4px 14px rgba(21,101,192,0.16)"
                  : plant.isBest
                  ? "0 2px 8px rgba(21,101,192,0.10)"
                  : "0 1px 3px rgba(0,0,0,0.04)",
                background: "white",
              }}
            >
              {/* Card header */}
              <div
                className="px-4 py-2.5"
                style={{
                  backgroundColor: isSelected || plant.isBest ? C.navy : "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm" style={{ color: isSelected || plant.isBest ? "#fff" : C.navy }}>
                    {plant.plant}
                  </span>
                  {plant.isBest && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: C.green, color: "#fff" }}
                    >
                      <Star size={9} fill="currentColor" />Best
                    </span>
                  )}
                </div>
                {/* Supplier dropdown */}
                <select
                  value={suppliers[plant.id]}
                  onChange={(e) => {
                    e.stopPropagation();
                    setSuppliers((prev) => ({ ...prev, [plant.id]: e.target.value }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-[11px] rounded-lg px-2 py-1 cursor-pointer font-medium"
                  style={{
                    border: `1px solid ${isSelected || plant.isBest ? "rgba(255,255,255,0.3)" : "#cbd5e1"}`,
                    color: isSelected || plant.isBest ? C.navy : C.navy,
                    backgroundColor: isSelected || plant.isBest ? "rgba(255,255,255,0.92)" : "#fff",
                    outline: "none",
                  }}
                >
                  {plant.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Detail rows */}
              <div className="divide-y divide-[#f1f5f9]">
                <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Business Waste</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: "#dc2626" }}>
                    ₹{selSup.bizWaste.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="px-4 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Material</span>
                  {(() => {
                    const [type, ...rest] = plant.material.split(" ");
                    const badge = type === "RM" ? RM_BADGE : type === "PM" ? PM_BADGE : { bg: "#f1f5f9", color: "#64748b" };
                    return (
                      <span className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>
                          {type}
                        </span>
                        <span className="text-[10px] font-bold" style={{ color: C.navy }}>{rest.join(" ")}</span>
                      </span>
                    );
                  })()}
                </div>
                <div className="px-4 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Order Qty</span>
                  <span className="text-xs font-medium tabular-nums" style={{ color: "#374151" }}>
                    {plant.orderQty.toLocaleString("en-IN")} units
                  </span>
                </div>
                <div className="px-4 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>MOQ</span>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: C.navy }}>
                    {selSup.moq.toLocaleString("en-IN")} units
                  </span>
                </div>
                <div className="px-4 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Price / Unit</span>
                  <span className="text-xs font-medium tabular-nums" style={{ color: "#374151" }}>₹{selSup.pricePerUnit}</span>
                </div>
                <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Production Date</span>
                  <span className="text-xs font-semibold" style={{ color: C.navy }}>{selSup.productionDate}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer action */}
      {selectedPlant && (
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}
        >
          <p className="text-xs" style={{ color: "#64748b" }}>
            <span className="font-semibold" style={{ color: C.navy }}>
              {MOQ_PLANT_OPTIONS.find((p) => p.id === selectedPlant)?.plant}
            </span>{" "}
            selected ·{" "}
            <span className="font-semibold" style={{ color: C.navy }}>
              {(() => {
                const p = MOQ_PLANT_OPTIONS.find((pl) => pl.id === selectedPlant)!;
                const s = p.suppliers.find((s) => s.id === suppliers[selectedPlant]) ?? p.suppliers[0];
                return s.name;
              })()}
            </span>{" "}
            as supplier · Review breakdown below to confirm impact
          </p>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            style={{ backgroundColor: C.navy, color: "#fff" }}
          >
            Raise PO
          </button>
        </div>
      )}
    </div>
  );
}

const ON_HAND_BREAKDOWN_ROWS: { key: keyof OnHandBreakdown; label: string }[] = [
  { key: "unrestricted", label: "UNRESTRICTED STOCK" },
  { key: "quality", label: "STOCK IN QUALITY" },
  { key: "stv", label: "STV STOCK" },
  { key: "blocked", label: "BLOCKED STOCK" },
  { key: "total", label: "TOTAL STOCK" },
];

const TRANSPOSED_METRICS = [
  { id: "onHand", label: "ON-HAND STOCK" },
  { id: "openPo", label: "OPEN PO" },
  { id: "fgProducible", label: "FG PRODUCIBLE · EA" },
  { id: "consumed", label: "CONSUMED" },
  { id: "leftoverQty", label: "LEFTOVER QTY" },
  { id: "leftoverValue", label: "LEFTOVER VALUE ₹", highlight: true },
  { id: "prodStop", label: "PROD. STOP DATE" },
] as const;

type TransposedMetricId = (typeof TRANSPOSED_METRICS)[number]["id"];

type TransposedBreakdownColumn = {
  key: string;
  plantCode: string;
  roles: PlantRole[];
  before: ComponentBreakdownRow;
  after: ComponentBreakdownRow | null;
  plantMeta: (typeof PLANT_BREAKDOWN_BASE)[string];
};

function formatPlantRoleLabel(roles: PlantRole[]): string {
  return roles
    .map((r) =>
      r === "source" ? "SOURCE" : r === "destination" ? "DEST" : "ORDERING",
    )
    .join(" + ");
}

function BreakdownLegend() {
  const items = [
    { color: C.green, label: "No waste" },
    { color: "#ea580c", label: "Bottleneck" },
    { color: "#dc2626", label: "Leftover waste" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1 text-[9px] font-semibold" style={{ color: "#64748b" }}>
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function TransposedMetricCell({
  metricId,
  before,
  after,
}: {
  metricId: TransposedMetricId;
  before: ComponentBreakdownRow;
  after: ComponentBreakdownRow | null;
}) {
  const afterRow = after ?? before;

  const renderChange = (
    beforeVal: string,
    afterVal: string,
    render: (value: string) => React.ReactNode,
    colorize = false,
  ) => {
    const changed = after != null && afterVal !== beforeVal && beforeVal !== "—" && afterVal !== "—";
    if (!changed) return render(afterVal);

    const delta = parseIndianNumber(afterVal) - parseIndianNumber(beforeVal);
    const deltaColor = delta > 0 ? C.green : "#dc2626";

    return (
      <div className="flex flex-col items-center text-center leading-tight">
        <div className="text-[10px]" style={{ fontWeight: 700, color: colorize ? deltaColor : "#111827" }}>
          {render(afterVal)}
        </div>
        <div className="mt-0.5 text-[8px] leading-tight" style={{ color: "#94a3b8" }}>
          from {beforeVal}
          {metricId === "onHand" && delta !== 0 && (
            <>
              {" "}
              ·{" "}
              <span style={{ color: deltaColor, fontWeight: 700 }}>
                {delta > 0 ? "+" : ""}
                {formatIndianNumber(delta)}
              </span>
            </>
          )}
        </div>
      </div>
    );
  };

  switch (metricId) {
    case "onHand": {
      const suffix = before.uom === "EA" ? " EA" : "";
      return renderChange(
        before.onHandStock,
        afterRow.onHandStock,
        (v) => `${v}${suffix}`,
        true,
      );
    }
    case "openPo":
      return (
        <span
          className="text-[10px] font-semibold tabular-nums"
          style={{ color: afterRow.openPoQty !== "—" ? C.blue : "#cbd5e1" }}
        >
          {afterRow.openPoQty}
        </span>
      );
    case "fgProducible":
      return renderChange(
        before.fgUnitsProducible,
        afterRow.fgUnitsProducible,
        (v) => v,
        true,
      );
    case "consumed":
      return (
        <span className="text-[10px] tabular-nums font-medium" style={{ color: "#374151" }}>
          {afterRow.consumed}
        </span>
      );
    case "leftoverQty":
      return (
        <span
          className="text-[10px] font-bold tabular-nums"
          style={{
            color:
              afterRow.leftoverQty === "Nil"
                ? C.green
                : afterRow.highlightLeftover
                  ? "#dc2626"
                  : "#374151",
          }}
        >
          {afterRow.leftoverQty}
        </span>
      );
    case "leftoverValue":
      return (
        <span
          className="text-[10px] font-bold tabular-nums"
          style={{
            color:
              afterRow.leftoverValue === "Nil"
                ? C.green
                : afterRow.highlightLeftover
                  ? "#dc2626"
                  : "#374151",
          }}
        >
          {afterRow.leftoverValue}
        </span>
      );
    case "prodStop":
      return (
        <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: C.blue }}>
          {afterRow.prodStopDate}
        </span>
      );
    default:
      return null;
  }
}

function TransposedOnHandBreakdownCell({
  breakdownKey,
  before,
  after,
}: {
  breakdownKey: keyof OnHandBreakdown;
  before: ComponentBreakdownRow;
  after: ComponentBreakdownRow | null;
}) {
  const beforeVal = before.onHandBreakdown[breakdownKey];
  const afterVal = (after ?? before).onHandBreakdown[breakdownKey];
  const changed = after != null && afterVal !== beforeVal && beforeVal !== "—" && afterVal !== "—";

  if (!changed) {
    return (
      <span className="text-[10px] tabular-nums font-medium" style={{ color: "#374151" }}>
        {afterVal}
      </span>
    );
  }

  const delta = parseIndianNumber(afterVal) - parseIndianNumber(beforeVal);
  const deltaColor = delta > 0 ? C.green : "#dc2626";

  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-[10px] font-semibold tabular-nums" style={{ color: "#111827" }}>
        {afterVal}
      </span>
      <span className="mt-0.5 text-[8px] leading-tight" style={{ color: "#94a3b8" }}>
        from {beforeVal}
        {delta !== 0 && (
          <>
            {" "}
            ·{" "}
            <span style={{ color: deltaColor, fontWeight: 700 }}>
              {delta > 0 ? "+" : ""}
              {formatIndianNumber(delta)}
            </span>
          </>
        )}
      </span>
    </div>
  );
}

function TransposedComponentBreakdownTable({
  columns,
  onOpenProductionPlan,
}: {
  columns: TransposedBreakdownColumn[];
  onOpenProductionPlan: (plantCode: string) => void;
}) {
  const [stockExpanded, setStockExpanded] = useState(false);
  const plantGroups = useMemo(() => {
    const groups: {
      plantCode: string;
      roles: PlantRole[];
      plantMeta: (typeof PLANT_BREAKDOWN_BASE)[string];
      columns: TransposedBreakdownColumn[];
    }[] = [];

    for (const col of columns) {
      const existing = groups.find((g) => g.plantCode === col.plantCode);
      if (existing) existing.columns.push(col);
      else {
        groups.push({
          plantCode: col.plantCode,
          roles: col.roles,
          plantMeta: col.plantMeta,
          columns: [col],
        });
      }
    }
    return groups;
  }, [columns]);

  if (columns.length === 0) {
    return (
      <div className="px-3 py-6 text-center italic text-[10px]" style={{ color: "#94a3b8" }}>
        No components match your filter
      </div>
    );
  }

  const metricHeaderStyle: React.CSSProperties = {
    backgroundColor: C.bgBlue,
    color: C.navy,
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: "0.04em",
    borderRight: `1px solid ${C.borderBlue}`,
    minWidth: 100,
    position: "sticky",
    left: 0,
    zIndex: 3,
    textAlign: "center",
  };

  const displayRows = useMemo(() => {
    const rows: Array<
      | { kind: "main"; metric: (typeof TRANSPOSED_METRICS)[number] }
      | { kind: "onHandSub"; breakdownKey: keyof OnHandBreakdown; label: string }
    > = [];

    for (const metric of TRANSPOSED_METRICS) {
      rows.push({ kind: "main", metric });
      if (metric.id === "onHand" && stockExpanded) {
        for (const sub of ON_HAND_BREAKDOWN_ROWS) {
          rows.push({ kind: "onHandSub", breakdownKey: sub.key, label: sub.label });
        }
      }
    }
    return rows;
  }, [stockExpanded]);

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full text-[10px]"
        style={{ borderCollapse: "collapse", minWidth: 680 }}
      >
        <thead>
          <tr style={{ backgroundColor: C.bgBlue }}>
            <th
              rowSpan={2}
              className="px-1.5 py-1 align-middle uppercase"
              style={metricHeaderStyle}
            >
              Metric
            </th>
            {plantGroups.map((group) => {
              const cluster = PLANT_CLUSTER_MAP[group.plantCode];
              return (
                <th
                  key={`plant-${group.plantCode}`}
                  colSpan={group.columns.length}
                  className="px-1.5 py-1 text-center font-bold uppercase tracking-wide"
                  style={{
                    color: C.navy,
                    fontSize: 8,
                    borderRight: `1px solid ${C.borderBlue}`,
                    borderBottom: `1px solid ${C.borderBlue}`,
                  }}
                >
                  <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                    <span className="whitespace-nowrap">
                      <span className="font-bold">{group.plantCode}</span>
                      {cluster && (
                        <span className="ml-1 font-normal" style={{ color: C.blue }}>
                          ({cluster})
                        </span>
                      )}
                      <span className="ml-1.5 font-bold">{formatPlantRoleLabel(group.roles)}</span>
                    </span>
                    <span style={{ color: "#94a3b8" }} aria-hidden>
                      ·
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenProductionPlan(group.plantCode)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold tabular-nums cursor-pointer transition-all hover:brightness-95 active:scale-[0.98] normal-case"
                      style={{
                        color: C.navy,
                        backgroundColor: "#ffffff",
                        border: `1px solid ${C.blue}`,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.14)",
                      }}
                      title="View 19-week production plan breakdown"
                    >
                      Plan {group.plantMeta?.totalProductionPlan}
                      <ExternalLink size={9} strokeWidth={2.5} style={{ color: C.blue }} />
                    </button>
                  </div>
                </th>
              );
            })}
          </tr>
          <tr style={{ backgroundColor: C.bgBlue }}>
            {plantGroups.flatMap((group) =>
              group.columns.map((col) => (
                <th
                  key={col.key}
                  className="px-1.5 py-1 text-center align-top"
                  style={{
                    color: C.navy,
                    borderRight: `1px solid ${C.borderBlue}`,
                    borderTop: `1px solid ${C.borderBlue}`,
                    minWidth: 84,
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold tabular-nums">{col.before.component}</span>
                      <span
                        className="px-0.5 py-px rounded text-[7px] font-bold leading-none"
                        style={{
                          backgroundColor: col.before.type === "PM" ? PM_BADGE.bg : RM_BADGE.bg,
                          color: col.before.type === "PM" ? PM_BADGE.color : RM_BADGE.color,
                        }}
                      >
                        {col.before.type}
                      </span>
                    </div>
                    {col.before.isBottleneck && (
                      <span
                        className="px-1 py-px rounded text-[7px] font-bold uppercase leading-none"
                        style={{ backgroundColor: "#ea580c", color: "#fff" }}
                      >
                        Bottleneck
                      </span>
                    )}
                  </div>
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, rowIdx) => {
            const isSubRow = row.kind === "onHandSub";
            const isHighlight = row.kind === "main" && row.metric.highlight === true;
            const metricCellStyle: React.CSSProperties = {
              backgroundColor: isSubRow
                ? EXPANDED_BREAKDOWN_CELL_BG
                : isHighlight
                  ? "#fff7ed"
                  : rowIdx % 2 === 0
                    ? "#ffffff"
                    : "#f8fafc",
              borderRight: isHighlight ? "2px solid #ea580c" : "1px solid #e2e8f0",
              borderBottom: "1px solid #e2e8f0",
              borderLeft: isSubRow ? EXPANDED_GROUP_BORDER : undefined,
              fontWeight: 700,
              color: isSubRow ? "#475569" : C.navy,
              fontSize: isSubRow ? 7 : 8,
              letterSpacing: "0.03em",
              lineHeight: 1.2,
              position: "sticky",
              left: 0,
              zIndex: 2,
              textAlign: "center",
            };

            const dataBg = isSubRow
              ? EXPANDED_ONHAND_CELL_BG
              : isHighlight
                ? "#fffbeb"
                : rowIdx % 2 === 0
                  ? "#ffffff"
                  : "#f8fafc";

            const rowKey =
              row.kind === "main" ? row.metric.id : `onHand-${row.breakdownKey}`;

            return (
              <tr key={rowKey}>
                <td className="px-1.5 py-1 uppercase whitespace-nowrap align-middle" style={metricCellStyle}>
                  {row.kind === "main" && row.metric.id === "onHand" ? (
                    <button
                      type="button"
                      onClick={() => setStockExpanded((prev) => !prev)}
                      className="inline-flex items-center justify-center gap-0.5 uppercase w-full cursor-pointer hover:opacity-80"
                      style={{ color: "inherit", font: "inherit", letterSpacing: "inherit" }}
                      title={
                        stockExpanded
                          ? "Collapse on-hand stock breakdown"
                          : "Expand on-hand stock breakdown"
                      }
                    >
                      {row.metric.label}
                      {stockExpanded ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
                    </button>
                  ) : (
                    <span className={isSubRow ? "pl-1" : undefined}>
                      {row.kind === "main" ? row.metric.label : row.label}
                    </span>
                  )}
                </td>
                {plantGroups.flatMap((group) =>
                  group.columns.map((col) => (
                    <td
                      key={`${col.key}-${rowKey}`}
                      className="px-1.5 py-1 text-center align-middle tabular-nums leading-tight"
                      style={{
                        backgroundColor: dataBg,
                        borderRight: "1px solid #e2e8f0",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <div className="flex justify-center items-center">
                        {row.kind === "main" ? (
                          <TransposedMetricCell
                            metricId={row.metric.id}
                            before={col.before}
                            after={col.after}
                          />
                        ) : (
                          <TransposedOnHandBreakdownCell
                            breakdownKey={row.breakdownKey}
                            before={col.before}
                            after={col.after}
                          />
                        )}
                      </div>
                    </td>
                  )),
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ScenarioDetailView({
  row,
  scenarioId,
  selTransfer,
  onSelTransfer,
  moqSuppliers,
  onMoqSupplier,
}: {
  row: CBURow;
  scenarioId: string;
  selTransfer: string;
  onSelTransfer: (id: string) => void;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
}) {
  const isCombo = scenarioId === "iut-moq" || scenarioId === "iut-moq-break";

  const cardDefs: { sid: string; transferId: TransferScenarioId | null }[] = isCombo
    ? [
        { sid: "iut", transferId: "iut" },
        { sid: "moq", transferId: "moq" },
      ]
    : [
        {
          sid: scenarioId,
          transferId:
            scenarioId === "iut" ? "iut" : scenarioId === "moq" ? "moq" : null,
        },
      ];

  const breakdownSubtitle = `Metrics × components · ${row.cbuCode}`;

  const [filter, setFilter] = useState("");
  const [productionPlanPlant, setProductionPlanPlant] = useState<string | null>(null);
  // Which MOQ plant is being viewed has no equivalent shared control elsewhere
  // (the expandable scenario row shows all MOQ plants at once), so it stays
  // local to this card — only the IUT option and the per-plant supplier are shared.
  const [selectedMoqPlantId, setSelectedMoqPlantId] = useState(
    () => MOQ_PLANT_OPTIONS.find((p) => p.isBest)?.id ?? MOQ_PLANT_OPTIONS[0].id,
  );

  const showTransferPicker =
    scenarioId === "iut" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break";
  const showMoqPicker =
    scenarioId === "moq" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break";
  const transferPickerOptions = IUT_TRANSFER_OPTIONS.slice(0, scenarioId === "iut-moq" ? 3 : 2);

  const selectedTransfer = showTransferPicker
    ? transferPickerOptions.find((o) => o.id === selTransfer) ?? null
    : null;
  const selectedMoq = showMoqPicker
    ? MOQ_PLANT_OPTIONS.find((p) => p.id === selectedMoqPlantId) ?? null
    : null;

  const activePlantRoles = useMemo(
    () => getActivePlantRoles(scenarioId, selectedTransfer, selectedMoq),
    [scenarioId, selectedTransfer, selectedMoq],
  );

  const plantBlocks = useMemo(
    () =>
      activePlantRoles.map(({ code, roles }) => ({
        code,
        roles,
        rowsByState: computeTransitionRows(code, roles, scenarioId, selectedTransfer, selectedMoq, moqSuppliers),
      })),
    [activePlantRoles, scenarioId, selectedTransfer, selectedMoq, moqSuppliers],
  );

  // Skip a component row entirely if the plant has no real data for it at
  // all (on-hand stock, open PO, and FG-equivalent stock all blank) — an RM
  // or PM row shouldn't render just to show a wall of dashes.
  const hasMeaningfulData = (r: ComponentBreakdownRow) =>
    r.onHandStock !== "—" || r.openPoQty !== "—" || r.fgEquivalentStock !== "—";

  const filterComponents = (rows: ComponentBreakdownRow[], plantCode: string) => {
    const withData = rows.filter(hasMeaningfulData);
    const q = filter.trim().toLowerCase();
    if (!q) return withData;
    return withData.filter(
      (r) =>
        r.component.toLowerCase().includes(q) ||
        plantCode.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q),
    );
  };

  const transposedColumns = useMemo(() => {
    const cols: TransposedBreakdownColumn[] = [];
    for (const block of plantBlocks) {
      const beforeRows = filterComponents(block.rowsByState.before, block.code);
      if (beforeRows.length === 0) continue;
      const matched = new Set(beforeRows.map((r) => r.component));
      const afterByComponent = new Map(
        block.rowsByState.after
          .filter((r) => matched.has(r.component))
          .map((r) => [r.component, r]),
      );
      const plantMeta = PLANT_BREAKDOWN_BASE[block.code];

      for (const before of beforeRows) {
        cols.push({
          key: `${block.code}-${before.component}`,
          plantCode: block.code,
          roles: block.roles,
          before,
          after: afterByComponent.get(before.component) ?? null,
          plantMeta,
        });
      }
    }
    return cols;
  }, [plantBlocks, filter]);

  if (scenarioId === "predefined") {
    const d = PREDEFINED_DETAIL;
    const productionStopDate = "—";
    const savingsAmount = d.moq.originalOrderCost - d.moq.totalOrderCost;

    const summaryRows: { label: string; node: React.ReactNode }[] = [
      { label: "Business Waste",         node: <span className="text-xs font-bold tabular-nums" style={{ color: C.teal }}>{d.businessWaste}</span> },
      { label: "Reduction vs No Action", node: <span className="text-xs font-bold tabular-nums" style={{ color: C.green }}>↓ {d.wasteSavings}</span> },
      { label: "Production Cover",       node: <span className="text-xs font-bold tabular-nums" style={{ color: C.navy }}>{d.fgDaysCover}</span> },
    ];
    const transferRows: { label: string; node: React.ReactNode }[] = [
      { label: "Transfer Location",   node: <span className="text-xs font-semibold" style={{ color: C.navy }}>{d.transfer.from} <span style={{ color: C.blue }}>→</span> {d.transfer.to}</span> },
      { label: "Transfer Quantity",   node: <span className="text-xs tabular-nums" style={{ color: C.navy }}>{d.transfer.qty.toLocaleString("en-IN")} units</span> },
      { label: "Lane Availability",   node: d.transfer.laneAvailable
          ? <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.green }}><Check size={11} strokeWidth={2.5} />Available</span>
          : <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#dc2626" }}><Link2Off size={11} />Unavailable</span> },
      { label: "Cost of Transfer",    node: <span className="text-xs tabular-nums" style={{ color: C.navy }}>₹{d.transfer.costPerTrip.toLocaleString("en-IN")} / trip</span> },
      { label: "Production Stop Date",node: <span className="text-xs font-semibold" style={{ color: "#7c3aed" }}>{productionStopDate}</span> },
    ];
    const moqRows: { label: string; node: React.ReactNode }[] = [
      { label: "MOQ",            node: <span className="text-xs tabular-nums" style={{ color: C.navy }}>{d.moq.qty.toLocaleString("en-IN")} units</span> },
      { label: "Supplier",       node: <span className="text-xs font-semibold" style={{ color: C.navy }}>{d.moq.supplier}</span> },
      { label: "Cost / Unit",    node: <span className="inline-flex items-center gap-2"><span className="text-[10px] line-through tabular-nums" style={{ color: "#94a3b8" }}>₹{d.moq.originalCostPerUnit}</span><span className="text-xs font-bold tabular-nums" style={{ color: C.green }}>₹{d.moq.costPerUnit}</span></span> },
      { label: "Order Cost",     node: <span className="inline-flex items-center gap-2"><span className="text-[10px] line-through tabular-nums" style={{ color: "#94a3b8" }}>₹{d.moq.originalOrderCost.toLocaleString("en-IN")}</span><span className="text-xs font-bold tabular-nums" style={{ color: C.green }}>₹{d.moq.totalOrderCost.toLocaleString("en-IN")}</span></span> },
      { label: "Savings on Order", node: <span className="text-xs font-bold tabular-nums" style={{ color: C.green }}>↓ ₹{savingsAmount.toLocaleString("en-IN")}</span> },
    ];
    const maxRows = Math.max(summaryRows.length, transferRows.length, moqRows.length);

    const cellLabel = (text: string) => (
      <td className="px-3 py-2 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
        style={{ color: "#94a3b8", backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9", width: "12%" }}>
        {text}
      </td>
    );
    const cellValue = (node: React.ReactNode, last?: boolean) => (
      <td className="px-3 py-2"
        style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9", borderRight: last ? undefined : "2px solid #e2e8f0" }}>
        {node}
      </td>
    );
    return (
      <div className="space-y-4 pt-2">
        <div className="rounded-xl px-5 py-3 flex items-center" style={{ backgroundColor: C.navy, boxShadow: "0 1px 4px rgba(0,48,135,0.10)" }}>
          <p className="text-sm font-bold tracking-wide uppercase text-white">Predefined Plan — Details</p>
        </div>
        <div className="rounded-xl overflow-hidden bg-white" style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}>
          <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: C.navy }}>
                <th colSpan={2} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "#93c5fd", borderRight: "2px solid rgba(255,255,255,0.15)" }}>
                  Summary
                </th>
                <th colSpan={2} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "#93c5fd", borderRight: "2px solid rgba(255,255,255,0.15)" }}>
                  Transfer Details
                </th>
                <th colSpan={2} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "#93c5fd" }}>
                  MOQ &amp; Procurement
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxRows }, (_, i) => {
                const s = summaryRows[i];
                const t = transferRows[i];
                const m = moqRows[i];
                return (
                  <tr key={i}>
                    {s ? cellLabel(s.label) : <td style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9", width: "12%" }} />}
                    {s ? cellValue(s.node) : <td style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9", borderRight: "2px solid #e2e8f0" }} />}
                    {t ? cellLabel(t.label) : <td style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9", width: "12%" }} />}
                    {t ? cellValue(t.node) : <td style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9", borderRight: "2px solid #e2e8f0" }} />}
                    {m ? cellLabel(m.label) : <td style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9", width: "12%" }} />}
                    {m ? cellValue(m.node, true) : <td style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9" }} />}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {productionPlanPlant && (
        <ProductionPlanModal
          plantCode={productionPlanPlant}
          cbuCode={row.cbuCode}
          cbuDescription={row.cbuDescription}
          totalProduction={PLANT_BREAKDOWN_BASE[productionPlanPlant]?.totalProductionPlanQty ?? 0}
          onClose={() => setProductionPlanPlant(null)}
        />
      )}
      {/* Dark blue section header */}
      {/* <div
        className="rounded-xl px-5 py-3 flex items-center"
        style={{
          backgroundColor: C.navy,
          boxShadow: "0 1px 4px rgba(0,48,135,0.10)",
        }}
      >
        <p className="text-sm font-bold tracking-wide uppercase text-white">
          Scenario Details
        </p>
      </div> */}
      {/* Compact scenario card(s) */}
      {/* <div className={`grid gap-3 ${isCombo ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
        {cardDefs.map(({ sid, transferId }) => {
          const scenario = SCENARIOS.find((s) => s.id === sid);
          if (!scenario) return null;
          return (
            <CompactScenarioCard key={sid} scenario={scenario} transferId={transferId} />
          );
        })}
      </div> */}

      {/* IUT transfer options panel */}
      {/* {(scenarioId === "iut" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break") && (
        <StockTransferOptionsPanel count={scenarioId === "iut-moq" ? 3 : 2} />
      )} */}

      {/* procurement options panel */}
      {/* {(scenarioId === "moq" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break") && (
        <MOQProcurementOptionsPanel />
      )} */}

          {/* Scenario comparison card — all options as selectable columns + IUT transfer table */}
          {/* <ScenarioDetailCard key={scenarioId} scenarioId={scenarioId} cardDefs={cardDefs} /> */}

      {/* Component breakdown table — not applicable to the Custom scenario */}
      {scenarioId !== CUSTOM_SCENARIO.id && (
      <div
        className="rounded-xl overflow-hidden bg-white"
        style={{
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 4px rgba(0,48,135,0.06)",
        }}
      >
        <div
          className="px-3 py-2 flex flex-wrap items-start justify-between gap-2"
          style={{ borderBottom: "1px solid #e2e8f0" }}
        >
          <div>
            <p className="text-xs font-bold" style={{ color: C.navy }}>
              Component Breakdown by Plant
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>
              {breakdownSubtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BreakdownLegend />
            {showMoqPicker && (
              <>
                <label className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#64748b" }}>
                  MOQ plant
                  <select
                    value={selectedMoqPlantId}
                    onChange={(e) => setSelectedMoqPlantId(e.target.value)}
                    className="pl-1.5 pr-5 py-1 rounded-md text-[10px] cursor-pointer focus:outline-none"
                    style={{ border: "1px solid #d1d5db", color: "#111827" }}
                  >
                    {MOQ_PLANT_OPTIONS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.plant}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedMoq && (
                  <label className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#64748b" }}>
                    Supplier
                    <select
                      value={moqSuppliers[selectedMoq.id] ?? selectedMoq.suppliers[0].id}
                      onChange={(e) => onMoqSupplier(selectedMoq.id, e.target.value)}
                      className="pl-1.5 pr-5 py-1 rounded-md text-[10px] cursor-pointer focus:outline-none"
                      style={{ border: "1px solid #d1d5db", color: "#111827" }}
                      title="Shared with the supplier selected above in the scenario row"
                    >
                      {selectedMoq.suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </>
            )}
            <div className="relative">
              <Search
                size={11}
                className="absolute left-2 top-1/2 -translate-y-1/2"
                style={{ color: "#94a3b8" }}
              />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter plant or component..."
                className="pl-6 pr-2 py-1 rounded-md text-[10px] focus:outline-none"
                style={{
                  border: "1px solid #d1d5db",
                  minWidth: 180,
                  color: "#111827",
                }}
              />
            </div>
          </div>
        </div>

        <TransposedComponentBreakdownTable
          columns={transposedColumns}
          onOpenProductionPlan={setProductionPlanPlant}
        />
      </div>
      )}
    </div>
  );
}
