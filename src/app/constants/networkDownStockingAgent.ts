// Illustrative data for the "Create Custom Scenario · Sample" Focus View / Compare
// detail page (see networkDownStockingAgent/step3/CustomScenarioDetailPage.tsx) — same
// convention as SCENARIOS / IUT_TRANSFER_OPTIONS / MOQ_BREAK_SUPPLIERS in sciDetails/constants.ts:
// hand-authored, plausible numbers rather than derived, since no real backend feeds this yet.

export type FocusViewPlantOutcome = {
  code: string;
  prodPlanQty: number;
  finalFgProducible: number;
  stopDate: string;
  planChangeRequired: boolean;
};

export type FocusViewOption = {
  id: "opt1" | "opt2" | "opt3";
  label: string;
  isBest: boolean;
  routeFrom: string;
  routeTo: string;
  totalCost: number;
  savingsTier: "excellent" | "moderate" | "poor";
  savingsLabel: string;
  /** Exactly the two plants this route touches — [from, to]. */
  plants: [FocusViewPlantOutcome, FocusViewPlantOutcome];
  /** Business waste figures for the Overview stat tiles, one per plant in `plants` order. */
  businessWaste: [{ value: string; note: string }, { value: string; note: string }];
  /** `null` means the lane hasn't been confirmed yet ("Not set"), distinct from `false` (confirmed unavailable). */
  laneAvailable: boolean | null;
};

export const FOCUS_VIEW_OPTIONS: FocusViewOption[] = [
  {
    id: "opt1",
    label: "Option 1",
    isBest: true,
    routeFrom: "UTR",
    routeTo: "U535",
    totalCost: 1_080_000,
    savingsTier: "excellent",
    savingsLabel: "≥40% Savings",
    plants: [
      { code: "UTR", prodPlanQty: 58_900, finalFgProducible: 56_311, stopDate: "15 Jun 2026", planChangeRequired: true },
      { code: "U535", prodPlanQty: 235_294, finalFgProducible: 70_214, stopDate: "22 Jun 2026", planChangeRequired: true },
    ],
    businessWaste: [
      { value: "₹2,852", note: "vs no-action" },
      { value: "₹2,689", note: "↓ ₹2,689" },
    ],
    laneAvailable: true,
  },
  {
    id: "opt2",
    label: "Option 2",
    isBest: false,
    routeFrom: "U535",
    routeTo: "UTR",
    totalCost: 1_070_000,
    savingsTier: "moderate",
    savingsLabel: "20–39% Savings",
    plants: [
      { code: "U535", prodPlanQty: 245_000, finalFgProducible: 237_705, stopDate: "20 Jun 2026", planChangeRequired: true },
      { code: "UTR", prodPlanQty: 85_000, finalFgProducible: 81_489, stopDate: "12 Jun 2026", planChangeRequired: true },
    ],
    businessWaste: [
      { value: "₹3,104", note: "vs no-action" },
      { value: "₹2,437", note: "↓ ₹2,437" },
    ],
    laneAvailable: true,
  },
  {
    id: "opt3",
    label: "Option 3",
    isBest: false,
    routeFrom: "UTR",
    routeTo: "U535",
    totalCost: 1_070_000,
    savingsTier: "poor",
    savingsLabel: "<20% Savings",
    plants: [
      { code: "UTR", prodPlanQty: 62_000, finalFgProducible: 60_700, stopDate: "10 Jun 2026", planChangeRequired: true },
      { code: "U535", prodPlanQty: 266_000, finalFgProducible: 258_494, stopDate: "25 Jun 2026", planChangeRequired: true },
    ],
    businessWaste: [
      { value: "₹4,120", note: "vs no-action" },
      { value: "₹1,421", note: "↓ ₹1,421" },
    ],
    laneAvailable: null,
  },
];

export const FOCUS_VIEW_SAVINGS_TIER_COLOR: Record<FocusViewOption["savingsTier"], string> = {
  excellent: "#00695C",
  moderate: "#d97706",
  poor: "#dc2626",
};

// A route's transit lead time beyond this many days is flagged as breaching SLA.
export const IUT_TRANSFER_SLA_DAYS = 5;

export type IutTransferMaterialLine = {
  code: string;
  type: "RM" | "PM";
  name: string;
  transferQty: number;
  leadTimeDays: number;
  initiationDate: string;
  costPerTrip: number;
};

