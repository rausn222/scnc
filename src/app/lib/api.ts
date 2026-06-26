import type {
  FG,
  ComponentSummary,
  ScenarioResult,
  EvaluateResult,
  FGPORow,
  PlantBreakdownRow,
  TransitionResponse,
  InventoryComponent,
  SubsetStock,
  CbuDetailSummary,
  PlantComponentRow,
  CbuStockCover,
  IutOption,
} from "./types";

const BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? "/delist-api/api";

function buildQuery(
  params: Record<string, string | string[] | boolean | undefined>,
): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      for (const item of v) p.append(k, item);
    } else {
      p.set(k, String(v));
    }
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

export async function apiFetchFgs(): Promise<FG[]> {
  return get<FG[]>(`${BASE}/fgs`);
}

export async function apiFetchPos(cbu: string): Promise<FGPORow[]> {
  return get<FGPORow[]>(`${BASE}/fgs/${encodeURIComponent(cbu)}/pos`);
}

export async function apiFetchComponents(
  cbu: string,
  cancelledPOKeys?: string[],
  posCanBeCancelled?: boolean,
): Promise<ComponentSummary[]> {
  const q = buildQuery(
    posCanBeCancelled
      ? {
          cancelled_po_key: cancelledPOKeys ?? [],
          pos_can_be_cancelled: true,
        }
      : {},
  );
  return get<ComponentSummary[]>(
    `${BASE}/fgs/${encodeURIComponent(cbu)}/components${q}`,
  );
}

export type DatasetFlags = {
  hasFgLocations: boolean;
  hasDemandForecast: boolean;
  hasComponentMoq: boolean;
  hasIutRules: boolean;
  hasStructuralIut: boolean;
};

export async function apiFetchScenarios(
  cbu: string,
  cancelledPOKeys?: string[],
  posCanBeCancelled?: boolean,
): Promise<{
  scenarios: ScenarioResult[];
  plantCount: number;
  fgLocationStock: number;
  runRate: { monthly: number; weekly: number; daily: number; source: string } | null;
  datasetFlags: DatasetFlags;
}> {
  const q = buildQuery(
    posCanBeCancelled
      ? {
          cancelled_po_key: cancelledPOKeys ?? [],
          pos_can_be_cancelled: true,
        }
      : {},
  );
  return get<{
    scenarios: ScenarioResult[];
    plantCount: number;
    fgLocationStock: number;
    runRate: { monthly: number; weekly: number; daily: number; source: string } | null;
    datasetFlags: DatasetFlags;
  }>(`${BASE}/fgs/${encodeURIComponent(cbu)}/scenarios${q}`);
}

export async function apiFetchPlantBreakdown(
  cbu: string,
): Promise<PlantBreakdownRow[]> {
  return get<PlantBreakdownRow[]>(
    `${BASE}/fgs/${encodeURIComponent(cbu)}/plant-breakdown`,
  );
}

export async function apiFetchTransition(): Promise<TransitionResponse> {
  return get<TransitionResponse>(`${BASE}/transition`);
}

export async function apiFetchSubsetStock(
  cbu: string,
  components: string[],
): Promise<SubsetStock> {
  const q = buildQuery({ component: components });
  return get<SubsetStock>(
    `${BASE}/fgs/${encodeURIComponent(cbu)}/subset-stock${q}`,
  );
}

export const ADMIN_BASE = `${BASE}/admin`;

export async function apiFetchEvaluate(
  cbu: string,
  isoDate: string,
  includePO: boolean,
  cancelledPOKeys?: string[],
  posCanBeCancelled?: boolean,
  action?: string,
): Promise<EvaluateResult> {
  const params: Record<string, string | string[] | boolean | undefined> = {
    date: isoDate,
    include_po: includePO,
    action: action ?? "noAction",
  };
  if (posCanBeCancelled) {
    params["cancelled_po_key"] = cancelledPOKeys ?? [];
    params["pos_can_be_cancelled"] = true;
  }
  return get<EvaluateResult>(
    `${BASE}/fgs/${encodeURIComponent(cbu)}/evaluate${buildQuery(params)}`,
  );
}

export function apiFetchInventory(cbu: string): Promise<InventoryComponent[]> {
  return get<InventoryComponent[]>(
    `${BASE}/fgs/${encodeURIComponent(cbu)}/inventory`,
  );
}

export function apiFetchMonthlyDemand(
  cbu: string,
): Promise<{ month: string; quantity: number }[]> {
  return get<{ month: string; quantity: number }[]>(
    `${BASE}/fgs/${encodeURIComponent(cbu)}/monthly-demand`,
  );
}

export function apiFetchCbuDetailSummary(
  cbu: string,
): Promise<CbuDetailSummary> {
  return get<CbuDetailSummary>(
    `${BASE}/fgs/${encodeURIComponent(cbu)}/detail-summary`,
  );
}

export function apiFetchCbuPlantComponents(
  cbu: string,
): Promise<PlantComponentRow[]> {
  return get<PlantComponentRow[]>(
    `${BASE}/fgs/${encodeURIComponent(cbu)}/plant-components`,
  );
}

export function apiFetchCbuStockCover(cbu: string): Promise<CbuStockCover> {
  return get<CbuStockCover>(
    `${BASE}/fgs/${encodeURIComponent(cbu)}/stock-cover`,
  );
}

export type IutTransferComponent = {
  component: string;
  componentType: string;
  strandedQty: number;
  maxTransferQty: number | null;
  transferQty: number;
  unitPrice: number;
  strandedValue: number;
};

export type IutTransfer = {
  sourcePlant: string;
  destPlant: string;
  components: IutTransferComponent[];
  totalStrandedValue: number;
  totalTransferQty: number;
};

export type IutDetails = {
  fgCode: string;
  fgDescription: string;
  transfers: IutTransfer[];
};

export function apiFetchIutDetails(cbu: string): Promise<IutDetails> {
  return get<IutDetails>(
    `${BASE}/fgs/${encodeURIComponent(cbu)}/iut-details`,
  );
}

export function apiFetchIutOptions(
  cbu: string,
  includePO = true,
): Promise<IutOption[]> {
  return get<IutOption[]>(
    `${BASE}/fgs/${encodeURIComponent(cbu)}/iut-options${buildQuery({ include_po: includePO })}`,
  );
}

export async function apiExtractCbuCodes(text: string): Promise<string[]> {
  const resp = await fetch(`${BASE}/extract-cbu-codes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!resp.ok) throw new Error("Failed to extract CBU codes");
  const data = await resp.json();
  return data.codes as string[];
}
