import { useEffect, useMemo, useState } from "react";
import { ProductionPlanModal } from "../../ProductionPlanModal";
import { C } from "../../sciDetails/constants";
import type { ScenarioCatalog } from "../../../api/networkDownStockingSimulator/step3Api";
import type { IUTOption, MOQPlantOption } from "../../sciDetails/types";
import { computeTransitionRows, formatIndianNumber, getActivePlantRoles } from "../../sciDetails/utils";
import { TablePagination } from "../../nationalDashboard/TablePagination";
import { TransposedComponentBreakdownTable, type TransposedBreakdownColumn } from "../../sciDetails/step4/TransposedComponentBreakdownTable";
import {
  Td,
  Th,
  SectionHeading,
  StatTile,
  coverDateLabel,
  editInputStyle,
  laneBadge,
  materialCodeBadge,
  materialDescription,
  RowDeleteButton,
  AddRowButton,
  EditableCell,
  type AddedIutRow,
  type AddedProcurementRow,
  type CustomSnapshotEditState,
  type ScenarioDetailSnapshot,
} from "./ScenarioDetailPrimitives";

/**
 * "More Details" breakdown for a previously-saved custom scenario — replays the exact
 * Summary / IUT / Procurement figures the scenario was created from (see `ScenarioDetailTable`'s
 * "Save as New Scenario"). Loads read-only; the drawer's header Customise button (see
 * `ScenarioComparisonStep`) switches it into an editable view where every IUT/Procurement row
 * (including the ones it was originally saved with) can be edited, removed, or added to — there's
 * no catalog option/plant backing a custom scenario, so unlike a live scenario's Customise mode,
 * every row here is freely editable rather than just the ones added in this session. Business
 * Waste / FG Cover stay frozen at the values the scenario was saved with either way.
 */
const DEFAULT_ROWS_PER_PAGE = 10;

