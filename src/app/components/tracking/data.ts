import type { AcceptedScenarioDetails } from "../../App";
import type { ActionTask } from "../actionDetails/ActionTaskList";
import { C } from "../actionDetails/theme";
import type { Project, ProjectStatus } from "../projectDetails/types";

export type TrackingStatus = "Completed" | "In Progress" | "Pending" | "Blocked";
export type TrackingActions = "Approve" | "Reject" | "Reassign" | "Escalate" | "Close";
export type TrackingItem = {
  title: string;
  team: string;
  teamColor: { bg: string; fg: string };
  /** The specific owner for this step (a role or named team) — distinct from `team`, which is the broader department. */
  responsible: string;
  timeline: string;
  action?: TrackingActions;
  status: TrackingStatus;
  /** Scenario-specific context shown under the title — e.g. an STO/PO reference and quantity. */
  detail?: string;
  /** Target turnaround time for this step. Dummy/placeholder until SLA policy data is wired up. */
  sla?: string;
  /** Time elapsed since the step became due, independent of `timeline`. Dummy/placeholder until aging data is wired up. */
  aging?: string;
};

export type TrackingPhase = {
  title: string;
  items: TrackingItem[];
};

export type ProjectRegistryEntry = {
  id: string;
  networkId: string;
  projectName: string;
  /** srNos into the real CBU catalogue (see components/data.ts) — supports picking more than one Old CBU, mirroring the Network Down Stocking Agent's Select CBU step. */
  oldSrNos: number[];
  newSrNos: number[];
};

/** Placeholder project catalogue backing the Project Selection search/dropdowns, until
 * Network ID and its project-to-CBU pairing are wired up to a real project registry.
 * The CBU srNos reference real rows in components/data.ts. */
export const PROJECT_REGISTRY: ProjectRegistryEntry[] = [
  {
    id: "NET-2026-00001",
    networkId: "NET-2026-00001",
    projectName: "Pack Change — South Zone",
    oldSrNos: [1], // VAFA1R
    newSrNos: [3], // VAFG1R
  },
  {
    id: "NET-2026-00002",
    networkId: "NET-2026-00002",
    projectName: "Vaseline Deep Moisture Consolidation",
    oldSrNos: [9], // VBLA2R
    newSrNos: [11], // VBLB2R
  },
  {
    id: "NET-2026-00003",
    networkId: "NET-2026-00003",
    projectName: "Vaseline Cocoa Glow Downstocking",
    oldSrNos: [21], // VBNN1R
    newSrNos: [23], // VBNS10
  },
];
export const ACTION_OPTIONS = [
  "Approve",
  "Reject",
];
const AGENTIC_OPS_TEAM = { bg: "#fce7f3", fg: "#be185d" };
const SOURCE_PLANT_TEAM = { bg: "#e0f2fe", fg: "#0369a1" };
const DESTINATION_PLANT_TEAM = { bg: "#ffedd5", fg: "#c2410c" };
const SAP_AUTOMATION_TEAM = { bg: "#e0e7ff", fg: "#4338ca" };
const SUPPLY_PLANNING_TEAM = { bg: C.bgBlue, fg: C.blue };
const PROCUREMENT_TEAM = { bg: "#fef3c7", fg: "#b45309" };
const FACTORY_PLANT_TEAM = { bg: "#ede9fe", fg: "#6d28d9" };

