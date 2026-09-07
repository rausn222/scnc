import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Layers,
  Network,
  RefreshCw,
  RotateCcw,
  Search,
  Wallet,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { FilterDropdown } from "../components/FilterDropdown";
import { useNav } from "../App";
import {
  NETWORK_DATA,
  SCENARIO_OPTIONS,
  STATUS_OPTIONS,
  fmtMoney,
  statusColor,
  type NetworkRow,
} from "../components/networkSummary/networkData";
import { BusinessWasteSavingsChart } from "../components/networkSummary/BusinessWasteSavingsChart";
import { NetworkDeviationModal } from "../components/networkSummary/NetworkDeviationModal";

const BORDER = "#e2e8f0";
const HEAD_BG = "#003087";
const ROWS_PER_PAGE_OPTIONS = [5, 10, 20];

const EMPTY_FILTERS = {
  networkId: "",
  status: "All",
  selectedScenario: "All",
};

export default function NetworkSummary() {
  const { navigate } = useNav();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deviationRow, setDeviationRow] = useState<NetworkRow | null>(null);

  function setFilter(id: keyof typeof EMPTY_FILTERS, value: string) {
    setFilters((prev) => ({ ...prev, [id]: value }));
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
      if (filters.status !== "All" && row.status !== filters.status)
        return false;
      if (
        filters.selectedScenario !== "All" &&
        row.selectedScenario !== filters.selectedScenario
      )
        return false;
      return true;
    });
  }, [search, filters]);

  const filtersActive =
    search.trim() !== "" ||
    Object.entries(filters).some(
      ([k, v]) => v !== EMPTY_FILTERS[k as keyof typeof EMPTY_FILTERS],
    );

  function clearFilters() {
    setSearch("");
    setFilters(EMPTY_FILTERS);
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

  const topBusinessWasteData = NETWORK_DATA.filter(
    (r): r is NetworkRow & { businessWaste: number; savings: number } =>
      r.businessWaste != null && r.savings != null,
  )
    .sort((a, b) => b.businessWaste - a.businessWaste)
    .slice(0, 10)
    .map((r) => ({
      networkId: r.networkId,
      projectName: r.projectName,
      businessWaste: r.businessWaste,
      savings: r.savings,
    }));

  function handleViewDetails(row: NetworkRow) {
    navigate({ page: "tracking-details" });
  }

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
      </PageHeader>

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="flex flex-col gap-4 p-5">
          {/* Overview tiles */}
          <div className="grid grid-cols-4 gap-4 shrink-0">
            <OverviewTile
              icon={<Network size={18} />}
              label="Total Networks"
              value={totalNetworks}
              accent="#1565C0"
            />
            <OverviewTile
              icon={<Layers size={18} />}
              label="Transitioning CBUs"
              value={transitioningCbus}
              accent="#00695C"
            />
            <DualMetricTile
              icon={<Wallet size={18} />}
              title="Business Waste + Savings"
              accent="#1565C0"
              metrics={[
                { label: "Business Waste", value: fmtMoney(totalBusinessWaste), color: "#1565C0" },
                { label: "Savings", value: fmtMoney(totalSavings), color: "#15803d" },
              ]}
            />
            <DualMetricTile
              icon={<AlertTriangle size={18} />}
              title="Networks with Deviations"
              accent="#b91c1c"
              metrics={[
                { label: "Require immediate action", value: String(networksWithDeviations), color: "#b91c1c" },
                { label: "Value at Risk", value: fmtMoney(valueAtRisk), color: "#b91c1c" },
              ]}
            />
          </div>

          {/* Business waste and savings */}
          <BusinessWasteSavingsChart data={topBusinessWasteData} />

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

            {/* Filters */}
            <div
              className="flex items-end flex-wrap gap-3 px-4 py-3"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
              <div className="flex flex-col gap-1" style={{ maxWidth: 220, flex: "1 1 200px" }}>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: "#374151" }}
                >
                  Search
                </span>
                <div className="relative">
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
              </div>

              <FilterDropdown
                label="Status"
                value={filters.status}
                options={STATUS_OPTIONS}
                onChange={(v) => setFilter("status", v)}
              />
              <FilterDropdown
                label="Selected Scenario"
                value={filters.selectedScenario}
                options={SCENARIO_OPTIONS}
                onChange={(v) => setFilter("selectedScenario", v)}
                maxWidth={200}
              />

              <button
                type="button"
                onClick={clearFilters}
                disabled={!filtersActive}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ color: "#1565C0", border: "1px solid #d1d5db" }}
              >
                <RotateCcw size={11} />
                Clear filters
              </button>

              <span className="ml-auto text-xs shrink-0 pb-1.5" style={{ color: "#6b7280" }}>
                {filteredRows.length} of {NETWORK_DATA.length} networks
              </span>
            </div>

            {/* Table */}
            <NetworkDetailsTable
              rows={paginatedRows}
              onViewDetails={handleViewDetails}
              onDeviationClick={(row) => setDeviationRow(row)}
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

      {deviationRow && (
        <NetworkDeviationModal row={deviationRow} onClose={() => setDeviationRow(null)} />
      )}
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
      className="rounded-lg px-4 py-3.5 flex items-start gap-3"
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
      className="rounded-lg px-4 py-3.5 flex flex-col gap-2.5"
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
            <div className="text-[10px] mt-0.5 truncate" style={{ color: "#9ca3af" }}>
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
  { label: "Network ID", width: 120 },
  { label: "Project Name", width: 200 },
  { label: "Status", width: 100 },
  { label: "Selected Scenario", width: 190 },
  { label: "Old CBU Count", width: 100 },
  { label: "Deviation Count", width: 110 },
  { label: "Business Waste", width: 110 },
  { label: "Total Savings", width: 110 },
  { label: "Total Cost", width: 100 },
  // { label: "Benefit", width: 150 },
  { label: "Production Stop Date", width: 150 },
  { label: "View Details", width: 90 },
];

