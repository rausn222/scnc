// ─── Types ────────────────────────────────────────────────────────────────────

export type ScenarioType = "IUT" | "Procurement" | "PO Cancellation";
export type ExecutionStatus = "IN PROGRESS" | "NOT STARTED" | "COMPLETED";
export type ActionStatus = "PENDING" | "INITIATED" | "IN PROGRESS" | "COMPLETED";

export interface ActionRow {
  /** Stable unique key, e.g. "1.1" */
  id: string;
  /** Unique scenario group id — one per distinct IUT/Procurement/PO Cancellation instance */
  item: number;
  /** Network this action belongs to — several scenario types can share one network */
  networkId: string;
  projectName: string;
  oldCbuCode: string;
  newCbuCode: string;
  /** 1-based sequence within its scenario type, e.g. IUT #1, IUT #2 */
  seq: number;
  scenarioType: ScenarioType;
  /** Plant route, e.g. "UTR to U535" for a transfer, or a single plant for others */
  plant: string;
  material: string;
  quantity: string;
  executionStatus: ExecutionStatus;
  actionId: string;
  description: string;
  owner: string;
  slaHrs: number;
  ageingDays: number | null;
  status: ActionStatus;
  /** true => handled automatically by SAP, no manual status change available */
  automated: boolean;
}

interface ScenarioSeed {
  scenarioType: ScenarioType;
  seq: number;
  plant: string;
  material: string;
  quantity: string;
  executionStatus: ExecutionStatus;
  steps: Array<{
    description: string;
    owner: string;
    slaHrs: number;
    ageingDays: number | null;
    status: ActionStatus;
    automated: boolean;
  }>;
}

/**
 * A manual step can only move forward: PENDING -> INITIATED, INITIATED ->
 * IN PROGRESS or COMPLETED, and IN PROGRESS -> COMPLETED.
 */
export function nextStatusOptions(status: ActionStatus): ActionStatus[] {
  switch (status) {
    case "PENDING": return ["INITIATED"];
    case "INITIATED": return ["IN PROGRESS", "COMPLETED"];
    case "IN PROGRESS": return ["COMPLETED"];
    case "COMPLETED": return [];
  }
}

// ─── Mock data (mirrors the Activity & Monitoring reference design) ──────────
// Multiple instances of the same scenario type are common (several IUT lanes,
// several Procurement requests running at once) — each is its own group with
// its own plant route, material and action trail.

/** All mock scenarios below belong to the same network — mirrors the source design. */
export const NETWORK_ID = "NET-2026-00001";

const SCENARIOS: ScenarioSeed[] = [
  {
    scenarioType: "IUT", seq: 1, plant: "UTR to U535", material: "11100345",
    quantity: "5250 KG", executionStatus: "IN PROGRESS",
    steps: [
      { description: "Share Scenario Summary", owner: "Network Planner", slaHrs: 24, ageingDays: 0, status: "COMPLETED", automated: false },
      { description: "Source Plant Approval", owner: "Source Factory Planner", slaHrs: 48, ageingDays: 1, status: "IN PROGRESS", automated: false },
      { description: "Destination Plant Approval", owner: "Destination Factory Planner", slaHrs: 48, ageingDays: 2, status: "IN PROGRESS", automated: false },
      { description: "Create Stock Transfer Order (STO)", owner: "Automated (SAP)", slaHrs: 4, ageingDays: null, status: "INITIATED", automated: true },
      { description: "Status of Dispatched Material", owner: "Automated (SAP)", slaHrs: 24, ageingDays: null, status: "PENDING", automated: true },
    ],
  },
  {
    scenarioType: "IUT", seq: 2, plant: "U535 to U886", material: "11100678",
    quantity: "3100 KG", executionStatus: "NOT STARTED",
    steps: [
      { description: "Share Scenario Summary", owner: "Network Planner", slaHrs: 24, ageingDays: null, status: "PENDING", automated: false },
      { description: "Source Plant Approval", owner: "Source Factory Planner", slaHrs: 48, ageingDays: null, status: "PENDING", automated: false },
      { description: "Destination Plant Approval", owner: "Destination Factory Planner", slaHrs: 48, ageingDays: null, status: "PENDING", automated: false },
      { description: "Create Stock Transfer Order (STO)", owner: "Automated (SAP)", slaHrs: 4, ageingDays: null, status: "PENDING", automated: true },
      { description: "Status of Dispatched Material", owner: "Automated (SAP)", slaHrs: 24, ageingDays: null, status: "PENDING", automated: true },
    ],
  },
  {
    scenarioType: "Procurement", seq: 1, plant: "UTR", material: "10045872",
    quantity: "100 Ton", executionStatus: "NOT STARTED",
    steps: [
      { description: "Share Scenario Summary", owner: "Network Planner", slaHrs: 24, ageingDays: null, status: "PENDING", automated: false },
      { description: "Vendor Confirmation", owner: "Procurement Planner", slaHrs: 48, ageingDays: null, status: "INITIATED", automated: false },
      { description: "Create Purchase Order (PO)", owner: "Automated (SAP)", slaHrs: 4, ageingDays: null, status: "PENDING", automated: true },
      { description: "Status of Inbound Material", owner: "Automated (SAP)", slaHrs: 24, ageingDays: null, status: "PENDING", automated: true },
    ],
  },
  {
    scenarioType: "Procurement", seq: 2, plant: "ULU", material: "10045903",
    quantity: "65 Ton", executionStatus: "IN PROGRESS",
    steps: [
      { description: "Share Scenario Summary", owner: "Network Planner", slaHrs: 24, ageingDays: 0, status: "IN PROGRESS", automated: false },
      { description: "Vendor Confirmation", owner: "Procurement Planner", slaHrs: 48, ageingDays: 1, status: "IN PROGRESS", automated: false },
      { description: "Create Purchase Order (PO)", owner: "Automated (SAP)", slaHrs: 4, ageingDays: null, status: "PENDING", automated: true },
      { description: "Status of Inbound Material", owner: "Automated (SAP)", slaHrs: 24, ageingDays: null, status: "PENDING", automated: true },
    ],
  },
  {
    scenarioType: "PO Cancellation", seq: 1, plant: "U535", material: "10045871",
    quantity: "50 Ton", executionStatus: "NOT STARTED",
    steps: [
      { description: "Share Scenario Summary", owner: "Network Planner", slaHrs: 24, ageingDays: null, status: "PENDING", automated: false },
      { description: "Buyer Approval", owner: "Destination Factory Planner", slaHrs: 48, ageingDays: null, status: "PENDING", automated: false },
      { description: "Cancel Purchase Order (PO)", owner: "Automated (SAP)", slaHrs: 4, ageingDays: null, status: "PENDING", automated: true },
    ],
  },
];

