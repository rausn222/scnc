import { useState } from "react";
import { Plus } from "lucide-react";
import { StepSection } from "../StepSection";
import { C } from "../../sciDetails/constants";
import { CbuDropdownField } from "./CbuDropdownField";
import { ProjectNameField } from "./ProjectNameField";
import { CreateProjectModal } from "../../projectDetails/CreateProjectModal";
import type { NewProjectRecord } from "../../projectDetails/types";

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
  hideStepBadge = false,
  hideCreateProjectButton = false,
}: {
  oldSrNos: number[];
  newSrNos: number[];
  hasOldCbu: boolean;
  projectName: string;
  onOldCbuChange: (next: number[]) => void;
  onNewCbuChange: (next: number[]) => void;
  onProjectNameChange: (name: string) => void;
  onProjectNameClear: () => void;
  /** Hides the "STEP 1" pill — for reuses of this widget outside the numbered wizard flow. */
  hideStepBadge?: boolean;
  /** Hides the "+" Create Project button — for reuses where creating a project doesn't apply. */
  hideCreateProjectButton?: boolean;
}) {
  const [createdProjectNames, setCreatedProjectNames] = useState<string[]>([]);
  const [showCreateProject, setShowCreateProject] = useState(false);

  const handleProjectsCreated = (records: NewProjectRecord[]) => {
    const names = records.map((r) => r.name).filter((n) => n.trim() !== "");
    if (names.length === 0) return;
    setCreatedProjectNames((prev) => [...names, ...prev]);
    onProjectNameChange(names[0]);
    setShowCreateProject(false);
  };

  return (
    <StepSection
      step={1}
      title="Select CBU"
      subtitle="Old CBU required · New CBU optional"
      info="Choose the old finished good(s) you want to simulate a transition away from — pick more than one to compare CBUs side by side. Adding New CBU(s) is optional — only needed if you're modeling a CBU-to-CBU changeover."
      overflowVisible
      hideStepBadge={hideStepBadge}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Old CBU — widest: primary selection, long Code: Description labels */}
        <div className="w-full min-w-0 lg:flex-[1.45] lg:max-w-[420px]">
          <CbuDropdownField
            label="Old CBU"
            selectedSrNos={oldSrNos}
            onChange={onOldCbuChange}
            placeholder="Select Old CBU(s)"
          />
        </div>
        {/* New CBU — medium */}
        <div className="w-full min-w-0 lg:flex-[1.15] lg:max-w-[340px]">
          <CbuDropdownField
            label="New CBU"
            selectedSrNos={newSrNos}
            onChange={onNewCbuChange}
            placeholder="Select New CBU(s) (optional)"
            disabled={!hasOldCbu}
            excludeSrNos={oldSrNos}
          />
        </div>
        {/* Project Name — narrowest of the three */}
        <div className="w-full min-w-0 lg:flex-1 lg:max-w-[320px]">
          <div className="flex items-end gap-2">
            <div className="flex-1 min-w-0">
              <ProjectNameField
                value={projectName}
                onChange={onProjectNameChange}
                onClear={onProjectNameClear}
                disabled={!hasOldCbu}
                extraOptions={createdProjectNames}
              />
            </div>
            {!hideCreateProjectButton && (
              <button
                type="button"
                onClick={() => setShowCreateProject(true)}
                disabled={!hasOldCbu}
                title="Create Project"
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: C.navy }}
              >
                <Plus size={14} />
              </button>
            )}
          </div>
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
