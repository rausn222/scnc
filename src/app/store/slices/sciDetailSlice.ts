import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  IUT_TRANSFER_OPTIONS,
  MOQ_PLANT_OPTIONS,
} from "../../components/sciDetails/constants";

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
    resetOnCbuChange(state) {
      state.newCbuSrNo = null;
      state.acceptedId = null;
      state.hasChanges = false;
      state.lastSavedAt = null;
      state.scenariosGenerated = false;
      state.finalAcceptedId = null;
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
  resetOnCbuChange,
} = sciDetailSlice.actions;

export default sciDetailSlice.reducer;
