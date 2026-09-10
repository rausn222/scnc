import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Box, Calendar, ListChecks, Loader2, ShoppingCart, SlidersHorizontal, Warehouse } from "lucide-react";
import { PLANT_OWNERSHIP_MAP, type CBURow } from "../../data";
import { StepSection } from "../StepSection";
import {
  C,
  IUT_TRANSFER_LANES,
  MOQ_BREAK_MATERIALS,
  MOQ_BREAK_SUPPLIERS,
  OPEN_PO_LINES,
  RMPM_BOM_CONNECTIVITY_ROWS,
  RMPM_BOM_PENDING_LIES_WITH,
  RMPM_BOM_PENDING_TILE_LABEL,
  RMPM_CONNECTIVITY_STATUS_MESSAGE,
  RMPM_CONNECTIVITY_STATUS_PILL_LABEL,
  SUPPLIER_INVENTORY_FEEDSTOCK_MATERIALS,
  moqSupplierKey,
  type RmpmBomPendingStatus,
  type RmpmConnectivityStatus,
} from "../../sciDetails/constants";
import { buildOpenPoLinesForCbu, daysPastDue, formatIsoDateShort, getRmpmConnectivityStatus } from "../../sciDetails/utils";
import type { CustomOverrideRow, PlantGroup } from "../../sciDetails/types";
import { CustomOverridesForm } from "../../sciDetails/customOverrides/CustomOverridesForm";
import { buildBaselineScenario, buildCustomScenarioBaseline } from "../../sciDetails/customOverrides/customOverridesUtils";
import { DateAssumptionTile } from "./DateAssumptionTile";
import { AssumptionTile } from "./AssumptionTile";
import { Modal } from "../Modal";
import { OpenPoAssumptionsContent } from "./OpenPoAssumptionsContent";
import { RmpmConnectivityContent } from "./RmpmConnectivityContent";
import { RmpmBomPendingContent } from "./RmpmBomPendingContent";
import { IutFeasibilityContent, MATERIAL_BATCH_DATA, getMaterialBatchKey } from "./IutFeasibilityContent";
import { MoqBreakContent } from "./MoqBreakContent";
import MaterialScopeContent, { MATERIAL_SCOPE_DATA } from "./MaterialScopeContent";
import { SupplierInventoryFeedstockContent } from "./SupplierInventoryFeedstockContent";

type AssumptionModalKey = "openpo" | "rmpm" | "iut" | "moq" | "materialScope" | "custom" | "supplierInventory";

// Simulated save latency for "Customise inputs" — mirrors the loading pattern used by
// step3/ScenarioComparisonStep's handleGenerateScenarios, so a save reads as real work.
const CUSTOM_INPUTS_SAVE_DELAY_MS = 600;

