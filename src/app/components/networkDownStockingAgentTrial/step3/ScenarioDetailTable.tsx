import { useState } from "react";
import { formatIndianNumber } from "../../sciDetails/utils";
import {
  Td,
  Th,
  SectionHeading,
  StatTile,
  coverDateLabel,
  editInputStyle,
  DropdownField,
  laneBadge,
  materialCodeBadge,
  materialDescription,
  RowDeleteButton,
  AddRowButton,
  EditableCell,
  SelectCell,
  autoIutCost,
  autoProcurementValues,
  type AddedIutRow,
  type AddedProcurementRow,
  type ScenarioEditState,
} from "./ScenarioDetailPrimitives";
import { buildScenarioViewModel } from "./scenarioDetailModel";
import { C, IUT_TRANSFER_OPTIONS, MOQ_PLANT_OPTIONS } from "../../sciDetails/constants";

const PLANT_OPTIONS = ["U535", "UTR"];
const MATERIAL_OPTIONS = [...new Set([
  ...IUT_TRANSFER_OPTIONS.map((option) => option.material),
  ...MOQ_PLANT_OPTIONS.map((option) => option.material),
])];
const MATERIAL_SELECT_OPTIONS = MATERIAL_OPTIONS.map((material) => {
  const [type, ...codeParts] = material.split(" ");
  const code = codeParts.join(" ");
  return {
    value: material,
    type,
    code,
    label: `${type}-${code}-${materialDescription(type, code)}`,
  };
});

function MaterialSelect({
  type,
  code,
  onChange,
}: {
  type: string;
  code: string;
  onChange: (material: { type: string; code: string }) => void;
}) {
  const value = type && code ? `${type} ${code}` : "";
  return (
    <DropdownField>
      <select
        value={value}
        onChange={(event) => {
          const [selectedType, ...selectedCodeParts] = event.target.value.split(" ");
          onChange(event.target.value
            ? { type: selectedType, code: selectedCodeParts.join(" ") }
            : { type: "", code: "" });
        }}
        className="text-xs rounded px-1.5 py-0.5 pr-8 cursor-pointer"
        style={{ ...editInputStyle, width: 280 }}
      >
        <option value="">Material code &amp; description</option>
        {MATERIAL_SELECT_OPTIONS.map((material) => (
          <option key={material.value} value={material.value}>
            {material.label}
          </option>
        ))}
      </select>
    </DropdownField>
  );
}
const SUPPLIER_OPTIONS = [...new Set(MOQ_PLANT_OPTIONS.flatMap((option) => option.suppliers.map((supplier) => supplier.name)))];

function currentDateInputValue(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}


/**
 * Unified "More Details" popup content for every scenario row (No Action, IUT, Procurement,
 * IUT + Procurement, IUT + Break MOQ). Always shows exactly one option — the one currently
 * selected app-wide via `selTransfer`/`moqSuppliers` — laid out as Summary / IUT / Procurement
 * row-groups, with IUT and Procurement sections only present when the scenario actually
 * involves them (and not removed via their row-level delete action).
 *
 * Loads read-only; the drawer's header Customise button (see `ScenarioComparisonStep`) switches
 * this into an editable view with per-row deletes. The Reset / Done actions that act on those
 * edits live in the drawer's footer — this component only owns rendering plus reporting
 * edits/deletes upward via `onEditStateChange`.
 */
