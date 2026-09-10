import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  ChevronDown,
  ChevronRight,
  Columns3,
  Factory,
  GitCompareArrows,
  Layers,
  Link2Off,
  Loader2,
  Rows3,
  Search,
  ShoppingCart,
  Star,
  Trophy,
  Truck,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { CBURow } from "../../data";
import { ProductionPlanModal } from "../../ProductionPlanModal";
import type { ComponentBreakdownRow } from "../../sciDetails/types";
import type { ScenarioRow } from "../../sciDetails/types";
import {
  C,
  PM_BADGE,
  RM_BADGE,
} from "../../sciDetails/constants";
import { computeTransitionRows, formatIndianNumber, getActivePlantRoles } from "../../sciDetails/utils";
import { TransposedComponentBreakdownTable, type TransposedBreakdownColumn } from "../../sciDetails/step4/TransposedComponentBreakdownTable";
import { TablePagination } from "../../nationalDashboard/TablePagination";
import { ATTENTION_TEXT, BEST_TINT_BG, LANE_UNAVAILABLE_COLOR, NEUTRAL_CARD_BG } from "./ScenarioDetailPrimitives";
import {
  summarizeIutMaterials,
  summarizeProcurement,
  tagComparisonValues,
  type ComparisonTag,
  type FocusViewOption,
  type IutTransferMaterialLine,
  type ProcurementMaterialLine,
} from "../../../constants/networkDownStockingAgent";
import type { ScenarioCatalog } from "../../../api/networkDownStockingSimulator/step3Api";

type Tab = "focus" | "compare";
/** How the Overview / IUT Transfer / Procurement cards are arranged — stacked or side-by-side. */
type SectionLayout = "vertical" | "horizontal";

// Per-section accent used to make Overview / IUT Transfer / Procurement / Component Breakdown
// read as distinct, separately-themed blocks rather than one undifferentiated flow.
const BREAKDOWN_PURPLE = "#7c3aed";
const DARK_SURFACE = "#0f172a";
const REC_BADGE_BG = "#fbbf24";
const REC_BADGE_TEXT = "#78350f";
const FLAG_DOT_COLOR = "#f59e0b";
const OK_DOT_COLOR = "#22c55e";
const HIGH_TAG_BG = "#fef2f2";
const SEARCH_INPUT_BORDER = "#d1d5db";
/** How long the Customise → Done commit (saving the edited Business Waste / FG Days Cover as a
    new custom scenario) spends in its loading state — same pattern as "Generate Scenario" and
    "Save Scenario" elsewhere in this feature. */
const SAVE_CUSTOM_FIGURES_DELAY_MS = 700;
const DEFAULT_ROWS_PER_PAGE = 10;

function typeBadge(type: "RM" | "PM") {
  const badge = type === "RM" ? RM_BADGE : PM_BADGE;
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
      style={{ backgroundColor: badge.bg, color: badge.color }}
    >
      {type}
    </span>
  );
}

function laneStatusBadge(available: boolean | null) {
  if (available === true) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: C.green }}>
        <Wifi size={11} />Lane Available
      </span>
    );
  }
  if (available === false) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: LANE_UNAVAILABLE_COLOR }}>
        <Link2Off size={11} />Lane Unavailable
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: C.warning }}>
      <WifiOff size={11} />Lane Not Set
    </span>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg px-3 py-2 text-center" style={{ backgroundColor: NEUTRAL_CARD_BG, border: `1px solid ${C.bgSlate}` }}>
      <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: C.borderMuted }}>{label}</div>
      <div className="text-[11px] font-bold mt-0.5" style={{ color: C.navy }}>{value}</div>
    </div>
  );
}

/**
 * Card shell for a major page section — a colored left rail + tinted header band make each
 * section (Overview, IUT Transfer, Procurement, Component Breakdown) read as its own themed
 * block instead of everything running together on one flat white background.
 */
