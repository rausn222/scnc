import { formatIndianNumber } from "../../sciDetails/utils";
import { C } from "../../sciDetails/constants";

export type MindMapBranch = {
  key: string;
  label: string;
  value: string;
  detail?: string;
  accent: string;
  bg: string;
};

export type OptionDetailPlantOutcome = {
  plantCode: string;
  finalFgProducible: number;
  productionStopDate: string;
  planChangeRequired: boolean;
};

export type OptionDetailProcurementLine = {
  plant: string;
  supplier: string;
  orderQty: number;
  moq: number;
  pricePerUnit: number;
};

/**
 * Turns one Quick Compare option's already-computed Scenario Summary / IUT
 * Flow / Procurement data (from ScenarioDetailCard.tsx's renderOptionCards)
 * into mind map branches — reuses the numbers already on screen rather than
 * recomputing anything, so the mind map always matches the card it opened
 * from. The Procurement branch is only included for combo (IUT + MOQ)
 * scenarios, matching the card's own conditional Procurement column.
 */
export function buildOptionDetailMindMapBranches(params: {
  routeFrom: string;
  routeTo: string;
  material: string;
  transferQty: number;
  transferLeadTime: string;
  laneAvailable: boolean | null;
  costPerTrip: number;
  totalCost: number;
  totalFg: number;
  plantOutcomes: OptionDetailPlantOutcome[];
  procurement: OptionDetailProcurementLine[] | null;
}): MindMapBranch[] {
  const { routeFrom, routeTo, material, transferQty, transferLeadTime, laneAvailable, costPerTrip, totalCost, totalFg, plantOutcomes, procurement } = params;

  const laneAccent = laneAvailable === true ? C.green : laneAvailable === false ? "#dc2626" : "#d97706";
  const laneBg = laneAvailable === true ? "#dcfce7" : laneAvailable === false ? "#fee2e2" : "#fef3c7";
  const laneLabel = laneAvailable === true ? "Lane available" : laneAvailable === false ? "Lane unavailable" : "Lane not set";

  const changeCount = plantOutcomes.filter((o) => o.planChangeRequired).length;
  const plantSummary = plantOutcomes.map((o) => `${o.plantCode}: ${formatIndianNumber(o.finalFgProducible)}`).join(" · ");

  const branches: MindMapBranch[] = [
    {
      key: "cost",
      label: "Total Cost",
      value: `₹${formatIndianNumber(totalCost)}`,
      detail: `₹${costPerTrip} transport cost/trip`,
      accent: "#c2410c",
      bg: "#fff7ed",
    },
    {
      key: "fg",
      label: "FG Producible",
      value: `${formatIndianNumber(totalFg)} total`,
      detail: plantSummary || undefined,
      accent: C.green,
      bg: "#dcfce7",
    },
    {
      key: "iut",
      label: "IUT Flow",
      value: `${routeFrom} → ${routeTo}`,
      detail: `${material} · ${formatIndianNumber(transferQty)} EA · ${transferLeadTime} lead · ${laneLabel}`,
      accent: laneAccent,
      bg: laneBg,
    },
    {
      key: "plan",
      label: "Plan Change",
      value: changeCount > 0 ? `${changeCount} of ${plantOutcomes.length} plants` : "No plants",
      detail: changeCount > 0 ? "Need a production plan change" : "Existing plan holds",
      accent: changeCount > 0 ? "#d97706" : C.green,
      bg: changeCount > 0 ? "#fef3c7" : "#dcfce7",
    },
  ];

  if (procurement && procurement.length > 0) {
    const supplierCount = new Set(procurement.map((p) => p.supplier)).size;
    const totalValue = procurement.reduce((sum, p) => sum + p.orderQty * p.pricePerUnit, 0);
    branches.push({
      key: "procurement",
      label: "Procurement",
      value: `${procurement.length} order${procurement.length === 1 ? "" : "s"}`,
      detail: `${supplierCount} supplier${supplierCount === 1 ? "" : "s"} · ₹${formatIndianNumber(totalValue)}`,
      accent: "#7c3aed",
      bg: "#ede9fe",
    });
  }

  return branches;
}
