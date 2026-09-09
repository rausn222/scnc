import {
  demandData,
  normalizeCoverDate,
  type AggregatedComponent,
  type CBURow,
  type CBURowCover,
  type DcStockRow,
  type DemandRow,
  type PlantComponentRow,
} from "../components/data";
import type {
  CbuListQueryParams,
  CBUListResponse,
  CbuListRow,
  CbuFiltersResponse,
  CbuFiltersQueryParams,
  CbuFiltersSearchRequest,
  CbuFiltersSearchResponse,
  CbuExportQueryParams,
  CbuValidationErrorResponse,
  StockBreakdownType,
  DcStockBreakdownResponse,
  FactoryStockBreakdownResponse,
  InTransitBreakdownResponse,
  ForecastDemandType,
  ForecastDemandViewType,
  ForecastDemandBreakdownResponse,
  PlantsResponse,
  CbuComponentsResponse,
  ComponentsByPlantResponse,
  ProductionPlanResponse,
  CbuRecalculateSummaryRequest,
  CbuRecalculateSummaryResponse,
} from "../components/nationalDashboard/apiTypes";
import { getApiHeaders } from "./apiHeaders";

const SIMULATED_LATENCY_MS = 300;

function delay<T>(value: T, ms = SIMULATED_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** GET /api/cbus */
export async function fetchCbuList(): Promise<CBURow[]> {
  const page = await fetchCbuListForDashboard({ page: 1, pageSize: 10000 });
  return page.rows;
}

// REACT_APP_AGENTIC_BACKEND_API_URL lets Azure pipelines point each
// environment (dev/QA/prod) at its own backend, same as
// REACT_APP_BACKEND_API_URL elsewhere in the app. Must be read as a plain
// `process.env.REACT_APP_X` member expression — that's the exact pattern
// react-scripts' build step inlines; anything else (e.g. reading it off
// `globalThis.process` or through optional chaining) survives into the
// browser bundle unreplaced and evaluates to undefined at runtime.
const NP_API_BASE = `${process.env.REACT_APP_AGENTIC_BACKEND_API_URL}/api`;

/**
 * Thrown by the real (non-mock) fetch functions below. On a 422 response the
 * body is the standard FastAPI validation-error shape (`{ detail: [...] }`);
 * `validation` carries the parsed items and `message` is a human-readable
 * summary of them. For any other non-ok status, `validation` is undefined
 * and `message` is a generic "API error <status>" string.
 */
export class CbuApiError extends Error {
  status: number;
  validation?: CbuValidationErrorResponse["detail"];

  constructor(status: number, message: string, validation?: CbuValidationErrorResponse["detail"]) {
    super(message);
    this.name = "CbuApiError";
    this.status = status;
    this.validation = validation;
  }
}

async function throwApiError(res: Response, endpoint: string): Promise<never> {
  if (res.status === 422) {
    const body = (await res.json().catch(() => null)) as CbuValidationErrorResponse | null;
    const detail = body?.detail ?? [];
    const message =
      detail.length > 0
        ? detail.map((d) => `${d.loc.join(".")}: ${d.msg}`).join("; ")
        : `Validation error: ${endpoint}`;
    throw new CbuApiError(422, message, detail);
  }
  throw new CbuApiError(res.status, `API error ${res.status}: ${endpoint}`);
}

export interface LastRefreshEntry {
  InsertedOn: string;
  Epic: string;
  Page: string;
}

export interface LastRefreshResponse {
  status: string;
  data: LastRefreshEntry[];
}

/**
 * GET /api/v1/cbus/last-refresh - most recent data-load timestamp for the
 * Network Planning module, shown next to the tabs (see PageTabHeader).
 */
export async function fetchLastRefreshTime(): Promise<LastRefreshResponse> {
  const res = await fetch(`${NP_API_BASE}/v1/cbus/last-refresh`, {
    headers: getApiHeaders(),
  });
  if (!res.ok) {
    return throwApiError(res, "/api/v1/cbus/last-refresh");
  }
  return res.json() as Promise<LastRefreshResponse>;
}

export interface UserColumnPreferenceColumn {
  name: string;
  priority: number;
  is_visible: boolean;
  label?: string;
}

export interface UserColumnPreferenceSection {
  section_name: string;
  priority: number;
  is_visible: boolean;
  columns: UserColumnPreferenceColumn[];
  section_label?: string;
  visible_count?: number;
  total_count?: number;
}

export interface UserColumnPreferencePayload {
  user_email: string;
  screen_id: string;
  pref_type: "COLUMN";
  customized?: boolean;
  sections: UserColumnPreferenceSection[];
}

export interface UserColumnPreferenceResponse extends UserColumnPreferencePayload {}

export async function fetchUserColumnPreferences(
  userEmail: string,
  screenId = "cbu_national_view",
): Promise<UserColumnPreferenceResponse> {
  const res = await fetch(
    `${NP_API_BASE}/v1/np/user-preferences?${new URLSearchParams({
      user_email: userEmail,
      screen_id: screenId,
      pref_type: "COLUMN",
    }).toString()}`,
    { headers: getApiHeaders() },
  );
  if (!res.ok) {
    return throwApiError(res, "/api/v1/np/user-preferences");
  }
  return res.json() as Promise<UserColumnPreferenceResponse>;
}

export interface SaveUserColumnPreferencesResult {
  message?: string;
  data?: UserColumnPreferenceResponse;
}

/** The endpoint has no `success` field on the wire — a non-2xx status is
 * already turned into a thrown CbuApiError by throwApiError below, so simply
 * resolving here means the save succeeded. `data` is the server's own
 * (possibly normalized) view of the saved preferences, useful for
 * reconciling local state after a save. */
export async function saveUserColumnPreferences(
  payload: UserColumnPreferencePayload,
): Promise<SaveUserColumnPreferencesResult> {
  const res = await fetch(
    `${NP_API_BASE}/v1/np/user-preferences?${new URLSearchParams({
      user_email: payload.user_email,
      screen_id: payload.screen_id,
      pref_type: payload.pref_type,
    }).toString()}`,
    {
      method: "PUT",
      headers: getApiHeaders(),
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    return throwApiError(res, "/api/v1/np/user-preferences");
  }
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as SaveUserColumnPreferencesResult;
  } catch {
    return {};
  }
}

type QueryValue = string | number | boolean | string[] | undefined;

/** Multi-select filters send one repeated param per selected value
 * (?bg=BG1&bg=BG2) rather than a single comma-joined value — `append`s each
 * array entry instead of `set`ting one. Empty arrays are skipped exactly like
 * `undefined`/`""`, since an empty selection means "All"/no narrowing. */
function buildQueryString(entries: Array<[string, QueryValue]>): string {
  const q = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v === "") continue;
        q.append(key, v);
      }
      continue;
    }
    q.set(key, String(value));
  }
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

