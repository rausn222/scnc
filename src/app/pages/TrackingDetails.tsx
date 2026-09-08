import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Download, Expand, Eye, EyeOff, FunnelX, ListFilter, Minimize2, RefreshCw, RotateCcw, Search } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { MultiSelectFilterDropdown } from "../components/FilterDropdown";
// import { ActionsTable } from "../components/actions/ActionsTable";
import {
  ACTIONS_DATA,
  NETWORK_ID,
  type ActionRow,
  type ActionStatus,
} from "../components/actions/actionsData";
import { TrackingProjectSelection, TrackingProjectSelectionValue } from "../components/tracking/TrackingProjectSelection";
import { TrackingOverviewSection } from "../components/tracking/TrackingOverviewSection";
import { useNav, type AcceptedScenarioDetails } from "../App";
import { ActionTask, buildActionTasks } from "../components/actionDetails/ActionTaskList";
import { Project } from "../components/projectDetails/types";
import { SCENARIOS } from "../components/sciDetails/constants";
import { buildDeviations, buildTrackingPhases, PROJECT_REGISTRY } from "../components/tracking/data";
import { ActionsTable } from "../components/actions/ActionsTable";
import { TrackingColumnCustomizer } from "../components/actions/TrackingColumnCustomizer";

const VALID_STATUSES: ActionStatus[] = ["PENDING", "INITIATED", "IN PROGRESS", "COMPLETED"];
const DEFAULT_RECEIVING_PLANT = "U535";

function filterWidth(id: string) {
  if (id === "projectName") return 190;
  if (id === "networkId") return 150;
  return 128;
}

