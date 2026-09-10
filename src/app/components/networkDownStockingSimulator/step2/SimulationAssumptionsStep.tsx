import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeftRight, Box, Calendar, ListChecks, Loader2, ShoppingCart, SlidersHorizontal, Warehouse } from "lucide-react";
import type { CBURow } from "../../data";
import { StepSection } from "../StepSection";
import {
  C,
  moqSupplierKey,
  type RmpmBomPendingStatus,
  type RmpmConnectivityStatus,
} from "../../sciDetails/constants";
import { buildOpenPoLinesForCbu, daysPastDue, formatIsoDateShort, getRmpmConnectivityStatus } from "../../sciDetails/utils";
import { CustomOverridesForm } from "../../sciDetails/customOverrides/CustomOverridesForm";
import { buildBaselineScenario, buildCustomScenarioBaseline } from "../../sciDetails/customOverrides/customOverridesUtils";
import { DateAssumptionTile } from "./DateAssumptionTile";
import { AssumptionTile } from "./AssumptionTile";
import { Modal } from "../Modal";
import { OpenPoAssumptionsContent } from "./OpenPoAssumptionsContent";
import { RmpmConnectivityContent } from "./RmpmConnectivityContent";
import { RmpmBomPendingContent } from "./RmpmBomPendingContent";
import { IutFeasibilityContent } from "./IutFeasibilityContent";
import { MoqBreakContent } from "./MoqBreakContent";
import MaterialScopeContent from "./MaterialScopeContent";
import { SupplierInventoryFeedstockContent } from "./SupplierInventoryFeedstockContent";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { initStep2, setStep2Field, type SciDetailStep2State } from "../../../store/slices/sciDetailSlice";
import { useSimulationAssumptionsQuery } from "../../../queries/networkDownStockingSimulator";
import { getMaterialBatchKey, type SimulationAssumptionsCatalog } from "../../../api/networkDownStockingSimulator/step2Api";

type AssumptionModalKey = "openpo" | "rmpm" | "iut" | "moq" | "materialScope" | "custom" | "supplierInventory";

// Simulated save latency for "Customise inputs" — mirrors the loading pattern used by
// step3/ScenarioComparisonStep's handleGenerateScenarios, so a save reads as real work.
const CUSTOM_INPUTS_SAVE_DELAY_MS = 600;

// Stable fallback so every computation below has something to read from while
// useSimulationAssumptionsQuery is still loading, without ever being written into redux
// (see the initStep2 effect, which is gated on the *real* query result, not this).
const EMPTY_ASSUMPTIONS_CATALOG: SimulationAssumptionsCatalog = {
  openPoLines: [],
  moqBreakMaterials: [],
  moqBreakSuppliers: {},
  supplierInventoryFeedstockMaterials: [],
  iutTransferLanes: [],
  iutLaneRequirements: {},
  materialScopeData: [],
  materialBatchData: [],
  rmpmBomConnectivityRows: [],
  rmpmBomPendingLiesWith: { contract_pending: "", po_creation_pending: "" },
  rmpmBomPendingTileLabel: { contract_pending: "", po_creation_pending: "" },
  rmpmConnectivityStatusMessage: { bom_not_available: "", contract_pending: "", po_creation_pending: "" },
  rmpmConnectivityStatusPillLabel: { bom_not_available: "", contract_pending: "", po_creation_pending: "" },
  plantOwnershipMap: {},
};

function countPillStyle(count: number, total: number) {
  return {
    backgroundColor: count === total ? C.successBg : count === 0 ? C.bgSlate : C.warningBg,
    color: count === total ? C.successText : count === 0 ? C.muted : C.warningTextDark,
  };
}

/** Every Step 2 input's CBU-derived starting value — built from the fetched assumptions catalog
 * whenever `step2` is null in the store (a genuinely new CBU, per resetOnCbuChange) so the tiles
 * always have something to render immediately, then persisted via `initStep2` so subsequent
 * edits have somewhere to write to. */