export const FOCUS_VIEW_IUT_MATERIALS: Record<FocusViewOption["id"], IutTransferMaterialLine[]> = {
  // 26,839 EA total · max 6 days · ₹1,600 transport — 1 material breaches the SLA.
  opt1: [
    { code: "64330512", type: "PM", name: "Sealant Compound", transferQty: 2150, leadTimeDays: 6, initiationDate: "19 May 2026", costPerTrip: 420 },
    { code: "10045872", type: "RM", name: "PP Granules", transferQty: 12_589, leadTimeDays: 3, initiationDate: "22 May 2026", costPerTrip: 300 },
    { code: "10046110", type: "RM", name: "ABS Resin", transferQty: 6400, leadTimeDays: 3, initiationDate: "24 May 2026", costPerTrip: 300 },
    { code: "10047001", type: "RM", name: "Paint Additive", transferQty: 3900, leadTimeDays: 2, initiationDate: "25 May 2026", costPerTrip: 280 },
    { code: "64330488", type: "PM", name: "Adhesive Film", transferQty: 1800, leadTimeDays: 3, initiationDate: "23 May 2026", costPerTrip: 300 },
  ],
  // 28,939 EA total · max 4 days · ₹1,200 transport — no SLA breaches.
  opt2: [
    { code: "64330601", type: "PM", name: "Steel Sheet Coil", transferQty: 15_000, leadTimeDays: 4, initiationDate: "16 May 2026", costPerTrip: 350 },
    { code: "10048201", type: "RM", name: "Rubber Gasket", transferQty: 8000, leadTimeDays: 3, initiationDate: "18 May 2026", costPerTrip: 300 },
    { code: "20018902", type: "PM", name: "Fastener Kit", transferQty: 4500, leadTimeDays: 2, initiationDate: "19 May 2026", costPerTrip: 250 },
    { code: "10048310", type: "RM", name: "Weld Rod", transferQty: 1439, leadTimeDays: 3, initiationDate: "18 May 2026", costPerTrip: 300 },
  ],
  // 17,150 EA total · max 7 days · ₹1,420 transport — 2 materials breach the SLA.
  opt3: [
    { code: "10047230", type: "RM", name: "Foam Padding", transferQty: 3000, leadTimeDays: 7, initiationDate: "20 May 2026", costPerTrip: 450 },
    { code: "64330614", type: "PM", name: "Glass Panel", transferQty: 6500, leadTimeDays: 3, initiationDate: "21 May 2026", costPerTrip: 320 },
    { code: "10048325", type: "RM", name: "Trim Clip Set", transferQty: 5150, leadTimeDays: 4, initiationDate: "22 May 2026", costPerTrip: 350 },
    { code: "10047555", type: "RM", name: "Lubricant Drum", transferQty: 2500, leadTimeDays: 6, initiationDate: "21 May 2026", costPerTrip: 300 },
  ],
};

export type ProcurementMaterialLine = {
  code: string;
  type: "RM" | "PM";
  name: string;
  plant: string;
  supplier: string;
  orderQty: number;
  /** Actual quantity needed — below this, `moq` still applies and forces an over-order up to `moq`. */
  neededQty: number;
  moq: number;
  pricePerUnit: number;
  productionDate: string;
};

