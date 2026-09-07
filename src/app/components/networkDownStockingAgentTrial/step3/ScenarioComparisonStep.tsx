import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  Check,
  ChevronRight,
  Eye,
  ExternalLink,
  Link2Off,
  Loader2,
  Pencil,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  X,
  Zap,
  Plus,
} from "lucide-react";
import { useNav } from "../../../App";
import { TODAY } from "../../data";
import type { CBURow } from "../../data";
import type { ScenarioRow, PlantGroup, CustomOverrideRow } from "../../sciDetails/types";
import { StepSection } from "../StepSection";
import { DetailDrawer } from "../DetailDrawer";
import { ScenarioIcon } from "../../sciDetails/ScenarioIcon";
import { buildActionTasks } from "../../actionDetails/ActionTaskList";
import { CustomOverridesForm } from "../../sciDetails/customOverrides/CustomOverridesForm";
import {
  buildCustomScenarioBaseline,
  buildBaselineScenario,
} from "../../sciDetails/customOverrides/customOverridesUtils";
import { C, SCENARIOS, IUT_TRANSFER_OPTIONS, CUSTOM_SCENARIO } from "../../sciDetails/constants";
import { ScenarioComparisonPanel } from "../../sciDetails/step3/ScenarioComparisonPanel";
import { ScenarioDetailTable } from "./ScenarioDetailTable";
import { CreateCustomScenarioDrawer } from "./CreateCustomScenarioDrawer";
import { CustomScenarioDetailView } from "./CustomScenarioDetailView";
import {
  EMPTY_SCENARIO_EDIT_STATE,
  EMPTY_CUSTOM_SNAPSHOT_EDIT_STATE,
  snapshotToEditState,
  editStateToSnapshot,
  type ScenarioDetailSnapshot,
  type ScenarioEditState,
  type CustomSnapshotEditState,
} from "./ScenarioDetailPrimitives";
import { buildScenarioViewModel, buildSnapshotFromViewModel } from "./scenarioDetailModel";
import { CustomScenarioDetailPage } from "./CustomScenarioDetailPage";
import { ScenarioDetailView } from "../step4/ScenarioDetailView";

type RecalcOverlay = {
  businessWaste: string;
  wasteSavings: string | null;
  wasteColor: "teal" | "orange";
  fgDaysCover: string;
};

/** How many user-created custom scenarios (via any "More Details" popup's Customize tab) can exist at once. */
const MAX_CUSTOM_SCENARIOS = 10;

function parseCurrencyValue(v: string | null | undefined): number {
  return v ? parseFloat(v.replace(/[₹,]/g, "")) || 0 : 0;
}

function parseDaysValue(v: string | null | undefined): number {
  return v ? parseInt(v, 10) || 0 : 0;
}

