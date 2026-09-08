import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import {
  AlertTriangle,
  Ban,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Eye,
  EyeOff,
  FunnelX,
  Layers,
  ListFilter,
  Network,
  PanelRightOpen,
  RefreshCw,
  RotateCcw,
  Search,
  Wallet,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { MultiSelectFilterDropdown } from "../components/FilterDropdown";
import { ExplainabilityPanel } from "../components/ExplainabilityPanel";
import { useNav } from "../App";
import {
  NETWORK_DATA,
  STICKY_COL_DIVIDER,
  STICKY_COL_WIDTH,
  fmtMoney,
  statusColor,
  wasteComparisonColor,
  type NetworkRow,
} from "../components/networkSummary/networkData";
import {
  BusinessWasteSavingsChart,
  type ChartMetric,
} from "../components/networkSummary/BusinessWasteSavingsChart";
import { NetworkDeviationBreakdown } from "../components/networkSummary/NetworkDeviationBreakdown";
import { NetworkCbuBreakdown } from "../components/networkSummary/NetworkCbuBreakdown";
import { buildNetworkExplainability } from "../components/networkSummary/networkExplainability";

const BORDER = "#e2e8f0";
const HEAD_BG = "#003087";
const ROWS_PER_PAGE_OPTIONS = [5, 10, 20];

type ExpandedPanel = { id: string; type: "cbu" | "deviation" };

const EMPTY_FILTERS = {
  networkId: [] as string[],
  projectName: [] as string[],
  bg: [] as string[],
  bgTransition: [] as string[],
  status: [] as string[],
  selectedScenario: [] as string[],
  oldCbu: [] as string[],
  newCbu: [] as string[],
  productionStopDate: [] as string[],
  actionId: [] as string[],
  actionOwner: [] as string[],
  actionStatus: [] as string[],
};
type FilterId = keyof typeof EMPTY_FILTERS;
const ALL_FILTER_IDS = Object.keys(EMPTY_FILTERS) as FilterId[];

const FILTER_CONTROLS: Array<readonly [FilterId, string]> = [
  ["networkId", "Network ID"],
  ["projectName", "Project"],
  ["bg", "Business Group"],
  ["bgTransition", "BG Transition"],
  ["status", "Status"],
  ["selectedScenario", "Selected Scenario"],
  ["oldCbu", "Old CBU"],
  ["newCbu", "New CBU"],
  ["productionStopDate", "Production Stop Date"],
  ["actionId", "Action ID"],
  ["actionOwner", "Action Owner"],
  ["actionStatus", "Action Status"],
];

// Action Status and Action Owner surface more often than the rest of the action-level fields,
// so they're shown by default; BG Transition and Production Stop Date are tucked behind "More filters".
const DEFAULT_HIDDEN_FILTERS = new Set<FilterId>(["bgTransition", "productionStopDate", "actionId"]);

function filterWidth(id: FilterId) {
  if (id === "selectedScenario") return 200;
  if (id === "projectName") return 190;
  if (id === "actionOwner") return 170;
  if (id === "productionStopDate") return 160;
  if (id === "networkId") return 150;
  return 130;
}

/** Values a row contributes for a given filter — one element for scalar fields, or one per
 * matching nested CBU / deviation action item for the array-backed ones. */
function filterValues(row: NetworkRow, id: FilterId): string[] {
  switch (id) {
    case "status":
      return [row.status];
    case "selectedScenario":
      return [row.selectedScenario];
    case "bg":
      return [row.bg];
    case "bgTransition":
      return [row.bgTransition ? "Yes" : "No"];
    case "networkId":
      return [row.networkId];
    case "projectName":
      return [row.projectName];
    case "productionStopDate":
      return [row.productionStopDate];
    case "oldCbu":
      return row.cbus.map((c) => c.oldCode);
    case "newCbu":
      return row.cbus.flatMap((c) => (c.newCode ? [c.newCode] : []));
    case "actionId":
      return (row.deviationDetails ?? []).map((d) => d.actionId);
    case "actionOwner":
      return (row.deviationDetails ?? []).map((d) => d.owner);
    case "actionStatus":
      return (row.deviationDetails ?? []).map((d) => d.status);
  }
}

export default function NetworkSummary() {
  const { navigate } = useNav();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [hiddenFilters, setHiddenFilters] = useState<Set<FilterId>>(
    () => new Set(DEFAULT_HIDDEN_FILTERS),
  );
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel | null>(null);
  const [focusedNetworkId, setFocusedNetworkId] = useState<string | null>(null);
  const [showSummaryPanel, setShowSummaryPanel] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const moreFiltersRef = useRef<HTMLDivElement>(null);
  const moreFiltersButtonRef = useRef<HTMLButtonElement>(null);
  const [moreFiltersPanelStyle, setMoreFiltersPanelStyle] = useState<React.CSSProperties>({});

  const updateMoreFiltersPosition = useCallback(() => {
    if (!moreFiltersButtonRef.current) return;
    const rect = moreFiltersButtonRef.current.getBoundingClientRect();
    const width = 320;
    const margin = 8;
    const minPanelHeight = 260;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const openUp = spaceBelow < minPanelHeight && spaceAbove > spaceBelow;
    setMoreFiltersPanelStyle({
      position: "fixed",
      left: Math.max(margin, Math.min(rect.right - width, window.innerWidth - width - margin)),
      width,
      maxHeight: Math.max(160, openUp ? spaceAbove : spaceBelow),
      zIndex: 9999,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + margin }
        : { top: rect.bottom + margin }),
    });
  }, []);

  useLayoutEffect(() => {
    if (!moreFiltersOpen) return;
    updateMoreFiltersPosition();
    window.addEventListener("resize", updateMoreFiltersPosition);
    window.addEventListener("scroll", updateMoreFiltersPosition, true);
    return () => {
      window.removeEventListener("resize", updateMoreFiltersPosition);
      window.removeEventListener("scroll", updateMoreFiltersPosition, true);
    };
  }, [moreFiltersOpen, updateMoreFiltersPosition]);

  useEffect(() => {
    if (!moreFiltersOpen) return;
    const closeMoreFilters = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !moreFiltersRef.current?.contains(target) &&
        !(target as Element).closest?.("[data-more-filters-panel]")
      ) {
        setMoreFiltersOpen(false);
      }
    };
    document.addEventListener("mousedown", closeMoreFilters);
    return () => document.removeEventListener("mousedown", closeMoreFilters);
  }, [moreFiltersOpen]);

  function setFilter(id: FilterId, value: string[]) {
    setFilters((prev) => ({ ...prev, [id]: value }));
  }

  function dependentOptions(id: FilterId): string[] {
    const compatibleRows = NETWORK_DATA.filter((row) =>
      ALL_FILTER_IDS.every((filterId) => {
        if (filterId === id) return true;
        const values = filters[filterId];
        if (values.length === 0) return true;
        return filterValues(row, filterId).some((v) => values.includes(v));
      }),
    );
    const available = new Set([
      ...compatibleRows.flatMap((row) => filterValues(row, id)),
      ...filters[id],
    ]);
    return Array.from(available).sort((a, b) => a.localeCompare(b));
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return NETWORK_DATA.filter((row) => {
      if (
        q &&
        !row.networkId.toLowerCase().includes(q) &&
        !row.projectName.toLowerCase().includes(q)
      )
        return false;
      return ALL_FILTER_IDS.every((id) => {
        const selected = filters[id];
        if (selected.length === 0) return true;
        return filterValues(row, id).some((v) => selected.includes(v));
      });
    });
  }, [search, filters]);

  const filtersActive =
    search.trim() !== "" || Object.values(filters).some((values) => values.length > 0);

  function clearFilters() {
    setSearch("");
    setFilters(EMPTY_FILTERS);
    setFocusedNetworkId(null);
  }

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = useMemo(
    () =>
      filteredRows.slice(
        (safePage - 1) * rowsPerPage,
        safePage * rowsPerPage,
      ),
    [filteredRows, safePage, rowsPerPage],
  );

  useEffect(() => {
    setPage(1);
  }, [search, filters, rowsPerPage]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const totalNetworks = NETWORK_DATA.length;
  const transitioningCbus = NETWORK_DATA.reduce(
    (sum, r) => sum + r.oldCbuCount,
    0,
  );
  const networksWithDeviations = NETWORK_DATA.filter(
    (r) => (r.deviationCount ?? 0) > 0,
  ).length;
  const totalBusinessWaste = NETWORK_DATA.reduce(
    (sum, r) => sum + (r.businessWaste ?? 0),
    0,
  );
  const totalSavings = NETWORK_DATA.reduce(
    (sum, r) => sum + (r.savings ?? 0),
    0,
  );
  const valueAtRisk = NETWORK_DATA.filter((r) => (r.deviationCount ?? 0) > 0).reduce(
    (sum, r) => sum + (r.businessWaste ?? 0),
    0,
  );
  const noActionNetworks = NETWORK_DATA.filter(
    (r) => r.selectedScenario === "No action",
  );
  const noActionBusinessWaste = noActionNetworks.reduce(
    (sum, r) => sum + (r.businessWaste ?? 0),
    0,
  );

  const [chartMetric, setChartMetric] = useState<ChartMetric>("businessWaste");

  const chartData = useMemo(() => {
    const withRisk = filteredRows.map((r) => ({
      row: r,
      valueAtRisk: (r.deviationCount ?? 0) > 0 ? r.businessWaste ?? 0 : 0,
    }));
    const metricValue = (x: (typeof withRisk)[number]) => {
      if (chartMetric === "savings") return x.row.savings ?? 0;
      if (chartMetric === "valueAtRisk") return x.valueAtRisk;
      return x.row.businessWaste ?? 0;
    };
    // Only rank networks that actually have a positive value for the selected metric —
    // drafts (no scenario picked yet) and "no action" rows would otherwise pad out the
    // Top 10 with zero-height bars.
    return withRisk
      .filter((x) => metricValue(x) > 0)
      .sort((a, b) => metricValue(b) - metricValue(a))
      .slice(0, 10)
      .map((x) => ({
        networkId: x.row.networkId,
        projectName: x.row.projectName,
        businessWaste: x.row.businessWaste ?? 0,
        savings: x.row.savings ?? 0,
        hasDeviation: (x.row.deviationCount ?? 0) > 0,
      }));
  }, [filteredRows, chartMetric]);

  const chartSubtitle =
    chartMetric === "savings"
      ? "Top 10 networks by savings"
      : chartMetric === "valueAtRisk"
        ? "Top 10 networks by value at risk"
        : "Top 10 networks by business waste";

  function handleViewDetails(row: NetworkRow) {
    navigate({ page: "tracking-details" });
  }

  // Focuses the Explainability panel and highlights the row — a read-only "spotlight" that
  // never narrows the Network Details table itself. Only the search/filter section and chart
  // clicks (which set the networkId filter below) are allowed to change which rows are shown.
  function handleFocusNetwork(networkId: string) {
    if (!networkId) return;
    setFocusedNetworkId(networkId);
  }

  function handleChartNetworkClick(networkId: string) {
    if (!networkId) return;
    setFilter("networkId", [networkId]);
    setHiddenFilters((previous) => {
      if (!previous.has("networkId")) return previous;
      const next = new Set(previous);
      next.delete("networkId");
      return next;
    });
    setFocusedNetworkId(networkId);
    const row = NETWORK_DATA.find((r) => r.networkId === networkId);
    const hasDeviations = (row?.deviationCount ?? 0) > 0;
    setExpandedPanel(hasDeviations ? { id: networkId, type: "deviation" } : null);
  }

  const focusedNetwork =
    focusedNetworkId
      ? (NETWORK_DATA.find((r) => r.networkId === focusedNetworkId) ?? null)
      : null;

  const explainability = useMemo(
    () => buildNetworkExplainability(filteredRows, focusedNetwork),
    [filteredRows, focusedNetwork],
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Network Summary"
        breadcrumbs={[
          { label: "SAMARTH" },
          { label: "Network Planner" },
          { label: "Network Summary" },
        ]}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Refresh"
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer"
          style={{ backgroundColor: "#ffffff24", color: "#fff", border: "1px solid #e5e7eb" }}
        >
          <RefreshCw size={14} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Export"
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer"
          style={{ backgroundColor: "#ffffff24", color: "#fff", border: "1px solid #e5e7eb" }}
        >
          <Download size={14} />
        </motion.button>
        {!showSummaryPanel && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Show summary panel"
            onClick={() => setShowSummaryPanel(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer"
            style={{ backgroundColor: "#ffffff24", color: "#fff", border: "1px solid #e5e7eb" }}
          >
            <PanelRightOpen size={14} />
          </motion.button>
        )}
      </PageHeader>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col gap-4 p-5">
          {/* Overview tiles */}
          <div className="grid grid-cols-12 gap-4 shrink-0">
            <div className="col-span-2">
              <OverviewTile
                icon={<Network size={18} />}
                label="Total Networks"
                value={totalNetworks}
                accent="#1565C0"
              />
            </div>
            <div className="col-span-2">
              <OverviewTile
                icon={<Layers size={18} />}
                label="Transitioning CBUs"
                value={transitioningCbus}
                accent="#00695C"
              />
            </div>
            <div className="col-span-2">
              <OverviewTile
                icon={<Ban size={18} />}
                label="No Action Business Waste"
                value={fmtMoney(noActionBusinessWaste)}
                accent="#b45309"
                sub={`Across ${noActionNetworks.length} network${noActionNetworks.length === 1 ? "" : "s"}`}
              />
            </div>
            <div className="col-span-3">
              <DualMetricTile
                icon={<Wallet size={18} />}
                title="Business Waste + Savings"
                accent="#1565C0"
                metrics={[
                  { label: "Business Waste", value: fmtMoney(totalBusinessWaste), color: "#1565C0" },
                  { label: "Savings", value: fmtMoney(totalSavings), color: "#15803d" },
                ]}
              />
            </div>
            <div className="col-span-3">
              <DualMetricTile
                icon={<AlertTriangle size={18} />}
                title="Networks with Deviations"
                accent="#b91c1c"
                metrics={[
                  { label: "Require immediate action", value: String(networksWithDeviations), color: "#b91c1c" },
                  { label: "Savings Value at Risk", value: fmtMoney(valueAtRisk), color: "#b91c1c" },
                ]}
              />
            </div>
          </div>

          {/* Filters */}
          <div
            className="rounded-lg overflow-visible shrink-0"
            style={{ backgroundColor: "#ffffff", border: `1px solid ${BORDER}` }}
          >
            {/* Header: title, search, result count, expand/collapse toggle */}
            <div
              className="px-4 py-2 flex items-center gap-3"
              style={filtersExpanded ? { borderBottom: `1px solid ${BORDER}` } : undefined}
            >
              {filtersActive && (
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: "#eff6ff", color: "#1565C0" }}
                >
                  Active
                </span>
              )}

              {filtersExpanded && (
                <div className="relative flex-1 min-w-0" style={{ maxWidth: 320 }}>
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#9ca3af" }}
                  />
                  <input
                    type="text"
                    placeholder="Network ID or Project name…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-full text-xs focus:outline-none transition-all"
                    style={{ backgroundColor: "#f9fafb", border: "1px solid #d1d5db", color: "#111827" }}
                  />
                </div>
              )}

              <div className="flex items-center gap-3 shrink-0 ml-auto">
                <span className="text-xs shrink-0" style={{ color: "#6b7280" }}>
                  {filteredRows.length} of {NETWORK_DATA.length} networks
                </span>
                <button
                  type="button"
                  onClick={() => setFiltersExpanded((v) => !v)}
                  aria-expanded={filtersExpanded}
                  title={filtersExpanded ? "Collapse filters" : "Expand filters"}
                  aria-label={filtersExpanded ? "Collapse filters" : "Expand filters"}
                  className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors cursor-pointer"
                  style={{ color: "#1565C0", border: "1px solid #d1d5db", backgroundColor: "#ffffff" }}
                >
                  {filtersExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {filtersExpanded && (
              <div className="px-4 py-2.5 flex items-end gap-2">
              <div className="flex items-end flex-wrap gap-2 flex-1 min-w-0">
                {FILTER_CONTROLS.filter(([id]) => !hiddenFilters.has(id)).map(([id, label]) => (
                  <MultiSelectFilterDropdown
                    key={id}
                    label={label}
                    options={dependentOptions(id).map((option) => ({ label: option, value: option }))}
                    selected={filters[id]}
                    onChange={(value) => setFilter(id, value)}
                    maxWidth={filterWidth(id)}
                    dense
                  />
                ))}
              </div>

              <div className="flex items-end gap-2 shrink-0">
                {filtersActive && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    title="Clear filters"
                    aria-label="Clear filters"
                    className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors cursor-pointer"
                    style={{ color: "#1565C0", border: "1px solid #d1d5db", backgroundColor: "#ffffff" }}
                  >
                    <FunnelX size={13} />
                  </button>
                )}

                <div ref={moreFiltersRef} className="relative shrink-0">
                <button
                  ref={moreFiltersButtonRef}
                  type="button"
                  onClick={() => setMoreFiltersOpen((v) => !v)}
                  aria-expanded={moreFiltersOpen}
                  title="More filters"
                  aria-label="More filters"
                  className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer"
                  style={{
                    color: "#1565C0",
                    border: "1px solid #d1d5db",
                    backgroundColor: moreFiltersOpen ? "#eff6ff" : "#ffffff",
                  }}
                >
                  <ListFilter size={13} />
                </button>
                {moreFiltersOpen && createPortal(
                  <div
                    data-more-filters-panel
                    className="flex flex-col overflow-hidden rounded-xl shadow-xl"
                    style={{ ...moreFiltersPanelStyle, backgroundColor: "#ffffff", border: "1px solid rgba(21,101,192,0.2)" }}
                  >
                    <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "#003087" }}>
                        <ListFilter size={13} style={{ color: "#1565C0" }} /> Manage Filters
                      </div>
                      <button
                        type="button"
                        onClick={() => setHiddenFilters(new Set())}
                        className="flex items-center gap-1 text-[10px] cursor-pointer"
                        style={{ color: "#1565C0" }}
                      >
                        <RotateCcw size={10} /> Reset
                      </button>
                    </div>
                    <div className="px-4 py-2 text-[9px] uppercase tracking-wide shrink-0" style={{ color: "#6b7280", borderBottom: "1px solid #f3f4f6" }}>
                      Toggle to show/hide filters
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto py-1">
                      {FILTER_CONTROLS.map(([id, label]) => {
                        const visible = !hiddenFilters.has(id);
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-2 px-4 py-1.5"
                            style={{ color: visible ? "#111827" : "#9ca3af", textDecoration: visible ? "none" : "line-through" }}
                          >
                            <span className="flex-1 text-xs">{label}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setHiddenFilters((previous) => {
                                  const next = new Set(previous);
                                  next.has(id) ? next.delete(id) : next.add(id);
                                  return next;
                                })
                              }
                              className="cursor-pointer"
                              title={visible ? "Hide filter" : "Show filter"}
                              aria-label={visible ? `Hide ${label}` : `Show ${label}`}
                              style={{ color: "#1565C0" }}
                            >
                              {visible ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 shrink-0" style={{ borderTop: "1px solid #e5e7eb" }}>
                      <span className="text-[9px]" style={{ color: "#6b7280" }}>
                        {FILTER_CONTROLS.length - hiddenFilters.size} shown · {hiddenFilters.size} hidden
                      </span>
                      <button
                        type="button"
                        onClick={() => setMoreFiltersOpen(false)}
                        className="rounded-lg px-3 py-1 text-xs cursor-pointer"
                        style={{ backgroundColor: "#EDF5FA", color: "#374151", border: "1px solid rgba(21,101,192,0.2)" }}
                      >
                        Done
                      </button>
                    </div>
                  </div>,
                  document.body,
                )}
              </div>
              </div>
              </div>
            )}
          </div>

          {/* Business waste and savings */}
          <BusinessWasteSavingsChart
            data={chartData}
            subtitle={chartSubtitle}
            metric={chartMetric}
            onMetricChange={setChartMetric}
            onNetworkClick={handleChartNetworkClick}
          />

          {/* Network Details */}
          <div
            className="rounded-lg flex flex-col overflow-hidden"
            style={{ backgroundColor: "#ffffff", border: `1px solid ${BORDER}` }}
          >
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <h3 className="text-sm font-bold" style={{ color: "#003087" }}>
                Network Details
              </h3>
            </div>

            {/* Table */}
            <NetworkDetailsTable
              rows={paginatedRows}
              onViewDetails={handleViewDetails}
              expanded={expandedPanel}
              onExpandedChange={setExpandedPanel}
              onFocusNetwork={handleFocusNetwork}
              focusedNetworkId={focusedNetwork?.networkId ?? null}
            />

            {/* Pagination */}
            <TablePagination
              page={safePage}
              rowsPerPage={rowsPerPage}
              totalRows={filteredRows.length}
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
            />
          </div>
        </div>
        </div>

        {/* {showSummaryPanel && (
          <div className="w-[320px] shrink-0 py-5 pr-5 pl-0">
            <ExplainabilityPanel
              content={explainability}
              title="Summary"
              onClose={() => setShowSummaryPanel(false)}
            />
          </div>
        )} */}
      </div>
    </div>
  );
}