function buildDefaultStep2State(
  catalog: SimulationAssumptionsCatalog,
  customInputsBaseline: ReturnType<typeof buildCustomScenarioBaseline>,
): SciDetailStep2State {
  const seed = buildBaselineScenario(customInputsBaseline);
  return {
    networkTransitionDate: "",
    poIncludedByLine: Object.fromEntries(catalog.openPoLines.map((l) => [l.id, false])),
    rmpmDate: "",
    rmpmManualDate: "",
    moqBreak: Object.fromEntries(
      catalog.moqBreakMaterials.flatMap((mat) =>
        (catalog.moqBreakSuppliers[mat.code] ?? []).map((s) => [moqSupplierKey(mat.code, s.name), false]),
      ),
    ),
    batchThresholds: Object.fromEntries(
      Array.from(new Set(catalog.materialBatchData.map((row) => row.materialCode))).map((code) => [code, "7"]),
    ),
    selectedBatches: Object.fromEntries(catalog.materialBatchData.map((row) => [getMaterialBatchKey(row), true])),
    iutLanes: { "U535→UTR": true, "UTR→U535": true },
    // Pre-IUT lead time defaults to 7 days when either endpoint plant is a 2P/3P
    // (third-party) site, else 4 days for a purely own-to-own transfer.
    contractLeadTimes: Object.fromEntries(
      catalog.iutTransferLanes.map((lane) => {
        const involvesThirdParty =
          catalog.plantOwnershipMap[lane.from] === "2p3p" || catalog.plantOwnershipMap[lane.to] === "2p3p";
        return [`${lane.from}→${lane.to}`, involvesThirdParty ? "7" : "4"];
      }),
    ),
    materialScopeSelected: Object.fromEntries(
      catalog.materialScopeData.map((material) => [material.materialCode, !material.newCbuAssociated]),
    ),
    customPlants: seed.plants,
    customRows: seed.rows,
    customFgUnits: {},
    customProductionPlan: seed.productionPlan,
    customInputsSaved: false,
    // Supplier inventory pre-fills from open PO lines where a matching material exists —
    // feedstock has no such source, so it starts from the mock value on each material.
    supplierInventoryInputs: Object.fromEntries(
      catalog.supplierInventoryFeedstockMaterials.map((material) => {
        const match = catalog.openPoLines.find((l) => l.componentCode === material.materialCode);
        return [material.materialCode, match ? String(match.supplierInventory) : ""];
      }),
    ),
    feedstockInputs: Object.fromEntries(
      catalog.supplierInventoryFeedstockMaterials.map((material) => [material.materialCode, String(material.feedstock)]),
    ),
  };
}

