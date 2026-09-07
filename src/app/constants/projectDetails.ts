import type {
  Project,
  ProjectFilter,
  ProjectPriority,
  ProjectStatus,
  ScenarioTone,
  NewProjectStatus,
  NewProjectPriority,
} from "../components/projectDetails/types";

// ─── Theme (matches the app's navy/blue system; red is reserved for genuine risk) ─

export const C = {
  navy: "#003087",
  blue: "#1565C0",
  bgBlue: "#EFF4FB",
  /** Selected-row background — deeper than bgBlue (used for header bands) so a selected row stays visually distinct from the header. */
  selectedBlue: "#DCE8FB",
  borderBlue: "#93c5fd",
  green: "#16a34a",
  amber: "#b45309",
  slate: "#475569",
  red: "#dc2626",
};

// ─── Page chrome ────────────────────────────────────────────────────────────────

export const PAGE_TITLE = "Project Details";
export const NEW_PROJECT_LABEL = "New Project";

// ─── Filter tabs ────────────────────────────────────────────────────────────────

export const FILTER_TABS: ProjectFilter[] = ["All", "Active", "At Risk", "On Hold", "Completed"];

// ─── Priority / status visual styles ───────────────────────────────────────────
// Only "Critical" and "At Risk" map to red — everything else uses the app's
// blue/green/amber/slate palette rather than decorative red.

export const PRIORITY_STYLES: Record<ProjectPriority, { bg: string; fg: string; bar: string }> = {
  Critical: { bg: "#fee2e2", fg: C.red, bar: C.red },
  High: { bg: "#fef3c7", fg: C.amber, bar: "#f59e0b" },
  Medium: { bg: C.bgBlue, fg: C.blue, bar: C.blue },
  Low: { bg: "#f1f5f9", fg: C.slate, bar: "#94a3b8" },
};

export const STATUS_STYLES: Record<ProjectStatus, { bg: string; fg: string }> = {
  "At Risk": { bg: "#fee2e2", fg: C.red },
  Active: { bg: C.bgBlue, fg: C.blue },
  "On Hold": { bg: "#fef3c7", fg: C.amber },
  Completed: { bg: "#dcfce7", fg: C.green },
};

// ─── Top summary cards ──────────────────────────────────────────────────────────

export const SUMMARY_CARD_LABELS = {
  totalProjects: "Total Projects",
  totalCbus: "Total CBUs",
  atRisk: "At Risk",
  valueAtRisk: "Value At Risk",
};

// ─── List section ───────────────────────────────────────────────────────────────

export const LIST_COLUMN_LABELS = {
  project: "Project",
  stageProgress: "Stage Progress",
  status: "Status",
  metrics: "Metrics",
};

export const METRIC_LABELS = {
  cbus: "CBUs",
  accepted: "Accepted",
  atRisk: "At Risk",
  valueAtRisk: "Value at Risk",
  targetEol: "Target EOL",
};

// ─── CBU breakdown (expanded row) ──────────────────────────────────────────────

export const CBU_COLUMN_LABELS = {
  oldCbu: "Old CBU",
  newCbu: "→ New CBU",
  stage: "Stage",
  status: "Status",
  scenario: "Scenario",
  valueAtRisk: "Value at Risk",
};

export const DISCONTINUED_LABEL = "Discontinued";
export const NO_CBU_DATA_MESSAGE = "No CBU-level data available for this project.";

export const SCENARIO_TONE_STYLE: Record<ScenarioTone, { color: string }> = {
  positive: { color: C.green },
  watch: { color: C.amber },
};

// ─── Monitor panel ──────────────────────────────────────────────────────────────

export const MONITOR_PANEL_TITLE = "Scenario Monitor";
export const MONITOR_DIAGNOSIS_TITLE = "Diagnosis";
export const MONITOR_BUSINESS_IMPACT_TITLE = "Business Impact";
export const MONITOR_SIGNALS_TITLE = "Latest Monitored Signals";
export const MONITOR_RESIMULATE_LABEL = "Re-simulate";
export const MONITOR_ON_TRACK_HEADLINE = "Project on track";
export const MONITOR_ON_TRACK_DETAIL = "Execution is proceeding within the approved plan — no deviations flagged.";
export const MONITOR_NO_APPROVED_SCENARIO = "No approved scenario yet";

