import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import {
  Box,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Cpu,
  IndianRupee,
  ArrowLeftRight,
  ArrowDown,
  Link2Off,
  Search,
  ShoppingCart,
  Sparkles,
  Star,
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
  },
  {
    id: "iut",
    name: "IUT Transfer",
    businessWaste: "₹2,852",
    wasteSavings: "₹2,689",
    wasteColor: "orange",
    fgDaysCover: "25d",
    isBest: false,
    nextActionPrefix: "NEXT ACTION",
    nextAction: "Raise STO",
    icon: "iut",
  },
  {
    id: "iut-moq",
    name: "IUT + MOQ Procurement",
    businessWaste: "₹2,695",
    wasteSavings: "₹2,846",
    wasteColor: "teal",
    fgDaysCover: "25d",
    isBest: true,
    nextActionPrefix: "NEXT ACTION",
    nextAction: "Raise STO + PO",
    icon: "iut-moq",
  },
  {
    id: "moq",
    name: "MOQ Procurement",
    businessWaste: "₹5,385",
    wasteSavings: "₹156",
    wasteColor: "orange",
    fgDaysCover: "23d",
    isBest: false,
    nextActionPrefix: "NEXT ACTION",
    nextAction: "Raise PO",
    icon: "moq",
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
  },
];

const NO_ACTION_SUMMARY = {
  feasibleProducible: 55200,
  fgDaysCover: 14,
  dailyRunRate: 3865,
  productionStopDate: "29 May 2026",
  businessWasteValue: 15375,
};

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

type TransferScenarioId = keyof typeof TRANSFER_SCENARIO_CONFIG;

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

