// ─── Shared types for the Project Details page ────────────────────────────────

export type ProjectPriority = "Critical" | "High" | "Medium" | "Low";
export type ProjectStatus = "At Risk" | "Active" | "On Hold" | "Completed";
export type ProjectFilter = "All" | "Active" | "At Risk" | "On Hold" | "Completed";

export const PROJECT_STAGES = ["Initiated", "Accepted", "Planning", "Execution", "Monitor"] as const;
export type ProjectStage = (typeof PROJECT_STAGES)[number];

export interface ProjectMetrics {
  cbus: number;
  accepted: number;
  atRisk: number;
  valueAtRisk: number;
}

export type SignalTone = "risk" | "watch" | "info";

export interface MonitorSignal {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: SignalTone;
}

export interface MonitorNote {
  title: string;
  detail: string;
}

export interface ProjectMonitor {
  /** Null when the project has nothing degraded to show a gauge for. */
  degradedPercent: number | null;
  headline: string;
  headlineDetail: string;
  approvedScenario: string;
  primaryDeviation?: MonitorNote;
  monitoringRule?: MonitorNote;
  decisionWindow?: { days: number; detail: string };
  businessImpact: {
    expectedBenefit: string;
    currentProjection: string;
    poFgEquiv: string;
    newShortfall: string;
  };
  signals: MonitorSignal[];
}

export type ScenarioTone = "positive" | "watch";

export interface ProjectCbu {
  id: string;
  oldCode: string;
  oldDescription: string;
  /** Null when the old CBU is discontinued rather than replaced. */
  newCode: string | null;
  newDescription: string | null;
  stage: ProjectStage;
  status: ProjectStatus;
  /** Null when no scenario has been simulated/selected for this CBU yet. */
  scenario: string | null;
  scenarioTone: ScenarioTone | null;
  valueAtRisk: number;
  /** CBU srNo to jump to in the Network Down Stocking Agent — required once `scenario` is null, so "Simulate Scenarios" has somewhere to send the user. */
  srNo?: number;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  category: string;
  owner: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  stage: ProjectStage;
  metrics: ProjectMetrics;
  targetEol: string;
  monitor: ProjectMonitor;
  cbus: ProjectCbu[];
}

// ─── "Create project" form types (unchanged behaviour, moved from the page) ───

export type NewProjectStatus = "Not Started" | "In Progress" | "On Hold" | "Completed";
export type NewProjectPriority = "Low" | "Medium" | "High";

export interface ProjectCbuTransition {
  id: string;
  oldCodes: string[];
  newCodes: string[];
  discontinued: boolean;
}

export interface NewProjectRecord {
  id: string;
  name: string;
  description: string;
  owner: string;
  startDate: string;
  targetDate: string;
  status: NewProjectStatus;
  priority: NewProjectPriority;
  transitions: ProjectCbuTransition[];
  source: "Manual" | "Excel";
  createdAt: string;
}

export type ParsedProjectRow = Omit<NewProjectRecord, "id" | "source" | "createdAt">;