export function ScenarioDetailTable({
  scenarioId,
  selTransfer,
  moqSuppliers,
  onMoqSupplier,
  isCustomising,
  editState,
  onEditStateChange,
}: {
  scenarioId: string;
  selTransfer: string;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
  isCustomising: boolean;
  editState: ScenarioEditState;
  onEditStateChange: (patch: Partial<ScenarioEditState>) => void;
}) {
  const vm = buildScenarioViewModel(scenarioId, selTransfer, moqSuppliers, editState);
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const [iutCollapsed, setIutCollapsed] = useState(false);
  const [procurementCollapsed, setProcurementCollapsed] = useState(false);
  if (!vm) return null;
  const isCreateMode = scenarioId === "custom-new";
  const { scenario, option, iutMaterial, extraIutRows, procurementRows, totalFg, totalCost } = vm;
  const iutRowCount = isCreateMode ? extraIutRows.length : (vm.iutActive ? 1 : 0) + extraIutRows.length;

  const updateOptionOverride = (patch: ScenarioEditState["optionOverride"]) => {
    onEditStateChange({ optionOverride: { ...editState.optionOverride, ...patch }, hasChanges: true });
  };
  const updateMoqOrderQty = (plantId: string, orderQty: number) => {
    onEditStateChange({ moqOrderQtyOverrides: { ...editState.moqOrderQtyOverrides, [plantId]: orderQty }, hasChanges: true });
  };
  const handleMoqSupplier = (plantId: string, supplierId: string) => {
    if (moqSuppliers[plantId] !== supplierId) onEditStateChange({ hasChanges: true });
    onMoqSupplier(plantId, supplierId);
  };
  const removeIut = () => onEditStateChange({ iutRemoved: true, hasChanges: true });
  const removeProcurementRow = (id: string) =>
    onEditStateChange({ removedProcurementIds: [...editState.removedProcurementIds, id], hasChanges: true });

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
    onEditStateChange({ addedIutRows: [...editState.addedIutRows, row], hasChanges: true });
  };
  const updateAddedIutRow = (id: string, patch: Partial<AddedIutRow>) =>
    onEditStateChange({
      addedIutRows: editState.addedIutRows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      hasChanges: true,
    });
  const removeAddedIutRow = (id: string) =>
    onEditStateChange({ addedIutRows: editState.addedIutRows.filter((r) => r.id !== id), hasChanges: true });

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
    onEditStateChange({ addedProcurementRows: [...editState.addedProcurementRows, row], hasChanges: true });
  };
  const updateAddedProcurementRow = (id: string, patch: Partial<AddedProcurementRow>) =>
    onEditStateChange({
      addedProcurementRows: editState.addedProcurementRows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      hasChanges: true,
    });
  const removeAddedProcurementRow = (id: string) =>
    onEditStateChange({ addedProcurementRows: editState.addedProcurementRows.filter((r) => r.id !== id), hasChanges: true });

  return (
    <div className="flex flex-col gap-3">
      {/* ── Summary ── */}
      {!isCreateMode && (
      <div className="rounded-lg overflow-hidden bg-white" style={{ border: "1px solid #e2e8f0" }}>
        <SectionHeading
          title="Summary"
          collapsed={summaryCollapsed}
          onToggleCollapse={() => setSummaryCollapsed((v) => !v)}
        />
        {!summaryCollapsed && (
          <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatTile
              label="Business Waste"
              value={scenario.businessWaste ?? "—"}
              sub={scenario.wasteSavings ? `↓ ${scenario.wasteSavings} vs baseline` : undefined}
              subColor={scenario.wasteColor === "teal" ? C.teal : "#dc2626"}
            />
            <StatTile
              label="FG Cover"
              value={scenario.fgDaysCover ?? "—"}
              sub={coverDateLabel(scenario.fgDaysCover) ? `till ${coverDateLabel(scenario.fgDaysCover)}` : undefined}
            />
            <StatTile label="Total FG Producible" value={`${formatIndianNumber(totalFg)} EA`} />
            <StatTile label="Total Cost" value={`₹${formatIndianNumber(totalCost)}`} />
          </div>
        )}
      </div>
      )}

      {/* ── IUT ── */}
      {vm.iutActive && (
        <div className="rounded-lg overflow-hidden bg-white" style={{ border: isCustomising ? `1px solid ${C.blue}` : "1px solid #e2e8f0" }}>
          <SectionHeading
            title="IUT"
            collapsed={iutCollapsed}
            onToggleCollapse={() => setIutCollapsed((v) => !v)}
            extra={isCustomising ? <AddRowButton onClick={addIutRow} title="Add another IUT transfer row" label="Add" /> : undefined}
          />
          {!iutCollapsed && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: "max-content", border: `1px solid ${C.borderBlue}` }}>
              <thead>
                <tr style={{ backgroundColor: C.navy }}>
                  <Th>Source Plant</Th>
                  <Th>Destination Plant</Th>
                  {isCreateMode ? <Th>Material Code &amp; Description</Th> : <Th>Material Code</Th>}
                  {!isCreateMode && <Th>Material Description</Th>}
                  <Th align={isCreateMode ? "left" : "right"}>Transfer Qty</Th>
                  <Th>Lead Time</Th>
                  <Th>{isCreateMode ? "Expected Delivery Date" : "Initiation Date"}</Th>
                  {!isCreateMode && <Th>Lane Availability</Th>}
                  <Th align={isCreateMode ? "left" : "right"}>Cost / Trip</Th>
                    {isCustomising && (
                      <Th align="center">
                        Delete
                      </Th>
                    )}
                </tr>
              </thead>
              <tbody>
                {scenarioId !== "custom-new" && (
                <tr style={{ borderTop: "1px solid #f1f5f9" }}>
                  <Td><span className="font-bold" style={{ color: C.navy }}>{option.routeFrom}</span></Td>
                  <Td><span className="font-bold" style={{ color: C.navy }}>{option.routeTo}</span></Td>
                  <Td>{materialCodeBadge(iutMaterial.type, iutMaterial.code)}</Td>
                  <Td>{materialDescription(iutMaterial.type, iutMaterial.code)}</Td>
                  <Td align="right">
                    {isCustomising ? (
                      <input
                        type="number"
                        min={0}
                        value={option.transferQty}
                        onChange={(e) => updateOptionOverride({ transferQty: Number(e.target.value) || 0 })}
                        className="text-right text-xs tabular-nums rounded px-1.5 py-0.5"
                        style={{ ...editInputStyle, width: 125, minHeight: 34 }}
                      />
                    ) : (
                      <span className="font-semibold tabular-nums" style={{ color: C.blue }}>{option.transferQty.toLocaleString("en-IN")} EA</span>
                    )}
                  </Td>
                  <Td>
                    {isCustomising ? (
                      <input
                        type="text"
                        value={option.transferLeadTime}
                        onChange={(e) => updateOptionOverride({ transferLeadTime: e.target.value })}
                        className="text-xs rounded px-1.5 py-0.5"
                        style={{ ...editInputStyle, width: 130, minHeight: 34 }}
                      />
                    ) : option.transferLeadTime}
                  </Td>
                  <Td>
                    {isCustomising ? (
                      <input
                        type="text"
                        value={option.initiationDate}
                        onChange={(e) => updateOptionOverride({ initiationDate: e.target.value })}
                        className="text-xs font-semibold rounded px-1.5 py-0.5"
                        style={{ ...editInputStyle, width: 155, minHeight: 34 }}
                      />
                    ) : (
                      <span className="font-semibold" style={{ color: C.navy }}>{option.initiationDate}</span>
                    )}
                  </Td>
                  <Td>{laneBadge(option.laneAvailable)}</Td>
                  <Td align="right">
                    {isCustomising ? (
                      <input
                        type="number"
                        min={0}
                        value={option.costPerTrip}
                        onChange={(e) => updateOptionOverride({ costPerTrip: Number(e.target.value) || 0 })}
                        className="text-right text-xs font-semibold rounded px-1.5 py-0.5"
                        style={{ ...editInputStyle, width: 125, minHeight: 34 }}
                      />
                    ) : (
                      <span className="font-semibold" style={{ color: C.navy }}>₹{option.costPerTrip}</span>
                    )}
                  </Td>
                  {isCustomising && (
                    <Td align="center">
                      <RowDeleteButton onClick={removeIut} title="Remove this IUT flow from the scenario" />
                    </Td>
                  )}
                </tr>
                )}
                {extraIutRows.map((row) => (
                  <tr key={row.id} style={{ borderTop: "1px solid #f1f5f9", backgroundColor: "transparent" }}>
                    <Td>
                      {isCustomising ? (
                        isCreateMode ? <SelectCell value={row.routeFrom} onChange={(v) => updateAddedIutRow(row.id, { routeFrom: v })} options={PLANT_OPTIONS} width={105} placeholder="Plant" /> : <EditableCell value={row.routeFrom} onChange={(v) => updateAddedIutRow(row.id, { routeFrom: v })} width={105} placeholder="Plant" />
                      ) : (
                        <span className="font-bold" style={{ color: C.navy }}>{row.routeFrom || "—"}</span>
                      )}
                    </Td>
                    <Td>
                      {isCustomising ? (
                        isCreateMode ? <SelectCell value={row.routeTo} onChange={(v) => updateAddedIutRow(row.id, { routeTo: v })} options={PLANT_OPTIONS} width={105} placeholder="Plant" /> : <EditableCell value={row.routeTo} onChange={(v) => updateAddedIutRow(row.id, { routeTo: v })} width={105} placeholder="Plant" />
                      ) : (
                        <span className="font-bold" style={{ color: C.navy }}>{row.routeTo || "—"}</span>
                      )}
                    </Td>
                    <Td>
                      {isCustomising ? (
                        <div className="flex items-center gap-1">
                          {isCreateMode ? (
                            <MaterialSelect
                              type={row.matType}
                              code={row.matCode}
                              onChange={(material) => updateAddedIutRow(row.id, material)}
                            />
                          ) : (
                            <EditableCell value={row.matCode} onChange={(v) => updateAddedIutRow(row.id, { matCode: v })} width={80} placeholder="Code" />
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          {materialCodeBadge(row.matType, row.matCode)}
                          <span style={{ color: "#94a3b8" }}>·</span>
                          <span>{row.matCode ? materialDescription(row.matType, row.matCode) : "—"}</span>
                        </span>
                      )}
                    </Td>
                    {!isCreateMode && <Td>{row.matCode ? materialDescription(row.matType, row.matCode) : "—"}</Td>}
                    <Td align={isCreateMode ? "left" : "right"}>
                      {isCustomising ? (
                        <EditableCell type="number" align={isCreateMode ? "left" : "right"} value={row.transferQty} onChange={(v) => updateAddedIutRow(row.id, { transferQty: Number(v) || 0 })} width={125} />
                      ) : (
                        <span className="font-semibold tabular-nums" style={{ color: C.blue }}>{row.transferQty.toLocaleString("en-IN")} EA</span>
                      )}
                    </Td>
                    <Td>
                      {isCustomising ? (
                        <EditableCell value={row.transferLeadTime} onChange={(v) => updateAddedIutRow(row.id, { transferLeadTime: v })} width={130} placeholder="e.g. 3 days" />
                      ) : row.transferLeadTime || "—"}
                    </Td>
                    <Td>
                      {isCustomising ? (
                        isCreateMode ? (
                          <input
                            type="date"
                            value={row.initiationDate}
                            min={currentDateInputValue()}
                            onChange={(e) => updateAddedIutRow(row.id, { initiationDate: e.target.value })}
                            className="text-xs rounded px-1.5 py-0.5"
                            style={{ ...editInputStyle, width: 155 }}
                          />
                        ) : <EditableCell value={row.initiationDate} onChange={(v) => updateAddedIutRow(row.id, { initiationDate: v })} width={155} placeholder="Date" />
                      ) : (
                        <span className="font-semibold" style={{ color: C.navy }}>{row.initiationDate || "—"}</span>
                      )}
                    </Td>
                    {!isCreateMode && <Td>{laneBadge(row.laneAvailable)}</Td>}
                    <Td align={isCreateMode ? "left" : "right"}>
                      <span className="font-semibold" style={{ color: C.navy }}>
                        ₹{isCreateMode ? autoIutCost(row.routeFrom, row.routeTo) : row.costPerTrip}
                      </span>
                    </Td>
                    {isCustomising && (
                      <Td align="center">
                        <RowDeleteButton onClick={() => removeAddedIutRow(row.id)} title="Remove this added IUT row" />
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* ── Procurement ── */}
      {vm.procurementApplicable && (procurementRows.length > 0 || isCustomising) && (
        <div className="rounded-lg overflow-hidden bg-white" style={{ border: isCustomising ? `1px solid ${C.blue}` : "1px solid #e2e8f0" }}>
          <SectionHeading
            title="Procurement"
            collapsed={procurementCollapsed}
            onToggleCollapse={() => setProcurementCollapsed((v) => !v)}
            extra={isCustomising ? <AddRowButton onClick={addProcurementRow} title="Add another procurement order row" label="Add" /> : undefined}
          />
          {!procurementCollapsed && (
          <div className="overflow-x-auto">
            {procurementRows.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs italic" style={{ color: "#94a3b8" }}>
                No procurement rows yet — use "Add" above to create one.
              </div>
            ) : (
            <table className="w-full border-collapse" style={{ minWidth: "max-content", border: `1px solid ${C.borderBlue}` }}>
              <thead>
                <tr style={{ backgroundColor: C.navy }}>
                  <Th>Plant</Th>
                  <Th>Material Code &amp; Description</Th>
                  <Th>Supplier Name &amp; Code</Th>
                  <Th align={isCreateMode ? "left" : "right"}>Order Quantity</Th>
                  <Th align={isCreateMode ? "left" : "right"}>MOQ</Th>
                  <Th align={isCreateMode ? "left" : "right"}>Price / Unit</Th>
                  <Th align={isCreateMode ? "left" : "right"}>Total Estimated Cost</Th>
                  {isCustomising && <Th align="center"> </Th>}
                </tr>
              </thead>
              <tbody>
                {procurementRows.map((row) => (
                  <tr key={row.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <Td>
                      {row.custom && isCustomising ? (
                        isCreateMode ? <SelectCell value={row.plant} onChange={(v) => updateAddedProcurementRow(row.id, { plant: v })} options={PLANT_OPTIONS} width={105} placeholder="Plant" /> : <EditableCell value={row.plant} onChange={(v) => updateAddedProcurementRow(row.id, { plant: v })} width={105} placeholder="Plant" />
                      ) : (
                        <span className="font-bold" style={{ color: C.navy }}>{row.plant || "—"}</span>
                      )}
                    </Td>
                    <Td>
                      {row.custom && isCustomising ? (
                        <div className="flex items-center gap-1">
                          {isCreateMode ? (
                            <MaterialSelect
                              type={row.matType}
                              code={row.matCode}
                              onChange={(material) => updateAddedProcurementRow(row.id, material)}
                            />
                          ) : (
                            <EditableCell value={row.matCode} onChange={(v) => updateAddedProcurementRow(row.id, { matCode: v })} width={80} placeholder="Code" />
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          {materialCodeBadge(row.matType, row.matCode)}
                          <span style={{ color: "#94a3b8" }}>·</span>
                          <span>{row.matCode ? materialDescription(row.matType, row.matCode) : "—"}</span>
                        </span>
                      )}
                    </Td>
                    <Td>
                      {row.custom ? (
                        isCustomising ? (
                          isCreateMode ? <SelectCell value={row.supplierName} onChange={(v) => updateAddedProcurementRow(row.id, { supplierName: v })} options={SUPPLIER_OPTIONS} width={220} placeholder="Supplier name" /> : <EditableCell value={row.supplierName} onChange={(v) => updateAddedProcurementRow(row.id, { supplierName: v })} width={180} placeholder="Supplier name" />
                        ) : (
                          <span className="font-semibold" style={{ color: C.blue }}>{row.supplierName || "—"}</span>
                        )
                      ) : isCustomising ? (
                        <DropdownField>
                          <select
                            value={row.supplierId}
                            onChange={(e) => handleMoqSupplier(row.id, e.target.value)}
                            className="text-xs rounded px-1.5 py-0.5 pr-8 cursor-pointer"
                            style={{ ...editInputStyle, width: 220 }}
                          >
                            {row.availableSuppliers.map((s) => (
                              <option key={s.id} value={s.id}>{s.name} · {s.id}</option>
                            ))}
                          </select>
                        </DropdownField>
                      ) : (
                        <span className="font-semibold" style={{ color: C.blue }}>{row.supplierName} <span style={{ color: "#94a3b8" }}>· {row.supplierId}</span></span>
                      )}
                    </Td>
                    <Td align={isCreateMode ? "left" : "right"}>
                      <span className={`flex items-center gap-1.5 ${isCreateMode ? "justify-start" : "justify-end"}`}>
                        {isCustomising ? (
                          <input
                            type="number"
                            min={0}
                            value={row.orderQty}
                            onChange={(e) =>
                              row.custom
                                ? updateAddedProcurementRow(row.id, { orderQty: Number(e.target.value) || 0 })
                                : updateMoqOrderQty(row.id, Number(e.target.value) || 0)
                            }
                            className={`text-xs tabular-nums rounded px-1.5 py-0.5 ${isCreateMode ? "text-left" : "text-right"}`}
                            style={{ ...editInputStyle, width: 130, minHeight: 34 }}
                          />
                        ) : (
                          <span className="font-semibold tabular-nums">{formatIndianNumber(row.orderQty)}</span>
                        )}
                        {row.belowMoq && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>
                            Below MOQ
                          </span>
                        )}
                      </span>
                    </Td>
                    <Td align={isCreateMode ? "left" : "right"}>
                      {row.custom && isCustomising ? (
                        isCreateMode ? (
                          <span className="font-semibold tabular-nums" style={{ color: C.navy }}>
                            {autoProcurementValues(row.plant, row.matType, row.matCode, row.supplierName).moq}
                          </span>
                        ) : <EditableCell type="number" align="right" value={row.moq} onChange={(v) => updateAddedProcurementRow(row.id, { moq: Number(v) || 0 })} width={64} />
                      ) : (
                        <span className="tabular-nums">{formatIndianNumber(row.moq)}</span>
                      )}
                    </Td>
                    <Td align={isCreateMode ? "left" : "right"}>
                      {row.custom && isCustomising ? (
                        isCreateMode ? (
                          <span className="font-semibold tabular-nums" style={{ color: C.navy }}>
                            ₹{autoProcurementValues(row.plant, row.matType, row.matCode, row.supplierName).pricePerUnit}
                          </span>
                        ) : <EditableCell type="number" align="right" value={row.pricePerUnit} onChange={(v) => updateAddedProcurementRow(row.id, { pricePerUnit: Number(v) || 0 })} width={64} />
                      ) : (
                        <span className="tabular-nums">₹{row.pricePerUnit}</span>
                      )}
                    </Td>
                    <Td align={isCreateMode ? "left" : "right"}>
                      <span className="font-bold tabular-nums" style={{ color: C.navy }}>
                        ₹{formatIndianNumber(isCreateMode ? row.orderQty * autoProcurementValues(row.plant, row.matType, row.matCode, row.supplierName).pricePerUnit : row.total)}
                      </span>
                    </Td>
                    {isCustomising && (
                      <Td align="center">
                        <RowDeleteButton
                          onClick={() => (row.custom ? removeAddedProcurementRow(row.id) : removeProcurementRow(row.id))}
                          title={row.custom ? "Remove this added procurement row" : `Remove ${row.plant}'s order from the scenario`}
                        />
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
          )}
        </div>
      )}
    </div>
  );
}
