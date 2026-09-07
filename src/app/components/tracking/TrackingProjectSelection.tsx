import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { C } from "../actionDetails/theme";
import { CbuDropdownField } from "../networkDownStockingAgentV3/step1/CbuDropdownField";
import { ProjectNameField } from "../networkDownStockingAgentV3/step1/ProjectNameField";
import { useCbuListQuery } from "../../queries/cbuQueries";
import { NetworkIdField } from "./NetworkIdField";
import {
  PROJECT_REGISTRY,
  type ProjectRegistryEntry,
} from "./data";
import type { AcceptedScenarioDetails } from "../../App";

export type TrackingProjectSelectionValue = {
  networkId: string | null;
  projectName: string;
  oldCbuCode: string | null;
  oldCbuDescription: string | null;
  newCbuCode: string | null;
  newCbuDescription: string | null;

  /**
   * The most recently picked Old CBU srNo.
   * Used to seed a resimulation deep link.
   */
  oldSrNo?: number;
};

interface Props {
  scenario?: AcceptedScenarioDetails;
  onChange: (
    value: TrackingProjectSelectionValue,
  ) => void;
  assignedProjectName: string;
  onAssignedProjectNameChange: (
    name: string,
  ) => void;
}

function FieldLabel({
  children,
}: Readonly<{ children: string }>) {
  return (
    <span
      className="mb-1 block truncate text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: "#374151" }}
      title={children}
    >
      {children}
    </span>
  );
}

