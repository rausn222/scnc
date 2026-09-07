import type { AcceptedScenarioDetails } from "../../App";
import type { NewProjectRecord, NewProjectStatus, Project, ProjectFilter, ProjectStatus } from "./types";

export function formatINR(value: number): string {
  if (value === 0) return "—";
  return `₹${value.toLocaleString("en-IN")}`;
}

export function filterProjects(projects: Project[], filter: ProjectFilter): Project[] {
  if (filter === "All") return projects;
  return projects.filter((p) => p.status === filter);
}

export function summarize(projects: Project[]) {
  const atRiskProjects = projects.filter((p) => p.status === "At Risk");
  const totalCbus = projects.reduce((sum, p) => sum + p.metrics.cbus, 0);
  const acceptedCbus = projects.reduce((sum, p) => sum + p.metrics.accepted, 0);
  const atRiskCbus = projects.reduce((sum, p) => sum + p.metrics.atRisk, 0);
  const valueAtRisk = projects.reduce((sum, p) => sum + p.metrics.valueAtRisk, 0);

  return {
    totalProjects: projects.length,
    atRiskProjectCount: atRiskProjects.length,
    totalCbus,
    acceptedCbus,
    atRiskCbus,
    valueAtRisk,
  };
}

export function formatDateLabel(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function makeProjectCode(existing: Project[]): string {
  const max = existing.reduce((m, p) => {
    const n = Number(p.code.replace("PROJ-", ""));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `PROJ-${String(max + 1).padStart(3, "0")}`;
}

/** Adapts a Project into the scenario shape Tracking Details expects, so each project row can link straight into execution tracking. */
export function projectToScenarioDetails(project: Project): AcceptedScenarioDetails {
  const primaryCbu = project.cbus[0];
  return {
    id: project.id,
    name: project.name,
    projectName: project.name,
    oldCbuCode: primaryCbu?.oldCode ?? null,
    newCbuCode: primaryCbu?.newCode ?? null,
    oldCbuDescription: primaryCbu?.oldDescription ?? null,
    newCbuDescription: primaryCbu?.newDescription ?? null,
    businessWaste: project.monitor.businessImpact.currentProjection,
    wasteSavings: project.monitor.businessImpact.expectedBenefit,
    wasteColor: "teal",
    fgDaysCover: null,
    nextActionPrefix: "Next:",
    nextAction: project.monitor.monitoringRule?.detail ?? project.monitor.headline,
    icon: "no-action",
    feasibleProducible: project.metrics.cbus,
    productionStopDate: project.targetEol,
    dailyRunRate: 0,
    receivingPlant: "U535",
  };
}

const NEW_STATUS_TO_PROJECT_STATUS: Record<NewProjectStatus, ProjectStatus> = {
  "Not Started": "Active",
  "In Progress": "Active",
  "On Hold": "On Hold",
  Completed: "Completed",
};

/** Adapts a record from the "Create Project" form into the richer list/monitor shape. */
export function newRecordToProject(record: NewProjectRecord, existingProjects: Project[]): Project {
  const code = makeProjectCode(existingProjects);
  return {
    id: code,
    code,
    name: record.name,
    category: record.description || "General",
    owner: record.owner || "Unassigned",
    priority: record.priority,
    status: NEW_STATUS_TO_PROJECT_STATUS[record.status],
    stage: "Initiated",
    metrics: { cbus: 0, accepted: 0, atRisk: 0, valueAtRisk: 0 },
    targetEol: formatDateLabel(record.targetDate),
    cbus: [],
    monitor: {
      degradedPercent: null,
      headline: "Project on track",
      headlineDetail: "Newly created — no execution data yet.",
      approvedScenario: "No approved scenario yet",
      businessImpact: { expectedBenefit: "—", currentProjection: "—", poFgEquiv: "—", newShortfall: "—" },
      signals: [],
    },
  };
}