export function SimulationAssumptionsStep({
  oldCbuRow,
  newCbuRow,
  onDirty,
}: {
  oldCbuRow: CBURow;
  newCbuRow: CBURow | null;
  /** Called whenever the user changes an assumption that should mark the page's draft as dirty. */
  onDirty?: () => void;
}) {
  const dispatch = useAppDispatch();

  // New CBU is optional ("Old CBU required · New CBU optional" — see SelectCbuStep) — most
  // scenarios never pick one. Customise Inputs still needs a CBU's BOM to seed from, so it
  // falls back to the Old CBU whenever no New CBU is selected, instead of showing nothing.
  const customInputsSourceRow = newCbuRow ?? oldCbuRow;
  const customInputsBaseline = useMemo(
    () => buildCustomScenarioBaseline(customInputsSourceRow),
    [customInputsSourceRow],
  );

  // Step 2's own reference/catalog data — fetched based on the Step 1 selection (Old/New CBU).
  const assumptionsQuery = useSimulationAssumptionsQuery(oldCbuRow.cbuCode, newCbuRow?.cbuCode);
  const catalog = assumptionsQuery.data ?? EMPTY_ASSUMPTIONS_CATALOG;

  const storedStep2 = useAppSelector((s) => s.sciDetail.step2);
  const defaultStep2 = useMemo(() => buildDefaultStep2State(catalog, customInputsBaseline), [catalog, customInputsBaseline]);
  // Seeds the store the moment this CBU has no Step 2 state yet (a genuinely new CBU, per
  // resetOnCbuChange) — gated on the *real* query result (not the empty fallback above) so a
  // still-loading catalog never gets written into redux as if it were the real assumptions.
  useLayoutEffect(() => {
    if (!storedStep2 && assumptionsQuery.data) {
      dispatch(initStep2(buildDefaultStep2State(assumptionsQuery.data, customInputsBaseline)));
    }
  }, [storedStep2, assumptionsQuery.data, customInputsBaseline, dispatch]);
  const step2 = storedStep2 ?? defaultStep2;

  const {
    networkTransitionDate,
    poIncludedByLine,
    rmpmDate,
    rmpmManualDate,
    moqBreak,
    batchThresholds,
    selectedBatches,
    iutLanes,
    contractLeadTimes,
    materialScopeSelected,
    customPlants,
    customRows,
    customFgUnits,
    customProductionPlan,
    customInputsSaved,
    supplierInventoryInputs,
    feedstockInputs,
  } = step2;

  const updateStep2 = <K extends keyof SciDetailStep2State>(key: K, value: SciDetailStep2State[K]) => {
    dispatch(setStep2Field({ key, value } as never));
  };

  const [isSavingCustomInputs, setIsSavingCustomInputs] = useState(false);
  const [openModal, setOpenModal] = useState<AssumptionModalKey | null>(null);

  const handleNetworkTransitionDate = (v: string) => {
    updateStep2("networkTransitionDate", v);
    onDirty?.();
  };
  const handleSetLineIncluded = (id: string, v: boolean) => {
    updateStep2("poIncludedByLine", { ...poIncludedByLine, [id]: v });
    onDirty?.();
  };
  const handleBulkSetIncluded = (v: boolean) => {
    const next = { ...poIncludedByLine };
    catalog.openPoLines.forEach((l) => { next[l.id] = v; });
    updateStep2("poIncludedByLine", next);
    onDirty?.();
  };
  const handleRmpmDate = (v: string) => {
    updateStep2("rmpmDate", v);
    onDirty?.();
  };
  const handleRmpmManualDate = (v: string) => {
    updateStep2("rmpmManualDate", v);
    onDirty?.();
  };
  const handleIutLaneToggle = (laneKey: string) => {
    updateStep2("iutLanes", { ...iutLanes, [laneKey]: !iutLanes[laneKey] });
    onDirty?.();
  };
  const handleContractLeadTimeChange = (
    laneKey: string,
    value: string,
  ) => {
    updateStep2("contractLeadTimes", { ...contractLeadTimes, [laneKey]: value });
    onDirty?.();
  };
  const handleBatchThresholdChange = (
    materialCode: string,
    value: string,
  ) => {
    updateStep2("batchThresholds", { ...batchThresholds, [materialCode]: value });
    onDirty?.();
  };
  const handleBatchToggle = (batchKey: string) => {
    updateStep2("selectedBatches", { ...selectedBatches, [batchKey]: !(selectedBatches[batchKey] ?? true) });
    onDirty?.();
  };

  const handleMaterialScopeToggle = (materialCode: string) => {
    updateStep2("materialScopeSelected", { ...materialScopeSelected, [materialCode]: !materialScopeSelected[materialCode] });
    onDirty?.();
  };
  const handleMoqBreakToggle = (key: string, next: boolean) => {
    updateStep2("moqBreak", { ...moqBreak, [key]: next });
    onDirty?.();
  };
  const handleSupplierInventoryChange = (materialCode: string, value: string) => {
    updateStep2("supplierInventoryInputs", { ...supplierInventoryInputs, [materialCode]: value });
    onDirty?.();
  };
  const handleFeedstockChange = (materialCode: string, value: string) => {
    updateStep2("feedstockInputs", { ...feedstockInputs, [materialCode]: value });
    onDirty?.();
  };
  const handleCustomInputsSave = () => {
    if (isSavingCustomInputs) return;
    setIsSavingCustomInputs(true);
    window.setTimeout(() => {
      setIsSavingCustomInputs(false);
      updateStep2("customInputsSaved", true);
      onDirty?.();
      setOpenModal(null);
    }, CUSTOM_INPUTS_SAVE_DELAY_MS);
  };

  const iutPossibleCount = catalog.iutTransferLanes.filter(
    (lane) => iutLanes[`${lane.from}→${lane.to}`],
  ).length;
  const iutTotalLanes = catalog.iutTransferLanes.length;
  const materialScopeSelectedCount = catalog.materialScopeData.filter((material) => materialScopeSelected[material.materialCode]).length;
  const materialScopeTotal = catalog.materialScopeData.length;
  // Counted per supplier, not per material — the tile summary reflects how many
  // individual material/supplier pairs can break MOQ.
  const moqSupplierKeys = useMemo(
    () =>
      catalog.moqBreakMaterials.flatMap((mat) =>
        (catalog.moqBreakSuppliers[mat.code] ?? []).map((s) => moqSupplierKey(mat.code, s.name)),
      ),
    [catalog.moqBreakMaterials, catalog.moqBreakSuppliers],
  );
  const moqBreakCount = moqSupplierKeys.filter((key) => moqBreak[key]).length;
  const moqTotalSuppliers = moqSupplierKeys.length;

  const iutSubtitle = newCbuRow
    ? `Plant-to-plant lane availability. Old CBU ${oldCbuRow.cbuCode} - New CBU ${newCbuRow.cbuCode}`
    : `Plant-to-plant lane availability. Old CBU ${oldCbuRow.cbuCode}`;

  // How many of the PO lines are currently included in the simulation.
  const openPoIncludedCount = useMemo(
    () => catalog.openPoLines.filter((l) => poIncludedByLine[l.id]).length,
    [catalog.openPoLines, poIncludedByLine],
  );
  const openPoRmCount = useMemo(() => catalog.openPoLines.filter((l) => l.type === "RM").length, [catalog.openPoLines]);
  const openPoPmCount = useMemo(() => catalog.openPoLines.filter((l) => l.type === "PM").length, [catalog.openPoLines]);
  const openPoSubtitle = `${openPoIncludedCount} of ${catalog.openPoLines.length} included — ${openPoRmCount} RM · ${openPoPmCount} PM`;

  // Surfaces the modal's delivery-date/ageing data on the tile itself: an overdue PO is the
  // most actionable thing to flag at a glance, so it takes priority over the nearest upcoming
  // delivery date whenever any line is past due.
  const openPoOverdueCount = useMemo(
    () => catalog.openPoLines.filter((l) => daysPastDue(l.poDeliveryDate) != null).length,
    [catalog.openPoLines],
  );
  const openPoNearestDeliveryDate = useMemo(
    () =>
      catalog.openPoLines.length === 0
        ? ""
        : catalog.openPoLines.reduce((nearest, l) => (l.poDeliveryDate < nearest ? l.poDeliveryDate : nearest), catalog.openPoLines[0].poDeliveryDate),
    [catalog.openPoLines],
  );

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const newCbuOpenPoLines = useMemo(
    () => (newCbuRow ? buildOpenPoLinesForCbu(newCbuRow) : []),
    [newCbuRow],
  );
  // Driven entirely by the selected New CBU's own open-PO data — not a
  // manual toggle, so switching CBUs in Step 1 flips this automatically.
  const rmpmStatus = useMemo(
    () => (newCbuRow ? getRmpmConnectivityStatus(newCbuRow, newCbuOpenPoLines) : "po_available"),
    [newCbuRow, newCbuOpenPoLines],
  );

  // New CBU is single-select in Step 1, so this is always 0 or 1 — computed
  // rather than hardcoded so the subtitle stays correct if that ever changes.
  const newCbuCount = newCbuRow ? 1 : 0;
  const rmpmSubtitle = newCbuRow
    ? `${newCbuCount} new CBU (${newCbuRow.cbuCode}) - material delivery date`
    : "New CBU material delivery date";

  // BOM exists but the PO doesn't yet (contract or PO creation pending) — these two get
  // their own popup with BOM details, unlike "no CBU" / "BOM not available" which stay inline.
  const rmpmBomPendingStatus: RmpmBomPendingStatus | null =
    newCbuRow && (rmpmStatus === "contract_pending" || rmpmStatus === "po_creation_pending") ? rmpmStatus : null;

  // Seed the custom-overrides form with every plant from the baseline the moment real baseline
  // data becomes available — most CBUs have no curated baseline at all (see
  // customOverridesUtils), so this usually only fires later, if the user switches to a New CBU
  // that does. Skipped once the user has actually customised something, so it never clobbers
  // their edits.
  useEffect(() => {
    if (customInputsBaseline.length === 0 || customPlants.length > 0 || customRows.length > 0) return;
    const seed = buildBaselineScenario(customInputsBaseline);
    updateStep2("customPlants", seed.plants);
    updateStep2("customRows", seed.rows);
    updateStep2("customProductionPlan", seed.productionPlan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customInputsBaseline, customPlants.length, customRows.length]);

  const isLoadingAssumptions = assumptionsQuery.isLoading;
  const isAssumptionsError = assumptionsQuery.isError;

  return (
    <StepSection
      step={2}
      title="Simulation Assumptions"
      subtitle="Configure assumptions before running scenarios."
    >
      {isLoadingAssumptions ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16">
          <Loader2 size={20} className="animate-spin" style={{ color: C.blue }} />
          <p className="text-sm" style={{ color: C.muted }}>Loading simulation assumptions…</p>
        </div>
      ) : isAssumptionsError ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16">
          <AlertTriangle size={20} style={{ color: C.danger }} />
          <p className="text-sm" style={{ color: C.muted }}>Could not load simulation assumptions.</p>
        </div>
      ) : (
      <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 items-stretch">
         <AssumptionTile
          icon={<ListChecks size={16} style={{ color: C.blue }} />}
          title="Material scope identification"
          subtitle="Materials included in the simulation scope"
          summary={<span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={countPillStyle(materialScopeSelectedCount, materialScopeTotal)}>
            {materialScopeSelectedCount} of {materialScopeTotal} selected
          </span>}
          onClick={() => setOpenModal("materialScope")}
        />

        <DateAssumptionTile
          value={networkTransitionDate}
          onChange={handleNetworkTransitionDate}
          min={todayIso}
        />

        <AssumptionTile
          icon={<ShoppingCart size={16} style={{ color: C.blue }} />}
          title="Open PO Cancellation"
          subtitle={openPoSubtitle}
          summary={
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={
                openPoOverdueCount > 0
                  ? { backgroundColor: C.dangerBg, color: C.dangerDark }
                  : { backgroundColor: C.successBg, color: C.successText }
              }
            >
              {openPoOverdueCount > 0
                ? `${openPoOverdueCount} PO${openPoOverdueCount === 1 ? "" : "s"} overdue`
                : `Next: ${formatIsoDateShort(openPoNearestDeliveryDate)}`}
            </span>
          }
          onClick={() => setOpenModal("openpo")}
        />

        {newCbuRow && rmpmStatus === "po_available" ? (
          <AssumptionTile
            icon={<Calendar size={16} style={{ color: C.blue }} />}
            title="RMPM connectivity date"
            subtitle={rmpmSubtitle}
            summary={
              newCbuOpenPoLines.length > 1 ? (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: C.bgBlue, color: C.blue }}
                >
                  Multiple connectivity dates
                </span>
              ) : (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: C.successBg, color: C.successText }}
                >
                  {newCbuOpenPoLines[0].date}
                </span>
              )
            }
            onClick={() => setOpenModal("rmpm")}
          />
        ) : rmpmBomPendingStatus ? (
          <AssumptionTile
            icon={<Calendar size={16} style={{ color: C.blue }} />}
            title="RMPM connectivity date"
            subtitle={catalog.rmpmBomPendingTileLabel[rmpmBomPendingStatus]}
            summary={
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
                style={{ backgroundColor: C.warningBg, color: C.warningTextDark }}
              >
                {catalog.rmpmBomPendingLiesWith[rmpmBomPendingStatus]}
              </span>
            }
            onClick={() => setOpenModal("rmpm")}
          />
        ) : newCbuRow ? (
          <DateAssumptionTile
            icon={<Calendar size={16} style={{ color: C.blue }} />}
            title="RMPM connectivity date"
            subtitle={rmpmSubtitle}
            badge={
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
                style={{ backgroundColor: C.warningBg, color: C.warningTextDark }}
                title={catalog.rmpmConnectivityStatusMessage[rmpmStatus as Exclude<RmpmConnectivityStatus, "po_available">]}
              >
                {catalog.rmpmConnectivityStatusPillLabel[rmpmStatus as Exclude<RmpmConnectivityStatus, "po_available">]}
              </span>
            }
            value={rmpmDate}
            onChange={handleRmpmDate}
            min={todayIso}
          />
        ) : (
          <DateAssumptionTile
            icon={<Calendar size={16} style={{ color: C.blue }} />}
            title="RMPM connectivity date"
            subtitle={rmpmSubtitle}
            value={rmpmManualDate}
            onChange={handleRmpmManualDate}
            min={todayIso}
          />
        )}


        <AssumptionTile
          icon={<ArrowLeftRight size={16} style={{ color: C.blue }} />}
          title="IUT feasibility"
          subtitle={iutSubtitle}
          summary={
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={countPillStyle(iutPossibleCount, iutTotalLanes)}
            >
              {iutPossibleCount} of {iutTotalLanes} possible
            </span>
          }
          onClick={() => setOpenModal("iut")}
        />

        <AssumptionTile
          icon={<Box size={16} style={{ color: C.blue }} />}
          title="MOQ break possibility"
          subtitle="MOQ break eligibility by supplier"
          summary={
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={countPillStyle(moqBreakCount, moqTotalSuppliers)}
            >
              {moqBreakCount} of {moqTotalSuppliers} suppliers can break
            </span>
          }
          onClick={() => setOpenModal("moq")}
        />
        <AssumptionTile
          icon={<SlidersHorizontal size={16} style={{ color: C.blue }} />}
          title="Customise inputs"
          subtitle="Override plant & component-level values"
          summary={
            customInputsSaved ? (
              <div className="flex items-center gap-1.5">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: C.successBg, color: C.successText }}
                >
                  {customPlants.length} plant{customPlants.length === 1 ? "" : "s"} customised
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: C.bgBlue, color: C.blue }}
                >
                  View details
                </span>
              </div>
            ) : (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: C.bgSlate, color: C.muted }}
              >
                Not customised
              </span>
            )
          }
          onClick={() => setOpenModal("custom")}
        />

        <AssumptionTile
          icon={<Warehouse size={16} style={{ color: C.blue }} />}
          title="Supplier inventory & feedstock"
          subtitle="Inventory and feedstock held at the supplier"
          summary={
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: C.bgBlue, color: C.blue }}
            >
              {catalog.supplierInventoryFeedstockMaterials.length} materials
            </span>
          }
          onClick={() => setOpenModal("supplierInventory")}
        />
      </div>

      {openModal === "openpo" && (
        <Modal
          icon={<ShoppingCart size={17} className="text-white" />}
          title="Open PO Cancellation"
          subtitle={openPoSubtitle}
          onClose={() => setOpenModal(null)}
          maxWidth="min(98vw, 1520px)"
          maxHeight="88vh"
        >
          <OpenPoAssumptionsContent
            openPoLines={catalog.openPoLines}
            poIncludedByLine={poIncludedByLine}
            onSetLineIncluded={handleSetLineIncluded}
            onBulkSetIncluded={handleBulkSetIncluded}
          />
        </Modal>
      )}

      {openModal === "rmpm" && newCbuRow && rmpmStatus === "po_available" && (
        <Modal
          icon={<Calendar size={17} className="text-white" />}
          title="RMPM connectivity date"
          subtitle={rmpmSubtitle}
          onClose={() => setOpenModal(null)}
          maxWidth="min(98vw, 1520px)"
          maxHeight="88vh"
        >
          <RmpmConnectivityContent lines={newCbuOpenPoLines} />
        </Modal>
      )}

      {openModal === "rmpm" && newCbuRow && rmpmBomPendingStatus && (
        <Modal
          icon={<Calendar size={17} className="text-white" />}
          title={"RMPM connectivity date"}
          subtitle={catalog.rmpmBomPendingTileLabel[rmpmBomPendingStatus]}
          onClose={() => setOpenModal(null)}
          maxWidth="min(97vw, 1280px)"
          maxHeight="86vh"
        >
          <RmpmBomPendingContent
            rows={catalog.rmpmBomConnectivityRows}
            status={rmpmBomPendingStatus}
            rmpmBomPendingLiesWith={catalog.rmpmBomPendingLiesWith}
            rmpmConnectivityStatusMessage={catalog.rmpmConnectivityStatusMessage}
          />
        </Modal>
      )}

      {openModal === "materialScope" && (
        <Modal
          icon={<ListChecks size={17} className="text-white" />}
          title="Material scope identification"
          subtitle={`${materialScopeSelectedCount} of ${materialScopeTotal} selected`}
          onClose={() => setOpenModal(null)}
          maxWidth="min(96vw, 1040px)"
          maxHeight="86vh"
        >
          <MaterialScopeContent
            data={catalog.materialScopeData}
            selected={materialScopeSelected}
            onToggle={handleMaterialScopeToggle}
          />
        </Modal>
      )}

      {openModal === "iut" && (
        <Modal
          icon={<ArrowLeftRight size={17} className="text-white" />}
          title="IUT feasibility"
          subtitle={iutSubtitle}
          onClose={() => setOpenModal(null)}
          maxWidth="min(98vw, 1180px)"
          maxHeight="86vh"
        >
          <IutFeasibilityContent
            iutTransferLanes={catalog.iutTransferLanes}
            iutLaneRequirements={catalog.iutLaneRequirements}
            materialBatchData={catalog.materialBatchData}
            iutLanes={iutLanes}
            contractLeadTimes={contractLeadTimes}
            onContractLeadTimeChange={handleContractLeadTimeChange}
            onTogglePossible={handleIutLaneToggle}
            batchThresholds={batchThresholds}
            onBatchThresholdChange={handleBatchThresholdChange}
            selectedBatches={selectedBatches}
            onBatchToggle={handleBatchToggle}
          />
        </Modal>
      )}

      {openModal === "moq" && (
        <Modal
          icon={<Box size={17} className="text-white" />}
          title="MOQ break possibility"
          subtitle="MOQ break eligibility by material"
          onClose={() => setOpenModal(null)}
          maxWidth="min(96vw, 1040px)"
          maxHeight="86vh"
        >
          <MoqBreakContent
            moqBreakMaterials={catalog.moqBreakMaterials}
            moqBreakSuppliers={catalog.moqBreakSuppliers}
            moqBreak={moqBreak}
            onToggleBreak={handleMoqBreakToggle}
          />
        </Modal>
      )}
      {openModal === "custom" && (
        <Modal
          icon={<SlidersHorizontal size={17} className="text-white" />}
          title="Customise inputs"
          subtitle="Override plant & component-level values"
          onClose={() => setOpenModal(null)}
          maxWidth="min(98vw, 1520px)"
          maxHeight="92vh"
          footer={null}
        >
          {isSavingCustomInputs ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16">
              <Loader2 size={20} className="animate-spin" style={{ color: C.blue }} />
              <p className="text-sm" style={{ color: C.muted }}>Saving custom inputs…</p>
            </div>
          ) : (
            <CustomOverridesForm
              rows={customRows}
              onRowsChange={(rows) => updateStep2("customRows", rows)}
              plants={customPlants}
              onPlantsChange={(plants) => updateStep2("customPlants", plants)}
              fgUnits={customFgUnits}
              onFgUnitsChange={(fgUnits) => updateStep2("customFgUnits", fgUnits)}
              productionPlan={customProductionPlan}
              onProductionPlanChange={(plan) => updateStep2("customProductionPlan", plan)}
              baseline={customInputsBaseline}
              onRun={handleCustomInputsSave}
              computed={customInputsSaved}
              submitLabel="Save"
              hideTitle
              plantLevelKeys={["productionPlan"]}
              componentMetricKeys={["onHandStock", "openPOQty", "supplierStock", "supplierFeedStock", "inTransitStock", "stvStock"]}
            />
          )}
        </Modal>
      )}

      {openModal === "supplierInventory" && (
        <Modal
          icon={<Warehouse size={17} className="text-white" />}
          title="Supplier inventory & feedstock"
          subtitle="Inventory and feedstock held at the supplier"
          onClose={() => setOpenModal(null)}
          maxWidth="min(96vw, 1040px)"
          maxHeight="86vh"
        >
          <SupplierInventoryFeedstockContent
            materials={catalog.supplierInventoryFeedstockMaterials}
            supplierInventory={supplierInventoryInputs}
            onSupplierInventoryChange={handleSupplierInventoryChange}
            feedstock={feedstockInputs}
            onFeedstockChange={handleFeedstockChange}
          />
        </Modal>
      )}
      </>
      )}
    </StepSection>
  );
}