export function buildTrackingPhases(tasks: ActionTask[], scenario?: AcceptedScenarioDetails): TrackingPhase[] {
  if (tasks.length === 0) return [];

  // "moq" is a procurement-only scenario (no plant transfer); "iut-moq" runs both lanes
  // together; every other icon (iut, break, custom, no-action) is IUT-only.
  // Note: "break" (IUT + Break MOQ) would also touch procurement, but its procurement
  // steps are left out of the action list for now — aside from the supplier MOQ
  // exception confirmation, which still applies since the transfer itself hinges on it.
  const showIut = scenario?.icon !== "moq";
  const showProcurement = scenario?.icon === "moq" || scenario?.icon === "iut-moq";
  const isMoqBreak = scenario?.icon === "break";

  const phases: TrackingPhase[] = [
    {
      title: "Scenario Communication",
      items: [
        {
          title: "Share Scenario Summary",
          team: "Agentic Ops",
          teamColor: AGENTIC_OPS_TEAM,
          responsible: "Network Planner",
          action: 'Approve',
          timeline: "18 hrs elapsed",
          status: "In Progress",
          detail: showProcurement
            ? showIut
              ? "Email draft generated and notification sent to Factory Planners and Procurement Team."
              : "Email draft generated and notification sent to Procurement and Factory Teams."
            : "Email draft generated and notification sent to Source and Destination Factory Planners.",
          sla: "24 hrs",
          aging: "0 days",
        },
      ],
    },
  ];

  if (showIut) {
    phases.push({
      title: "Plant Approvals",
      items: [
        {
          title: "Source Plant Approval",
          team: "Source Plant",
          teamColor: SOURCE_PLANT_TEAM,
          responsible: "Source Factory Planner",
          timeline: "1 day elapsed",
          status: "In Progress",
          sla: "48 hrs",
          aging: "1 day",
        },
        {
          title: "Destination Plant Approval",
          team: "Destination Plant",
          teamColor: DESTINATION_PLANT_TEAM,
          responsible: "Destination Factory Planner",
          timeline: "6 hrs elapsed",
          status: "In Progress",
          sla: "48 hrs",
          aging: "2 days",
        },
      ],
    });
  }

  if (isMoqBreak) {
    phases.push({
      title: "MOQ Exception Handling",
      items: [
        {
          title: "MOQ Break Confirmation",
          team: "Procurement",
          teamColor: PROCUREMENT_TEAM,
          responsible: "Procurement Buyer",
          timeline: "Not started",
          status: "Pending",
          detail: "Engage supplier to validate MOQ exception, delivery commitment, surcharge implications and obtain written acceptance.",
          sla: "48 hrs",
          aging: "—",
        },
      ],
    });
  }

  if (showProcurement) {
    phases.push({
      title: "Procurement Approvals",
      items: [
        {
          title: "Procurement Approval",
          team: "Procurement",
          teamColor: PROCUREMENT_TEAM,
          responsible: "Procurement Team",
          timeline: "Not started",
          status: "Pending",
          detail: "Validate supplier contract conditions, sourcing feasibility and commercial requirements.",
          sla: "48 hrs",
          aging: "—",
        },
        {
          title: "Factory Approval",
          team: "Destination Plant",
          teamColor: FACTORY_PLANT_TEAM,
          responsible: "Factory Planner",
          timeline: "Not started",
          status: "Pending",
          detail: "Validate inventory availability, operational feasibility and material requirement.",
          sla: "48 hrs",
          aging: "—",
        },
      ],
    });
  }

  if (showIut) {
    phases.push({
      title: "Stock Transfer Execution",
      items: [
        {
          title: "Create Stock Transfer Order (STO)",
          team: "SAP Automation",
          teamColor: SAP_AUTOMATION_TEAM,
          responsible: "Automated (SAP)",
          timeline: "Not started",
          status: "Pending",
          sla: "4 hrs",
          aging: "—",
        },
        {
          title: "Status of Dispatched Material",
          team: "SAP Automation",
          teamColor: SAP_AUTOMATION_TEAM,
          responsible: "Automated (SAP)",
          timeline: "Not started",
          status: "Pending",
          sla: "24 hrs",
          aging: "—",
        },
      ],
    });
  }

  if (showProcurement) {
    phases.push({
      title: "Purchase Order Execution",
      items: [
        {
          title: "Purchase Order Creation & Execution",
          team: "SAP Automation",
          teamColor: SAP_AUTOMATION_TEAM,
          responsible: "Automated (SAP)",
          timeline: "Not started",
          status: "Pending",
          detail: "PO creation, supplier delivery, receipt, inspection and GRN tracked through SAP.",
          sla: "24 hrs",
          aging: "—",
        },
        {
          title: "Supplier Acknowledgement (Subject to Confirmation)",
          team: "Procurement",
          teamColor: PROCUREMENT_TEAM,
          responsible: "Procurement / Factory",
          timeline: "Not started",
          status: "Pending",
          detail: "Confirmation of supplier inventory availability and commitment to supply.",
          sla: "24 hrs",
          aging: "—",
        },
      ],
    });
  }

  // phases.push({
  //   title: "Deviation Handling",
  //   items: [
  //     {
  //       title: "Creation of Deviation Note",
  //       team: "Supply Planning",
  //       teamColor: SUPPLY_PLANNING_TEAM,
  //       responsible: "Supply Planner",
  //       timeline: "Not started",
  //       status: "Pending",
  //       sla: "72 hrs",
  //       aging: "—",
  //     },
  //   ],
  // });

  // Applies to every scenario type — kept last as fallback/contingency steps.
  phases.push({
    title: "Closure & Contingency Actions",
    items: [
      //     // {
      //     //   title: "Write-off of Business Waste (Process TBD)",
      //     //   team: "Destination Plant",
      //     //   teamColor: FACTORY_PLANT_TEAM,
      //     //   responsible: "Factory Planner",
      //     //   timeline: "Not started",
      //     //   status: "Pending",
      //     //   detail: "Currently limited to visibility of business waste summary; detailed write-off process to be defined.",
      //     //   sla: "—",
      //     //   aging: "—",
      //     // },
      {
        title: "Purchase Order Cancellation",
        team: "Destination Plant",
        teamColor: FACTORY_PLANT_TEAM,
        responsible: "Factory Planner",
        timeline: "Not started",
        status: "Pending",
        detail: "Initiate cancellation request with supplier where applicable.",
        sla: "—",
        aging: "—",
      },
    ],
  });

  return phases;
}

