import { useQuery } from "@tanstack/react-query";
import {
  fetchCbuBySrNo,
  fetchCbuList,
  fetchComponentBreakdowns,
  fetchDemandData,
  fetchPlantComponents,
  fetchStockBreakdown,
} from "../api/cbuApi";
import type { CBURow } from "../components/data";

// How long cached data is considered fresh before a refetch is allowed to
// happen at all (on mount, refocus, or interval tick).
const STALE_TIME_MS = 60_000;

/** Opt-in polling — off by default so pages that don't need it (CBU Detail,
 * the SCI CBU search dropdown) keep their existing fetch-once behaviour. */
interface QueryRefreshOptions {
  refetchInterval?: number;
}

export const cbuQueryKeys = {
  all: ["cbu"] as const,
  list: () => [...cbuQueryKeys.all, "list"] as const,
  detail: (srNo: number) => [...cbuQueryKeys.all, "detail", srNo] as const,
  componentBreakdowns: (srNos: number[]) =>
    [...cbuQueryKeys.all, "componentBreakdowns", srNos] as const,
  demand: (cbuCode: string) => [...cbuQueryKeys.all, "demand", cbuCode] as const,
  stockBreakdown: (kind: "dc" | "factory" | "transit", srNo: number) =>
    [...cbuQueryKeys.all, "stockBreakdown", kind, srNo] as const,
  plantComponents: (srNo: number) =>
    [...cbuQueryKeys.all, "plantComponents", srNo] as const,
};

export function useCbuListQuery(options?: QueryRefreshOptions) {
  return useQuery({
    queryKey: cbuQueryKeys.list(),
    queryFn: fetchCbuList,
    staleTime: STALE_TIME_MS,
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: false,
  });
}

export function useCbuDetailQuery(srNo: number | undefined) {
  return useQuery({
    queryKey: cbuQueryKeys.detail(srNo ?? -1),
    queryFn: () => fetchCbuBySrNo(srNo as number),
    enabled: srNo != null,
    staleTime: STALE_TIME_MS,
  });
}

/** Batched component breakdown (RM/PM + high-contributing) for the given CBU rows. */
export function useComponentBreakdownsQuery(
  rows: CBURow[],
  options?: QueryRefreshOptions,
) {
  const srNos = rows.map((r) => r.srNo);
  return useQuery({
    queryKey: cbuQueryKeys.componentBreakdowns(srNos),
    queryFn: () => fetchComponentBreakdowns(rows),
    enabled: rows.length > 0,
    staleTime: STALE_TIME_MS,
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: false,
  });
}

export function useDemandQuery(cbuCode: string | undefined) {
  return useQuery({
    queryKey: cbuQueryKeys.demand(cbuCode ?? ""),
    queryFn: () => fetchDemandData(cbuCode as string),
    enabled: cbuCode != null,
    staleTime: STALE_TIME_MS,
  });
}

export function useStockBreakdownQuery(
  kind: "dc" | "factory" | "transit",
  row: CBURow | null,
) {
  return useQuery({
    queryKey: cbuQueryKeys.stockBreakdown(kind, row?.srNo ?? -1),
    queryFn: () => fetchStockBreakdown(kind, row as CBURow),
    enabled: row != null,
    staleTime: STALE_TIME_MS,
  });
}

export function usePlantComponentsQuery(row: CBURow | null | undefined) {
  return useQuery({
    queryKey: cbuQueryKeys.plantComponents(row?.srNo ?? -1),
    queryFn: () => fetchPlantComponents(row as CBURow),
    enabled: row != null,
    staleTime: STALE_TIME_MS,
  });
}
