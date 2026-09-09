import React, { useEffect, useMemo, useState } from "react";
import { Check, Link2Off, Search } from "lucide-react";
import type { CBURow } from "../../data";
import { ProductionPlanModal } from "../../ProductionPlanModal";
import type { TransferScenarioId, ComponentBreakdownRow } from "../../sciDetails/types";
import {
  C,
  MOQ_PLANT_OPTIONS,
  MOQ_PLANT_OPTIONS_BREAK,
  IUT_TRANSFER_OPTIONS,
  PLANT_BREAKDOWN_BASE,
  PREDEFINED_DETAIL,
  CUSTOM_SCENARIO,
} from "../../sciDetails/constants";
import { getActivePlantRoles, computeTransitionRows } from "../../sciDetails/utils";
import {
  TransposedComponentBreakdownTable,
  type TransposedBreakdownColumn,
} from "./TransposedComponentBreakdownTable";
import { TablePagination } from "../../nationalDashboard/TablePagination";

const DEFAULT_ROWS_PER_PAGE = 10;

export function ScenarioDetailView({
  row,
  scenarioId,
  selTransfer,
  onSelTransfer,
  moqSuppliers,
  onMoqSupplier,
}: {
  row: CBURow;
  scenarioId: string;
  selTransfer: string;
  onSelTransfer: (id: string) => void;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
}) {
  const isCombo = scenarioId === "iut-moq" || scenarioId === "iut-moq-break";

  const cardDefs: { sid: string; transferId: TransferScenarioId | null }[] = isCombo
    ? [
        { sid: "iut", transferId: "iut" },
        { sid: "moq", transferId: "moq" },
      ]
    : [
        {
          sid: scenarioId,
          transferId:
            scenarioId === "iut" ? "iut" : scenarioId === "moq" ? "moq" : null,
        },
      ];

  const [filter, setFilter] = useState("");
  const [productionPlanPlant, setProductionPlanPlant] = useState<string | null>(null);

  const showTransferPicker =
    scenarioId === "iut" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break";
  const showMoqPicker =
    scenarioId === "moq" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break";
  const transferPickerOptions = IUT_TRANSFER_OPTIONS.slice(0, scenarioId === "iut-moq" ? 3 : 2);
  // "Break MOQ" scenarios draw from a distinct (smaller) set of order quantities —
  // must match ScenarioDetailCard's isBreakMoq split, or Open PO here disagrees with
  // the Procurement Options panel above it.
  const moqOptionsForScenario =
    scenarioId === "iut-moq-break" ? MOQ_PLANT_OPTIONS_BREAK : MOQ_PLANT_OPTIONS;

  const selectedTransfer = showTransferPicker
    ? transferPickerOptions.find((o) => o.id === selTransfer) ?? null
    : null;
  // Which MOQ plant is being viewed has no equivalent shared control elsewhere
  // (the expandable scenario row shows all MOQ plants at once), so it always
  // reflects the best plant/supplier for the current scenario — only the IUT
  // option and the per-plant supplier are shared/interactive here.
  const selectedMoq = showMoqPicker
    ? moqOptionsForScenario.find((p) => p.isBest) ?? moqOptionsForScenario[0] ?? null
    : null;

  const activePlantRoles = useMemo(
    () => getActivePlantRoles(scenarioId, selectedTransfer, selectedMoq),
    [scenarioId, selectedTransfer, selectedMoq],
  );

  const plantBlocks = useMemo(
    () =>
      activePlantRoles.map(({ code, roles }) => ({
        code,
        roles,
        rowsByState: computeTransitionRows(code, roles, scenarioId, selectedTransfer, selectedMoq, moqSuppliers),
      })),
    [activePlantRoles, scenarioId, selectedTransfer, selectedMoq, moqSuppliers],
  );

  // Skip a component row entirely if the plant has no real data for it at
  // all (on-hand stock, open PO, and FG-equivalent stock all blank) — an RM
  // or PM row shouldn't render just to show a wall of dashes.
  const hasMeaningfulData = (r: ComponentBreakdownRow) =>
    r.onHandStock !== "—" || r.openPoQty !== "—" || r.fgEquivalentStock !== "—";

  const filterComponents = (rows: ComponentBreakdownRow[], plantCode: string) => {
    const withData = rows.filter(hasMeaningfulData);
    const q = filter.trim().toLowerCase();
    if (!q) return withData;
    return withData.filter(
      (r) =>
        r.component.toLowerCase().includes(q) ||
        plantCode.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q),
    );
  };

  const transposedColumns = useMemo(() => {
    const cols: TransposedBreakdownColumn[] = [];
    for (const block of plantBlocks) {
      const beforeRows = filterComponents(block.rowsByState.before, block.code);
      if (beforeRows.length === 0) continue;
      const matched = new Set(beforeRows.map((r) => r.component));
      const afterByComponent = new Map(
        block.rowsByState.after
          .filter((r) => matched.has(r.component))
          .map((r) => [r.component, r]),
      );
      const plantMeta = PLANT_BREAKDOWN_BASE[block.code];

      for (const before of beforeRows) {
        cols.push({
          key: `${block.code}-${before.component}`,
          plantCode: block.code,
          roles: block.roles,
          before,
          after: afterByComponent.get(before.component) ?? null,
          plantMeta,
        });
      }
    }
    return cols;
  }, [plantBlocks, filter]);

  // ── "Predefined Plan — Details" table (Summary / Transfer Details / MOQ & Procurement
  // column-pairs) — a fixed, hardcoded dataset unrelated to scenarioId/props, so it's computed
  // unconditionally here (not just inside the `scenarioId === "predefined"` branch below) so its
  // pagination hooks can stay unconditional too. Row count never actually exceeds 10 (currently
  // fixed at 5), so the pager below effectively never renders, but the same standard pattern is
  // applied for consistency and in case the dataset grows later.
  const predefinedDetail = PREDEFINED_DETAIL;
  const predefinedProductionStopDate = "—";
  const predefinedSavingsAmount = predefinedDetail.moq.originalOrderCost - predefinedDetail.moq.totalOrderCost;
  const predefinedSummaryRows: { label: string; node: React.ReactNode }[] = [
    { label: "Business Waste", node: <span className="text-xs font-bold tabular-nums" style={{ color: C.teal }}>{predefinedDetail.businessWaste}</span> },
    { label: "Reduction vs No Action", node: <span className="text-xs font-bold tabular-nums" style={{ color: C.green }}>↓ {predefinedDetail.wasteSavings}</span> },
    { label: "Production Cover", node: <span className="text-xs font-bold tabular-nums" style={{ color: C.navy }}>{predefinedDetail.fgDaysCover}</span> },
  ];
  const predefinedTransferRows: { label: string; node: React.ReactNode }[] = [
    { label: "Transfer Location", node: <span className="text-xs font-semibold" style={{ color: C.navy }}>{predefinedDetail.transfer.from} <span style={{ color: C.blue }}>→</span> {predefinedDetail.transfer.to}</span> },
    { label: "Transfer Quantity", node: <span className="text-xs tabular-nums" style={{ color: C.navy }}>{predefinedDetail.transfer.qty.toLocaleString("en-IN")} units</span> },
    {
      label: "Lane Availability", node: predefinedDetail.transfer.laneAvailable
        ? <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.green }}><Check size={11} strokeWidth={2.5} />Available</span>
        : <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#dc2626" }}><Link2Off size={11} />Unavailable</span>
    },
    { label: "Cost of Transfer", node: <span className="text-xs tabular-nums" style={{ color: C.navy }}>₹{predefinedDetail.transfer.costPerTrip.toLocaleString("en-IN")} / trip</span> },
    { label: "Production Stop Date", node: <span className="text-xs font-semibold" style={{ color: "#7c3aed" }}>{predefinedProductionStopDate}</span> },
  ];
  const predefinedMoqRows: { label: string; node: React.ReactNode }[] = [
    { label: "MOQ", node: <span className="text-xs tabular-nums" style={{ color: C.navy }}>{predefinedDetail.moq.qty.toLocaleString("en-IN")} units</span> },
    { label: "Supplier", node: <span className="text-xs font-semibold" style={{ color: C.navy }}>{predefinedDetail.moq.supplier}</span> },
    { label: "Cost / Unit", node: <span className="inline-flex items-center gap-2"><span className="text-[10px] line-through tabular-nums" style={{ color: "#94a3b8" }}>₹{predefinedDetail.moq.originalCostPerUnit}</span><span className="text-xs font-bold tabular-nums" style={{ color: C.green }}>₹{predefinedDetail.moq.costPerUnit}</span></span> },
    { label: "Order Cost", node: <span className="inline-flex items-center gap-2"><span className="text-[10px] line-through tabular-nums" style={{ color: "#94a3b8" }}>₹{predefinedDetail.moq.originalOrderCost.toLocaleString("en-IN")}</span><span className="text-xs font-bold tabular-nums" style={{ color: C.green }}>₹{predefinedDetail.moq.totalOrderCost.toLocaleString("en-IN")}</span></span> },
    { label: "Savings on Order", node: <span className="text-xs font-bold tabular-nums" style={{ color: C.green }}>↓ ₹{predefinedSavingsAmount.toLocaleString("en-IN")}</span> },
  ];
  const predefinedMaxRows = Math.max(predefinedSummaryRows.length, predefinedTransferRows.length, predefinedMoqRows.length);

  const [predefinedPage, setPredefinedPage] = useState(1);
  const [predefinedRowsPerPage, setPredefinedRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  useEffect(() => {
    setPredefinedPage(1);
  }, [predefinedMaxRows]);
  const predefinedTotalPages = Math.max(1, Math.ceil(predefinedMaxRows / predefinedRowsPerPage));
  const predefinedSafePage = Math.min(predefinedPage, predefinedTotalPages);
  const predefinedRowStart = (predefinedSafePage - 1) * predefinedRowsPerPage;
  const predefinedRowEnd = Math.min(predefinedSafePage * predefinedRowsPerPage, predefinedMaxRows);

  if (scenarioId === "predefined") {
    const summaryRows = predefinedSummaryRows;
    const transferRows = predefinedTransferRows;
    const moqRows = predefinedMoqRows;
    const maxRows = predefinedMaxRows;

    const cellLabel = (text: string) => (
      <td className="px-3 py-2 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
        style={{ color: "#94a3b8", backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9", width: "12%" }}>
        {text}
      </td>
    );
    const cellValue = (node: React.ReactNode, last?: boolean) => (
      <td className="px-3 py-2"
        style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9", borderRight: last ? undefined : "2px solid #e2e8f0" }}>
        {node}
      </td>
    );
    return (
      <div className="space-y-4 pt-2">
        <div className="rounded-xl px-5 py-3 flex items-center" style={{ backgroundColor: C.navy, boxShadow: "0 1px 4px rgba(0,48,135,0.10)" }}>
          <p className="text-sm font-bold tracking-wide uppercase text-white">Predefined Plan — Details</p>
        </div>
        <div className="rounded-xl overflow-hidden bg-white" style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}>
          <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: C.navy }}>
                <th colSpan={2} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "#93c5fd", borderRight: "2px solid rgba(255,255,255,0.15)" }}>
                  Summary
                </th>
                <th colSpan={2} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "#93c5fd", borderRight: "2px solid rgba(255,255,255,0.15)" }}>
                  Transfer Details
                </th>
                <th colSpan={2} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "#93c5fd" }}>
                  MOQ &amp; Procurement
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: predefinedRowEnd - predefinedRowStart }, (_, offset) => {
                const i = predefinedRowStart + offset;
                const s = summaryRows[i];
                const t = transferRows[i];
                const m = moqRows[i];
                return (
                  <tr key={i}>
                    {s ? cellLabel(s.label) : <td style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9", width: "12%" }} />}
                    {s ? cellValue(s.node) : <td style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9", borderRight: "2px solid #e2e8f0" }} />}
                    {t ? cellLabel(t.label) : <td style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9", width: "12%" }} />}
                    {t ? cellValue(t.node) : <td style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9", borderRight: "2px solid #e2e8f0" }} />}
                    {m ? cellLabel(m.label) : <td style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9", width: "12%" }} />}
                    {m ? cellValue(m.node, true) : <td style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9" }} />}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {maxRows > predefinedRowsPerPage && (
            <TablePagination
              page={predefinedSafePage}
              rowsPerPage={predefinedRowsPerPage}
              totalRows={maxRows}
              onPageChange={setPredefinedPage}
              onRowsPerPageChange={setPredefinedRowsPerPage}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {productionPlanPlant && (
        <ProductionPlanModal
          plantCode={productionPlanPlant}
          cbuCode={row.cbuCode}
          cbuDescription={row.cbuDescription}
          totalProduction={PLANT_BREAKDOWN_BASE[productionPlanPlant]?.totalProductionPlanQty ?? 0}
          onClose={() => setProductionPlanPlant(null)}
        />
      )}
      {/* Dark blue section header */}
      {/* <div
        className="rounded-xl px-5 py-3 flex items-center"
        style={{
          backgroundColor: C.navy,
          boxShadow: "0 1px 4px rgba(0,48,135,0.10)",
        }}
      >
        <p className="text-sm font-bold tracking-wide uppercase text-white">
          Scenario Details
        </p>
      </div> */}
      {/* Compact scenario card(s) */}
      {/* <div className={`grid gap-3 ${isCombo ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
        {cardDefs.map(({ sid, transferId }) => {
          const scenario = SCENARIOS.find((s) => s.id === sid);
          if (!scenario) return null;
          return (
            <CompactScenarioCard key={sid} scenario={scenario} transferId={transferId} />
          );
        })}
      </div> */}

      {/* IUT transfer options panel */}
      {/* {(scenarioId === "iut" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break") && (
        <StockTransferOptionsPanel count={scenarioId === "iut-moq" ? 3 : 2} />
      )} */}

      {/* procurement options panel */}
      {/* {(scenarioId === "moq" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break") && (
        <MOQProcurementOptionsPanel />
      )} */}

      {/* Scenario comparison card — all options as selectable columns + IUT transfer table */}
      {/* <ScenarioDetailCard key={scenarioId} scenarioId={scenarioId} cardDefs={cardDefs} /> */}

      {/* Component breakdown table — not applicable to the Custom scenario */}
      {scenarioId !== CUSTOM_SCENARIO.id && (
      <div
        className="rounded-xl overflow-hidden bg-white"
        style={{
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 4px rgba(0,48,135,0.06)",
        }}
      >
        <div
          className="px-3 py-2 flex flex-wrap items-start justify-between gap-2"
          style={{ borderBottom: "1px solid #e2e8f0" }}
        >
          <div>
            <p className="text-xs font-bold" style={{ color: C.navy }}>
              Component Breakdown by Plant
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                size={11}
                className="absolute left-2 top-1/2 -translate-y-1/2"
                style={{ color: "#94a3b8" }}
              />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter plant or component"
                className="pl-6 pr-2 py-1 rounded-md text-[10px] focus:outline-none"
                style={{
                  border: "1px solid #d1d5db",
                  minWidth: 180,
                  color: "#111827",
                }}
              />
            </div>
          </div>
        </div>

        <TransposedComponentBreakdownTable
          columns={transposedColumns}
          onOpenProductionPlan={setProductionPlanPlant}
        />
      </div>
      )}
    </div>
  );
}