function NetworkDetailsTable({
  rows,
  onViewDetails,
  onDeviationClick,
}: {
  rows: NetworkRow[];
  onViewDetails: (row: NetworkRow) => void;
  onDeviationClick: (row: NetworkRow) => void;
}) {
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
    <div className="flex-1 min-h-0 overflow-auto">
      <table className="text-xs border-collapse w-full" style={{ minWidth: 1500 }}>
        <thead className="sticky top-0 z-20">
          <tr style={{ backgroundColor: HEAD_BG }} className="text-white">
            {COLS.map((col, i) => (
              <th
                key={col.label}
                className="px-3 py-2.5 font-semibold whitespace-nowrap text-left"
                style={{
                  borderRight: i < COLS.length - 1 ? "1px solid rgba(255,255,255,0.15)" : undefined,
                  minWidth: col.width,
                  position: i === 0 ? "sticky" : undefined,
                  left: i === 0 ? 0 : undefined,
                  zIndex: i === 0 ? 31 : undefined,
                  backgroundColor: HEAD_BG,
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
            return (
              <tr
                key={row.networkId}
                className="hover:bg-blue-50 transition-colors"
                style={{ backgroundColor: "#ffffff" }}
              >
                <td
                  className="px-3 py-2.5 whitespace-nowrap"
                  style={{ borderRight: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}`, color: "#1565C0", position: "sticky", left: 0, zIndex: 10, backgroundColor: "#ffffff", boxShadow: "2px 0 4px rgba(15,23,42,0.08)" }}
                >
                  {row.networkId}
                </td>
                <td
                  className="px-3 py-2.5 whitespace-nowrap"
                  style={{ borderRight: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}`, color: "#111827" }}
                >
                  {row.projectName}
                </td>
                <td
                  className="px-3 py-2.5 whitespace-nowrap"
                  style={{ borderRight: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}` }}
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
                  style={{ borderRight: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}`, color: "#374151" }}
                >
                  {row.selectedScenario}
                </td>
                <td
                  className="px-3 py-2.5 whitespace-nowrap"
                  style={{ borderRight: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}`, color: "#374151" }}
                >
                  {row.oldCbuCount}
                </td>
                <td
                  className="px-3 py-2.5 whitespace-nowrap"
                  style={{
                    borderRight: `1px solid ${BORDER}`,
                    borderTop: `1px solid ${BORDER}`,
                    color: row.deviationCount ? "#1565C0" : "#9ca3af",
                  }}
                >
                  {(row.deviationCount ?? 0) > 0 ? (
                    <button
                      type="button"
                      onClick={() => onDeviationClick(row)}
                      title="View network deviations"
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
                  className="px-3 py-2.5 whitespace-nowrap"
                  style={{ borderRight: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}`, color: "#374151" }}
                >
                  {fmtMoney(row.businessWaste)}
                </td>
                <td
                  className="px-3 py-2.5 whitespace-nowrap"
                  style={{ borderRight: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}`, color: "#374151" }}
                >
                  {fmtMoney(row.savings)}
                </td>
                <td
                  className="px-3 py-2.5 whitespace-nowrap"
                  style={{ borderRight: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}`, color: "#374151" }}
                >
                  {fmtMoney(row.totalCost)}
                </td>
                {/* <td
                  className="px-3 py-2.5 whitespace-nowrap"
                  style={{ borderRight: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}`, color: "#374151" }}
                >
                  {row.benefit}
                </td> */}
                <td
                  className="px-3 py-2.5 whitespace-nowrap"
                  style={{ borderRight: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}`, color: "#374151" }}
                >
                  {row.productionStopDate}
                </td>
                <td
                  className="px-3 py-2.5 text-left"
                  style={{ borderTop: `1px solid ${BORDER}` }}
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
            );
          })}
        </tbody>
      </table>
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