export function TrackingProjectSelection({
  scenario,
  onChange,
  assignedProjectName,
  onAssignedProjectNameChange,
}: Readonly<Props>) {
  const { data: cbuListData } = useCbuListQuery();
  const cbuData = cbuListData ?? [];
  const [isExpanded, setIsExpanded] = useState(true);

  const [networkId, setNetworkId] =
    useState<string | null>(null);

  const [oldSrNos, setOldSrNos] =
    useState<number[]>([]);

  const [newSrNos, setNewSrNos] =
    useState<number[]>([]);

  const [projectName, setProjectName] =
    useState("");

  const applyEntry = (
    entry: ProjectRegistryEntry,
  ) => {
    setNetworkId(entry.networkId);
    setOldSrNos(entry.oldSrNos);
    setNewSrNos(entry.newSrNos);
    setProjectName(entry.projectName);
  };

  const clearNetworkSelection = () => {
    setNetworkId(null);
    setOldSrNos([]);
    setNewSrNos([]);
    setProjectName("");
  };

  const handleNetworkIdChange = (
    selectedNetworkId: string,
  ) => {
    const entry = PROJECT_REGISTRY.find(
      (registryEntry) =>
        registryEntry.networkId === selectedNetworkId,
    );

    if (entry) {
      applyEntry(entry);
      return;
    }

    setNetworkId(selectedNetworkId);
  };

  const handleOldCbuChange = (
    nextOldSrNos: number[],
  ) => {
    setOldSrNos(nextOldSrNos);

    // An individual CBU cannot be selected as
    // both Old CBU and New CBU.
    setNewSrNos((currentNewSrNos) =>
      currentNewSrNos.filter(
        (srNo) => !nextOldSrNos.includes(srNo),
      ),
    );
  };

  const handleNewCbuChange = (
    nextNewSrNos: number[],
  ) => {
    // Extra guard in addition to excludeSrNos.
    setNewSrNos(
      nextNewSrNos.filter(
        (srNo) => !oldSrNos.includes(srNo),
      ),
    );
  };

  useEffect(() => {
    const selectedOldRow =
      cbuData.find(
        (row) =>
          row.srNo === oldSrNos.at(-1),
      ) ?? null;

    const selectedNewRow =
      cbuData.find(
        (row) =>
          row.srNo === newSrNos.at(-1),
      ) ?? null;

    onChange({
      networkId,
      projectName: scenario?.projectName ?? projectName,
      oldCbuCode:
        selectedOldRow?.cbuCode ?? null,
      oldCbuDescription:
        selectedOldRow?.cbuDescription ?? null,
      newCbuCode:
        selectedNewRow?.cbuCode ?? null,
      newCbuDescription:
        selectedNewRow?.cbuDescription ?? null,
      oldSrNo: oldSrNos.at(-1),
    });

    // Keep the existing behavior where onChange
    // is treated as a stable parent callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    scenario,
    networkId,
    oldSrNos,
    newSrNos,
    projectName,
    cbuData,
  ]);

  useEffect(() => {
    if (!scenario) {
      return;
    }

    setNetworkId(
      scenario.networkId ?? null,
    );

    setProjectName(
      scenario.projectName ?? "",
    );

    const oldRow = cbuData.find(
      (row) =>
        row.cbuCode === scenario.oldCbuCode,
    );

    const newRow = cbuData.find(
      (row) =>
        row.cbuCode === scenario.newCbuCode,
    );

    setOldSrNos(
      oldRow ? [oldRow.srNo] : [],
    );

    setNewSrNos(
      newRow ? [newRow.srNo] : [],
    );
  }, [scenario, cbuData]);

  const displayedProjectName =
    scenario && !scenario.projectName
      ? assignedProjectName
      : projectName;

  const handleProjectNameChange = (
    name: string,
  ) => {
    if (scenario && !scenario.projectName) {
      onAssignedProjectNameChange(name);
      return;
    }

    setProjectName(name);
  };

  const handleProjectNameClear = () => {
    if (scenario && !scenario.projectName) {
      onAssignedProjectNameChange("");
      return;
    }

    setProjectName("");
  };

  return (
    <div
      className="rounded-xl bg-white p-4"
      style={{
        border: "1px solid #e2e8f0",
        boxShadow:
          "0 1px 4px rgba(0,48,135,0.06)",
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <p
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: C.navy }}
        >
          Project Selection
        </p>

        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold uppercase tracking-wide transition-colors cursor-pointer"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Collapse project selection" : "Expand project selection"}
        >
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {isExpanded && (
        <>
          {scenario ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <div className="min-w-0">
                <NetworkIdField
                  value={networkId}
                  options={PROJECT_REGISTRY.map(
                    (entry) => entry.networkId,
                  )}
                  onChange={handleNetworkIdChange}
                  onClear={clearNetworkSelection}
                  placeholder="Select Network ID"
                />
              </div>

              <div className="min-w-0">
                <CbuDropdownField
                  label="Old CBU"
                  selectedSrNos={oldSrNos}
                  onChange={handleOldCbuChange}
                  placeholder="Select Old CBU(s)"
                />
              </div>

              <div className="min-w-0">
                <CbuDropdownField
                  label="New CBU"
                  selectedSrNos={newSrNos}
                  onChange={handleNewCbuChange}
                  placeholder="Select New CBU(s) (optional)"
                  disabled={oldSrNos.length === 0}
                  excludeSrNos={oldSrNos}
                />
              </div>

              <div className="min-w-0">
                <ProjectNameField
                  value={displayedProjectName}
                  onChange={handleProjectNameChange}
                  onClear={handleProjectNameClear}
                  disabled={oldSrNos.length === 0}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              {/* Network ID: searchable single-select */}
              <div className="w-full min-w-0 lg:max-w-[220px] lg:flex-1">
                <NetworkIdField
                  value={networkId}
                  options={PROJECT_REGISTRY.map(
                    (entry) => entry.networkId,
                  )}
                  onChange={
                    handleNetworkIdChange
                  }
                  onClear={
                    clearNetworkSelection
                  }
                  placeholder="Select Network ID"
                />
              </div>

              {/* Old CBU: searchable multi-select */}
              <div className="w-full min-w-0 lg:max-w-[380px] lg:flex-[1.45]">
                <CbuDropdownField
                  label="Old CBU"
                  selectedSrNos={oldSrNos}
                  onChange={
                    handleOldCbuChange
                  }
                  placeholder="Select Old CBU(s)"
                />
              </div>

              {/* New CBU: searchable multi-select */}
              <div className="w-full min-w-0 lg:max-w-[340px] lg:flex-[1.15]">
                <CbuDropdownField
                  label="New CBU"
                  selectedSrNos={newSrNos}
                  onChange={
                    handleNewCbuChange
                  }
                  placeholder="Select New CBU(s) (optional)"
                  disabled={
                    oldSrNos.length === 0
                  }
                  excludeSrNos={oldSrNos}
                />
              </div>

              {/* Project Name: independent dropdown */}
              <div className="w-full min-w-0 lg:max-w-[300px] lg:flex-1">
                <ProjectNameField
                  value={displayedProjectName}
                  onChange={
                    handleProjectNameChange
                  }
                  onClear={
                    handleProjectNameClear
                  }
                  disabled={
                    oldSrNos.length === 0
                  }
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}