function SectionCard({
  icon,
  title,
  accent,
  right,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${C.border}`, borderLeft: `4px solid ${accent}`, boxShadow: "0 1px 3px rgba(15,23,42,0.06)", backgroundColor: C.white }}
    >
      <div
        className="px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap"
        style={{ borderBottom: `1px solid ${C.bgSlate}`, backgroundColor: `${accent}0d` }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: accent }}>{icon}</span>
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>{title}</span>
        </div>
        {right}
      </div>
      <div className="p-4 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function NeedAttentionPill({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap"
      style={{ backgroundColor: C.warningBgLight, color: C.warningTextDark, border: `1px solid ${C.warningBorder}` }}
    >
      <AlertTriangle size={11} />
      {count} need attention
    </span>
  );
}

function CompareSectionHeaderRow({
  icon,
  label,
  colSpan,
  accent = DARK_SURFACE,
}: {
  icon: React.ReactNode;
  label: string;
  colSpan: number;
  /** Matches the same accent used for this section's card elsewhere on the page. */
  accent?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-2.5" style={{ backgroundColor: accent }}>
        <div className="flex items-center gap-2">
          <span style={{ color: "rgba(255,255,255,0.7)" }}>{icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">{label}</span>
        </div>
      </td>
    </tr>
  );
}

function CompareExpandRow({
  colSpan,
  expanded,
  onToggle,
  label,
}: {
  colSpan: number;
  expanded: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <tr style={{ borderTop: `1px solid ${C.bgSlate}` }}>
      <td colSpan={colSpan} className="px-4 py-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 cursor-pointer"
        >
          {expanded ? <ChevronDown size={12} style={{ color: C.blue }} /> : <ChevronRight size={12} style={{ color: C.blue }} />}
          <Layers size={12} style={{ color: C.blue }} />
          <span className="text-xs font-semibold" style={{ color: C.blue }}>{label}</span>
        </button>
      </td>
    </tr>
  );
}

function MetricRow({
  label,
  cells,
}: {
  label: React.ReactNode;
  cells: { key: string; content: React.ReactNode; tag?: ComparisonTag }[];
}) {
  return (
    <tr style={{ borderTop: `1px solid ${C.bgSlate}` }}>
      <td className="px-4 py-3 text-[13px]" style={{ color: C.mutedDark, borderRight: `1px solid ${C.border}` }}>{label}</td>
      {cells.map((cell) => (
        <td
          key={cell.key}
          className="px-4 py-3 text-center"
          style={{ backgroundColor: cell.tag === "best" ? BEST_TINT_BG : cell.tag === "high" ? HIGH_TAG_BG : "transparent" }}
        >
          <div className="text-[13px] font-bold tabular-nums" style={{ color: cell.tag === "best" ? C.successText : cell.tag === "high" ? C.danger : C.navy }}>
            {cell.content}
          </div>
          {cell.tag === "best" && (
            <span className="inline-flex items-center gap-0.5 mt-0.5 text-[10px] font-bold" style={{ color: C.successText }}>
              <Check size={9} strokeWidth={3} />Best
            </span>
          )}
          {cell.tag === "high" && (
            <span className="text-[10px] font-bold" style={{ color: C.danger }}>↓ High</span>
          )}
        </td>
      ))}
    </tr>
  );
}

type IutMaterialPatch = Partial<Pick<IutTransferMaterialLine, "transferQty" | "leadTimeDays" | "costPerTrip">>;
type ProcurementLinePatch = Partial<Pick<ProcurementMaterialLine, "orderQty" | "pricePerUnit" | "supplier">>;

function InlineNumberField({ value, onChange, width = 56 }: { value: number; onChange: (n: number) => void; width?: number }) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => {
        // Reject a negative-producing keystroke outright (rather than clamping after the
        // fact) — this one fix covers every InlineNumberField caller in this file.
        const raw = e.target.value;
        if (raw !== "" && Number(raw) < 0) return;
        onChange(Number(raw) || 0);
      }}
      onClick={(e) => e.stopPropagation()}
      className="text-[10px] font-semibold tabular-nums rounded px-1 py-0.5"
      style={{ width, border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
    />
  );
}

function IutMaterialMiniCard({
  line,
  iutTransferSlaDays,
  editable = false,
  onChange,
}: {
  line: IutTransferMaterialLine;
  iutTransferSlaDays: number;
  editable?: boolean;
  onChange?: (patch: IutMaterialPatch) => void;
}) {
  const flagged = line.leadTimeDays > iutTransferSlaDays;
  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{ backgroundColor: flagged ? C.warningBgLight : C.bgSlateLight, border: `1px solid ${editable ? C.blue : flagged ? C.warningBorder : C.border}` }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: flagged ? FLAG_DOT_COLOR : OK_DOT_COLOR }} />
        {typeBadge(line.type)}
        <span className="text-[9px]" style={{ color: C.borderMuted }}>{line.code}</span>
      </div>
      <div className="text-[11px] font-bold" style={{ color: C.navy }}>{line.name}</div>
      {editable && onChange ? (
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          <InlineNumberField value={line.transferQty} onChange={(transferQty) => onChange({ transferQty })} width={64} />
          <span className="text-[9px]" style={{ color: C.borderMuted }}>EA ·</span>
          <InlineNumberField value={line.leadTimeDays} onChange={(leadTimeDays) => onChange({ leadTimeDays })} width={40} />
          <span className="text-[9px]" style={{ color: C.borderMuted }}>days · ₹</span>
          <InlineNumberField value={line.costPerTrip} onChange={(costPerTrip) => onChange({ costPerTrip })} width={52} />
        </div>
      ) : (
        <div className="text-[10px] tabular-nums" style={{ color: C.muted }}>
          {formatIndianNumber(line.transferQty)} EA · {line.leadTimeDays} days · ₹{line.costPerTrip}/trip
        </div>
      )}
    </div>
  );
}

function OrderMiniCard({
  line,
  editable = false,
  onChange,
}: {
  line: ProcurementMaterialLine;
  editable?: boolean;
  onChange?: (patch: ProcurementLinePatch) => void;
}) {
  const flagged = line.neededQty < line.moq;
  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{ backgroundColor: flagged ? C.warningBgLight : C.bgSlateLight, border: `1px solid ${editable ? C.blue : flagged ? C.warningBorder : C.border}` }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: flagged ? FLAG_DOT_COLOR : OK_DOT_COLOR }} />
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: C.bgBlue, color: C.blue }}>{line.plant}</span>
        {typeBadge(line.type)}
        <span className="text-[9px]" style={{ color: C.borderMuted }}>{line.code}</span>
      </div>
      {editable && onChange ? (
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-bold" style={{ color: C.navy }}>{line.name}</div>
          <input
            type="text"
            value={line.supplier}
            onChange={(e) => onChange({ supplier: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] font-semibold rounded px-1.5 py-0.5"
            style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
          />
          <div className="flex items-center gap-1 flex-wrap text-[10px] tabular-nums" style={{ color: C.muted }}>
            <span>Qty</span>
            <InlineNumberField value={line.orderQty} onChange={(orderQty) => onChange({ orderQty })} />
          </div>
        </div>
      ) : (
        <>
          <div className="text-[11px] font-bold" style={{ color: C.navy }}>{line.name} · {line.supplier}</div>
          <div className="text-[10px] tabular-nums" style={{ color: C.muted }}>
            {formatIndianNumber(line.orderQty)} units
          </div>
        </>
      )}
    </div>
  );
}

export function CustomScenarioDetailPage({
  row,
  catalog,
  scenarioId = "iut-moq",
  selTransfer,
  onSelTransfer,
  moqSuppliers,
  customScenarioCount,
  maxCustomScenarios,
  onAddCustomScenario,
}: {
  catalog: ScenarioCatalog;
  row: CBURow;
  scenarioId?: "iut-moq" | "iut-moq-break";
  selTransfer: string;
  onSelTransfer: (id: string) => void;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
  /** How many custom scenarios already exist in the main comparison list, and the cap on that count. */
  customScenarioCount: number;
  maxCustomScenarios: number;
  /** Saves the customised Business Waste / FG Days Cover as a new "Custom Scenario N" row. */
  onAddCustomScenario: (businessWaste: string, fgDaysCover: string) => void;
}) {
  const fallbackScenario: ScenarioRow = {
    id: "iut-moq",
    name: "IUT + Procure",
    businessWaste: null,
    wasteSavings: null,
    wasteColor: undefined,
    fgDaysCover: null,
    isBest: false,
    nextActionPrefix: "",
    nextAction: "",
    icon: "iut-moq",
    feasibleProducible: 0,
    productionStopDate: "—",
    dailyRunRate: 0,
  };
  const scenario = catalog.scenarios.find((s) => s.id === scenarioId) ?? catalog.scenarios.find((s) => s.id === "iut-moq") ?? fallbackScenario;
  const counterpartScenario = catalog.scenarios.find((s) => s.id === (scenarioId === "iut-moq" ? "iut-moq-break" : "iut-moq"));

  const [tab, setTab] = useState<Tab>("focus");
  const [sectionLayout, setSectionLayout] = useState<SectionLayout>("vertical");
  const [productionPlanPlant, setProductionPlanPlant] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set(catalog.focusViewOptions.map((o) => o.id)));
  const [showIutMaterials, setShowIutMaterials] = useState(false);
  const [showOrders, setShowOrders] = useState(true);

  // Inline Customise/Done toggle for this scenario's headline figures — mirrors the same
  // pattern ScenarioDetailCard already uses for its per-option fields (fields swap to inputs
  // in place, no separate popup). Done saves the edited figures as a new comparison-list row.
  const [isCustomising, setIsCustomising] = useState(false);
  const [isSavingCustomFigures, setIsSavingCustomFigures] = useState(false);
  const [draftWaste, setDraftWaste] = useState(() => String(parseInt((scenario.businessWaste ?? "0").replace(/[₹,]/g, ""), 10) || 0));
  const [draftCover, setDraftCover] = useState(() => String(parseInt(scenario.fgDaysCover ?? "0", 10) || 0));
  const atCustomScenarioLimit = customScenarioCount >= maxCustomScenarios;

  const selectedOption = catalog.focusViewOptions.find((o) => o.id === selTransfer) ?? catalog.focusViewOptions[0];
  const iutMaterials = catalog.focusViewIutMaterials[selectedOption.id];
  const procurementLines = catalog.focusViewProcurement[selectedOption.id];

  // Customise edits, keyed by material code — merged over the base data wherever it's displayed
  // (table, mini-cards, stat cards) so an edit is visible everywhere at once, matching how
  // ScenarioDetailCard's per-option overrides work.
  const [iutOverrides, setIutOverrides] = useState<Record<string, IutMaterialPatch>>({});
  const [procurementOverrides, setProcurementOverrides] = useState<Record<string, ProcurementLinePatch>>({});
  const updateIutOverride = (code: string, patch: IutMaterialPatch) =>
    setIutOverrides((prev) => ({ ...prev, [code]: { ...prev[code], ...patch } }));
  const updateProcurementOverride = (code: string, patch: ProcurementLinePatch) =>
    setProcurementOverrides((prev) => ({ ...prev, [code]: { ...prev[code], ...patch } }));

  const effectiveIutMaterials = useMemo(
    () => iutMaterials.map((m) => ({ ...m, ...iutOverrides[m.code] })),
    [iutMaterials, iutOverrides],
  );
  const effectiveProcurementLines = useMemo(
    () => procurementLines.map((l) => ({ ...l, ...procurementOverrides[l.code] })),
    [procurementLines, procurementOverrides],
  );

  // ── Pagination for the "All materials" / Procurement tabular views (Focus tab, vertical
  // layout). Both lists are keyed to the currently-selected option, so their length can change
  // when the user switches options — reset back to page 1 whenever that happens. ──
  const [iutMaterialsPage, setIutMaterialsPage] = useState(1);
  const [iutMaterialsRowsPerPage, setIutMaterialsRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [procurementLinesPage, setProcurementLinesPage] = useState(1);
  const [procurementLinesRowsPerPage, setProcurementLinesRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  useEffect(() => {
    setIutMaterialsPage(1);
  }, [effectiveIutMaterials.length]);
  useEffect(() => {
    setProcurementLinesPage(1);
  }, [effectiveProcurementLines.length]);
  const iutMaterialsTotalPages = Math.max(1, Math.ceil(effectiveIutMaterials.length / iutMaterialsRowsPerPage));
  const iutMaterialsSafePage = Math.min(iutMaterialsPage, iutMaterialsTotalPages);
  const pagedIutMaterials = effectiveIutMaterials.slice(
    (iutMaterialsSafePage - 1) * iutMaterialsRowsPerPage,
    iutMaterialsSafePage * iutMaterialsRowsPerPage,
  );
  const procurementLinesTotalPages = Math.max(1, Math.ceil(effectiveProcurementLines.length / procurementLinesRowsPerPage));
  const procurementLinesSafePage = Math.min(procurementLinesPage, procurementLinesTotalPages);
  const pagedProcurementLines = effectiveProcurementLines.slice(
    (procurementLinesSafePage - 1) * procurementLinesRowsPerPage,
    procurementLinesSafePage * procurementLinesRowsPerPage,
  );

  const [selectedMaterialCode, setSelectedMaterialCode] = useState(iutMaterials[0].code);
  useEffect(() => {
    // Selecting a different option resets which material's route detail is shown.
    setSelectedMaterialCode(catalog.focusViewIutMaterials[selectedOption.id][0].code);
  }, [selectedOption.id]);
  const selectedMaterial =
    effectiveIutMaterials.find((m) => m.code === selectedMaterialCode) ?? effectiveIutMaterials[0];

  const iutSummary = summarizeIutMaterials(effectiveIutMaterials);
  const procurementSummary = summarizeProcurement(effectiveProcurementLines);

  // Per-option summaries for the Compare tab — computed once for all three options regardless
  // of which are currently checked, so toggling a checkbox doesn't need to recompute the rest.
  const iutSummaryByOption = useMemo(
    () => Object.fromEntries(catalog.focusViewOptions.map((o) => [o.id, summarizeIutMaterials(catalog.focusViewIutMaterials[o.id])])) as Record<FocusViewOption["id"], ReturnType<typeof summarizeIutMaterials>>,
    [],
  );
  const procurementSummaryByOption = useMemo(
    () => Object.fromEntries(catalog.focusViewOptions.map((o) => [o.id, summarizeProcurement(catalog.focusViewProcurement[o.id])])) as Record<FocusViewOption["id"], ReturnType<typeof summarizeProcurement>>,
    [],
  );
  const visibleOptions = catalog.focusViewOptions.filter((o) => compareIds.has(o.id));

  const toggleCompareId = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 1) return prev; // keep at least one option visible
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ── Component Breakdown by Plant — unchanged logic, kept at the bottom of the page ──
  const transferOptions = catalog.iutTransferOptions.slice(0, scenarioId === "iut-moq" ? 3 : 2);
  const selectedRealTransfer = transferOptions.find((o) => o.id === selTransfer) ?? transferOptions[0] ?? null;
  const moqPlantData = scenarioId === "iut-moq-break" ? catalog.moqPlantOptionsBreak : catalog.moqPlantOptions;
  const selectedMoqForBreakdown = moqPlantData.find((p) => p.isBest) ?? moqPlantData[0] ?? null;
  const [filter, setFilter] = useState("");
  const activePlantRoles = useMemo(
    () => getActivePlantRoles(scenarioId, selectedRealTransfer, selectedMoqForBreakdown),
    [scenarioId, selectedRealTransfer, selectedMoqForBreakdown],
  );
  const plantBlocks = useMemo(
    () =>
      activePlantRoles.map(({ code, roles }) => ({
        code,
        roles,
        rowsByState: computeTransitionRows(code, roles, scenarioId, selectedRealTransfer, selectedMoqForBreakdown, moqSuppliers),
      })),
    [activePlantRoles, scenarioId, selectedRealTransfer, selectedMoqForBreakdown, moqSuppliers],
  );
  const hasMeaningfulData = (r: ComponentBreakdownRow) =>
    r.onHandStock !== "—" || r.openPoQty !== "—" || r.fgEquivalentStock !== "—";
  const filterComponents = (rows: ComponentBreakdownRow[], plantCode: string) => {
    const withData = rows.filter(hasMeaningfulData);
    const q = filter.trim().toLowerCase();
    if (!q) return withData;
    return withData.filter(
      (r) => r.component.toLowerCase().includes(q) || plantCode.toLowerCase().includes(q) || r.type.toLowerCase().includes(q),
    );
  };
  const transposedColumns = useMemo(() => {
    const cols: TransposedBreakdownColumn[] = [];
    for (const block of plantBlocks) {
      const beforeRows = filterComponents(block.rowsByState.before, block.code);
      if (beforeRows.length === 0) continue;
      const matched = new Set(beforeRows.map((r) => r.component));
      const afterByComponent = new Map(
        block.rowsByState.after.filter((r) => matched.has(r.component)).map((r) => [r.component, r]),
      );
      const plantMeta = catalog.plantBreakdownBase[block.code];
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

  return (
    <div className="p-5">
      {productionPlanPlant && (
        <ProductionPlanModal
          plantCode={productionPlanPlant}
          cbuCode={row.cbuCode}
          cbuDescription={row.cbuDescription}
          totalProduction={catalog.plantBreakdownBase[productionPlanPlant]?.totalProductionPlanQty ?? 0}
          onClose={() => setProductionPlanPlant(null)}
        />
      )}

      {/* Narrower than the modal's full width so cards don't stretch too thin, but left-aligned
          (no auto margins) rather than centered — avoids the symmetric dead space on both sides. */}
      <div className="flex flex-col gap-5" style={{ maxWidth: "85%", minWidth: 760 }}>

      {/* ── Header: scenario name + tab toggle ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold" style={{ color: C.navy }}>{scenario.name}</h2>
          {counterpartScenario && (
            <p className="text-xs" style={{ color: C.muted }}>Plan Comparison · {counterpartScenario.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {tab === "focus" && (
            <div className="inline-flex rounded-lg p-1" style={{ backgroundColor: C.bgSlate }}>
              {([
                { id: "vertical", label: "Vertical", Icon: Rows3 },
                { id: "horizontal", label: "Horizontal", Icon: Columns3 },
              ] as { id: SectionLayout; label: string; Icon: typeof Rows3 }[]).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSectionLayout(id)}
                  title={`View Overview / IUT Transfer / Procure stacked ${label === "Vertical" ? "(current)" : "side-by-side"}`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors"
                  style={
                    sectionLayout === id
                      ? { backgroundColor: C.white, color: C.navy, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                      : { backgroundColor: "transparent", color: C.muted }
                  }
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          )}
          <div className="inline-flex rounded-lg p-1" style={{ backgroundColor: C.bgSlate }}>
            {([
              { id: "focus", label: "Focus View" },
              { id: "compare", label: "Compare" },
            ] as { id: Tab; label: string }[]).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors"
                style={
                  tab === t.id
                    ? { backgroundColor: C.white, color: C.navy, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                    : { backgroundColor: "transparent", color: C.muted }
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === "focus" ? (
        <>
          {/* ── Option cards ── */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.borderMuted }}>
              Select an option to view its details
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {catalog.focusViewOptions.map((option) => {
                const isSelected = option.id === selectedOption.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onSelTransfer(option.id)}
                    className="text-left rounded-xl p-3.5 flex flex-col gap-2.5 cursor-pointer transition-all"
                    style={
                      isSelected
                        ? { backgroundColor: C.navy, border: `1px solid ${C.navy}` }
                        : { backgroundColor: C.white, border: `1px solid ${C.border}` }
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold" style={{ color: isSelected ? C.white : C.navy }}>
                        {option.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {option.isBest && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                            style={{ backgroundColor: REC_BADGE_BG, color: REC_BADGE_TEXT }}
                          >
                            <Star size={8} fill="currentColor" />REC
                          </span>
                        )}
                        {isSelected && <Check size={14} strokeWidth={3} style={{ color: C.white }} />}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: isSelected ? "rgba(255,255,255,0.75)" : C.muted }}>
                      <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: isSelected ? "rgba(255,255,255,0.15)" : C.bgBlue, color: isSelected ? C.white : C.blue }}>
                        {option.routeFrom}
                      </span>
                      <ArrowLeftRight size={10} />
                      <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: isSelected ? "rgba(255,255,255,0.15)" : C.bgBlue, color: isSelected ? C.white : C.blue }}>
                        {option.routeTo}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: "IUT Cost", value: `₹${formatIndianNumber(iutSummaryByOption[option.id].totalCost)}` },
                        { label: `FG · ${option.plants[0].code}`, value: formatIndianNumber(option.plants[0].finalFgProducible) },
                        { label: `FG · ${option.plants[1].code}`, value: formatIndianNumber(option.plants[1].finalFgProducible) },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-md px-1.5 py-1.5 text-center"
                          style={{ backgroundColor: isSelected ? "rgba(255,255,255,0.08)" : C.bgSlateLight }}
                        >
                          <div className="text-[8px] font-semibold uppercase tracking-wide truncate" style={{ color: isSelected ? "rgba(255,255,255,0.6)" : C.borderMuted }}>
                            {stat.label}
                          </div>
                          <div className="text-[11px] font-bold tabular-nums" style={{ color: isSelected ? C.white : C.navy }}>
                            {stat.value}
                          </div>
                        </div>
                      ))}
                    </div>
                    <span
                      className="self-start px-2 py-0.5 rounded-full text-[9px] font-bold"
                      style={{
                        backgroundColor: isSelected ? "rgba(255,255,255,0.15)" : `${catalog.focusViewSavingsTierColor[option.savingsTier]}1a`,
                        color: isSelected ? C.white : catalog.focusViewSavingsTierColor[option.savingsTier],
                      }}
                    >
                      {option.savingsLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected option summary bar */}
            <div
              className="rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
              style={{ backgroundColor: DARK_SURFACE }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-white">{selectedOption.label}</span>
                {selectedOption.isBest && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: REC_BADGE_BG, color: REC_BADGE_TEXT }}
                  >
                    <Star size={9} fill="currentColor" />Recommended
                  </span>
                )}
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: "rgba(255,255,255,0.12)", color: catalog.focusViewSavingsTierColor[selectedOption.savingsTier] }}
                >
                  {selectedOption.savingsLabel}
                </span>
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {selectedOption.routeFrom} → {selectedOption.routeTo}
                </span>
              </div>
              <span className="text-sm font-bold text-white tabular-nums">
                IUT cost ₹{formatIndianNumber(iutSummary.totalCost)}
              </span>
            </div>

            {/* Customise / Done — same inline-edit pattern as the other scenario popups' per-option
                Customise button: fields swap to inputs in place, Done saves them as a new row. */}
            <div
              className="rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
              style={{ border: isCustomising ? `1px solid ${C.blue}` : `1px solid ${C.border}`, backgroundColor: C.white }}
            >
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: C.borderMuted }}>Business Waste</div>
                  {isCustomising ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold" style={{ color: C.muted }}>₹</span>
                      <input
                        type="number"
                        min={0}
                        value={draftWaste}
                        onChange={(e) => {
                          const next = e.target.value;
                          if (next !== "" && Number(next) < 0) return;
                          setDraftWaste(next);
                        }}
                        className="w-24 text-sm font-bold tabular-nums rounded px-1.5 py-0.5"
                        style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                      />
                    </div>
                  ) : (
                    <div className="text-sm font-bold tabular-nums" style={{ color: C.navy }}>₹{formatIndianNumber(Math.max(0, parseInt(draftWaste, 10) || 0))}</div>
                  )}
                </div>
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: C.borderMuted }}>FG Days Cover</div>
                  {isCustomising ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={draftCover}
                        onChange={(e) => {
                          const next = e.target.value;
                          if (next !== "" && Number(next) < 0) return;
                          setDraftCover(next);
                        }}
                        className="w-16 text-sm font-bold tabular-nums rounded px-1.5 py-0.5"
                        style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                      />
                      <span className="text-xs font-semibold" style={{ color: C.muted }}>days</span>
                    </div>
                  ) : (
                    <div className="text-sm font-bold tabular-nums" style={{ color: C.navy }}>{draftCover}d</div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isSavingCustomFigures) return;
                  if (isCustomising) {
                    setIsSavingCustomFigures(true);
                    window.setTimeout(() => {
                      setIsSavingCustomFigures(false);
                      onAddCustomScenario(draftWaste, draftCover);
                      setIsCustomising(false);
                    }, SAVE_CUSTOM_FIGURES_DELAY_MS);
                    return;
                  }
                  setIsCustomising(true);
                }}
                disabled={(!isCustomising && atCustomScenarioLimit) || isSavingCustomFigures}
                title={
                  !isCustomising && atCustomScenarioLimit
                    ? `Limit of ${maxCustomScenarios} custom scenarios reached`
                    : isCustomising
                      ? "Save these figures as a new custom scenario"
                      : "Edit the figures above"
                }
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent inline-flex items-center gap-1.5"
                style={
                  isCustomising
                    ? { backgroundColor: C.navy, color: C.white, border: `1px solid ${C.navy}` }
                    : { backgroundColor: C.white, color: C.navy, border: `1px solid ${C.borderLight}` }
                }
              >
                {isSavingCustomFigures && <Loader2 size={12} className="animate-spin" />}
                {isSavingCustomFigures ? "Saving…" : isCustomising ? "Done" : "Customise"}
              </button>
            </div>
          </div>

          {/* ── Overview / IUT Transfer / Procurement — stacked (vertical) or side-by-side
              (horizontal) per the toggle above, for cases where seeing all three at once
              without scrolling is more useful than the taller single-column read. ── */}
          <div className={sectionLayout === "horizontal" ? "grid grid-cols-1 lg:grid-cols-3 gap-5 items-start" : "flex flex-col gap-5"}>
          {/* ── Overview ── */}
          <SectionCard icon={<Factory size={13} />} title="Overview" accent={C.navy}>
            <div className={sectionLayout === "horizontal" ? "grid grid-cols-2 gap-2.5" : "grid grid-cols-2 md:grid-cols-4 gap-2.5"}>
              <StatBox label={`FG Producible · ${selectedOption.plants[0].code}`} value={formatIndianNumber(selectedOption.plants[0].finalFgProducible)} />
              <StatBox label={`FG Producible · ${selectedOption.plants[1].code}`} value={formatIndianNumber(selectedOption.plants[1].finalFgProducible)} />
              <StatBox label={`Business Waste · ${selectedOption.plants[0].code}`} value={selectedOption.businessWaste[0].value} />
              <StatBox label={`Business Waste · ${selectedOption.plants[1].code}`} value={selectedOption.businessWaste[1].value} />
            </div>
            <div className={sectionLayout === "horizontal" ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 md:grid-cols-2 gap-3"}>
              {selectedOption.plants.map((plant) => (
                <div key={plant.code} className="rounded-xl p-3.5" style={{ border: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: C.bgBlue, color: C.blue }}>
                      {plant.code}
                    </span>
                    <span className="text-xs font-bold" style={{ color: C.navy }}>{plant.code} Plant</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: C.borderMuted }}>Prod Plan Qty</div>
                      <div className="text-sm font-bold tabular-nums" style={{ color: C.navy }}>{formatIndianNumber(plant.prodPlanQty)} EA</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: C.borderMuted }}>Final FG Producible</div>
                      <div className="text-sm font-bold tabular-nums" style={{ color: C.blue }}>{formatIndianNumber(plant.finalFgProducible)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: C.borderMuted }}>Stop Date</div>
                      <div className="text-[11px] font-semibold" style={{ color: C.navy }}>{plant.stopDate}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: C.borderMuted }}>Plan Change</div>
                      <div className="text-[11px] font-semibold inline-flex items-center gap-1" style={{ color: plant.planChangeRequired ? ATTENTION_TEXT : C.green }}>
                        {plant.planChangeRequired && <AlertTriangle size={10} />}
                        {plant.planChangeRequired ? "Required" : "Not required"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ── IUT Transfer ── */}
          <SectionCard icon={<ArrowLeftRight size={13} />} title="IUT Transfer" accent={C.blue}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap text-[11px]" style={{ color: C.muted }}>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: C.bgBlue, color: C.blue }}>
                  {selectedOption.routeFrom}
                </span>
                <ArrowLeftRight size={11} style={{ color: C.blue }} />
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: C.bgBlue, color: C.blue }}>
                  {selectedOption.routeTo}
                </span>
                <span>{iutSummary.materialCount} materials</span>
                <span>·</span>
                <span className="tabular-nums">{formatIndianNumber(iutSummary.totalQty)} EA total</span>
                <span>·</span>
                <span className="tabular-nums">₹{formatIndianNumber(iutSummary.totalCost)} transport</span>
                <span>·</span>
                {laneStatusBadge(selectedOption.laneAvailable)}
              </div>
              <NeedAttentionPill count={iutSummary.slaBreachCount} />
            </div>

            {/* Material chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {effectiveIutMaterials.map((material) => {
                const isSelected = material.code === selectedMaterial.code;
                return (
                  <button
                    key={material.code}
                    type="button"
                    onClick={() => setSelectedMaterialCode(material.code)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-left cursor-pointer transition-colors"
                    style={
                      isSelected
                        ? { backgroundColor: C.bgBlue, border: `1px solid ${C.blue}` }
                        : { backgroundColor: C.white, border: `1px solid ${C.border}` }
                    }
                  >
                    {typeBadge(material.type)}
                    <div>
                      <div className="text-[10px] font-bold whitespace-nowrap" style={{ color: isSelected ? C.blue : C.navy }}>
                        {material.name}
                      </div>
                      <div className="text-[9px] tabular-nums" style={{ color: C.borderMuted }}>{formatIndianNumber(material.transferQty)} EA</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedMaterial.leadTimeDays > catalog.iutTransferSlaDays && (
              <div
                className="flex items-center gap-2 rounded-lg px-3.5 py-2.5"
                style={{ backgroundColor: C.warningBgLight, border: `1px solid ${C.warningBorder}` }}
              >
                <AlertTriangle size={13} style={{ color: C.warningText, flexShrink: 0 }} />
                <span className="text-xs font-semibold" style={{ color: C.warningTextDark }}>
                  Lead time exceeds {catalog.iutTransferSlaDays}-day SLA
                </span>
              </div>
            )}

            {/* Route visual */}
            <div className="flex items-center justify-center gap-6 py-2 flex-wrap">
              <div className="text-center">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: C.bgBlue, color: C.blue }}>
                  {selectedOption.routeFrom}
                </span>
                <div className="text-[9px] font-semibold uppercase mt-1" style={{ color: C.borderMuted }}>From</div>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1 min-w-[160px] max-w-xs">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ backgroundColor: C.bgSlate, color: C.navy, border: `1px solid ${C.border}` }}>
                  {selectedMaterial.name} · {formatIndianNumber(selectedMaterial.transferQty)} EA
                </span>
                <div className="w-full flex items-center gap-1">
                  <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: C.borderBlue }} />
                  <ArrowLeftRight size={12} style={{ color: C.blue, flexShrink: 0 }} />
                </div>
                <span className="text-[10px]" style={{ color: C.borderMuted }}>
                  {selectedMaterial.leadTimeDays} days · {selectedMaterial.initiationDate} · ₹{selectedMaterial.costPerTrip}/trip
                </span>
              </div>
              <div className="text-center">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: C.bgBlue, color: C.blue }}>
                  {selectedOption.routeTo}
                </span>
                <div className="text-[9px] font-semibold uppercase mt-1" style={{ color: C.borderMuted }}>To</div>
              </div>
            </div>

            {/* Stat cards — Transfer Qty / Lead Time / Cost per Trip swap to inputs while
                Customising, editing the currently selected material (switch materials via the
                chips above to edit another one). */}
            <div className={sectionLayout === "horizontal" ? "grid grid-cols-2 gap-2" : "grid grid-cols-2 md:grid-cols-6 gap-2"}>
              <StatBox label="Material Code" value={`${selectedMaterial.type} ${selectedMaterial.code}`} />
              {isCustomising ? (
                <div className="rounded-lg px-3 py-2 text-center" style={{ backgroundColor: NEUTRAL_CARD_BG, border: `1px solid ${C.blue}` }}>
                  <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: C.borderMuted }}>Transfer Qty</div>
                  <InlineNumberField
                    value={selectedMaterial.transferQty}
                    onChange={(transferQty) => updateIutOverride(selectedMaterial.code, { transferQty })}
                    width={64}
                  />
                </div>
              ) : (
                <StatBox label="Transfer Qty" value={`${formatIndianNumber(selectedMaterial.transferQty)} EA`} />
              )}
              {isCustomising ? (
                <div className="rounded-lg px-3 py-2 text-center" style={{ backgroundColor: NEUTRAL_CARD_BG, border: `1px solid ${C.blue}` }}>
                  <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: C.borderMuted }}>Lead Time</div>
                  <InlineNumberField
                    value={selectedMaterial.leadTimeDays}
                    onChange={(leadTimeDays) => updateIutOverride(selectedMaterial.code, { leadTimeDays })}
                    width={44}
                  />
                </div>
              ) : (
                <StatBox label="Lead Time" value={`${selectedMaterial.leadTimeDays} days`} />
              )}
              <StatBox label="Initiation" value={selectedMaterial.initiationDate} />
              <StatBox label="Lane" value={selectedOption.laneAvailable === true ? "Available" : selectedOption.laneAvailable === false ? "Unavailable" : "Not set"} />
              {isCustomising ? (
                <div className="rounded-lg px-3 py-2 text-center" style={{ backgroundColor: NEUTRAL_CARD_BG, border: `1px solid ${C.blue}` }}>
                  <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: C.borderMuted }}>Cost / Trip</div>
                  <InlineNumberField
                    value={selectedMaterial.costPerTrip}
                    onChange={(costPerTrip) => updateIutOverride(selectedMaterial.code, { costPerTrip })}
                    width={56}
                  />
                </div>
              ) : (
                <StatBox label="Cost / Trip" value={`₹${selectedMaterial.costPerTrip}`} />
              )}
            </div>

            {/* All materials — a 5-column table reads fine at full width, but doesn't fit the
                narrower horizontal-layout column, so that mode swaps to the same compact cards
                the Compare tab already uses for this data. */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.borderMuted }}>
                All materials{sectionLayout === "vertical" ? " — tabular view" : ""}
              </span>
              {sectionLayout === "horizontal" ? (
                <div className="flex flex-col gap-2">
                  {effectiveIutMaterials.map((material) => (
                    <IutMaterialMiniCard
                      key={material.code}
                      line={material}
                      iutTransferSlaDays={catalog.iutTransferSlaDays}
                      editable={isCustomising}
                      onChange={(patch) => updateIutOverride(material.code, patch)}
                    />
                  ))}
                  <div
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold"
                    style={{ backgroundColor: C.bgSlateLight, border: `1px solid ${C.border}`, color: C.navy }}
                  >
                    <span>Total · {iutSummary.materialCount} materials</span>
                    <span className="tabular-nums">{formatIndianNumber(iutSummary.totalQty)} EA · ₹{formatIndianNumber(iutSummary.totalCost)}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ backgroundColor: C.navy }}>
                        {["MATERIAL", "TRANSFER QTY", "LEAD TIME", "INITIATION", "LANE AVAILABILITY", "COST / TRIP"].map((h, i, arr) => (
                          <th
                            key={h}
                            className={`py-3 font-bold uppercase tracking-wide whitespace-nowrap ${
                              i === 0 ? "pl-4 pr-3 text-left" : i === arr.length - 1 ? "pl-3 pr-4 text-right" : "px-3 text-right"
                            }`}
                            style={{ color: C.white, fontSize: 9 }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedIutMaterials.map((material) => {
                        const breaches = material.leadTimeDays > catalog.iutTransferSlaDays;
                        return (
                          <tr
                            key={material.code}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedMaterialCode(material.code)}
                            style={{
                              borderTop: `1px solid ${C.bgSlate}`,
                              backgroundColor: breaches ? C.warningBgLight : material.code === selectedMaterial.code ? C.bgBlue : C.white,
                              cursor: "pointer",
                            }}
                          >
                            <td className="pl-4 pr-3 py-3">
                              <div className="flex items-center gap-1.5">
                                {typeBadge(material.type)}
                                <span className="font-semibold whitespace-nowrap" style={{ color: C.navy }}>{material.name}</span>
                              </div>
                              {breaches && (
                                <div className="flex items-center gap-1 mt-1" style={{ color: C.warningText }}>
                                  <AlertTriangle size={9} />
                                  <span className="text-[10px] font-semibold">Lead time exceeds {catalog.iutTransferSlaDays}-day SLA</span>
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right font-bold tabular-nums" style={{ color: C.navy }}>
                              {isCustomising ? (
                                <InlineNumberField value={material.transferQty} onChange={(transferQty) => updateIutOverride(material.code, { transferQty })} />
                              ) : (
                                `${formatIndianNumber(material.transferQty)} EA`
                              )}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums" style={{ color: breaches ? C.warningText : C.textSecondary }}>
                              {isCustomising ? (
                                <InlineNumberField value={material.leadTimeDays} onChange={(leadTimeDays) => updateIutOverride(material.code, { leadTimeDays })} width={40} />
                              ) : (
                                `${material.leadTimeDays} days`
                              )}
                            </td>
                            <td className="px-3 py-3 text-right whitespace-nowrap" style={{ color: C.muted }}>
                              {material.initiationDate}
                            </td>
                            <td className="px-3 py-3 text-right whitespace-nowrap">
                              {laneStatusBadge(selectedOption.laneAvailable)}
                            </td>
                            <td className="pl-3 pr-4 py-3 text-right font-semibold tabular-nums" style={{ color: C.navy }}>
                              {isCustomising ? (
                                <InlineNumberField value={material.costPerTrip} onChange={(costPerTrip) => updateIutOverride(material.code, { costPerTrip })} width={52} />
                              ) : (
                                `₹${material.costPerTrip}`
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      <tr style={{ borderTop: `2px solid ${C.border}`, backgroundColor: C.bgSlateLight }}>
                        <td className="pl-4 pr-3 py-3 font-bold" style={{ color: C.navy }}>Total · {iutSummary.materialCount} materials</td>
                        <td className="px-3 py-3 text-right font-bold tabular-nums" style={{ color: C.navy }}>{formatIndianNumber(iutSummary.totalQty)} EA</td>
                        <td className="px-3 py-3 text-right font-bold tabular-nums" style={{ color: C.navy }}>max {iutSummary.maxLeadTimeDays} days</td>
                        <td className="px-3 py-3" />
                        <td className="px-3 py-3" />
                        <td className="pl-3 pr-4 py-3 text-right font-bold tabular-nums" style={{ color: C.navy }}>₹{formatIndianNumber(iutSummary.totalCost)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {effectiveIutMaterials.length > iutMaterialsRowsPerPage && (
                  <TablePagination
                    page={iutMaterialsSafePage}
                    rowsPerPage={iutMaterialsRowsPerPage}
                    totalRows={effectiveIutMaterials.length}
                    onPageChange={setIutMaterialsPage}
                    onRowsPerPageChange={setIutMaterialsRowsPerPage}
                  />
                )}
                </div>
              )}
            </div>
          </SectionCard>

          {/* ── Procurement ── */}
          <SectionCard icon={<ShoppingCart size={13} />} title="Procure" accent={C.teal}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap text-[11px]" style={{ color: C.muted }}>
                <span className="font-semibold" style={{ color: C.navy }}>{procurementSummary.orderCount} purchase orders</span>
                <span>·</span>
                <span>{procurementSummary.supplierCount} suppliers</span>
                <span>·</span>
                <span className="tabular-nums">{formatIndianNumber(procurementSummary.totalQty)} units</span>
              </div>
              <NeedAttentionPill count={procurementSummary.attentionCount} />
            </div>
            {/* A 7-column table doesn't fit the narrower horizontal-layout column, so that mode
                swaps to the same compact order cards the Compare tab already uses. */}
            {sectionLayout === "horizontal" ? (
              <div className="flex flex-col gap-2">
                {effectiveProcurementLines.map((material) => (
                  <OrderMiniCard
                    key={material.code}
                    line={material}
                    editable={isCustomising}
                    onChange={(patch) => updateProcurementOverride(material.code, patch)}
                  />
                ))}
                <div
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold"
                  style={{ backgroundColor: C.bgSlateLight, border: `1px solid ${C.border}`, color: C.navy }}
                >
                  <span>Estimated Total</span>
                  <span className="tabular-nums">{formatIndianNumber(procurementSummary.totalQty)} units</span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ backgroundColor: C.navy }}>
                      {["MATERIAL", "PLANT", "SUPPLIER", "ORDER QTY", "MOQ"].map((h, i, arr) => (
                        <th
                          key={h}
                          className={`py-3 font-bold uppercase tracking-wide whitespace-nowrap ${
                            i === 0 ? "pl-4 pr-3 text-left" : i === arr.length - 1 ? "pl-3 pr-4 text-right" : "px-3 text-right"
                          }`}
                          style={{ color: C.white, fontSize: 9 }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedProcurementLines.map((material) => {
                      const overOrder = material.neededQty < material.moq;
                      return (
                        <tr key={material.code} style={{ borderTop: `1px solid ${C.bgSlate}`, backgroundColor: overOrder ? C.warningBgLight : C.white }}>
                          <td className="pl-4 pr-3 py-3">
                            <div className="flex items-center gap-1.5">
                              {typeBadge(material.type)}
                              <span className="font-semibold whitespace-nowrap" style={{ color: C.navy }}>{material.name}</span>
                            </div>
                            {overOrder && (
                              <div className="flex items-center gap-1 mt-1" style={{ color: C.warningText }}>
                                <AlertTriangle size={9} />
                                <span className="text-[10px] font-semibold">
                                  MOQ forces over-order: need {formatIndianNumber(material.neededQty)}, must buy {formatIndianNumber(material.moq)}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: C.bgBlue, color: C.blue }}>
                              {material.plant}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap" style={{ color: C.textSecondary }}>
                            {isCustomising ? (
                              <input
                                type="text"
                                value={material.supplier}
                                onChange={(e) => updateProcurementOverride(material.code, { supplier: e.target.value })}
                                className="w-28 text-right text-[11px] font-semibold rounded px-1.5 py-0.5"
                                style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                              />
                            ) : (
                              material.supplier
                            )}
                          </td>
                          <td className="px-3 py-3 text-right font-bold tabular-nums" style={{ color: C.navy }}>
                            {isCustomising ? (
                              <InlineNumberField value={material.orderQty} onChange={(orderQty) => updateProcurementOverride(material.code, { orderQty })} width={72} />
                            ) : (
                              `${formatIndianNumber(material.orderQty)} units`
                            )}
                          </td>
                          <td className="pl-3 pr-4 py-3 text-right tabular-nums" style={{ color: C.muted }}>{formatIndianNumber(material.moq)} units</td>
                        </tr>
                      );
                    })}
                    <tr style={{ borderTop: `2px solid ${C.border}`, backgroundColor: C.bgSlateLight }}>
                      <td className="pl-4 pr-3 py-3 font-bold" style={{ color: C.navy }}>Estimated Total</td>
                      <td className="px-3 py-3" colSpan={3} />
                      <td className="pl-3 pr-4 py-3 text-right font-bold tabular-nums" style={{ color: C.navy }}>{formatIndianNumber(procurementSummary.totalQty)} units</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {effectiveProcurementLines.length > procurementLinesRowsPerPage && (
                <TablePagination
                  page={procurementLinesSafePage}
                  rowsPerPage={procurementLinesRowsPerPage}
                  totalRows={effectiveProcurementLines.length}
                  onPageChange={setProcurementLinesPage}
                  onRowsPerPageChange={setProcurementLinesRowsPerPage}
                />
              )}
              </div>
            )}
          </SectionCard>
          </div>
        </>
      ) : (
        /* ── Compare tab ── */
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <GitCompareArrows size={13} style={{ color: C.blue }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.borderMuted }}>
              Compare options — all selected by default
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {catalog.focusViewOptions.map((option) => {
              const checked = compareIds.has(option.id);
              return (
                <label
                  key={option.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer select-none"
                  style={checked ? { backgroundColor: C.bgBlue, border: `1px solid ${C.borderBlue}` } : { backgroundColor: C.bgSlateLight, border: `1px solid ${C.border}` }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCompareId(option.id)}
                    className="rounded cursor-pointer"
                  />
                  <span className="text-xs font-semibold" style={{ color: checked ? C.blue : C.muted }}>{option.label}</span>
                </label>
              );
            })}
          </div>

          <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${C.border}` }}>
            <table className="border-collapse w-full" style={{ minWidth: "max-content" }}>
              <thead>
                <tr>
                  <th
                    className="px-3 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: C.borderMuted, backgroundColor: C.bgSlateLight, borderBottom: `2px solid ${C.border}`, borderRight: `1px solid ${C.border}`, minWidth: 140 }}
                  >
                    Metric
                  </th>
                  {visibleOptions.map((option) => (
                    <th
                      key={option.id}
                      className="px-4 py-2.5 text-center"
                      style={{ backgroundColor: option.id === selectedOption.id ? C.bgBlue : C.bgSlateLight, borderBottom: `2px solid ${option.id === selectedOption.id ? C.blue : C.border}`, minWidth: 170 }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold" style={{ color: C.navy }}>{option.label}</span>
                          {option.isBest && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold" style={{ backgroundColor: C.green, color: C.white }}>
                              <Star size={7} fill="currentColor" />Best
                            </span>
                          )}
                        </div>
                        <span className="text-[10px]" style={{ color: C.muted }}>{option.routeFrom} → {option.routeTo}</span>
                        <button
                          type="button"
                          disabled={option.id === selTransfer}
                          onClick={() => onSelTransfer(option.id)}
                          className="mt-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-opacity"
                          style={{
                            backgroundColor: option.id === selTransfer ? C.successBg : C.blue,
                            color: option.id === selTransfer ? C.successText : C.white,
                            cursor: option.id === selTransfer ? "default" : "pointer",
                          }}
                        >
                          {option.id === selTransfer ? (
                            <span className="inline-flex items-center gap-1"><Check size={10} strokeWidth={3} />Selected</span>
                          ) : (
                            "Select"
                          )}
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareSectionHeaderRow icon={<Truck size={12} />} label="IUT Transfer" colSpan={visibleOptions.length + 1} accent={C.blue} />

                <tr style={{ borderTop: `1px solid ${C.bgSlate}` }}>
                  <td className="px-4 py-3 text-[13px]" style={{ color: C.mutedDark, borderRight: `1px solid ${C.border}` }}>Transfer Route</td>
                  {visibleOptions.map((option) => (
                    <td key={option.id} className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: C.bgBlue, color: C.blue }}>{option.routeFrom}</span>
                        <ArrowLeftRight size={10} style={{ color: C.blue }} />
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: C.bgBlue, color: C.blue }}>{option.routeTo}</span>
                      </div>
                    </td>
                  ))}
                </tr>

                <tr style={{ borderTop: `1px solid ${C.bgSlate}` }}>
                  <td className="px-4 py-3 text-[13px]" style={{ color: C.mutedDark, borderRight: `1px solid ${C.border}` }}>Materials</td>
                  {visibleOptions.map((option) => {
                    const s = iutSummaryByOption[option.id];
                    return (
                      <td key={option.id} className="px-4 py-3 text-center">
                        <span className="text-[13px] font-bold" style={{ color: C.navy }}>{s.materialCount}</span>
                        {s.slaBreachCount > 0 && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-bold" style={{ color: C.warningText }}>
                            <AlertTriangle size={9} />{s.slaBreachCount}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                <MetricRow
                  label="Total Transfer Qty"
                  cells={visibleOptions.map((option, i) => ({
                    key: option.id,
                    content: `${formatIndianNumber(iutSummaryByOption[option.id].totalQty)} EA`,
                    tag: tagComparisonValues(visibleOptions.map((o) => iutSummaryByOption[o.id].totalQty), true)[i],
                  }))}
                />
                <MetricRow
                  label="Longest Lead Time"
                  cells={visibleOptions.map((option, i) => ({
                    key: option.id,
                    content: `${iutSummaryByOption[option.id].maxLeadTimeDays} days`,
                    tag: tagComparisonValues(visibleOptions.map((o) => iutSummaryByOption[o.id].maxLeadTimeDays), false)[i],
                  }))}
                />

                <tr style={{ borderTop: `1px solid ${C.bgSlate}` }}>
                  <td className="px-4 py-3 text-[13px]" style={{ color: C.mutedDark, borderRight: `1px solid ${C.border}` }}>Lane Availability</td>
                  {visibleOptions.map((option) => (
                    <td key={option.id} className="px-4 py-3 text-center">
                      {laneStatusBadge(option.laneAvailable)}
                    </td>
                  ))}
                </tr>

                <MetricRow
                  label="Transport Cost"
                  cells={visibleOptions.map((option, i) => ({
                    key: option.id,
                    content: `₹${formatIndianNumber(iutSummaryByOption[option.id].totalCost)}`,
                    tag: tagComparisonValues(visibleOptions.map((o) => iutSummaryByOption[o.id].totalCost), false)[i],
                  }))}
                />

                <CompareExpandRow
                  colSpan={visibleOptions.length + 1}
                  expanded={showIutMaterials}
                  onToggle={() => setShowIutMaterials((v) => !v)}
                  label="By material"
                />
                {showIutMaterials && (
                  <tr>
                    <td className="px-4 py-3" style={{ borderRight: `1px solid ${C.border}` }} />
                    {visibleOptions.map((option) => (
                      <td key={option.id} className="px-3 py-3 align-top">
                        <div className="flex flex-col gap-2">
                          {catalog.focusViewIutMaterials[option.id].map((m) => (
                            <IutMaterialMiniCard key={m.code} line={m} iutTransferSlaDays={catalog.iutTransferSlaDays} />
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                )}

                <CompareSectionHeaderRow icon={<ShoppingCart size={12} />} label="Procure" colSpan={visibleOptions.length + 1} accent={C.teal} />

                <tr style={{ borderTop: `1px solid ${C.bgSlate}` }}>
                  <td className="px-4 py-3 text-[13px]" style={{ color: C.mutedDark, borderRight: `1px solid ${C.border}` }}>Purchase Orders</td>
                  {visibleOptions.map((option) => {
                    const s = procurementSummaryByOption[option.id];
                    return (
                      <td key={option.id} className="px-4 py-3 text-center">
                        <span className="text-[13px] font-bold" style={{ color: C.navy }}>{s.orderCount}</span>
                        {s.attentionCount > 0 && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-bold" style={{ color: C.warningText }}>
                            <AlertTriangle size={9} />{s.attentionCount}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                <tr style={{ borderTop: `1px solid ${C.bgSlate}` }}>
                  <td className="px-4 py-3 text-[13px]" style={{ color: C.mutedDark, borderRight: `1px solid ${C.border}` }}>Suppliers</td>
                  {visibleOptions.map((option) => (
                    <td key={option.id} className="px-4 py-3 text-center">
                      <span className="text-[13px] font-bold" style={{ color: C.navy }}>{procurementSummaryByOption[option.id].supplierCount}</span>
                    </td>
                  ))}
                </tr>

                <MetricRow
                  label="Total Order Qty"
                  cells={visibleOptions.map((option, i) => ({
                    key: option.id,
                    content: `${formatIndianNumber(procurementSummaryByOption[option.id].totalQty)} units`,
                    tag: tagComparisonValues(visibleOptions.map((o) => procurementSummaryByOption[o.id].totalQty), true)[i],
                  }))}
                />
                <MetricRow
                  label="Total Order Value"
                  cells={visibleOptions.map((option, i) => ({
                    key: option.id,
                    content: `₹${formatIndianNumber(procurementSummaryByOption[option.id].totalValue)}`,
                    tag: tagComparisonValues(visibleOptions.map((o) => procurementSummaryByOption[o.id].totalValue), false)[i],
                  }))}
                />

                <CompareExpandRow
                  colSpan={visibleOptions.length + 1}
                  expanded={showOrders}
                  onToggle={() => setShowOrders((v) => !v)}
                  label={showOrders ? "Hide orders" : "Show orders"}
                />
                {showOrders && (
                  <tr>
                    <td className="px-4 py-3 text-[13px]" style={{ color: C.mutedDark, borderRight: `1px solid ${C.border}` }}>Order Breakdown</td>
                    {visibleOptions.map((option) => (
                      <td key={option.id} className="px-3 py-3 align-top">
                        <div className="flex flex-col gap-2">
                          {catalog.focusViewProcurement[option.id].map((l) => (
                            <OrderMiniCard key={l.code} line={l} />
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                )}

                <MetricRow
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      <Trophy size={12} style={{ color: C.warning }} />IUT Cost
                    </span>
                  }
                  cells={visibleOptions.map((option, i) => ({
                    key: option.id,
                    content: `₹${formatIndianNumber(iutSummaryByOption[option.id].totalCost)}`,
                    tag: tagComparisonValues(visibleOptions.map((o) => iutSummaryByOption[o.id].totalCost), false)[i],
                  }))}
                />
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* ── Component Breakdown by Plant — kept at the bottom, outside the narrowed section
          above (full width — it's a dense data table, not a card layout, so it should use the
          available space), but still themed to match the other sections. ── */}
      <SectionCard
        icon={<Layers size={13} />}
        title="Component Breakdown by Plant"
        accent={BREAKDOWN_PURPLE}
        right={
          <div className="relative">
            <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: C.borderMuted }} />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter plant or component"
              className="pl-6 pr-2 py-1 rounded-md text-[10px] focus:outline-none"
              style={{ border: `1px solid ${SEARCH_INPUT_BORDER}`, minWidth: 180, color: C.text }}
            />
          </div>
        }
      >
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          <TransposedComponentBreakdownTable columns={transposedColumns} onOpenProductionPlan={setProductionPlanPlant} />
        </div>
      </SectionCard>
    </div>
  );
}