/** Shared by the list and export endpoints — every filter/search/sort param
 * they both take. */
function cbuFilterQueryEntries(
  params: CbuExportQueryParams,
): Array<[string, QueryValue]> {
  return [
    ["search", params.search],
    ["material", params.material],
    ["cbu", params.cbu],
    ["basePack", params.basePack],
    ["smallC", params.smallC],
    ["bg", params.bg],
    ["format", params.format],
    ["brand", params.brand],
    ["materialType", params.materialType],
    ["uom", params.uom],
    ["highContributing", params.highContributing],
    ["sortBy", params.sortBy],
    ["sortOrder", params.sortOrder],
  ];
}

function buildCbuListQuery(params: CbuListQueryParams): string {
  return buildQueryString([
    ["page", params.page],
    ["pageSize", params.pageSize],
    ...cbuFilterQueryEntries(params),
  ]);
}

function buildCbuExportQuery(params: CbuExportQueryParams): string {
  return buildQueryString(cbuFilterQueryEntries(params));
}

/**
 * GET /api/v1/cbus — National Dashboard CBU listing, with pagination
 * (page/pageSize), the dropdown filters (material/cbu/basePack/smallC/bg/
 * format/brand/materialType/uom/highContributing), free-text search, and
 * sorting (sortBy/sortOrder). Omitted params fall back to the endpoint's
 * own defaults (page 1, pageSize 20, uom "EA", sortBy "cbuCode", asc).
 */
