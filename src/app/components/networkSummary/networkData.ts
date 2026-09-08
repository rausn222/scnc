// ─── Shared table layout ────────────────────────────────────────────────────────

/** Width of the sticky first column, shared by the main table and the expanded CBU breakdown so their dividers line up. */
export const STICKY_COL_WIDTH = 220;
export const STICKY_COL_DIVIDER = "1px solid #cbd5e1";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NetworkStatus = "Active" | "Complete" | "Draft" | "At Risk";
export type BusinessGroup = "Personal Care" | "Beauty & Wellbeing" | "Foods" | "Home Care";
export type DeviationStatus = "Completed" | "In Progress" | "Pending" | "Blocked";

export interface DeviationActionItem {
  actionId: string;
  description: string;
  owner: string;
  status: DeviationStatus;
}

export interface NetworkCbuMapping {
  id: string;
  oldCode: string;
  oldDescription: string;
  /** Null when the old CBU is discontinued rather than replaced. */
  newCode: string | null;
  newDescription: string | null;
  status: NetworkStatus;
  valueAtRisk: number;
}

export interface NetworkRow {
  networkId: string;
  projectName: string;
  bg: BusinessGroup;
  bgTransition: boolean;
  status: NetworkStatus;
  selectedScenario: string;
  oldCbuCount: number;
  businessWaste: number | null;
  savings: number | null;
  totalCost: number | null;
  benefit: string;
  productionStopDate: string;
  deviationCount: number | null;
  deviationDetails?: DeviationActionItem[];
  /** Execution progress, 0-100 — considers total vs. completed actions across the network's CBUs. */
  progressPct: number;
  cbus: NetworkCbuMapping[];
}

// ─── Mock data (mirrors the Excel "Network details" reference sheet) ────────