// Procurement need is driven by what the route leaves short, so each option has its own plan.
export const FOCUS_VIEW_PROCUREMENT: Record<FocusViewOption["id"], ProcurementMaterialLine[]> = {
  // 34,000 units · ₹14,79,000 — 1 order forced over the MOQ.
  opt1: [
    { code: "64330488", type: "PM", name: "Adhesive Film", plant: "UTR", supplier: "Pidilite Ind.", orderQty: 5000, neededQty: 1800, moq: 5000, pricePerUnit: 31, productionDate: "12 Jun 2026" },
    { code: "64330512", type: "PM", name: "Sealant Compound", plant: "U535", supplier: "Reliance Ind.", orderQty: 15_000, neededQty: 15_000, moq: 5000, pricePerUnit: 42, productionDate: "19 Jun 2026" },
    { code: "10047001", type: "RM", name: "Paint Additive", plant: "U535", supplier: "Asian Paints", orderQty: 4000, neededQty: 4000, moq: 2000, pricePerUnit: 61, productionDate: "20 Jun 2026" },
    { code: "10045872", type: "RM", name: "PP Granules", plant: "UTR", supplier: "BASF India", orderQty: 10_000, neededQty: 10_000, moq: 4000, pricePerUnit: 45, productionDate: "13 Jun 2026" },
  ],
  // 31,000 units · ₹12,02,000 — no orders need attention.
  opt2: [
    { code: "64330601", type: "PM", name: "Steel Sheet Coil", plant: "U535", supplier: "Tata Chemicals", orderQty: 15_000, neededQty: 15_000, moq: 5000, pricePerUnit: 38, productionDate: "17 Jun 2026" },
    { code: "10048201", type: "RM", name: "Rubber Gasket", plant: "UTR", supplier: "Evonik India", orderQty: 10_000, neededQty: 10_000, moq: 4000, pricePerUnit: 50, productionDate: "10 Jun 2026" },
    { code: "20018902", type: "PM", name: "Fastener Kit", plant: "UTR", supplier: "Sundram Fast.", orderQty: 6000, neededQty: 6000, moq: 2000, pricePerUnit: 22, productionDate: "9 Jun 2026" },
  ],
  // 29,500 units · ₹13,67,000 — 1 order forced over the MOQ.
  opt3: [
    { code: "10047230", type: "RM", name: "Foam Padding", plant: "U535", supplier: "Saint-Gobain", orderQty: 3000, neededQty: 900, moq: 3000, pricePerUnit: 55, productionDate: "22 Jun 2026" },
    { code: "64330614", type: "PM", name: "Glass Panel", plant: "U535", supplier: "Tata Chemicals", orderQty: 15_000, neededQty: 15_000, moq: 5000, pricePerUnit: 38, productionDate: "23 Jun 2026" },
    { code: "10048325", type: "RM", name: "Trim Clip Set", plant: "UTR", supplier: "Evonik India", orderQty: 10_000, neededQty: 10_000, moq: 4000, pricePerUnit: 50, productionDate: "8 Jun 2026" },
    { code: "10047555", type: "RM", name: "Lubricant Drum", plant: "UTR", supplier: "Castrol India", orderQty: 1500, neededQty: 1500, moq: 1500, pricePerUnit: 88, productionDate: "7 Jun 2026" },
  ],
};

export type FocusViewIutSummary = {
  materialCount: number;
  slaBreachCount: number;
  totalQty: number;
  maxLeadTimeDays: number;
  totalCost: number;
};

export function summarizeIutMaterials(materials: IutTransferMaterialLine[]): FocusViewIutSummary {
  return {
    materialCount: materials.length,
    slaBreachCount: materials.filter((m) => m.leadTimeDays > IUT_TRANSFER_SLA_DAYS).length,
    totalQty: materials.reduce((sum, m) => sum + m.transferQty, 0),
    maxLeadTimeDays: materials.reduce((max, m) => Math.max(max, m.leadTimeDays), 0),
    totalCost: materials.reduce((sum, m) => sum + m.costPerTrip, 0),
  };
}

export type FocusViewProcurementSummary = {
  orderCount: number;
  supplierCount: number;
  attentionCount: number;
  totalQty: number;
  totalValue: number;
};

export function summarizeProcurement(lines: ProcurementMaterialLine[]): FocusViewProcurementSummary {
  return {
    orderCount: lines.length,
    supplierCount: new Set(lines.map((l) => l.supplier)).size,
    attentionCount: lines.filter((l) => l.neededQty < l.moq).length,
    totalQty: lines.reduce((sum, l) => sum + l.orderQty, 0),
    totalValue: lines.reduce((sum, l) => sum + l.orderQty * l.pricePerUnit, 0),
  };
}

export type ComparisonTag = "best" | "high" | null;

/**
 * Tags each value "best"/"high" against the others in the same comparison row, honoring ties —
 * used by the Compare tab's metric cells. `higherIsBetter` is true for capacity/quantity metrics
 * (more supply secured is better) and false for cost/time metrics (less is better).
 */
export function tagComparisonValues(values: number[], higherIsBetter: boolean): ComparisonTag[] {
  if (values.length < 2) return values.map(() => null);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return values.map(() => null);
  const bestValue = higherIsBetter ? max : min;
  const highValue = higherIsBetter ? min : max;
  return values.map((v) => (v === bestValue ? "best" : v === highValue ? "high" : null));
}