export const SIGNAL_TONE_DOT: Record<string, string> = {
  risk: C.red,
  watch: "#f59e0b",
  info: C.blue,
};

// ─── "Create project" form (unchanged from the previous page implementation) ───

export const NEW_PROJECT_STATUS_OPTIONS: NewProjectStatus[] = ["Not Started", "In Progress", "On Hold", "Completed"];
export const NEW_PROJECT_PRIORITY_OPTIONS: NewProjectPriority[] = ["Low", "Medium", "High"];
export const TEMPLATE_HEADERS = ["Project Name", "Description", "Owner", "Status", "Priority"];
export const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

// ─── Seed data ──────────────────────────────────────────────────────────────────

export const SEED_PROJECTS: Project[] = [
  {
    id: "PROJ-001",
    code: "PROJ-001",
    name: "Body Care Range Rationalisation",
    category: "Personal Care",
    owner: "Priya Sharma",
    priority: "Critical",
    status: "At Risk",
    stage: "Execution",
    metrics: { cbus: 4, accepted: 2, atRisk: 1, valueAtRisk: 177540 },
    targetEol: "31 Aug 2026",
    cbus: [
      {
        id: "PROJ-001-1",
        oldCode: "VCBL190",
        oldDescription: "VitaCare Body Lotion 190ml",
        newCode: "VCBL250",
        newDescription: "VitaCare Body Lotion 250ml (Reformulated)",
        stage: "Execution",
        status: "Active",
        scenario: "Accelerated Production",
        scenarioTone: "positive",
        valueAtRisk: 41240,
      },
      {
        id: "PROJ-001-2",
        oldCode: "VCBL90",
        oldDescription: "VitaCare Body Lotion 90ml",
        newCode: null,
        newDescription: null,
        stage: "Accepted",
        status: "At Risk",
        scenario: "Defoil Date Analysis",
        scenarioTone: "watch",
        valueAtRisk: 112500,
      },
      {
        id: "PROJ-001-3",
        oldCode: "VCBT300",
        oldDescription: "VitaCare Body Butter 300ml",
        newCode: "VCBT350",
        newDescription: "VitaCare Body Butter 350ml Premium",
        stage: "Execution",
        status: "Active",
        scenario: "Stock + Open POs",
        scenarioTone: "positive",
        valueAtRisk: 23800,
      },
      {
        id: "PROJ-001-4",
        oldCode: "VCBS400",
        oldDescription: "VitaCare Body Spray 400ml",
        newCode: "VCBS450",
        newDescription: "VitaCare Body Spray 450ml (Reformulated)",
        stage: "Initiated",
        status: "Active",
        scenario: null,
        scenarioTone: null,
        valueAtRisk: 0,
        srNo: 1,
      },
    ],
    monitor: {
      degradedPercent: 74,
      headline: "Project degraded",
      headlineDetail: "Execution progressing, but approved outcome is no longer fully protected.",
      approvedScenario: "Full Plan Fulfillment",
      primaryDeviation: {
        title: "Croda PO delivery delayed 3 weeks",
        detail:
          "FH5H300 open PO from Croda International Delivery rescheduled 3 weeks post-defol date, turning a committed input into a write-off risk.",
      },
      monitoringRule: {
        title: "Monitoring rule triggered",
        detail:
          "If any committed open PO delivery date slips past the defol date, the product material can no longer be used in production and the impacted FG producible quantity must be recalculated.",
      },
      decisionWindow: {
        days: 12,
        detail: "Planner intervention recommended within 12 days to protect the scenario outcome.",
      },
      businessImpact: {
        expectedBenefit: "₹8.2L",
        currentProjection: "₹6.1L",
        poFgEquiv: "58,667 EA 0 EA (delayed)",
        newShortfall: "+50,667 units",
      },
      signals: [
        {
          id: "s1",
          title: "PO delivery date rescheduled",
          detail: "Croda PO-48021: ETA moved from 01-Sep to 22-Sep — past defol date.",
          time: "5h ago",
          tone: "risk",
        },
        {
          id: "s2",
          title: "Demand plan revised upward",
          detail: "Key account FHSH300 offtake revised +6% for Q3 — tightens buffer further.",
          time: "1d ago",
          tone: "watch",
        },
        {
          id: "s3",
          title: "Finance approval pending",
          detail: "IL approval sign-off not yet received — blocking STO creation.",
          time: "1d ago",
          tone: "info",
        },
      ],
    },
  },
  {
    id: "PROJ-002",
    code: "PROJ-002",
    name: "Hair Care Portfolio Streamline",
    category: "Beauty & Wellbeing",
    owner: "Ananya Krishnan",
    priority: "High",
    status: "Active",
    stage: "Accepted",
    metrics: { cbus: 2, accepted: 1, atRisk: 0, valueAtRisk: 68000 },
    targetEol: "30 Sept 2026",
    cbus: [
      {
        id: "PROJ-002-1",
        oldCode: "HCSH250",
        oldDescription: "Hair Serum Shine 250ml",
        newCode: "HCSH280",
        newDescription: "Hair Serum Shine 280ml (Reformulated)",
        stage: "Accepted",
        status: "Active",
        scenario: "Full Plan Fulfillment",
        scenarioTone: "positive",
        valueAtRisk: 40000,
      },
      {
        id: "PROJ-002-2",
        oldCode: "HCCN180",
        oldDescription: "Hair Conditioner 180ml",
        newCode: "HCCN180",
        newDescription: "Hair Conditioner 180ml (Repack)",
        stage: "Accepted",
        status: "Active",
        scenario: "Repack Only",
        scenarioTone: "positive",
        valueAtRisk: 28000,
      },
    ],
    monitor: {
      degradedPercent: 74,
      headline: "Project degraded",
      headlineDetail: "Execution progressing, but approved outcome is no longer fully protected.",
      approvedScenario: "Full Plan Fulfillment",
      primaryDeviation: {
        title: "Croda PO delivery delayed 3 weeks",
        detail:
          "FH5H300 open PO from Croda International Delivery rescheduled 3 weeks post-defol date, turning a committed input into a write-off risk.",
      },
      monitoringRule: {
        title: "Monitoring rule triggered",
        detail:
          "If any committed open PO delivery date slips past the defol date, the product material can no longer be used in production and the impacted FG producible quantity must be recalculated.",
      },
      decisionWindow: {
        days: 12,
        detail: "Planner intervention recommended within 12 days to protect the scenario outcome.",
      },
      businessImpact: {
        expectedBenefit: "₹8.2L",
        currentProjection: "₹6.1L",
        poFgEquiv: "58,667 EA 0 EA (delayed)",
        newShortfall: "+50,667 units",
      },
      signals: [
        {
          id: "s1",
          title: "PO delivery date rescheduled",
          detail: "Croda PO-48021: ETA moved from 01-Sep to 22-Sep — past defol date.",
          time: "5h ago",
          tone: "risk",
        },
        {
          id: "s2",
          title: "Demand plan revised upward",
          detail: "Key account FHSH300 offtake revised +6% for Q3 — tightens buffer further.",
          time: "1d ago",
          tone: "watch",
        },
        {
          id: "s3",
          title: "Finance approval pending",
          detail: "IL approval sign-off not yet received — blocking STO creation.",
          time: "1d ago",
          tone: "info",
        },
      ],
    },
  },
  {
    id: "PROJ-003",
    code: "PROJ-003",
    name: "Nutrition Bar Vegan Reformulation",
    category: "Foods",
    owner: "Vikram Bose",
    priority: "Critical",
    status: "At Risk",
    stage: "Initiated",
    metrics: { cbus: 2, accepted: 0, atRisk: 2, valueAtRisk: 302500 },
    targetEol: "31 Oct 2026",
    cbus: [
      {
        id: "PROJ-003-1",
        oldCode: "NTBR120",
        oldDescription: "Nutrition Bar Classic 120g",
        newCode: null,
        newDescription: null,
        stage: "Initiated",
        status: "At Risk",
        scenario: "Vendor Re-Qualification",
        scenarioTone: "watch",
        valueAtRisk: 152500,
      },
      {
        id: "PROJ-003-2",
        oldCode: "NTBR150",
        oldDescription: "Nutrition Bar Protein 150g",
        newCode: "NTBR150V",
        newDescription: "Nutrition Bar Protein 150g (Vegan)",
        stage: "Initiated",
        status: "At Risk",
        scenario: "Vendor Re-Qualification",
        scenarioTone: "watch",
        valueAtRisk: 150000,
      },
    ],
    monitor: {
      degradedPercent: 41,
      headline: "Project degraded",
      headlineDetail: "Scenario not yet accepted — two CBUs are flagged at risk before initiation is complete.",
      approvedScenario: "No approved scenario yet",
      primaryDeviation: {
        title: "Vegan-certified emulsifier unavailable from primary vendor",
        detail: "Primary vendor withdrew certification; sourcing team evaluating two alternate suppliers.",
      },
      monitoringRule: {
        title: "Monitoring rule triggered",
        detail: "If a formulation-critical RM has no certified alternate within 30 days, the Initiated stage is blocked.",
      },
      decisionWindow: {
        days: 6,
        detail: "Planner intervention recommended within 6 days to keep the target EOL date achievable.",
      },
      businessImpact: {
        expectedBenefit: "₹4.5L",
        currentProjection: "₹1.2L",
        poFgEquiv: "0 EA",
        newShortfall: "+18,200 units",
      },
      signals: [
        {
          id: "s1",
          title: "Vendor certification withdrawn",
          detail: "Emulsifier vendor pulled vegan certification pending re-audit.",
          time: "2d ago",
          tone: "risk",
        },
        {
          id: "s2",
          title: "Alternate supplier sample requested",
          detail: "Sourcing requested trial samples from two alternate suppliers.",
          time: "2d ago",
          tone: "info",
        },
      ],
    },
  },
  {
    id: "PROJ-004",
    code: "PROJ-004",
    name: "Skincare Classics Reformulation Wave",
    category: "Beauty & Wellbeing",
    owner: "Meera Pillai",
    priority: "High",
    status: "Active",
    stage: "Monitor",
    metrics: { cbus: 4, accepted: 4, atRisk: 0, valueAtRisk: 57670 },
    targetEol: "31 Jul 2026",
    cbus: [
      {
        id: "PROJ-004-1",
        oldCode: "SKCL50",
        oldDescription: "Skin Classic Cream 50g",
        newCode: "SKCL50R",
        newDescription: "Skin Classic Cream 50g (Reformulated)",
        stage: "Monitor",
        status: "Active",
        scenario: "Full Plan Fulfillment",
        scenarioTone: "positive",
        valueAtRisk: 18670,
      },
      {
        id: "PROJ-004-2",
        oldCode: "SKCL100",
        oldDescription: "Skin Classic Cream 100g",
        newCode: "SKCL100R",
        newDescription: "Skin Classic Cream 100g (Reformulated)",
        stage: "Monitor",
        status: "Active",
        scenario: "Full Plan Fulfillment",
        scenarioTone: "positive",
        valueAtRisk: 15000,
      },
      {
        id: "PROJ-004-3",
        oldCode: "SKTN200",
        oldDescription: "Skin Toner 200ml",
        newCode: "SKTN200R",
        newDescription: "Skin Toner 200ml (Reformulated)",
        stage: "Monitor",
        status: "Active",
        scenario: "Full Plan Fulfillment",
        scenarioTone: "positive",
        valueAtRisk: 14000,
      },
      {
        id: "PROJ-004-4",
        oldCode: "SKSR30",
        oldDescription: "Skin Serum 30ml",
        newCode: "SKSR30R",
        newDescription: "Skin Serum 30ml (Reformulated)",
        stage: "Monitor",
        status: "Active",
        scenario: "Full Plan Fulfillment",
        scenarioTone: "positive",
        valueAtRisk: 10000,
      },
    ],
    monitor: {
      degradedPercent: null,
      headline: "Project on track",
      headlineDetail: "All 4 CBUs accepted and executing to plan — no deviations flagged.",
      approvedScenario: "Full Plan Fulfillment",
      businessImpact: {
        expectedBenefit: "₹57,670",
        currentProjection: "₹57,670",
        poFgEquiv: "On schedule",
        newShortfall: "None",
      },
      signals: [
        {
          id: "s1",
          title: "Monitoring checkpoint passed",
          detail: "All open POs confirmed within defol window for this cycle.",
          time: "3d ago",
          tone: "info",
        },
      ],
    },
  },
  {
    id: "PROJ-005",
    code: "PROJ-005",
    name: "Premium Serum Range Transition",
    category: "Beauty & Wellbeing",
    owner: "Meera Pillai",
    priority: "Medium",
    status: "Active",
    stage: "Accepted",
    metrics: { cbus: 2, accepted: 2, atRisk: 0, valueAtRisk: 18200 },
    targetEol: "15 Oct 2026",
    cbus: [
      {
        id: "PROJ-005-1",
        oldCode: "PSRM30",
        oldDescription: "Premium Serum 30ml",
        newCode: "PSRM30P",
        newDescription: "Premium Serum 30ml (Premium Pack)",
        stage: "Accepted",
        status: "Active",
        scenario: "Full Plan Fulfillment",
        scenarioTone: "positive",
        valueAtRisk: 10200,
      },
      {
        id: "PROJ-005-2",
        oldCode: "PSRM50",
        oldDescription: "Premium Serum 50ml",
        newCode: "PSRM50P",
        newDescription: "Premium Serum 50ml (Premium Pack)",
        stage: "Accepted",
        status: "Active",
        scenario: "Full Plan Fulfillment",
        scenarioTone: "positive",
        valueAtRisk: 8000,
      },
    ],
    monitor: {
      degradedPercent: null,
      headline: "Project on track",
      headlineDetail: "Both CBUs accepted — execution has not yet started.",
      approvedScenario: "Full Plan Fulfillment",
      businessImpact: {
        expectedBenefit: "₹18,200",
        currentProjection: "₹18,200",
        poFgEquiv: "Not yet due",
        newShortfall: "None",
      },
      signals: [
        {
          id: "s1",
          title: "Scenario accepted",
          detail: "Planner accepted the proposed scenario for both CBUs.",
          time: "4d ago",
          tone: "info",
        },
      ],
    },
  },
  {
    id: "PROJ-006",
    code: "PROJ-006",
    name: "Personal Care Entry Delisting",
    category: "Personal Care",
    owner: "Priya Sharma",
    priority: "Low",
    status: "Completed",
    stage: "Monitor",
    metrics: { cbus: 2, accepted: 2, atRisk: 0, valueAtRisk: 0 },
    targetEol: "—",
    cbus: [
      {
        id: "PROJ-006-1",
        oldCode: "PCE100",
        oldDescription: "Personal Care Entry 100ml",
        newCode: null,
        newDescription: null,
        stage: "Monitor",
        status: "Completed",
        scenario: "Delisting Complete",
        scenarioTone: "positive",
        valueAtRisk: 0,
      },
      {
        id: "PROJ-006-2",
        oldCode: "PCE150",
        oldDescription: "Personal Care Entry 150ml",
        newCode: null,
        newDescription: null,
        stage: "Monitor",
        status: "Completed",
        scenario: "Delisting Complete",
        scenarioTone: "positive",
        valueAtRisk: 0,
      },
    ],
    monitor: {
      degradedPercent: null,
      headline: "Project on track",
      headlineDetail: "Delisting completed — both CBUs closed out with no residual risk.",
      approvedScenario: "Full Plan Fulfillment",
      businessImpact: {
        expectedBenefit: "—",
        currentProjection: "—",
        poFgEquiv: "—",
        newShortfall: "—",
      },
      signals: [],
    },
  },
];
