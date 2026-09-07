import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Box, Calendar, ShoppingCart, SlidersHorizontal } from "lucide-react";
import type { CBURow } from "../../data";
import { StepSection } from "../StepSection";
import {
  C,
  IUT_TRANSFER_LANES,
  MOQ_BREAK_MATERIALS,
  MOQ_BREAK_SUPPLIERS,
  OPEN_PO_CANCELLABLE_LINES,
  OPEN_PO_LINES,
  RMPM_BOM_PENDING_LIES_WITH,
  RMPM_BOM_PENDING_TILE_LABEL,
  RMPM_CONNECTIVITY_STATUS_MESSAGE,
  RMPM_CONNECTIVITY_STATUS_PILL_LABEL,
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
import { IutFeasibilityContent } from "./IutFeasibilityContent";
import { MoqBreakContent } from "./MoqBreakContent";

type AssumptionModalKey = "openpo" | "rmpm" | "iut" | "moq" | "custom";

function countPillStyle(count: number, total: number) {
  return {
    backgroundColor: count === total ? "#dcfce7" : count === 0 ? "#f1f5f9" : "#fef3c7",
    color: count === total ? "#166534" : count === 0 ? "#64748b" : "#92400e",
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
  const [openPoCancel, setOpenPoCancel] = useState(false);
  const [poIncludedByLine, setPoIncludedByLine] = useState<Record<string, boolean>>(
    () => Object.fromEntries(OPEN_PO_CANCELLABLE_LINES.map((l) => [l.id, true])),
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
  const [iutLanes, setIutLanes] = useState<Record<string, boolean>>({
    "U535→UTR": true,
    "UTR→U535": true,
  });
  // Lifted here (rather than inside the modal) so the customised inputs survive closing and
  // reopening the popup — the 6th tile needs to show them filled in again on reopen.
  const [customPlants, setCustomPlants] = useState<PlantGroup[]>([]);
  const [customRows, setCustomRows] = useState<CustomOverrideRow[]>([]);
  const [customFgUnits, setCustomFgUnits] = useState<Record<string, string>>({});
  const [customProductionPlan, setCustomProductionPlan] = useState<Record<string, string>>({});
  const [customInputsSaved, setCustomInputsSaved] = useState(false);
  const [openModal, setOpenModal] = useState<AssumptionModalKey | null>(null);

  const handleNetworkTransitionDate = (v: string) => {
    setNetworkTransitionDate(v);
    onDirty?.();
  };
  const handleOpenPoCancel = (v: boolean) => {
    setOpenPoCancel(v);
    onDirty?.();
  };
  const handleSetLineIncluded = (id: string, v: boolean) => {
    setPoIncludedByLine((prev) => ({ ...prev, [id]: v }));
    onDirty?.();
  };
  const handleBulkSetIncluded = (v: boolean) => {
    setPoIncludedByLine((prev) => {
      const next = { ...prev };
      OPEN_PO_CANCELLABLE_LINES.forEach((l) => { next[l.id] = v; });
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
  const handleMoqBreakToggle = (key: string, next: boolean) => {
    setMoqBreak((prev) => ({ ...prev, [key]: next }));
    onDirty?.();
  };
  const handleCustomInputsSave = () => {
    setCustomInputsSaved(true);
    onDirty?.();
    setOpenModal(null);
  };

  const iutPossibleCount = IUT_TRANSFER_LANES.filter(
    (lane) => iutLanes[`${lane.from}→${lane.to}`],
  ).length;
  const iutTotalLanes = IUT_TRANSFER_LANES.length;
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

  // How many of the PO lines are currently included in the simulation (cancelling some
  // cancellable lines excludes them from this count).
  const openPoIncludedCount = useMemo(() => {
    const cancellableIds = new Set(OPEN_PO_CANCELLABLE_LINES.map((l) => l.id));
    return OPEN_PO_LINES.filter((l) => !cancellableIds.has(l.id) || !openPoCancel || poIncludedByLine[l.id]).length;
  }, [openPoCancel, poIncludedByLine]);
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

  const rmpmSubtitle = newCbuRow
    ? `New CBU -${newCbuRow.cbuCode} - material delivery date`
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
        <DateAssumptionTile
          value={networkTransitionDate}
          onChange={handleNetworkTransitionDate}
          min={todayIso}
        />

        <AssumptionTile
          icon={<ShoppingCart size={16} style={{ color: C.blue }} />}
          title="Open PO"
          subtitle={openPoSubtitle}
          summary={
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={
                openPoOverdueCount > 0
                  ? { backgroundColor: "#fee2e2", color: "#b91c1c" }
                  : { backgroundColor: "#dcfce7", color: "#166534" }
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
                  style={{ backgroundColor: "#dcfce7", color: "#166534" }}
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
            title={RMPM_BOM_PENDING_TILE_LABEL[rmpmBomPendingStatus]}
            subtitle={rmpmSubtitle}
            summary={
              rmpmDate ? (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: "#dcfce7", color: "#166534" }}
                >
                  {formatIsoDateShort(rmpmDate)}
                </span>
              ) : (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
                  style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
                >
                  {RMPM_BOM_PENDING_LIES_WITH[rmpmBomPendingStatus]}
                </span>
              )
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
                style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
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
                  style={{ backgroundColor: "#dcfce7", color: "#166534" }}
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
                style={{ backgroundColor: "#f1f5f9", color: "#64748b" }}
              >
                Not customised
              </span>
            )
          }
          onClick={() => setOpenModal("custom")}
        />
      </div>

      {openModal === "openpo" && (
        <Modal
          icon={<ShoppingCart size={17} className="text-white" />}
          title="Open PO"
          subtitle={openPoSubtitle}
          onClose={() => setOpenModal(null)}
          maxWidth="min(98vw, 1520px)"
          maxHeight="88vh"
        >
          <OpenPoAssumptionsContent
            openPoCancel={openPoCancel}
            poIncludedByLine={poIncludedByLine}
            onToggleCancel={handleOpenPoCancel}
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
          title={RMPM_BOM_PENDING_TILE_LABEL[rmpmBomPendingStatus]}
          subtitle={rmpmSubtitle}
          onClose={() => setOpenModal(null)}
          maxWidth="min(94vw, 760px)"
          maxHeight="86vh"
        >
          <RmpmBomPendingContent
            newCbuRow={newCbuRow}
            status={rmpmBomPendingStatus}
            date={rmpmDate}
            onDateChange={handleRmpmDate}
          />
        </Modal>
      )}

      {openModal === "iut" && (
        <Modal
          icon={<ArrowLeftRight size={17} className="text-white" />}
          title="IUT feasibility"
          subtitle={iutSubtitle}
          onClose={() => setOpenModal(null)}
          maxWidth="min(96vw, 980px)"
          maxHeight="86vh"
        >
          <IutFeasibilityContent
            iutLanes={iutLanes}
            onTogglePossible={handleIutLaneToggle}
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
            componentMetricKeys={["onHandStock", "openPOQty", "supplierStock", "inTransitStock", "stvStock"]}
          />
        </Modal>
      )}
    </StepSection>
  );
}