const EMPTY_FILTERS = {
  networkId: [] as string[],
  actionId: [] as string[],
  projectName: [] as string[],
  oldCbuCode: [] as string[],
  newCbuCode: [] as string[],
  scenarioType: [] as string[],
  plant: [] as string[],
  material: [] as string[],
  owner: [] as string[],
  status: [] as string[],
};
type FilterId = keyof typeof EMPTY_FILTERS;
interface Props {
  /** Absent when the page is reached directly (e.g. the sidebar link) instead of via an accepted scenario. */
  tasks?: ActionTask[];
  scenario?: AcceptedScenarioDetails;
  /** The originating project, when navigated here from Project Details — its monitor data is shown as-is instead of being re-derived from tracking step status. */
  project?: Project;
  onBack: () => void;
  backLabel?: string;
}
export default function TrackingDetails({ tasks = [], scenario, project, onBack, backLabel = "Back to Action Details" }: Readonly<Props>) {
  const { navigate } = useNav();
  const [manualScenarioId, setManualScenarioId] = useState<string | null>(null);
  const [projectSelection, setProjectSelection] = useState<TrackingProjectSelectionValue | null>(null);
  const [assignedProjectName, setAssignedProjectName] = useState("");
  const [rows, setRows] = useState<ActionRow[]>(ACTIONS_DATA);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [isActionsFullscreen, setIsActionsFullscreen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [hiddenFilters, setHiddenFilters] = useState<Set<string>>(new Set(["material", "Material"],));
  const moreFiltersRef = useRef<HTMLDivElement>(null);

  const redirectedContext = useMemo(() => {
    const scenarioData = scenario as (AcceptedScenarioDetails & { networkId?: string }) | undefined;
    const networkId = scenarioData?.networkId ?? project?.id ?? project?.code ??
      (scenarioData?.projectName
        ? PROJECT_REGISTRY.find((entry) => entry.projectName === scenarioData.projectName)?.networkId
        : undefined) ?? NETWORK_ID;
    const projectName = scenarioData?.projectName ?? project?.name ?? "Pack Change — South Zone";
    const oldCbuCode = scenarioData?.oldCbuCode ?? project?.cbus[0]?.oldCode ?? "VAFA1R";
    const newCbuCode = scenarioData?.newCbuCode ?? project?.cbus[0]?.newCode ?? "VAFG1R";
    return { networkId, projectName, oldCbuCode, newCbuCode };
  }, [scenario, project]);

  const displayRows = useMemo(() => {
    if (!scenario && !project) return rows;
    return rows.map((row) => ({
      ...row,
      networkId: redirectedContext.networkId,
      projectName: redirectedContext.projectName,
      oldCbuCode: redirectedContext.oldCbuCode,
      newCbuCode: redirectedContext.newCbuCode,
    }));
  }, [rows, scenario, project, redirectedContext]);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      networkId: [redirectedContext.networkId],
      projectName: [redirectedContext.projectName],
      oldCbuCode: [redirectedContext.oldCbuCode],
      newCbuCode: [redirectedContext.newCbuCode],
    }));
  }, [redirectedContext]);

  useEffect(() => {
    if (!moreFiltersOpen) return;
    const closeMoreFilters = (event: MouseEvent) => {
      if (!moreFiltersRef.current?.contains(event.target as Node)) {
        setMoreFiltersOpen(false);
      }
    };
    document.addEventListener("mousedown", closeMoreFilters);
    return () => document.removeEventListener("mousedown", closeMoreFilters);
  }, [moreFiltersOpen]);
  const manualScenario = useMemo<AcceptedScenarioDetails | undefined>(() => {
    if (scenario || !manualScenarioId) return undefined;
    const row = SCENARIOS.find((s) => s.id === manualScenarioId);
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      projectName: projectSelection?.projectName || null,
      oldCbuCode: projectSelection?.oldCbuCode ?? null,
      newCbuCode: projectSelection?.newCbuCode ?? null,
      oldCbuDescription: projectSelection?.oldCbuDescription ?? null,
      newCbuDescription: projectSelection?.newCbuDescription ?? null,
      businessWaste: row.businessWaste,
      wasteSavings: row.wasteSavings,
      wasteColor: row.wasteColor,
      fgDaysCover: row.fgDaysCover,
      nextActionPrefix: row.nextActionPrefix,
      nextAction: row.nextAction,
      icon: row.icon,
      feasibleProducible: row.feasibleProducible,
      productionStopDate: row.productionStopDate,
      dailyRunRate: row.dailyRunRate,
      receivingPlant: DEFAULT_RECEIVING_PLANT,
    };
  }, [scenario, manualScenarioId, projectSelection]);
  const effectiveScenario = useMemo<AcceptedScenarioDetails | undefined>(() => {
    if (!scenario) return manualScenario;
    const selectedProject = projectSelection;
    const selectedProjectName = selectedProject?.projectName ||
      (!scenario.projectName ? assignedProjectName : "");
    return {
      ...scenario,
      ...(selectedProject
        ? {
          oldCbuCode: selectedProject.oldCbuCode,
          oldCbuDescription: selectedProject.oldCbuDescription,
          newCbuCode: selectedProject.newCbuCode,
          newCbuDescription: selectedProject.newCbuDescription,
        }
        : {}),
      ...(selectedProjectName ? { projectName: selectedProjectName } : {}),
    };
  }, [scenario, manualScenario, assignedProjectName, projectSelection]);
  const effectiveTasks = useMemo(() => {
    if (tasks.length > 0) return tasks;
    return effectiveScenario ? buildActionTasks(effectiveScenario) : [];
  }, [tasks, effectiveScenario]);
  const phases = useMemo(() => buildTrackingPhases(effectiveTasks, effectiveScenario), [effectiveTasks, effectiveScenario]);
  const allItems = useMemo(() => phases.flatMap((phase) => phase.items), [phases]);
  const deviations = useMemo(() => buildDeviations(allItems, effectiveScenario), [allItems, effectiveScenario]);
  function setFilter(id: keyof typeof EMPTY_FILTERS, value: string[]) {
    setFilters((prev) => ({ ...prev, [id]: value }));
  }

  function filterValue(row: ActionRow, id: FilterId): string {
    switch (id) {
      case "networkId": return row.networkId;
      case "actionId": return row.actionId;
      case "projectName": return row.projectName;
      case "oldCbuCode": return row.oldCbuCode;
      case "newCbuCode": return row.newCbuCode;
      case "scenarioType": return row.scenarioType;
      case "plant": return row.plant;
      case "material": return row.material;
      case "owner": return row.owner;
      case "status": return row.status;
    }
  }

  function dependentOptions(id: FilterId): string[] {
    const compatibleRows = displayRows.filter((row) =>
      Object.entries(filters).every(([filterId, values]) =>
        filterId === id || values.length === 0 || values.includes(filterValue(row, filterId as FilterId)),
      ),
    );
    const available = new Set([
      ...compatibleRows.map((row) => filterValue(row, id)),
      ...filters[id],
    ]);
    return ["All", ...Array.from(available).filter((value) => value !== "All").sort((a, b) => a.localeCompare(b))];
  }

  function handleDecision(rowId: string, action: string) {
    if (!VALID_STATUSES.includes(action as ActionStatus)) return;
    const nextStatus = action as ActionStatus;
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, status: nextStatus } : r)),
    );
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return displayRows.filter((row) => {
      if (
        q &&
        !row.actionId.toLowerCase().includes(q) &&
        !row.description.toLowerCase().includes(q) &&
        !row.material.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (filters.actionId.length && !filters.actionId.includes(row.actionId)) return false;
      if (filters.networkId.length && !filters.networkId.includes(row.networkId)) return false;
      if (filters.projectName.length && !filters.projectName.includes(row.projectName)) return false;
      if (filters.oldCbuCode.length && !filters.oldCbuCode.includes(row.oldCbuCode)) return false;
      if (filters.newCbuCode.length && !filters.newCbuCode.includes(row.newCbuCode)) return false;
      if (filters.scenarioType.length && !filters.scenarioType.includes(row.scenarioType)) return false;
      if (filters.plant.length && !filters.plant.includes(row.plant)) return false;
      if (filters.material.length && !filters.material.includes(row.material)) return false;
      if (filters.owner.length && !filters.owner.includes(row.owner)) return false;
      if (filters.status.length && !filters.status.includes(row.status)) return false;
      return true;
    });
  }, [displayRows, search, filters]);

  const filtersActive =
    search.trim() !== "" ||
    Object.values(filters).some((values) => values.length > 0);

  function clearFilters() {
    setSearch("");
    setFilters(EMPTY_FILTERS);
  }
  function handleOverviewResimulate() {
    navigate({ page: "network-down-stocking-agent-trial", srNo: projectSelection?.oldSrNo });
  }

  const filterControls: Array<readonly [FilterId, string]> = [
    ["networkId", "Network ID"],
    ["actionId", "Action ID"],
    ["projectName", "Project"],
    ["oldCbuCode", "Old CBU"],
    ["newCbuCode", "New CBU"],
    ["scenarioType", "Scenario Type"],
    ["plant", "Plant"],
    ["material", "Material"],
    ["owner", "Action Owner"],
    ["status", "Status"],
  ];

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
      {/* <div className="shrink-0 p-5 pb-0 space-y-4"> */}
      {/* <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-semibold cursor-pointer"
        >
          <ChevronLeft size={14} />
          {backLabel}
        </button> */}

      {/* <div className="grid gap-4">
          <div className="min-w-0 space-y-4">
            {/* <TrackingProjectSelection
              scenario={scenario}
              onChange={setProjectSelection}
              assignedProjectName={assignedProjectName}
              onAssignedProjectNameChange={setAssignedProjectName}
            /> */}

      {/* <TrackingOverviewSection
              effectiveScenario={effectiveScenario}
              isManualMode={!scenario}
              manualScenarioId={manualScenarioId}
              onManualScenarioChange={setManualScenarioId}
              deviations={deviations}
              onResimulate={handleOverviewResimulate}
            /> */}

      {/* <TrackingActionsList groups={actionGroups} /> */}
      {/* </div> *}
       </div> */}
      {/* </div> */}
      <div
        className={isActionsFullscreen
          ? "fixed inset-0 z-50 flex flex-col min-h-0 gap-2 p-5"
          : "flex-1 min-h-0 flex flex-col gap-2"}
        style={isActionsFullscreen ? { backgroundColor: "#f8fafc" } : undefined}
      >
        <div className={`${isActionsFullscreen ? "" : "mx-0 mt-2"} shrink-0`} style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="px-5 py-2 flex items-center gap-3" style={{ borderBottom: "1px solid #e5e7eb" }}>
            <div className="relative" style={{ maxWidth: 300, flex: 1 }}>
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }} />
              <input
                type="text"
                placeholder="Search"
                title="Search by action ID, description or material"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-full text-xs focus:outline-none"
                style={{ backgroundColor: "#f9fafb", border: "1px solid #d1d5db", color: "#111827" }}
              />
            </div>
            <div className="flex flex-row gap-1 ml-auto">
              <TrackingColumnCustomizer
                hiddenColumns={hiddenColumns}
                onChange={(column) => setHiddenColumns((previous) => {
                  if (column === "__reset__") return new Set();
                  const next = new Set(previous);
                  next.has(column) ? next.delete(column) : next.add(column);
                  return next;
                })}
              />
              <button
                type="button"
                onClick={() => setIsActionsFullscreen((value) => !value)}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer"
                style={{ color: "#1565C0", border: "1px solid #d1d5db", backgroundColor: "#ffffff" }}
                title={isActionsFullscreen ? "Exit full screen" : "Expand search and table"}
                aria-label={isActionsFullscreen ? "Exit full screen" : "Expand search and table"}
              >
                {isActionsFullscreen ? <Minimize2 size={12} /> : <Expand size={12} />}
              </button>
            </div>
          </div>

          <div className="px-5 py-2 flex items-end min-w-0 gap-1">
            <div className="flex items-end flex-wrap gap-x-1 gap-y-2 flex-1 min-w-0">
              {filterControls.filter(([id]) => !hiddenFilters.has(id)).map(([id, label]) => (
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
            <button type="button" onClick={clearFilters} disabled={!filtersActive} title="Clear filters" aria-label="Clear filters" className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" style={{ color: "#1565C0", border: "1px solid #d1d5db", backgroundColor: "#ffffff" }}>
              <FunnelX size={11} />
            </button>
            <div ref={moreFiltersRef} className="relative">
              <button type="button" onClick={() => setMoreFiltersOpen((value) => !value)} aria-expanded={moreFiltersOpen} title="More filters" aria-label="More filters" className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer" style={{ color: "#1565C0", border: "1px solid #d1d5db", backgroundColor: moreFiltersOpen ? "#eff6ff" : "#ffffff" }}>
                <ListFilter size={11} />
              </button>
              {moreFiltersOpen && (
                <div className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-xl shadow-xl" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(21,101,192,0.2)" }}>
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "#003087" }}><ListFilter size={13} style={{ color: "#1565C0" }} /> Manage Filters</div>
                    <button type="button" onClick={() => setHiddenFilters(new Set())} className="flex items-center gap-1 text-[10px] cursor-pointer" style={{ color: "#1565C0" }}><RotateCcw size={10} /> Reset</button>
                  </div>
                  <div className="px-4 py-2 text-[9px] uppercase tracking-wide" style={{ color: "#6b7280", borderBottom: "1px solid #f3f4f6" }}>Toggle to show/hide filters</div>
                  <div className="max-h-56 overflow-y-auto py-1">
                  {filterControls.map(([id, label]) => {
                    const visible = !hiddenFilters.has(id);
                    return (
                      <div key={id} className="flex items-center gap-2 px-4 py-1.5" style={{ color: visible ? "#111827" : "#9ca3af", textDecoration: visible ? "none" : "line-through" }}>
                        <span className="flex-1 text-xs">{label}</span>
                        <button type="button" onClick={() => setHiddenFilters((previous) => {
                        const next = new Set(previous);
                        next.has(id) ? next.delete(id) : next.add(id);
                        return next;
                      })} className="cursor-pointer" title={visible ? "Hide filter" : "Show filter"} aria-label={visible ? `Hide ${label}` : `Show ${label}`} style={{ color: "#1565C0" }}>{visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                      </div>
                    );
                  })}
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid #e5e7eb" }}>
                    <span className="text-[9px]" style={{ color: "#6b7280" }}>{filterControls.length - hiddenFilters.size} shown · {hiddenFilters.size} hidden</span>
                    <button type="button" onClick={() => setMoreFiltersOpen(false)} className="rounded-lg px-3 py-1 text-xs cursor-pointer" style={{ backgroundColor: "#EDF5FA", color: "#374151", border: "1px solid rgba(21,101,192,0.2)" }}>Done</button>
                  </div>
                </div>
              )}
            </div>
            <span className="ml-auto text-xs shrink-0 pb-1.5" style={{ color: "#6b7280" }}>
              {filteredRows.length} of {rows.length} actions
            </span>
          </div>
        </div>

        {/* Actions list */}
        <div className={`flex-1 min-h-0 overflow-hidden ${isActionsFullscreen ? "" : "px-0"}`}>
          <ActionsTable
            rows={filteredRows}
            onDecision={handleDecision}
            hiddenColumns={hiddenColumns}
            overviewScenario={effectiveScenario}
            overviewDeviations={deviations}
            onResimulate={handleOverviewResimulate}
          />
        </div>
      </div>
    </div>
  );
}
