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
  icon: "no-action" | "iut" | "iut-moq" | "moq" | "break" | "custom";
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

const CUSTOM_SCENARIO: ScenarioRow = {
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

type CompBreakdownRow = {
  plant: string;
  productionPlan: string;
  componentCode: string;
  description: string;
  type: "RM" | "PM";
  onHandStock: string;
  openPO: string;
  unitPrice: string;
};

const COMP_BREAKDOWN_ROWS: CompBreakdownRow[] = [
  {
    plant: "U535",
    productionPlan: "4,44,444 EA",
    componentCode: "65428959",
    description: getComponentDescriptionByCode("65428959"),
    type: "PM",
    onHandStock: "55,200",
    openPO: "—",
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
    unitPrice: "₹15.00",
  },
];

type CustomOverrideRow = {
  id: string;
  componentCode: string;
  plant: string;
  onHandStock: string;
  productionPlan: string;
  conversionFactor: string;
};

const CUSTOM_OVERRIDE_COMPONENT_OPTIONS = Array.from(
  new Set(COMP_BREAKDOWN_ROWS.map((r) => r.componentCode)),
);
const CUSTOM_OVERRIDE_PLANT_OPTIONS = Array.from(
  new Set(COMP_BREAKDOWN_ROWS.map((r) => r.plant)),
);

function lookupBaselineComp(componentCode: string, plant: string) {
  return COMP_BREAKDOWN_ROWS.find(
    (r) => r.componentCode === componentCode && r.plant === plant,
  );
}

function CustomOverridesForm({
  rows,
  onRowsChange,
  onRun,
}: {
  rows: CustomOverrideRow[];
  onRowsChange: (rows: CustomOverrideRow[]) => void;
  onRun: () => void;
}) {
  const addRow = () => {
    onRowsChange([
      ...rows,
      {
        id: `custom-row-${Date.now()}-${rows.length}`,
        componentCode: "",
        plant: "",
        onHandStock: "",
        productionPlan: "",
        conversionFactor: "",
      },
    ]);
  };

  const loadFromBaseline = () => {
    onRowsChange(
      COMP_BREAKDOWN_ROWS.map((r, idx) => ({
        id: `custom-row-baseline-${idx}`,
        componentCode: r.componentCode,
        plant: r.plant,
        onHandStock: r.onHandStock,
        productionPlan: r.productionPlan,
        conversionFactor: r.unitPrice,
      })),
    );
  };

  const removeRow = (id: string) => {
    onRowsChange(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, patch: Partial<CustomOverrideRow>) => {
    onRowsChange(
      rows.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        if (patch.componentCode !== undefined || patch.plant !== undefined) {
          const baseline = lookupBaselineComp(next.componentCode, next.plant);
          if (baseline) {
            next.onHandStock = baseline.onHandStock;
            next.productionPlan = baseline.productionPlan;
            next.conversionFactor = baseline.unitPrice;
          }
        }
        return next;
      }),
    );
  };

  const [showErrors, setShowErrors] = useState(false);
  const incomplete = rows.some(
    (r) => !r.componentCode || !r.plant || !r.onHandStock || !r.productionPlan,
  );

  const handleRunCustomScenario = () => {
    if (rows.length === 0 || incomplete) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    toast.success("Custom scenario computed", {
      description: `${rows.length} override row${rows.length > 1 ? "s" : ""} applied`,
      duration: 3000,
    });
    onRun();
  };

  const inputStyle: React.CSSProperties = { border: "1px solid #d1d5db", color: "#111827" };
  const errorStyle: React.CSSProperties = { border: "1px solid #dc2626", color: "#111827", backgroundColor: "#fef2f2" };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}
    >
      <div className="px-4 py-3 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#ecfdf5" }}
          >
            <Pencil size={18} style={{ color: "#e11d48" }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: C.navy }}>
              Custom Overrides
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
              Enter on-hand stock per plant &amp; component. Production plan and
              conversion factor default from baseline.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadFromBaseline}
          className="inline-flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0"
          style={{ backgroundColor: "#ecfdf5", color: C.teal, border: "1px solid #99f6e4" }}
        >
          <Copy size={12} />
          Load from baseline
        </button>
      </div>

      <div className="overflow-x-auto" style={{ borderTop: "1px solid #f1f5f9" }}>
        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              {[
                { label: "Component", required: true },
                { label: "Plant", required: true },
                { label: "On-hand Stock", required: true },
                { label: "Production Plan", required: true },
                { label: "Conversion Factor", required: false },
                { label: "", required: false },
              ].map((h, i) => (
                <th
                  key={h.label || `col-${i}`}
                  className="px-3 py-2 text-left font-bold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: "#94a3b8", fontSize: 9 }}
                >
                  {h.label}
                  {h.required && <span style={{ color: "#dc2626" }}> *</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-xs italic"
                  style={{ color: showErrors ? "#dc2626" : "#94a3b8" }}
                >
                  {showErrors
                    ? "Add at least one row and complete all required fields."
                    : (
                      <>
                        No override rows yet. Click{" "}
                        <button
                          type="button"
                          onClick={addRow}
                          className="cursor-pointer font-normal not-italic hover:underline text-[11px]"
                          style={{ color: C.teal }}
                        >
                          &ldquo;Add row&rdquo;
                        </button>{" "}
                        or{" "}
                        <button
                          type="button"
                          onClick={loadFromBaseline}
                          className="cursor-pointer font-normal not-italic hover:underline text-[11px]"
                          style={{ color: C.teal }}
                        >
                          &ldquo;Load from baseline&rdquo;
                        </button>{" "}
                        to begin.
                      </>
                    )}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td className="px-3 py-2">
                    <select
                      value={row.componentCode}
                      onChange={(e) => updateRow(row.id, { componentCode: e.target.value })}
                      className="px-2 py-1 rounded-lg text-xs focus:outline-none w-full"
                      style={showErrors && !row.componentCode ? errorStyle : inputStyle}
                    >
                      <option value="">Select...</option>
                      {CUSTOM_OVERRIDE_COMPONENT_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.plant}
                      onChange={(e) => updateRow(row.id, { plant: e.target.value })}
                      className="px-2 py-1 rounded-lg text-xs focus:outline-none w-full"
                      style={showErrors && !row.plant ? errorStyle : inputStyle}
                    >
                      <option value="">Select...</option>
                      {CUSTOM_OVERRIDE_PLANT_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.onHandStock}
                      onChange={(e) => updateRow(row.id, { onHandStock: e.target.value })}
                      placeholder="e.g. 55,200"
                      className="px-2 py-1 rounded-lg text-xs focus:outline-none w-full"
                      style={showErrors && !row.onHandStock ? errorStyle : inputStyle}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.productionPlan}
                      onChange={(e) => updateRow(row.id, { productionPlan: e.target.value })}
                      placeholder="e.g. 4,44,444 EA"
                      className="px-2 py-1 rounded-lg text-xs focus:outline-none w-full"
                      style={showErrors && !row.productionPlan ? errorStyle : inputStyle}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.conversionFactor}
                      onChange={(e) => updateRow(row.id, { conversionFactor: e.target.value })}
                      placeholder="e.g. 1.00"
                      className="px-2 py-1 rounded-lg text-xs focus:outline-none w-full"
                      style={inputStyle}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="shrink-0"
                      style={{ color: "#94a3b8" }}
                    >
                      <X size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div
        className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
        style={{ borderTop: "1px solid #f1f5f9" }}
      >
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
          style={{ backgroundColor: "#ffffff", color: C.navy, border: "1px solid #d1d5db" }}
        >
          <Plus size={12} />
          Add row
        </button>
        <div className="flex items-center gap-2">
          {showErrors && (rows.length === 0 || incomplete) && (
            <span className="text-[11px] font-semibold" style={{ color: "#dc2626" }}>
              Complete all required fields highlighted in red.
            </span>
          )}
          <button
            type="button"
            onClick={handleRunCustomScenario}
            className="inline-flex items-center cursor-pointer gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-opacity hover:opacity-90"
            style={{ backgroundColor: C.teal, color: "#fff" }}
          >
            <Zap size={12} />
            Run custom scenario
          </button>
        </div>
      </div>
    </div>
  );
}

const SCENARIO_COMP_VALUES: Record<
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

// Raw production-stop date per site, per scenario (site omitted where that site isn't producing)
const SITE_PRODUCTION_STOP_DATES: Record<string, Record<string, string>> = {
  "no-action": { U535: "29 May 2026" },
  iut: { UTR: "25 May 2026", U535: "19 Jun 2026" },
  "iut-moq": { UTR: "25 May 2026", U535: "22 Jun 2026" },
  moq: { U535: "04 Jun 2026" },
  "iut-moq-break": { UTR: "25 May 2026", U535: "28 Jun 2026" },
};

const MONTH_INDEX: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};
const MONTH_NAMES = Object.keys(MONTH_INDEX);

// Parse a "DD Mon YYYY" date string into a Date
function parseDMYDate(dateStr: string): Date {
  const [day, mon, year] = dateStr.split(" ");
  return new Date(parseInt(year, 10), MONTH_INDEX[mon], parseInt(day, 10));
}

