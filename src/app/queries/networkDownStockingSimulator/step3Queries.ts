import { useMutation, useQuery } from "@tanstack/react-query";
import {
  acceptScenario,
  createCustomScenario,
  fetchScenarioCatalog,
  updateCustomScenario,
} from "../../api/networkDownStockingSimulator/step3Api";

const STALE_TIME_MS = 60_000;

export const simulatorStep3QueryKeys = {
  all: ["networkDownStockingSimulator", "step3"] as const,
  scenarioCatalog: (oldCbuCode: string, newCbuCode: string | undefined) =>
    [...simulatorStep3QueryKeys.all, "scenarioCatalog", oldCbuCode, newCbuCode ?? null] as const,
};

/** Fetches Step 3's scenario catalog (predefined scenarios + IUT/MOQ option catalogs) for the
 * given CBU selection — disabled until an Old CBU is chosen. */
export function useScenarioCatalogQuery(oldCbuCode: string | undefined, newCbuCode: string | undefined) {
  return useQuery({
    queryKey: simulatorStep3QueryKeys.scenarioCatalog(oldCbuCode ?? "", newCbuCode),
    queryFn: () => fetchScenarioCatalog({ oldCbuCode: oldCbuCode as string, newCbuCode }),
    enabled: oldCbuCode != null,
    staleTime: STALE_TIME_MS,
  });
}

/** "Create New Scenario" / "Save as New Scenario" — the response is written into
 * sciDetailSlice.customScenarios by the caller, not into the query cache (the catalog above is
 * read-only reference data; user-created scenarios are decisions, which is redux's job). */
export function useCreateCustomScenarioMutation() {
  return useMutation({
    mutationFn: createCustomScenario,
  });
}

/** Re-saving edits to an already-created custom scenario (the "More Details" popup's Customise
 * flow on a scenario that already exists). */
export function useUpdateCustomScenarioMutation() {
  return useMutation({
    mutationFn: updateCustomScenario,
  });
}

/** Formally accepting a scenario. */
export function useAcceptScenarioMutation() {
  return useMutation({
    mutationFn: acceptScenario,
  });
}
