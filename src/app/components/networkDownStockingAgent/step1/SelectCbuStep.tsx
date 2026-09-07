import { StepSection } from "../StepSection";
import { CbuDropdownField } from "./CbuDropdownField";
import { ProjectNameField } from "./ProjectNameField";

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
  return (
    <StepSection
      step={1}
      title="Select CBU"
      subtitle="Old CBU required · New CBU optional"
      info="Choose the old finished good(s) you want to simulate a transition away from — pick more than one to compare CBUs side by side. Adding New CBU(s) is optional — only needed if you're modeling a CBU-to-CBU changeover."
      overflowVisible
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
        <div className="w-full min-w-0 lg:flex-1 lg:max-w-[280px]">
          <ProjectNameField
            value={projectName}
            onChange={onProjectNameChange}
            onClear={onProjectNameClear}
            disabled={!hasOldCbu}
          />
        </div>
      </div>
    </StepSection>
  );
}
