import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  IUT_TRANSFER_OPTIONS,
  MOQ_PLANT_OPTIONS,
} from "../../components/sciDetails/constants";
import type { CustomOverrideRow, PlantGroup, ScenarioRow } from "../../components/sciDetails/types";
import type { ScenarioDetailSnapshot } from "../../components/networkDownStockingSimulator/step3/ScenarioDetailPrimitives";

/** Step 3's saved custom scenarios — the "Create New Scenario" drawer's output. Kept in the
 * store (not component state) for the same survive-a-remount reason as everything else here. */
export type SciDetailCustomScenarios = ScenarioRow[];
export type SciDetailCustomScenarioSnapshots = Record<string, ScenarioDetailSnapshot>;

/** Every Step 2 (Simulation Assumptions) input the planner can set for the current CBU —
 * lives in the store (not component state) so it survives leaving the Network Down Stocking
 * Simulator page and coming back, instead of resetting on remount like plain local state would.
 * `null` until `initStep2` seeds it with CBU-derived defaults on first render for this CBU. */
export interface SciDetailStep2State {
  networkTransitionDate: string;
  poIncludedByLine: Record<string, boolean>;
  rmpmDate: string;
  rmpmManualDate: string;
  moqBreak: Record<string, boolean>;
  batchThresholds: Record<string, string>;
  selectedBatches: Record<string, boolean>;
  iutLanes: Record<string, boolean>;
  contractLeadTimes: Record<string, string>;
  materialScopeSelected: Record<string, boolean>;
  customPlants: PlantGroup[];
  customRows: CustomOverrideRow[];
  customFgUnits: Record<string, string>;
  customProductionPlan: Record<string, string>;
  customInputsSaved: boolean;
  supplierInventoryInputs: Record<string, string>;
  feedstockInputs: Record<string, string>;
}

type Step2FieldPatch = {
  [K in keyof SciDetailStep2State]: { key: K; value: SciDetailStep2State[K] };
}[keyof SciDetailStep2State];

export interface SciDetailState {
  newCbuSrNo: number | null;
  projectName: string;
  acceptedId: string | null;
  hasChanges: boolean;
  lastSavedAt: string | null;
  selTransfer: string;
  moqSuppliers: Record<string, string>;
  /** Step 3 gate — whether "Generate Scenario" has been run. Lives in the
   * store (not component state) so it survives navigating away to Actions &
   * Monitoring and back. */
  scenariosGenerated: boolean;
  /** The scenario formally Accepted (not just selected/highlighted) — drives
   * the "Accepted · View Details" state on return from Actions & Monitoring. */
  finalAcceptedId: string | null;
  /** Step 1's Old/New CBU multi-selects — kept in the store for the same reason as everything
   * else here: the page fully remounts on any nav away and back, and plain component state
   * can't survive that. */
  selectedOldSrNos: number[];
  selectedNewSrNos: number[];
  selectedDraftId: string;
  step2: SciDetailStep2State | null;
  /** Step 3's saved custom scenarios (via "Create New Scenario"), and their frozen
   * "More Details" breakdowns keyed by scenario id. */
  customScenarios: SciDetailCustomScenarios;
  customScenarioSnapshots: SciDetailCustomScenarioSnapshots;
  /** The (Old CBU) srNo all of the above state currently belongs to — lets the page tell a
   * genuine CBU switch (reset everything) apart from simply revisiting the same CBU (keep
   * showing whatever was last entered), regardless of which link brought the user back. */
  activeSrNo: number | null;
}

const DEFAULT_SEL_TRANSFER =
  IUT_TRANSFER_OPTIONS.find((o) => o.isBest)?.id ?? IUT_TRANSFER_OPTIONS[0].id;
const DEFAULT_MOQ_SUPPLIERS: Record<string, string> = Object.fromEntries(
  MOQ_PLANT_OPTIONS.map((p) => [p.id, p.suppliers[0].id]),
);

const initialState: SciDetailState = {
  newCbuSrNo: null,
  projectName: "",
  acceptedId: null,
  hasChanges: false,
  lastSavedAt: null,
  selTransfer: DEFAULT_SEL_TRANSFER,
  moqSuppliers: DEFAULT_MOQ_SUPPLIERS,
  scenariosGenerated: false,
  finalAcceptedId: null,
  selectedOldSrNos: [],
  selectedNewSrNos: [],
  selectedDraftId: "",
  step2: null,
  customScenarios: [],
  customScenarioSnapshots: {},
  activeSrNo: null,
};

