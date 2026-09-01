import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, Download, RefreshCw, RotateCcw, Search } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { FilterDropdown } from "../components/FilterDropdown";
import { ActionsTable } from "../components/actions/ActionsTable";
import {
  ACTIONS_DATA,
  MATERIAL_OPTIONS,
  OWNER_OPTIONS,
  PLANT_OPTIONS,
  SCENARIO_TYPE_OPTIONS,
  STATUS_OPTIONS,
  type ActionRow,
  type ActionStatus,
} from "../components/actions/actionsData";

const ACTION_TO_STATUS: Record<string, ActionStatus> = {
  Approve: "APPROVED",
  Reject: "REJECTED",
};

const EMPTY_FILTERS = {
  scenarioType: "All",
  plant: "All",
  material: "All",
  owner: "All",
  status: "All",
};

export default function ActionDetail() {
  const [rows, setRows] = useState<ActionRow[]>(ACTIONS_DATA);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  function setFilter(id: keyof typeof EMPTY_FILTERS, value: string) {
    setFilters((prev) => ({ ...prev, [id]: value }));
  }

  function handleDecision(rowId: string, action: string) {
    const nextStatus = ACTION_TO_STATUS[action];
    if (!nextStatus) return;
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, status: nextStatus } : r)),
    );
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (
        q &&
        !row.actionId.toLowerCase().includes(q) &&
        !row.description.toLowerCase().includes(q) &&
        !row.material.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (filters.scenarioType !== "All" && row.scenarioType !== filters.scenarioType) return false;
      if (filters.plant !== "All" && row.plant !== filters.plant) return false;
      if (filters.material !== "All" && row.material !== filters.material) return false;
      if (filters.owner !== "All" && row.owner !== filters.owner) return false;
      if (filters.status !== "All" && row.status !== filters.status) return false;
      return true;
    });
  }, [rows, search, filters]);

  const filtersActive =
    search.trim() !== "" ||
    Object.entries(filters).some(([k, v]) => v !== EMPTY_FILTERS[k as keyof typeof EMPTY_FILTERS]);

  function clearFilters() {
    setSearch("");
    setFilters(EMPTY_FILTERS);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Activity & Monitoring"
        breadcrumbs={[{ label: "Dashboard" }, { label: "Activity & Monitoring" }]}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Refresh"
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
          style={{ backgroundColor: "#ffffff24", color: "#fff", border: "1px solid #e5e7eb" }}
        >
          <RefreshCw size={14} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Export"
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
          style={{ backgroundColor: "#ffffff24", color: "#fff", border: "1px solid #e5e7eb" }}
        >
          <Download size={14} />
        </motion.button>
      </PageHeader>

      {/* Resimulate banner */}
      <div
        className="mx-5 mt-3 shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg"
        style={{ backgroundColor: "#fef9e7", border: "1px solid #fde8b0" }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} style={{ color: "#b45309" }} />
          <span className="text-xs font-medium" style={{ color: "#92610f" }}>
            Resimulate to analyse impact of deviations on the scenario selected
          </span>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors shrink-0"
          style={{ backgroundColor: "#003087" }}
        >
          <RefreshCw size={12} />
          Resimulate
        </button>
      </div>

      {/* Search + Filters */}
      <div
        className="mx-5 mt-3 shrink-0 flex items-end flex-wrap gap-3 px-4 py-3 rounded-lg"
        style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}
      >
        <div className="flex flex-col gap-1" style={{ maxWidth: 260, flex: "1 1 220px" }}>
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#374151" }}>
            Search
          </span>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }} />
            <input
              type="text"
              placeholder="Action ID, description or material…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-full text-xs focus:outline-none transition-all"
              style={{ backgroundColor: "#f9fafb", border: "1px solid #d1d5db", color: "#111827" }}
            />
          </div>
        </div>

        <FilterDropdown label="Scenario Type" value={filters.scenarioType} options={SCENARIO_TYPE_OPTIONS} onChange={(v) => setFilter("scenarioType", v)} />
        <FilterDropdown label="Plant" value={filters.plant} options={PLANT_OPTIONS} onChange={(v) => setFilter("plant", v)} />
        <FilterDropdown label="Material" value={filters.material} options={MATERIAL_OPTIONS} onChange={(v) => setFilter("material", v)} />
        <FilterDropdown label="Owner" value={filters.owner} options={OWNER_OPTIONS} onChange={(v) => setFilter("owner", v)} maxWidth={160} />
        <FilterDropdown label="Status" value={filters.status} options={STATUS_OPTIONS} onChange={(v) => setFilter("status", v)} />

        <button
          type="button"
          onClick={clearFilters}
          disabled={!filtersActive}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: "#1565C0", border: "1px solid #d1d5db" }}
        >
          <RotateCcw size={11} />
          Clear filters
        </button>

        <span className="ml-auto text-xs shrink-0 pb-1.5" style={{ color: "#6b7280" }}>
          {filteredRows.length} of {rows.length} actions
        </span>
      </div>

      {/* Actions list */}
      <div className="flex-1 overflow-auto px-5 py-3">
        <ActionsTable rows={filteredRows} onDecision={handleDecision} />
      </div>
    </div>
  );
}