/** Turns a "23d" style FG days-cover string into the calendar date it lands on, e.g. "05 Sep 2026". */
function coverDateLabel(daysCover: string | null | undefined): string | null {
  const days = parseInt(daysCover ?? "", 10);
  if (Number.isNaN(days)) return null;
  const dt = new Date(TODAY.getTime() + days * 86_400_000);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function ScenarioComparisonStep({
  row,
  newCbuRow,
  projectName,
  acceptedId,
  onSelect,
  selTransfer,
  onSelTransfer,
  moqSuppliers,
  onMoqSupplier,
  onDirty,
  scenariosGenerated,
  onScenariosGeneratedChange,
  finalAcceptedId,
  onFinalAcceptedIdChange,
}: {
  row: CBURow;
  newCbuRow?: CBURow | null;
  projectName?: string;
  acceptedId: string | null;
  onSelect: (id: string) => void;
  selTransfer: string;
  onSelTransfer: (id: string) => void;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
  /** Called whenever the user makes a meaningful change that should mark the page's draft as dirty. */
  onDirty?: () => void;
  /** Whether "Generate Scenario" has been run — lifted to the page (backed by
   * the redux store) so it survives navigating away to Actions & Monitoring
   * and back, instead of resetting on remount like plain local state would. */
  scenariosGenerated: boolean;
  onScenariosGeneratedChange: (v: boolean) => void;
  /** The scenario formally Accepted (distinct from acceptedId, which is just
   * the highlighted/selected row) — also lifted to the store for the same
   * reason, so returning from Actions & Monitoring still shows "Accepted". */
  finalAcceptedId: string | null;
  onFinalAcceptedIdChange: (id: string | null) => void;
}) {
  const { navigate } = useNav();
  const baseline = SCENARIOS.find((s) => s.id === "no-action")!;
  const baselineDays = parseInt(baseline.fgDaysCover ?? "0");

  const viewDetails = (scenario: ScenarioRow) => {
    const receivingPlantCode = IUT_TRANSFER_OPTIONS.find((o) => o.id === selTransfer)?.routeTo ?? "U535";
    const scenarioDetails = {
      id: scenario.id,
      name: scenario.name,
      projectName: projectName || null,
      oldCbuCode: row.cbuCode,
      newCbuCode: newCbuRow?.cbuCode ?? null,
      oldCbuDescription: row.cbuDescription,
      newCbuDescription: newCbuRow?.cbuDescription ?? null,
      businessWaste: scenario.businessWaste,
      wasteSavings: scenario.wasteSavings,
      wasteColor: scenario.wasteColor,
      fgDaysCover: scenario.fgDaysCover,
      nextActionPrefix: scenario.nextActionPrefix,
      nextAction: scenario.nextAction,
      icon: scenario.icon,
      feasibleProducible: scenario.feasibleProducible,
      productionStopDate: scenario.productionStopDate,
      dailyRunRate: scenario.dailyRunRate,
      receivingPlant: receivingPlantCode,
    };
    navigate({
      page: "tracking-details",
      tasks: buildActionTasks(scenarioDetails),
      scenario: scenarioDetails,
      from: { page: "network-down-stocking-agent-trial", srNo: row.srNo, preserveState: true },
    });
  };

  // Custom Scenario's Bill of Materials baseline is CBU-specific — rebuilt whenever the
  // selected CBU changes (the page itself is remounted per-CBU, so this only runs once per CBU).
  const customScenarioBaseline = useMemo(() => buildCustomScenarioBaseline(row), [row]);

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

  // Gate: the comparison report only renders once the user explicitly generates it,
  // with a brief loading state in between so it reads as an actual simulation run.
  const [isGeneratingScenarios, setIsGeneratingScenarios] = useState(false);
  const handleCreateScenario = () => {
    setShowCreateScenarioDrawer(true);
    setIsCustomising(true);

    setScenarioEditState({
      ...EMPTY_SCENARIO_EDIT_STATE,

      addedIutRows: [
        {
          id: `iut-${Date.now()}`,
          routeFrom: "",
          routeTo: "",
          matType: "RM",
          matCode: "",
          transferQty: 0,
          transferLeadTime: "",
          initiationDate: "",
          laneAvailable: null,
          costPerTrip: 0,
        },
      ],

      addedProcurementRows: [
        {
          id: `proc-${Date.now()}`,
          plant: "",
          matType: "RM",
          matCode: "",
          supplierName: "",
          orderQty: 0,
          moq: 0,
          pricePerUnit: 0,
        },
      ],

      hasChanges: false,
    });
  };
  const handleGenerateScenarios = () => {
    if (scenariosGenerated || isGeneratingScenarios) return;
    setIsGeneratingScenarios(true);
    window.setTimeout(() => {
      setIsGeneratingScenarios(false);
      onScenariosGeneratedChange(true);
      onDirty?.();
    }, 900);
  };

  const [showAcceptReasonModal, setShowAcceptReasonModal] = useState(false);
  const [acceptReasonText, setAcceptReasonText] = useState("");
  const [pendingScenario, setPendingScenario] = useState<ScenarioRow | null>(null);

  // "IUT + Break MOQ" drawer's own Done button: picking the non-recommended routing option no
  // longer prompts for a reason at Select time — instead the reason is requested once, when the
  // user tries to close the drawer via Done, so it doesn't interrupt exploring both options.
  const breakMoqOptions = useMemo(() => IUT_TRANSFER_OPTIONS.slice(0, 2), []);
  const breakMoqRecommended = breakMoqOptions.find((o) => o.isBest) ?? breakMoqOptions[0] ?? null;
  const [showBreakMoqDoneReasonModal, setShowBreakMoqDoneReasonModal] = useState(false);
  const [breakMoqDoneReasonText, setBreakMoqDoneReasonText] = useState("");

  // Which scenario's full breakdown is showing in the "More Details" popup.
  const [detailModalId, setDetailModalId] = useState<string | null>(null);
  const [showCreateScenarioDrawer, setShowCreateScenarioDrawer] = useState(false);
  // The redesigned detail page is only for the Sample Scenario row — the real IUT + Procurement
  // row (same underlying "iut-moq" id) keeps the original popup, so track which one opened it.
  const [detailFromSample, setDetailFromSample] = useState(false);
  // The "More Details" popup loads read-only; the header's Customise button (only shown while
  // read-only) switches it into the editable view — lifted up here so the header (rendered by
  // this component, not ScenarioDetailTable) can drive it.
  const [isCustomising, setIsCustomising] = useState(false);
  const [scenarioEditState, setScenarioEditState] = useState<ScenarioEditState>(EMPTY_SCENARIO_EDIT_STATE);
  // Same idea as scenarioEditState, but for re-customising an already-saved custom scenario —
  // every IUT/Procurement row (not just ones added this session) is editable there, so it needs
  // its own shape (see ScenarioDetailPrimitives.CustomSnapshotEditState).
  const [customSnapshotEditState, setCustomSnapshotEditState] = useState<CustomSnapshotEditState>(EMPTY_CUSTOM_SNAPSHOT_EDIT_STATE);

  // User-created scenarios — the Create Custom Scenario popup's inline Customise/Done toggle
  // feeds into this list, capped at MAX_CUSTOM_SCENARIOS.
  const [customScenarios, setCustomScenarios] = useState<ScenarioRow[]>([]);
  // Frozen "More Details" breakdown for each custom scenario, keyed by its id — lets a custom
  // scenario's own popup replay the exact figures it was saved with (see ScenarioDetailTable's
  // "Save as New Scenario").
  const [customScenarioSnapshots, setCustomScenarioSnapshots] = useState<Record<string, ScenarioDetailSnapshot>>({});

  // "Save as New Scenario" (drawer footer) — freezes the current (edited) figures as a
  // brand-new row in the comparison table, capped at MAX_CUSTOM_SCENARIOS.
  const atCustomScenarioLimit = customScenarios.length >= MAX_CUSTOM_SCENARIOS;

  const saveCustomScenarioSnapshot = (snapshot: ScenarioDetailSnapshot) => {
    if (atCustomScenarioLimit) return;
    const n = customScenarios.length + 1;
    const id = `custom-${Date.now()}-${n}`;
    const newScenario: ScenarioRow = {
      id,
      name: `Custom Scenario ${n}`,
      businessWaste: snapshot.businessWaste,
      wasteSavings: snapshot.wasteSavings,
      wasteColor: snapshot.wasteColor,
      fgDaysCover: snapshot.fgDaysCover,
      isBest: false,
      nextActionPrefix: "",
      nextAction: "Review Custom Scenario",
      icon: "custom",
      feasibleProducible: snapshot.totalFg,
      productionStopDate: snapshot.productionStopDate,
      dailyRunRate: 0,
    };
    setCustomScenarios((prev) => [...prev, newScenario]);
    setCustomScenarioSnapshots((prev) => ({ ...prev, [id]: snapshot }));
    toast.success(`${newScenario.name} added`, {
      description: `Created from ${snapshot.sourceScenarioName} with your edited values.`,
      duration: 4000,
    });
    closeDetailDrawer();
  };


  // Removing a custom scenario is the only way past the MAX_CUSTOM_SCENARIOS cap, so it's
  // offered directly on that scenario's row in the comparison table.
  const removeCustomScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomScenarios((prev) => prev.filter((s) => s.id !== id));
    setCustomScenarioSnapshots((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setCompareIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (acceptedId === id) onSelect("no-action");
    toast("Custom scenario removed", { duration: 3000 });
  };

  const addCustomScenario = (businessWaste: string, fgDaysCover: string) => {
    if (customScenarios.length >= MAX_CUSTOM_SCENARIOS) return;
    const n = customScenarios.length + 1;
    const wasteNum = parseCurrencyValue(businessWaste);
    const baselineWaste = parseCurrencyValue(baseline.businessWaste);
    const savings = baselineWaste - wasteNum;
    const pct = baselineWaste > 0 ? (savings / baselineWaste) * 100 : 0;
    const newScenario: ScenarioRow = {
      id: `custom-${Date.now()}-${n}`,
      name: `Custom Scenario ${n}`,
      businessWaste: `₹${wasteNum.toLocaleString("en-IN")}`,
      wasteSavings: savings > 0 ? `₹${savings.toLocaleString("en-IN")}` : null,
      wasteColor: pct >= 40 ? "teal" : "orange",
      fgDaysCover: `${parseDaysValue(fgDaysCover)}d`,
      isBest: false,
      nextActionPrefix: "",
      nextAction: "Review Custom Scenario",
      icon: "custom",
      // No underlying simulation backs a user-typed scenario, so these action-detail fields
      // stay at neutral defaults — only the two edited figures are meaningful here.
      feasibleProducible: 0,
      productionStopDate: "—",
      dailyRunRate: 0,
    };
    setCustomScenarios((prev) => [...prev, newScenario]);
    toast.success(`${newScenario.name} added`, {
      description: "Added to the scenario comparison list.",
      duration: 4000,
    });
  };

  const confirmAccept = (scenario: ScenarioRow) => {
    onSelect(scenario.id);
    onFinalAcceptedIdChange(scenario.id);
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
    onDirty?.();
    viewDetails(scenario);
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

  const openDetail = (scenario: ScenarioRow, e: React.MouseEvent, fromSample = false) => {
    e.stopPropagation();
    onSelect(scenario.id);
    setDetailModalId(scenario.id);
    setDetailFromSample(fromSample);
    setIsCustomising(false);
    setScenarioEditState(EMPTY_SCENARIO_EDIT_STATE);
    const snap = scenario.id.startsWith("custom-") ? customScenarioSnapshots[scenario.id] : undefined;
    setCustomSnapshotEditState(snap ? snapshotToEditState(snap) : EMPTY_CUSTOM_SNAPSHOT_EDIT_STATE);
  };

  const closeDetailDrawer = () => {
    setDetailModalId(null);
    setDetailFromSample(false);
    setIsCustomising(false);
    setScenarioEditState(EMPTY_SCENARIO_EDIT_STATE);
    setCustomSnapshotEditState(EMPTY_CUSTOM_SNAPSHOT_EDIT_STATE);
  };

  const handleResetEdits = () => {
    setScenarioEditState(EMPTY_SCENARIO_EDIT_STATE);
    setCustomSnapshotEditState(
      detailScenarioSnapshot ? snapshotToEditState(detailScenarioSnapshot) : EMPTY_CUSTOM_SNAPSHOT_EDIT_STATE,
    );
  };

  // Done on the "IUT + Break MOQ" drawer: closes normally if the recommended option is selected,
  // otherwise requires a reason first before the drawer is allowed to close. Only reached when
  // there are no pending edits — edited figures are handled by handleDoneClick instead.
  const handleBreakMoqDone = () => {
    if (!breakMoqRecommended || selTransfer === breakMoqRecommended.id) {
      closeDetailDrawer();
      return;
    }
    setBreakMoqDoneReasonText("");
    setShowBreakMoqDoneReasonModal(true);
  };

  const confirmBreakMoqDone = () => {
    setShowBreakMoqDoneReasonModal(false);
    setBreakMoqDoneReasonText("");
    closeDetailDrawer();
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

  const [customPlants, setCustomPlants] = useState<PlantGroup[]>(
    () => buildBaselineScenario(customScenarioBaseline).plants,
  );
  const [customOverrideRows, setCustomOverrideRows] = useState<CustomOverrideRow[]>(
    () => buildBaselineScenario(customScenarioBaseline).rows,
  );
  const [customFgUnits, setCustomFgUnits] = useState<Record<string, string>>({});
  const [customProductionPlan, setCustomProductionPlan] = useState<Record<string, string>>(
    () => buildBaselineScenario(customScenarioBaseline).productionPlan,
  );
  // "editing": Custom Scenario button clicked, table rows hidden while the form is open and unrun.
  // "computed": Run custom scenario clicked — ranked rows reappear with recalculated values (No Action stays hidden).
  const [scenarioViewState, setScenarioViewState] = useState<"default" | "editing" | "computed">("default");
  // Lets the user collapse the input form after running, so they can focus on the
  // scenario list/details below without the form taking up space. Auto-collapses on run.
  const [customFormCollapsed, setCustomFormCollapsed] = useState(false);
  const [recalculatedScenarios, setRecalculatedScenarios] = useState<Record<string, RecalcOverlay>>({});

  const handleCustomScenarioRun = () => {
    const parseWaste = (v: string | null) => (v ? parseFloat(v.replace(/[₹,]/g, "")) : 5541);
    const parseCover = (v: string | null) => (v ? parseInt(v, 10) : baselineDays);
    const rowCount = customOverrideRows.length;

    // Recalculate every ranked (non "No Action") scenario using the custom override inputs,
    // so the comparison table reflects the custom form's calculation once revealed.
    const recalculated: typeof recalculatedScenarios = {};
    ranked.forEach((s) => {
      const sBaseWaste = parseWaste(s.businessWaste);
      const sBaseCover = parseCover(s.fgDaysCover);
      const sWaste = Math.max(0, Math.round(sBaseWaste - rowCount * 110));
      const sCover = sBaseCover + Math.round(rowCount * 0.5);
      const sSavings = 5541 - sWaste;
      const sPct = (sSavings / 5541) * 100;
      recalculated[s.id] = {
        businessWaste: `₹${sWaste.toLocaleString("en-IN")}`,
        wasteSavings: sSavings > 0 ? `₹${sSavings.toLocaleString("en-IN")}` : null,
        wasteColor: sPct >= 40 ? "teal" : "orange",
        fgDaysCover: `${sCover}d`,
      };
    });
    setRecalculatedScenarios(recalculated);
    setScenarioViewState("computed");
    setCustomFormCollapsed(true);
    onDirty?.();
    // Keep any previously selected scenario's detail card hidden until the user
    // explicitly picks a row from the (now recalculated) list again.
    if (acceptedId) onSelect(acceptedId);
  };

  const displayFieldsFor = (scenario: ScenarioRow) => {
    const recalced = scenarioViewState === "computed" ? recalculatedScenarios[scenario.id] : undefined;
    const displayWaste = recalced?.businessWaste ?? scenario.businessWaste;
    const displaySavings = recalced ? recalced.wasteSavings : scenario.wasteSavings;
    const displayWasteColor = recalced?.wasteColor ?? scenario.wasteColor;
    const displayCover = recalced?.fgDaysCover ?? scenario.fgDaysCover;
    const coverDelta = parseInt(displayCover ?? "0") - baselineDays;
    return { displayWaste, displaySavings, displayWasteColor, displayCover, coverDelta };
  };

  const detailScenario =
    detailModalId === "no-action"
      ? baseline
      : ranked.find((s) => s.id === detailModalId) ?? customScenarios.find((s) => s.id === detailModalId) ?? null;
  const detailFields = detailScenario ? displayFieldsFor(detailScenario) : null;
  const isCustomDetailScenario = detailScenario?.id.startsWith("custom-") ?? false;
  const detailScenarioSnapshot = detailScenario ? customScenarioSnapshots[detailScenario.id] : undefined;
  // A previously-saved custom scenario is editable too, as long as it has a stored snapshot to
  // customise (a legacy custom scenario with no breakdown has nothing to edit). The live
  // ScenarioDetailTable branch is always editable, and the legacy Sample Scenario page manages
  // its own (unreachable) flow separately.
  const showsEditableDetailTable =
    !!detailScenario &&
    (!isCustomDetailScenario || !!detailScenarioSnapshot) &&
    !(detailScenario.id === "iut-moq" && detailFromSample);

  // The drawer's single footer "Done" button: for a live scenario, saves the current edits as a
  // new custom scenario; for a previously-saved custom scenario being re-customised, updates that
  // same scenario's snapshot in place instead of multiplying rows — otherwise just closes, running
  // the "IUT + Break MOQ" recommended-option reason-gate first when that applies.
  const handleDoneClick = () => {
    if (isCustomDetailScenario) {
      if (customSnapshotEditState.hasChanges && detailScenario && detailScenarioSnapshot) {
        const updated = editStateToSnapshot(detailScenarioSnapshot, customSnapshotEditState);
        setCustomScenarioSnapshots((prev) => ({ ...prev, [detailScenario.id]: updated }));
        toast.success(`${detailScenario.name} updated`, {
          description: "Your edits were saved to this custom scenario.",
          duration: 4000,
        });
      }
      closeDetailDrawer();
      return;
    }
    if (scenarioEditState.hasChanges) {
      if (atCustomScenarioLimit || !detailModalId) return;
      const vm = buildScenarioViewModel(detailModalId, selTransfer, moqSuppliers, scenarioEditState);
      if (!vm) return;
      saveCustomScenarioSnapshot(buildSnapshotFromViewModel(vm));
      return;
    }
    if (detailScenario?.id === "iut-moq-break") {
      handleBreakMoqDone();
      return;
    }
    closeDetailDrawer();
  };

  const TABLE_HEADERS = [
    "Scenario",
    "Business Waste",
    "FG Days Cover",
    "More Details",
    "",
    "",
  ];

  return (
    <StepSection
      step={3}
      title="Scenario Comparison Report"
      subtitle="System-generated"
      info="Click any scenario row to select it, or use 'More Details' to view its full component breakdown in a popup."
      headerRight={
        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={handleCreateScenario}
            className="inline-flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold"
            style={{
              backgroundColor: "#fff",
              color: C.blue,
              border: `1px solid ${C.borderBlue}`,
            }}
          >
            <Plus size={12} />
            Create New Scenario
          </button>

          <button
            type="button"
            onClick={handleGenerateScenarios}
            disabled={scenariosGenerated || isGeneratingScenarios}
            title={scenariosGenerated ? "Scenario comparison report generated" : "Run the simulation and show the comparison report"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
            style={
              scenariosGenerated
                ? { backgroundColor: "#dcfce7", color: "#166534", border: "1px solid #86efac", cursor: "default" }
                : isGeneratingScenarios
                  ? { backgroundColor: "#93c5fd", color: "#fff", cursor: "default" }
                  : { backgroundColor: C.blue, color: "#fff", cursor: "pointer" }
            }
          >
            {scenariosGenerated ? (
              <>
                <Check size={12} strokeWidth={3} />
                Generated
              </>
            ) : isGeneratingScenarios ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Zap size={12} />
                Generate Scenario
              </>
            )}
          </button>

        </div>
      }

    >
      {isGeneratingScenarios ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16">
          <Loader2 size={20} className="animate-spin" style={{ color: C.blue }} />
          <p className="text-sm" style={{ color: "#64748b" }}>Generating scenario comparison…</p>
        </div>
      ) : !scenariosGenerated && customScenarios.length === 0 ? null : (
        <>
          {/* ── Custom scenario form — only shown once "Custom Scenario" is clicked; editing here and running updates the table below directly ── */}
          {scenarioViewState !== "default" && (
            <div className="mb-3">
              <CustomOverridesForm
                rows={customOverrideRows}
                onRowsChange={setCustomOverrideRows}
                plants={customPlants}
                onPlantsChange={setCustomPlants}
                fgUnits={customFgUnits}
                onFgUnitsChange={setCustomFgUnits}
                productionPlan={customProductionPlan}
                onProductionPlanChange={setCustomProductionPlan}
                baseline={customScenarioBaseline}
                onRun={handleCustomScenarioRun}
                collapsed={customFormCollapsed}
                onToggleCollapsed={() => setCustomFormCollapsed((c) => !c)}
                computed={scenarioViewState === "computed"}
              />
            </div>
          )}

          {/* ── Comparison table ── */}
          <div
            className="overflow-x-auto rounded-xl w-full"
            style={{ border: "1px solid #e2e8f0" }}
          >
            <table className="text-xs w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: C.navy }}>
                  {TABLE_HEADERS.map((h, i) => (
                    <th
                      key={`${h}-${i}`}
                      className="px-3 py-2.5 text-left font-bold uppercase tracking-wide whitespace-nowrap"
                      style={{ color: "#ffffff", fontSize: 9 }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Ranked scenarios — hidden while a custom scenario is being defined, shown (recalculated) once run */}
                {scenariosGenerated && scenarioViewState !== "editing" && ranked.map((scenario) => {
                  const isSelected = acceptedId === scenario.id;
                  const isAccepted = finalAcceptedId === scenario.id;
                  const highlighted = isSelected || isAccepted;
                  const { displayWaste, displaySavings, displayWasteColor, displayCover, coverDelta } =
                    displayFieldsFor(scenario);
                  const inCompare = compareIds.has(scenario.id);
                  const isMaxed = !inCompare && compareIds.size >= 3;

                  return (
                    <tr
                      key={scenario.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelect(scenario.id)}
                      onKeyDown={(e) => e.key === "Enter" && onSelect(scenario.id)}
                      title={`Select ${scenario.name} to view its component breakdown`}
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
                          ? scenario.isBest
                            ? "#f0fdf4"
                            : "#dcfce7"
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
                            color: displayWasteColor === "teal" ? C.teal : "#dc2626",
                          }}
                        >
                          {displayWaste}
                        </span>
                        {displaySavings && (() => {
                          const saved = parseFloat((displaySavings ?? "").replace(/[₹,]/g, "")) || 0;
                          const pct = (saved / 5541) * 100;
                          const color = pct >= 40 ? C.teal : pct >= 20 ? "#d97706" : "#dc2626";
                          return (
                            <span className="ml-1.5 font-semibold tabular-nums" style={{ color, fontSize: 10 }}>
                              ↓ {displaySavings}
                            </span>
                          );
                        })()}
                      </td>

                      {/* FG Cover */}
                      <td className="px-3 py-3">
                        <div>
                          <span className="font-semibold tabular-nums" style={{ color: "#374151" }}>
                            {displayCover}
                          </span>
                          {coverDelta > 0 && (
                            <span
                              className="ml-1.5 font-semibold"
                              style={{ color: C.green, fontSize: 10 }}
                            >
                              +{coverDelta}d
                            </span>
                          )}
                        </div>
                        {coverDateLabel(displayCover) && (
                          <div className="tabular-nums" style={{ color: "#94a3b8", fontSize: 10 }}>
                            till {coverDateLabel(displayCover)}
                          </div>
                        )}
                      </td>

                      {/* More Details — every row opens the same right-side drawer with the unified
                      single-option Summary/Plant level/IUT/Procurement breakdown. */}
                      <td className="px-3 py-3" style={{ borderLeft: "1px solid #e2e8f0" }}>
                        <button
                          type="button"
                          onClick={(e) => openDetail(scenario, e)}
                          title={`View detailed breakdown for ${scenario.name}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer"
                          style={{ backgroundColor: C.bgBlue, color: C.blue, border: `1px solid ${C.borderBlue}` }}
                        >
                          <Eye size={11} />
                          More Details
                        </button>
                      </td>

                      {/* Compare */}
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={(e) => toggleCompare(scenario.id, e)}
                          disabled={isMaxed}
                          title={inCompare ? "Remove this scenario from comparison" : isMaxed ? "Maximum of 3 scenarios can be compared at once" : "Add this scenario to the comparison panel"}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer disabled:cursor-not-allowed"
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
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold whitespace-nowrap"
                              style={{ backgroundColor: "#dcfce7", color: "#166534", fontSize: 10, border: "1px solid #86efac" }}
                            >
                              <Check size={11} />
                              Accepted
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                viewDetails(scenario);
                              }}
                              title={`View action details for ${scenario.name}`}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all hover:opacity-90 cursor-pointer"
                              style={{ backgroundColor: C.blue, color: "#fff", fontSize: 10 }}
                            >
                              <ExternalLink size={11} />
                              View Details
                            </button>
                          </div>
                        ) : (
                          !finalAcceptedId && isSelected && (
                            <button
                              type="button"
                              onClick={(e) => handleAccept(scenario, e)}
                              title={`Accept ${scenario.name} as the final decision`}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all hover:opacity-90 cursor-pointer"
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
                })}

                {/* User-created custom scenarios — one row per Customize-tab save, in creation order,
                each behaving exactly like a ranked scenario row (select / compare / accept). */}
                {scenarioViewState !== "editing" && customScenarios.map((scenario) => {
                  const isSelected = acceptedId === scenario.id;
                  const isAccepted = finalAcceptedId === scenario.id;
                  const highlighted = isSelected || isAccepted;
                  const { displayWaste, displaySavings, displayWasteColor, displayCover, coverDelta } =
                    displayFieldsFor(scenario);
                  const inCompare = compareIds.has(scenario.id);
                  const isMaxed = !inCompare && compareIds.size >= 3;

                  return (
                    <tr
                      key={scenario.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelect(scenario.id)}
                      onKeyDown={(e) => e.key === "Enter" && onSelect(scenario.id)}
                      title={`Select ${scenario.name} to view its details`}
                      style={{
                        borderBottom: "1px solid #e2e8f0",
                        borderLeft: isAccepted ? `3px solid ${C.green}` : highlighted ? `3px solid ${C.blue}` : "3px solid transparent",
                        backgroundColor: isAccepted ? "#dcfce7" : highlighted ? "#EFF4FB" : "#ffffff",
                        outline: isAccepted ? `2px solid ${C.green}` : highlighted ? `2px solid ${C.blue}` : undefined,
                        outlineOffset: highlighted ? -1 : undefined,
                        cursor: "pointer",
                      }}
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <ScenarioIcon icon={scenario.icon} isAccepted={highlighted} />
                          <span
                            className="font-semibold whitespace-nowrap"
                            style={{ color: isAccepted ? C.green : highlighted ? C.blue : C.navy }}
                          >
                            {scenario.name}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap"
                            style={{ backgroundColor: "#f5f3ff", color: "#6d28d9" }}
                          >
                            Custom
                          </span>
                          <button
                            type="button"
                            onClick={(e) => removeCustomScenario(scenario.id, e)}
                            title={`Remove ${scenario.name}`}
                            className="flex items-center justify-center rounded-full shrink-0 cursor-pointer transition-colors hover:bg-red-50"
                            style={{ width: 18, height: 18, color: "#94a3b8" }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <span className="font-bold tabular-nums" style={{ color: displayWasteColor === "teal" ? C.teal : "#dc2626" }}>
                          {displayWaste}
                        </span>
                        {displaySavings && (() => {
                          const saved = parseFloat((displaySavings ?? "").replace(/[₹,]/g, "")) || 0;
                          const pct = (saved / 5541) * 100;
                          const color = pct >= 40 ? C.teal : pct >= 20 ? "#d97706" : "#dc2626";
                          return (
                            <span className="ml-1.5 font-semibold tabular-nums" style={{ color, fontSize: 10 }}>
                              ↓ {displaySavings}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="px-3 py-3">
                        <div>
                          <span className="font-semibold tabular-nums" style={{ color: "#374151" }}>
                            {displayCover}
                          </span>
                          {coverDelta > 0 && (
                            <span className="ml-1.5 font-semibold" style={{ color: C.green, fontSize: 10 }}>
                              +{coverDelta}d
                            </span>
                          )}
                        </div>
                        {coverDateLabel(displayCover) && (
                          <div className="tabular-nums" style={{ color: "#94a3b8", fontSize: 10 }}>
                            till {coverDateLabel(displayCover)}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3" style={{ borderLeft: "1px solid #e2e8f0" }}>
                        <button
                          type="button"
                          onClick={(e) => openDetail(scenario, e)}
                          title={`View details for ${scenario.name}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer"
                          style={{ backgroundColor: C.bgBlue, color: C.blue, border: `1px solid ${C.borderBlue}` }}
                        >
                          <Eye size={11} />
                          More Details
                        </button>
                      </td>

                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={(e) => toggleCompare(scenario.id, e)}
                          disabled={isMaxed}
                          title={inCompare ? "Remove this scenario from comparison" : isMaxed ? "Maximum of 3 scenarios can be compared at once" : "Add this scenario to the comparison panel"}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer disabled:cursor-not-allowed"
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

                      <td className="px-3 py-3">
                        {finalAcceptedId === scenario.id ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold whitespace-nowrap"
                              style={{ backgroundColor: "#dcfce7", color: "#166534", fontSize: 10, border: "1px solid #86efac" }}
                            >
                              <Check size={11} />
                              Accepted
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                viewDetails(scenario);
                              }}
                              title={`View action details for ${scenario.name}`}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all hover:opacity-90 cursor-pointer"
                              style={{ backgroundColor: C.blue, color: "#fff", fontSize: 10 }}
                            >
                              <ExternalLink size={11} />
                              View Details
                            </button>
                          </div>
                        ) : (
                          !finalAcceptedId && isSelected && (
                            <button
                              type="button"
                              onClick={(e) => handleAccept(scenario, e)}
                              title={`Accept ${scenario.name} as the final decision`}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all hover:opacity-90 cursor-pointer"
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
                })}

                {/* Empty state while defining a custom scenario */}
                {scenarioViewState === "editing" && (
                  <tr>
                    <td colSpan={TABLE_HEADERS.length} className="px-3 py-8 text-center">
                      <span className="text-xs italic" style={{ color: "#94a3b8" }}>
                        Define your overrides in the Custom Scenario panel, then click "Run custom scenario" to see updated results.
                      </span>
                    </td>
                  </tr>
                )}

                {/* No Action — baseline row, hidden while defining/using a custom scenario */}
                {scenariosGenerated && scenarioViewState === "default" && (() => {
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
                      title="Select No Action (baseline) to view its component breakdown"
                      style={{
                        borderBottom: "1px solid #e2e8f0",
                        borderLeft: isAccepted ? `3px solid ${C.green}` : highlighted ? `3px solid ${C.blue}` : "3px solid transparent",
                        backgroundColor: isAccepted ? "#f0fdf4" : highlighted ? "#EFF4FB" : "#f8fafc",
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
                            style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #cbd5e1" }}
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
                        {coverDateLabel(baseline.fgDaysCover) && (
                          <div className="tabular-nums" style={{ color: "#94a3b8", fontSize: 10 }}>
                            till {coverDateLabel(baseline.fgDaysCover)}
                          </div>
                        )}
                      </td>

                      {/* More Details — opens the full breakdown in a popup */}
                      <td className="px-3 py-3" style={{ borderLeft: "1px solid #e2e8f0" }}>
                        <button
                          type="button"
                          onClick={(e) => openDetail(baseline, e)}
                          title={`View detailed breakdown for ${baseline.name}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer"
                          style={{ backgroundColor: C.bgBlue, color: C.blue, border: `1px solid ${C.borderBlue}` }}
                        >
                          <Eye size={11} />
                          More Details
                        </button>
                      </td>

                      {/* Compare */}
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={(e) => toggleCompare(baseline.id, e)}
                          disabled={isMaxed}
                          title={inCompare ? "Remove this scenario from comparison" : isMaxed ? "Maximum of 3 scenarios can be compared at once" : "Add this scenario to the comparison panel"}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer disabled:cursor-not-allowed"
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
                          <div className="flex items-center gap-1.5">
                            <span
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap"
                              style={{ backgroundColor: C.green, color: "#fff", fontSize: 10 }}
                            >
                              <Check size={11} />
                              Accepted
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                viewDetails(baseline);
                              }}
                              title={`View action details for ${baseline.name}`}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all hover:opacity-90 cursor-pointer"
                              style={{ backgroundColor: C.blue, color: "#fff", fontSize: 10 }}
                            >
                              <ExternalLink size={11} />
                              View Details
                            </button>
                          </div>
                        ) : (
                          !finalAcceptedId && isSelected && (
                            <button
                              type="button"
                              onClick={(e) => handleAccept(baseline, e)}
                              title={`Accept ${baseline.name} as the final decision`}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all hover:opacity-90 cursor-pointer"
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

              </tbody>
            </table>
          </div>

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
                  title={showComparison ? "Hide the side-by-side comparison panel" : "Show a side-by-side comparison of the selected scenarios"}
                  className="inline-flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
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

          {/* ── Scenario detail popup — a right-side drawer (same shell as the IUT + Procurement
          drawer below) carrying each scenario's own existing breakdown content unchanged. ── */}
          {detailScenario && detailFields && (
            <DetailDrawer
              title={detailScenario.name}
              onClose={closeDetailDrawer}
              headerRight={
                showsEditableDetailTable && !isCustomising ? (
                  <button
                    type="button"
                    onClick={() => setIsCustomising(true)}
                    title="Edit this scenario's figures"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                    style={{ backgroundColor: "#fff", color: C.navy, border: "1px solid #cbd5e1" }}
                  >
                    <Pencil size={11} />
                    Customise
                  </button>
                ) : undefined
              }
              footer={
                showsEditableDetailTable ? (() => {
                  const hasChanges = isCustomDetailScenario ? customSnapshotEditState.hasChanges : scenarioEditState.hasChanges;
                  const blockedByLimit = !isCustomDetailScenario && hasChanges && atCustomScenarioLimit;
                  return (
                    <div className="w-full flex items-center justify-between gap-3">
                      {hasChanges ? (
                        <p className="text-[11px] flex-1 min-w-0" style={{ color: C.blue }}>
                          <span className="font-semibold">Unsaved changes</span>
                          {isCustomDetailScenario
                            ? " — save these edits to this custom scenario."
                            : " — save these values as a new custom scenario."}
                          {blockedByLimit && (
                            <span style={{ color: "#b45309" }}>
                              {" "}Limit of {MAX_CUSTOM_SCENARIOS} custom scenarios reached — remove an existing one from the table to create another.
                            </span>
                          )}
                        </p>
                      ) : <span />}
                      <div className="flex items-center gap-2 shrink-0">
                        {hasChanges && (
                          <button
                            type="button"
                            onClick={handleResetEdits}
                            title="Discard your edits and start over"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            style={{ backgroundColor: "#e2e8f0", color: "#64748b" }}
                          >
                            <RotateCcw size={12} />
                            Reset
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={blockedByLimit}
                          onClick={handleDoneClick}
                          title={
                            blockedByLimit
                              ? `Limit of ${MAX_CUSTOM_SCENARIOS} custom scenarios reached`
                              : hasChanges
                                ? isCustomDetailScenario
                                  ? "Save these edits to this custom scenario"
                                  : "Save these edited figures as a new custom scenario"
                                : "Close this popup"
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                          style={
                            blockedByLimit
                              ? { backgroundColor: "#f1f5f9", color: "#cbd5e1", cursor: "not-allowed" }
                              : { backgroundColor: C.blue, color: "#fff", cursor: "pointer" }
                          }
                        >
                          {hasChanges && <Sparkles size={12} />}
                          {hasChanges ? (isCustomDetailScenario ? "Save Changes" : "Save New Scenario") : "Done"}
                        </button>
                      </div>
                    </div>
                  );
                })() : undefined
              }
            >
              {isCustomDetailScenario && detailScenarioSnapshot ? (
                // A previously-created custom scenario, saved from ScenarioDetailTable's "Save as
                // New Scenario" — replays its frozen breakdown, editable again via the header's
                // Customise button just like a live scenario.
                <div className="p-4">
                  <CustomScenarioDetailView
                    snapshot={detailScenarioSnapshot}
                    isCustomising={isCustomising}
                    editState={customSnapshotEditState}
                    onEditStateChange={(patch) => setCustomSnapshotEditState((s) => ({ ...s, ...patch }))}
                  />
                </div>
              ) : isCustomDetailScenario ? (
                // A legacy custom scenario with no stored breakdown — read-only recap.
                <div className="p-6">
                  <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ border: "1px solid #e2e8f0", backgroundColor: "#fafafa" }}>
                    <div className="flex items-center gap-2">
                      <ScenarioIcon icon={detailScenario.icon} isAccepted={false} />
                      <span className="text-sm font-bold" style={{ color: C.navy }}>{detailScenario.name}</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: "#f5f3ff", color: "#6d28d9" }}>
                        Custom
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg px-3 py-2.5 text-center" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
                        <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Business Waste</div>
                        <div className="text-base font-bold tabular-nums mt-0.5" style={{ color: C.navy }}>{detailFields.displayWaste}</div>
                      </div>
                      <div className="rounded-lg px-3 py-2.5 text-center" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
                        <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>FG Days Cover</div>
                        <div className="text-base font-bold tabular-nums mt-0.5" style={{ color: C.navy }}>{detailFields.displayCover}</div>
                      </div>
                    </div>
                    <p className="text-[11px]" style={{ color: "#64748b" }}>
                      This scenario's figures were entered manually via Customise — it has no underlying component breakdown.
                    </p>
                  </div>
                </div>
              ) : detailScenario.id === "iut-moq" && detailFromSample ? (
                <CustomScenarioDetailPage
                  key={detailScenario.id}
                  row={row}
                  selTransfer={selTransfer}
                  onSelTransfer={onSelTransfer}
                  moqSuppliers={moqSuppliers}
                  onMoqSupplier={onMoqSupplier}
                  customScenarioCount={customScenarios.length}
                  maxCustomScenarios={MAX_CUSTOM_SCENARIOS}
                  onAddCustomScenario={addCustomScenario}
                />
              ) : (
                <div className="p-4 space-y-4">
                  <ScenarioDetailTable
                    key={detailScenario.id}
                    scenarioId={detailScenario.id}
                    selTransfer={selTransfer}
                    moqSuppliers={moqSuppliers}
                    onMoqSupplier={onMoqSupplier}
                    isCustomising={isCustomising}
                    editState={scenarioEditState}
                    onEditStateChange={(patch) => setScenarioEditState((s) => ({ ...s, ...patch }))}
                  />
                  <ScenarioDetailView
                    row={row}
                    scenarioId={detailScenario.id}
                    selTransfer={selTransfer}
                    onSelTransfer={onSelTransfer}
                    moqSuppliers={moqSuppliers}
                    onMoqSupplier={onMoqSupplier}
                  />
                </div>
              )}
            </DetailDrawer>
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
                      title="Cancel and keep the current selection"
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
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
                      title={acceptReasonText.trim() ? "Submit your reason and accept this scenario" : "Enter a reason to enable submission"}
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

          {showBreakMoqDoneReasonModal && breakMoqRecommended && createPortal(
            <div
              className="fixed inset-0 z-[70] flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              onClick={() => { setShowBreakMoqDoneReasonModal(false); setBreakMoqDoneReasonText(""); }}
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
                        {breakMoqRecommended.label} is recommended. Why choose{" "}
                        {breakMoqOptions.find((o) => o.id === selTransfer)?.label ?? "this option"} instead?
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4 flex flex-col gap-3">
                  <textarea
                    value={breakMoqDoneReasonText}
                    onChange={(e) => setBreakMoqDoneReasonText(e.target.value)}
                    placeholder="Enter your reason here…"
                    rows={4}
                    className="w-full rounded-lg text-xs resize-none outline-none focus:ring-2 px-3 py-2"
                    style={{ border: "1px solid #cbd5e1", color: "#1e293b", lineHeight: 1.6 }}
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowBreakMoqDoneReasonModal(false); setBreakMoqDoneReasonText(""); }}
                      title="Cancel and keep the drawer open"
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                      style={{ backgroundColor: "#e2e8f0", color: "#64748b" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!breakMoqDoneReasonText.trim()}
                      onClick={confirmBreakMoqDone}
                      title={breakMoqDoneReasonText.trim() ? "Confirm this selection and close" : "Enter a reason to enable confirmation"}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity"
                      style={{
                        backgroundColor: breakMoqDoneReasonText.trim() ? C.blue : "#93c5fd",
                        color: "#fff",
                        cursor: breakMoqDoneReasonText.trim() ? "pointer" : "not-allowed",
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}
        </>
      )}
      {showCreateScenarioDrawer && (
        <CreateCustomScenarioDrawer
          editState={scenarioEditState}
          onEditStateChange={(patch) =>
            setScenarioEditState((s) => ({
              ...s,
              ...patch,
            }))
          }
          onClose={() => setShowCreateScenarioDrawer(false)}
          onSave={(snapshot) => {
            saveCustomScenarioSnapshot(snapshot);
            setShowCreateScenarioDrawer(false);
          }}
          selTransfer={selTransfer}
          moqSuppliers={moqSuppliers}
          onMoqSupplier={onMoqSupplier}
        />
      )}
    </StepSection>
  );
}