function countPillStyle(count: number, total: number) {
  return {
    backgroundColor: count === total ? C.successBg : count === 0 ? C.bgSlate : C.warningBg,
    color: count === total ? C.successText : count === 0 ? C.muted : C.warningTextDark,
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
  const [networkTransitionDate, setNetworkTransitionDate] = useState("");
  const [poIncludedByLine, setPoIncludedByLine] = useState<Record<string, boolean>>(
    () => Object.fromEntries(OPEN_PO_LINES.map((l) => [l.id, false])),
  );
  const [rmpmDate, setRmpmDate] = useState("");
  // Manual RMPM connectivity date shown inline on the tile when no New CBU is selected —
  // there's no PO data to drive a modal in that case, so it skips straight to a date input.
  const [rmpmManualDate, setRmpmManualDate] = useState("");
  // Keyed by moqSupplierKey(materialCode, supplierName) — "can break MOQ" is tracked
  // per supplier, since it can differ supplier to supplier within a material.
  const [moqBreak, setMoqBreak] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      MOQ_BREAK_MATERIALS.flatMap((mat) =>
        (MOQ_BREAK_SUPPLIERS[mat.code] ?? []).map((s) => [moqSupplierKey(mat.code, s.name), false]),
      ),
    ),
  );
  // Shelf-life threshold defaults to 7 days for every material with batch data —
  // still freely editable per material from there.
  const initialBatchThresholds = Object.fromEntries(
    Array.from(new Set(MATERIAL_BATCH_DATA.map((row) => row.materialCode))).map((code) => [code, "7"]),
  );
  const [batchThresholds, setBatchThresholds] = useState<
    Record<string, string>
  >(initialBatchThresholds);
  const [selectedBatches, setSelectedBatches] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MATERIAL_BATCH_DATA.map((row) => [getMaterialBatchKey(row), true])),
  );

  const [iutLanes, setIutLanes] = useState<Record<string, boolean>>({
    "U535→UTR": true,
    "UTR→U535": true,
  });
  // Pre-IUT lead time defaults to 7 days when either endpoint plant is a 2P/3P
  // (third-party) site, else 4 days for a purely own-to-own transfer.
  const initialLeadTimes = Object.fromEntries(
    IUT_TRANSFER_LANES.map((lane) => {
      const involvesThirdParty =
        PLANT_OWNERSHIP_MAP[lane.from] === "2p3p" || PLANT_OWNERSHIP_MAP[lane.to] === "2p3p";
      return [`${lane.from}→${lane.to}`, involvesThirdParty ? "7" : "4"];
    })
  );

  const [contractLeadTimes, setContractLeadTimes] =
    useState<Record<string, string>>(initialLeadTimes);
  const [materialScopeSelected, setMaterialScopeSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MATERIAL_SCOPE_DATA.map((material) => [material.materialCode, !material.newCbuAssociated])),
  );
  // Lifted here (rather than inside the modal) so the customised inputs survive closing and
  // reopening the popup — the 6th tile needs to show them filled in again on reopen.
  const [customPlants, setCustomPlants] = useState<PlantGroup[]>([]);
  const [customRows, setCustomRows] = useState<CustomOverrideRow[]>([]);
  const [customFgUnits, setCustomFgUnits] = useState<Record<string, string>>({});
  const [customProductionPlan, setCustomProductionPlan] = useState<Record<string, string>>({});
  const [customInputsSaved, setCustomInputsSaved] = useState(false);
  const [isSavingCustomInputs, setIsSavingCustomInputs] = useState(false);
  const [openModal, setOpenModal] = useState<AssumptionModalKey | null>(null);

  // Supplier inventory pre-fills from OPEN_PO_LINES where a matching material exists —
  // feedstock has no such source, so it starts from the mock value on each material.
  const initialSupplierInventory = Object.fromEntries(
    SUPPLIER_INVENTORY_FEEDSTOCK_MATERIALS.map((material) => {
      const match = OPEN_PO_LINES.find((l) => l.componentCode === material.materialCode);
      return [material.materialCode, match ? String(match.supplierInventory) : ""];
    }),
  );
  const initialFeedstock = Object.fromEntries(
    SUPPLIER_INVENTORY_FEEDSTOCK_MATERIALS.map((material) => [material.materialCode, String(material.feedstock)]),
  );
  const [supplierInventoryInputs, setSupplierInventoryInputs] = useState<Record<string, string>>(initialSupplierInventory);
  const [feedstockInputs, setFeedstockInputs] = useState<Record<string, string>>(initialFeedstock);

  const handleNetworkTransitionDate = (v: string) => {
    setNetworkTransitionDate(v);
    onDirty?.();
  };
  const handleSetLineIncluded = (id: string, v: boolean) => {
    setPoIncludedByLine((prev) => ({ ...prev, [id]: v }));
    onDirty?.();
  };
  const handleBulkSetIncluded = (v: boolean) => {
    setPoIncludedByLine((prev) => {
      const next = { ...prev };
      OPEN_PO_LINES.forEach((l) => { next[l.id] = v; });
      return next;
    });
    onDirty?.();
  };
  const handleRmpmDate = (v: string) => {
    setRmpmDate(v);
    onDirty?.();
  };
  const handleRmpmManualDate = (v: string) => {
    setRmpmManualDate(v);
    onDirty?.();
  };
  const handleIutLaneToggle = (laneKey: string) => {
    setIutLanes((prev) => ({ ...prev, [laneKey]: !prev[laneKey] }));
    onDirty?.();
  };
  const handleContractLeadTimeChange = (
    laneKey: string,
    value: string,
  ) => {
    setContractLeadTimes((prev) => ({
      ...prev,
      [laneKey]: value,
    }));

    onDirty?.();
  };
  const handleBatchThresholdChange = (
    materialCode: string,
    value: string,
  ) => {
    setBatchThresholds((previous) => ({
      ...previous,
      [materialCode]: value,
    }));

    onDirty?.();
  };
  const handleBatchToggle = (batchKey: string) => {
    setSelectedBatches((prev) => ({ ...prev, [batchKey]: !(prev[batchKey] ?? true) }));
    onDirty?.();
  };

  const handleMaterialScopeToggle = (materialCode: string) => {
    setMaterialScopeSelected((prev) => ({ ...prev, [materialCode]: !prev[materialCode] }));
    onDirty?.();
  };
  const handleMoqBreakToggle = (key: string, next: boolean) => {
    setMoqBreak((prev) => ({ ...prev, [key]: next }));
    onDirty?.();
  };
  const handleSupplierInventoryChange = (materialCode: string, value: string) => {
    setSupplierInventoryInputs((prev) => ({ ...prev, [materialCode]: value }));
    onDirty?.();
  };
  const handleFeedstockChange = (materialCode: string, value: string) => {
    setFeedstockInputs((prev) => ({ ...prev, [materialCode]: value }));
    onDirty?.();
  };
  const handleCustomInputsSave = () => {
    if (isSavingCustomInputs) return;
    setIsSavingCustomInputs(true);
    window.setTimeout(() => {
      setIsSavingCustomInputs(false);
      setCustomInputsSaved(true);
      onDirty?.();
      setOpenModal(null);
    }, CUSTOM_INPUTS_SAVE_DELAY_MS);
  };

  const iutPossibleCount = IUT_TRANSFER_LANES.filter(
    (lane) => iutLanes[`${lane.from}→${lane.to}`],
  ).length;
  const iutTotalLanes = IUT_TRANSFER_LANES.length;
  const materialScopeSelectedCount = MATERIAL_SCOPE_DATA.filter((material) => materialScopeSelected[material.materialCode]).length;
  const materialScopeTotal = MATERIAL_SCOPE_DATA.length;
  // Counted per supplier, not per material — the tile summary reflects how many
  // individual material/supplier pairs can break MOQ.
  const moqSupplierKeys = useMemo(
    () =>
      MOQ_BREAK_MATERIALS.flatMap((mat) =>
        (MOQ_BREAK_SUPPLIERS[mat.code] ?? []).map((s) => moqSupplierKey(mat.code, s.name)),
      ),
    [],
  );
  const moqBreakCount = moqSupplierKeys.filter((key) => moqBreak[key]).length;
  const moqTotalSuppliers = moqSupplierKeys.length;

  const iutSubtitle = newCbuRow
    ? `Plant-to-plant lane availability. Old CBU ${oldCbuRow.cbuCode} - New CBU ${newCbuRow.cbuCode}`
    : `Plant-to-plant lane availability. Old CBU ${oldCbuRow.cbuCode}`;

  // How many of the PO lines are currently included in the simulation.
  const openPoIncludedCount = useMemo(
    () => OPEN_PO_LINES.filter((l) => poIncludedByLine[l.id]).length,
    [poIncludedByLine],
  );
  const openPoRmCount = useMemo(() => OPEN_PO_LINES.filter((l) => l.type === "RM").length, []);
  const openPoPmCount = useMemo(() => OPEN_PO_LINES.filter((l) => l.type === "PM").length, []);
  const openPoSubtitle = `${openPoIncludedCount} of ${OPEN_PO_LINES.length} included — ${openPoRmCount} RM · ${openPoPmCount} PM`;

  // Surfaces the modal's delivery-date/ageing data on the tile itself: an overdue PO is the
  // most actionable thing to flag at a glance, so it takes priority over the nearest upcoming
  // delivery date whenever any line is past due.
  const openPoOverdueCount = useMemo(
    () => OPEN_PO_LINES.filter((l) => daysPastDue(l.poDeliveryDate) != null).length,
    [],
  );
  const openPoNearestDeliveryDate = useMemo(
    () => OPEN_PO_LINES.reduce((nearest, l) => (l.poDeliveryDate < nearest ? l.poDeliveryDate : nearest), OPEN_PO_LINES[0].poDeliveryDate),
    [],
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

  // New CBU is optional ("Old CBU required · New CBU optional" — see SelectCbuStep) — most
  // scenarios never pick one. Customise Inputs still needs a CBU's BOM to seed from, so it
  // falls back to the Old CBU whenever no New CBU is selected, instead of showing nothing.
  const customInputsSourceRow = newCbuRow ?? oldCbuRow;
  const customInputsBaseline = useMemo(
    () => buildCustomScenarioBaseline(customInputsSourceRow),
    [customInputsSourceRow],
  );
  // Seed the custom-overrides form with every plant from the baseline by default — the
  // user can still remove/edit plants from there, but shouldn't have to click "Load all
  // plants" themselves just to see the starting values. Skipped once the user has actually
  // customised something, so it never clobbers their edits.
  useEffect(() => {
    if (customInputsBaseline.length === 0 || customPlants.length > 0 || customRows.length > 0) return;
    const seed = buildBaselineScenario(customInputsBaseline);
    setCustomPlants(seed.plants);
    setCustomRows(seed.rows);
    setCustomProductionPlan(seed.productionPlan);
  }, [customInputsBaseline, customPlants.length, customRows.length]);

  return (
    <StepSection
      step={2}
      title="Simulation Assumptions"
      subtitle="Configure assumptions before running scenarios."
    >
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
            subtitle={RMPM_BOM_PENDING_TILE_LABEL[rmpmBomPendingStatus]}
            summary={
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
                style={{ backgroundColor: C.warningBg, color: C.warningTextDark }}
              >
                {RMPM_BOM_PENDING_LIES_WITH[rmpmBomPendingStatus]}
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
                title={RMPM_CONNECTIVITY_STATUS_MESSAGE[rmpmStatus as Exclude<RmpmConnectivityStatus, "po_available">]}
              >
                {RMPM_CONNECTIVITY_STATUS_PILL_LABEL[rmpmStatus as Exclude<RmpmConnectivityStatus, "po_available">]}
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
              {SUPPLIER_INVENTORY_FEEDSTOCK_MATERIALS.length} materials
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
          subtitle={RMPM_BOM_PENDING_TILE_LABEL[rmpmBomPendingStatus]}
          onClose={() => setOpenModal(null)}
          maxWidth="min(97vw, 1280px)"
          maxHeight="86vh"
        >
          <RmpmBomPendingContent
            rows={RMPM_BOM_CONNECTIVITY_ROWS}
            status={rmpmBomPendingStatus}
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
              onRowsChange={setCustomRows}
              plants={customPlants}
              onPlantsChange={setCustomPlants}
              fgUnits={customFgUnits}
              onFgUnitsChange={setCustomFgUnits}
              productionPlan={customProductionPlan}
              onProductionPlanChange={setCustomProductionPlan}
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
            supplierInventory={supplierInventoryInputs}
            onSupplierInventoryChange={handleSupplierInventoryChange}
            feedstock={feedstockInputs}
            onFeedstockChange={handleFeedstockChange}
          />
        </Modal>
      )}
    </StepSection>
  );
}