const DEVIATION_POOL = [
  "Production plan change",
  "Action item delay",
  "Sales index change",
  "Supplier inventory change",
] as const;

/** Placeholder deviation flags until real deviation detection is wired up — "Action item
 * delay" reflects an actual blocked step, the rest are a stable mock signal per scenario. */
export function buildDeviations(items: TrackingItem[], scenario?: AcceptedScenarioDetails): string[] {
  if (!scenario || scenario.icon === "no-action") return [];
  const flags = new Set<string>();
  if (items.some((item) => item.status === "Blocked")) flags.add("Action item delay");
  flags.add(DEVIATION_POOL[scenario.id.length % DEVIATION_POOL.length]);
  return DEVIATION_POOL.filter((d) => flags.has(d));
}

export type TrackingSubAction = {
  actionId: string;
  description: string;
  owner: string;
  sla: string;
  aging: string;
  action?: TrackingActions;
  status: TrackingStatus;
};

export type TrackingActionGroup = {
  itemNumber: number;
  scenarioType: string;
  plant: string;
  material: string;
  quantity: string;
  executionStatus: TrackingStatus;
  actions: TrackingSubAction[];
};

function phaseItems(phases: TrackingPhase[], title: string): TrackingItem[] {
  return phases.find((phase) => phase.title === title)?.items ?? [];
}

function aggregateStatus(items: TrackingItem[]): TrackingStatus {
  if (items.some((item) => item.status === "Blocked")) return "Blocked";
  if (items.length > 0 && items.every((item) => item.status === "Completed")) return "Completed";
  if (items.some((item) => item.status === "In Progress")) return "In Progress";
  return "Pending";
}

function toSubActions(items: TrackingItem[], groupNumber: number): TrackingSubAction[] {
  return items.map((item, i) => ({
    actionId: `${groupNumber}.${i + 1}`,
    description: item.title,
    owner: item.responsible,
    sla: item.sla ?? "—",
    aging: item.aging ?? "—",
    action: item.action ?? '—',
    status: item.status,
  }));
}

/** Groups the flat tracking phases into the scenario-type rollups (IUT, Procurement, ...)
 * shown in the Actions List — Plant/Material/Quantity are placeholders until that level of
 * detail is wired up per scenario. */
export function buildActionGroups(phases: TrackingPhase[], scenario?: AcceptedScenarioDetails): TrackingActionGroup[] {
  if (phases.length === 0) return [];

  const showIut = scenario?.icon !== "moq";
  const showProcurement = scenario?.icon === "moq" || scenario?.icon === "iut-moq" || scenario?.icon === "break";

  const groups: TrackingActionGroup[] = [];
  let n = 0;

  if (showIut) {
    n += 1;
    const items = [
      ...phaseItems(phases, "Scenario Communication"),
      ...phaseItems(phases, "Plant Approvals"),
      ...phaseItems(phases, "Stock Transfer Execution"),
    ];
    groups.push({
      itemNumber: n,
      scenarioType: "IUT",
      plant: `UTR to ${scenario?.receivingPlant ?? "U535"}`,
      material: "11100345",
      quantity: "5250 KG",
      executionStatus: aggregateStatus(items),
      actions: toSubActions(items, n),
    });
  }

  if (showProcurement) {
    n += 1;
    const items = [
      ...(showIut ? [] : phaseItems(phases, "Scenario Communication")),
      ...phaseItems(phases, "MOQ Exception Handling"),
      ...phaseItems(phases, "Procurement Approvals"),
      ...phaseItems(phases, "Purchase Order Execution"),
    ];
    groups.push({
      itemNumber: n,
      scenarioType: scenario?.icon === "break" ? "Procurement (Break MOQ)" : "Procurement",
      plant: "UTR",
      material: "10045872",
      quantity: "100 Ton",
      executionStatus: aggregateStatus(items),
      actions: toSubActions(items, n),
    });
  }

  // n += 1;
  // const closureItems = [
  //   ...phaseItems(phases, "Deviation Handling"),
  //   ...phaseItems(phases, "Closure & Contingency Actions").filter((item) => item.title.startsWith("Write-off")),
  // ];
  // groups.push({
  //   itemNumber: n,
  //   scenarioType: "Closure Actions",
  //   plant: scenario?.receivingPlant ?? "U535",
  //   material: "—",
  //   quantity: "—",
  //   executionStatus: aggregateStatus(closureItems),
  //   actions: toSubActions(closureItems, n),
  // });

  n += 1;
  const poCancelItems = phaseItems(phases, "Closure & Contingency Actions").filter((item) =>
    item.title.startsWith("Purchase Order Cancellation"),
  );
  groups.push({
    itemNumber: n,
    scenarioType: "PO Cancellation",
    plant: scenario?.receivingPlant ?? "U535",
    material: "10045871",
    quantity: "50 Ton",
    executionStatus: aggregateStatus(poCancelItems),
    actions: toSubActions(poCancelItems, n),
  });

  return groups;
}

