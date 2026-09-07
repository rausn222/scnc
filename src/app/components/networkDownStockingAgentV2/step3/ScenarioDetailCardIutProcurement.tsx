import { useState } from "react";
import {
  ArrowLeftRight,
  Check,
  Clock,
  Factory,
  Link2Off,
  Pencil,
  RotateCcw,
  ShoppingCart,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type { IUTOption, MOQPlantOption, PlantRole } from "../../sciDetails/types";
import { C, IUT_TRANSFER_OPTIONS, MOQ_PLANT_OPTIONS, PLANT_BREAKDOWN_BASE, PM_BADGE, RM_BADGE } from "../../sciDetails/constants";
import { computeAfterQtyAndDate, formatIndianNumber } from "../../sciDetails/utils";
import { ReportBadge } from "../../sciDetails/step3report/ReportPrimitives";

function materialBadge(material: string) {
  const [type, ...rest] = material.split(" ");
  const badge = type === "RM" ? RM_BADGE : type === "PM" ? PM_BADGE : { bg: "#f1f5f9", color: "#64748b" };
  return (
    <span className="inline-flex items-center gap-1.5 shrink-0">
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>
        {type}
      </span>
      <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: C.navy }}>{rest.join(" ")}</span>
    </span>
  );
}

function laneBadge(available: boolean | null) {
  if (available === true) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold whitespace-nowrap" style={{ color: C.green }}>
        <Check size={10} strokeWidth={2.5} />Lane available
      </span>
    );
  }
  if (available === false) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold whitespace-nowrap" style={{ color: "#ea580c" }}>
        <Link2Off size={10} />Lane unavailable
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold whitespace-nowrap" style={{ color: "#d97706" }}>
      <Clock size={10} />Lane not set
    </span>
  );
}

const editInputStyle = { border: `1px solid ${C.blue}`, color: C.navy, outline: "none" } as const;

/** Small icon-button row shared by every IUT/Procurement line — Edit + (optionally) Delete +
    Accept when live; a single Restore when excluded; a locked "Accepted" badge + Undo when
    accepted. This is the "against each of it, an edit button, either delete or an edit, so you
    can delete/accept it directly there" affordance from the redesign brief. */
function RowActions({
  isEditing,
  isExcluded,
  isAccepted,
  canDelete,
  onToggleEdit,
  onDelete,
  onRestore,
  onAccept,
  onUnaccept,
}: {
  isEditing: boolean;
  isExcluded: boolean;
  isAccepted: boolean;
  canDelete: boolean;
  onToggleEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onAccept: () => void;
  onUnaccept: () => void;
}) {
  const iconBtnStyle = { color: "#64748b" } as const;

  if (isExcluded) {
    return (
      <button
        type="button"
        onClick={onRestore}
        title="Restore this line"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold cursor-pointer"
        style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}
      >
        <RotateCcw size={11} />
        Restore
      </button>
    );
  }

  if (isAccepted) {
    return (
      <div className="flex items-center gap-1 justify-end">
        <ReportBadge tone="success"><Check size={9} strokeWidth={2.5} />Accepted</ReportBadge>
        <button
          type="button"
          onClick={onUnaccept}
          title="Undo accept"
          className="p-1 rounded hover:bg-slate-100 cursor-pointer"
          style={iconBtnStyle}
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 justify-end">
      <button
        type="button"
        onClick={onToggleEdit}
        title={isEditing ? "Stop editing this line" : "Edit this line"}
        className="p-1 rounded hover:bg-slate-100 cursor-pointer"
        style={isEditing ? { color: C.blue, backgroundColor: C.bgBlue } : iconBtnStyle}
      >
        <Pencil size={12} />
      </button>
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          title="Exclude this line from totals"
          className="p-1 rounded hover:bg-slate-100 cursor-pointer"
          style={iconBtnStyle}
        >
          <Trash2 size={12} />
        </button>
      )}
      <button
        type="button"
        onClick={onAccept}
        title="Accept this line"
        className="p-1 rounded hover:bg-green-50 cursor-pointer"
        style={{ color: C.green }}
      >
        <Check size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function SubTableHeading({ label, icon, suffix }: { label: string; icon?: React.ReactNode; suffix?: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#94a3b8" }}>{label}</span>
      {suffix && <span className="text-[10px]" style={{ color: "#cbd5e1" }}>· {suffix}</span>}
    </div>
  );
}

function ImpactStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-2.5" style={{ backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}>
      <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>{label}</p>
      <p className="text-xs font-bold mt-0.5 truncate" style={{ color: C.navy }}>{value}</p>
    </div>
  );
}