// ─── Overview tile ────────────────────────────────────────────────────────────

function OverviewTile({
  icon,
  label,
  value,
  accent,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent: string;
  sub?: string;
}) {
  return (
    <div
      className="rounded-lg px-4 py-3.5 flex items-start gap-3 h-full"
      style={{ backgroundColor: "#ffffff", border: `1px solid ${BORDER}` }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${accent}1a`, color: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div
          className="text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: "#6b7280" }}
        >
          {label}
        </div>
        <div className="text-xl font-bold mt-0.5" style={{ color: accent }}>
          {value}
        </div>
        {sub && (
          <div className="text-[11px] mt-0.5" style={{ color: "#9ca3af" }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dual-metric tile ─────────────────────────────────────────────────────────

function DualMetricTile({
  icon,
  title,
  accent,
  metrics,
}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  metrics: [
    { label: string; value: string; color: string },
    { label: string; value: string; color: string },
  ];
}) {
  return (
    <div
      className="rounded-lg px-4 py-3.5 flex flex-col gap-2.5 h-full"
      style={{ backgroundColor: "#ffffff", border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}1a`, color: accent }}
        >
          {icon}
        </div>
        <span
          className="text-[10px] font-semibold uppercase tracking-wide truncate"
          style={{ color: "#6b7280" }}
        >
          {title}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="min-w-0">
            <div className="text-lg font-bold truncate" style={{ color: m.color }}>
              {m.value}
            </div>
            <div className="text-[10px] mt-0.5 truncate" style={{ color: "#9ca3af" }} title={m.label}>
              {m.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Network Details table ────────────────────────────────────────────────────

const COLS = [
  { label: "Project", width: STICKY_COL_WIDTH },
  { label: "Status", width: 100 },
  { label: "Selected Scenario", width: 190 },
  { label: "Progress", width: 130 },
  { label: "Old CBU Count", width: 100 },
  { label: "Deviation Count", width: 110 },
  { label: "Value at Risk", width: 120 },
  { label: "Business Waste", width: 160 },
  { label: "Total Cost", width: 100 },
  { label: "Production Stop Date", width: 150 },
  { label: "View Details", width: 90 },
];

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2" title={`${pct}% complete`} style={{ minWidth: 90 }}>
      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "#e5edf9" }}>
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: "#1565C0" }}
        />
      </div>
      <span className="text-[10px] font-semibold tabular-nums shrink-0" style={{ color: "#374151", minWidth: 26 }}>
        {pct}%
      </span>
    </div>
  );
}

