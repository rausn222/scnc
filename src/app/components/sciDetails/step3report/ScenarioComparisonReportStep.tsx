import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  Check,
  ChevronRight,
  ExternalLink,
  Link2Off,
  Pencil,
  Star,
  X,
} from "lucide-react";
import { useNav } from "../../../App";
import type { CBURow } from "../../data";
import type { ScenarioRow, PlantGroup, CustomOverrideRow } from "../types";
import { StepSection } from "../StepSection";
import { ScenarioIcon } from "../ScenarioIcon";
import { CustomOverridesForm } from "../customOverrides/CustomOverridesForm";
import {
  buildCustomScenarioBaseline,
  buildBaselineScenario,
} from "../customOverrides/customOverridesUtils";
import { C, SCENARIOS, IUT_TRANSFER_OPTIONS, CUSTOM_SCENARIO } from "../constants";
import { getCardDefs } from "../utils";
import { ScenarioComparisonPanel } from "../step3/ScenarioComparisonPanel";
import { ScenarioDetailCard } from "../step3/ScenarioDetailCard";

/**
 * Same ranked comparison table and interactions as ScenarioComparisonStep,
 * using the original ScenarioDetailCard breakdown below the table.
 */
export function ScenarioComparisonReportStep({
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
  onDirty?: () => void;
}) {
  const { navigate } = useNav();
  const baseline = SCENARIOS.find((s) => s.id === "no-action")!;
  const baselineDays = parseInt(baseline.fgDaysCover ?? "0");

  const viewDetails = (scenario: ScenarioRow) => {
    const receivingPlantCode = IUT_TRANSFER_OPTIONS.find((o) => o.id === selTransfer)?.routeTo ?? "U535";
    navigate({
      page: "action-details",
      scenario: {
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
      },
      srNo: row.srNo,
      from: { page: "sci-detail-report", srNo: row.srNo },
    });
  };

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
    onDirty?.();
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
  const [scenarioViewState, setScenarioViewState] = useState<"default" | "editing" | "computed">("default");
  const [customFormCollapsed, setCustomFormCollapsed] = useState(false);
  const [recalculatedScenarios, setRecalculatedScenarios] = useState<
    Record<string, { businessWaste: string; wasteSavings: string | null; wasteColor: "teal" | "orange"; fgDaysCover: string }>
  >({});

  const handleCustomScenarioRun = () => {
    const parseWaste = (v: string | null) => (v ? parseFloat(v.replace(/[₹,]/g, "")) : 5541);
    const parseCover = (v: string | null) => (v ? parseInt(v, 10) : baselineDays);
    const rowCount = customOverrideRows.length;

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
    if (acceptedId) onSelect(acceptedId);
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
      subtitle="System-generated"
      info="Click any scenario row to expand its component breakdown inline and view full details below — click the row again to collapse it."
      headerRight={
        <button
          type="button"
          onClick={() => {
            setScenarioViewState((s) => (s === "default" ? "editing" : "default"));
            setCustomFormCollapsed(false);
            if (acceptedId) onSelect(acceptedId);
          }}
          title={scenarioViewState === "default" ? "Define your own component overrides and run a custom scenario" : "Close the custom scenario form"}
          className="inline-flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
          style={{ backgroundColor: C.blue, color: "#fff" }}
        >
          {scenarioViewState === "default" ? <Pencil size={12} /> : <X size={12} />}
          Custom Scenario
        </button>
      }
    >
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
        className="overflow-x-auto rounded-xl"
        style={{ border: "1px solid #e2e8f0" }}
      >
        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
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
            {scenarioViewState !== "editing" && ranked.map((scenario) => {
              const isSelected = acceptedId === scenario.id;
              const isAccepted = finalAcceptedId === scenario.id;
              const highlighted = isSelected || isAccepted;
              const recalced = scenarioViewState === "computed" ? recalculatedScenarios[scenario.id] : undefined;
              const displayWaste = recalced?.businessWaste ?? scenario.businessWaste;
              const displaySavings = recalced ? recalced.wasteSavings : scenario.wasteSavings;
              const displayWasteColor = recalced?.wasteColor ?? scenario.wasteColor;
              const displayCover = recalced?.fgDaysCover ?? scenario.fgDaysCover;
              const coverDelta = parseInt(displayCover ?? "0") - baselineDays;
              const inCompare = compareIds.has(scenario.id);
              const isMaxed = !inCompare && compareIds.size >= 3;

              return (
                <React.Fragment key={scenario.id}>
                  <tr
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

                    <td className="px-3 py-3">
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
                    </td>

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

                    <td className="px-3 py-3" style={{ borderLeft: "1px solid #e2e8f0" }}>
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
                            title={`View details for ${scenario.name}`}
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
                </React.Fragment>
              );
            })}

            {scenarioViewState === "editing" && (
              <tr>
                <td colSpan={TABLE_HEADERS.length} className="px-3 py-8 text-center">
                  <span className="text-xs italic" style={{ color: "#94a3b8" }}>
                    Define your overrides in the Custom Scenario panel, then click "Run custom scenario" to see updated results.
                  </span>
                </td>
              </tr>
            )}

            {scenarioViewState === "default" && (() => {
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

                  <td className="px-3 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap"
                      style={{ backgroundColor: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" }}
                    >
                      {baseline.nextAction}
                    </span>
                  </td>

                  <td className="px-3 py-3" style={{ borderLeft: "1px solid #e2e8f0" }}>
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
                          title={`View details for ${baseline.name}`}
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

      {/* Scenario detail expansion */}
      {(() => {
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
    </StepSection>
  );
}
