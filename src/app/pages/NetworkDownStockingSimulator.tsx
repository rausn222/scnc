import { useEffect } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, Save, Loader2, AlertTriangle } from "lucide-react";
import { useNav } from "../App";
import { PageHeader } from "../components/PageHeader";
import { C, SCENARIOS } from "../components/sciDetails/constants";
import { SelectCbuStep } from "../components/networkDownStockingSimulator/step1/SelectCbuStep";
import { SelectCbuPlaceholder } from "../components/networkDownStockingSimulator/step1/SelectCbuPlaceholder";
import { SimulationAssumptionsStep } from "../components/networkDownStockingSimulator/step2/SimulationAssumptionsStep";
import { ScenarioComparisonStep } from "../components/networkDownStockingSimulator/step3/ScenarioComparisonStep";
import { useCbuDetailQuery } from "../queries/cbuQueries";
import { useSaveDraftMutation } from "../queries/networkDownStockingSimulator";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { markDirty as markDirtyAction, resetOnCbuChange, saveDraft, setFinalAcceptedId, setMoqSupplier, setNewCbuSrNo, setProjectName, setScenariosGenerated, setSelTransfer, setSelectedNewSrNos, setSelectedOldSrNos, toggleAccepted,} from "../store/slices/sciDetailSlice";

interface Props {
  srNo?: number;
  /** No longer drives the reset decision — see the `activeSrNo` comparison below, which
   * preserves state for the same CBU regardless of entry point. Still accepted for the
   * "from" nav target ScenarioComparisonStep/viewDetails builds when returning from
   * Actions & Monitoring, kept for that nav contract. */
  preserveState?: boolean;
}

const PAGE_TITLE = "Network Down Stocking Simulator";
const BREADCRUMBS_BASE = [
  { label: "SAMARTH" },
  { label: "Network Planner" },
];

const SAVE_DRAFT_TOAST = {
  title: "Draft saved",
  description: "Your simulation progress has been saved.",
  duration: 3000,
};
const SAVED_TIME_LOCALE = "en-IN";
const SAVED_TIME_FORMAT: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };

export default function NetworkDownStockingSimulator({ srNo }: Readonly<Props>) {
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
  const scenariosGenerated = useAppSelector((s) => s.sciDetail.scenariosGenerated);
  const finalAcceptedId = useAppSelector((s) => s.sciDetail.finalAcceptedId);

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
  // persist across selections instead of resetting on every switch. Backed by
  // redux (not component state) so they also survive a genuine remount —
  // e.g. leaving the page entirely and coming back to the same CBU.
  const selectedOldSrNos = useAppSelector((s) => s.sciDetail.selectedOldSrNos);
  const selectedNewSrNos = useAppSelector((s) => s.sciDetail.selectedNewSrNos);
  const activeSrNo = useAppSelector((s) => s.sciDetail.activeSrNo);

  // Keeps the multi-select set in sync when the primary CBU changes from
  // outside the dropdown itself (e.g. arriving here with a srNo already set).
  useEffect(() => {
    if (srNo != null && !selectedOldSrNos.includes(srNo)) {
      dispatch(setSelectedOldSrNos([...selectedOldSrNos, srNo]));
    }
  }, [srNo, selectedOldSrNos, dispatch]);
  useEffect(() => {
    if (newCbuSrNo != null && !selectedNewSrNos.includes(newCbuSrNo)) {
      dispatch(setSelectedNewSrNos([...selectedNewSrNos, newCbuSrNo]));
    }
  }, [newCbuSrNo, selectedNewSrNos, dispatch]);

  // Landing here without a srNo at all — the Sidebar's link carries none, unlike National
  // Dashboard's per-row flask icon, and this page never remounts on an in-place nav to itself
  // (constant pageKey — see App.tsx) — shouldn't dead-end on a blank Step 1 if a CBU is already
  // active in this session. Resume it automatically so the user lands straight back on whatever
  // they were last working on instead of having to re-pick the same CBU. Guarded by
  // `selectedOldSrNos` (not just `activeSrNo`) so this can't fight the user's own "×" clear on
  // the Old CBU field, which also navigates with no srNo but empties selectedOldSrNos first —
  // that's the one blank state that must actually stay blank.
  useEffect(() => {
    if (srNo == null && activeSrNo != null && selectedOldSrNos.includes(activeSrNo)) {
      navigate({ page: "network-down-stocking-agent-trial", srNo: activeSrNo, preserveState: true });
    }
  }, [srNo, activeSrNo, selectedOldSrNos, navigate]);

  // Every Step 1/2/3 input (and the shared IUT/MOQ selections) stays visible for as long as the
  // *same* Old CBU is active — revisiting it from National Dashboard, the Sidebar, or Actions &
  // Monitoring all show whatever was last entered. Only an actual CBU switch (a different srNo —
  // via a fresh nav with new CBU data, or picking a different Old CBU in Step 1 itself, which
  // navigates with the newly picked srNo) resets Step 2/3 back to defaults for that new CBU.
  // A momentarily-blank srNo (no CBU chosen yet) is not a switch — nothing to compare against
  // yet, so it must never wipe whatever's already stored for the CBU the user will resume above.
  useEffect(() => {
    if (srNo != null && activeSrNo !== srNo) {
      dispatch(resetOnCbuChange({ srNo }));
    }
  }, [srNo, activeSrNo, dispatch]);

  // The dropdown is fully controlled: it hands back the whole next selection,
  // and this derives which one becomes "primary" (the CBU that actually
  // drives Step 2/3) — keep the current primary if it's still selected,
  // otherwise fall back to whichever was picked most recently.
  const handleOldCbuChange = (nextIds: number[]) => {
    dispatch(setSelectedOldSrNos(nextIds));

    // A CBU can't be both Old and New at once — the New CBU list already
    // hides whatever's picked here, so drop it from the New selection too if
    // it was already checked there before becoming an Old CBU pick.
    const oldSet = new Set(nextIds);
    if (selectedNewSrNos.some((id) => oldSet.has(id))) {
      const nextNewIds = selectedNewSrNos.filter((id) => !oldSet.has(id));
      dispatch(setSelectedNewSrNos(nextNewIds));
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
      navigate({ page: "network-down-stocking-agent-trial" });
    } else if (nextPrimary !== srNo) {
      navigate({ page: "network-down-stocking-agent-trial", srNo: nextPrimary });
    }
  };

  const handleNewCbuChange = (nextIds: number[]) => {
    dispatch(setSelectedNewSrNos(nextIds));
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

  const handleScenariosGeneratedChange = (v: boolean) => {
    dispatch(setScenariosGenerated(v));
  };
  const handleFinalAcceptedIdChange = (id: string | null) => {
    dispatch(setFinalAcceptedId(id));
  };

  const saveDraftMutation = useSaveDraftMutation();
  const isSavingDraft = saveDraftMutation.isPending;
  const handleSaveDraft = () => {
    if (isSavingDraft) return;
    saveDraftMutation.mutate(
      { oldSrNos: selectedOldSrNos, newSrNos: selectedNewSrNos, projectName },
      {
        onSuccess: () => {
          dispatch(saveDraft());
          toast.success(SAVE_DRAFT_TOAST.title, {
            description: SAVE_DRAFT_TOAST.description,
            duration: SAVE_DRAFT_TOAST.duration,
          });
        },
      }
    );
  };

  const lastSavedDate = lastSavedAt ? new Date(lastSavedAt) : null;

  const cbuBreadcrumbLabel =
    oldRow && newRow ? `${oldRow.cbuCode} → ${newRow.cbuCode}` : oldRow?.cbuCode;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: C.pageBg }}
    >
      <PageHeader
        title={PAGE_TITLE}
        breadcrumbs={[
          ...BREADCRUMBS_BASE,
          {
            label: PAGE_TITLE,
            onClick: () => navigate({ page: "dashboard" }),
          },
          ...(cbuBreadcrumbLabel ? [{ label: cbuBreadcrumbLabel }] : []),
        ]}
      />

      {hasCbu && (
        <div
          className="px-5 py-2.5 flex items-center justify-between gap-3 shrink-0 bg-white"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: C.navy }}>
              {projectName || cbuBreadcrumbLabel}
            </p>
            {hasChanges && (
              <p
                className="text-xs mt-0.5 flex items-center gap-1"
                style={{ color: C.warning }}
              >
                <Clock size={11} />
                Unsaved changes
              </p>
            )}
            {!hasChanges && lastSavedDate && (
              <p
                className="text-xs mt-0.5 flex items-center gap-1"
                style={{ color: C.green }}
              >
                <CheckCircle2 size={11} />
                Draft saved · {lastSavedDate.toLocaleTimeString(SAVED_TIME_LOCALE, SAVED_TIME_FORMAT)}
              </p>
            )}
          </div>
          {hasChanges && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              title="Save your current progress as a draft"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
              style={{ backgroundColor: C.blue, color: C.white }}
            >
              {isSavingDraft ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {isSavingDraft ? "Saving…" : "Save Draft"}
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
            <p className="text-sm" style={{ color: C.muted }}>Loading CBU…</p>
          </div>
        )}

        {srNoProvided && !isOldRowLoading && (isOldRowError || !oldRow) && (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <AlertTriangle size={20} style={{ color: C.danger }} />
            <p className="text-sm" style={{ color: C.muted }}>Could not load this CBU.</p>
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
              scenariosGenerated={scenariosGenerated}
              onScenariosGeneratedChange={handleScenariosGeneratedChange}
              finalAcceptedId={finalAcceptedId}
              onFinalAcceptedIdChange={handleFinalAcceptedIdChange}
            />
          </>
        )}
      </div>
    </div>
  );
}
