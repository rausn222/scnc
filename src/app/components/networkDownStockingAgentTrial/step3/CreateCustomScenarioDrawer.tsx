import { DetailDrawer } from "../DetailDrawer";
import { C } from "../../sciDetails/constants";
import { ScenarioDetailTable } from "./ScenarioDetailTable";
import { buildScenarioViewModel, buildSnapshotFromViewModel } from "./scenarioDetailModel";
import type { ScenarioDetailSnapshot, ScenarioEditState } from "./ScenarioDetailPrimitives";

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
    const isFormValid = true;//isIutValid || isProcurementValid;

  const handleSave = () => {
    if (!isFormValid) return;
    const viewModel = buildScenarioViewModel("custom-new", selTransfer, moqSuppliers, editState);
    if (viewModel) onSave(buildSnapshotFromViewModel(viewModel));
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
            style={{ backgroundColor: "#e2e8f0", color: "#475569" }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isFormValid}
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            title={isFormValid ? "Save this custom scenario" : "Complete all IUT and Procurement fields to save"}
            style={{
              backgroundColor: isFormValid ? C.blue : "#cbd5e1",
              color: "#fff",
              cursor: isFormValid ? "pointer" : "not-allowed",
            }}
          >
            Save Scenario
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
