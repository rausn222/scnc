import { Fragment, useMemo, useState, useEffect, lazy, Suspense } from "react";
import { motion } from "motion/react";
import { getRowFilterAttributes, buildFilterOptions, STATIC_FILTER_OPTIONS, type CBURow, type AggregatedComponent,} from "../components/data";
import { PageHeader } from "../components/PageHeader";
import { Loader } from "../components/Loader";
import { TableSkeleton } from "../components/TableSkeleton";
import { ALL_FILTER_DEFINITIONS, MoreFiltersPanel, type FilterId,} from "../components/MoreFiltersPanel";
import { FilterDropdown, FilterToggle } from "../components/FilterDropdown";
import { useNav } from "../App";
import { RefreshCw, Download, Search, AlertTriangle } from "lucide-react";
import {
  W_SR,
  PAGE_TITLE,
  PAGE_BREADCRUMBS,
  REFRESH_BUTTON_TITLE,
  EXPORT_BUTTON_TITLE,
  SEARCH_PLACEHOLDER,
  SEARCH_TOOLTIP,
  HIGH_CONTRIBUTING_LABEL,
  highContributingToggleTitle,
  LOADING_TEXT,
  ERROR_TEXT,
  NO_CBU_DATA_MESSAGE,
  NO_SEARCH_RESULTS_MESSAGE,
  CLEAR_FILTERS_LABEL,
  DASHBOARD_REFETCH_INTERVAL_MS,
  footerDataAsOf,
  FOOTER_AGENT_LABEL,
  MATERIAL_TYPE_FILTER_OPTIONS,
  UOM_FILTER_OPTIONS,
  MATERIAL_TYPE_TOGGLE_OPTIONS,
  UOM_TOGGLE_OPTIONS,
} from "../constants/nationalDashboard";
import type { TypeFilter, UomFilter,} from "../components/nationalDashboard/types";
import { buildOrderedCols, buildRowSearchText, compareSortValues, computeGroupRuns, formatBasePackOption, formatCbuOption, formatMaterialOptions, getRowSortValue, metaColsWidth,} from "../components/nationalDashboard/utils";
import { TableHintsBar } from "../components/nationalDashboard/TableHintsBar";
import { TablePagination } from "../components/nationalDashboard/TablePagination";
import { ColumnCustomizer } from "../components/nationalDashboard/ColumnCustomizer";
import { DashboardTable } from "../components/nationalDashboard/DashboardTable";
import { useCbuListQuery, useComponentBreakdownsQuery } from "../queries/cbuQueries";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  setColOrderByGroup, setDropdownFilter, setExpandedSrNo, setFilterOrder, setGroupOrder, setHiddenCols,
  setHiddenGroups, setPage, setRowsPerPage, setSearch, setSelectedComponentsForRow, setSort,
  setVisibleFilters, toggleSelectedComponent, toggleShowHighContributing, resetFilters,
} from "../store/slices/nationalDashboardSlice";

// Modals are only needed once the user opens one, and DemandModal pulls in
// the recharts charting library — split both out of the initial page chunk.
const DemandModal = lazy(() =>
  import("../components/DemandModal").then((m) => ({ default: m.DemandModal })),
);
const StockLocationBreakdownModal = lazy(() =>
  import("../components/StockLocationBreakdownModal").then((m) => ({
    default: m.StockLocationBreakdownModal,
  })),
);

const MODAL_LOADER_FALLBACK = (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{ backgroundColor: "rgba(0,48,135,0.18)", backdropFilter: "blur(4px)" }}
  >
    <Loader fullHeight={false} />
  </div>
);

/** Bridges a Redux-backed value to the `useState`-shaped setter APIs that
 * MoreFiltersPanel / ColumnCustomizer expect, so those shared components
 * don't need to know their state now lives in the store. */
function toStateSetter<T>(
  current: T,
  onChange: (next: T) => void,
): React.Dispatch<React.SetStateAction<T>> {
  return (action) => {
    const next =
      typeof action === "function"
        ? (action as (prev: T) => T)(current)
        : action;
    onChange(next);
  };
}

