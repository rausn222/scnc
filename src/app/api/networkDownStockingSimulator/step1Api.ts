import { PROJECT_NAME_OPTIONS } from "../../components/sciDetails/constants";
import type { NewProjectRecord } from "../../components/projectDetails/types";
import { delay } from "./shared";

export interface DraftRecord {
  id: string;
  projectName: string;
  oldSrNos: number[];
  newSrNos: number[];
}

// Mock draft catalog — stands in for whatever a real "GET /api/simulator/drafts" would return.
const DRAFTS: DraftRecord[] = [
  {
    id: "DRF-2026-00001",
    projectName: "Network Transition Project",
    oldSrNos: [1],
    newSrNos: [2],
  },
  {
    id: " DRF-2026-00002",
    projectName: "CBU Changeover Simulation",
    oldSrNos: [2, 3],
    newSrNos: [3],
  },
  {
    id: " DRF-2026-00003",
    projectName: "Legacy CBU Replacement",
    oldSrNos: [4],
    newSrNos: [],
  },
];

/** GET /api/simulator/drafts */
export async function fetchDraftList(): Promise<DraftRecord[]> {
  return delay(DRAFTS);
}

/** GET /api/simulator/project-names */
export async function fetchProjectNameOptions(): Promise<string[]> {
  return delay(PROJECT_NAME_OPTIONS);
}

export interface CreateProjectPayload {
  records: NewProjectRecord[];
}

export interface CreateProjectResult {
  records: NewProjectRecord[];
}

/** POST /api/simulator/projects — commits the "Create New Project" modal's submit (manual
 * entry or Excel-template upload, already parsed into records by the modal itself). */
export async function createProject(payload: CreateProjectPayload): Promise<CreateProjectResult> {
  return delay({ records: payload.records });
}

export interface SaveDraftPayload {
  oldSrNos: number[];
  newSrNos: number[];
  projectName: string;
}

export interface SaveDraftResult {
  savedAt: string;
}

/** POST /api/simulator/drafts/save — persists the current in-progress simulation as a draft.
 * Named `saveDraftRequest` (not `saveDraft`) to avoid colliding with sciDetailSlice's `saveDraft`
 * redux action, which callers typically import alongside this. */
export async function saveDraftRequest(payload: SaveDraftPayload): Promise<SaveDraftResult> {
  void payload;
  return delay({ savedAt: new Date().toISOString() });
}