function BusinessWasteCell({ row }: { row: NetworkRow }) {
  if (row.businessWaste == null) {
    return <span style={{ color: "#9ca3af" }}>—</span>;
  }
  const color = wasteComparisonColor(row.businessWaste, row.savings);
  return (
    <span className="whitespace-nowrap">
      <span className="font-bold tabular-nums" style={{ color }}>
        {fmtMoney(row.businessWaste)}
      </span>
      {(row.savings ?? 0) > 0 && (
        <span className="ml-1.5 font-semibold tabular-nums" style={{ color, fontSize: 10 }}>
          ↓ {fmtMoney(row.savings)}
        </span>
      )}
    </span>
  );
}

// ─── Custom scrollbar: confined to the scrollable columns, never under the frozen Project column ──

function TableScrollbar({
  scrollRef,
  offsetLeft,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  offsetLeft: number;
}) {
  const [metrics, setMetrics] = useState({ scrollLeft: 0, scrollWidth: 0, clientWidth: 0 });
  const dragRef = useRef<{ startX: number; startScrollLeft: number } | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const measure = () =>
      setMetrics({ scrollLeft: el.scrollLeft, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth });

    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [scrollRef]);

  const { scrollLeft, scrollWidth, clientWidth } = metrics;
  if (scrollWidth <= clientWidth || clientWidth === 0) return null;

  const trackWidth = Math.max(0, clientWidth - offsetLeft);
  const thumbWidth = Math.max(24, (clientWidth / scrollWidth) * trackWidth);
  const maxThumbLeft = trackWidth - thumbWidth;
  const scrollableDist = scrollWidth - clientWidth;
  const thumbLeft = scrollableDist > 0 ? (scrollLeft / scrollableDist) * maxThumbLeft : 0;

  const onThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startScrollLeft: scrollLeft };
    const onMove = (ev: MouseEvent) => {
      const el = scrollRef.current;
      if (!dragRef.current || !el || maxThumbLeft <= 0) return;
      const dx = ev.clientX - dragRef.current.startX;
      el.scrollLeft = dragRef.current.startScrollLeft + dx * (scrollableDist / maxThumbLeft);
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const onTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, (clickX - thumbWidth / 2) / (maxThumbLeft || 1)));
    el.scrollLeft = ratio * scrollableDist;
  };

  return (
    <div
      data-testid="network-table-scrollbar-track"
      className="absolute bottom-1 h-2 rounded-full cursor-pointer"
      style={{ left: offsetLeft, right: 0, backgroundColor: "#EFF4FB" }}
      onClick={onTrackClick}
    >
      <div
        data-testid="network-table-scrollbar-thumb"
        onMouseDown={onThumbMouseDown}
        className="absolute top-0 h-2 rounded-full cursor-grab active:cursor-grabbing"
        style={{ left: thumbLeft, width: thumbWidth, backgroundColor: "#1565C0" }}
      />
    </div>
  );
}