function formatDataAsOf(timestamp: number): string {
  if (!timestamp) return "—";
  const d = new Date(timestamp);
  return `${String(d.getDate()).padStart(2, "0")}-${d.toLocaleString("en", { month: "short" })}-${d.getFullYear()}`;
}

export default function NationalDashboard() {
  const { navigate } = useNav();
  const dispatch = useAppDispatch();

  const {
    data: cbuListData,
    isLoading: isCbuListLoading,
    isError: isCbuListError,
    isFetching: isCbuListFetching,
    dataUpdatedAt: cbuListUpdatedAt,
    refetch: refetchCbuList,
  } = useCbuListQuery({ refetchInterval: DASHBOARD_REFETCH_INTERVAL_MS });
  const cbuData = useMemo(() => cbuListData ?? [], [cbuListData]);

  const {
    data: componentBreakdowns,
    isLoading: isComponentBreakdownsLoading,
    isError: isComponentBreakdownsError,
    isFetching: isComponentBreakdownsFetching,
    refetch: refetchComponentBreakdowns,
  } = useComponentBreakdownsQuery(cbuData, {
    refetchInterval: DASHBOARD_REFETCH_INTERVAL_MS,
  });

  const isRefreshing = isCbuListFetching || isComponentBreakdownsFetching;
  const handleRefresh = () => {
    dispatch(resetFilters());
    refetchCbuList();
    refetchComponentBreakdowns();
  };

  const groupOrder = useAppSelector((s) => s.nationalDashboard.groupOrder);
  const colOrderByGroup = useAppSelector(
    (s) => s.nationalDashboard.colOrderByGroup,
  );
  const hiddenGroupsList = useAppSelector(
    (s) => s.nationalDashboard.hiddenGroups,
  );
  const hiddenColsList = useAppSelector((s) => s.nationalDashboard.hiddenCols);
  const sortCol = useAppSelector((s) => s.nationalDashboard.sortCol);
  const sortDir = useAppSelector((s) => s.nationalDashboard.sortDir);
  const page = useAppSelector((s) => s.nationalDashboard.page);
  const rowsPerPage = useAppSelector((s) => s.nationalDashboard.rowsPerPage);
  const search = useAppSelector((s) => s.nationalDashboard.search);
  const filterOrder = useAppSelector((s) => s.nationalDashboard.filterOrder);
  const visibleFiltersList = useAppSelector(
    (s) => s.nationalDashboard.visibleFilters,
  );
  const dropdownFilters = useAppSelector(
    (s) => s.nationalDashboard.dropdownFilters,
  );
  const showHighContributing = useAppSelector(
    (s) => s.nationalDashboard.showHighContributing,
  );
  const expandedSrNo = useAppSelector((s) => s.nationalDashboard.expandedSrNo);
  const selectedComponentsRaw = useAppSelector(
    (s) => s.nationalDashboard.selectedComponents,
  );

  const hiddenGroups = useMemo(
    () => new Set(hiddenGroupsList),
    [hiddenGroupsList],
  );
  const hiddenCols = useMemo(() => new Set(hiddenColsList), [hiddenColsList]);
  const visibleFilters = useMemo(
    () => new Set(visibleFiltersList),
    [visibleFiltersList],
  );
  const selectedComponents = useMemo(() => {
    const result: Record<number, Set<string>> = {};
    for (const [srNo, codes] of Object.entries(selectedComponentsRaw)) {
      result[Number(srNo)] = new Set(codes);
    }
    return result;
  }, [selectedComponentsRaw]);

  const componentCache = useMemo(() => {
    const result: Record<number, AggregatedComponent[]> = {};
    for (const [srNo, breakdown] of Object.entries(componentBreakdowns ?? {})) {
      result[Number(srNo)] = breakdown.components;
    }
    return result;
  }, [componentBreakdowns]);

  const highContributingCache = useMemo(() => {
    const result: Record<number, AggregatedComponent[]> = {};
    for (const [srNo, breakdown] of Object.entries(componentBreakdowns ?? {})) {
      result[Number(srNo)] = breakdown.highContributing;
    }
    return result;
  }, [componentBreakdowns]);

  const [demandModal, setDemandModal] = useState<{
    code: string;
    desc: string;
    period: "3tdp" | "6m" | "12m";
  } | null>(null);
  const [stockModal, setStockModal] = useState<{ kind: "dc" | "factory" | "transit"; row: CBURow } | null>(null);

  const orderedCols = buildOrderedCols(
    groupOrder,
    colOrderByGroup,
    hiddenGroups,
    hiddenCols,
  );
  const orderedMetaCols = useMemo(
    () => orderedCols.filter((col) => col.group === "meta"),
    [orderedCols],
  );
  const orderedDataCols = useMemo(
    () => orderedCols.filter((col) => col.group !== "meta"),
    [orderedCols],
  );
  const groupRuns = useMemo(
    () => computeGroupRuns(orderedDataCols),
    [orderedDataCols],
  );
  const metaWidth = metaColsWidth(orderedMetaCols);
  const tableMinWidth =
    W_SR +
    metaWidth +
    orderedDataCols.reduce((sum, col) => sum + col.minWidth, 0);
  const stickyColCount = 1 + orderedMetaCols.length;

  const uom = dropdownFilters.uom as UomFilter;
  const typeFilter = dropdownFilters.materialType as TypeFilter;

  function setUom(next: UomFilter) {
    dispatch(setDropdownFilter({ id: "uom", value: next }));
  }

  function setTypeFilter(next: TypeFilter) {
    dispatch(setDropdownFilter({ id: "materialType", value: next }));
  }

  function getFilterOptions(id: FilterId): string[] {
    if (id === "materialType") return MATERIAL_TYPE_FILTER_OPTIONS;
    if (id === "uom") return UOM_FILTER_OPTIONS;
    if (id === "basePack") {
      const values = new Set(cbuData.map((row) => formatBasePackOption(row)));
      return ["All", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
    }
    if (id === "cbuCode") {
      const values = new Set(cbuData.map((row) => formatCbuOption(row)));
      return ["All", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
    }
    if (id === "materialCode") {
      const values = new Set(cbuData.flatMap((row) => formatMaterialOptions(row)));
      return ["All", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
    }
    if (id in STATIC_FILTER_OPTIONS) {
      return STATIC_FILTER_OPTIONS[
        id as keyof typeof STATIC_FILTER_OPTIONS
      ]!;
    }
    return buildFilterOptions(
      id as keyof ReturnType<typeof getRowFilterAttributes>,
    );
  }

  const toolbarFilters = filterOrder.filter((id) => visibleFilters.has(id));

  const activeHiddenFilterCount = filterOrder.filter(
    (id) =>
      !visibleFilters.has(id) &&
      dropdownFilters[id] !== "All" &&
      dropdownFilters[id] !== "ALL" &&
      !(id === "uom" && dropdownFilters[id] === "EA"),
  ).length;

  const filtered = cbuData.filter((row) => {
    const attrs = getRowFilterAttributes(row);
    const q = search.toLowerCase();

    if (q && !buildRowSearchText(row, attrs).includes(q)) {
      return false;
    }

    const checks: Array<[FilterId, string]> = [
      ["bg", attrs.bg],
      ["smallC", attrs.smallC],
      ["format", attrs.format],
      ["brand", attrs.brand],
      ["cbuCode", formatCbuOption(row)],
      ["basePack", formatBasePackOption(row)],
    ];

    for (const [filterId, rowValue] of checks) {
      const selected = dropdownFilters[filterId];
      if (selected !== "All" && rowValue !== selected) return false;
    }

    const selectedMaterial = dropdownFilters.materialCode;
    if (
      selectedMaterial !== "All" &&
      !formatMaterialOptions(row).includes(selectedMaterial)
    ) {
      return false;
    }

    return true;
  });

  const sortedRows = useMemo(() => {
    if (!sortCol) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) =>
      compareSortValues(
        getRowSortValue(
          a,
          sortCol,
          typeFilter,
          componentCache,
          selectedComponents,
          highContributingCache,
          showHighContributing,
        ),
        getRowSortValue(
          b,
          sortCol,
          typeFilter,
          componentCache,
          selectedComponents,
          highContributingCache,
          showHighContributing,
        ),
        sortDir,
      ),
    );
    return copy;
  }, [
    filtered,
    sortCol,
    sortDir,
    typeFilter,
    componentCache,
    selectedComponents,
    highContributingCache,
    showHighContributing,
  ]);

  const activeRowCount = sortedRows.length;

  const totalPages = Math.max(1, Math.ceil(activeRowCount / rowsPerPage));
  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(
    () =>
      sortedRows.slice(
        (safePage - 1) * rowsPerPage,
        safePage * rowsPerPage,
      ),
    [sortedRows, safePage, rowsPerPage],
  );

  useEffect(() => {
    if (page > totalPages) dispatch(setPage(totalPages));
  }, [dispatch, page, totalPages]);

  function handleSort(colId: string) {
    dispatch(setSort(colId));
  }

  function handleCBUClick(row: CBURow) {
    if (expandedSrNo === row.srNo) {
      dispatch(setExpandedSrNo(null));
      return;
    }
    dispatch(setExpandedSrNo(row.srNo));
    if (!selectedComponentsRaw[row.srNo]) {
      const comps = componentCache[row.srNo] ?? [];
      const highComps = highContributingCache[row.srNo] ?? [];
      dispatch(
        setSelectedComponentsForRow({
          srNo: row.srNo,
          codes: Array.from(
            new Set([
              ...comps.map((c) => c.componentCode),
              ...highComps.map((c) => c.componentCode),
            ]),
          ),
        }),
      );
    }
  }

  function toggleComp(srNo: number, code: string) {
    dispatch(toggleSelectedComponent({ srNo, code }));
  }

  function toggleAll(
    srNo: number,
    comps: AggregatedComponent[],
    allSel: boolean,
  ) {
    dispatch(
      setSelectedComponentsForRow({
        srNo,
        codes: allSel ? [] : comps.map((c) => c.componentCode),
      }),
    );
  }

  function renderCbuTableSection() {
    if (isCbuListLoading || (cbuData.length > 0 && isComponentBreakdownsLoading)) {
      return (
        <div className="flex-1 overflow-auto p-3" aria-busy="true" aria-label={LOADING_TEXT}>
          <TableSkeleton
            columns={stickyColCount + orderedDataCols.length}
            rows={Math.min(rowsPerPage, 12)}
          />
        </div>
      );
    }

    if (isCbuListError || isComponentBreakdownsError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <AlertTriangle size={24} style={{ color: "#dc2626" }} />
          <p className="text-sm" style={{ color: "#64748b" }}>{ERROR_TEXT}</p>
        </div>
      );
    }

    if (cbuData.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <Search size={24} style={{ color: "#94a3b8" }} />
          <p className="text-sm italic" style={{ color: "#64748b" }}>{NO_CBU_DATA_MESSAGE}</p>
        </div>
      );
    }

    if (activeRowCount === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <Search size={24} style={{ color: "#94a3b8" }} />
          <p className="text-sm italic" style={{ color: "#64748b" }}>{NO_SEARCH_RESULTS_MESSAGE}</p>
          <button
            type="button"
            onClick={() => dispatch(resetFilters())}
            className="text-xs font-semibold cursor-pointer"
            style={{ color: "#1565C0" }}
          >
            {CLEAR_FILTERS_LABEL}
          </button>
        </div>
      );
    }

    return (
      <>
        <DashboardTable
          orderedMetaCols={orderedMetaCols}
          orderedDataCols={orderedDataCols}
          groupRuns={groupRuns}
          tableMinWidth={tableMinWidth}
          metaWidth={metaWidth}
          stickyColCount={stickyColCount}
          sortCol={sortCol}
          sortDir={sortDir}
          onSort={handleSort}
          paginatedRows={paginatedRows}
          expandedSrNo={expandedSrNo}
          componentCache={componentCache}
          highContributingCache={highContributingCache}
          selectedComponents={selectedComponents}
          typeFilter={typeFilter}
          uom={uom}
          showHighContributing={showHighContributing}
          onCbuClick={handleCBUClick}
          navigate={navigate}
          onToggleComp={toggleComp}
          onToggleAll={toggleAll}
          onDemandClick={(row, period) =>
            setDemandModal({ code: row.cbuCode, desc: row.cbuDescription, period })
          }
          onDcStockClick={(row) => setStockModal({ kind: "dc", row })}
          onFactoryStockClick={(row) => setStockModal({ kind: "factory", row })}
          onInTransitClick={(row) => setStockModal({ kind: "transit", row })}
        />

        <TablePagination
          page={safePage}
          rowsPerPage={rowsPerPage}
          totalRows={activeRowCount}
          onPageChange={(p) => dispatch(setPage(p))}
          onRowsPerPageChange={(n) => dispatch(setRowsPerPage(n))}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <PageHeader
          title={PAGE_TITLE}
          breadcrumbs={PAGE_BREADCRUMBS}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={REFRESH_BUTTON_TITLE}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "#ffffff24",
              color: "#fff",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "#e5e7eb",
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : undefined} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={EXPORT_BUTTON_TITLE}
            className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors"
            style={{
              backgroundColor: "#ffffff24",
              color: "#fff",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "#e5e7eb",
            }}
          >
            <Download size={14} />
          </motion.button>
        </PageHeader>

        {/* ── Row 1: Search + UOM + Customise ── */}
        <div
          className="px-5 py-2 shrink-0 flex items-center gap-3"
          style={{
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div className="relative" style={{ maxWidth: 300, flex: 1 }}>
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "#9ca3af" }}
            />
            <input
              type="text"
              placeholder={SEARCH_PLACEHOLDER}
              title={SEARCH_TOOLTIP}
              value={search}
              onChange={(e) => dispatch(setSearch(e.target.value))}
              className="w-full pl-8 pr-3 py-1.5 rounded-full text-xs focus:outline-none transition-all"
              style={{
                backgroundColor: "#f9fafb",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "#d1d5db",
                color: "#111827",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
              onFocus={(e) =>
                ((e.currentTarget as HTMLElement).style.borderColor =
                  "#1565C0")
              }
              onBlur={(e) =>
                ((e.currentTarget as HTMLElement).style.borderColor =
                  "#d1d5db")
              }
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={showHighContributing}
              onClick={() => dispatch(toggleShowHighContributing())}
              title={highContributingToggleTitle(showHighContributing)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors shrink-0"
              style={{
                backgroundColor: showHighContributing
                  ? "rgba(21,101,192,0.14)"
                  : "#ffffff",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: showHighContributing ? "#1565C0" : "#d1d5db",
                color: "#374151",
              }}
            >
              <span
                className="relative w-7 h-[14px] rounded-full transition-colors shrink-0"
                style={{
                  backgroundColor: showHighContributing
                    ? "#1565C0"
                    : "#cbd5e1",
                }}
              >
                <span
                  className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform"
                  style={{ left: showHighContributing ? 14 : 2 }}
                />
              </span>
              {HIGH_CONTRIBUTING_LABEL}
            </button>
            <ColumnCustomizer
              groupOrder={groupOrder}
              setGroupOrder={toStateSetter(groupOrder, (next) =>
                dispatch(setGroupOrder(next)),
              )}
              colOrderByGroup={colOrderByGroup}
              setColOrderByGroup={toStateSetter(colOrderByGroup, (next) =>
                dispatch(setColOrderByGroup(next)),
              )}
              hiddenGroups={hiddenGroups}
              setHiddenGroups={toStateSetter(hiddenGroups, (next) =>
                dispatch(setHiddenGroups(Array.from(next))),
              )}
              hiddenCols={hiddenCols}
              setHiddenCols={toStateSetter(hiddenCols, (next) =>
                dispatch(setHiddenCols(Array.from(next))),
              )}
            />
          </div>
        </div>

        {/* ── Row 2: Filters dropdowns ── */}
        <div
          className="px-5 py-2 shrink-0 flex items-end min-w-0 gap-3"
          style={{
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div className="flex items-end flex-wrap gap-x-3 gap-y-2 flex-1 min-w-0">
            {toolbarFilters.map((filterId) => {
              const def = ALL_FILTER_DEFINITIONS.find((f) => f.id === filterId);
              if (!def) return null;

              if (def.kind === "toggle" && filterId === "materialType") {
                return (
                  <Fragment key={filterId}>
                    <FilterToggle
                      label={def.label}
                      value={typeFilter}
                      onChange={(v) => setTypeFilter(v as TypeFilter)}
                      activeColor="#1565C0"
                      options={MATERIAL_TYPE_TOGGLE_OPTIONS}
                    />
                  </Fragment>
                );
              }

              if (def.kind === "toggle" && filterId === "uom") {
                return (
                  <Fragment key={filterId}>
                    <FilterToggle
                      label={def.label}
                      value={uom}
                      onChange={(v) => setUom(v as UomFilter)}
                      activeColor="#1565C0"
                      options={UOM_TOGGLE_OPTIONS}
                    />
                  </Fragment>
                );
              }

              return (
                <Fragment key={filterId}>
                  <FilterDropdown
                    label={def.label}
                    value={dropdownFilters[filterId]}
                    options={getFilterOptions(filterId)}
                    onChange={(value) =>
                      dispatch(setDropdownFilter({ id: filterId, value }))
                    }
                  />
                </Fragment>
              );
            })}
          </div>

          <MoreFiltersPanel
            filterOrder={filterOrder}
            setFilterOrder={toStateSetter(filterOrder, (next) =>
              dispatch(setFilterOrder(next)),
            )}
            visibleFilters={visibleFilters}
            setVisibleFilters={toStateSetter(visibleFilters, (next) =>
              dispatch(setVisibleFilters(Array.from(next))),
            )}
            activeHiddenCount={activeHiddenFilterCount}
            dropdownFilters={dropdownFilters}
            onDropdownChange={(id, value) =>
              dispatch(setDropdownFilter({ id, value }))
            }
            getFilterOptions={getFilterOptions}
          />
        </div>

        {/* ── Row 3: Info bar ── */}
        <TableHintsBar />

        {renderCbuTableSection()}

        {/* Footer */}
        <div
          className="px-5 py-2 shrink-0 flex items-center justify-between text-xs"
          style={{
            backgroundColor: "#ffffff",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <span
            style={{
              color: "#6b7280",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
            }}
          >
            {footerDataAsOf(formatDataAsOf(cbuListUpdatedAt))}
          </span>
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: "#1565C0",
                display: "inline-block",
              }}
            />
            <span
              style={{
                color: "#6b7280",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
              }}
            >
              {FOOTER_AGENT_LABEL}
            </span>
          </div>
        </div>
      </div>

      {demandModal && (
        <Suspense fallback={MODAL_LOADER_FALLBACK}>
          <DemandModal
            cbuCode={demandModal.code}
            cbuDescription={demandModal.desc}
            period={demandModal.period}
            onClose={() => setDemandModal(null)}
          />
        </Suspense>
      )}

      {stockModal && (
        <Suspense fallback={MODAL_LOADER_FALLBACK}>
          <StockLocationBreakdownModal
            kind={stockModal.kind}
            row={stockModal.row}
            onClose={() => setStockModal(null)}
          />
        </Suspense>
      )}
    </>
  );
}
