import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { FilterId } from "../../components/MoreFiltersPanel";
import {
  DEFAULT_FILTER_ORDER,
  DEFAULT_VISIBLE_FILTER_IDS,
} from "../../components/MoreFiltersPanel";
import {
  DEFAULT_GROUP_ORDER,
  DEFAULT_HIDDEN_COLS,
} from "../../constants/nationalDashboard";
import { buildDefaultColOrderByGroup } from "../../components/nationalDashboard/utils";
import type {
  ColumnGroup,
  SortDir,
} from "../../components/nationalDashboard/types";

const DEFAULT_DROPDOWN_FILTERS: Record<FilterId, string> = {
  bg: "All",
  smallC: "All",
  format: "All",
  materialType: "ALL",
  uom: "EA",
  brand: "All",
  materialCode: "All",
  cbuCode: "All",
  basePack: "All",
};

export interface NationalDashboardState {
  groupOrder: ColumnGroup[];
  colOrderByGroup: Record<ColumnGroup, string[]>;
  hiddenGroups: ColumnGroup[];
  hiddenCols: string[];
  sortCol: string | null;
  sortDir: SortDir;
  page: number;
  rowsPerPage: number;
  search: string;
  filterOrder: FilterId[];
  visibleFilters: FilterId[];
  dropdownFilters: Record<FilterId, string>;
  showHighContributing: boolean;
  expandedSrNo: number | null;
  selectedComponents: Record<number, string[]>;
}

const initialState: NationalDashboardState = {
  groupOrder: DEFAULT_GROUP_ORDER,
  colOrderByGroup: buildDefaultColOrderByGroup(),
  hiddenGroups: [],
  hiddenCols: Array.from(DEFAULT_HIDDEN_COLS),
  sortCol: null,
  sortDir: "asc",
  page: 1,
  rowsPerPage: 20,
  search: "",
  filterOrder: DEFAULT_FILTER_ORDER,
  visibleFilters: DEFAULT_VISIBLE_FILTER_IDS,
  dropdownFilters: DEFAULT_DROPDOWN_FILTERS,
  showHighContributing: false,
  expandedSrNo: null,
  selectedComponents: {},
};

const nationalDashboardSlice = createSlice({
  name: "nationalDashboard",
  initialState,
  reducers: {
    setGroupOrder(state, action: PayloadAction<ColumnGroup[]>) {
      state.groupOrder = action.payload;
    },
    setColOrderByGroup(
      state,
      action: PayloadAction<Record<ColumnGroup, string[]>>,
    ) {
      state.colOrderByGroup = action.payload;
    },
    setHiddenGroups(state, action: PayloadAction<ColumnGroup[]>) {
      state.hiddenGroups = action.payload;
    },
    setHiddenCols(state, action: PayloadAction<string[]>) {
      state.hiddenCols = action.payload;
    },
    resetColumnCustomization(state) {
      state.groupOrder = DEFAULT_GROUP_ORDER;
      state.colOrderByGroup = buildDefaultColOrderByGroup();
      state.hiddenGroups = [];
      state.hiddenCols = Array.from(DEFAULT_HIDDEN_COLS);
    },
    setSort(state, action: PayloadAction<string>) {
      if (state.sortCol === action.payload) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortCol = action.payload;
        state.sortDir = "asc";
      }
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setRowsPerPage(state, action: PayloadAction<number>) {
      state.rowsPerPage = action.payload;
      state.page = 1;
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.page = 1;
    },
    setFilterOrder(state, action: PayloadAction<FilterId[]>) {
      state.filterOrder = action.payload;
    },
    setVisibleFilters(state, action: PayloadAction<FilterId[]>) {
      state.visibleFilters = action.payload;
    },
    setDropdownFilter(
      state,
      action: PayloadAction<{ id: FilterId; value: string }>,
    ) {
      state.dropdownFilters[action.payload.id] = action.payload.value;
      state.page = 1;
    },
    toggleShowHighContributing(state) {
      state.showHighContributing = !state.showHighContributing;
    },
    setExpandedSrNo(state, action: PayloadAction<number | null>) {
      state.expandedSrNo = action.payload;
    },
    setSelectedComponentsForRow(
      state,
      action: PayloadAction<{ srNo: number; codes: string[] }>,
    ) {
      state.selectedComponents[action.payload.srNo] = action.payload.codes;
    },
    toggleSelectedComponent(
      state,
      action: PayloadAction<{ srNo: number; code: string }>,
    ) {
      const { srNo, code } = action.payload;
      const set = new Set(state.selectedComponents[srNo] ?? []);
      set.has(code) ? set.delete(code) : set.add(code);
      state.selectedComponents[srNo] = Array.from(set);
    },
    resetFilters(state) {
      state.search = "";
      state.dropdownFilters = { ...DEFAULT_DROPDOWN_FILTERS };
      state.page = 1;
    },
  },
});

export const {
  setGroupOrder,
  setColOrderByGroup,
  setHiddenGroups,
  setHiddenCols,
  resetColumnCustomization,
  setSort,
  setPage,
  setRowsPerPage,
  setSearch,
  setFilterOrder,
  setVisibleFilters,
  setDropdownFilter,
  toggleShowHighContributing,
  setExpandedSrNo,
  setSelectedComponentsForRow,
  toggleSelectedComponent,
  resetFilters,
} = nationalDashboardSlice.actions;

export default nationalDashboardSlice.reducer;