function NetworkDetailsTable({
  rows,
  onViewDetails,
  expanded,
  onExpandedChange,
  onFocusNetwork,
  focusedNetworkId,
}: {
  rows: NetworkRow[];
  onViewDetails: (row: NetworkRow) => void;
  expanded: ExpandedPanel | null;
  onExpandedChange: (next: ExpandedPanel | null) => void;
  onFocusNetwork: (networkId: string) => void;
  focusedNetworkId: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (rows.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-16 text-sm"
        style={{ color: "#6b7280" }}
      >
        No networks match the selected filters.
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={scrollRef} className="min-w-0 overflow-auto network-table-scroll-hide pb-3">
        <table className="text-xs border-collapse w-full" style={{ minWidth: 1500 }}>
        <thead className="sticky top-0 z-20">
          <tr style={{ backgroundColor: HEAD_BG }} className="text-white">
            {COLS.map((col, i) => (
              <th
                key={col.label || `col-${i}`}
                className="px-3 py-2.5 font-semibold whitespace-nowrap text-left"
                style={{
                  minWidth: col.width,
                  position: i === 0 ? "sticky" : undefined,
                  left: i === 0 ? 0 : undefined,
                  zIndex: i === 0 ? 31 : undefined,
                  backgroundColor: HEAD_BG,
                  borderRight: i === 0 ? STICKY_COL_DIVIDER : undefined,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const sc = statusColor(row.status);
            const isExpanded = row.networkId === expanded?.id;
            const expandedType = isExpanded ? expanded?.type : null;
            const isFocused = row.networkId === focusedNetworkId;
            const rowBg = isExpanded ? "#EFF4FB" : "#ffffff";
            const topBorder = isExpanded ? "2px solid #1565C0" : `1px solid ${BORDER}`;
            const sideBorder = isExpanded ? "2px solid #1565C0" : isFocused ? "2px solid #93c5fd" : undefined;
            return (
              <Fragment key={row.networkId}>
                <tr
                  className={`cursor-pointer ${isExpanded ? "" : "hover:bg-blue-50 transition-colors"}`}
                  style={{ backgroundColor: rowBg }}
                  onClick={() => onFocusNetwork(row.networkId)}
                  title={`Show ${row.networkId} in the Explainability panel`}
                >
                  <td
                    className="px-3 py-2.5"
                    style={{ borderTop: topBorder, borderLeft: sideBorder, borderRight: STICKY_COL_DIVIDER, position: "sticky", left: 0, zIndex: 10, backgroundColor: rowBg }}
                  >
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {row.networkId}
                    </span>
                    <div className="font-bold truncate" style={{ color: "#1565C0", maxWidth: 200 }}>
                      {row.projectName}
                    </div>
                    <div className="text-[11px] truncate" style={{ color: "#94a3b8" }}>
                      {row.bg}
                    </div>
                  </td>
                  <td
                    className="px-3 py-2.5 whitespace-nowrap"
                    style={{ borderTop: topBorder }}
                  >
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ backgroundColor: sc.bg, color: sc.text }}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td
                    className="px-3 py-2.5 whitespace-nowrap"
                    style={{ borderTop: topBorder, color: "#374151" }}
                  >
                    {row.selectedScenario}
                  </td>
                  <td
                    className="px-3 py-2.5 whitespace-nowrap"
                    style={{ borderTop: topBorder }}
                  >
                    <ProgressBar pct={row.progressPct} />
                  </td>
                  <td
                    className="px-3 py-2.5 whitespace-nowrap"
                    style={{ borderTop: topBorder, color: "#374151" }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onExpandedChange(
                          isExpanded && expandedType === "cbu"
                            ? null
                            : { id: row.networkId, type: "cbu" },
                        )
                      }
                      title="View old CBU list"
                      aria-expanded={isExpanded && expandedType === "cbu"}
                      className="text-xs font-normal underline decoration-dotted underline-offset-2 cursor-pointer"
                      style={{ color: "#1565C0" }}
                    >
                      {row.oldCbuCount}
                    </button>
                  </td>
                  <td
                    className="px-3 py-2.5 whitespace-nowrap"
                    style={{
                      borderTop: topBorder,
                      color: row.deviationCount ? "#1565C0" : "#9ca3af",
                    }}
                  >
                    {(row.deviationCount ?? 0) > 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          onExpandedChange(
                            isExpanded && expandedType === "deviation"
                              ? null
                              : { id: row.networkId, type: "deviation" },
                          )
                        }
                        title="View network deviations"
                        aria-expanded={isExpanded && expandedType === "deviation"}
                        className="text-xs font-normal underline decoration-dotted underline-offset-2 cursor-pointer"
                        style={{ color: "#1565C0" }}
                      >
                        {row.deviationCount}
                      </button>
                    ) : (
                      "NA"
                    )}
                  </td>
                  <td
                    className="px-3 py-2.5 whitespace-nowrap font-bold tabular-nums"
                    style={{
                      borderTop: topBorder,
                      color: (row.deviationCount ?? 0) > 0 ? "#b91c1c" : "#9ca3af",
                    }}
                  >
                    {(row.deviationCount ?? 0) > 0 ? fmtMoney(row.businessWaste) : "NA"}
                  </td>
                  <td
                    className="px-3 py-2.5"
                    style={{ borderTop: topBorder }}
                  >
                    <BusinessWasteCell row={row} />
                  </td>
                  <td
                    className="px-3 py-2.5 whitespace-nowrap"
                    style={{ borderTop: topBorder, color: "#374151" }}
                  >
                    {fmtMoney(row.totalCost)}
                  </td>
                  <td
                    className="px-3 py-2.5 whitespace-nowrap"
                    style={{ borderTop: topBorder, color: "#374151" }}
                  >
                    {row.productionStopDate}
                  </td>
                  <td
                    className="px-3 py-2.5 text-left"
                    style={{ borderTop: topBorder, borderRight: sideBorder }}
                  >
                    <button
                      type="button"
                      onClick={() => onViewDetails(row)}
                      title="View details"
                      className="inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors cursor-pointer"
                      style={{ color: "#1565C0" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "#EDF5F4";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      }}
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td
                      colSpan={COLS.length}
                      className="p-0"
                      style={{ borderLeft: "2px solid #1565C0", borderRight: "2px solid #1565C0", borderBottom: "2px solid #1565C0" }}
                    >
                      {expandedType === "cbu" ? (
                        <NetworkCbuBreakdown cbus={row.cbus} />
                      ) : (
                        <NetworkDeviationBreakdown row={row} />
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      </div>
      <TableScrollbar scrollRef={scrollRef} offsetLeft={COLS[0].width} />
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function TablePagination({
  page,
  rowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
}: {
  page: number;
  rowsPerPage: number;
  totalRows: number;
  onPageChange: (p: number) => void;
  onRowsPerPageChange: (n: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = totalRows === 0 ? 0 : (safePage - 1) * rowsPerPage + 1;
  const end = Math.min(safePage * rowsPerPage, totalRows);
  const pages = getVisiblePages(safePage, totalPages);

  return (
    <div
      className="shrink-0 px-4 py-2.5 flex items-center justify-between border-t text-xs"
      style={{ backgroundColor: "#ffffff", borderColor: BORDER }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span style={{ color: "#374151" }}>Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            className="border rounded px-2 py-1 text-xs cursor-pointer bg-white"
            style={{ borderColor: "#d1d5db", color: "#374151" }}
          >
            {ROWS_PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <span style={{ color: "#6b7280" }}>
          {start}-{end} of {totalRows}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          style={{ color: "#374151" }}
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="px-1.5 select-none" style={{ color: "#6b7280" }}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className="min-w-[28px] h-7 px-1.5 rounded text-xs font-medium transition-colors"
              style={
                p === safePage
                  ? { backgroundColor: "#1565C0", color: "#ffffff" }
                  : { color: "#374151" }
              }
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          style={{ color: "#374151" }}
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function getVisiblePages(page: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 1) return [1];
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: Array<number | "ellipsis"> = [1];
  if (page > 3) pages.push("ellipsis");
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (page < totalPages - 2) pages.push("ellipsis");
  pages.push(totalPages);
  const deduped: Array<number | "ellipsis"> = [];
  for (const p of pages) {
    const prev = deduped[deduped.length - 1];
    if (p === "ellipsis" && prev === "ellipsis") continue;
    if (typeof p === "number" && p === prev) continue;
    deduped.push(p);
  }
  return deduped;
}

