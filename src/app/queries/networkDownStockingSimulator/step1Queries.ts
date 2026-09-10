import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createProject,
  fetchDraftList,
  fetchProjectNameOptions,
  saveDraftRequest,
} from "../../api/networkDownStockingSimulator/step1Api";

const STALE_TIME_MS = 60_000;

export const simulatorStep1QueryKeys = {
  all: ["networkDownStockingSimulator", "step1"] as const,
  drafts: () => [...simulatorStep1QueryKeys.all, "drafts"] as const,
  projectNames: () => [...simulatorStep1QueryKeys.all, "projectNames"] as const,
};

export function useDraftListQuery() {
  return useQuery({
    queryKey: simulatorStep1QueryKeys.drafts(),
    queryFn: fetchDraftList,
    staleTime: STALE_TIME_MS,
  });
}

export function useProjectNameOptionsQuery() {
  return useQuery({
    queryKey: simulatorStep1QueryKeys.projectNames(),
    queryFn: fetchProjectNameOptions,
    staleTime: STALE_TIME_MS,
  });
}

/** "Create New Project" modal submit. */
export function useCreateProjectMutation() {
  return useMutation({
    mutationFn: createProject,
  });
}

/** "Save Draft" button. */
export function useSaveDraftMutation() {
  return useMutation({
    mutationFn: saveDraftRequest,
  });
}
