import { useEffect, useState } from "react";
import { StepSection } from "../StepSection";
import { C } from "../../sciDetails/constants";
import { CbuDropdownField } from "./CbuDropdownField";
import { ProjectNameField } from "./ProjectNameField";
import { CreateProjectModal } from "../../projectDetails/CreateProjectModal";
import type { NewProjectRecord } from "../../projectDetails/types";
import { DraftIdField, DraftRecord } from "./DraftIdField";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setSelectedDraftId } from "../../../store/slices/sciDetailSlice";
import { useCreateProjectMutation } from "../../../queries/networkDownStockingSimulator";
import { useCbuListQuery } from "../../../queries/cbuQueries";

/**
 * Step 1 of the Network Down Stocking Agent flow — Old CBU, New CBU and
 * Project Name are interdependent: New CBU and Project Name unlock only
 * once an Old CBU is chosen, and clearing the Old CBU cascades to both.
 * Old CBU and New CBU both support selecting multiple CBUs at once; the
 * page derives one "active" CBU per side to drive Step 2/3 (see
 * NetworkDownStockingAgent's primary-selection logic).
 */
export function SelectCbuStep({
  oldSrNos,
  newSrNos,
  hasOldCbu,
  projectName,
  onOldCbuChange,
  onNewCbuChange,
  onProjectNameChange,
  onProjectNameClear,
}: {
  oldSrNos: number[];
  newSrNos: number[];
  hasOldCbu: boolean;
  projectName: string;
  onOldCbuChange: (next: number[]) => void;
  onNewCbuChange: (next: number[]) => void;
  onProjectNameChange: (name: string) => void;
  onProjectNameClear: () => void;
}) {
  const dispatch = useAppDispatch();
  const [createdProjectNames, setCreatedProjectNames] = useState<string[]>([]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const selectedDraftId = useAppSelector((s) => s.sciDetail.selectedDraftId);
  const isMultiOldCbuSelected = oldSrNos.length > 1;
  const createProjectMutation = useCreateProjectMutation();
  const { data: cbuListData } = useCbuListQuery();

  const handleProjectsCreated = (records: NewProjectRecord[]) => {
    createProjectMutation.mutate(
      { records },
      {
        onSuccess: ({ records: created }) => {
          const names = created.map((r) => r.name).filter((n) => n.trim() !== "");
          if (names.length === 0) return;
          setCreatedProjectNames((prev) => [...names, ...prev]);
          onProjectNameChange(names[0]);

          // Mirror the Old/New CBUs picked inside the "Create New Project" modal back onto
          // this step's own CBU dropdowns, so they're not left blank after the project exists.
          // Only the first created record feeds this — same "use the first one" rule already
          // applied to the project name above (a template upload can create several at once).
          // Replaces rather than merges with whatever was already picked (same as loading a
          // Draft ID does) — merging risked pushing the Old CBU count above 1 and silently
          // clearing New CBU right back out, since New CBU auto-disables whenever more than
          // one Old CBU is selected.
          const codeToSrNo = new Map((cbuListData ?? []).map((row) => [row.cbuCode, row.srNo]));
          const codesToSrNos = (codes: string[]) =>
            codes.map((code) => codeToSrNo.get(code)).filter((sr): sr is number => sr != null);
          const primaryTransitions = created[0]?.transitions ?? [];
          const projectOldSrNos = codesToSrNos(primaryTransitions.flatMap((t) => t.oldCodes));
          const projectNewSrNos = codesToSrNos(primaryTransitions.flatMap((t) => t.newCodes));

          if (projectOldSrNos.length > 0) {
            onOldCbuChange(projectOldSrNos);
            onNewCbuChange(projectNewSrNos);
          }

          setShowCreateProject(false);
        },
      }
    );
  };
  const handleDraftChange = (
    draft: DraftRecord | null
  ) => {
    if (!draft) {
      dispatch(setSelectedDraftId(""));
      onOldCbuChange([]);
      onNewCbuChange([])
      onProjectNameClear();
      return;
    }
    dispatch(setSelectedDraftId(draft.id));
    onOldCbuChange(draft.oldSrNos);
    onNewCbuChange(draft.newSrNos);
    onProjectNameChange(draft.projectName);
  };
  useEffect(() => {
    if (oldSrNos.length > 1 && newSrNos.length > 0) {
      onNewCbuChange([]);
    }
  }, [oldSrNos, newSrNos, onNewCbuChange]);

  return (
    <StepSection
      step={1}
      title="Select CBU"
      subtitle="Old CBU required · New CBU optional"
      info="Choose the old finished good(s) you want to simulate a transition away from — pick more than one to compare CBUs side by side. Adding New CBU(s) is optional — only needed if you're modeling a CBU-to-CBU changeover."
      overflowVisible
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="w-full min-w-0 lg:basis-[22%]">
          <DraftIdField
            value={selectedDraftId}
            onChange={handleDraftChange}
          />
        </div>
        <div className="w-full min-w-0 lg:basis-[22%]">
          <CbuDropdownField
            label="Old CBU"
            selectedSrNos={oldSrNos}
            onChange={onOldCbuChange}
            placeholder="Select Old CBU(s)"
            multiSelect={true}
          />
        </div>
        <div className="w-full min-w-0 lg:basis-[22%]">
          <CbuDropdownField
            label="New CBU"
            selectedSrNos={newSrNos}
            onChange={onNewCbuChange}
            placeholder="Select New CBU"
            disabled={!hasOldCbu || isMultiOldCbuSelected}
            disabledPlaceholder={
              !hasOldCbu
                ? "Select Old CBU first"
                : "Select only one Old CBU"
            }
            excludeSrNos={oldSrNos}
            multiSelect={false}
          />

          {isMultiOldCbuSelected && (
            <p className="mt-1 text-xs text-red-600">
              For multiple CBU transitions, please create a project and proceed.
            </p>
          )}
        </div>
        <div className="w-full min-w-0 lg:basis-[22%]">
          <ProjectNameField
            value={projectName}
            onChange={onProjectNameChange}
            onClear={onProjectNameClear}
            extraOptions={createdProjectNames}
          />
        </div>
        <div className="lg:basis-[12%] pt-4">
          <button
            type="button"
            onClick={() => setShowCreateProject(true)}
            title="Create New Project"
            className="flex-none px-4 py-2 rounded-full cursor-pointer text-white text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: C.navy }}
          >
            Create New Project
          </button>
        </div>
      </div>
      <CreateProjectModal
        open={showCreateProject}
        existing={[]}
        onClose={() => setShowCreateProject(false)}
        onCreated={handleProjectsCreated}
      />
    </StepSection>
  );
}
