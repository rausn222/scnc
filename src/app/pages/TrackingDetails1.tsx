import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { C } from "../components/actionDetails/theme";
import { buildActionTasks, type ActionTask } from "../components/actionDetails/ActionTaskList";
import { SCENARIOS } from "../components/sciDetails/constants";
import { buildActionGroups, buildDeviations, buildTrackingPhases, buildTrackingProject } from "../components/tracking/data";
import { TrackingActionsList } from "../components/tracking/TrackingActionsList";
import { TrackingOverviewSection } from "../components/tracking/TrackingOverviewSection";
import { TrackingProjectSelection, type TrackingProjectSelectionValue } from "../components/tracking/TrackingProjectSelection";
import { ProjectMonitorPanel } from "../components/projectDetails/ProjectMonitorPanel";
import type { Project } from "../components/projectDetails/types";
import { useNav, type AcceptedScenarioDetails } from "../App";

/** Default receiving plant used for a manually-picked scenario — the IUT transfer lane isn't chosen on this page, so this mirrors the fallback used elsewhere when no lane is selected. */
const DEFAULT_RECEIVING_PLANT = "U535";

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
  // Only relevant when arriving via an accepted scenario that skipped Project Name in Step 1 —
  // lets the user assign one here instead of losing that context entirely.
  const [assignedProjectName, setAssignedProjectName] = useState("");

  // When the page arrives without a scenario (e.g. the sidebar link), let the user pick a
  // project and scenario manually so the overview and action list still populate.
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
    if (!scenario.projectName && assignedProjectName) return { ...scenario, projectName: assignedProjectName };
    return scenario;
  }, [scenario, manualScenario, assignedProjectName]);
  const effectiveTasks = useMemo(() => {
    if (tasks.length > 0) return tasks;
    return effectiveScenario ? buildActionTasks(effectiveScenario) : [];
  }, [tasks, effectiveScenario]);

  const phases = useMemo(() => buildTrackingPhases(effectiveTasks, effectiveScenario), [effectiveTasks, effectiveScenario]);
  const allItems = useMemo(() => phases.flatMap((phase) => phase.items), [phases]);
  const trackingProject = useMemo(
    () => project ?? (effectiveScenario ? buildTrackingProject(effectiveScenario, allItems) : null),
    [project, effectiveScenario, allItems],
  );
  const deviations = useMemo(() => buildDeviations(allItems, effectiveScenario), [allItems, effectiveScenario]);
  const actionGroups = useMemo(() => buildActionGroups(phases, effectiveScenario), [phases, effectiveScenario]);

  function handleResimulate(projectId: string) {
    toast.success(`Re-simulating "${projectId}" with the latest signals.`);
  }

  function handleOverviewResimulate() {
    navigate({ page: "network-down-stocking-agent-trial", srNo: projectSelection?.oldSrNo });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: "#f5f7fa" }}>
      <PageHeader
        title="Activity & Monitoring"
        breadcrumbs={[
          { label: backLabel.replace(/^Back to /, ""), onClick: onBack },
          { label: "Activity & Monitoring" },
        ]}
      />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-semibold cursor-pointer"
          style={{ color: C.blue }}
        >
          <ChevronLeft size={14} />
          {backLabel}
        </button>

        <div className="grid gap-4">
          <div className="min-w-0 space-y-4">
            <TrackingProjectSelection
              scenario={scenario}
              onChange={setProjectSelection}
              assignedProjectName={assignedProjectName}
              onAssignedProjectNameChange={setAssignedProjectName}
            />

            <TrackingOverviewSection
              effectiveScenario={effectiveScenario}
              isManualMode={!scenario}
              manualScenarioId={manualScenarioId}
              onManualScenarioChange={setManualScenarioId}
              deviations={deviations}
              onResimulate={handleOverviewResimulate}
            />

            <TrackingActionsList groups={actionGroups} />
          </div>

          {/* {trackingProject ? (
            <ProjectMonitorPanel project={trackingProject} onResimulate={handleResimulate} />
          ) : (
            <div
              className="rounded-xl bg-white flex items-center justify-center text-center p-6 text-xs"
              style={{ border: "1px solid #e2e8f0", color: "#94a3b8" }}
            >
              No scenario monitor data available.
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}
