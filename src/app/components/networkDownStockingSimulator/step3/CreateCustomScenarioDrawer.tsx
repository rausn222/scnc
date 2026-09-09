import { Loader2 } from "lucide-react";
import { useState } from "react";
import { DetailDrawer } from "../DetailDrawer";
import { C } from "../../sciDetails/constants";
import { ScenarioDetailTable } from "./ScenarioDetailTable";
import { buildScenarioViewModel, buildSnapshotFromViewModel } from "./scenarioDetailModel";
import type { ScenarioDetailSnapshot, ScenarioEditState } from "./ScenarioDetailPrimitives";

/** How long the "Save Scenario" button spends in its loading state — mirrors the
    "Generate Scenario" simulate-a-real-run delay in ScenarioComparisonStep. */
const SAVE_SCENARIO_DELAY_MS = 700;

export function CreateCustomScenarioDrawer({
  editState,
  onEditStateChange,
  onClose,
  onSave,
  selTransfer,
  moqSuppliers,
  onMoqSupplier,
}: {
  editState: ScenarioEditState;
  onEditStateChange: (patch: Partial<ScenarioEditState>) => void;
  onClose: () => void;
  onSave: (snapshot: ScenarioDetailSnapshot) => void;
  selTransfer: string;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
}) {
  const hasValue = (value: string | number) =>
    typeof value === "number" ? value > 0 : value.trim().length > 0;
  const isIutValid =
    editState.addedIutRows.length > 0 &&
    editState.addedIutRows.every((row) =>
      [
        row.routeFrom,
        row.routeTo,
        row.matCode,
        row.transferQty,
        row.transferLeadTime,
        row.initiationDate,
      ].every(hasValue),
    );
  const isProcurementValid =
    editState.addedProcurementRows.length > 0 &&
    editState.addedProcurementRows.every((row) =>
      [row.plant, row.matCode, row.supplierName, row.orderQty].every(hasValue),
    );
  const isFormValid = isIutValid || isProcurementValid;
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    if (!isFormValid || isSaving) return;
    setIsSaving(true);
    window.setTimeout(() => {
      setIsSaving(false);
      const viewModel = buildScenarioViewModel("custom-new", selTransfer, moqSuppliers, editState);
      if (viewModel) onSave(buildSnapshotFromViewModel(viewModel));
    }, SAVE_SCENARIO_DELAY_MS);
  };

  return (
    <DetailDrawer
      title="Create New Scenario"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: C.border, color: C.mutedDark }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isFormValid || isSaving}
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
            title={isFormValid ? "Save this custom scenario" : "Complete all IUT and Procurement fields to save"}
            style={{
              backgroundColor: isFormValid ? C.blue : C.borderLight,
              color: C.white,
              cursor: isFormValid && !isSaving ? "pointer" : "not-allowed",
            }}
          >
            {isSaving && <Loader2 size={12} className="animate-spin" />}
            {isSaving ? "Saving…" : "Save Scenario"}
          </button>
        </div>
      }
    >
      <div className="p-4">
        <ScenarioDetailTable
          scenarioId="custom-new"
          isCustomising={true}
          editState={editState}
          onEditStateChange={onEditStateChange}
          selTransfer={selTransfer}
          moqSuppliers={moqSuppliers}
          onMoqSupplier={onMoqSupplier}
        />
      </div>
    </DetailDrawer>
  );
}