export function CustomScenarioDetailView({
  catalog,
  snapshot,
  isCustomising = false,
  editState,
  onEditStateChange,
  cbuCode,
  cbuDescription,
}: {
  catalog: ScenarioCatalog;
  snapshot: ScenarioDetailSnapshot;
  isCustomising?: boolean;
  editState?: CustomSnapshotEditState;
  onEditStateChange?: (patch: Partial<CustomSnapshotEditState>) => void;
  /** Used only to open the per-plant "View Production Plan" modal from the breakdown below. */
  cbuCode: string;
  cbuDescription: string;
}) {
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const [iutCollapsed, setIutCollapsed] = useState(false);
  const [procurementCollapsed, setProcurementCollapsed] = useState(false);
  const [breakdownCollapsed, setBreakdownCollapsed] = useState(false);
  const [productionPlanPlant, setProductionPlanPlant] = useState<string | null>(null);
  const [iutPage, setIutPage] = useState(1);
  const [iutRowsPerPage, setIutRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [procPage, setProcPage] = useState(1);
  const [procRowsPerPage, setProcRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const editing = isCustomising && !!editState && !!onEditStateChange;
  const iutRows: AddedIutRow[] = editing ? editState!.iutRows : [];
  const procurementRows: AddedProcurementRow[] = editing ? editState!.procurementRows : [];
  const displayTotalCost = editing
    ? iutRows.reduce((sum, r) => sum + r.costPerTrip, 0) + procurementRows.reduce((sum, r) => sum + r.orderQty * r.pricePerUnit, 0)
    : snapshot.totalCost;

  // Component Breakdown by Plant — a saved custom scenario has no live scenarioId/IUTOption/
  // MOQPlantOption backing it (only the frozen snapshot fields), so build minimal adapter
  // objects from the snapshot's own primary IUT row and first Procurement row instead. This
  // mirrors CustomScenarioDetailPage's breakdown construction, but derives its inputs from the
  // snapshot rather than a live catalog selection. Always reflects the saved snapshot, not any
  // in-progress Customise edits — consistent with Business Waste/FG Cover staying frozen too.
  const breakdownTransfer: IUTOption | null = snapshot.iut
    ? {
        id: "custom-breakdown-iut",
        label: "",
        isBest: false,
        routeFrom: snapshot.iut.routeFrom,
        routeTo: snapshot.iut.routeTo,
        material: `${snapshot.iut.matType}-${snapshot.iut.matCode}`,
        transferQty: snapshot.iut.transferQty,
        businessWasteBefore: 0,
        businessWasteAfter: 0,
        reductionVsNoAction: 0,
        laneAvailable: snapshot.iut.laneAvailable,
        costPerTrip: snapshot.iut.costPerTrip,
        transferLeadTime: snapshot.iut.transferLeadTime,
        initiationDate: snapshot.iut.initiationDate,
        prodStopSource: snapshot.iut.initiationDate,
        prodStopDest: snapshot.iut.initiationDate,
      }
    : null;
  const breakdownProcurementRow = snapshot.procurement?.[0] ?? null;
  const breakdownMoq: MOQPlantOption | null = breakdownProcurementRow
    ? {
        id: breakdownProcurementRow.id,
        plant: breakdownProcurementRow.plant,
        isBest: false,
        material: `${breakdownProcurementRow.matType}-${breakdownProcurementRow.matCode}`,
        orderQty: breakdownProcurementRow.orderQty,
        suppliers: [
          {
            id: breakdownProcurementRow.supplierId || breakdownProcurementRow.id,
            name: breakdownProcurementRow.supplierName,
            moq: breakdownProcurementRow.moq,
            pricePerUnit: breakdownProcurementRow.pricePerUnit,
            bizWaste: 0,
            productionDate: "",
          },
        ],
      }
    : null;
  // "iut-moq" just tells getActivePlantRoles/computeTransitionRows to consider both an IUT
  // route and an ordering plant — whichever of breakdownTransfer/breakdownMoq is actually
  // null contributes no role, so this is safe even when the scenario only has one of the two.
  const breakdownActivePlantRoles = useMemo(
    () => getActivePlantRoles("iut-moq", breakdownTransfer, breakdownMoq),
    [breakdownTransfer, breakdownMoq],
  );
  const transposedColumns = useMemo(() => {
    const cols: TransposedBreakdownColumn[] = [];
    for (const { code, roles } of breakdownActivePlantRoles) {
      const plantMeta = catalog.plantBreakdownBase[code];
      if (!plantMeta) continue;
      const rowsByState = computeTransitionRows(code, roles, "iut-moq", breakdownTransfer, breakdownMoq, {});
      // Same "has real data" filter used by the other Component Breakdown by Plant views —
      // every baseline plant is a candidate column, whether or not it has an active role here.
      const beforeRows = rowsByState.before.filter(
        (r) => r.onHandStock !== "—" || r.openPoQty !== "—" || r.fgEquivalentStock !== "—",
      );
      for (const before of beforeRows) {
        const after = rowsByState.after.find((r) => r.component === before.component) ?? null;
        cols.push({ key: `${code}-${before.component}`, plantCode: code, roles, before, after, plantMeta });
      }
    }
    return cols;
  }, [breakdownActivePlantRoles, breakdownTransfer, breakdownMoq]);

  const updateIutRow = (id: string, patch: Partial<AddedIutRow>) =>
    onEditStateChange?.({
      iutRows: editState!.iutRows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      hasChanges: true,
    });
  const removeIutRow = (id: string) =>
    onEditStateChange?.({ iutRows: editState!.iutRows.filter((r) => r.id !== id), hasChanges: true });
  const addIutRow = () => {
    const row: AddedIutRow = {
      id: `added-iut-${Date.now()}`,
      routeFrom: "",
      routeTo: "",
      matType: "RM",
      matCode: "",
      transferQty: 0,
      transferLeadTime: "",
      initiationDate: "",
      laneAvailable: null,
      costPerTrip: 0,
    };
    onEditStateChange?.({ iutRows: [...editState!.iutRows, row], hasChanges: true });
  };

  const updateProcurementRow = (id: string, patch: Partial<AddedProcurementRow>) =>
    onEditStateChange?.({
      procurementRows: editState!.procurementRows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      hasChanges: true,
    });
  const removeProcurementRow = (id: string) =>
    onEditStateChange?.({ procurementRows: editState!.procurementRows.filter((r) => r.id !== id), hasChanges: true });
  const addProcurementRow = () => {
    const row: AddedProcurementRow = {
      id: `added-proc-${Date.now()}`,
      plant: "",
      matType: "RM",
      matCode: "",
      supplierName: "",
      orderQty: 0,
      moq: 0,
      pricePerUnit: 0,
    };
    onEditStateChange?.({ procurementRows: [...editState!.procurementRows, row], hasChanges: true });
  };

  // ── IUT pagination — editing (freely-editable rows) and read-only (snapshot.iut + extraIut)
  // variants render mutually exclusively, so they share one page/rowsPerPage pair. ──
  const iutEditTotalRows = iutRows.length;
  const iutEditTotalPages = Math.max(1, Math.ceil(iutEditTotalRows / iutRowsPerPage));
  const iutEditSafePage = Math.min(iutPage, iutEditTotalPages);
  const pagedIutEditRows = iutRows.slice((iutEditSafePage - 1) * iutRowsPerPage, iutEditSafePage * iutRowsPerPage);

  const iutViewRowElements = [
    ...(snapshot.iut
      ? [
          <tr key="main-iut" style={{ borderTop: `1px solid ${C.bgSlate}` }}>
            <Td><span className="font-bold" style={{ color: C.navy }}>{snapshot.iut.routeFrom}</span></Td>
            <Td><span className="font-bold" style={{ color: C.navy }}>{snapshot.iut.routeTo}</span></Td>
            <Td>{materialCodeBadge(snapshot.iut.matType, snapshot.iut.matCode)}</Td>
            <Td>{materialDescription(snapshot.iut.matType, snapshot.iut.matCode)}</Td>
            <Td align="right"><span className="font-semibold tabular-nums" style={{ color: C.blue }}>{snapshot.iut.transferQty.toLocaleString("en-IN")} EA</span></Td>
            <Td>{snapshot.iut.transferLeadTime}</Td>
            <Td><span className="font-semibold" style={{ color: C.navy }}>{snapshot.iut.initiationDate}</span></Td>
            <Td>{laneBadge(snapshot.iut.laneAvailable)}</Td>
            <Td align="right"><span className="font-semibold" style={{ color: C.navy }}>₹{snapshot.iut.costPerTrip}</span></Td>
          </tr>,
        ]
      : []),
    ...snapshot.extraIut.map((row) => (
      <tr key={row.id} style={{ borderTop: `1px solid ${C.bgSlate}` }}>
        <Td><span className="font-bold" style={{ color: C.navy }}>{row.routeFrom || "—"}</span></Td>
        <Td><span className="font-bold" style={{ color: C.navy }}>{row.routeTo || "—"}</span></Td>
        <Td>{row.matCode ? materialCodeBadge(row.matType, row.matCode) : "—"}</Td>
        <Td>{row.matCode ? materialDescription(row.matType, row.matCode) : "—"}</Td>
        <Td align="right"><span className="font-semibold tabular-nums" style={{ color: C.blue }}>{row.transferQty.toLocaleString("en-IN")} EA</span></Td>
        <Td>{row.transferLeadTime || "—"}</Td>
        <Td><span className="font-semibold" style={{ color: C.navy }}>{row.initiationDate || "—"}</span></Td>
        <Td>{laneBadge(row.laneAvailable)}</Td>
        <Td align="right"><span className="font-semibold" style={{ color: C.navy }}>₹{row.costPerTrip}</span></Td>
      </tr>
    )),
  ];
  const iutViewTotalRows = iutViewRowElements.length;
  const iutViewTotalPages = Math.max(1, Math.ceil(iutViewTotalRows / iutRowsPerPage));
  const iutViewSafePage = Math.min(iutPage, iutViewTotalPages);
  const pagedIutViewRowElements = iutViewRowElements.slice((iutViewSafePage - 1) * iutRowsPerPage, iutViewSafePage * iutRowsPerPage);

  const iutActiveTotalRows = editing ? iutEditTotalRows : iutViewTotalRows;
  useEffect(() => {
    setIutPage(1);
  }, [iutActiveTotalRows, editing]);

  // ── Procurement pagination — same shared-state approach as IUT above. ──
  const procEditTotalRows = procurementRows.length;
  const procEditTotalPages = Math.max(1, Math.ceil(procEditTotalRows / procRowsPerPage));
  const procEditSafePage = Math.min(procPage, procEditTotalPages);
  const pagedProcEditRows = procurementRows.slice((procEditSafePage - 1) * procRowsPerPage, procEditSafePage * procRowsPerPage);

  const procViewRows = snapshot.procurement ?? [];
  const procViewTotalRows = procViewRows.length;
  const procViewTotalPages = Math.max(1, Math.ceil(procViewTotalRows / procRowsPerPage));
  const procViewSafePage = Math.min(procPage, procViewTotalPages);
  const pagedProcViewRows = procViewRows.slice((procViewSafePage - 1) * procRowsPerPage, procViewSafePage * procRowsPerPage);

  const procActiveTotalRows = editing ? procEditTotalRows : procViewTotalRows;
  useEffect(() => {
    setProcPage(1);
  }, [procActiveTotalRows, editing]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px]" style={{ color: C.borderMuted }}>
        Created by customising <span className="font-semibold" style={{ color: C.muted }}>{snapshot.sourceScenarioName}</span>.
        {editing
          ? " Business Waste and FG Cover stay fixed — edit the IUT/Procurement rows below."
          : " These figures are fixed at the values they were saved with."}
      </p>

      {/* ── Summary ── */}
      <div className="rounded-lg overflow-hidden bg-white" style={{ border: `1px solid ${C.border}` }}>
        <SectionHeading
          title="Summary"
          collapsed={summaryCollapsed}
          onToggleCollapse={() => setSummaryCollapsed((v) => !v)}
        />
        {!summaryCollapsed && (
          <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatTile
              label="Business Waste"
              value={snapshot.businessWaste ?? "—"}
              sub={snapshot.wasteSavings ? `↓ ${snapshot.wasteSavings} vs baseline` : undefined}
              subColor={snapshot.wasteColor === "teal" ? C.teal : C.danger}
            />
            <StatTile
              label="FG Cover"
              value={snapshot.fgDaysCover ?? "—"}
              sub={coverDateLabel(snapshot.fgDaysCover) ? `till ${coverDateLabel(snapshot.fgDaysCover)}` : undefined}
            />
            <StatTile label="Total FG Producible" value={`${formatIndianNumber(snapshot.totalFg)} EA`} />
            <StatTile label="IUT Cost" value={`₹${formatIndianNumber(displayTotalCost)}`} />
          </div>
        )}
      </div>

      {/* ── IUT ── */}
      {editing ? (
        (iutRows.length > 0 || isCustomising) && (
          <div className="rounded-lg overflow-hidden bg-white" style={{ border: `1px solid ${C.blue}` }}>
            <SectionHeading
              title="IUT"
              collapsed={iutCollapsed}
              onToggleCollapse={() => setIutCollapsed((v) => !v)}
              extra={<AddRowButton onClick={addIutRow} title="Add another IUT transfer row" label="Add" />}
            />
            {!iutCollapsed && (
              <>
                <div className="overflow-x-auto">
                  {iutRows.length === 0 ? (
                    <div className="px-3 py-6 text-center text-xs italic" style={{ color: C.borderMuted }}>
                      No IUT rows yet — use "Add" above to create one.
                    </div>
                  ) : (
                  <table className="w-full border-collapse" style={{ minWidth: "max-content" }}>
                    <thead>
                      <tr>
                        <Th>Source Plant</Th>
                        <Th>Destination Plant</Th>
                        <Th>Material Code</Th>
                        <Th align="right">Transfer Qty</Th>
                        <Th>Lead Time</Th>
                        <Th>Initiation Date</Th>
                        <Th align="right">Cost / Trip</Th>
                        <Th align="center"> </Th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedIutEditRows.map((row) => (
                        <tr key={row.id} style={{ borderTop: `1px solid ${C.bgSlate}` }}>
                          <Td><EditableCell value={row.routeFrom} onChange={(v) => updateIutRow(row.id, { routeFrom: v })} width={64} placeholder="Plant" /></Td>
                          <Td><EditableCell value={row.routeTo} onChange={(v) => updateIutRow(row.id, { routeTo: v })} width={64} placeholder="Plant" /></Td>
                          <Td>
                            <div className="flex items-center gap-1">
                              <select
                                value={row.matType}
                                onChange={(e) => updateIutRow(row.id, { matType: e.target.value })}
                                className="text-xs rounded px-1 py-0.5 cursor-pointer"
                                style={{ ...editInputStyle, backgroundColor: C.white }}
                              >
                                <option value="RM">RM</option>
                                <option value="PM">PM</option>
                              </select>
                              <EditableCell value={row.matCode} onChange={(v) => updateIutRow(row.id, { matCode: v })} width={80} placeholder="Code" />
                            </div>
                          </Td>
                          <Td align="right">
                            <EditableCell type="number" align="right" value={row.transferQty} onChange={(v) => updateIutRow(row.id, { transferQty: Number(v) || 0 })} width={80} />
                          </Td>
                          <Td>
                            <EditableCell value={row.transferLeadTime} onChange={(v) => updateIutRow(row.id, { transferLeadTime: v })} width={80} placeholder="e.g. 3 days" />
                          </Td>
                          <Td>
                            <EditableCell value={row.initiationDate} onChange={(v) => updateIutRow(row.id, { initiationDate: v })} width={96} placeholder="Date" />
                          </Td>
                          <Td align="right">
                            <EditableCell type="number" align="right" value={row.costPerTrip} onChange={(v) => updateIutRow(row.id, { costPerTrip: Number(v) || 0 })} width={80} />
                          </Td>
                          <Td align="center">
                            <RowDeleteButton onClick={() => removeIutRow(row.id)} title="Remove this IUT row" />
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  )}
                </div>
                {iutEditTotalRows > iutRowsPerPage && (
                  <TablePagination
                    page={iutEditSafePage}
                    rowsPerPage={iutRowsPerPage}
                    totalRows={iutEditTotalRows}
                    onPageChange={setIutPage}
                    onRowsPerPageChange={setIutRowsPerPage}
                  />
                )}
              </>
            )}
          </div>
        )
      ) : (
        (snapshot.iut || snapshot.extraIut.length > 0) && (
          <div className="rounded-lg overflow-hidden bg-white" style={{ border: `1px solid ${C.border}` }}>
            <SectionHeading
              title="IUT"
              collapsed={iutCollapsed}
              onToggleCollapse={() => setIutCollapsed((v) => !v)}
            />
            {!iutCollapsed && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse" style={{ minWidth: "max-content" }}>
                    <thead>
                      <tr>
                        <Th>Source Plant</Th>
                        <Th>Destination Plant</Th>
                        <Th>Material Code</Th>
                        <Th>Material Description</Th>
                        <Th align="right">Transfer Qty</Th>
                        <Th>Lead Time</Th>
                        <Th>Initiation Date</Th>
                        <Th>Lane Availability</Th>
                        <Th align="right">Cost / Trip</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedIutViewRowElements}
                    </tbody>
                  </table>
                </div>
                {iutViewTotalRows > iutRowsPerPage && (
                  <TablePagination
                    page={iutViewSafePage}
                    rowsPerPage={iutRowsPerPage}
                    totalRows={iutViewTotalRows}
                    onPageChange={setIutPage}
                    onRowsPerPageChange={setIutRowsPerPage}
                  />
                )}
              </>
            )}
          </div>
        )
      )}

      {/* ── Procurement ── */}
      {editing ? (
        (procurementRows.length > 0 || isCustomising) && (
          <div className="rounded-lg overflow-hidden bg-white" style={{ border: `1px solid ${C.blue}` }}>
            <SectionHeading
              title="Procure"
              collapsed={procurementCollapsed}
              onToggleCollapse={() => setProcurementCollapsed((v) => !v)}
              extra={<AddRowButton onClick={addProcurementRow} title="Add another procurement order row" label="Add" />}
            />
            {!procurementCollapsed && (
              <>
                <div className="overflow-x-auto">
                  {procurementRows.length === 0 ? (
                    <div className="px-3 py-6 text-center text-xs italic" style={{ color: C.borderMuted }}>
                      No procurement rows yet — use "Add" above to create one.
                    </div>
                  ) : (
                  <table className="w-full border-collapse" style={{ minWidth: "max-content" }}>
                    <thead>
                      <tr>
                        <Th>Plant</Th>
                        <Th>Material Code</Th>
                        <Th>Supplier Name</Th>
                        <Th align="right">Order Quantity</Th>
                        <Th align="right">MOQ</Th>
                        <Th align="center"> </Th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedProcEditRows.map((row) => (
                        <tr key={row.id} style={{ borderTop: `1px solid ${C.bgSlate}` }}>
                          <Td><EditableCell value={row.plant} onChange={(v) => updateProcurementRow(row.id, { plant: v })} width={64} placeholder="Plant" /></Td>
                          <Td>
                            <div className="flex items-center gap-1">
                              <select
                                value={row.matType}
                                onChange={(e) => updateProcurementRow(row.id, { matType: e.target.value })}
                                className="text-xs rounded px-1 py-0.5 cursor-pointer"
                                style={{ ...editInputStyle, backgroundColor: C.white }}
                              >
                                <option value="RM">RM</option>
                                <option value="PM">PM</option>
                              </select>
                              <EditableCell value={row.matCode} onChange={(v) => updateProcurementRow(row.id, { matCode: v })} width={80} placeholder="Code" />
                            </div>
                          </Td>
                          <Td><EditableCell value={row.supplierName} onChange={(v) => updateProcurementRow(row.id, { supplierName: v })} width={120} placeholder="Supplier name" /></Td>
                          <Td align="right">
                            <EditableCell type="number" align="right" value={row.orderQty} onChange={(v) => updateProcurementRow(row.id, { orderQty: Number(v) || 0 })} width={80} />
                          </Td>
                          <Td align="right">
                            <EditableCell type="number" align="right" value={row.moq} onChange={(v) => updateProcurementRow(row.id, { moq: Number(v) || 0 })} width={64} />
                          </Td>
                          <Td align="center">
                            <RowDeleteButton onClick={() => removeProcurementRow(row.id)} title="Remove this procurement row" />
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  )}
                </div>
                {procEditTotalRows > procRowsPerPage && (
                  <TablePagination
                    page={procEditSafePage}
                    rowsPerPage={procRowsPerPage}
                    totalRows={procEditTotalRows}
                    onPageChange={setProcPage}
                    onRowsPerPageChange={setProcRowsPerPage}
                  />
                )}
              </>
            )}
          </div>
        )
      ) : (
        snapshot.procurement && snapshot.procurement.length > 0 && (
          <div className="rounded-lg overflow-hidden bg-white" style={{ border: `1px solid ${C.border}` }}>
            <SectionHeading
              title="Procure"
              collapsed={procurementCollapsed}
              onToggleCollapse={() => setProcurementCollapsed((v) => !v)}
            />
            {!procurementCollapsed && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse" style={{ minWidth: "max-content" }}>
                    <thead>
                      <tr>
                        <Th>Plant</Th>
                        <Th>Material Code &amp; Description</Th>
                        <Th>Supplier Name &amp; Code</Th>
                        <Th align="right">Order Quantity</Th>
                        <Th align="right">MOQ</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedProcViewRows.map((row) => (
                        <tr key={row.id} style={{ borderTop: `1px solid ${C.bgSlate}` }}>
                          <Td><span className="font-bold" style={{ color: C.navy }}>{row.plant}</span></Td>
                          <Td>
                            <span className="inline-flex items-center gap-1.5">
                              {materialCodeBadge(row.matType, row.matCode)}
                              <span style={{ color: C.borderMuted }}>·</span>
                              <span>{materialDescription(row.matType, row.matCode)}</span>
                            </span>
                          </Td>
                          <Td>
                            <span className="font-semibold" style={{ color: C.blue }}>{row.supplierName} <span style={{ color: C.borderMuted }}>· {row.supplierId}</span></span>
                          </Td>
                          <Td align="right">
                            <span className="flex items-center gap-1.5 justify-end">
                              <span className="font-semibold tabular-nums">{formatIndianNumber(row.orderQty)}</span>
                              {row.belowMoq && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap" style={{ backgroundColor: C.warningBg, color: C.warningTextDark }}>
                                  Below MOQ
                                </span>
                              )}
                            </span>
                          </Td>
                          <Td align="right"><span className="tabular-nums">{formatIndianNumber(row.moq)}</span></Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {procViewTotalRows > procRowsPerPage && (
                  <TablePagination
                    page={procViewSafePage}
                    rowsPerPage={procRowsPerPage}
                    totalRows={procViewTotalRows}
                    onPageChange={setProcPage}
                    onRowsPerPageChange={setProcRowsPerPage}
                  />
                )}
              </>
            )}
          </div>
        )
      )}

      {/* ── Component Breakdown by Plant ── */}
      <div className="rounded-lg overflow-hidden bg-white" style={{ border: `1px solid ${C.border}` }}>
        <SectionHeading
          title="Component Breakdown by Plant"
          collapsed={breakdownCollapsed}
          onToggleCollapse={() => setBreakdownCollapsed((v) => !v)}
        />
        {!breakdownCollapsed && (
          transposedColumns.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs italic" style={{ color: C.borderMuted }}>
              No plant breakdown available for this scenario's materials.
            </div>
          ) : (
            <TransposedComponentBreakdownTable columns={transposedColumns} onOpenProductionPlan={setProductionPlanPlant} />
          )
        )}
      </div>
      {productionPlanPlant && (
        <ProductionPlanModal
          plantCode={productionPlanPlant}
          cbuCode={cbuCode}
          cbuDescription={cbuDescription}
          totalProduction={catalog.plantBreakdownBase[productionPlanPlant]?.totalProductionPlanQty ?? 0}
          onClose={() => setProductionPlanPlant(null)}
        />
      )}
    </div>
  );
}