let actionSequence = 0;

export const ACTIONS_DATA: ActionRow[] = SCENARIOS.flatMap((scenario, itemIdx) => {
  const item = itemIdx + 1;
  return scenario.steps.map((step, stepIdx) => {
    actionSequence += 1;
    const actionId = `ACT-${String(actionSequence).padStart(5, "0")}`;
    return {
      id: actionId,
      item,
      networkId: NETWORK_ID,
      projectName: "Pack Change — South Zone",
      oldCbuCode: "VAFA1R",
      newCbuCode: "VAFG1R",
      seq: scenario.seq,
      scenarioType: scenario.scenarioType,
      plant: scenario.plant,
      material: scenario.material,
      quantity: scenario.quantity,
      executionStatus: scenario.executionStatus,
      actionId,
      ...step,
    };
  });
});

/** Combined, human-readable label for a scenario group, e.g. "IUT 2". */
export function scenarioLabel(scenarioType: ScenarioType, seq: number): string {
  return `${scenarioType} ${seq}`;
}

/** Plant route formatted with an arrow for lane-style scenarios, e.g. "UTR → U535". */
export function formatRoute(plant: string): string {
  return plant.includes(" to ") ? plant.replace(" to ", " → ") : plant;
}

/** Splits a lane-style plant route into source/destination; single-plant scenarios have no destination. */
export function splitPlant(plant: string): { source: string; destination: string } {
  if (plant.includes(" to ")) {
    const [source, destination] = plant.split(" to ");
    return { source, destination };
  }
  return { source: plant, destination: "NA" };
}

// ─── Filter option helpers ─────────────────────────────────────────────────────

export function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export const SCENARIO_TYPE_OPTIONS = ["All", ...uniqueSorted(ACTIONS_DATA.map((r) => r.scenarioType))];
export const ACTION_ID_OPTIONS = ["All", ...uniqueSorted(ACTIONS_DATA.map((r) => r.actionId))];
export const NETWORK_ID_OPTIONS = ["All", ...uniqueSorted(ACTIONS_DATA.map((r) => r.networkId))];
export const PLANT_OPTIONS = ["All", ...uniqueSorted(ACTIONS_DATA.map((r) => r.plant))];
export const MATERIAL_OPTIONS = ["All", ...uniqueSorted(ACTIONS_DATA.map((r) => r.material))];
export const OWNER_OPTIONS = ["All", ...uniqueSorted(ACTIONS_DATA.map((r) => r.owner))];
export const STATUS_OPTIONS = ["All", ...uniqueSorted(ACTIONS_DATA.map((r) => r.status))];
export const PROJECT_OPTIONS = ["All", ...uniqueSorted(ACTIONS_DATA.map((r) => r.projectName))];
export const OLD_CBU_OPTIONS = ["All", ...uniqueSorted(ACTIONS_DATA.map((r) => r.oldCbuCode))];
export const NEW_CBU_OPTIONS = ["All", ...uniqueSorted(ACTIONS_DATA.map((r) => r.newCbuCode))];

// ─── Display helpers ────────────────────────────────────────────────────────

export const STATUS_THEME: Record<ActionStatus, { bg: string; text: string; dot: string }> = {
  "PENDING": { bg: "#f3f4f6", text: "#6b7280", dot: "#9ca3af" },
  "INITIATED": { bg: "#fef3c7", text: "#b45309", dot: "#f59e0b" },
  "IN PROGRESS": { bg: "#dbeafe", text: "#1565C0", dot: "#1565C0" },
  "COMPLETED": { bg: "#e0f2f1", text: "#00695C", dot: "#00897B" },
};

export const EXECUTION_STATUS_THEME: Record<ExecutionStatus, { bg: string; text: string }> = {
  "IN PROGRESS": { bg: "#dbeafe", text: "#1565C0" },
  "NOT STARTED": { bg: "#f3f4f6", text: "#6b7280" },
  "COMPLETED": { bg: "#dcfce7", text: "#15803d" },
};

export function ageingColor(days: number | null): string {
  if (days === null) return "#9ca3af";
  if (days <= 0) return "#22c55e";
  if (days === 1) return "#f59e0b";
  return "#ef4444";
}