type PlantOutcome = { plantCode: string; finalFgProducible: number; productionStopDate: string; planChangeRequired: boolean };

const OPTIONS_GRID_COLS = "minmax(150px,1.6fr) 110px 110px 1fr 110px";

/**
 * "IUT + Procurement" (scenario id "iut-moq") detail popup — IUT Flow and Procurement are both
 * real tables (header row + stacked line items) with the Scenario Summary on top. Procurement is
 * grouped by RM/PM material code so the two plants that happen to order the same material (e.g.
 * "PM 64330490" at U535 and U635) sit together instead of being split across separate plant rows.
 * Every line — IUT or Procurement — carries its own Edit / Delete / Accept actions so a planner
 * can adjust, exclude, or sign off on one line without touching the rest.
 */
export function ScenarioDetailCardIutProcurement({
  selTransfer,
  onSelTransfer,
  moqSuppliers,
  onMoqSupplier,
}: {
  selTransfer: string;
  onSelTransfer: (id: string) => void;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
}) {
  const options = IUT_TRANSFER_OPTIONS;

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [excludedRowIds, setExcludedRowIds] = useState<Set<string>>(new Set());
  const [acceptedRowIds, setAcceptedRowIds] = useState<Set<string>>(new Set());
  const [optionOverrides, setOptionOverrides] = useState<
    Record<string, Partial<Pick<IUTOption, "transferQty" | "transferLeadTime" | "costPerTrip" | "initiationDate">>>
  >({});
  const [moqOrderQtyOverrides, setMoqOrderQtyOverrides] = useState<Record<string, number>>({});

  const toggleEdit = (rowId: string) => setEditingRowId((cur) => (cur === rowId ? null : rowId));
  const excludeRow = (rowId: string) => {
    setExcludedRowIds((prev) => new Set(prev).add(rowId));
    setEditingRowId((cur) => (cur === rowId ? null : cur));
  };
  const restoreRow = (rowId: string) => setExcludedRowIds((prev) => { const next = new Set(prev); next.delete(rowId); return next; });
  const acceptRow = (rowId: string) => {
    setAcceptedRowIds((prev) => new Set(prev).add(rowId));
    setEditingRowId((cur) => (cur === rowId ? null : cur));
  };
  const unacceptRow = (rowId: string) => setAcceptedRowIds((prev) => { const next = new Set(prev); next.delete(rowId); return next; });

  const updateOptionOverride = (
    id: string,
    patch: Partial<Pick<IUTOption, "transferQty" | "transferLeadTime" | "costPerTrip" | "initiationDate">>,
  ) => setOptionOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  const updateMoqOrderQty = (plantId: string, orderQty: number) =>
    setMoqOrderQtyOverrides((prev) => ({ ...prev, [plantId]: orderQty }));

  // Procurement is shared across every IUT routing option (it doesn't change with the route) —
  // only excluded lines drop out of totals/plant-impact.
  const effMoqPlantData = MOQ_PLANT_OPTIONS.map((p) => ({ ...p, orderQty: moqOrderQtyOverrides[p.id] ?? p.orderQty }));
  const activeMoqPlantData = effMoqPlantData.filter((p) => !excludedRowIds.has(p.id));

  const computeOutcome = (plantCode: string, transfer: IUTOption, moqPlant: MOQPlantOption | null): PlantOutcome | null => {
    const base = PLANT_BREAKDOWN_BASE[plantCode];
    if (!base) return null;
    const roles: PlantRole[] = [];
    if (transfer.routeFrom === plantCode) roles.push("source");
    if (transfer.routeTo === plantCode) roles.push("destination");
    if (moqPlant?.plant === plantCode) roles.push("ordering");
    const { qty, date } = computeAfterQtyAndDate(
      plantCode,
      roles,
      "iut-moq",
      transfer,
      moqPlant,
      moqSuppliers,
      base.totalProductionPlanQty,
      base.prodStopDate,
    );
    return { plantCode, finalFgProducible: qty, productionStopDate: date, planChangeRequired: date !== base.prodStopDate };
  };

  const procurementCost = activeMoqPlantData.reduce((sum, plant) => {
    const supplier = plant.suppliers.find((s) => s.id === moqSuppliers[plant.id]) ?? plant.suppliers[0];
    return sum + plant.orderQty * supplier.pricePerUnit;
  }, 0);

  const optionSummaries = options.map((option) => {
    const effOption: IUTOption = { ...option, ...optionOverrides[option.id] };
    const plantOutcomes = Object.keys(PLANT_BREAKDOWN_BASE)
      .map((code) => computeOutcome(code, effOption, activeMoqPlantData.find((p) => p.plant === code) ?? null))
      .filter((o): o is PlantOutcome => o !== null);
    const totalFg = plantOutcomes.reduce((sum, o) => sum + o.finalFgProducible, 0);
    const totalCost = effOption.costPerTrip + procurementCost;
    return { option, effOption, plantOutcomes, totalFg, totalCost };
  });

  const selected = optionSummaries.find((s) => s.option.id === selTransfer) ?? optionSummaries.find((s) => s.option.isBest) ?? optionSummaries[0];
  const isSelectedAccepted = acceptedRowIds.has(`iut-${selected.option.id}`);
  const isSelectedEditing = editingRowId === `iut-${selected.option.id}`;

  // Procurement grouped by RM/PM material code — plants that happen to order the same code
  // (e.g. U535 and U635 both need "PM 64330490") sit together, one below the other.
  const procurementGroups = effMoqPlantData.reduce<{ material: string; rows: MOQPlantOption[] }[]>((groups, plant) => {
    const group = groups.find((g) => g.material === plant.material);
    if (group) group.rows.push(plant);
    else groups.push({ material: plant.material, rows: [plant] });
    return groups;
  }, []);

  return (
    <div className="space-y-4">
      {/* Routing options — pick which IUT option the Scenario Summary / IUT Flow below reflect. */}
      <div className="rounded-xl overflow-hidden bg-white" style={{ border: "1px solid #e2e8f0" }}>
        <div
          className="grid items-center px-3 py-2 text-[10px] font-bold uppercase tracking-wide"
          style={{ gridTemplateColumns: OPTIONS_GRID_COLS, backgroundColor: C.bgBlue, color: C.navy }}
        >
          <span>Option</span>
          <span>Total Cost</span>
          <span>Total FG</span>
          <span>Route</span>
          <span className="text-right">Action</span>
        </div>
        {optionSummaries.map(({ option, totalCost, totalFg }) => {
          const isSel = selTransfer === option.id;
          return (
            <div
              key={option.id}
              className="grid items-center px-3 py-2.5"
              style={{ gridTemplateColumns: OPTIONS_GRID_COLS, backgroundColor: isSel ? C.bgBlue : "#fff", borderTop: "1px solid #e2e8f0" }}
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold" style={{ color: C.navy }}>{option.label}</span>
                {option.isBest && <ReportBadge tone="success"><Star size={9} fill="currentColor" />Recommended</ReportBadge>}
                {isSel && <ReportBadge tone="info"><Check size={9} strokeWidth={2.5} />Selected</ReportBadge>}
              </div>
              <span className="text-xs font-bold tabular-nums" style={{ color: C.blue }}>₹{formatIndianNumber(totalCost)}</span>
              <span className="text-xs font-semibold tabular-nums" style={{ color: "#166534" }}>{formatIndianNumber(totalFg)} EA</span>
              <span className="text-[11px]" style={{ color: "#64748b" }}>
                {option.routeFrom} <span style={{ color: C.blue }}>→</span> {option.routeTo}
              </span>
              <button
                type="button"
                disabled={isSel}
                onClick={() => onSelTransfer(option.id)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold justify-self-end transition-opacity"
                style={{
                  backgroundColor: isSel ? "#dcfce7" : C.blue,
                  color: isSel ? "#166534" : "#fff",
                  cursor: isSel ? "default" : "pointer",
                }}
              >
                {isSel ? "Selected" : "Select"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Scenario Summary — sits at the top of the detail, above the IUT Flow / Procurement tables. */}
      <div>
        <SubTableHeading label="Scenario Summary" icon={<Factory size={11} style={{ color: C.blue }} />} />
        <div className="grid grid-cols-2 gap-2">
          <ImpactStat label="Total Cost" value={`₹${formatIndianNumber(selected.totalCost)}`} />
          <ImpactStat label="Total FG Producible" value={`${formatIndianNumber(selected.totalFg)} EA`} />
        </div>
      </div>

      {/* IUT Flow — a real table (header + line row) for the selected option, with its own
          Edit / Accept actions. Deleting isn't offered here since an option always needs its one
          transfer line — use "Select" above to switch routes instead. */}
      <div>
        <SubTableHeading label="IUT Flow" icon={<ArrowLeftRight size={11} style={{ color: C.blue }} />} />
        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${isSelectedEditing ? C.blue : "#e2e8f0"}` }}>
          <div className="grid items-center px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide" style={{ gridTemplateColumns: "1.2fr 90px 90px 110px 90px 110px 110px", backgroundColor: "#f8fafc", color: "#94a3b8" }}>
            <span>Material</span>
            <span>Qty</span>
            <span>Lead Time</span>
            <span>Initiation</span>
            <span>Cost/Trip</span>
            <span>Lane</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="grid items-center px-3 py-2" style={{ gridTemplateColumns: "1.2fr 90px 90px 110px 90px 110px 110px", backgroundColor: isSelectedAccepted ? "#f0fdf4" : "#fff" }}>
            <div>{materialBadge(selected.option.material)}</div>
            {isSelectedEditing ? (
              <input
                type="number"
                min={0}
                value={selected.effOption.transferQty}
                onChange={(e) => updateOptionOverride(selected.option.id, { transferQty: Number(e.target.value) || 0 })}
                className="w-full text-center text-[11px] font-semibold tabular-nums rounded px-1 py-0.5"
                style={editInputStyle}
              />
            ) : (
              <span className="text-[11px] font-semibold tabular-nums" style={{ color: C.navy }}>{selected.effOption.transferQty.toLocaleString("en-IN")} EA</span>
            )}
            {isSelectedEditing ? (
              <input
                type="text"
                value={selected.effOption.transferLeadTime}
                onChange={(e) => updateOptionOverride(selected.option.id, { transferLeadTime: e.target.value })}
                className="w-full text-center text-[11px] rounded px-1 py-0.5"
                style={editInputStyle}
              />
            ) : (
              <span className="text-[11px] font-semibold" style={{ color: C.navy }}>{selected.effOption.transferLeadTime}</span>
            )}
            {isSelectedEditing ? (
              <input
                type="text"
                value={selected.effOption.initiationDate}
                onChange={(e) => updateOptionOverride(selected.option.id, { initiationDate: e.target.value })}
                className="w-full text-center text-[11px] font-semibold rounded px-1 py-0.5"
                style={editInputStyle}
              />
            ) : (
              <span className="text-[11px] font-semibold" style={{ color: C.navy }}>{selected.effOption.initiationDate}</span>
            )}
            {isSelectedEditing ? (
              <input
                type="number"
                min={0}
                value={selected.effOption.costPerTrip}
                onChange={(e) => updateOptionOverride(selected.option.id, { costPerTrip: Number(e.target.value) || 0 })}
                className="w-full text-center text-[11px] font-semibold rounded px-1 py-0.5"
                style={editInputStyle}
              />
            ) : (
              <span className="text-[11px] font-semibold" style={{ color: C.navy }}>₹{selected.effOption.costPerTrip}</span>
            )}
            <div>{laneBadge(selected.option.laneAvailable)}</div>
            <RowActions
              isEditing={isSelectedEditing}
              isExcluded={false}
              isAccepted={isSelectedAccepted}
              canDelete={false}
              onToggleEdit={() => toggleEdit(`iut-${selected.option.id}`)}
              onDelete={() => {}}
              onRestore={() => {}}
              onAccept={() => acceptRow(`iut-${selected.option.id}`)}
              onUnaccept={() => unacceptRow(`iut-${selected.option.id}`)}
            />
          </div>
        </div>
      </div>

      {/* Plant Impact — one row per route plant, unaffected by the redesign (already tabular). */}
      <div>
        <SubTableHeading label="Plant Impact" />
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
          <div className="grid items-center px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide" style={{ gridTemplateColumns: "80px 1fr 1fr 1.3fr", backgroundColor: "#f8fafc", color: "#94a3b8" }}>
            <span>Plant</span>
            <span>FG Producible</span>
            <span>Stop Date</span>
            <span>Status</span>
          </div>
          <div className="flex flex-col divide-y" style={{ borderColor: "#f1f5f9" }}>
            {selected.plantOutcomes.map((o) => (
              <div key={o.plantCode} className="grid items-center px-3 py-2" style={{ gridTemplateColumns: "80px 1fr 1fr 1.3fr", backgroundColor: "#fff" }}>
                <span className="text-[11px] font-bold" style={{ color: C.navy }}>{o.plantCode}</span>
                <span className="text-[11px] font-semibold tabular-nums" style={{ color: "#374151" }}>{formatIndianNumber(o.finalFgProducible)} EA</span>
                <span className="text-[11px] font-semibold" style={{ color: "#374151" }}>{o.productionStopDate}</span>
                <span>
                  {o.planChangeRequired ? (
                    <ReportBadge tone="warning">Plan change needed</ReportBadge>
                  ) : (
                    <ReportBadge tone="success">No plan change</ReportBadge>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Procurement — grouped by RM/PM material code; each group can hold multiple PO lines
          (one per plant that needs that material), stacked one below the other, each with its
          own Edit / Delete / Accept. */}
      <div>
        <SubTableHeading
          label="Procurement"
          icon={<ShoppingCart size={11} style={{ color: C.blue }} />}
          suffix={`${activeMoqPlantData.length} of ${effMoqPlantData.length} orders active · grouped by material`}
        />
        <div className="flex flex-col gap-3">
          {procurementGroups.map((group) => (
            <div key={group.material} className="rounded-lg overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
              <div className="px-3 py-1.5 flex items-center gap-2" style={{ backgroundColor: C.bgBlue, borderBottom: "1px solid #e2e8f0" }}>
                {materialBadge(group.material)}
                <span className="text-[10px] font-semibold" style={{ color: C.blue }}>
                  {group.rows.length} PO{group.rows.length > 1 ? "s" : ""} for this code
                </span>
              </div>
              <div className="grid items-center px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide" style={{ gridTemplateColumns: "80px 1.2fr 110px 110px 130px", backgroundColor: "#f8fafc", color: "#94a3b8" }}>
                <span>Plant</span>
                <span>Supplier</span>
                <span>Order Qty</span>
                <span className="text-right">Est. Cost</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="flex flex-col divide-y" style={{ borderColor: "#f1f5f9" }}>
                {group.rows.map((plant) => {
                  const supplier = plant.suppliers.find((s) => s.id === moqSuppliers[plant.id]) ?? plant.suppliers[0];
                  const isEditing = editingRowId === plant.id;
                  const isExcluded = excludedRowIds.has(plant.id);
                  const isAccepted = acceptedRowIds.has(plant.id);
                  return (
                    <div
                      key={plant.id}
                      className="grid items-center px-3 py-2"
                      style={{
                        gridTemplateColumns: "80px 1.2fr 110px 110px 130px",
                        backgroundColor: isExcluded ? "#fef2f2" : isAccepted ? "#f0fdf4" : "#fff",
                        opacity: isExcluded ? 0.6 : 1,
                      }}
                    >
                      <span className="text-[11px] font-bold" style={{ color: C.navy, textDecoration: isExcluded ? "line-through" : undefined }}>
                        {plant.plant}
                      </span>
                      {isEditing ? (
                        <select
                          value={supplier.id}
                          onChange={(e) => onMoqSupplier(plant.id, e.target.value)}
                          title={`Choose supplier for ${plant.plant}`}
                          className="text-[11px] rounded px-1.5 py-1 cursor-pointer"
                          style={{ ...editInputStyle, backgroundColor: "#fff", width: "100%", maxWidth: 160 }}
                        >
                          {plant.suppliers.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[11px] font-semibold truncate" title={supplier.name} style={{ color: C.blue, maxWidth: 160, textDecoration: isExcluded ? "line-through" : undefined }}>
                          {supplier.name}
                        </span>
                      )}
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          value={plant.orderQty}
                          onChange={(e) => updateMoqOrderQty(plant.id, Number(e.target.value) || 0)}
                          className="w-20 text-center text-[11px] font-semibold tabular-nums rounded px-1 py-0.5"
                          style={editInputStyle}
                        />
                      ) : (
                        <span className="text-[11px] tabular-nums" style={{ color: "#374151", textDecoration: isExcluded ? "line-through" : undefined }}>
                          {formatIndianNumber(plant.orderQty)} units
                        </span>
                      )}
                      <span className="text-right text-[11px] font-bold tabular-nums" style={{ color: C.navy, textDecoration: isExcluded ? "line-through" : undefined }}>
                        ₹{formatIndianNumber(plant.orderQty * supplier.pricePerUnit)}
                      </span>
                      <RowActions
                        isEditing={isEditing}
                        isExcluded={isExcluded}
                        isAccepted={isAccepted}
                        canDelete
                        onToggleEdit={() => toggleEdit(plant.id)}
                        onDelete={() => excludeRow(plant.id)}
                        onRestore={() => restoreRow(plant.id)}
                        onAccept={() => acceptRow(plant.id)}
                        onUnaccept={() => unacceptRow(plant.id)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
