import { IutProcurementSummaryReport } from "./IutProcurementSummaryReport";

/**
 * "IUT + Procurement New" row's More Details content. Delegates to the self-contained
 * plant/material-grouped report (IutProcurementSummaryReport) — this wrapper just keeps the
 * same prop signature the row's parent already calls it with, even though the report doesn't
 * need them, so the row wiring in ScenarioComparisonStep.tsx didn't need to change.
 */
export function IutProcurementNewDetail(_props: {
  selTransfer: string;
  onSelTransfer: (id: string) => void;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
}) {
  return <IutProcurementSummaryReport />;
}