// End of that production week (Sunday) for a "DD Mon YYYY" date string
function getProductionWeekEndDate(dateStr: string): string {
  const d = parseDMYDate(dateStr);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return `${String(d.getDate()).padStart(2, "0")} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

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

const IUT_TRANSFER_OPTIONS: IUTOption[] = [
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
  moqBroken?: number | null;
  totalPrice?: number | null;
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
];

// Procurement data shown in the "IUT + Break MOQ" combo breakdown — order qty
// is kept below each supplier's MOQ (partial top-up broken across suppliers).
const MOQ_PLANT_OPTIONS_BREAK: MOQPlantOption[] = [
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

type PlantRole = "source" | "destination" | "ordering";

const PLANT_BREAKDOWN_BASE: Record<
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

function formatIndianNumber(value: number): string {
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
function computeAfterQtyAndDate(
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

const PROJECT_NAME_OPTIONS = [
  "CBU Transition Q1 2026",
  "Pack Change — Southern Plants",
  "MOQ Rationalisation FY27",
  "SKU Rationalisation Project",
  "Network Optimisation Wave 2",
];

export default function SCIDetail3({ row }: Props) {
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
    navigate({ page: "sci-detail3", srNo });
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

        <div
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
        </div>
      </div>
    </StepSection>
  );
}

function ScenarioComparisonPanel({
  scenarioIds,
  onClose,
  extraScenarios = [],
}: {
  scenarioIds: string[];
  onClose: () => void;
  extraScenarios?: ScenarioRow[];
}) {
  const allScenarios = [...SCENARIOS, ...extraScenarios];
  const scenarios = scenarioIds
    .map((id) => allScenarios.find((s) => s.id === id)!)
    .filter(Boolean);

  const [filter, setFilter] = useState("");

  const filteredComps = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return COMP_BREAKDOWN_ROWS;
    return COMP_BREAKDOWN_ROWS.filter(
      (c) =>
        c.plant.toLowerCase().includes(q) ||
        c.componentCode.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q),
    );
  }, [filter]);

  const groupedByPlant = useMemo(() => {
    const map = new Map<string, { productionPlan: string; rows: typeof filteredComps }>();
    for (const row of filteredComps) {
      if (!map.has(row.plant)) {
        map.set(row.plant, { productionPlan: row.productionPlan, rows: [] });
      }
      map.get(row.plant)!.rows.push(row);
    }
    return Array.from(map.entries()).map(([plant, { productionPlan, rows }]) => ({ plant, productionPlan, rows }));
  }, [filteredComps]);

  const FIXED_COLS = 4; // Component, On-hand Stock, Open PO, Unit Price

  return (
    <div
      className="mt-4 rounded-xl overflow-hidden"
      style={{
        border: `1.5px solid ${C.borderBlue}`,
        boxShadow: "0 4px 20px rgba(21,101,192,0.10)",
      }}
    >
      {/* Header bar */}
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

      {/* Section title + filter */}
      <div
        className="px-5 py-3 flex flex-wrap items-center justify-between gap-3"
        style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}
      >
        <div>
          {/* <p className="text-sm font-bold" style={{ color: C.navy }}>
            Component Breakdown — Scenario Comparison
          </p> */}
          <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
            Consumed and leftover by component across all compared scenarios
          </p>
        </div>
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
            style={{ border: "1px solid #d1d5db", minWidth: 220, color: "#111827" }}
          />
        </div>
      </div>

      {/* Comparison table */}
      <div className="overflow-hidden">
        <table
          className="w-full text-xs"
          style={{ borderCollapse: "collapse" }}
        >
          <thead>
            {/* Group header row */}
            <tr>
              <th
                colSpan={FIXED_COLS}
                className="px-2 py-2 text-left text-[9px] font-bold uppercase tracking-widest"
                style={{
                  backgroundColor: C.navy,
                  color: "rgba(255,255,255,0.5)",
                  borderBottom: "2px solid rgba(255,255,255,0.12)",
                }}
              >
                Component Details
              </th>
              {scenarios.map((s) => (
                <th
                  key={s.id}
                  colSpan={2}
                  className="px-2 py-2 text-center text-[11px] font-bold whitespace-nowrap"
                  style={{
                    backgroundColor: s.id === "no-action" ? "#374151" : C.navy,
                    color: s.isBest ? "#86efac" : "#e2e8f0",
                    borderLeft: "2px solid rgba(255,255,255,0.15)",
                    borderBottom: `2px solid ${s.isBest ? C.green : "rgba(255,255,255,0.15)"}`,
                  }}
                >
                  {s.name}
                </th>
              ))}
            </tr>
            {/* Column header row */}
            <tr style={{ backgroundColor: "#f0f4f8", borderBottom: "1px solid #d1d5db" }}>
              <th
                className="px-2 py-2 text-left text-[9px] font-semibold uppercase tracking-wide"
                style={{ color: "#64748b", width: "22%", borderRight: "1px solid #e2e8f0" }}
              >
                Component
              </th>
              <th
                className="px-2 py-2 text-center text-[9px] font-semibold uppercase tracking-wide"
                style={{ color: "#64748b", width: "8%" }}
              >
                On-hand
                <div className="text-[8px] font-normal normal-case tracking-normal mt-0.5" style={{ color: "#94a3b8" }}>FG EA</div>
              </th>
              <th
                className="px-2 py-2 text-center text-[9px] font-semibold uppercase tracking-wide"
                style={{ color: "#64748b", width: "7%" }}
              >
                Open PO
                <div className="text-[8px] font-normal normal-case tracking-normal mt-0.5" style={{ color: "#94a3b8" }}>FG EA</div>
              </th>
              <th
                className="px-2 py-2 text-center text-[9px] font-semibold uppercase tracking-wide"
                style={{ color: "#64748b", width: "7%", borderRight: "2px solid #d1d5db" }}
              >
                Unit Price
                <div className="text-[8px] font-normal normal-case tracking-normal mt-0.5" style={{ color: "#94a3b8" }}>₹ / Unit</div>
              </th>
              {scenarios.map((s) => (
                <React.Fragment key={s.id}>
                  <th
                    className="px-2 py-2 text-center text-[9px] font-semibold uppercase tracking-wide"
                    style={{ color: "#64748b", borderLeft: "2px solid #d1d5db" }}
                  >
                    Producible FG
                    <div className="text-[8px] font-normal normal-case tracking-normal mt-0.5" style={{ color: "#94a3b8" }}>FG EA</div>
                  </th>
                  <th
                    className="px-2 py-2 text-center text-[9px] font-semibold uppercase tracking-wide"
                    style={{ color: "#64748b" }}
                  >
                    Leftover RMPM
                    <div className="text-[8px] font-normal normal-case tracking-normal mt-0.5" style={{ color: "#94a3b8" }}>EA · ₹</div>
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredComps.length === 0 ? (
              <tr>
                <td
                  colSpan={FIXED_COLS + scenarios.length * 2}
                  className="px-4 py-8 text-center italic"
                  style={{ color: "#94a3b8" }}
                >
                  No components match your filter
                </td>
              </tr>
            ) : (
              groupedByPlant.map(({ plant, productionPlan, rows }) => (
                <React.Fragment key={plant}>
                  {/* Plant separator row */}
                  <tr style={{ backgroundColor: "#f0f4f8", borderTop: "2px solid #d1d5db", borderBottom: "1px solid #d1d5db" }}>
                    <td
                      colSpan={FIXED_COLS}
                      className="px-3 py-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs" style={{ color: C.navy }}>{plant}</span>
                        <span className="text-[10px]" style={{ color: "#64748b" }}>
                          Production Plan: <span className="font-semibold" style={{ color: C.navy }}>{productionPlan}</span>
                        </span>
                      </div>
                    </td>
                    {scenarios.map((s) => {
                      const rawStopDate = SITE_PRODUCTION_STOP_DATES[s.id]?.[plant];
                      const weekEndDate = rawStopDate ? getProductionWeekEndDate(rawStopDate) : null;
                      return (
                        <td
                          key={s.id}
                          colSpan={2}
                          className="px-2 py-1.5 text-center"
                          style={{ borderLeft: "2px solid #d1d5db" }}
                        >
                          {weekEndDate ? (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold whitespace-nowrap"
                              style={{ color: C.navy }}
                            >
                              <Calendar size={10} />
                              Prod. End (wk): {weekEndDate}
                            </span>
                          ) : (
                            <span className="text-[10px]" style={{ color: "#cbd5e1" }}>
                              No production
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {rows.map((comp, rowIdx) => {
                    const badge = comp.type === "PM" ? PM_BADGE : RM_BADGE;
                    return (
                      <tr
                        key={`${plant}-${comp.componentCode}`}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          backgroundColor: "#ffffff",
                        }}
                      >
                        {/* Component: RM/PM badge + code + name below */}
                        <td className="px-2 py-2.5 align-top" style={{ borderRight: "1px solid #e2e8f0" }}>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
                              style={{ backgroundColor: badge.bg, color: badge.color }}
                            >
                              {comp.type}
                            </span>
                            <span className="font-semibold text-xs" style={{ color: "#111827" }}>
                              {comp.componentCode}
                            </span>
                          </div>
                          {comp.description && (
                            <p className="text-[10px] leading-snug" style={{ color: "#64748b" }}>
                              {comp.description}
                            </p>
                          )}
                        </td>
                        {/* On-hand stock */}
                        <td className="px-2 py-2.5 text-center tabular-nums font-medium text-xs" style={{ color: "#374151" }}>
                          {comp.onHandStock}
                        </td>
                        {/* Open PO */}
                        <td className="px-2 py-2.5 text-center tabular-nums font-medium text-xs" style={{ color: comp.openPO !== "—" ? "#374151" : "#94a3b8" }}>
                          {comp.openPO}
                        </td>
                        {/* Unit Price */}
                        <td className="px-2 py-2.5 text-center tabular-nums text-xs" style={{ color: "#374151", borderRight: "2px solid #d1d5db" }}>
                          {comp.unitPrice}
                        </td>
                        {/* Per-scenario columns */}
                        {scenarios.map((s) => {
                          const vals = SCENARIO_COMP_VALUES[s.id]?.[comp.componentCode];
                          const isNil = !vals || vals.leftoverQty === "Nil";
                          return (
                            <React.Fragment key={s.id}>
                              <td className="px-2 py-2.5 text-center tabular-nums font-semibold text-xs" style={{ color: "#374151", borderLeft: "2px solid #e2e8f0" }}>
                                {vals?.producible ?? "—"}
                              </td>
                              <td className="px-2 py-2.5 text-center align-top">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="tabular-nums font-semibold text-xs" style={{ color: isNil ? C.green : "#dc2626" }}>
                                    {vals?.leftoverQty ?? "—"}
                                  </span>
                                  {!isNil && vals?.leftoverVal && (
                                    <span className="tabular-nums text-[10px] font-medium" style={{ color: "#dc2626" }}>
                                      {vals.leftoverVal}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
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

function getCardDefs(sid: string): { sid: string; transferId: TransferScenarioId | null }[] {
  const isCombo = sid === "iut-moq" || sid === "iut-moq-break";
  return isCombo
    ? [
      { sid: "iut", transferId: "iut" as TransferScenarioId },
      { sid: "moq", transferId: "moq" as TransferScenarioId },
    ]
    : [
      {
        sid,
        transferId: sid === "iut" ? ("iut" as TransferScenarioId) : sid === "moq" ? ("moq" as TransferScenarioId) : null,
      },
    ];
}

function ScenarioComparisonStep({
  acceptedId,
  onSelect,
  selTransfer,
  onSelTransfer,
  moqSuppliers,
  onMoqSupplier,
}: {
  acceptedId: string | null;
  onSelect: (id: string) => void;
  selTransfer: string;
  onSelTransfer: (id: string) => void;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
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

  const [showAcceptReasonModal, setShowAcceptReasonModal] = useState(false);
  const [acceptReasonText, setAcceptReasonText] = useState("");
  const [pendingScenario, setPendingScenario] = useState<ScenarioRow | null>(null);
  const [finalAcceptedId, setFinalAcceptedId] = useState<string | null>(null);

  const confirmAccept = (scenario: ScenarioRow) => {
    onSelect(scenario.id);
    setFinalAcceptedId(scenario.id);
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

  const handleAccept = (scenario: ScenarioRow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!scenario.isBest) {
      setPendingScenario(scenario);
      setShowAcceptReasonModal(true);
    } else {
      confirmAccept(scenario);
    }
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

  const [customOverrideRows, setCustomOverrideRows] = useState<CustomOverrideRow[]>(() =>
    COMP_BREAKDOWN_ROWS.map((r, idx) => ({
      id: `custom-row-baseline-${idx}`,
      componentCode: r.componentCode,
      plant: r.plant,
      onHandStock: r.onHandStock,
      productionPlan: r.productionPlan,
      conversionFactor: r.unitPrice,
    })),
  );
  const [customScenarioRun, setCustomScenarioRun] = useState(false);
  const [customScenarioTableIndex, setCustomScenarioTableIndex] = useState(0);
  const [customScenarioResult, setCustomScenarioResult] = useState<{
    businessWaste: string;
    wasteSavings: string | null;
    wasteColor: "teal" | "orange";
    fgDaysCover: string;
  } | null>(null);

  const handleCustomAccept = () => {
    setFinalAcceptedId(CUSTOM_SCENARIO.id);
    toast.success("Custom scenario accepted", {
      description: `${customOverrideRows.length} override row${customOverrideRows.length === 1 ? "" : "s"} applied`,
      duration: 5000,
    });
  };

  const CUSTOM_SCENARIO_TABLE_IDS = ["iut", "moq", "iut-moq", "iut-moq-break"];

  const handleCustomScenarioRun = () => {
    const bestScenario = SCENARIOS.find((s) => s.isBest)!;
    const parseWaste = (v: string | null) => (v ? parseFloat(v.replace(/[₹,]/g, "")) : 5541);
    const parseCover = (v: string | null) => (v ? parseInt(v, 10) : baselineDays);

    const baseWaste = parseWaste(bestScenario.businessWaste);
    const baseCover = parseCover(bestScenario.fgDaysCover);

    const rowCount = customOverrideRows.length;
    const waste = Math.max(0, Math.round(baseWaste - rowCount * 110));
    const cover = baseCover + Math.round(rowCount * 0.5);
    const savings = 5541 - waste;
    const pct = (savings / 5541) * 100;

    setCustomScenarioResult({
      businessWaste: `₹${waste.toLocaleString("en-IN")}`,
      wasteSavings: savings > 0 ? `₹${savings.toLocaleString("en-IN")}` : null,
      wasteColor: pct >= 40 ? "teal" : "orange",
      fgDaysCover: `${cover}d`,
    });
    setCustomScenarioTableIndex((prev) => (customScenarioRun ? (prev + 1) % CUSTOM_SCENARIO_TABLE_IDS.length : 0));
    setCustomScenarioRun(true);
  };

  const TABLE_HEADERS = [
    "Scenario",
    "Business Waste",
    "FG Days Cover",
    "Next Action",
    "",
    "",
  ];

  return (
    <StepSection
      step={3}
      title="Scenario Comparison Report"
      subtitle="System-generated · select a row to view component breakdown below"
    >
      {/* ── Expand/collapse hint — kept prominent above the table so the interaction isn't missed ── */}
      <div
        className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ backgroundColor: C.bgBlue, border: `1px solid ${C.borderBlue}` }}
        title="Click any scenario row to expand its component breakdown inline. Click the row again to collapse it."
      >
        <span
          className="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
          style={{ backgroundColor: C.blue }}
        >
          <ChevronDown size={12} style={{ color: "#fff" }} />
        </span>
        <span className="text-xs font-bold" style={{ color: C.navy }}>
          Click a row to expand its details inline
        </span>
        <span className="text-[11px]" style={{ color: C.blue }}>
          — click again to collapse
        </span>
      </div>

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
              const isAccepted = finalAcceptedId === scenario.id;
              const highlighted = isSelected || isAccepted;
              const coverDelta = parseInt(scenario.fgDaysCover ?? "0") - baselineDays;
              const inCompare = compareIds.has(scenario.id);
              const isMaxed = !inCompare && compareIds.size >= 3;

              return (
                <React.Fragment key={scenario.id}>
                  <tr
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelect(scenario.id)}
                    onKeyDown={(e) => e.key === "Enter" && onSelect(scenario.id)}
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      borderLeft: isAccepted
                        ? `3px solid ${C.green}`
                        : scenario.isBest && !highlighted
                          ? `3px solid ${C.green}`
                          : highlighted
                            ? `3px solid ${C.blue}`
                            : "3px solid transparent",
                      backgroundColor: isAccepted
                        ? "#dcfce7"
                        : highlighted
                          ? "#EFF4FB"
                          : scenario.isBest
                            ? "#f0fdf4"
                            : "#ffffff",
                      outline: isAccepted ? `2px solid ${C.green}` : highlighted ? `2px solid ${C.blue}` : undefined,
                      outlineOffset: highlighted ? -1 : undefined,
                      cursor: "pointer",
                    }}
                  >
                    {/* Scenario */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <ScenarioIcon icon={scenario.icon} isAccepted={highlighted} />
                        <span
                          className="font-semibold whitespace-nowrap"
                          style={{ color: isAccepted ? C.green : highlighted ? C.blue : C.navy }}
                        >
                          {scenario.name}
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
                      {scenario.wasteSavings && (() => {
                        const saved = parseFloat((scenario.wasteSavings ?? "").replace(/[₹,]/g, "")) || 0;
                        const pct = (saved / 5541) * 100;
                        const color = pct >= 40 ? C.teal : pct >= 20 ? "#d97706" : "#dc2626";
                        return (
                          <span className="ml-1.5 font-semibold tabular-nums" style={{ color, fontSize: 10 }}>
                            ↓ {scenario.wasteSavings}
                          </span>
                        );
                      })()}
                    </td>

                    {/* FG Cover */}
                    <td className="px-3 py-3">
                      <span className="font-semibold tabular-nums" style={{ color: "#374151" }}>
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

                    {/* Accept — only for selected row, hidden everywhere once a decision is finalized */}
                    <td className="px-3 py-3">
                      {finalAcceptedId === scenario.id ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold whitespace-nowrap"
                          style={{ backgroundColor: "#dcfce7", color: "#166534", fontSize: 10 }}
                        >
                          <Check size={11} />
                          Accepted
                        </span>
                      ) : (
                        !finalAcceptedId && isSelected && (
                          <button
                            type="button"
                            onClick={(e) => handleAccept(scenario, e)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all hover:opacity-90"
                            style={{ backgroundColor: C.green, color: "#fff", fontSize: 10 }}
                          >
                            <Check size={11} />
                            Accept
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                  {/* Moved below the table — see "Scenario detail expansion (moved below table)" section */}
                  {/* {isSelected && (
                    <tr>
                      <td colSpan={TABLE_HEADERS.length} style={{ padding: 0 }}>
                        <div style={{ overflow: "auto", marginTop: 6, borderBottom: "2px solid #e2e8f0" }}>
                          <div style={{ padding: 12 }}>
                            <ScenarioDetailCard
                              key={scenario.id}
                              scenarioId={scenario.id}
                              cardDefs={getCardDefs(scenario.id)}
                              selTransfer={selTransfer}
                              onSelTransfer={onSelTransfer}
                              moqSuppliers={moqSuppliers}
                              onMoqSupplier={onMoqSupplier}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )} */}
                </React.Fragment>
              );
            })}

            {/* No Action — baseline row */}
            {(() => {
              const isSelected = acceptedId === "no-action";
              const isAccepted = finalAcceptedId === "no-action";
              const highlighted = isSelected || isAccepted;
              const inCompare = compareIds.has(baseline.id);
              const isMaxed = !inCompare && compareIds.size >= 3;
              return (
                <tr
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect("no-action")}
                  onKeyDown={(e) => e.key === "Enter" && onSelect("no-action")}
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    borderLeft: isAccepted ? `3px solid ${C.green}` : highlighted ? `3px solid ${C.blue}` : "3px solid transparent",
                    backgroundColor: isAccepted ? "#f0fdf4" : highlighted ? "#EFF4FB" : "#fff7f5",
                    outline: isAccepted ? `2px solid ${C.green}` : highlighted ? `2px solid ${C.blue}` : undefined,
                    outlineOffset: highlighted ? -1 : undefined,
                    cursor: "pointer",
                  }}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <ScenarioIcon icon="no-action" isAccepted={highlighted} />
                      <span className="font-semibold" style={{ color: "#64748b" }}>
                        {baseline.name}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
                        style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}
                      >
                        BASE
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

                  {/* Accept — only for selected row, hidden everywhere once a decision is finalized */}
                  <td className="px-3 py-3">
                    {finalAcceptedId === "no-action" ? (
                      <span
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap"
                        style={{ backgroundColor: C.green, color: "#fff", fontSize: 10 }}
                      >
                        <Check size={11} />
                        Accepted
                      </span>
                    ) : (
                      !finalAcceptedId && isSelected && (
                        <button
                          type="button"
                          onClick={(e) => handleAccept(baseline, e)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all hover:opacity-90"
                          style={{ backgroundColor: C.green, color: "#fff", fontSize: 10 }}
                        >
                          <Check size={11} />
                          Accept
                        </button>
                      )
                    )}
                  </td>
                </tr>
              );
            })()}

            {/* Custom — user-defined scenario */}
            {(() => {
              const isSelected = acceptedId === CUSTOM_SCENARIO.id;
              const isAccepted = finalAcceptedId === CUSTOM_SCENARIO.id;
              const highlighted = isSelected || isAccepted;
              const inCompare = compareIds.has(CUSTOM_SCENARIO.id);
              const isMaxed = !inCompare && compareIds.size >= 3;
              return (
                <React.Fragment>
                <tr
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(CUSTOM_SCENARIO.id)}
                  onKeyDown={(e) => e.key === "Enter" && onSelect(CUSTOM_SCENARIO.id)}
                  style={{
                    borderTop: "1px solid #e2e8f0",
                    borderLeft: isAccepted ? `3px solid ${C.green}` : highlighted ? `3px solid ${C.blue}` : "3px solid transparent",
                    backgroundColor: isAccepted ? "#f0fdf4" : highlighted ? "#EFF4FB" : "#ffffff",
                    outline: isAccepted ? `2px solid ${C.green}` : highlighted ? `2px solid ${C.blue}` : undefined,
                    outlineOffset: highlighted ? -1 : undefined,
                    cursor: "pointer",
                  }}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <ScenarioIcon icon="custom" />
                      <span className="font-semibold whitespace-nowrap" style={{ color: isAccepted ? C.green : highlighted ? C.blue : C.navy }}>
                        Custom
                      </span>
                    </div>
                  </td>

                  {customScenarioResult ? (
                    <>
                      {/* Business waste + savings */}
                      <td className="px-3 py-3">
                        <span
                          className="font-bold tabular-nums"
                          style={{
                            color: customScenarioResult.wasteColor === "teal" ? C.teal : "#dc2626",
                          }}
                        >
                          {customScenarioResult.businessWaste}
                        </span>
                        {customScenarioResult.wasteSavings && (() => {
                          const saved = parseFloat((customScenarioResult.wasteSavings ?? "").replace(/[₹,]/g, "")) || 0;
                          const pct = (saved / 5541) * 100;
                          const color = pct >= 40 ? C.teal : pct >= 20 ? "#d97706" : "#dc2626";
                          return (
                            <span className="ml-1.5 font-semibold tabular-nums" style={{ color, fontSize: 10 }}>
                              ↓ {customScenarioResult.wasteSavings}
                            </span>
                          );
                        })()}
                      </td>

                      {/* FG Cover */}
                      <td className="px-3 py-3">
                        <span className="font-semibold tabular-nums" style={{ color: "#374151" }}>
                          {customScenarioResult.fgDaysCover}
                        </span>
                        {(() => {
                          const coverDelta = parseInt(customScenarioResult.fgDaysCover ?? "0", 10) - baselineDays;
                          return coverDelta > 0 ? (
                            <span className="ml-1.5 font-semibold" style={{ color: C.green, fontSize: 10 }}>
                              +{coverDelta}d
                            </span>
                          ) : null;
                        })()}
                      </td>
                    </>
                  ) : (
                    <td className="px-3 py-3" colSpan={2}>
                      <span className="text-xs italic" style={{ color: "#94a3b8" }}>
                        Enter overrides below
                      </span>
                    </td>
                  )}

                  <td className="px-3 py-3">
                    <span style={{ color: "#cbd5e1" }}>—</span>
                  </td>

                  {/* Compare — only available once the custom scenario has been run */}
                  <td className="px-3 py-3" style={{ borderLeft: "1px solid #e2e8f0" }}>
                    {customScenarioRun && (
                      <button
                        type="button"
                        onClick={(e) => toggleCompare(CUSTOM_SCENARIO.id, e)}
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
                    )}
                  </td>

                  {/* Accept — only while the Custom row is selected/expanded, hidden everywhere once a decision is finalized */}
                  <td className="px-3 py-3">
                    {finalAcceptedId === CUSTOM_SCENARIO.id ? (
                      <span
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap"
                        style={{ backgroundColor: C.green, color: "#fff", fontSize: 10 }}
                      >
                        <Check size={11} />
                        Accepted
                      </span>
                    ) : (
                      !finalAcceptedId && isSelected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCustomAccept();
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all hover:opacity-90"
                          style={{ backgroundColor: C.green, color: "#fff", fontSize: 10 }}
                        >
                          <Check size={11} />
                          Accept
                        </button>
                      )
                    )}
                  </td>
                </tr>
                {/* Moved below the table — see "Custom scenario detail (moved below table)" section */}
                {/* {isSelected && (
                  <tr>
                    <td colSpan={TABLE_HEADERS.length} style={{ padding: 0 }}>
                      <div style={{ overflow: "auto", marginTop: 6, borderBottom: "2px solid #e2e8f0" }}>
                        <div style={{ padding: 12 }} className="space-y-3">
                          <CustomOverridesForm
                            rows={customOverrideRows}
                            onRowsChange={setCustomOverrideRows}
                            onRun={handleCustomScenarioRun}
                          />
                          {customScenarioRun && (() => {
                            const sid = CUSTOM_SCENARIO_TABLE_IDS[customScenarioTableIndex];
                            return (
                              <ScenarioDetailCard
                                key={sid}
                                scenarioId={sid}
                                cardDefs={getCardDefs(sid)}
                                selTransfer={selTransfer}
                                onSelTransfer={onSelTransfer}
                                moqSuppliers={moqSuppliers}
                                onMoqSupplier={onMoqSupplier}
                              />
                            );
                          })()}
                        </div>
                      </div>
                    </td>
                  </tr>
                )} */}
                </React.Fragment>
              );
            })()}
          </tbody>
        </table>
      </div>

      {/* Scenario detail expansion (moved below table) */}
      {acceptedId === CUSTOM_SCENARIO.id ? (
        <div className="mt-3 space-y-3">
          <CustomOverridesForm
            rows={customOverrideRows}
            onRowsChange={setCustomOverrideRows}
            onRun={handleCustomScenarioRun}
          />
          {customScenarioRun && (() => {
            const sid = CUSTOM_SCENARIO_TABLE_IDS[customScenarioTableIndex];
            return (
              <ScenarioDetailCard
                key={sid}
                scenarioId={sid}
                cardDefs={getCardDefs(sid)}
                selTransfer={selTransfer}
                onSelTransfer={onSelTransfer}
                moqSuppliers={moqSuppliers}
                onMoqSupplier={onMoqSupplier}
              />
            );
          })()}
        </div>
      ) : (() => {
        const selectedScenario = ranked.find((s) => s.id === acceptedId);
        if (!selectedScenario) return null;
        return (
          <div className="mt-3">
            <ScenarioDetailCard
              key={selectedScenario.id}
              scenarioId={selectedScenario.id}
              cardDefs={getCardDefs(selectedScenario.id)}
              selTransfer={selTransfer}
              onSelTransfer={onSelTransfer}
              moqSuppliers={moqSuppliers}
              onMoqSupplier={onMoqSupplier}
            />
          </div>
        );
      })()}

      <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-col gap-1">
          <p className="text-[11px]" style={{ color: "#94a3b8" }}>
            ↓ Savings vs No Action baseline
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px]" style={{ color: "#94a3b8" }}>Reduction %:</span>
            {([
              { color: C.teal, label: "≥ 40%", meaning: "Excellent" },
              { color: "#d97706", label: "20–39%", meaning: "Moderate" },
              { color: "#dc2626", label: "< 20%", meaning: "Poor" },
            ] as { color: string; label: string; meaning: string }[]).map(({ color, label, meaning }) => (
              <span key={label} className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
                <span className="text-[10px]" style={{ color: "#94a3b8" }}>{meaning}</span>
              </span>
            ))}
          </div>
        </div>
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
          extraScenarios={[CUSTOM_SCENARIO]}
        />
      )}

      {showAcceptReasonModal && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => { setShowAcceptReasonModal(false); setAcceptReasonText(""); setPendingScenario(null); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            style={{ border: "1px solid #e2e8f0" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#fffbeb" }}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#fef3c7" }}>
                  <Star size={15} style={{ color: "#d97706" }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "#92400e" }}>Better option available</p>
                  <p className="text-xs mt-0.5" style={{ color: "#b45309" }}>
                    There is a best option available. Why did you choose this option instead?
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <textarea
                value={acceptReasonText}
                onChange={(e) => setAcceptReasonText(e.target.value)}
                placeholder="Enter your reason here…"
                rows={4}
                className="w-full rounded-lg text-xs resize-none outline-none focus:ring-2 px-3 py-2"
                style={{ border: "1px solid #cbd5e1", color: "#1e293b", lineHeight: 1.6 }}
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAcceptReasonModal(false); setAcceptReasonText(""); setPendingScenario(null); }}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: "#e2e8f0", color: "#64748b" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!acceptReasonText.trim()}
                  onClick={() => {
                    if (pendingScenario) confirmAccept(pendingScenario);
                    setShowAcceptReasonModal(false);
                    setAcceptReasonText("");
                    setPendingScenario(null);
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity"
                  style={{
                    backgroundColor: acceptReasonText.trim() ? C.blue : "#93c5fd",
                    color: "#fff",
                    cursor: acceptReasonText.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Submit & Accept
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
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

const NO_ACTION_WASTE = 5541;

function bizWasteColor(wasteAfter: number, wasteBefore = NO_ACTION_WASTE): string {
  const reductionPct = wasteBefore > 0 ? ((wasteBefore - wasteAfter) / wasteBefore) * 100 : 0;
  if (reductionPct >= 40) return C.teal;
  if (reductionPct >= 20) return "#d97706";
  return "#dc2626";
}

function ScenarioDetailCard({
  scenarioId,
  cardDefs,
  selTransfer,
  onSelTransfer,
  moqSuppliers,
  onMoqSupplier,
}: {
  scenarioId: string;
  cardDefs: { sid: string; transferId: TransferScenarioId | null }[];
  selTransfer: string;
  onSelTransfer: (id: string) => void;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
}) {
  const [hasChanges, setHasChanges] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleSelTransfer = (id: string) => {
    if (id !== selTransfer) {
      setHasChanges(true);
      setAlertDismissed(false);
    }
    onSelTransfer(id);
  };
  const handleMoqSupplier = (plantId: string, supplierId: string) => {
    if (moqSuppliers[plantId] !== supplierId) {
      setHasChanges(true);
      setAlertDismissed(false);
    }
    onMoqSupplier(plantId, supplierId);
  };

  const showTransfer =
    scenarioId === "iut" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break";
  const showMOQTable = scenarioId === "moq";
  const transferCount = scenarioId === "iut-moq" ? 3 : 2;
  const transferOptions = IUT_TRANSFER_OPTIONS.slice(0, showTransfer ? transferCount : 0);

  // Primary = IUT card (first). Secondary = additional scenarios shown below (e.g. MOQ in combo).
  const primaryDef = cardDefs[0];
  const secondaryDefs = cardDefs.slice(1);
  const primaryScenario = SCENARIOS.find((s) => s.id === primaryDef.sid);
  const primaryTransfer = primaryDef.transferId
    ? { ...TRANSFER_OPTION_BASE, ...TRANSFER_SCENARIO_CONFIG[primaryDef.transferId] }
    : null;

  const transferRows: { label: string; render: (o: IUTOption) => React.ReactNode }[] = [
    {
      label: "Business Waste",
      render: (o) => (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-bold tabular-nums" style={{ color: bizWasteColor(o.businessWasteAfter, o.businessWasteBefore) }}>
            ₹{o.businessWasteAfter.toLocaleString("en-IN")}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums" style={{ color: C.green }}>
            ↓ ₹{o.reductionVsNoAction.toLocaleString("en-IN")}
          </span>
        </div>
      ),
    },
    {
      label: "Material",
      render: (o) => {
        const [type, ...rest] = o.material.split(" ");
        const badge = type === "RM" ? RM_BADGE : type === "PM" ? PM_BADGE : { bg: "#f1f5f9", color: "#64748b" };
        return (
          <span className="flex items-center justify-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>
              {type}
            </span>
            <span className="text-[10px] font-bold" style={{ color: C.navy }}>{rest.join(" ")}</span>
          </span>
        );
      },
    },
    {
      label: "Transfer Qty",
      render: (o) => (
        <span className="text-xs tabular-nums" style={{ color: "#374151" }}>
          {o.transferQty.toLocaleString("en-IN")} units
        </span>
      ),
    },
    {
      label: "Lead Time",
      render: (o) => (
        <span className="text-xs tabular-nums" style={{ color: "#374151" }}>
          {o.transferLeadTime}
        </span>
      ),
    },
    {
      label: "IUT Initiation Date",
      render: (o) => (
        <span className="text-xs font-semibold tabular-nums" style={{ color: C.navy }}>
          {o.initiationDate}
        </span>
      ),
    },
    {
      label: "Lane",
      render: (o) =>
        o.laneAvailable === true ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.green }}>
            <Check size={10} strokeWidth={2.5} />Available
          </span>
        ) : o.laneAvailable === false ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#ea580c" }}>
            <Link2Off size={10} />Unavailable
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#d97706" }}>
            <Clock size={10} />Not set
          </span>
        ),
    },
    {
      label: "Cost / Trip",
      render: (o) => (
        <span className="text-xs" style={{ color: "#374151" }}>₹{o.costPerTrip.toLocaleString("en-IN")}</span>
      ),
    },
    {
      label: "Prod. Stop (Source)",
      render: (o) => (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-medium" style={{ color: "#94a3b8" }}>{o.routeFrom}</span>
          <span className="text-xs font-semibold" style={{ color: "#374151" }}>{o.prodStopSource}</span>
        </div>
      ),
    },
    {
      label: "Prod. Stop (Dest)",
      render: (o) => (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-medium" style={{ color: "#94a3b8" }}>{o.routeTo}</span>
          <span className="text-xs font-semibold" style={{ color: "#374151" }}>{o.prodStopDest}</span>
        </div>
      ),
    },
  ];

  if (!primaryScenario) return null;

  const isComboLayout = showTransfer && secondaryDefs.length > 0;
  const overallScenario = SCENARIOS.find((s) => s.id === scenarioId) ?? primaryScenario;

  const cardBody = (
    <>
      {/* ── Card header — full screen toggle ── */}
      <div
        className="px-3 py-1.5 flex items-center justify-between gap-2"
        style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#fff" }}
      >
        <span className="text-xs font-bold truncate" style={{ color: C.navy }}>
          {overallScenario.name}
        </span>
        {isComboLayout && (
          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            className="flex items-center cursor-pointer justify-center rounded-md shrink-0 transition-colors hover:bg-slate-100"
            style={{ width: 24, height: 24, color: "#64748b", border: "1px solid #e2e8f0" }}
            title={isFullscreen ? "Exit full screen" : "Full screen"}
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        )}
      </div>

      <div className={isComboLayout ? "flex items-stretch" : undefined} style={isFullscreen ? { flex: "1 1 auto", overflow: "auto" } : undefined}>
        {/* ── Section 1: IUT / MOQ transfer table ── */}
        <div style={{ flex: isComboLayout ? "1 1 0" : undefined, borderRight: isComboLayout ? "2px solid #e2e8f0" : undefined, minWidth: 0, overflow: "auto" }}>

          {/* MOQ procurement table (standalone moq scenario) */}
          {showMOQTable && (
            <div>
              <div
                className="px-3 py-1.5 flex items-center gap-1.5"
                style={{ borderBottom: "1px solid #cbd5e1", backgroundColor: "#f1f5f9" }}
              >
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: C.blue }}>
                  Procurement Options
                </span>
                <span className="ml-1 text-[9px]" style={{ color: "#94a3b8" }}>· change supplier to update data</span>
              </div>
              <table className="border-collapse" style={{ width: "100%", minWidth: "max-content" }}>
                <thead>
                  <tr>
                    <th
                      className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
                      style={{ color: "#94a3b8", backgroundColor: "#f1f5f9", borderBottom: "2px solid #cbd5e1", borderRight: "1px solid #e2e8f0", minWidth: 100 }}
                    >
                      Metric
                    </th>
                    {MOQ_PLANT_OPTIONS.map((plant) => (
                      <th
                        key={plant.id}
                        className="px-3 py-2 text-center"
                        style={{ backgroundColor: plant.isBest ? "#dbeafe" : "#f1f5f9", borderBottom: `2px solid ${plant.isBest ? C.blue : "#cbd5e1"}`, minWidth: 150 }}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold" style={{ color: C.navy }}>{plant.plant}</span>
                            {plant.isBest && (
                              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold" style={{ backgroundColor: C.green, color: "#fff" }}>
                                <Star size={6} fill="currentColor" />Best
                              </span>
                            )}
                          </div>
                          <label className="flex items-center gap-1 w-full">
                            <span className="text-[9px] font-semibold whitespace-nowrap" style={{ color: "#94a3b8" }}>Supplier</span>
                            <select
                              value={moqSuppliers[plant.id]}
                              onChange={(e) => handleMoqSupplier(plant.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] rounded px-1.5 py-0.5 w-full cursor-pointer"
                              style={{ border: `1px solid ${C.blue}`, color: C.navy, backgroundColor: "#fff", outline: "none" }}
                            >
                              {plant.suppliers.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      { label: "Business Waste", render: (_p: MOQPlantOption, s: MOQSupplierData) => <span className="text-xs font-bold tabular-nums" style={{ color: bizWasteColor(s.bizWaste) }}>₹{s.bizWaste.toLocaleString("en-IN")}</span> },
                      { label: "Material", render: (p: MOQPlantOption, _s: MOQSupplierData) => { const [type, ...rest] = p.material.split(" "); const badge = type === "RM" ? RM_BADGE : type === "PM" ? PM_BADGE : { bg: "#f1f5f9", color: "#64748b" }; return <span className="flex items-center justify-center gap-1.5"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>{type}</span><span className="text-[10px] font-bold" style={{ color: C.navy }}>{rest.join(" ")}</span></span>; } },
                      { label: "Order Qty", render: (p: MOQPlantOption, _s: MOQSupplierData) => <span className="text-xs tabular-nums" style={{ color: "#374151" }}>{p.orderQty.toLocaleString("en-IN")} units</span> },
                      { label: "MOQ", render: (_p: MOQPlantOption, s: MOQSupplierData) => <span className="text-xs font-semibold tabular-nums" style={{ color: "#374151" }}>{s.moq.toLocaleString("en-IN")} units</span> },
                      { label: "Price / Unit", render: (_p: MOQPlantOption, s: MOQSupplierData) => <span className="text-xs tabular-nums" style={{ color: "#374151" }}>₹{s.pricePerUnit}</span> },
                      { label: "Production Date", render: (_p: MOQPlantOption, s: MOQSupplierData) => <span className="text-xs font-semibold" style={{ color: "#374151" }}>{s.productionDate}</span> },
                    ] as { label: string; render: (p: MOQPlantOption, s: MOQSupplierData) => React.ReactNode }[]
                  ).map((row, i) => (
                    <tr key={row.label} style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
                      <td className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#94a3b8", borderRight: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
                        {row.label}
                      </td>
                      {MOQ_PLANT_OPTIONS.map((plant) => {
                        const selSup = plant.suppliers.find((s) => s.id === moqSuppliers[plant.id]) ?? plant.suppliers[0];
                        return (
                          <td key={plant.id} className="px-3 py-1.5 text-center">
                            {row.render(plant, selSup)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* IUT transfer options table */}
          {showTransfer && transferOptions.length > 0 && (
            <div>
              {/* Sub-header */}
              <div
                className="px-3 py-1.5 flex items-center gap-1.5"
                style={{ borderBottom: hasChanges && !alertDismissed ? "none" : "1px solid #cbd5e1", backgroundColor: "#f1f5f9" }}
              >
                <ArrowLeftRight size={9} style={{ color: C.blue }} />
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: C.blue }}>
                  IUT Options
                </span>
                <span className="ml-1 text-[9px]" style={{ color: "#94a3b8" }}>
                  · click a column to select
                </span>
              </div>
              {hasChanges && !alertDismissed && (
                <div
                  className="px-3 py-2 flex items-center justify-between gap-2"
                  style={{ backgroundColor: "#fffbeb", borderBottom: "1px solid #fde68a", borderTop: "1px solid #fde68a" }}
                >
                  <div className="flex items-center gap-1.5">
                    <Zap size={11} style={{ color: "#d97706", flexShrink: 0 }} />
                    <span className="text-[10px] font-semibold" style={{ color: "#92400e" }}>
                      This option needs a plan change
                    </span>
                    <span className="text-[10px]" style={{ color: "#b45309" }}>
                      — review the selected route before raising STO
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlertDismissed(true)}
                    className="shrink-0"
                    style={{ color: "#d97706" }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <table className="border-collapse" style={{ width: "100%", minWidth: "max-content" }}>
                <thead>
                  <tr style={{ height: 64 }}>
                    <th
                      className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
                      style={{
                        color: "#94a3b8",
                        backgroundColor: "#f1f5f9",
                        borderBottom: "2px solid #cbd5e1",
                        borderRight: "1px solid #e2e8f0",
                        minWidth: 100,
                      }}
                    >
                      Metric
                    </th>
                    {transferOptions.map((o) => {
                      const isSel = selTransfer === o.id;
                      return (
                        <th
                          key={o.id}
                          className="px-3 py-2 text-center cursor-pointer select-none"
                          style={{
                            backgroundColor: isSel ? C.navy : o.isBest ? "#dbeafe" : "#f1f5f9",
                            borderBottom: `2px solid ${isSel ? C.blue : o.isBest ? C.blue : "#cbd5e1"}`,
                            minWidth: 120,
                          }}
                          onClick={() => handleSelTransfer(o.id)}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[11px] font-bold leading-tight" style={{ color: isSel ? "#fff" : C.navy }}>
                              {o.routeFrom}
                              <span className="mx-1 opacity-60" style={{ color: isSel ? "#fff" : C.blue }}>→</span>
                              {o.routeTo}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px]" style={{ color: isSel ? "rgba(255,255,255,0.6)" : "#64748b" }}>{o.label}</span>
                              {o.isBest && !isSel && (
                                <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold" style={{ backgroundColor: C.green, color: "#fff" }}>
                                  <Star size={6} fill="currentColor" />Best
                                </span>
                              )}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {transferRows.map((row, i) => (
                    <tr key={row.label} style={{ height: 44, backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
                      <td
                        className="px-3 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
                        style={{ color: "#94a3b8", borderRight: "1px solid #e2e8f0", backgroundColor: "#ffffff", verticalAlign: "middle" }}
                      >
                        {row.label}
                      </td>
                      {transferOptions.map((o) => {
                        const isSel = selTransfer === o.id;
                        return (
                          <td
                            key={o.id}
                            className="px-3 text-center cursor-pointer"
                            style={{
                              verticalAlign: "middle",
                              backgroundColor: isSel ? "rgba(21,101,192,0.05)" : undefined,
                              borderLeft: isSel ? `2px solid ${C.blue}` : undefined,
                              borderRight: isSel ? `2px solid ${C.blue}` : undefined,
                            }}
                            onClick={() => handleSelTransfer(o.id)}
                          >
                            {row.render(o)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Section 2: secondary scenarios (MOQ) as two-panel card below ── */}
        {secondaryDefs.map(({ sid }) => {
          const sc = SCENARIOS.find((s) => s.id === sid);
          if (!sc) return null;
          const isMoq = sid === "moq";
          const isBreakMoq = scenarioId === "iut-moq-break";
          const moqPanelData = isBreakMoq ? MOQ_PLANT_OPTIONS_BREAK : MOQ_PLANT_OPTIONS;

          return (
            <div key={sid} style={{ flex: isComboLayout ? "1 1 0" : undefined, borderTop: isComboLayout ? undefined : "2px solid #e2e8f0", minWidth: 0, overflow: "auto" }}>
              {!isComboLayout && (
                <div
                  className="px-4 py-1.5 flex items-center gap-2"
                  style={{ backgroundColor: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}
                >
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
                    Additional Scenario
                  </span>
                </div>
              )}

              <div>
                {/* Procurement options table */}
                {isMoq && (
                  <div>
                    {/* Sub-header */}
                    <div
                      className="px-3 py-1.5 flex items-center gap-1.5"
                      style={{ borderBottom: "1px solid #cbd5e1", backgroundColor: "#f1f5f9" }}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: C.blue }}>
                        Procurement Options
                      </span>
                      <span className="ml-1 text-[9px]" style={{ color: "#94a3b8" }}>· change supplier to update data</span>
                    </div>

                    <table className="border-collapse" style={{ width: "100%", minWidth: "max-content" }}>
                      <thead>
                        <tr style={{ height: 64 }}>
                          {/* Metric label column */}
                          <th
                            className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
                            style={{ color: "#94a3b8", backgroundColor: "#f1f5f9", borderBottom: "2px solid #cbd5e1", borderRight: "1px solid #e2e8f0", minWidth: 100 }}
                          >
                            Metric
                          </th>
                          {/* One column per plant */}
                          {moqPanelData.map((plant) => (
                            <th
                              key={plant.id}
                              className="px-3 py-2 text-center"
                              style={{
                                backgroundColor: plant.isBest ? "#dbeafe" : "#f1f5f9",
                                borderBottom: `2px solid ${plant.isBest ? C.blue : "#cbd5e1"}`,
                                minWidth: 150,
                              }}
                            >
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] font-bold" style={{ color: C.navy }}>{plant.plant}</span>
                                  {plant.isBest && (
                                    <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold" style={{ backgroundColor: C.green, color: "#fff" }}>
                                      <Star size={6} fill="currentColor" />Best
                                    </span>
                                  )}
                                </div>
                                <label className="flex items-center gap-1 w-full">
                                  <span className="text-[9px] font-semibold whitespace-nowrap" style={{ color: "#94a3b8" }}>Supplier</span>
                                  <select
                                    value={moqSuppliers[plant.id]}
                                    onChange={(e) => handleMoqSupplier(plant.id, e.target.value)}
                                    className="text-[10px] rounded px-1.5 py-0.5 w-full cursor-pointer"
                                    style={{ border: `1px solid ${C.blue}`, color: C.navy, backgroundColor: "#fff", outline: "none" }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {plant.suppliers.map((s) => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                  </select>
                                </label>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(
                          [
                            {
                              label: "Business Waste",
                              render: (_plant: MOQPlantOption, sup: MOQSupplierData) => (
                                <span className="text-xs font-bold tabular-nums" style={{ color: bizWasteColor(sup.bizWaste) }}>₹{sup.bizWaste.toLocaleString("en-IN")}</span>
                              ),
                            },
                            {
                              label: "Material",
                              render: (plant: MOQPlantOption, _sup: MOQSupplierData) => {
                                const [type, ...rest] = plant.material.split(" ");
                                const badge = type === "RM" ? RM_BADGE : type === "PM" ? PM_BADGE : { bg: "#f1f5f9", color: "#64748b" };
                                return (
                                  <span className="flex items-center justify-center gap-1.5">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>
                                      {type}
                                    </span>
                                    <span className="text-[10px] font-bold" style={{ color: C.navy }}>{rest.join(" ")}</span>
                                  </span>
                                );
                              },
                            },
                            {
                              label: "Order Qty",
                              render: (plant: MOQPlantOption, _sup: MOQSupplierData) => (
                                <span className="text-xs tabular-nums" style={{ color: "#374151" }}>{plant.orderQty.toLocaleString("en-IN")} units</span>
                              ),
                            },
                            {
                              label: "MOQ",
                              render: (_plant: MOQPlantOption, sup: MOQSupplierData) => (
                                <span className="text-xs tabular-nums font-semibold" style={{ color: "#374151" }}>{sup.moq.toLocaleString("en-IN")} units</span>
                              ),
                            },
                            ...(isBreakMoq
                              ? [
                                {
                                  label: "MOQ Broken",
                                  render: (plant: MOQPlantOption, _sup: MOQSupplierData) => (
                                    plant.moqBroken != null ? (
                                      <span className="text-xs tabular-nums font-semibold" style={{ color: "#374151" }}>{plant.moqBroken.toLocaleString("en-IN")} units</span>
                                    ) : (
                                      <span className="text-xs" style={{ color: "#374151" }}>—</span>
                                    )
                                  ),
                                },
                              ]
                              : []),
                            {
                              label: "Price / Unit",
                              render: (_plant: MOQPlantOption, sup: MOQSupplierData) => (
                                <span className="text-xs tabular-nums" style={{ color: "#374151" }}>₹{sup.pricePerUnit}</span>
                              ),
                            },
                            ...(isBreakMoq
                              ? [
                                {
                                  label: "Total Price",
                                  render: (plant: MOQPlantOption, sup: MOQSupplierData) => (
                                    <span className="text-xs font-bold tabular-nums" style={{ color: plant.totalPrice != null ? "#d97706" : C.navy }}>₹{(plant.totalPrice ?? plant.orderQty * sup.pricePerUnit).toLocaleString("en-IN")}</span>
                                  ),
                                },
                              ]
                              : []),
                            {
                              label: "Production Date",
                              render: (_plant: MOQPlantOption, sup: MOQSupplierData) => (
                                <span className="text-xs font-semibold" style={{ color: "#374151" }}>{sup.productionDate}</span>
                              ),
                            },
                          ] as { label: string; render: (p: MOQPlantOption, s: MOQSupplierData) => React.ReactNode }[]
                        ).map((row, i) => (
                          <tr key={row.label} style={{ height: 44, backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
                            <td
                              className="px-3 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
                              style={{ color: "#94a3b8", borderRight: "1px solid #e2e8f0", backgroundColor: "#ffffff", verticalAlign: "middle" }}
                            >
                              {row.label}
                            </td>
                            {moqPanelData.map((plant) => {
                              const selSup = plant.suppliers.find((s) => s.id === moqSuppliers[plant.id]) ?? plant.suppliers[0];
                              return (
                                <td key={plant.id} className="px-3 text-center" style={{ verticalAlign: "middle" }}>
                                  {row.render(plant, selSup)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasChanges && (
        <div
          className="px-4 py-3 flex items-center justify-between gap-3"
          style={{ borderTop: "2px solid #bfdbfe", backgroundColor: "#eff6ff" }}
        >
          <p className="text-xs" style={{ color: C.blue }}>
            <span className="font-semibold">Unsaved changes</span>
            {" — "}review your selection before applying.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHasChanges(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ backgroundColor: "#e2e8f0", color: "#64748b" }}
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => {
                setHasChanges(false);
                toast.success("Changes applied", {
                  description: "Scenario updated with your selection.",
                  duration: 3000,
                });
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ backgroundColor: C.blue, color: "#fff" }}
            >
              Apply Changes
            </button>
          </div>
        </div>
      )}
    </>
  );

  if (isFullscreen) {
    return createPortal(
      <div
        className="fixed inset-0 flex flex-col bg-white"
        style={{ zIndex: 100 }}
      >
        {cardBody}
      </div>,
      document.body
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden bg-white"
      style={{ width: isComboLayout ? "100%" : "max-content", minWidth: isComboLayout ? undefined : "50%", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}
    >
      {cardBody}
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

  const breakdownSubtitle = `RM/PM stock, open POs, and leftover waste · ${row.cbuCode}`;

  const [filter, setFilter] = useState("");
  const [stockExpanded, setStockExpanded] = useState(false);
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

  const hasAnyMatch = plantBlocks.some(
    (b) => filterComponents(b.rowsByState.before, b.code).length > 0,
  );

  const totalCols = getBreakdownColumnCount(stockExpanded);
  const headerColumns = [
    "Component",
    ...getStockSubColumns(stockExpanded),
    ...BREAKDOWN_TAIL_COLUMNS,
  ];

  if (scenarioId === "predefined") {
    const d = PREDEFINED_DETAIL;
    const productionStopDate = "—";
    const savingsAmount = d.moq.originalOrderCost - d.moq.totalOrderCost;

    const summaryRows: { label: string; node: React.ReactNode }[] = [
      { label: "Business Waste", node: <span className="text-xs font-bold tabular-nums" style={{ color: C.teal }}>{d.businessWaste}</span> },
      { label: "Reduction vs No Action", node: <span className="text-xs font-bold tabular-nums" style={{ color: C.green }}>↓ {d.wasteSavings}</span> },
      { label: "Production Cover", node: <span className="text-xs font-bold tabular-nums" style={{ color: C.navy }}>{d.fgDaysCover}</span> },
    ];
    const transferRows: { label: string; node: React.ReactNode }[] = [
      { label: "Transfer Location", node: <span className="text-xs font-semibold" style={{ color: C.navy }}>{d.transfer.from} <span style={{ color: C.blue }}>→</span> {d.transfer.to}</span> },
      { label: "Transfer Quantity", node: <span className="text-xs tabular-nums" style={{ color: C.navy }}>{d.transfer.qty.toLocaleString("en-IN")} units</span> },
      {
        label: "Lane Availability", node: d.transfer.laneAvailable
          ? <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.green }}><Check size={11} strokeWidth={2.5} />Available</span>
          : <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#dc2626" }}><Link2Off size={11} />Unavailable</span>
      },
      { label: "Cost of Transfer", node: <span className="text-xs tabular-nums" style={{ color: C.navy }}>₹{d.transfer.costPerTrip.toLocaleString("en-IN")} / trip</span> },
      { label: "Production Stop Date", node: <span className="text-xs font-semibold" style={{ color: "#7c3aed" }}>{productionStopDate}</span> },
    ];
    const moqRows: { label: string; node: React.ReactNode }[] = [
      { label: "MOQ", node: <span className="text-xs tabular-nums" style={{ color: C.navy }}>{d.moq.qty.toLocaleString("en-IN")} units</span> },
      { label: "Supplier", node: <span className="text-xs font-semibold" style={{ color: C.navy }}>{d.moq.supplier}</span> },
      { label: "Cost / Unit", node: <span className="inline-flex items-center gap-2"><span className="text-[10px] line-through tabular-nums" style={{ color: "#94a3b8" }}>₹{d.moq.originalCostPerUnit}</span><span className="text-xs font-bold tabular-nums" style={{ color: C.green }}>₹{d.moq.costPerUnit}</span></span> },
      { label: "Order Cost", node: <span className="inline-flex items-center gap-2"><span className="text-[10px] line-through tabular-nums" style={{ color: "#94a3b8" }}>₹{d.moq.originalOrderCost.toLocaleString("en-IN")}</span><span className="text-xs font-bold tabular-nums" style={{ color: C.green }}>₹{d.moq.totalOrderCost.toLocaleString("en-IN")}</span></span> },
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
            {showTransferPicker && (
              <label className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#64748b" }}>
                IUT route
                <select
                  value={selTransfer}
                  onChange={(e) => onSelTransfer(e.target.value)}
                  className="pl-2 pr-6 py-1.5 rounded-lg text-xs cursor-pointer focus:outline-none"
                  style={{ border: "1px solid #d1d5db", color: "#111827" }}
                  title="Shared with the IUT option selected above in the scenario row"
                >
                  {transferPickerOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label} · {o.routeFrom} → {o.routeTo}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {showMoqPicker && (
              <>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#64748b" }}>
                  MOQ plant
                  <select
                    value={selectedMoqPlantId}
                    onChange={(e) => setSelectedMoqPlantId(e.target.value)}
                    className="pl-2 pr-6 py-1.5 rounded-lg text-xs cursor-pointer focus:outline-none"
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
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#64748b" }}>
                    Supplier
                    <select
                      value={moqSuppliers[selectedMoq.id] ?? selectedMoq.suppliers[0].id}
                      onChange={(e) => onMoqSupplier(selectedMoq.id, e.target.value)}
                      className="pl-2 pr-6 py-1.5 rounded-lg text-xs cursor-pointer focus:outline-none"
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
              {!hasAnyMatch ? (
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
                plantBlocks.map((block) => {
                  const beforeRows = filterComponents(block.rowsByState.before, block.code);
                  if (beforeRows.length === 0) return null;
                  const matched = new Set(beforeRows.map((r) => r.component));
                  const afterByComponent = new Map(
                    block.rowsByState.after.filter((r) => matched.has(r.component)).map((r) => [r.component, r]),
                  );
                  const plantMeta = PLANT_BREAKDOWN_BASE[block.code];
                  const roleLabel = block.roles
                    .map((r) => (r === "source" ? "Source" : r === "destination" ? "Destination" : "Ordering"))
                    .join(" + ");

                  return (
                    <React.Fragment key={block.code}>
                      <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        <td
                          colSpan={totalCols - 1}
                          className="px-3 py-2.5 font-semibold"
                          style={{
                            color: C.navy,
                            ...breakdownColBorder(0, stockExpanded),
                          }}
                        >
                          <span className="font-bold">{block.code}</span>
                          {PLANT_CLUSTER_MAP[block.code] && (
                            <span className="ml-1.5 text-[10px] font-normal" style={{ color: "#94a3b8" }}>
                              ({PLANT_CLUSTER_MAP[block.code]})
                            </span>
                          )}
                          {roleLabel && (
                            <span
                              className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase align-middle"
                              style={{ backgroundColor: C.bgBlue, color: C.blue }}
                            >
                              {roleLabel}
                            </span>
                          )}
                          <span className="mx-2" style={{ color: "#94a3b8" }}>·</span>
                          Total Production Plan:{" "}
                          <button
                            type="button"
                            onClick={() => setProductionPlanPlant(block.code)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold tabular-nums cursor-pointer transition-colors bg-blue-200 hover:bg-blue-50"
                            style={{ color: C.blue }}
                            title="View 19-week production plan breakdown"
                          >
                            {plantMeta?.totalProductionPlan}
                            <ExternalLink size={11} strokeWidth={2.5} />
                          </button>
                        </td>
                        <td
                          className="px-3 py-2.5 text-right"
                          style={breakdownColBorder(totalCols - 1, stockExpanded)}
                        >
                          <span
                            className="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
                            title="Production stop date if no action is taken"
                          >
                            {plantMeta?.prodStopDate}
                          </span>
                        </td>
                      </tr>

                      {beforeRows.map((comp) => {
                        const afterRow = afterByComponent.get(comp.component);
                        const stockValues = getStockCellValues(comp, stockExpanded);
                        const afterStockValues = afterRow ? getStockCellValues(afterRow, stockExpanded) : null;
                        const tailValues = getTailCellValues(comp);
                        const afterTailValues = afterRow ? getTailCellValues(afterRow) : null;

                        return (
                          <tr
                            key={`${block.code}-${comp.component}`}
                            style={{ borderBottom: "1px solid #e5e7eb" }}
                          >
                            <td
                              className="px-3 py-3 align-top"
                              style={breakdownBodyStyle(0, 0, stockExpanded)}
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
                              const isOnHandCol = stockIdx === 0;
                              const afterValue = afterStockValues?.[stockIdx];
                              const showChange = afterValue !== undefined && afterValue !== "—" && afterValue !== value;
                              const delta = showChange && isOnHandCol
                                ? parseIndianNumber(afterValue!) - parseIndianNumber(value)
                                : 0;

                              return (
                                <td
                                  key={`${comp.component}-stock-${stockIdx}`}
                                  className="px-3 py-3 tabular-nums text-center"
                                  style={{
                                    color: isOpenPoHighlight
                                      ? value !== "—"
                                        ? C.blue
                                        : "#94a3b8"
                                      : "#374151",
                                    fontWeight: stockIdx === 0 || stockIdx === totalStockIdx ? 600 : isOpenPoQtyCol ? 500 : 400,
                                    ...breakdownBodyStyle(colIdx, 0, stockExpanded),
                                  }}
                                >
                                  {showChange ? (
                                    <span className="inline-flex items-start gap-1.5">
                                      <span style={{ color: "#94a3b8" }}>{value}</span>
                                      <span style={{ color: "#94a3b8" }}>→</span>
                                      <span className="inline-flex flex-col items-center">
                                        <span style={{ fontWeight: 700, color: C.blue }}>{afterValue}</span>
                                        {isOnHandCol && delta !== 0 && (
                                          <span
                                            className="px-1.5 py-0.5 rounded text-[9px] font-bold mt-0.5"
                                            style={{
                                              backgroundColor: delta > 0 ? "#dcfce7" : "#fee2e2",
                                              color: delta > 0 ? C.green : "#dc2626",
                                            }}
                                          >
                                            {delta > 0 ? "+" : ""}
                                            {delta.toLocaleString("en-IN")}
                                          </span>
                                        )}
                                      </span>
                                    </span>
                                  ) : (
                                    value
                                  )}
                                </td>
                              );
                            })}

                            {tailValues.map((value, tailIdx) => {
                              const colIdx = 1 + stockValues.length + tailIdx;
                              const afterValue = afterTailValues?.[tailIdx];
                              const showChange = afterValue !== undefined && afterValue !== "—" && afterValue !== value;
                              const isProdStopCol = tailIdx === 7;

                              if (isProdStopCol) {
                                const dayDiff = showChange
                                  ? Math.round(
                                      (parseDMYDate(afterValue!).getTime() - parseDMYDate(value).getTime()) /
                                        86400000,
                                    )
                                  : 0;

                                return (
                                  <td
                                    key={`${comp.component}-tail-${tailIdx}`}
                                    className="px-3 py-3 tabular-nums text-center whitespace-nowrap"
                                    style={{
                                      color: tailCellColor(afterRow ?? comp, tailIdx),
                                      fontWeight: 600,
                                      ...breakdownBodyStyle(colIdx, 0, stockExpanded),
                                    }}
                                  >
                                    <span
                                      className="inline-flex items-center gap-1.5"
                                      title={showChange ? `No-action baseline: ${value}` : undefined}
                                    >
                                      <span>{showChange ? afterValue : value}</span>
                                      {showChange && dayDiff !== 0 && (
                                        <span
                                          className="px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap"
                                          style={{
                                            backgroundColor: dayDiff > 0 ? "#dcfce7" : "#fee2e2",
                                            color: dayDiff > 0 ? C.green : "#dc2626",
                                          }}
                                        >
                                          {dayDiff > 0 ? "▲" : "▼"} {Math.abs(dayDiff)}d
                                        </span>
                                      )}
                                    </span>
                                  </td>
                                );
                              }

                              return (
                                <td
                                  key={`${comp.component}-tail-${tailIdx}`}
                                  className="px-3 py-3 tabular-nums text-center"
                                  style={{
                                    color: tailCellColor(comp, tailIdx),
                                    fontWeight: tailIdx >= 5 ? 600 : 400,
                                    ...breakdownBodyStyle(colIdx, 0, stockExpanded),
                                  }}
                                >
                                  {showChange ? (
                                    <span className="inline-flex items-center gap-1.5 flex-wrap">
                                      <span style={{ color: "#94a3b8" }}>{value}</span>
                                      <span style={{ color: "#94a3b8" }}>→</span>
                                      <span style={{ fontWeight: 700, color: tailCellColor(afterRow!, tailIdx) }}>
                                        {afterValue}
                                      </span>
                                    </span>
                                  ) : (
                                    value
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
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