export default function SCIDetail({ row }: Props) {
  const { navigate } = useNav();
  const [newCbuSrNo, setNewCbuSrNo] = useState<number | null>(null);
  const [acceptedId, setAcceptedId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

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
    if (oldRow) setAcceptedId("no-action");
    else {
      setAcceptedId(null);
      setCompareIds(new Set());
    }
  }, [oldRow?.srNo]);

  const handleOldCbuChange = (srNo: number) => {
    navigate({ page: "sci-detail", srNo });
  };

  const handleNewCbuChange = (srNo: number) => {
    setNewCbuSrNo(srNo);
  };

  const selectAccepted = (id: string) => {
    const scenario = SCENARIOS.find((s) => s.id === id);
    if (scenario?.disabled || scenario?.comingSoon) return;
    setAcceptedId((prev) => (prev === id ? null : id));
  };

  const toggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const scenario = SCENARIOS.find((s) => s.id === id);
    if (scenario?.disabled || scenario?.comingSoon) return;
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const detailScenarioId =
    acceptedId === "iut-moq" || acceptedId === "iut-moq-break"
      ? "iut"
      : acceptedId === "no-action" || acceptedId === "iut" || acceptedId === "moq"
        ? acceptedId
        : null;

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
            className={`grid grid-cols-1 gap-5${oldRow ? " lg:grid-cols-2" : ""}`}
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
          </div>
        </StepSection>

        {!hasCbu && <SelectCbuPlaceholder />}

        {hasCbu && oldRow && (
          <>
            <SimulationAssumptionsStep newCbuRow={newRow} />
            <ScenarioComparisonStep
              acceptedId={acceptedId}
              compareIds={compareIds}
              onSelect={selectAccepted}
              onToggleCompare={toggleCompare}
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
        className="text-xs px-3 py-1.5 rounded-lg w-36"
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
  { from: "U535", to: "UTR" },
  { from: "UTR", to: "U535" },
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
  const materials = IUT_LANE_REQUIREMENTS[laneKey] ?? [];

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
  week: string;
  month: string;
};

function buildOpenPoLinesForCbu(row: CBURow): OpenPoAssumptionLine[] {
  const fgMaterial = getRowFgMaterial(row);
  const defaults = defaultWeekMonth();

  if (fgMaterial === "VCBL1R0" || row.cbuCode === "VCBL1R0") {
    return VCBL1R0_OPEN_POS.map((po) => {
      const { week, month } = weekMonthFromTxDate(po.txDate);
      return {
        id: `${po.plant}__${po.componentCode}`,
        plantCode: po.plant,
        plantName: getPlantDisplayName(po.plant),
        componentCode: po.componentCode,
        description: getComponentDescriptionByCode(po.componentCode),
        week,
        month,
      };
    });
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
      week: defaults.week,
      month: defaults.month,
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
      week: defaults.week,
      month: defaults.month,
    }));
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
      <label className="flex items-center gap-1.5">
        <span className="text-[10px] font-medium shrink-0" style={{ color: "#64748b" }}>
          Wk
        </span>
        <select
          value={week}
          onChange={(e) => onWeekChange(e.target.value)}
          className="text-xs px-2 py-1 rounded-lg"
          style={{ border: "1px solid #d1d5db", color: C.navy, minWidth: 52 }}
        >
          {PO_WEEK_OPTIONS.map((w) => (
            <option key={w} value={w}>
              W{w}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1.5">
        <span className="text-[10px] font-medium shrink-0" style={{ color: "#64748b" }}>
          Mo
        </span>
        <input
          type="month"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className="text-xs px-2 py-1 rounded-lg"
          style={{ border: "1px solid #d1d5db", color: C.navy }}
        />
      </label>
    </div>
  );
}

function OpenPoAssumptionsPanel({ lines }: { lines: OpenPoAssumptionLine[] }) {
  const lineKey = useMemo(() => lines.map((l) => l.id).join("|"), [lines]);
  const [lineDates, setLineDates] = useState<
    Record<string, { week: string; month: string }>
  >({});

  useEffect(() => {
    setLineDates(
      Object.fromEntries(lines.map((l) => [l.id, { week: l.week, month: l.month }])),
    );
  }, [lineKey, lines]);

  return (
    <div style={{ borderTop: "1px solid #f1f5f9" }}>
      <div className="px-4 py-4">
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
                  "Date (week · month)",
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
                  const dates = lineDates[line.id] ?? {
                    week: line.week,
                    month: line.month,
                  };
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
                        <OpenPoWeekMonthEditor
                          week={dates.week}
                          month={dates.month}
                          onWeekChange={(week) =>
                            setLineDates((prev) => ({
                              ...prev,
                              [line.id]: { ...dates, week },
                            }))
                          }
                          onMonthChange={(month) =>
                            setLineDates((prev) => ({
                              ...prev,
                              [line.id]: { ...dates, month },
                            }))
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
  const [rmpmConnectivityDate, setRmpmConnectivityDate] = useState("");
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
            <AssumptionDateInput
              value={rmpmConnectivityDate}
              onChange={setRmpmConnectivityDate}
              required
            />
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
                IUT Transfer feasibility
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

function ScenarioComparisonStep({
  acceptedId,
  compareIds,
  onSelect,
  onToggleCompare,
}: {
  acceptedId: string | null;
  compareIds: Set<string>;
  onSelect: (id: string) => void;
  onToggleCompare: (id: string, e: React.MouseEvent) => void;
}) {
  const [dateMode, setDateMode] = useState<"system" | "custom">("system");

  return (
    <StepSection
      step={3}
      title="Scenario Comparison"
      subtitle="System Generated date · click a card to view component breakdown"
    >
      <div className="flex justify-end mb-4">
        <div
          className="inline-flex rounded-full overflow-hidden text-xs"
          style={{ border: "1px solid #d1d5db" }}
        >
          <button
            type="button"
            onClick={() => setDateMode("system")}
            className="px-4 py-1.5 font-medium flex items-center gap-1.5"
            style={{
              backgroundColor: dateMode === "system" ? "#ffffff" : "#f8fafc",
              color: dateMode === "system" ? C.blue : "#64748b",
              borderRight: "1px solid #d1d5db",
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: dateMode === "system" ? C.blue : "#cbd5e1",
              }}
            />
            System Generated
          </button>
          <button
            type="button"
            disabled
            className="px-4 py-1.5 font-medium flex items-center gap-1.5 opacity-60 cursor-not-allowed"
            style={{ backgroundColor: "#f8fafc", color: "#94a3b8" }}
          >
            Custom Date
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-bold"
              style={{ backgroundColor: "#e2e8f0", color: "#64748b" }}
            >
              Soon
            </span>
          </button>
        </div>
      </div>

      <div
        className="overflow-y-auto space-y-3 pr-1"
        style={{ maxHeight: 520 }}
      >
        {SCENARIOS.map((scenario) => (
          <ScenarioComparisonCard
            key={scenario.id}
            scenario={scenario}
            isAccepted={acceptedId === scenario.id}
            inCompare={compareIds.has(scenario.id)}
            onSelect={() => onSelect(scenario.id)}
            onToggleCompare={(e) => onToggleCompare(scenario.id, e)}
          />
        ))}
      </div>
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

function WasteMetricPod({
  value,
  savings,
  wasteColor = "orange",
  muted = false,
  preview = false,
}: {
  value: string | null;
  savings?: string | null;
  wasteColor?: "orange" | "teal";
  muted?: boolean;
  preview?: boolean;
}) {
  const primaryColor = muted
    ? preview
      ? "#94a3b8"
      : "#cbd5e1"
    : wasteColor === "teal"
      ? C.teal
      : "#ea580c";
  const savingsColor = muted && preview ? "#86efac" : C.green;

  return (
    <div
      className="flex-1 min-w-[140px] px-3 py-2 rounded-xl"
      style={{
        backgroundColor: preview ? "#f1f5f9" : "#f8fafc",
        border: preview ? "1px dashed #cbd5e1" : undefined,
      }}
    >
      <p
        className="text-[10px] font-semibold tracking-wide mb-0.5 uppercase"
        style={{ color: "#94a3b8" }}
      >
        Business waste{preview ? " (projected)" : ""}
      </p>
      {value ? (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-bold" style={{ color: primaryColor }}>
            {value}
          </span>
          {savings ? (
            <>
              <ArrowDown size={14} style={{ color: savingsColor }} />
              <span className="text-sm font-bold" style={{ color: savingsColor }}>
                {savings}
              </span>
            </>
          ) : null}
        </div>
      ) : (
        <span className="text-sm font-bold" style={{ color: "#e2e8f0" }}>
          —
        </span>
      )}
    </div>
  );
}

function ScenarioComparisonCard({
  scenario,
  isAccepted,
  inCompare,
  onSelect,
  onToggleCompare,
}: {
  scenario: ScenarioRow;
  isAccepted: boolean;
  inCompare: boolean;
  onSelect: () => void;
  onToggleCompare: (e: React.MouseEvent) => void;
}) {
  const isDisabled = scenario.disabled || scenario.comingSoon;

  return (
    <div
      className="relative flex items-stretch rounded-xl overflow-hidden transition-all"
      style={{
        border: `2px solid ${isAccepted ? C.blue : "#e2e8f0"}`,
        backgroundColor: isDisabled ? "#fafafa" : "#ffffff",
        opacity: scenario.comingSoon ? 0.65 : 1,
        boxShadow: isAccepted
          ? "0 4px 16px rgba(21,101,192,0.12)"
          : "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {isAccepted && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: C.blue }}
        />
      )}

      <button
        type="button"
        onClick={onSelect}
        disabled={isDisabled}
        className="flex-1 min-w-0 flex flex-wrap items-center gap-3 px-4 py-3 text-left"
      >
        <ScenarioIcon icon={scenario.icon} isAccepted={isAccepted} />
        <div className="flex flex-col gap-1 shrink-0 min-w-[140px]">
          <span
            className="font-bold text-sm"
            style={{ color: isDisabled ? "#94a3b8" : C.navy }}
          >
            {scenario.name}
          </span>
          {scenario.isBest && (
            <span
              className="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: C.green, color: "#fff" }}
            >
              <Star size={9} fill="currentColor" />
              Best
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-wrap gap-2 min-w-0">
          <WasteMetricPod
            value={scenario.businessWaste}
            savings={scenario.wasteSavings}
            wasteColor={scenario.wasteColor}
            muted={isDisabled}
          />
          <MetricPod
            label="FG days cover"
            value={scenario.fgDaysCover}
            valueColor={isAccepted && scenario.fgDaysCover ? C.blue : C.navy}
            muted={isDisabled}
          />
        </div>
      </button>

      {!isDisabled && (
        <button
          type="button"
          onClick={onToggleCompare}
          className="shrink-0 flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-l"
          style={{
            backgroundColor: inCompare ? C.bgBlue : "#fff",
            color: inCompare ? C.blue : "#64748b",
            borderColor: "#e2e8f0",
          }}
        >
          {inCompare ? (
            <>
              <Link2Off size={13} />
              Remove
            </>
          ) : (
            <>
              <ChevronRight size={13} />
              Add to compare
            </>
          )}
        </button>
      )}
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
  return ["On-hand stock", ...ON_HAND_EXPAND_COLUMNS];
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

function ScenarioDetailView({
  row,
  scenarioId,
}: {
  row: CBURow;
  scenarioId: "no-action" | "iut" | "moq";
}) {
  const scenarioLabel =
    scenarioId === "iut"
      ? "IUT scenario"
      : scenarioId === "moq"
        ? "MOQ scenario"
        : "No action scenario";
  const breakdownSubtitle =
    scenarioId === "iut"
      ? `RM/PM stock, open POs, and leftover waste — IUT scenario · ${row.cbuCode}`
      : scenarioId === "moq"
        ? `RM/PM stock, open POs, and leftover waste — MOQ scenario · ${row.cbuCode}`
        : `RM/PM stock, open POs, and leftover waste — No action scenario · ${row.cbuCode}`;

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
      {/* Summary KPI bar */}
      <div
        className="rounded-xl overflow-hidden bg-white"
        style={{
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 4px rgba(0,48,135,0.06)",
        }}
      >
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ backgroundColor: C.navy }}
        >
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: "#ffffff" }}
          >
            {scenarioLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#e2e8f0]">
          <SummaryMetric
            icon={<Box size={16} style={{ color: C.blue }} />}
            iconBg={C.bgBlue}
            label="Feasible producible"
            value={NO_ACTION_SUMMARY.feasibleProducible.toLocaleString("en-IN")}
            sub="FG units (Stock + Open POs)"
            valueColor={C.navy}
          />
          <SummaryMetric
            icon={<Clock size={16} style={{ color: "#dc2626" }} />}
            iconBg="#fef2f2"
            label="FG Cover (Days)"
            value={`${NO_ACTION_SUMMARY.fgDaysCover} days`}
            sub={`Daily run-rate: ${NO_ACTION_SUMMARY.dailyRunRate.toLocaleString("en-IN")} units/day`}
            valueColor="#dc2626"
          />
          <SummaryMetric
            icon={<Calendar size={16} style={{ color: C.blue }} />}
            iconBg={C.bgBlue}
            label="Production stop date"
            value={NO_ACTION_SUMMARY.productionStopDate}
            sub="Latest plant-level production stop (Fri horizon)"
            valueColor={C.navy}
          />
          <SummaryMetric
            icon={<IndianRupee size={16} style={{ color: "#dc2626" }} />}
            iconBg="#fef2f2"
            label="Business waste value"
            value={`₹${NO_ACTION_SUMMARY.businessWasteValue.toLocaleString("en-IN")}`}
            sub="Total RM/PM leftover value"
            valueColor="#dc2626"
          />
        </div>
      </div>

      {(scenarioId === "iut" || scenarioId === "moq") && (
        <StockTransferOptions scenarioId={scenarioId} />
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
                        const isOpenPoQtyCol = !stockExpanded && stockIdx === 1;
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

function StockTransferOptions({ scenarioId }: { scenarioId: TransferScenarioId }) {
  const [selected, setSelected] = useState(true);
  const t = { ...TRANSFER_OPTION_BASE, ...TRANSFER_SCENARIO_CONFIG[scenarioId] };
  const qtyLabel = t.transferQty.toLocaleString("en-IN");

  return (
    <div
      className="rounded-xl overflow-hidden bg-white"
      style={{
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 4px rgba(0,48,135,0.06)",
      }}
    >
      {/* <div
        className="px-5 py-4 flex flex-wrap items-start justify-between gap-3"
        style={{ borderBottom: "1px solid #e2e8f0" }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: C.bgBlue }}
          >
            <Sparkles size={16} style={{ color: C.blue }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: C.navy }}>
              Stock Transfer Options
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
              1 option · Select one to preview its impact on production and waste
            </p>
          </div>
        </div>
        <span
          className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
          style={{
            backgroundColor: C.bgBlue,
            color: C.blue,
            border: `1px solid ${C.borderBlue}`,
          }}
        >
          LP Optimised
        </span>
      </div> */}

      <div className="">
        <button
          type="button"
          onClick={() => setSelected((prev) => !prev)}
          className="w-full text-left rounded-xl overflow-hidden transition-all"
          style={{
            border: `2px solid ${selected ? C.blue : "#e2e8f0"}`,
            boxShadow: selected
              ? "0 4px 16px rgba(21,101,192,0.12)"
              : "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div
            className="px-4 py-3 flex flex-wrap items-center gap-2"
            style={{ backgroundColor: C.navy }}
          >
            <ArrowLeftRight size={16} color="#ffffff" />
            <span className="font-bold text-sm text-white">LP Optimal Transfer</span>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
              style={{ backgroundColor: C.blue, color: "#ffffff" }}
            >
              <Star size={9} fill="currentColor" />
              Recommended
            </span>
            {t.isFullTransfer && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                style={{ backgroundColor: "#14532d", color: "#4ade80" }}
              >
                Full
              </span>
            )}
          </div>

          <div className="px-4 py-3 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
                  style={{ backgroundColor: C.bgBlue, color: C.blue }}
                >
                  {t.componentType}
                </span>
                <div className="text-sm min-w-0" style={{ color: "#334155" }}>
                  <span className="font-semibold">{t.componentCode}</span>
                  {t.componentDescription ? (
                    <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                      {t.componentDescription}
                    </p>
                  ) : null}
                  <p className="mt-1" style={{ color: C.blue }}>
                    {t.routeFrom}
                    {PLANT_CLUSTER_MAP[t.routeFrom]
                      ? ` (${PLANT_CLUSTER_MAP[t.routeFrom]})`
                      : ""}{" "}
                    → {t.routeTo}
                    {PLANT_CLUSTER_MAP[t.routeTo]
                      ? ` (${PLANT_CLUSTER_MAP[t.routeTo]})`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px]" style={{ color: "#94a3b8" }}>
                  Transfer qty
                </p>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="font-bold text-sm tabular-nums" style={{ color: "#111827" }}>
                    {qtyLabel} EA
                  </span>
                  <span className="text-[10px]" style={{ color: "#94a3b8" }}>
                    ·
                  </span>
                  <IndianRupee size={13} style={{ color: C.green }} />
                  <span className="font-bold text-sm" style={{ color: C.green }}>
                    {t.transferValue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="mt-3 px-3 py-2.5 rounded-lg"
              style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "#166534" }}>
                {t.productionPlant} — production impact
              </p>
              {/* <p className="text-[10px] mb-1" style={{ color: "#64748b" }}>
                Feasible FG units producible after moving {qtyLabel} EA from {t.fromPlant}
              </p> */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm tabular-nums">
                  <span style={{ color: "#64748b" }}>
                    {t.productionBeforeEa.toLocaleString("en-IN")}
                  </span>
                  <span className="mx-1.5" style={{ color: "#94a3b8" }}>
                    →
                  </span>
                  <span className="font-bold" style={{ color: C.green }}>
                    {t.productionAfterEa.toLocaleString("en-IN")} EA
                  </span>
                </span>
                {/* <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: "#dcfce7", color: "#166534" }}
                >
                  +{qtyLabel} unlocked
                </span> */}
              </div>
            </div>

            <div
              className="mt-3 px-3 py-2.5 rounded-lg"
              style={{ backgroundColor: "#faf5ff", border: "1px solid #e9d5ff" }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#6b21a8" }}>
                Business waste impact
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px]" style={{ color: "#64748b" }}>
                    {t.wasteBeforeLabel}
                  </p>
                  <p className="font-bold text-sm tabular-nums" style={{ color: "#991b1b" }}>
                    ₹{t.wasteBefore.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: "#64748b" }}>
                    {t.wasteAfterLabel}
                  </p>
                  <p className="font-bold text-sm tabular-nums" style={{ color: "#c2410c" }}>
                    ₹{t.wasteAfter.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: "#64748b" }}>
                    Saved
                  </p>
                  <p className="font-bold text-sm tabular-nums" style={{ color: C.green }}>
                    ₹{t.saved.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </button>
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

function SummaryMetric({
  icon,
  iconBg,
  label,
  value,
  sub,
  valueColor,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
  valueColor: string;
}) {
  return (
    <div className="px-5 py-4 flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className="text-[9px] font-bold uppercase tracking-widest mb-1"
          style={{ color: "#94a3b8" }}
        >
          {label}
        </p>
        <p className="text-xl font-bold truncate" style={{ color: valueColor }}>
          {value}
        </p>
        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: "#64748b" }}>
          {sub}
        </p>
      </div>
    </div>
  );
}