export const NETWORK_DATA: NetworkRow[] = [
  {
    networkId: "NET-2026-00001",
    projectName: "Vaseline Downstocking",
    bg: "Personal Care",
    bgTransition: true,
    status: "Active",
    selectedScenario: "IUT + Procurement (Break MOQ)",
    oldCbuCount: 10,
    businessWaste: 2456,
    savings: 1800,
    totalCost: 1000,
    benefit: "-",
    productionStopDate: "28-09-2026",
    deviationCount: null,
    progressPct: 62,
    cbus: [
      // One old CBU → one new CBU
      {
        id: "NET-2026-00001-1",
        oldCode: "VAFA1R",
        oldDescription: "Vaseline Aloe Fresh 100ml",
        newCode: "VAFG1R",
        newDescription: "Vaseline Aloe Fresh 100ml (Reformulated)",
        status: "Active",
        valueAtRisk: 820,
      },
      // Many old CBUs → one new CBU (both pack variants consolidate into a single SKU)
      {
        id: "NET-2026-00001-2a",
        oldCode: "VBLA2R",
        oldDescription: "Vaseline Deep Moisture 200ml",
        newCode: "VBLB2R",
        newDescription: "Vaseline Deep Moisture 200ml (Reformulated)",
        status: "Active",
        valueAtRisk: 600,
      },
      {
        id: "NET-2026-00001-2b",
        oldCode: "VBLC2R",
        oldDescription: "Vaseline Deep Moisture 200ml (Twin Pack)",
        newCode: "VBLB2R",
        newDescription: "Vaseline Deep Moisture 200ml (Reformulated)",
        status: "Active",
        valueAtRisk: 340,
      },
      // One old CBU → many new CBUs (splits into a reformulated pack plus a new travel size)
      {
        id: "NET-2026-00001-3a",
        oldCode: "VBNN1R",
        oldDescription: "Vaseline Cocoa Glow 100ml",
        newCode: "VBNF1R",
        newDescription: "Vaseline Cocoa Glow 100ml (Reformulated)",
        status: "At Risk",
        valueAtRisk: 450,
      },
      {
        id: "NET-2026-00001-3b",
        oldCode: "VBNN1R",
        oldDescription: "Vaseline Cocoa Glow 100ml",
        newCode: "VBNG1R",
        newDescription: "Vaseline Cocoa Glow 50ml (Travel Size)",
        status: "At Risk",
        valueAtRisk: 246,
      },
      // One old CBU → none (discontinued, no replacement)
      {
        id: "NET-2026-00001-4",
        oldCode: "VBPJ1R",
        oldDescription: "Vaseline Pure Petroleum Jelly 50g",
        newCode: null,
        newDescription: null,
        status: "At Risk",
        valueAtRisk: 150,
      },
    ],
  },
  {
    networkId: "NET-2026-00002",
    projectName: "Vaseline Downstocking",
    bg: "Personal Care",
    bgTransition: true,
    status: "Complete",
    selectedScenario: "No action",
    oldCbuCount: 5,
    businessWaste: 1500,
    savings: 0,
    totalCost: 0,
    benefit: "—",
    productionStopDate: "30-09-2026",
    deviationCount: null,
    progressPct: 100,
    cbus: [
      {
        id: "NET-2026-00002-1",
        oldCode: "VCRM50",
        oldDescription: "Vaseline Cream 50ml",
        newCode: null,
        newDescription: null,
        status: "Complete",
        valueAtRisk: 0,
      },
      {
        id: "NET-2026-00002-2",
        oldCode: "VCRM100",
        oldDescription: "Vaseline Cream 100ml",
        newCode: null,
        newDescription: null,
        status: "Complete",
        valueAtRisk: 0,
      },
    ],
  },
  {
    networkId: "DRF-2026-00001",
    projectName: "Vaseline Downstocking",
    bg: "Personal Care",
    bgTransition: true,
    status: "Draft",
    selectedScenario: "Not yet selected",
    oldCbuCount: 2,
    businessWaste: null,
    savings: null,
    totalCost: null,
    benefit: "—",
    productionStopDate: "—",
    deviationCount: null,
    progressPct: 0,
    cbus: [
      {
        id: "DRF-2026-00001-1",
        oldCode: "VLIP4G",
        oldDescription: "Vaseline Lip Therapy 4g",
        newCode: null,
        newDescription: null,
        status: "Draft",
        valueAtRisk: 0,
      },
      {
        id: "DRF-2026-00001-2",
        oldCode: "VLIP7G",
        oldDescription: "Vaseline Lip Therapy 7g",
        newCode: null,
        newDescription: null,
        status: "Draft",
        valueAtRisk: 0,
      },
    ],
  },
  {
    networkId: "NET-2026-00003",
    projectName: "—",
    bg: "Personal Care",
    bgTransition: true,
    status: "At Risk",
    selectedScenario: "Procurement",
    oldCbuCount: 4,
    businessWaste: 10500,
    savings: 6200,
    totalCost: 2500,
    benefit: "—",
    productionStopDate: "20-10-2026",
    deviationCount: 2,
    deviationDetails: [
      {
        actionId: "DEV-00003-1",
        description: "Production plan change at destination plant",
        owner: "Destination Factory Planner",
        status: "Blocked",
      },
      {
        actionId: "DEV-00003-2",
        description: "Action item delay — Source Plant Approval overdue",
        owner: "Source Factory Planner",
        status: "In Progress",
      },
    ],
    progressPct: 35,
    cbus: [
      {
        id: "NET-2026-00003-1",
        oldCode: "PCR200",
        oldDescription: "Personal Care Range 200ml",
        newCode: "PCR250",
        newDescription: "Personal Care Range 250ml (Reformulated)",
        status: "At Risk",
        valueAtRisk: 6200,
      },
      {
        id: "NET-2026-00003-2",
        oldCode: "PCR400",
        oldDescription: "Personal Care Range 400ml",
        newCode: null,
        newDescription: null,
        status: "At Risk",
        valueAtRisk: 4300,
      },
    ],
  },
  {
    networkId: "NET-2026-00004",
    projectName: "Hair Care Portfolio Streamline",
    bg: "Beauty & Wellbeing",
    bgTransition: false,
    status: "Active",
    selectedScenario: "IUT",
    oldCbuCount: 2,
    businessWaste: 800,
    savings: 500,
    totalCost: 400,
    benefit: "—",
    productionStopDate: "30-09-2026",
    deviationCount: null,
    progressPct: 78,
    cbus: [
      {
        id: "NET-2026-00004-1",
        oldCode: "HCSH250",
        oldDescription: "Hair Serum Shine 250ml",
        newCode: "HCSH280",
        newDescription: "Hair Serum Shine 280ml (Reformulated)",
        status: "Active",
        valueAtRisk: 500,
      },
    ],
  },
  {
    networkId: "NET-2026-00005",
    projectName: "Nutrition Bar Vegan Reformulation",
    bg: "Foods",
    bgTransition: true,
    status: "At Risk",
    selectedScenario: "Procurement",
    oldCbuCount: 2,
    businessWaste: 6200,
    savings: 3900,
    totalCost: 3100,
    benefit: "—",
    productionStopDate: "31-10-2026",
    deviationCount: 3,
    deviationDetails: [
      {
        actionId: "DEV-00005-1",
        description: "Sales index change impacting demand forecast",
        owner: "Supply Planner",
        status: "In Progress",
      },
      {
        actionId: "DEV-00005-2",
        description: "Supplier inventory change — MOQ exception pending",
        owner: "Procurement Buyer",
        status: "Pending",
      },
      {
        actionId: "DEV-00005-3",
        description: "Action item delay — Procurement Approval overdue",
        owner: "Procurement Team",
        status: "Blocked",
      },
    ],
    progressPct: 28,
    cbus: [
      {
        id: "NET-2026-00005-1",
        oldCode: "NTBR120",
        oldDescription: "Nutrition Bar Classic 120g",
        newCode: null,
        newDescription: null,
        status: "At Risk",
        valueAtRisk: 2300,
      },
      {
        id: "NET-2026-00005-2",
        oldCode: "NTBR150",
        oldDescription: "Nutrition Bar Protein 150g",
        newCode: "NTBR150V",
        newDescription: "Nutrition Bar Protein 150g (Vegan)",
        status: "At Risk",
        valueAtRisk: 1600,
      },
    ],
  },
  {
    networkId: "NET-2026-00006",
    projectName: "Skincare Classics Reformulation Wave",
    bg: "Beauty & Wellbeing",
    bgTransition: false,
    status: "Complete",
    selectedScenario: "No action",
    oldCbuCount: 4,
    businessWaste: 1350,
    savings: 0,
    totalCost: 0,
    benefit: "—",
    productionStopDate: "31-07-2026",
    deviationCount: null,
    progressPct: 100,
    cbus: [
      {
        id: "NET-2026-00006-1",
        oldCode: "SKCL50",
        oldDescription: "Skin Classic Cream 50g",
        newCode: "SKCL50R",
        newDescription: "Skin Classic Cream 50g (Reformulated)",
        status: "Complete",
        valueAtRisk: 800,
      },
      {
        id: "NET-2026-00006-2",
        oldCode: "SKCL100",
        oldDescription: "Skin Classic Cream 100g",
        newCode: "SKCL100R",
        newDescription: "Skin Classic Cream 100g (Reformulated)",
        status: "Complete",
        valueAtRisk: 550,
      },
    ],
  },
  {
    networkId: "NET-2026-00007",
    projectName: "Premium Serum Range Transition",
    bg: "Beauty & Wellbeing",
    bgTransition: false,
    status: "Active",
    selectedScenario: "IUT + Procurement",
    oldCbuCount: 2,
    businessWaste: 1200,
    savings: 950,
    totalCost: 600,
    benefit: "—",
    productionStopDate: "15-10-2026",
    deviationCount: null,
    progressPct: 55,
    cbus: [
      {
        id: "NET-2026-00007-1",
        oldCode: "PSRM30",
        oldDescription: "Premium Serum 30ml",
        newCode: "PSRM30P",
        newDescription: "Premium Serum 30ml (Premium Pack)",
        status: "Active",
        valueAtRisk: 950,
      },
    ],
  },
  {
    networkId: "DRF-2026-00002",
    projectName: "Home Care Bundle Rationalisation",
    bg: "Home Care",
    bgTransition: true,
    status: "Draft",
    selectedScenario: "Not yet selected",
    oldCbuCount: 3,
    businessWaste: null,
    savings: null,
    totalCost: null,
    benefit: "—",
    productionStopDate: "—",
    deviationCount: null,
    progressPct: 0,
    cbus: [
      {
        id: "DRF-2026-00002-1",
        oldCode: "HCBN500",
        oldDescription: "Home Care Bundle 500ml",
        newCode: null,
        newDescription: null,
        status: "Draft",
        valueAtRisk: 0,
      },
      {
        id: "DRF-2026-00002-2",
        oldCode: "HCBN1L",
        oldDescription: "Home Care Bundle 1L",
        newCode: null,
        newDescription: null,
        status: "Draft",
        valueAtRisk: 0,
      },
    ],
  },
  {
    networkId: "NET-2026-00008",
    projectName: "Body Care Range Rationalisation",
    bg: "Personal Care",
    bgTransition: true,
    status: "Active",
    selectedScenario: "Procurement",
    oldCbuCount: 4,
    businessWaste: 1900,
    savings: 1400,
    totalCost: 950,
    benefit: "—",
    productionStopDate: "31-08-2026",
    deviationCount: 1,
    deviationDetails: [
      {
        actionId: "DEV-00008-1",
        description: "Production plan change at source plant",
        owner: "Factory Planner",
        status: "In Progress",
      },
    ],
    progressPct: 82,
    cbus: [
      {
        id: "NET-2026-00008-1",
        oldCode: "VCBL190",
        oldDescription: "VitaCare Body Lotion 190ml",
        newCode: "VCBL250",
        newDescription: "VitaCare Body Lotion 250ml (Reformulated)",
        status: "Active",
        valueAtRisk: 1400,
      },
    ],
  },
];

