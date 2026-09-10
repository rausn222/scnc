import { useQuery } from "@tanstack/react-query";
import { fetchSimulationAssumptions } from "../../api/networkDownStockingSimulator/step2Api";

const STALE_TIME_MS = 60_000;

export const simulatorStep2QueryKeys = {
  all: ["networkDownStockingSimulator", "step2"] as const,
  assumptions: (oldCbuCode: string, newCbuCode: string | undefined) =>
    [...simulatorStep2QueryKeys.all, "assumptions", oldCbuCode, newCbuCode ?? null] as const,
};

/** Fetches Step 2's assumption catalog for the given CBU selection — disabled until an Old CBU
 * is chosen, matching how Step 2 itself only renders once one is. */
export function useSimulationAssumptionsQuery(oldCbuCode: string | undefined, newCbuCode: string | undefined) {
  return useQuery({
    queryKey: simulatorStep2QueryKeys.assumptions(oldCbuCode ?? "", newCbuCode),
    queryFn: () => fetchSimulationAssumptions({ oldCbuCode: oldCbuCode as string, newCbuCode }),
    enabled: oldCbuCode != null,
    staleTime: STALE_TIME_MS,
  });
}
