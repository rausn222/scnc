import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, Save } from "lucide-react";
import { useNav } from "../App";
import { PageHeader } from "../components/PageHeader";
import { useCbuDetailQuery } from "../queries/cbuQueries";
import type { Props } from "../components/sciDetails/types";
import { C, IUT_TRANSFER_OPTIONS, MOQ_PLANT_OPTIONS, SCENARIOS } from "../components/sciDetails/constants";
import { StepSection } from "../components/sciDetails/StepSection";
import { SelectCbuPlaceholder } from "../components/sciDetails/step1/SelectCbuPlaceholder";
import { CBUSearchDropdown } from "../components/sciDetails/step1/CBUSearchDropdown";
import { ProjectNameInput } from "../components/sciDetails/step1/ProjectNameInput";
import { SimulationAssumptionsStep } from "../components/sciDetails/step2/SimulationAssumptionsStep";
import { ScenarioComparisonReportStep } from "../components/sciDetails/step3report/ScenarioComparisonReportStep";
import { ScenarioDetailView } from "../components/sciDetails/step4/ScenarioDetailView";

/**
 * Design-comparison copy of SCIDetail.tsx — identical Step 1/2/4, but Step 3
 * uses the new ScenarioComparisonReportStep (readable report breakdown for
 * IUT + Procurement / IUT + Break MOQ) instead of ScenarioComparisonStep.
 * Kept as a separate page/route so the two designs can be reviewed side by
 * side; SCIDetail.tsx itself is untouched.
 */
export default function SCIDetailReport({ row }: Readonly<Props>) {
  const { navigate } = useNav();
  const [newCbuSrNo, setNewCbuSrNo] = useState<number | null>(null);
  const [projectName, setProjectName] = useState("");
  const [acceptedId, setAcceptedId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const markDirty = () => setHasChanges(true);

  const [selTransfer, setSelTransfer] = useState<string>(
    () => IUT_TRANSFER_OPTIONS.find((o) => o.isBest)?.id ?? IUT_TRANSFER_OPTIONS[0].id,
  );
  const [moqSuppliers, setMoqSuppliers] = useState<Record<string, string>>(
    () => Object.fromEntries(MOQ_PLANT_OPTIONS.map((p) => [p.id, p.suppliers[0].id])),
  );
  const handleMoqSupplier = (plantId: string, supplierId: string) => {
    setMoqSuppliers((prev) => ({ ...prev, [plantId]: supplierId }));
    setHasChanges(true);
  };
  const handleSelTransfer = (id: string) => {
    setSelTransfer(id);
    setHasChanges(true);
  };

  const oldRow = row;
  const { data: newRowData } = useCbuDetailQuery(newCbuSrNo ?? undefined);
  const newRow = newRowData ?? null;
  const hasCbu = oldRow != null;

  useEffect(() => {
    setNewCbuSrNo(null);
    setAcceptedId(null);
    setHasChanges(false);
    setLastSavedAt(null);
  }, [oldRow?.srNo]);

  const handleOldCbuChange = (srNo: number) => {
    navigate({ page: "sci-detail-report", srNo });
  };

  const handleNewCbuChange = (srNo: number) => {
    setNewCbuSrNo(srNo);
    setHasChanges(true);
  };

  const handleProjectNameChange = (name: string) => {
    setProjectName(name);
    setHasChanges(true);
  };

  const selectAccepted = (id: string) => {
    const scenario = SCENARIOS.find((s) => s.id === id);
    if (scenario?.disabled || scenario?.comingSoon) return;
    setAcceptedId((prev) => (prev === id ? null : id));
    setHasChanges(true);
  };

  const handleSaveDraft = () => {
    setHasChanges(false);
    setLastSavedAt(new Date());
    toast.success("Draft saved", {
      description: "Your simulation progress has been saved.",
      duration: 3000,
    });
  };

  const detailScenarioId = acceptedId;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "#f5f7fa" }}
    >
      <PageHeader
        title="Supply Chain Intelligence"
        breadcrumbs={[
          { label: "SAMARTH" },
          { label: "Network Planner" },
          {
            label: "CBU Transition (National View)",
            onClick: () => navigate({ page: "dashboard" }),
          },
          ...(oldRow && newRow
            ? [{ label: `${oldRow.cbuCode} → ${newRow.cbuCode}` }]
            : oldRow
              ? [{ label: oldRow.cbuCode }]
              : []),
        ]}
      />

      {hasCbu && (
        <div
          className="px-5 py-2.5 flex items-center justify-between gap-3 shrink-0 bg-white"
          style={{ borderBottom: "1px solid #e2e8f0" }}
        >
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: C.navy }}>
              {projectName ||
                (oldRow && newRow ? `${oldRow.cbuCode} → ${newRow.cbuCode}` : oldRow?.cbuCode)}
            </p>
            {hasChanges && (
              <p
                className="text-xs mt-0.5 flex items-center gap-1"
                style={{ color: "#d97706" }}
              >
                <Clock size={11} />
                Unsaved changes
              </p>
            )}
            {!hasChanges && lastSavedAt && (
              <p
                className="text-xs mt-0.5 flex items-center gap-1"
                style={{ color: "#16a34a" }}
              >
                <CheckCircle2 size={11} />
                Draft saved · {lastSavedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
          {hasChanges && (
            <button
              type="button"
              onClick={handleSaveDraft}
              title="Save your current progress as a draft"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer"
              style={{ backgroundColor: C.blue, color: "#fff" }}
            >
              <Save size={13} />
              Save Draft
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <StepSection
          step={1}
          title="Select CBU"
          subtitle="Old CBU required · New CBU optional"
          info="Choose the old finished good you want to simulate a transition away from. Adding a New CBU is optional — only needed if you're modeling a CBU-to-CBU changeover."
          overflowVisible
        >
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <CBUSearchDropdown
              label="Old CBU"
              row={oldRow}
              onSelect={handleOldCbuChange}
              placeholder="Select Old CBU"
            />
            <CBUSearchDropdown
              label="New CBU"
              row={newRow}
              onSelect={handleNewCbuChange}
              placeholder="Select New CBU (optional)"
              disabled={!oldRow}
            />
            <ProjectNameInput
              value={projectName}
              onChange={handleProjectNameChange}
              disabled={!oldRow}
            />
          </div>
        </StepSection>

        {!hasCbu && <SelectCbuPlaceholder />}

        {hasCbu && oldRow && (
          <>
            <SimulationAssumptionsStep
              newCbuRow={newRow}
              onDirty={markDirty}
            />
            <ScenarioComparisonReportStep
              row={oldRow}
              newCbuRow={newRow}
              projectName={projectName}
              acceptedId={acceptedId}
              onSelect={selectAccepted}
              selTransfer={selTransfer}
              onSelTransfer={handleSelTransfer}
              moqSuppliers={moqSuppliers}
              onMoqSupplier={handleMoqSupplier}
              onDirty={markDirty}
            />
            {detailScenarioId && (
              <ScenarioDetailView
                row={oldRow}
                scenarioId={detailScenarioId}
                selTransfer={selTransfer}
                onSelTransfer={handleSelTransfer}
                moqSuppliers={moqSuppliers}
                onMoqSupplier={handleMoqSupplier}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