export const STATUS_OPTIONS = ["All", "Active", "Complete", "Draft", "At Risk"];
export const BG_OPTIONS = [
  "All",
  ...Array.from(new Set(NETWORK_DATA.map((r) => r.bg))),
];
export const SCENARIO_OPTIONS = [
  "All",
  ...Array.from(new Set(NETWORK_DATA.map((r) => r.selectedScenario))),
];

export function statusColor(status: NetworkStatus): { bg: string; text: string } {
  switch (status) {
    case "Active":
      return { bg: "#dbeafe", text: "#1565C0" };
    case "Complete":
      return { bg: "#dcfce7", text: "#15803d" };
    case "Draft":
      return { bg: "#f3f4f6", text: "#6b7280" };
    case "At Risk":
      return { bg: "#fee2e2", text: "#b91c1c" };
  }
}

export function deviationStatusColor(status: DeviationStatus): { bg: string; text: string } {
  switch (status) {
    case "Completed":
      return { bg: "#dcfce7", text: "#15803d" };
    case "In Progress":
      return { bg: "#dbeafe", text: "#1565C0" };
    case "Pending":
      return { bg: "#f3f4f6", text: "#6b7280" };
    case "Blocked":
      return { bg: "#fee2e2", text: "#b91c1c" };
  }
}

export function fmtMoney(n: number | null): string {
  if (n === null) return "—";
  if (n === 0) return "0";
  return `₹${n.toLocaleString("en-IN")}`;
}

/** Business-waste-vs-"No action" comparison tier, mirroring the Scenario Comparison
 * report's reduction-percentage color coding (>=40% teal / 20-39% amber / <20% red). */
export function wasteComparisonColor(businessWaste: number | null, savings: number | null): string {
  const waste = businessWaste ?? 0;
  const saved = savings ?? 0;
  if (saved <= 0) return "#b91c1c";
  const noActionWaste = waste + saved;
  const pct = noActionWaste > 0 ? (saved / noActionWaste) * 100 : 0;
  if (pct >= 40) return "#00695C";
  if (pct >= 20) return "#b45309";
  return "#b91c1c";
}
