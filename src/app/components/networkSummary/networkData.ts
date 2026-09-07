// ─── Types ────────────────────────────────────────────────────────────────────

export type NetworkStatus = "Active" | "Complete" | "Draft" | "At Risk";
export type BusinessGroup = "Personal Care" | "Beauty & Wellbeing" | "Foods" | "Home Care";

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
    productionStopDate: "28th Sept 2026",
    deviationCount: null,
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
    savings: 1200,
    totalCost: 0,
    benefit: "—",
    productionStopDate: "30th Sept 2026",
    deviationCount: null,
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
    productionStopDate: "20th Oct 2026",
    deviationCount: 2,
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
    productionStopDate: "30th Sept 2026",
    deviationCount: null,
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
    productionStopDate: "31st Oct 2026",
    deviationCount: 3,
  },
  {
    networkId: "NET-2026-00006",
    projectName: "Skincare Classics Reformulation Wave",
    bg: "Beauty & Wellbeing",
    bgTransition: false,
    status: "Complete",
    selectedScenario: "No action",
    oldCbuCount: 4,
    businessWaste: 0,
    savings: 0,
    totalCost: 0,
    benefit: "—",
    productionStopDate: "31st Jul 2026",
    deviationCount: null,
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
    productionStopDate: "15th Oct 2026",
    deviationCount: null,
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
    productionStopDate: "31st Aug 2026",
    deviationCount: 1,
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

export function fmtMoney(n: number | null): string {
  if (n === null) return "—";
  if (n === 0) return "0";
  return `₹${n.toLocaleString("en-IN")}`;
}