export async function fetchCbuListPaged(
  params: CbuListQueryParams = {},
): Promise<CBUListResponse> {
  const res = await fetch(`${NP_API_BASE}/v1/cbus${buildCbuListQuery(params)}`, {
    headers: getApiHeaders(),
  });
  if (!res.ok) {
    return throwApiError(res, "/api/v1/cbus");
  }
  return res.json() as Promise<CBUListResponse>;
}

export interface CbuExportResult {
  blob: Blob;
  filename: string;
}

const DEFAULT_EXPORT_FILENAME = "cbu-dashboard-export.xlsx";

/** Pulls filename="..." (or filename*=UTF-8''...) out of a Content-Disposition
 * header, falling back to a generic name if the header is missing/unparseable. */
function filenameFromContentDisposition(header: string | null): string {
  if (!header) return DEFAULT_EXPORT_FILENAME;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  return match ? decodeURIComponent(match[1]) : DEFAULT_EXPORT_FILENAME;
}

/**
 * GET /api/v1/cbus/export — exports the CBU listing as an .xlsx file, using
 * the same filter/search/sort params as the list endpoint but returning the
 * entire matching result set (no pagination). The filename comes from the
 * response's Content-Disposition header.
 */
export async function fetchCbuExport(
  params: CbuExportQueryParams = {},
): Promise<CbuExportResult> {
  const res = await fetch(
    `${NP_API_BASE}/v1/cbus/export${buildCbuExportQuery(params)}`,
    { headers: getApiHeaders() },
  );
  if (!res.ok) {
    return throwApiError(res, "/api/v1/cbus/export");
  }
  const blob = await res.blob();
  const filename = filenameFromContentDisposition(
    res.headers.get("content-disposition"),
  );
  return { blob, filename };
}

/**
 * GET /api/v1/cbus/filters — National Dashboard conditional filter-dropdown
 * option lists (bg/smallC/format/brand/material/cbu/basePack/
 * basePackDescription). Sibling-aware faceted search: each group's options
 * are computed from every *other* filter's current selection, so callers
 * must resend the full current multi-select state on every call, not just
 * the dimension being viewed. Each group is paginated independently
 * (page/pageSize/hasMore on the response); `params.page`/`params.pageSize`
 * apply request-wide (defaulting to the endpoint's own page 1 / 100), used
 * to load the next page of whichever single dropdown is being scrolled.
 */
export async function fetchCbuFilters(
  params: CbuFiltersQueryParams = {},
): Promise<CbuFiltersResponse> {
  const qs = buildQueryString([
    ["bg", params.bg],
    ["smallC", params.smallC],
    ["format", params.format],
    ["brand", params.brand],
    ["material", params.materialCode],
    ["cbu", params.cbuCode],
    ["basePack", params.basePack],
    ["page", params.page],
    ["pageSize", params.pageSize],
  ]);
  const res = await fetch(`${NP_API_BASE}/v1/cbus/filters${qs}`, {
    headers: getApiHeaders(),
  });
  if (!res.ok) {
    return throwApiError(res, "/api/v1/cbus/filters");
  }
  return res.json() as Promise<CbuFiltersResponse>;
}

/**
 * POST /api/v1/cbus/filters/search — server-side text search within a single
 * filter dropdown's full option set, for when the user types into that
 * dropdown's search box (see FilterDropdown's onSearch /
 * NationalDashboard's searchFilterOptions). Sibling-aware and paginated the
 * same way GET /cbus/filters is (see CbuFiltersSearchRequest) — used only
 * once there's real search text; an empty/cleared search box falls back to
 * whatever GET /cbus/filters already loaded for that dropdown.
 */