const MONITOR_BADGE_LABEL_BY_ICON: Record<string, string> = {
  "no-action": "MONITORING",
  iut: "TRANSFER REQUIRED",
  "iut-moq": "TRANSFER + PROCUREMENT REQUIRED",
  moq: "PROCUREMENT REQUIRED",
  break: "TRANSFER REQUIRED",
  custom: "CUSTOM ACTION",
};

/** Adapts an accepted scenario + its tracking steps into the `Project` shape the
 * Project Details monitor panel expects, so tracking execution can reuse it directly. */
export function buildTrackingProject(scenario: AcceptedScenarioDetails, items: TrackingItem[]): Project {
  const total = items.length;
  const completed = items.filter((item) => item.status === "Completed").length;
  const blocked = items.filter((item) => item.status === "Blocked");
  const inProgress = items.filter((item) => item.status === "In Progress");
  const percentComplete = total ? Math.round((completed / total) * 100) : 0;
  const isDegraded = blocked.length > 0;

  const status: ProjectStatus = isDegraded ? "At Risk" : total > 0 && completed === total ? "Completed" : "Active";
  const badgeLabel = MONITOR_BADGE_LABEL_BY_ICON[scenario.icon] ?? "ACTION REQUIRED";

  return {
    id: scenario.id,
    code: scenario.id,
    name: scenario.name,
    category: badgeLabel,
    owner: "Supply Planning",
    priority: "High",
    status,
    stage: "Execution",
    metrics: { cbus: 0, accepted: 0, atRisk: 0, valueAtRisk: 0 },
    targetEol: scenario.productionStopDate,
    cbus: [],
    monitor: {
      degradedPercent: isDegraded ? percentComplete : null,
      headline: isDegraded
        ? "Execution blocked on a step"
        : total > 0 && completed === total
          ? "Execution complete"
          : "Execution on track",
      headlineDetail:
        `Transfer surplus finished goods and component stock to the receiving plant to reduce business waste` +
        `${scenario.wasteSavings ? ` by ${scenario.wasteSavings}` : ""}, extending FG cover to ${scenario.fgDaysCover ?? "—"} while keeping production active.`,
      approvedScenario: scenario.name,
      primaryDeviation: blocked[0]
        ? {
          title: `${blocked[0].title} is blocked`,
          detail: `${blocked[0].team} • ${blocked[0].responsible} — ${blocked[0].timeline}`,
        }
        : undefined,
      monitoringRule: {
        title: "Next action",
        detail: `${scenario.nextActionPrefix} ${scenario.nextAction}`,
      },
      businessImpact: {
        expectedBenefit: scenario.wasteSavings ?? "—",
        currentProjection: scenario.businessWaste ?? "—",
        poFgEquiv: `${scenario.feasibleProducible.toLocaleString("en-IN")} EA`,
        newShortfall: isDegraded ? `${blocked.length} step${blocked.length > 1 ? "s" : ""} blocked` : "None",
      },
      signals: [...blocked, ...inProgress].slice(0, 3).map((item, i) => ({
        id: `sig-${i}`,
        title: item.title,
        detail: `${item.team} • ${item.responsible}`,
        time: item.timeline,
        tone: item.status === "Blocked" ? "risk" : "watch",
      })),
    },
  };
}
