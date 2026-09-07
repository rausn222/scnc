import {
  type CBURow,
  PLANT_CLUSTER_MAP,
  getComponentDescriptionByCode,
  getComponentsByPlant,
  getRowFgMaterial,
  getAggregatedComponents,
} from "../data";
import { VCBL1R0_OPEN_POS } from "../productionPlanData";
import type {
  IUTOption,
  MOQPlantOption,
  PlantRole,
  TransitionState,
  ComponentBreakdownRow,
  OnHandBreakdown,
  OpenPoAssumptionLine,
  MoqBreakMaterial,
  FeedStockStatus,
  TransferScenarioId,
} from "./types";
import {
  MONTH_INDEX,
  MONTH_NAMES,
  PLANT_BREAKDOWN_BASE,
  NO_ACTION_PLANT,
  SCENARIOS,
  TRANSITIONING_COMPONENT_CODE,
  C,
  PLANT_DISPLAY_NAMES,
  NO_ACTION_WASTE,
  type RmpmConnectivityStatus,
} from "./constants";

export function parseDMYDate(dateStr: string): Date {
  const [day, mon, year] = dateStr.split(" ");
  return new Date(parseInt(year, 10), MONTH_INDEX[mon], parseInt(day, 10));
}

export function getProductionWeekEndDate(dateStr: string): string {
  const d = parseDMYDate(dateStr);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return `${String(d.getDate()).padStart(2, "0")} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function parseIndianNumber(value: string): number {
  return Number(value.replace(/,/g, "")) || 0;
}

export function formatIndianNumber(value: number): string {
  return value.toLocaleString("en-IN");
}

export function getActivePlantRoles(
  scenarioId: string,
  selectedTransfer: IUTOption | null,
  selectedMoq: MOQPlantOption | null,
): { code: string; roles: PlantRole[] }[] {
  const touchesIUT = scenarioId === "iut" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break";
  const touchesMOQ = scenarioId === "moq" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break";

  // Every known plant always shows, even if the current scenario/option
  // selection gives it no active role — it just renders as flat baseline data.
  const roleMap = new Map<string, Set<PlantRole>>();
  for (const code of Object.keys(PLANT_BREAKDOWN_BASE)) {
    roleMap.set(code, new Set());
  }
  const addRole = (code: string, role: PlantRole) => {
    if (!roleMap.has(code)) roleMap.set(code, new Set());
    roleMap.get(code)!.add(role);
  };

  if (touchesIUT && selectedTransfer) {
    addRole(selectedTransfer.routeFrom, "source");
    addRole(selectedTransfer.routeTo, "destination");
  }
  if (touchesMOQ && selectedMoq) {
    addRole(selectedMoq.plant, "ordering");
  }

  return Array.from(roleMap.entries()).map(([code, roles]) => ({
    code,
    roles: Array.from(roles),
  }));
}

export function computeAfterQtyAndDate(
  plantCode: string,
  roles: PlantRole[],
  scenarioId: string,
  selectedTransfer: IUTOption | null,
  selectedMoq: MOQPlantOption | null,
  moqSuppliers: Record<string, string>,
  baseQty: number,
  baseDate: string,
): { qty: number; onHandDelta: number; openPoDelta: number; date: string } {
  const selectedSupplier = selectedMoq
    ? selectedMoq.suppliers.find((s) => s.id === moqSuppliers[selectedMoq.id]) ?? selectedMoq.suppliers[0]
    : null;
  const isBestTransfer = !selectedTransfer || selectedTransfer.isBest;
  const isBestMoq = !selectedMoq || (selectedMoq.isBest && selectedSupplier?.id === selectedMoq.suppliers[0]?.id);

  // IUT physically moves stock between plants, so it changes what's on hand.
  // Procurement (MOQ) just places a new order — it changes Open PO, not on-hand stock.
  let onHandDelta = 0;
  let openPoDelta = 0;
  let date = baseDate;
  if (roles.includes("destination") && selectedTransfer) {
    onHandDelta += selectedTransfer.transferQty;
    date = selectedTransfer.prodStopDest;
  }
  if (roles.includes("source") && selectedTransfer) {
    onHandDelta -= selectedTransfer.transferQty;
    date = selectedTransfer.prodStopSource;
  }
  if (roles.includes("ordering") && selectedMoq) {
    openPoDelta += selectedMoq.orderQty;
    date = selectedSupplier?.productionDate ?? date;
  }

  // The bottleneck component at the network's headline plant drives the scenario's
  // featured "feasible producible" number — with the default (best) options, use the
  // tuned scenario meta value for that instead of deriving it, but still split the
  // on-hand vs. Open PO delta by role so procurement remains visible separately.
  if (plantCode === NO_ACTION_PLANT.code && isBestTransfer && isBestMoq) {
    const meta = SCENARIOS.find((s) => s.id === scenarioId);
    if (meta) {
      return { qty: meta.feasibleProducible, onHandDelta, openPoDelta, date: meta.productionStopDate };
    }
  }

  const qty = baseQty + onHandDelta + openPoDelta;
  return { qty, onHandDelta, openPoDelta, date };
}

export function computeTransitionRows(
  plantCode: string,
  roles: PlantRole[],
  scenarioId: string,
  selectedTransfer: IUTOption | null,
  selectedMoq: MOQPlantOption | null,
  moqSuppliers: Record<string, string>,
): Record<TransitionState, ComponentBreakdownRow[]> {
  const base = PLANT_BREAKDOWN_BASE[plantCode];
  if (!base) return { before: [], after: [], final: [] };

  const before: ComponentBreakdownRow[] = [];
  const after: ComponentBreakdownRow[] = [];
  const final: ComponentBreakdownRow[] = [];

  for (const row of base.rows) {
    before.push(row);

    const isAffected = row.component === TRANSITIONING_COMPONENT_CODE;
    if (!isAffected) {
      after.push(row);
      final.push(row);
      continue;
    }

    const baseQty = parseIndianNumber(row.onHandStock);
    const baseOpenPo = parseIndianNumber(row.openPoQty);
    const { qty, onHandDelta, openPoDelta, date } = computeAfterQtyAndDate(
      plantCode,
      roles,
      scenarioId,
      selectedTransfer,
      selectedMoq,
      moqSuppliers,
      baseQty,
      row.prodStopDate,
    );
    // On-hand stock only moves for IUT (physical transfer); Open PO only moves for
    // procurement (a new order) — the combined `qty` still drives FG-producible
    // feasibility, since a scenario's production capability depends on both.
    const newOnHandQty = baseQty + onHandDelta;
    const newOpenPoQty = baseOpenPo + openPoDelta;
    const formattedQty = formatIndianNumber(qty);
    const formattedOnHand = formatIndianNumber(newOnHandQty);
    const formattedOpenPo = newOpenPoQty > 0 ? formatIndianNumber(newOpenPoQty) : "—";
    const afterBreakdown: OnHandBreakdown = {
      ...row.onHandBreakdown,
      unrestricted: formatIndianNumber(parseIndianNumber(row.onHandBreakdown.unrestricted) + onHandDelta),
      total: formattedOnHand,
    };

    const afterRow: ComponentBreakdownRow = {
      ...row,
      onHandStock: formattedOnHand,
      onHandBreakdown: afterBreakdown,
      openPoQty: formattedOpenPo,
      fgEquivalentStock: formattedQty,
      fgUnitsProducible: formattedQty,
      consumed: "—",
      leftoverQty: "—",
      leftoverValue: "—",
      prodStopDate: date,
    };
    const finalRow: ComponentBreakdownRow = {
      ...afterRow,
      consumed: formattedQty,
      leftoverQty: "Nil",
      leftoverValue: "Nil",
    };

    after.push(afterRow);
    final.push(finalRow);
  }

  return { before, after, final };
}

export function confidenceMeta(score: number) {
  if (score >= 70) return { color: C.green, label: "High" };
  if (score >= 45) return { color: "#d97706", label: "Medium" };
  return { color: "#dc2626", label: "Low" };
}

export function getPlantDisplayName(plantCode: string): string {
  if (plantCode === "All plants") return "All plants";
  return (
    PLANT_DISPLAY_NAMES[plantCode] ??
    PLANT_CLUSTER_MAP[plantCode] ??
    plantCode
  );
}

export function defaultWeekMonth(): { week: string; month: string } {
  const now = new Date();
  return {
    week: String(Math.min(5, Math.ceil(now.getDate() / 7))),
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  };
}

export function weekMonthFromTxDate(txDate: string): { week: string; month: string } {
  const parts = txDate.split("-");
  if (parts.length !== 3) return defaultWeekMonth();
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return defaultWeekMonth();
  return {
    week: String(Math.min(5, Math.ceil(d / 7))),
    month: `${y}-${String(m).padStart(2, "0")}`,
  };
}

export function todayDdMmYyyy(): string {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;
}

/** Formats an ISO (yyyy-mm-dd) date as e.g. "27 Aug 2026" for compact display in tiles/pills. */
export function formatIsoDateShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Adds `days` to an ISO (yyyy-mm-dd) date, returning an ISO date string. */
export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Days between an ISO (yyyy-mm-dd) delivery date and today, or null when the date hasn't passed yet — PO ageing only applies to past-due lines. */
export function daysPastDue(deliveryDateIso: string): number | null {
  const delivery = new Date(`${deliveryDateIso}T00:00:00`);
  if (Number.isNaN(delivery.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - delivery.getTime()) / 86_400_000);
  return diffDays > 0 ? diffDays : null;
}

// Real PO systems carry vendor/PO-number/lead-time data that isn't present
// on this app's underlying stock rows — these are derived deterministically
// (seeded by plant + component) purely so the Open PO-style table has
// plausible, stable values to show rather than blank columns.
const PO_VENDOR_POOL = [
  "BASF SE",
  "Evonik India",
  "Reliance Ind.",
  "Tata Chemicals",
  "Apex Packaging Ltd",
  "Huhtamaki",
  "Croda Int'l",
  "Creative Labels Pvt Ltd",
];

function seedFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function offsetDdMmYyyy(dateDdMmYyyy: string, days: number): string {
  const [d, m, y] = dateDdMmYyyy.split("-").map(Number);
  if (!d || !m || !y) return dateDdMmYyyy;
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
}

function derivedPoLineMeta(seedKey: string, deliveryDate: string) {
  const seed = seedFromString(seedKey);
  const averageLeadTimeDays = 7 + (seed % 21);
  return {
    vendorName: PO_VENDOR_POOL[seed % PO_VENDOR_POOL.length],
    poNumber: `600${10000000 + (seed % 90000000)}`,
    averageLeadTimeDays,
    poCreationDate: offsetDdMmYyyy(deliveryDate, -averageLeadTimeDays),
  };
}

export function buildOpenPoLinesForCbu(row: CBURow): OpenPoAssumptionLine[] {
  const fgMaterial = getRowFgMaterial(row);
  const defaultDate = todayDdMmYyyy();

  if (fgMaterial === "VCBL1R0" || row.cbuCode === "VCBL1R0") {
    return VCBL1R0_OPEN_POS.map((po) => {
      const id = `${po.plant}__${po.componentCode}`;
      const meta = derivedPoLineMeta(id, po.txDate);
      return {
        id,
        plantCode: po.plant,
        plantName: getPlantDisplayName(po.plant),
        siteCluster: PLANT_CLUSTER_MAP[po.plant] ?? po.plant,
        componentCode: po.componentCode,
        description: getComponentDescriptionByCode(po.componentCode),
        date: po.txDate, // already "dd-mm-yyyy"
        vendorName: po.supplier,
        qty: po.openQty,
        uom: po.uom,
        poNumber: meta.poNumber,
        poCreationDate: meta.poCreationDate,
        averageLeadTimeDays: meta.averageLeadTimeDays,
      };
    });
  }

  const { rows } = getComponentsByPlant(
    row.cbuCode,
    row.demand.next12Months,
    fgMaterial,
  );

  const plantLines = rows
    .filter((r) => r.openPOStock > 0)
    .map((r) => {
      const id = `${r.plantco}__${r.componentCode}`;
      const meta = derivedPoLineMeta(id, defaultDate);
      return {
        id,
        plantCode: r.plantco,
        plantName: getPlantDisplayName(r.plantco),
        siteCluster: PLANT_CLUSTER_MAP[r.plantco] ?? r.plantco,
        componentCode: r.componentCode,
        description: getComponentDescriptionByCode(r.componentCode),
        date: defaultDate,
        vendorName: meta.vendorName,
        qty: r.openPOStock,
        uom: "EA",
        poNumber: meta.poNumber,
        poCreationDate: meta.poCreationDate,
        averageLeadTimeDays: meta.averageLeadTimeDays,
      };
    });

  if (plantLines.length > 0) return plantLines;

  return getAggregatedComponents(row.cbuCode, fgMaterial)
    .filter((c) => c.openPOStock > 0)
    .map((c) => {
      const id = `all__${c.componentCode}`;
      const meta = derivedPoLineMeta(id, defaultDate);
      return {
        id,
        plantCode: "—",
        plantName: "All plants",
        siteCluster: "All clusters",
        componentCode: c.componentCode,
        description: getComponentDescriptionByCode(c.componentCode),
        date: defaultDate,
        vendorName: meta.vendorName,
        qty: c.openPOStock,
        uom: "EA",
        poNumber: meta.poNumber,
        poCreationDate: meta.poCreationDate,
        averageLeadTimeDays: meta.averageLeadTimeDays,
      };
    });
}

// Cycled by srNo for the CBUs that have no open PO lines, so different New
// CBU picks deterministically land on different "no date yet" reasons
// instead of all showing the same one.
const NO_PO_RMPM_STATUS_CYCLE: Exclude<RmpmConnectivityStatus, "po_available">[] = [
  "bom_not_available",
  "contract_pending",
  "po_creation_pending",
];

/** RMPM readiness for the New CBU's material — driven entirely by the CBU's
 * own open-PO data, not a user choice: any CBU with open PO lines is
 * "po_available", everything else lands on one of the other three states. */
export function getRmpmConnectivityStatus(
  row: CBURow,
  lines: OpenPoAssumptionLine[],
): RmpmConnectivityStatus {
  if (lines.length > 0) return "po_available";
  return NO_PO_RMPM_STATUS_CYCLE[row.srNo % NO_PO_RMPM_STATUS_CYCLE.length];
}

export function feedStockStatus(
  code: string,
  feedStockIds: Record<string, string>,
  materials: MoqBreakMaterial[],
): FeedStockStatus {
  const val = (feedStockIds[code] ?? "").trim();
  if (!val) return "needed";
  const mat = materials.find((m) => m.code === code);
  if (mat?.sharedCbus && mat.sharedCbus.length > 0) return "shared";
  return "unique";
}

export const FEED_STOCK_STATUS_META: Record<
  FeedStockStatus,
  { bg: string; color: string; label: string }
> = {
  unique: { bg: "#dcfce7", color: "#166534", label: "Unique" },
  shared: { bg: "#dbeafe", color: "#1d4ed8", label: "Shared across CBUs" },
  needed: { bg: "#fef3c7", color: "#b45309", label: "Data needed" },
};

export function getCardDefs(sid: string): { sid: string; transferId: TransferScenarioId | null }[] {
  const isCombo = sid === "iut-moq" || sid === "iut-moq-break";
  return isCombo
    ? [
      { sid: "iut", transferId: "iut" as TransferScenarioId },
      { sid: "moq", transferId: "moq" as TransferScenarioId },
    ]
    : [
      {
        sid,
        transferId: sid === "iut" ? ("iut" as TransferScenarioId) : sid === "moq" ? ("moq" as TransferScenarioId) : null,
      },
    ];
}

export function bizWasteColor(wasteAfter: number, wasteBefore = NO_ACTION_WASTE): string {
  const reductionPct = wasteBefore > 0 ? ((wasteBefore - wasteAfter) / wasteBefore) * 100 : 0;
  if (reductionPct >= 40) return C.teal;
  if (reductionPct >= 20) return "#d97706";
  return "#dc2626";
}
