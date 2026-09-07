import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  StockViewLevel,
  UomFilter,
} from "../../components/cbuDetails/types";
import { DEFAULT_HIDDEN_STOCK_COLS } from "../../constants/cbuDetail";

export interface CbuDetailState {
  uom: UomFilter;
  stockView: StockViewLevel;
  expandedComponents: string[];
  expandedCluster: string | null;
  hiddenStockCols: string[];
}

const initialState: CbuDetailState = {
  uom: "EA",
  stockView: "plant",
  expandedComponents: [],
  expandedCluster: null,
  hiddenStockCols: DEFAULT_HIDDEN_STOCK_COLS,
};

const cbuDetailSlice = createSlice({
  name: "cbuDetail",
  initialState,
  reducers: {
    setUom(state, action: PayloadAction<UomFilter>) {
      state.uom = action.payload;
    },
    setStockView(state, action: PayloadAction<StockViewLevel>) {
      state.stockView = action.payload;
      if (action.payload === "plant") state.expandedCluster = null;
    },
    setExpandedComponents(state, action: PayloadAction<string[]>) {
      state.expandedComponents = action.payload;
    },
    toggleComponentExpanded(state, action: PayloadAction<string>) {
      const set = new Set(state.expandedComponents);
      set.has(action.payload) ? set.delete(action.payload) : set.add(action.payload);
      state.expandedComponents = Array.from(set);
    },
    toggleExpandedCluster(state, action: PayloadAction<string>) {
      state.expandedCluster =
        state.expandedCluster === action.payload ? null : action.payload;
    },
    setHiddenStockCols(state, action: PayloadAction<string[]>) {
      state.hiddenStockCols = action.payload;
    },
    // Column visibility is a display preference, not per-CBU state — it
    // survives the reset that runs on every CBU navigation.
    resetCbuDetailState(state) {
      return { ...initialState, hiddenStockCols: state.hiddenStockCols };
    },
  },
});

export const {
  setUom,
  setStockView,
  setExpandedComponents,
  toggleComponentExpanded,
  toggleExpandedCluster,
  setHiddenStockCols,
  resetCbuDetailState,
} = cbuDetailSlice.actions;

export default cbuDetailSlice.reducer;
