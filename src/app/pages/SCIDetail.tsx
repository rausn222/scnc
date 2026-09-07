import { useEffect } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, Save, Loader2, AlertTriangle } from "lucide-react";
import { useNav } from "../App";
import { PageHeader } from "../components/PageHeader";
import { C, SCENARIOS } from "../components/sciDetails/constants";
import { StepSection } from "../components/sciDetails/StepSection";
import { SelectCbuPlaceholder } from "../components/sciDetails/step1/SelectCbuPlaceholder";
import { CBUSearchDropdown } from "../components/sciDetails/step1/CBUSearchDropdown";
import { ProjectNameInput } from "../components/sciDetails/step1/ProjectNameInput";
import { SimulationAssumptionsStep } from "../components/sciDetails/step2/SimulationAssumptionsStep";
import { ScenarioComparisonStep } from "../components/sciDetails/step3/ScenarioComparisonStep";
import { ScenarioDetailView } from "../components/sciDetails/step4/ScenarioDetailView";
import { useCbuDetailQuery } from "../queries/cbuQueries";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { markDirty as markDirtyAction, resetOnCbuChange, saveDraft, setMoqSupplier, setNewCbuSrNo, setProjectName, setSelTransfer, toggleAccepted,} from "../store/slices/sciDetailSlice";

interface Props {
  srNo?: number;
}

export default function SCIDetail({ srNo }: Readonly<Props>) {
  const { navigate } = useNav();
  const dispatch = useAppDispatch();

  const {
    data: oldRowData,
    isLoading: isOldRowLoading,
    isError: isOldRowError,
  } = useCbuDetailQuery(srNo);
  const oldRow = oldRowData ?? null;

  const newCbuSrNo = useAppSelector((s) => s.sciDetail.newCbuSrNo);
  const projectName = useAppSelector((s) => s.sciDetail.projectName);
  const acceptedId = useAppSelector((s) => s.sciDetail.acceptedId);
  const hasChanges = useAppSelector((s) => s.sciDetail.hasChanges);
  const lastSavedAt = useAppSelector((s) => s.sciDetail.lastSavedAt);
  const selTransfer = useAppSelector((s) => s.sciDetail.selTransfer);
  const moqSuppliers = useAppSelector((s) => s.sciDetail.moqSuppliers);

  const { data: newRowData } = useCbuDetailQuery(newCbuSrNo ?? undefined);
  const newRow = newRowData ?? null;

  const markDirty = () => dispatch(markDirtyAction());

  const handleMoqSupplier = (plantId: string, supplierId: string) => {
    dispatch(setMoqSupplier({ plantId, supplierId }));
  };
  const handleSelTransfer = (id: string) => {
    dispatch(setSelTransfer(id));
  };

  const hasCbu = oldRow != null;
  const srNoProvided = srNo != null;

  // Each old-CBU selection should start the simulation from a clean slate —
  // the shared IUT/MOQ selections (selTransfer/moqSuppliers) intentionally
  // persist across CBU changes, matching the page's previous behaviour.
  useEffect(() => {
    dispatch(resetOnCbuChange());
  }, [dispatch, srNo]);

  const handleOldCbuChange = (nextSrNo: number) => {
    navigate({ page: "sci-detail", srNo: nextSrNo });
  };

  const handleNewCbuChange = (nextSrNo: number) => {
    dispatch(setNewCbuSrNo(nextSrNo));
  };

  const handleProjectNameChange = (name: string) => {
    dispatch(setProjectName(name));
  };

  const selectAccepted = (id: string) => {
    const scenario = SCENARIOS.find((s) => s.id === id);
    if (scenario?.disabled || scenario?.comingSoon) return;
    dispatch(toggleAccepted(id));
  };

  const handleSaveDraft = () => {
    dispatch(saveDraft());
    toast.success("Draft saved", {
      description: "Your simulation progress has been saved.",
      duration: 3000,
    });
  };

  const detailScenarioId = acceptedId;
  const lastSavedDate = lastSavedAt ? new Date(lastSavedAt) : null;

  const cbuBreadcrumbLabel =
    oldRow && newRow ? `${oldRow.cbuCode} → ${newRow.cbuCode}` : oldRow?.cbuCode;

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
          ...(cbuBreadcrumbLabel ? [{ label: cbuBreadcrumbLabel }] : []),
        ]}
      />

      {hasCbu && (
        <div
          className="px-5 py-2.5 flex items-center justify-between gap-3 shrink-0 bg-white"
          style={{ borderBottom: "1px solid #e2e8f0" }}
        >
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: C.navy }}>
              {projectName || cbuBreadcrumbLabel}
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
            {!hasChanges && lastSavedDate && (
              <p
                className="text-xs mt-0.5 flex items-center gap-1"
                style={{ color: "#16a34a" }}
              >
                <CheckCircle2 size={11} />
                Draft saved · {lastSavedDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
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

        {!srNoProvided && <SelectCbuPlaceholder />}

        {srNoProvided && isOldRowLoading && (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <Loader2 size={20} className="animate-spin" style={{ color: C.blue }} />
            <p className="text-sm" style={{ color: "#64748b" }}>Loading CBU…</p>
          </div>
        )}

        {srNoProvided && !isOldRowLoading && (isOldRowError || !oldRow) && (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <AlertTriangle size={20} style={{ color: "#dc2626" }} />
            <p className="text-sm" style={{ color: "#64748b" }}>Could not load this CBU.</p>
          </div>
        )}

        {hasCbu && oldRow && (
          <>
            <SimulationAssumptionsStep
              newCbuRow={newRow}
              onDirty={markDirty}
            />
            <ScenarioComparisonStep
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