export async function searchCbuFilters(
  payload: CbuFiltersSearchRequest,
): Promise<CbuFiltersSearchResponse> {
  const res = await fetch(`${NP_API_BASE}/v1/cbus/filters/search`, {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    return throwApiError(res, "/api/v1/cbus/filters/search");
  }
  return res.json() as Promise<CbuFiltersSearchResponse>;
}

/** The API sends null (not 0) for a numeric field with no data for that CBU
 * — CBURow's numeric fields are non-nullable, so every leaf must be defaulted
 * here rather than passed through as whichever object the wire response
 * happens to carry. */
function defaultFgStock(fg: CbuListRow["fg"]): CBURow["fg"] {
  return {
    dcStock: fg.dcStock ?? 0,
    factoryStock: fg.factoryStock ?? 0,
    inTransitStock: fg.inTransitStock ?? 0,
    totalStock: fg.totalStock ?? 0,
    // The API has no blockedStock for FG yet — kept null (not defaulted to
    // 0) so it's explicit this is "no data", same as every other unmapped
    // leaf here reads null before defaulting.
    blockedStock: fg.blockedStock ?? null,
    dcBlockedStock: fg.dcBlockedStock ?? null,
    factoryBlockedStock: fg.factoryBlockedStock ?? null,
  };
}

function defaultRmpmStock(rmpm: CbuListRow["rmpmMin"]): CBURow["rmpm"] {
  return {
    physicalStock: rmpm.physicalStock ?? 0,
    qualityStock: rmpm.qualityStock ?? 0,
    openPOStock: rmpm.openPOStock ?? 0,
    blockedStock: rmpm.blockedStock ?? 0,
    supplierInventory: rmpm.supplierInventory ?? 0,
    inTransitStock: rmpm.inTransitStock ?? 0,
    totalStock: rmpm.totalStock ?? 0,
    stvStock: rmpm.stvStock ?? 0,
  };
}

/**
 * Converts a real CbuListRow (wire) into the app's existing CBURow (internal
 * UI model), so National Dashboard consumers need zero code changes once
 * fetchCbuListPaged replaces the mock fetchCbuList — only this seam changes.
 * `rmpm`/`totalFG`/`cover` (the legacy single-value fields other pages like
 * basePackData.ts read) default to the Max variant, matching computeEffRmpm's
 * default `mode = "max"`.
 */
/** Normalizes a wire CbuListRowCover (ISO dates / "NA" / "Excess stock" /
 * "> demand horizon") into the app's display convention — see
 * normalizeCoverDate in components/data.ts. */
function mapCover(cover: CbuListRow["coverMax"]): CBURowCover {
  return {
    fgCoverDate: normalizeCoverDate(cover.fgCoverDate),
    totalCoverDate: normalizeCoverDate(cover.totalCoverDate),
    coverExclOpenPO: normalizeCoverDate(cover.coverExcludingOpenPO),
  };
}

export function mapCbuListRowToCBURow(wireRow: CbuListRow): CBURow {
  const coverMax = mapCover(wireRow.coverMax);
  const coverMin = mapCover(wireRow.coverMin);
  return {
    srNo: wireRow.slNo,
    cbuCode: wireRow.cbuCode,
    cbuDescription: wireRow.cbuDescription,
    weightKg: wireRow.weightKg ?? null,
    basePack: wireRow.basepack ?? undefined,
    basePackDescription: wireRow.basepackDescription ?? undefined,
    smallC: wireRow.smallC ?? undefined,
    bg: wireRow.bg ?? undefined,
    format: wireRow.format ?? undefined,
    brand: wireRow.brand ?? undefined,
    fg: defaultFgStock(wireRow.fg),
    rmpm: defaultRmpmStock(wireRow.rmpmMax),
    rmpmMin: defaultRmpmStock(wireRow.rmpmMin),
    rmpmMax: defaultRmpmStock(wireRow.rmpmMax),
    demand: {
      sumNext3TDP: wireRow.demand.sumNext3TDP ?? 0,
      next6Months: wireRow.demand.next6Months ?? 0,
      next12Months: wireRow.demand.next12Months ?? 0,
    },
    totalFG: wireRow.totalFGMax.totalFG ?? 0,
    cover: coverMax,
    coverMin,
    coverMax,
  };
}

export interface CbuListPage {
  rows: CBURow[];
  count: number;
  page: number;
  pageSize: number;
}

/**
 * GET /api/v1/cbus, mapped into the app's internal CBURow shape. Used by the
 * National Dashboard's server-driven pagination (useCbuListPagedQuery) —
 * unlike fetchCbuList()/useCbuListQuery() (which fetch the full API-backed
 * list for the SCI CBU search dropdown).
 */
export async function fetchCbuListForDashboard(
  params: CbuListQueryParams = {},
): Promise<CbuListPage> {
  const res = await fetchCbuListPaged(params);
  return {
    rows: res.data.map(mapCbuListRowToCBURow),
    count: res.count,
    page: res.page,
    pageSize: res.pageSize,
  };
}

/** GET /api/cbus/:srNo */
export async function fetchCbuBySrNo(srNo: number): Promise<CBURow | null> {
  const rows = await fetchCbuList();
  return rows.find((r) => r.srNo === srNo) ?? null;
}

/**
 * GET /api/v1/cbus?cbu=<code>&page=1&pageSize=1 — fetches a single CBU row
 * by its real cbuCode. Used by the CBU Detail page's real-API flow
 * (useCbuDetailByCodeQuery); fetchCbuBySrNo is retained for the SCI simulation
 * flow but is also API-backed. srNo (mapped from the wire response's slNo) is a
 * serial rank within the current filtered/paginated result set, not a
 * stable per-CBU identifier — reusing it as the CBU Detail page's routing
 * key caused it to collide with unrelated rows, so cbuCode (unique, stable)
 * is the identifier here instead.
 */
export async function fetchCbuByCode(cbuCode: string): Promise<CBURow | null> {
  const page = await fetchCbuListForDashboard({ page: 1, pageSize: 1, cbu: cbuCode });
  return page.rows[0] ?? null;
}

export interface ComponentBreakdown {
  components: AggregatedComponent[];
  highContributing: AggregatedComponent[];
}

/** GET /api/cbus/components — batched component breakdown for the given CBU rows */
/**
 * No real per-component (RM/PM) breakdown endpoint exists yet. This used to
 * fill componentCache/highContributingCache from data.ts's mock generators
 * (getAggregatedComponents/getHighContributingComponents) — but
 * computeEffRmpm (nationalDashboard/utils.ts) treats a non-empty component
 * pool as authoritative and derives "FG Equivalent RMPM Stock (Min/Max)"
 * (and, downstream, FG Summary/FG Cover Min/Max) from it instead of the real
 * CBU list API's row-level rmpmMin/rmpmMax — so those mock figures were
 * silently overriding correct API data on every row. Returning empty here
 * makes computeEffRmpm always take its "no components loaded" branch (real
 * row.rmpmMin/rmpmMax) until a real endpoint exists. The mock generators are
 * left in data.ts, and computeEffRmpm's component-aggregation branch is left
 * as-is, for wiring that endpoint in later — component/highContributing
 * would just need to be populated from it here again.
 */
export async function fetchComponentBreakdowns(
  rows: CBURow[],
): Promise<Record<number, ComponentBreakdown>> {
  return delay({});
}

/**
 * GET /api/v1/cbus/{cbu_code}/components[?contributionType=high-contributer]
 * — the real per-component (RM/PM) breakdown, fetched on demand for a single
 * CBU when its National Dashboard row is expanded (see useCbuComponentsQuery
 * / useCbuHighContributingComponentsQuery). Same endpoint backs both the
 * standard "Unique Components" list (no param) and the separately-sourced
 * "High Contributing" set (contributionType=high-contributer) — the caller
 * picks which by passing contributionType or leaving it undefined.
 */
export async function fetchCbuComponents(
  cbuCode: string,
  contributionType?: "high-contributer",
): Promise<AggregatedComponent[]> {
  const q = contributionType ? `?contributionType=${contributionType}` : "";
  const res = await fetch(
    `${NP_API_BASE}/v1/cbus/${encodeURIComponent(cbuCode)}/components${q}`,
    { headers: getApiHeaders() },
  );
  if (!res.ok) {
    return throwApiError(res, `/api/v1/cbus/${cbuCode}/components`);
  }
  const data = (await res.json()) as CbuComponentsResponse;
  return data.map((c) => ({
    componentCode: c.componentCode,
    componentMaterialType: c.componentMaterialType,
    componentDescription: c.componentDescription,
    unrestrictedStock: c.unrestrictedStock,
    qualityStock: c.qualityStock,
    blockedStock: c.blockedStock,
    totalStock: c.totalStock,
    openPOStock: c.openPOStock,
    totalFGCover: c.totalFGCover ?? '',
    excludeOpenPO: c.excludeOpenPO ?? "",
    contributionType: c.contribution_type ?? null,
  }));
}

/** GET /api/cbus/:cbuCode/demand */
export async function fetchDemandData(
  cbuCode: string,
): Promise<DemandRow | null> {
  const row = demandData.find((d) => d.cbu === cbuCode) ?? null;
  return delay(row);
}

const STOCK_BREAKDOWN_TYPE_BY_KIND: Record<
  "dc" | "factory" | "transit",
  StockBreakdownType
> = {
  dc: "DC_STOCK",
  factory: "FACTORY_STOCK",
  transit: "IN_TRANSIT",
};

/** Every real endpoint's uom param uses "EA"/"TON" on the wire; the rest of
 * the app (dashboard UOM toggle, etc.) uses "EA"/"MT". */
export function toApiUom(uom: "EA" | "MT"): "EA" | "TON" {
  return uom === "MT" ? "TON" : "EA";
}

/**
 * GET /api/v1/cbus/{cbu_code}/stock-breakdown?stock_type=...&uom=... — FG
 * stock breakdown behind the "FG Stock Across All Locations" popup. Maps the
 * wire response (decimal fields as strings, discriminated by stock_type)
 * into the app's existing DcStockRow[] shape so it drops into
 * StockLocationBreakdownModal / useStockBreakdownQuery with no reshaping.
 */
export async function fetchStockBreakdownFromApi(
  cbuCode: string,
  kind: "dc" | "factory" | "transit",
  uom: "EA" | "MT",
): Promise<DcStockRow[]> {
  const q = new URLSearchParams({
    stock_type: STOCK_BREAKDOWN_TYPE_BY_KIND[kind],
    uom: toApiUom(uom),
  });

  const res = await fetch(
    `${NP_API_BASE}/v1/cbus/${encodeURIComponent(cbuCode)}/stock-breakdown?${q.toString()}`,
    { headers: getApiHeaders() },
  );
  if (!res.ok) {
    return throwApiError(res, `/api/v1/cbus/${cbuCode}/stock-breakdown`);
  }

  if (kind === "transit") {
    const body = (await res.json()) as InTransitBreakdownResponse;
    return body.data.map((r) => ({
      plantCode: r.route,
      baseUom: r.uom,
      unrestrictedStock: Number(r.total_in_transit),
      qualityStock: 0,
      blockedStock: 0,
      totalStockExclInTransit: Number(r.total_in_transit),
      plantOrDc: "Route" as const,
    }));
  }

  const body = (await res.json()) as
    | DcStockBreakdownResponse
    | FactoryStockBreakdownResponse;
  return body.data.map((r) => {
    const unrestrictedStock = Number(r.unrestricted);
    const qualityStock = Number(r.quality);
    const blockedStock = Number(r.blocked);
    return {
      plantCode: r.dc_code || r.plant_code,
      baseUom: r.uom,
      unrestrictedStock,
      qualityStock,
      blockedStock,
      // Computed from the sub-statuses rather than trusting the API's own
      // total_excl_in_transit — seen returning "0.0000" for rows that
      // clearly hold stock (e.g. quality/blocked > 0), which silently
      // dropped those locations from the popup (filtered as zero-stock)
      // and understated the KPI totals.
      totalStockExclInTransit: unrestrictedStock + qualityStock,
      plantOrDc: kind === "dc" ? ("DC" as const) : ("Plant" as const),
    };
  });
}

const FORECAST_DEMAND_TYPE_BY_PERIOD: Record<
  "3tdp" | "6m" | "12m",
  ForecastDemandType
> = {
  "3tdp": "NEXT_3_TDP",
  "6m": "NEXT_6_MONTH",
  "12m": "NEXT_12_MONTH",
};

/**
 * GET /api/v1/cbus/{cbu_code}/forecast-demand-breakdown?demand_type=...
 * &uom=...&view_type=... — backs the Demand modal (Next 3 TDP / Next 6
 * Months / Next 12 Months). The backend returns pre-aggregated period bars
 * plus summary KPIs (total/avg/peak/active count), so callers don't need to
 * apportion or roll up dates client-side. `viewType` is only meaningful for
 * NEXT_6_MONTH/NEXT_12_MONTH — the UI doesn't expose a Book Month/MOC toggle
 * for NEXT_3_TDP, but the param is still required by the endpoint.
 */
export async function fetchForecastDemandBreakdown(
  cbuCode: string,
  period: "3tdp" | "6m" | "12m",
  uom: "EA" | "MT",
  viewType: ForecastDemandViewType,
): Promise<ForecastDemandBreakdownResponse> {
  const q = new URLSearchParams({
    demand_type: FORECAST_DEMAND_TYPE_BY_PERIOD[period],
    uom: toApiUom(uom),
    view_type: viewType,
  });

  const res = await fetch(
    `${NP_API_BASE}/v1/cbus/${encodeURIComponent(cbuCode)}/forecast-demand-breakdown?${q.toString()}`,
    { headers: getApiHeaders() },
  );
  if (!res.ok) {
    return throwApiError(res, `/api/v1/cbus/${cbuCode}/forecast-demand-breakdown`);
  }
  return res.json() as Promise<ForecastDemandBreakdownResponse>;
}

/**
 * GET /api/v1/cbus/production-plan?cbuCode=...&plantCode=... — backs the CBU
 * Detail page's Production Plan breakdown popup (opened from a plant's
 * "Production plan" cell in the RM/PM stock table). Unlike the other
 * per-CBU endpoints this takes cbuCode/plantCode as query params, not a path
 * segment, and there's no uom — the backend always returns EA.
 */
export async function fetchProductionPlan(
  cbuCode: string,
  plantCode: string,
): Promise<ProductionPlanResponse> {
  const q = new URLSearchParams({ cbuCode, plantCode });
  const res = await fetch(
    `${NP_API_BASE}/v1/cbus/production-plan?${q.toString()}`,
    { headers: getApiHeaders() },
  );
  if (!res.ok) {
    return throwApiError(res, "/api/v1/cbus/production-plan");
  }
  return res.json() as Promise<ProductionPlanResponse>;
}

/**
 * GET /api/v1/plants — plant master list (code/name/cluster). Not wired into
 * any UI yet; kept ready for when PLANT_CLUSTER_MAP (components/data.ts) is
 * replaced with real data.
 */
export async function fetchPlants(): Promise<PlantsResponse> {
  const res = await fetch(`${NP_API_BASE}/v1/plants`, {
    headers: getApiHeaders(),
  });
  if (!res.ok) {
    return throwApiError(res, "/api/v1/plants");
  }
  return res.json() as Promise<PlantsResponse>;
}

/**
 * GET /api/v1/cbus/{cbu_code}/components-by-plant?demand12M=0&uom=EA|TON —
 * the real per-plant, per-component (RM/PM) stock breakdown behind the CBU
 * Detail page's Plant view, replacing the mock getComponentsByPlant
 * generator (components/data.ts). demand12M is always sent as 0 —
 * required/isSurplus come pre-computed from the backend. uom follows the
 * page's UOM toggle (defaulting to EA on load) — switching it refetches
 * with the new unit rather than converting client-side.
 */
export interface PlantComponentsResult {
  plants: string[];
  rows: PlantComponentRow[];
  uniqueRMComponents: number;
  uniquePMComponents: number;
  highContributingComponents: number;
}

export async function fetchPlantComponents(
  row: CBURow,
  uom: "EA" | "MT" = "EA",
): Promise<PlantComponentsResult> {
  const q = new URLSearchParams({ demand12M: "0", uom: toApiUom(uom) });
  const res = await fetch(
    `${NP_API_BASE}/v1/cbus/${encodeURIComponent(row.cbuCode)}/components-by-plant?${q.toString()}`,
    { headers: getApiHeaders() },
  );
  if (!res.ok) {
    return throwApiError(res, `/api/v1/cbus/${row.cbuCode}/components-by-plant`);
  }
  const body = (await res.json()) as ComponentsByPlantResponse;
  return {
    plants: body.plants,
    rows: body.rows.map((r) => ({
      plantco: r.plantco,
      componentCode: r.componentCode,
      componentMaterialType: r.componentMaterialType,
      materialDescription: r.materialDescription ?? undefined,
      conversionFactor: r.conversionFactor ?? 0,
      onHandStock: r.onHandStock ?? 0,
      unrestrictedStock: r.unrestrictedStock ?? 0,
      qualityStock: r.qualityStock ?? 0,
      stvStock: r.stvStock ?? 0,
      blockedStock: r.blockedStock ?? 0,
      openPOStock: r.openPOStock ?? 0,
      inTransitStock: r.inTransitStock ?? 0,
      supplierInventory: r.supplierInventory ?? 0,
      fgPhysicalStock: r.fgPhysicalStock ?? 0,
      fgOpenPOStock: r.fgOpenPOStock ?? 0,
      fgUnrestrictedStock: r.fgUnrestrictedStock ?? 0,
      fgQualityStock: r.fgQualityStock ?? 0,
      fgStvStock: r.fgStvStock ?? 0,
      fgBlockedStock: r.fgBlockedStock ?? 0,
      required: r.required ?? 0,
      isSurplus: r.isSurplus,
      fgCoverDate: r.fgCoverDate ?? null,
      isHighContributor: r.isHighContributor ?? false,
      contributionPct: r.contributionPct ?? null,
      totalFGAtPlant: r.totalFGAtPlant ?? 0,
      productionPlan: r.productionPlan ?? 0,
      fgCoverDateOnHandOnlyMin: r.fgCoverDateOnHandOnlyMin ?? null,
      fgCoverDateOnHandOnlyMax: r.fgCoverDateOnHandOnlyMax ?? null,
      fgCoverDateOnHandPlusOpenPOMin: r.fgCoverDateOnHandPlusOpenPOMin ?? null,
      fgCoverDateOnHandPlusOpenPOMax: r.fgCoverDateOnHandPlusOpenPOMax ?? null,
      totalFGEquivalentRMPMStock: r.totalFGEquivalentRMPMStock ?? null,
    })),
    uniqueRMComponents: body.uniqueRMComponents ?? 0,
    uniquePMComponents: body.uniquePMComponents ?? 0,
    highContributingComponents: body.highContributingComponents ?? 0,
  };
}

/**
 * POST /api/v1/cbus/recalculate/summary — recalculates a single CBU's full
 * dashboard row (RMPM FG-equivalent stock, FG summary, cover dates, etc.)
 * after the user selects/deselects specific RMPM codes. The response is the
 * same CbuListRow shape GET /api/v1/cbus returns per row, so it's mapped
 * through mapCbuListRowToCBURow the same way — callers get back a CBURow
 * ready to replace the row's current entry in the dashboard table. Not wired
 * into the National Dashboard's checkbox toggle handlers yet.
 */
export async function recalculateCbuSummary(
  payload: CbuRecalculateSummaryRequest,
): Promise<CBURow> {
  const res = await fetch(`${NP_API_BASE}/v1/cbus/recalculate/summary`, {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    return throwApiError(res, "/api/v1/cbus/recalculate/summary");
  }
  const wireRow = (await res.json()) as CbuRecalculateSummaryResponse;
  return mapCbuListRowToCBURow(wireRow);
}
