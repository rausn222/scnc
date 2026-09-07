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
  Box,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Cpu,
  ArrowLeftRight,
  Link2Off,
  Search,
  ShoppingCart,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";
import { useNav } from "../App";
import { cbuData, type CBURow, PLANT_CLUSTER_MAP, getComponentDescriptionByCode, getComponentsByPlant, getRowFgMaterial, getAggregatedComponents } from "../components/data";
import { VCBL1R0_OPEN_POS } from "../components/productionPlanData";
import { PageHeader } from "../components/PageHeader";
import { ProductionPlanModal } from "../components/ProductionPlanModal";

const C = {
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

type ScenarioRow = {
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
  icon: "no-action" | "iut" | "iut-moq" | "moq" | "break";
  feasibleProducible: number;
  productionStopDate: string;
  dailyRunRate: number;
};

const SCENARIOS: ScenarioRow[] = [
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
    // 55,200 base + small MOQ lot addition
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


const TRANSFER_OPTION_BASE = {
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

const TRANSFER_SCENARIO_CONFIG = {
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

type IUTOption = {
  id: string;
  label: string;
  isBest: boolean;
  routeFrom: string;
  routeTo: string;
  transferQty: number;
  businessWasteBefore: number;
  businessWasteAfter: number;
  reductionVsNoAction: number;
  laneAvailable: boolean | null;
  costPerTrip: number;
  productionStopDate: string;
};

const IUT_TRANSFER_OPTIONS: IUTOption[] = [
  {
    id: "opt1",
    label: "Option 1",
    isBest: true,
    routeFrom: "UTR",
    routeTo: "U535",
    transferQty: 12589,
    businessWasteBefore: 5541,
    businessWasteAfter: 2852,
    reductionVsNoAction: 2689,
    laneAvailable: true,
    costPerTrip: 300,
    productionStopDate: "19 Jun 2026",
  },
  {
    id: "opt2",
    label: "Option 2",
    isBest: false,
    routeFrom: "U535",
    routeTo: "UTR",
    transferQty: 12589,
    businessWasteBefore: 5541,
    businessWasteAfter: 3104,
    reductionVsNoAction: 2437,
    laneAvailable: true,
    costPerTrip: 300,
    productionStopDate: "15 Jun 2026",
  },
  {
    id: "opt3",
    label: "Option 3",
    isBest: false,
    routeFrom: "UTR",
    routeTo: "U535",
    transferQty: 8200,
    businessWasteBefore: 5541,
    businessWasteAfter: 3890,
    reductionVsNoAction: 1651,
    laneAvailable: null,
    costPerTrip: 450,
    productionStopDate: "12 Jun 2026",
  },
];

type TransferScenarioId = keyof typeof TRANSFER_SCENARIO_CONFIG;

type MOQSupplierData = {
  id: string;
  name: string;
  moq: number;
  pricePerUnit: number;
  bizWaste: number;
  productionDate: string;
};

type MOQPlantOption = {
  id: string;
  plant: string;
  isBest: boolean;
  material: string;
  orderQty: number;
  suppliers: MOQSupplierData[];
};

const MOQ_PLANT_OPTIONS: MOQPlantOption[] = [
  {
    id: "p_u535",
    plant: "U535",
    isBest: true,
    material: "PM 64330490",
    orderQty: 15000,
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
const EXPANDED_BREAKDOWN_CELL_BG_ALT = "#f1f5f9";
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

const PROJECT_NAME_OPTIONS = [
  "CBU Transition Q1 2026",
  "Pack Change — Southern Plants",
  "MOQ Rationalisation FY27",
  "SKU Rationalisation Project",
  "Network Optimisation Wave 2",
];

export default function SCIDetail2({ row }: Props) {
  const { navigate } = useNav();
  const [newCbuSrNo, setNewCbuSrNo] = useState<number | null>(null);
  const [projectName, setProjectName] = useState("");
  const [acceptedId, setAcceptedId] = useState<string | null>(null);

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
    if (oldRow) setAcceptedId("iut-moq");
    else setAcceptedId(null);
  }, [oldRow?.srNo]);

  const handleOldCbuChange = (srNo: number) => {
    navigate({ page: "sci-detail2", srNo });
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
          <div
            className={`grid grid-cols-1 gap-5${oldRow ? " lg:grid-cols-3" : ""}`}
          >
            <CBUSearchDropdown
              label="Old CBU"
              row={oldRow}
              onSelect={handleOldCbuChange}
              placeholder="Select Old CBU"
            />
            {oldRow && (
              <CBUSearchDropdown
                label="New CBU"
                row={newRow}
                onSelect={handleNewCbuChange}
                placeholder="Select New CBU (optional)"
              />
            )}
            {oldRow && (
              <ProjectNameInput
                value={projectName}
                onChange={setProjectName}
              />
            )}
          </div>
        </StepSection>

        {!hasCbu && <SelectCbuPlaceholder />}

        {hasCbu && oldRow && (
          <>
            <SimulationAssumptionsStep newCbuRow={newRow} />
            <ScenarioComparisonStep
              acceptedId={acceptedId}
              onSelect={selectAccepted}
            />
            {detailScenarioId && (
              <ScenarioDetailView row={oldRow} scenarioId={detailScenarioId} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StepSection({
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
  const empty = required && !value;
  return (
    <div className="relative shrink-0">
      <input
        type="date"
        value={value}
        min={min}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder="dd-mm-yyyy"
        className="text-xs px-3 py-1.5 rounded-lg w-36 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
        style={{
          border: `1px solid ${empty ? "#f87171" : "#d1d5db"}`,
          color: value ? C.navy : "#94a3b8",
        }}
      />
      <Calendar
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "#94a3b8" }}
      />
    </div>
  );
}

const MOQ_BREAK_MATERIALS = [
  {
    type: "RM" as const,
    code: "65284824",
    description: getComponentDescriptionByCode("65284824"),
    badgeBg: "#dcfce7",
    badgeColor: "#166534",
  },
  {
    type: "PM" as const,
    code: "65428959",
    description: getComponentDescriptionByCode("65428959"),
    badgeBg: "#dbeafe",
    badgeColor: "#1d4ed8",
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

const RM_BADGE = { bg: "#dcfce7", color: "#166534" };
const PM_BADGE = { bg: "#dbeafe", color: "#1d4ed8" };

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
          className="flex items-center gap-1.5 text-left min-w-0"
        >
          {expanded ? (
            <ChevronDown size={13} style={{ color: C.blue, flexShrink: 0 }} />
          ) : (
            <ChevronRight size={13} style={{ color: C.blue, flexShrink: 0 }} />
          )}
          <PlantRouteLabel from={lane.from} to={lane.to} />
        </button>
        <label className="flex items-center gap-2 cursor-pointer shrink-0">
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
                    backgroundColor: idx % 2 === 0 ? "#F0F4FC" : "#ffffff",
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
          style={{ border: "1px solid #d1d5db", color: text ? C.navy : "#94a3b8", width: 100 }}
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
            suppliers.map((supplier, idx) => (
              <div
                key={supplier.name}
                className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3"
                style={{
                  borderTop: "1px solid rgba(21,101,192,0.08)",
                  backgroundColor: idx % 2 === 0 ? "#F0F4FC" : "#ffffff",
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

function SimulationAssumptionsStep({ newCbuRow }: { newCbuRow: CBURow | null }) {
  const [openPoCancel, setOpenPoCancel] = useState(false);
  const [poIncluded, setPoIncluded] = useState(true);
  const [rmpmWeek, setRmpmWeek] = useState("");
  const [rmpmMonth, setRmpmMonth] = useState("");
  const [networkTransitionDate, setNetworkTransitionDate] = useState("");
  const [moqBreak, setMoqBreak] = useState<Record<string, boolean>>({
    "65284824": false,
    "65428959": false,
  });
  const [iutLanes, setIutLanes] = useState<Record<string, boolean>>({
    "U535→UTR": true,
    "UTR→U535": true,
  });
  const [expandedIutLane, setExpandedIutLane] = useState<string | null>(null);
  const [expandedMoqMaterial, setExpandedMoqMaterial] = useState<string | null>(null);

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
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="font-medium"
                    style={{ color: C.blue }}
                    onClick={() => setPoIncluded(true)}
                  >
                    Include all
                  </button>
                  <button
                    type="button"
                    className="font-medium"
                    style={{ color: "#64748b" }}
                    onClick={() => setPoIncluded(false)}
                  >
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
                            backgroundColor: poIncluded ? "#dcfce7" : "#f1f5f9",
                            color: poIncluded ? "#166534" : "#64748b",
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
                  expanded={expandedIutLane === laneKey}
                  onToggleExpand={() =>
                    setExpandedIutLane((prev) => (prev === laneKey ? null : laneKey))
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
                expanded={expandedMoqMaterial === mat.code}
                onToggleExpand={() =>
                  setExpandedMoqMaterial((prev) => (prev === mat.code ? null : mat.code))
                }
                onToggleBreak={(next) =>
                  setMoqBreak((prev) => ({ ...prev, [mat.code]: next }))
                }
              />
            ))}
          </div>
        </div>
      </div>
    </StepSection>
  );
}

function ScenarioComparisonPanel({
  scenarioIds,
  onClose,
}: {
  scenarioIds: string[];
  onClose: () => void;
}) {
  const scenarios = scenarioIds
    .map((id) => SCENARIOS.find((s) => s.id === id)!)
    .filter(Boolean);
  const baseline = SCENARIOS.find((s) => s.id === "no-action")!;
  const baselineDays = parseInt(baseline.fgDaysCover ?? "0");

  const METRICS: { label: string; render: (s: ScenarioRow) => React.ReactNode }[] = [
    {
      label: "Business Waste",
      render: (s) => (
        <span
          className="font-bold tabular-nums"
          style={{ color: s.wasteColor === "teal" ? C.teal : "#dc2626" }}
        >
          {s.businessWaste ?? "—"}
        </span>
      ),
    },
    {
      label: "Savings vs No Action",
      render: (s) =>
        s.wasteSavings ? (
          <span className="font-semibold tabular-nums" style={{ color: C.green }}>
            ↓ {s.wasteSavings}
          </span>
        ) : (
          <span style={{ color: "#cbd5e1" }}>—</span>
        ),
    },
    {
      label: "FG Days Cover",
      render: (s) => {
        const delta = parseInt(s.fgDaysCover ?? "0") - baselineDays;
        return (
          <>
            <span className="font-semibold tabular-nums" style={{ color: C.navy }}>
              {s.fgDaysCover}
            </span>
            {delta > 0 && (
              <span className="ml-1.5 font-semibold" style={{ color: C.green, fontSize: 10 }}>
                +{delta}d
              </span>
            )}
          </>
        );
      },
    },
    {
      label: "Next Action",
      render: (s) => (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold whitespace-nowrap"
          style={{
            backgroundColor: s.id === "no-action" ? "#fee2e2" : "#f1f5f9",
            color: s.id === "no-action" ? "#b91c1c" : "#64748b",
            border: `1px solid ${s.id === "no-action" ? "#fca5a5" : "#e2e8f0"}`,
          }}
        >
          {s.nextAction}
        </span>
      ),
    },
    {
      label: "Rating",
      render: (s) =>
        s.id === "no-action" ? (
          <span
            className="px-2 py-0.5 rounded text-[10px] font-medium"
            style={{ backgroundColor: "#f1f5f9", color: "#94a3b8" }}
          >
            Baseline
          </span>
        ) : s.isBest ? (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ backgroundColor: C.green, color: "#fff" }}
          >
            <Star size={9} fill="currentColor" /> Best
          </span>
        ) : (
          <span style={{ color: "#cbd5e1" }}>—</span>
        ),
    },
  ];

  return (
    <div
      className="mt-4 rounded-xl overflow-hidden"
      style={{
        border: `1.5px solid ${C.borderBlue}`,
        boxShadow: "0 4px 20px rgba(21,101,192,0.10)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 gap-4"
        style={{ backgroundColor: C.navy }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <span className="text-sm font-bold text-white shrink-0">
            Scenario Comparison
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {scenarios.map((s) => (
              <span
                key={s.id}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: s.isBest
                    ? "rgba(22,163,74,0.25)"
                    : "rgba(255,255,255,0.12)",
                  color: s.isBest ? "#86efac" : "#e2e8f0",
                  border: s.isBest
                    ? "1px solid rgba(22,163,74,0.4)"
                    : "1px solid rgba(255,255,255,0.15)",
                }}
              >
                {s.name}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#e2e8f0" }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Subtitle */}
      <div
        className="px-5 py-2 text-[11px]"
        style={{
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          color: "#94a3b8",
        }}
      >
        Side-by-side metrics across selected scenarios
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <th
                className="px-4 py-3 text-left font-semibold uppercase tracking-wider"
                style={{ color: "#94a3b8", fontSize: 9, minWidth: 150 }}
              >
                Metric
              </th>
              {scenarios.map((s) => (
                <th key={s.id} className="px-4 py-3 text-left" style={{ minWidth: 160 }}>
                  <div className="flex flex-col gap-1">
                    <span
                      className="font-bold whitespace-nowrap"
                      style={{
                        color: s.isBest ? C.green : s.id === "no-action" ? "#94a3b8" : C.navy,
                        fontSize: 11,
                      }}
                    >
                      {s.name}
                    </span>
                    {s.isBest && (
                      <span
                        className="inline-flex items-center gap-1 self-start px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                        style={{ backgroundColor: "#dcfce7", color: "#166534" }}
                      >
                        <Star size={8} fill="currentColor" /> Recommended
                      </span>
                    )}
                    {s.id === "no-action" && (
                      <span
                        className="self-start px-1.5 py-0.5 rounded text-[9px] font-medium"
                        style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}
                      >
                        Baseline
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric, i) => (
              <tr
                key={metric.label}
                style={{
                  borderBottom: "1px solid #f1f5f9",
                  backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc",
                }}
              >
                <td
                  className="px-4 py-3 font-semibold whitespace-nowrap"
                  style={{ color: "#64748b", fontSize: 10, borderRight: "1px solid #f1f5f9" }}
                >
                  {metric.label}
                </td>
                {scenarios.map((s) => (
                  <td key={s.id} className="px-4 py-3">
                    {metric.render(s)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScenarioComparisonStep({
  acceptedId,
  onSelect,
}: {
  acceptedId: string | null;
  onSelect: (id: string) => void;
}) {
  const baseline = SCENARIOS.find((s) => s.id === "no-action")!;
  const baselineDays = parseInt(baseline.fgDaysCover ?? "0");

  const ranked = useMemo(
    () =>
      [...SCENARIOS]
        .filter((s) => s.id !== "no-action")
        .sort((a, b) => {
          const parse = (v: string | null) =>
            v ? parseFloat(v.replace(/[₹,]/g, "")) : Infinity;
          return parse(a.businessWaste) - parse(b.businessWaste);
        }),
    [],
  );

  const handleAccept = (scenario: ScenarioRow, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(scenario.id);
    const parts = [
      `Scenario: ${scenario.name}`,
      `Business Waste: ${scenario.businessWaste}`,
      ...(scenario.wasteSavings ? [`Savings: ↓ ${scenario.wasteSavings}`] : []),
      `FG Cover: ${scenario.fgDaysCover}`,
    ];
    toast.success(`${scenario.nextAction}`, {
      description: parts.join("  ·  "),
      duration: 5000,
    });
  };

  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (compareIds.size < 2) setShowComparison(false);
  }, [compareIds]);

  const toggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompareIds((prev) => {
      if (!prev.has(id) && prev.size >= 3) {
        toast.warning("Max 3 scenarios", {
          description: "Remove one before adding another.",
          duration: 3000,
        });
        return prev;
      }
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const TABLE_HEADERS = [
    "Rank",
    "Scenario",
    "Business Waste",
    "FG Days Cover",
    "Next Action",
    "Compare",
    "Accept",
  ];

  return (
    <StepSection
      step={3}
      title="Scenario Comparison Report"
      subtitle="System-generated · select a row to view component breakdown below"
    >
      {/* ── Comparison table ── */}
      <div
        className="overflow-x-auto rounded-xl"
        style={{ border: "1px solid #e2e8f0" }}
      >
        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: C.navy }}>
              {TABLE_HEADERS.map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-left font-bold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: "#ffffff", fontSize: 9 }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Ranked scenarios */}
            {ranked.map((scenario, idx) => {
              const rank = idx + 1;
              const isSelected = acceptedId === scenario.id;
              const coverDelta = parseInt(scenario.fgDaysCover ?? "0") - baselineDays;
              const inCompare = compareIds.has(scenario.id);
              const isMaxed = !inCompare && compareIds.size >= 3;

              return (
                <tr
                  key={scenario.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(scenario.id)}
                  onKeyDown={(e) => e.key === "Enter" && onSelect(scenario.id)}
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    borderLeft: scenario.isBest && !isSelected ? `3px solid ${C.green}` : isSelected ? `3px solid ${C.blue}` : "3px solid transparent",
                    backgroundColor: isSelected
                      ? "#EFF4FB"
                      : scenario.isBest
                        ? "#f0fdf4"
                        : idx % 2 === 0
                          ? "#ffffff"
                          : "#f8fafc",
                    outline: isSelected ? `2px solid ${C.blue}` : undefined,
                    outlineOffset: isSelected ? -1 : undefined,
                    cursor: "pointer",
                  }}
                >
                  {/* Rank */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0"
                        style={{
                          backgroundColor: scenario.isBest ? C.green : C.bgBlue,
                          color: scenario.isBest ? "#fff" : C.blue,
                          fontSize: 11,
                        }}
                      >
                        {rank}
                      </span>
                      {scenario.isBest && (
                        <span
                          className="px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap"
                          style={{ backgroundColor: "#dcfce7", color: "#166534" }}
                        >
                          Best
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Scenario */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <ScenarioIcon icon={scenario.icon} isAccepted={isSelected} />
                      <span
                        className="font-semibold whitespace-nowrap"
                        style={{ color: isSelected ? C.blue : C.navy }}
                      >
                        {scenario.name}
                      </span>
                    </div>
                  </td>

                  {/* Business waste + savings */}
                  <td className="px-3 py-3">
                    <span
                      className="font-bold tabular-nums"
                      style={{
                        color: scenario.wasteColor === "teal" ? C.teal : "#dc2626",
                      }}
                    >
                      {scenario.businessWaste}
                    </span>
                    {scenario.wasteSavings && (
                      <span
                        className="ml-1.5 font-semibold tabular-nums"
                        style={{ color: C.green, fontSize: 10 }}
                      >
                        ↓ {scenario.wasteSavings}
                      </span>
                    )}
                  </td>

                  {/* FG Cover */}
                  <td className="px-3 py-3">
                    <span className="font-semibold tabular-nums" style={{ color: C.navy }}>
                      {scenario.fgDaysCover}
                    </span>
                    {coverDelta > 0 && (
                      <span
                        className="ml-1.5 font-semibold"
                        style={{ color: C.green, fontSize: 10 }}
                      >
                        +{coverDelta}d
                      </span>
                    )}
                  </td>

                  {/* Next action chip */}
                  <td className="px-3 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap"
                      style={{
                        backgroundColor: isSelected ? "#dbeafe" : "#f1f5f9",
                        color: isSelected ? C.blue : "#64748b",
                        border: `1px solid ${isSelected ? C.borderBlue : "#e2e8f0"}`,
                      }}
                    >
                      {scenario.nextAction}
                    </span>
                  </td>

                  {/* Compare */}
                  <td className="px-3 py-3" style={{ borderLeft: "1px solid #e2e8f0" }}>
                    <button
                      type="button"
                      onClick={(e) => toggleCompare(scenario.id, e)}
                      disabled={isMaxed}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all"
                      style={
                        inCompare
                          ? { backgroundColor: C.bgBlue, color: C.blue, border: `1px solid ${C.borderBlue}` }
                          : isMaxed
                          ? { backgroundColor: "#f8fafc", color: "#cbd5e1", border: "1px solid #f1f5f9", cursor: "not-allowed" }
                          : { backgroundColor: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }
                      }
                    >
                      {inCompare ? (
                        <><Link2Off size={11} />Remove</>
                      ) : (
                        <><ChevronRight size={11} />Add to compare</>
                      )}
                    </button>
                  </td>

                  {/* Accept — only for selected row */}
                  <td className="px-3 py-3">
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => handleAccept(scenario, e)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all hover:opacity-90"
                        style={{ backgroundColor: C.green, color: "#fff", fontSize: 10 }}
                      >
                        <Check size={11} />
                        Accept
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* No Action — baseline row */}
            {(() => {
              const isSelected = acceptedId === "no-action";
              const inCompare = compareIds.has(baseline.id);
              const isMaxed = !inCompare && compareIds.size >= 3;
              return (
                <tr
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect("no-action")}
                  onKeyDown={(e) => e.key === "Enter" && onSelect("no-action")}
                  style={{
                    backgroundColor: isSelected ? "#fef2f2" : "#fff7f5",
                    borderTop: "2px dashed #fca5a5",
                    outline: isSelected ? "2px solid #dc2626" : undefined,
                    outlineOffset: isSelected ? -1 : undefined,
                    cursor: "pointer",
                  }}
                >
                  <td className="px-3 py-3">
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
                      style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}
                    >
                      BASE
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <ScenarioIcon icon="no-action" isAccepted={isSelected} />
                      <span className="font-semibold" style={{ color: "#64748b" }}>
                        {baseline.name}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                        style={{ backgroundColor: "#f1f5f9", color: "#94a3b8" }}
                      >
                        Baseline
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <span className="font-bold tabular-nums" style={{ color: "#dc2626" }}>
                      {baseline.businessWaste}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <span className="font-semibold" style={{ color: "#64748b" }}>
                      {baseline.fgDaysCover}
                    </span>
                  </td>

                  {/* Next action chip */}
                  <td className="px-3 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap"
                      style={{ backgroundColor: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" }}
                    >
                      {baseline.nextAction}
                    </span>
                  </td>

                  {/* Compare */}
                  <td className="px-3 py-3" style={{ borderLeft: "1px solid #e2e8f0" }}>
                    <button
                      type="button"
                      onClick={(e) => toggleCompare(baseline.id, e)}
                      disabled={isMaxed}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all"
                      style={
                        inCompare
                          ? { backgroundColor: C.bgBlue, color: C.blue, border: `1px solid ${C.borderBlue}` }
                          : isMaxed
                          ? { backgroundColor: "#f8fafc", color: "#cbd5e1", border: "1px solid #f1f5f9", cursor: "not-allowed" }
                          : { backgroundColor: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }
                      }
                    >
                      {inCompare ? (
                        <><Link2Off size={11} />Remove</>
                      ) : (
                        <><ChevronRight size={11} />Add to compare</>
                      )}
                    </button>
                  </td>

                  {/* Accept — only for selected row */}
                  <td className="px-3 py-3">
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => handleAccept(baseline, e)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all hover:opacity-90"
                        style={{ backgroundColor: "#dc2626", color: "#fff", fontSize: 10 }}
                      >
                        <Check size={11} />
                        Accept
                      </button>
                    )}
                  </td>
                </tr>
              );
            })()}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
        <p className="text-[11px]" style={{ color: "#94a3b8" }}>
          ↓ Savings computed vs No Action baseline · Select a row to view scenario detail below
        </p>
        <div className="flex items-center gap-2">
          {compareIds.size > 0 && (
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: compareIds.size < 2 ? "#fff7ed" : compareIds.size >= 3 ? "#dcfce7" : C.bgBlue,
                color: compareIds.size < 2 ? "#c2410c" : compareIds.size >= 3 ? "#166534" : C.blue,
              }}
            >
              {compareIds.size < 2
                ? `${compareIds.size} of 3 selected — select at least 2 to compare`
                : `${compareIds.size} of 3 selected`}
            </span>
          )}
          {compareIds.size >= 2 && (
            <button
              type="button"
              onClick={() => setShowComparison((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor: showComparison ? C.navy : C.blue,
                color: "#fff",
              }}
            >
              {showComparison ? (
                <><X size={12} />Close Comparison</>
              ) : (
                <><ChevronRight size={12} />Show Comparison</>
              )}
            </button>
          )}
        </div>
      </div>

      {showComparison && compareIds.size >= 2 && (
        <ScenarioComparisonPanel
          scenarioIds={Array.from(compareIds)}
          onClose={() => setShowComparison(false)}
        />
      )}
    </StepSection>
  );
}

function ScenarioIcon({
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
  }
}

function ProjectNameInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
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
      <p className="text-xs font-semibold mb-1.5" style={{ color: C.navy }}>
        Project Name
      </p>
      <div
        ref={wrapperRef}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          backgroundColor: "#ffffff",
          border: `1.5px solid ${open ? C.borderBlue : "#d1d5db"}`,
          boxShadow: open
            ? "0 4px 16px rgba(21,101,192,0.12)"
            : "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: C.bgBlue, color: C.blue }}
        >
          <Sparkles size={18} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Type or select project name..."
          className="flex-1 min-w-0 text-sm bg-transparent focus:outline-none"
          style={{ color: value ? "#111827" : undefined }}
        />
        <ChevronDown size={18} style={{ color: "#94a3b8" }} className="shrink-0" />
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
}: {
  label: string;
  row: CBURow | null;
  onSelect: (srNo: number) => void;
  placeholder?: string;
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
        style={{ color: C.navy }}
      >
        {label}
      </p>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
        style={{
          backgroundColor: "#ffffff",
          border: `1.5px solid ${open ? C.borderBlue : "#d1d5db"}`,
          boxShadow: open
            ? "0 4px 16px rgba(21,101,192,0.12)"
            : "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: C.bgBlue, color: C.blue }}
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
            <p className="font-medium text-sm" style={{ color: "#94a3b8" }}>
              {placeholder}
            </p>
          )}
        </div>
        {open ? (
          <ChevronUp size={18} style={{ color: "#94a3b8" }} className="shrink-0" />
        ) : (
          <ChevronDown size={18} style={{ color: "#94a3b8" }} className="shrink-0" />
        )}
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

  return {};
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
      backgroundColor:
        rowIndex % 2 === 0
          ? EXPANDED_BREAKDOWN_CELL_BG
          : EXPANDED_BREAKDOWN_CELL_BG_ALT,
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

function CompactScenarioCard({
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
                backgroundColor: (transfer.componentType as string) === "RM" ? RM_BADGE.bg : PM_BADGE.bg,
                color: (transfer.componentType as string) === "RM" ? RM_BADGE.color : PM_BADGE.color,
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

function StockTransferOptionsPanel({ count }: { count: number }) {
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
                  </span>
                </div>

                {/* Reduction vs no action */}
                <div className="px-4 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                    Reduction vs No Action
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold tabular-nums" style={{ color: C.green }}>
                    <ChevronDown size={13} strokeWidth={2.5} />
                    ₹{saving.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Transfer location */}
                <div className="px-4 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                    Transfer Location
                  </span>
                  <span className="text-xs font-semibold" style={{ color: C.navy }}>
                    {opt.routeFrom}
                    <span className="mx-1 text-blue-400">→</span>
                    {opt.routeTo}
                  </span>
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
                    {opt.productionStopDate}
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

function MOQProcurementOptionsPanel() {
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
                <p
                  className="text-[9px] font-semibold uppercase tracking-wide mb-1"
                  style={{ color: isSelected || plant.isBest ? "rgba(255,255,255,0.6)" : "#94a3b8" }}
                >
                  Supplier
                </p>
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
                    color: C.navy,
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

function ScenarioDetailView({
  row,
  scenarioId,
}: {
  row: CBURow;
  scenarioId: string;
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

  const breakdownSubtitle = `RM/PM stock, open POs, and leftover waste · ${row.cbuCode}`;

  const [filter, setFilter] = useState("");
  const [stockExpanded, setStockExpanded] = useState(false);
  const [showProductionPlan, setShowProductionPlan] = useState(false);

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return NO_ACTION_PLANT.rows;
    return NO_ACTION_PLANT.rows.filter(
      (r) =>
        r.component.toLowerCase().includes(q) ||
        NO_ACTION_PLANT.code.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q),
    );
  }, [filter]);

  const totalCols = getBreakdownColumnCount(stockExpanded);
  const headerColumns = [
    "Component",
    ...getStockSubColumns(stockExpanded),
    ...BREAKDOWN_TAIL_COLUMNS,
  ];

  return (
    <div className="space-y-4 pt-2">
      {showProductionPlan && (
        <ProductionPlanModal
          plantCode={NO_ACTION_PLANT.code}
          cbuCode={row.cbuCode}
          cbuDescription={row.cbuDescription}
          totalProduction={NO_ACTION_PLANT.totalProductionPlanQty}
          onClose={() => setShowProductionPlan(false)}
        />
      )}
      {/* Dark blue section header */}
      <div
        className="rounded-xl px-5 py-3 flex items-center"
        style={{
          backgroundColor: C.navy,
          boxShadow: "0 1px 4px rgba(0,48,135,0.10)",
        }}
      >
        <p className="text-sm font-bold tracking-wide uppercase text-white">
          Scenario Details
        </p>
      </div>
      {/* Compact scenario card(s) */}
      <div className={`grid gap-3 ${isCombo ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
        {cardDefs.map(({ sid, transferId }) => {
          const scenario = SCENARIOS.find((s) => s.id === sid);
          if (!scenario) return null;
          return (
            <CompactScenarioCard key={sid} scenario={scenario} transferId={transferId} />
          );
        })}
      </div>

      {/* IUT transfer options panel */}
      {(scenarioId === "iut" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break") && (
        <StockTransferOptionsPanel count={scenarioId === "iut-moq" ? 3 : 2} />
      )}

      {/* procurement options panel */}
      {(scenarioId === "moq" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break") && (
        <MOQProcurementOptionsPanel />
      )}

      {/* Component breakdown table */}
      <div
        className="rounded-xl overflow-hidden bg-white"
        style={{
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 4px rgba(0,48,135,0.06)",
        }}
      >
        <div
          className="px-5 py-4 flex flex-wrap items-start justify-between gap-3"
          style={{ borderBottom: "1px solid #e2e8f0" }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: C.navy }}>
              Component Breakdown by Plant
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
              {breakdownSubtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#94a3b8" }}
              />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter plant or component..."
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none"
                style={{
                  border: "1px solid #d1d5db",
                  minWidth: 220,
                  color: "#111827",
                }}
              />
            </div>
            {/* <span
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
              style={{ backgroundColor: C.bgBlue, color: C.blue }}
            >
              {NO_ACTION_PLANT.plantCount} plants · {NO_ACTION_PLANT.componentCount} components
            </span> */}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full text-xs"
            style={{
              borderCollapse: "collapse",
              minWidth: stockExpanded ? 1400 : 1200,
            }}
          >
            <thead>
              <tr style={{ backgroundColor: C.navy }}>
                {headerColumns.map((col, colIdx) => {
                  const isOnHandToggle = col === "On-hand stock";
                  return (
                    <th
                      key={`${col}-${colIdx}`}
                      className="px-3 py-2.5 text-left font-bold uppercase tracking-wide whitespace-nowrap"
                      style={breakdownHeaderStyle(colIdx, stockExpanded, isOnHandToggle)}
                      onClick={
                        isOnHandToggle
                          ? () => setStockExpanded((prev) => !prev)
                          : undefined
                      }
                      title={
                        isOnHandToggle
                          ? stockExpanded
                            ? "Collapse on-hand stock breakdown"
                            : "Expand on-hand stock breakdown"
                          : undefined
                      }
                    >
                      {isOnHandToggle ? (
                        <span className="inline-flex items-center gap-1">
                          {col}
                          {stockExpanded ? (
                            <ChevronDown size={12} />
                          ) : (
                            <ChevronRight size={12} />
                          )}
                        </span>
                      ) : (
                        col
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <td
                  colSpan={totalCols - 1}
                  className="px-3 py-2.5 font-semibold"
                  style={{
                    color: C.navy,
                    ...breakdownColBorder(0, stockExpanded),
                  }}
                >
                  <span className="font-bold">{NO_ACTION_PLANT.code}</span>
                  <span className="mx-2" style={{ color: "#94a3b8" }}>·</span>
                  Total Production Plan:{" "}
                  <button
                    type="button"
                    onClick={() => setShowProductionPlan(true)}
                    className="font-bold transition-colors hover:underline"
                    style={{ color: C.blue }}
                    title="View 19-week production plan breakdown"
                  >
                    {NO_ACTION_PLANT.totalProductionPlan}
                  </button>
                </td>
                <td
                  className="px-3 py-2.5 text-right"
                  style={breakdownColBorder(totalCols - 1, stockExpanded)}
                >
                  <span
                    className="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
                    style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
                  >
                    {NO_ACTION_PLANT.prodStopDate}
                  </span>
                </td>
              </tr>

              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={totalCols}
                    className="px-4 py-8 text-center italic"
                    style={{ color: "#94a3b8" }}
                  >
                    No components match your filter
                  </td>
                </tr>
              ) : (
                filteredRows.map((comp, rowIndex) => {
                  const stockValues = getStockCellValues(comp, stockExpanded);
                  const tailValues = getTailCellValues(comp);

                  return (
                    <tr
                      key={comp.component}
                      style={{ borderBottom: "1px solid #e5e7eb" }}
                    >
                      <td
                        className="px-3 py-3 align-top"
                        style={breakdownBodyStyle(0, rowIndex, stockExpanded)}
                      >
                        <ComponentCell comp={comp} />
                      </td>

                      {stockValues.map((value, stockIdx) => {
                        const colIdx = 1 + stockIdx;
                        const isOpenPoQtyCol = stockIdx === (stockExpanded ? 1 + ON_HAND_EXPAND_COLUMNS.length : 1);
                        const isOpenPoHighlight = isOpenPoQtyCol;
                        const totalStockIdx = stockExpanded
                          ? ON_HAND_EXPAND_COLUMNS.length
                          : -1;

                        return (
                          <td
                            key={`${comp.component}-stock-${stockIdx}`}
                            className="px-3 py-3 tabular-nums"
                            style={{
                              color: isOpenPoHighlight
                                ? value !== "—"
                                  ? C.blue
                                  : "#94a3b8"
                                : "#374151",
                              fontWeight:
                                stockIdx === 0 || stockIdx === totalStockIdx
                                  ? 600
                                  : isOpenPoQtyCol
                                    ? 500
                                    : 400,
                              ...breakdownBodyStyle(colIdx, rowIndex, stockExpanded),
                            }}
                          >
                            {value}
                          </td>
                        );
                      })}

                      {tailValues.map((value, tailIdx) => {
                        const colIdx = 1 + stockValues.length + tailIdx;
                        return (
                          <td
                            key={`${comp.component}-tail-${tailIdx}`}
                            className={`px-3 py-3 tabular-nums ${tailIdx === 7 ? "whitespace-nowrap" : ""}`}
                            style={{
                              color: tailCellColor(comp, tailIdx),
                              fontWeight: tailIdx >= 5 ? 600 : 400,
                              ...breakdownBodyStyle(colIdx, rowIndex, stockExpanded),
                            }}
                          >
                            {value}
                          </td>
                        );
                      })}
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

function ComponentCell({ comp }: { comp: ComponentBreakdownRow }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold truncate" style={{ color: "#111827" }}>
          {comp.component}
        </span>
        <span
          className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold"
          style={{
            backgroundColor: comp.type === "PM" ? C.bgBlue : "#ecfdf5",
            color: comp.type === "PM" ? C.blue : C.teal,
          }}
        >
          {comp.type}
        </span>
      </div>
      <p
        className="text-xs mt-0.5 truncate"
        style={{ color: "#64748b" }}
        title={comp.description}
      >
        {comp.description}
      </p>
      {comp.isBottleneck && (
        <span
          className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
          style={{ backgroundColor: "#ffedd5", color: "#ea580c" }}
        >
          Bottleneck
        </span>
      )}
    </div>
  );
}