const sciDetailSlice = createSlice({
  name: "sciDetail",
  initialState,
  reducers: {
    setNewCbuSrNo(state, action: PayloadAction<number | null>) {
      state.newCbuSrNo = action.payload;
      state.hasChanges = true;
    },
    setProjectName(state, action: PayloadAction<string>) {
      state.projectName = action.payload;
      state.hasChanges = true;
    },
    toggleAccepted(state, action: PayloadAction<string>) {
      state.acceptedId =
        state.acceptedId === action.payload ? null : action.payload;
      state.hasChanges = true;
    },
    setSelTransfer(state, action: PayloadAction<string>) {
      state.selTransfer = action.payload;
      state.hasChanges = true;
    },
    setMoqSupplier(
      state,
      action: PayloadAction<{ plantId: string; supplierId: string }>,
    ) {
      state.moqSuppliers[action.payload.plantId] = action.payload.supplierId;
      state.hasChanges = true;
    },
    markDirty(state) {
      state.hasChanges = true;
    },
    saveDraft(state) {
      state.hasChanges = false;
      state.lastSavedAt = new Date().toISOString();
    },
    setScenariosGenerated(state, action: PayloadAction<boolean>) {
      state.scenariosGenerated = action.payload;
    },
    setFinalAcceptedId(state, action: PayloadAction<string | null>) {
      state.finalAcceptedId = action.payload;
    },
    setSelectedOldSrNos(state, action: PayloadAction<number[]>) {
      state.selectedOldSrNos = action.payload;
      state.hasChanges = true;
    },
    setSelectedNewSrNos(state, action: PayloadAction<number[]>) {
      state.selectedNewSrNos = action.payload;
      state.hasChanges = true;
    },
    setSelectedDraftId(state, action: PayloadAction<string>) {
      state.selectedDraftId = action.payload;
      state.hasChanges = true;
    },
    /** Seeds Step 2 with its CBU-derived defaults — only dispatched once per CBU, when
     * `step2` is still null (see SimulationAssumptionsStep). */
    initStep2(state, action: PayloadAction<SciDetailStep2State>) {
      state.step2 = action.payload;
    },
    setStep2Field(state, action: PayloadAction<Step2FieldPatch>) {
      if (!state.step2) return;
      const { key, value } = action.payload;
      (state.step2 as Record<string, unknown>)[key] = value;
      state.hasChanges = true;
    },
    setCustomScenarios(state, action: PayloadAction<SciDetailCustomScenarios>) {
      state.customScenarios = action.payload;
      state.hasChanges = true;
    },
    setCustomScenarioSnapshots(state, action: PayloadAction<SciDetailCustomScenarioSnapshots>) {
      state.customScenarioSnapshots = action.payload;
      state.hasChanges = true;
    },
    /** Fires whenever the active (Old CBU) srNo actually changes — a genuine CBU switch, whether
     * that came from picking a different CBU in Step 1 or arriving fresh with a different srNo
     * from National Dashboard/Sidebar. Revisiting the *same* CBU (from any entry point) should
     * never hit this, so everything entered for it stays visible — see NetworkDownStockingSimulator.
     * Also fires whenever the Old CBU multi-select itself hands back a new primary — picking "All",
     * removing the current primary while others stay picked, or bulk-applying CBUs picked in the
     * Create Project modal — and in every one of those cases `setSelectedOldSrNos`/
     * `setSelectedNewSrNos` have already landed the caller's intended next lists by the time this
     * runs. So only fall back to `[srNo]` (and drop the New CBU pairing) when srNo isn't already
     * part of the tracked Old CBU list; otherwise this would wipe selections that were just made
     * together with this primary switch, in the same action. */
    resetOnCbuChange(state, action: PayloadAction<{ srNo: number | null }>) {
      const srNo = action.payload.srNo;
      const srNoAlreadyTracked = srNo != null && state.selectedOldSrNos.includes(srNo);

      state.activeSrNo = srNo;
      state.acceptedId = null;
      state.hasChanges = false;
      state.lastSavedAt = null;
      state.scenariosGenerated = false;
      state.finalAcceptedId = null;
      if (!srNoAlreadyTracked) {
        state.selectedOldSrNos = srNo != null ? [srNo] : [];
        state.newCbuSrNo = null;
        state.selectedNewSrNos = [];
      }
      state.selectedDraftId = "";
      state.step2 = null;
      state.customScenarios = [];
      state.customScenarioSnapshots = {};
    },
  },
});

export const {
  setNewCbuSrNo,
  setProjectName,
  toggleAccepted,
  setSelTransfer,
  setMoqSupplier,
  markDirty,
  saveDraft,
  setScenariosGenerated,
  setFinalAcceptedId,
  setSelectedOldSrNos,
  setSelectedNewSrNos,
  setSelectedDraftId,
  initStep2,
  setStep2Field,
  setCustomScenarios,
  setCustomScenarioSnapshots,
  resetOnCbuChange,
} = sciDetailSlice.actions;

export default sciDetailSlice.reducer;
