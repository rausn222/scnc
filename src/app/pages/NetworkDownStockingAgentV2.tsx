import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, Save, Loader2, AlertTriangle } from "lucide-react";
import { useNav } from "../App";
import { PageHeader } from "../components/PageHeader";
import { C, SCENARIOS } from "../components/sciDetails/constants";
import { SelectCbuStep } from "../components/networkDownStockingAgentV2/step1/SelectCbuStep";
import { SelectCbuPlaceholder } from "../components/networkDownStockingAgentV2/step1/SelectCbuPlaceholder";
import { SimulationAssumptionsStep } from "../components/networkDownStockingAgentV2/step2/SimulationAssumptionsStep";
import { ScenarioComparisonStep } from "../components/networkDownStockingAgentV2/step3/ScenarioComparisonStep";
import { useCbuDetailQuery } from "../queries/cbuQueries";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { markDirty as markDirtyAction, resetOnCbuChange, saveDraft, setMoqSupplier, setNewCbuSrNo, setProjectName, setSelTransfer, toggleAccepted,} from "../store/slices/sciDetailSlice";

interface Props {
  srNo?: number;
}

export default function NetworkDownStockingAgentV2({ srNo }: Readonly<Props>) {
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

  // Full multi-select sets for the Step 1 dropdowns. Only one CBU per side
  // actually drives Step 2/3 at a time (the "primary") — that's the nav srNo
  // for Old CBU and newCbuSrNo (redux) for New CBU — but the page no longer
  // remounts when the primary changes (see App.tsx's pageKey), so these sets
  // persist across selections instead of resetting on every switch.
  const [selectedOldSrNos, setSelectedOldSrNos] = useState<number[]>(() => (srNo != null ? [srNo] : []));
  const [selectedNewSrNos, setSelectedNewSrNos] = useState<number[]>(() => (newCbuSrNo != null ? [newCbuSrNo] : []));

  // Keeps the multi-select set in sync when the primary CBU changes from
  // outside the dropdown itself (e.g. arriving here with a srNo already set).
  useEffect(() => {
    if (srNo != null) setSelectedOldSrNos((prev) => (prev.includes(srNo) ? prev : [...prev, srNo]));
  }, [srNo]);
  useEffect(() => {
    if (newCbuSrNo != null) setSelectedNewSrNos((prev) => (prev.includes(newCbuSrNo) ? prev : [...prev, newCbuSrNo]));
  }, [newCbuSrNo]);

  // Each old-CBU selection should start the simulation from a clean slate —
  // the shared IUT/MOQ selections (selTransfer/moqSuppliers) intentionally
  // persist across CBU changes, matching the page's previous behaviour.
  useEffect(() => {
    dispatch(resetOnCbuChange());
    setSelectedNewSrNos([]);
  }, [dispatch, srNo]);

  // The dropdown is fully controlled: it hands back the whole next selection,
  // and this derives which one becomes "primary" (the CBU that actually
  // drives Step 2/3) — keep the current primary if it's still selected,
  // otherwise fall back to whichever was picked most recently.
  const handleOldCbuChange = (nextIds: number[]) => {
    setSelectedOldSrNos(nextIds);

    // A CBU can't be both Old and New at once — the New CBU list already
    // hides whatever's picked here, so drop it from the New selection too if
    // it was already checked there before becoming an Old CBU pick.
    const oldSet = new Set(nextIds);
    if (selectedNewSrNos.some((id) => oldSet.has(id))) {
      const nextNewIds = selectedNewSrNos.filter((id) => !oldSet.has(id));
      setSelectedNewSrNos(nextNewIds);
      const nextNewPrimary =
        nextNewIds.length === 0
          ? null
          : newCbuSrNo != null && nextNewIds.includes(newCbuSrNo)
            ? newCbuSrNo
            : nextNewIds[nextNewIds.length - 1];
      if (nextNewPrimary !== newCbuSrNo) dispatch(setNewCbuSrNo(nextNewPrimary));
    }

    const nextPrimary =
      nextIds.length === 0 ? undefined : srNo != null && nextIds.includes(srNo) ? srNo : nextIds[nextIds.length - 1];
    if (nextPrimary == null) {
      // Old CBU drives New CBU and Project Name — clearing it cascades to both.
      dispatch(setProjectName(""));
      navigate({ page: "network-down-stocking-agent-v2" });
    } else if (nextPrimary !== srNo) {
      navigate({ page: "network-down-stocking-agent-v2", srNo: nextPrimary });
    }
  };

  const handleNewCbuChange = (nextIds: number[]) => {
    setSelectedNewSrNos(nextIds);
    const nextPrimary =
      nextIds.length === 0 ? null : newCbuSrNo != null && nextIds.includes(newCbuSrNo) ? newCbuSrNo : nextIds[nextIds.length - 1];
    if (nextPrimary !== newCbuSrNo) dispatch(setNewCbuSrNo(nextPrimary));
  };

  const handleProjectNameChange = (name: string) => {
    dispatch(setProjectName(name));
  };

  const handleProjectNameClear = () => {
    dispatch(setProjectName(""));
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

  const lastSavedDate = lastSavedAt ? new Date(lastSavedAt) : null;

  const cbuBreadcrumbLabel =
    oldRow && newRow ? `${oldRow.cbuCode} → ${newRow.cbuCode}` : oldRow?.cbuCode;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "#f5f7fa" }}
    >
      <PageHeader
        title="Network Down Stocking Agent — V2"
        breadcrumbs={[
          { label: "SAMARTH" },
          { label: "Network Planner" },
          {
            label: "Network Down Stocking Agent — V2",
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
        <SelectCbuStep
          oldSrNos={selectedOldSrNos}
          newSrNos={selectedNewSrNos}
          hasOldCbu={hasCbu}
          projectName={projectName}
          onOldCbuChange={handleOldCbuChange}
          onNewCbuChange={handleNewCbuChange}
          onProjectNameChange={handleProjectNameChange}
          onProjectNameClear={handleProjectNameClear}
        />

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
              oldCbuRow={oldRow}
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
          </>
        )}
      </div>
    </div>
  );
}
