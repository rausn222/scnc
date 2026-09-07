import { Fragment, useState } from "react";
import type React from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Check, ChevronDown, ChevronRight, Pencil, RotateCcw, X } from "lucide-react";
import {
  FOCUS_VIEW_OPTIONS,
  FOCUS_VIEW_IUT_MATERIALS,
  FOCUS_VIEW_PROCUREMENT,
  IUT_TRANSFER_SLA_DAYS,
  summarizeIutMaterials,
  summarizeProcurement,
  type FocusViewOption,
} from "../../../constants/networkDownStockingAgent";
import { C } from "../../sciDetails/constants";
import { formatIndianNumber } from "../../sciDetails/utils";
import { ReportBadge } from "../../sciDetails/step3report/ReportPrimitives";

// Drawer is capped at the best 2 routing options — same scope as the rest of this popup family.
const OPTIONS = FOCUS_VIEW_OPTIONS.slice(0, 2);

const BORDER = "1px solid #d6dce5";
const ACTIONS_COL_WIDTH = 108;

function buildOptionMetrics(option: FocusViewOption) {
  const materials = FOCUS_VIEW_IUT_MATERIALS[option.id];
  const procurement = FOCUS_VIEW_PROCUREMENT[option.id];
  return {
    option,
    materials,
    procurement,
    iutSummary: summarizeIutMaterials(materials),
    procurementSummary: summarizeProcurement(procurement),
    totalFg: option.plants[0].finalFgProducible + option.plants[1].finalFgProducible,
    planChangeCount: option.plants.filter((p) => p.planChangeRequired).length,
  };
}

/** One "subject" row — a label in the first column, one value per option column, exactly like
    a marksheet's subject/marks-per-student row, plus a trailing Actions cell for line-item rows
    (blank for Scenario Summary / Total rows). Bad values (flagged) render in red like a failing
    mark; everything else stays plain black text. The selected option's column is tinted the
    whole way down so it stays easy to pick out while scrolling through the sheet. */
function Row({
  label,
  values,
  indent,
  selectedIdx,
  actions,
}: {
  label: string;
  values: React.ReactNode[];
  indent?: boolean;
  selectedIdx?: number;
  actions?: React.ReactNode;
}) {
  return (
    <tr>
      <td
        className="px-3 py-1.5 text-[12px]"
        style={{ border: BORDER, color: "#334155", paddingLeft: indent ? 24 : 12, backgroundColor: "#fbfcfe" }}
      >
        {label}
      </td>
      {values.map((v, i) => (
        <td
          key={i}
          className="px-3 py-1.5 text-[12px] text-center"
          style={{
            border: BORDER,
            color: "#1e293b",
            backgroundColor: i === selectedIdx ? C.bgBlue : undefined,
            borderLeft: i === selectedIdx ? `2px solid ${C.blue}` : BORDER,
            borderRight: i === selectedIdx ? `2px solid ${C.blue}` : BORDER,
          }}
        >
          {v}
        </td>
      ))}
      <td className="px-2 py-1.5 text-center" style={{ border: BORDER, width: ACTIONS_COL_WIDTH }}>
        {actions}
      </td>
    </tr>
  );
}

/** Full-width group heading — plain bold text on a light band, the marksheet equivalent of a
    "PART A / PART B" section divider. No color-coding, just a visual break between groups.
    Every group except Scenario Summary is collapsible (collapsed by default) so the sheet
    opens short and each part is expanded only when actually wanted. */
function GroupHeader({
  label,
  colSpan,
  collapsible,
  expanded,
  onToggle,
  suffix,
}: {
  label: string;
  colSpan: number;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  suffix?: string;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        onClick={collapsible ? onToggle : undefined}
        className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide"
        style={{ border: BORDER, backgroundColor: "#eef2f7", color: C.navy, cursor: collapsible ? "pointer" : undefined, userSelect: collapsible ? "none" : undefined }}
      >
        <span className="inline-flex items-center gap-1.5">
          {collapsible && (expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />)}
          {label}
          {suffix && <span className="normal-case font-normal text-[10px]" style={{ color: "#64748b" }}>· {suffix}</span>}
          {collapsible && !expanded && <span className="normal-case font-normal text-[10px]" style={{ color: "#64748b" }}>(tap to expand)</span>}
        </span>
      </td>
    </tr>
  );
}

const dash = <span style={{ color: "#94a3b8" }}>—</span>;
const flagged = (value: React.ReactNode, isFlag: boolean) => (
  <span style={{ color: isFlag ? "#dc2626" : "#1e293b", fontWeight: isFlag ? 700 : 400 }}>{value}</span>
);

/** Edit / Delete / Accept icon cluster for one line item, scoped to the currently selected
    option's column — mirrors the equivalent control on the "IUT + Procurement" popup, adapted to
    this marksheet's one-active-column-at-a-time layout. Editing a Procurement line's qty updates
    its own "Est. Total" cell live; the Scenario Summary / Total group figures stay the option's
    static baseline numbers (this drawer doesn't recompute those). */
function LineActions({
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
  if (isExcluded) {
    return (
      <button
        type="button"
        onClick={onRestore}
        title="Restore this line"
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold cursor-pointer"
        style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}
      >
        <RotateCcw size={10} />
        Restore
      </button>
    );
  }
  if (isAccepted) {
    return (
      <div className="flex items-center justify-center gap-1">
        <ReportBadge tone="success"><Check size={8} strokeWidth={2.5} />OK</ReportBadge>
        <button type="button" onClick={onUnaccept} title="Undo accept" className="p-0.5 rounded hover:bg-slate-100 cursor-pointer" style={{ color: "#64748b" }}>
          <X size={11} />
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-0.5">
      <button
        type="button"
        onClick={onToggleEdit}
        title={isEditing ? "Stop editing this line" : "Edit this line"}
        className="p-1 rounded hover:bg-slate-100 cursor-pointer"
        style={isEditing ? { color: C.blue, backgroundColor: "#fff" } : { color: "#64748b" }}
      >
        <Pencil size={11} />
      </button>
      {canDelete && (
        <button type="button" onClick={onDelete} title="Exclude this line from totals" className="p-1 rounded hover:bg-slate-100 cursor-pointer" style={{ color: "#64748b" }}>
          <X size={11} />
        </button>
      )}
      <button type="button" onClick={onAccept} title="Accept this line" className="p-1 rounded hover:bg-green-50 cursor-pointer" style={{ color: C.green }}>
        <Check size={12} strokeWidth={2.5} />
      </button>
    </div>
  );
}

/**
 * "IUT + Procurement - v1" row's More Details — a right-side drawer holding a marksheet-style
 * table: one row per field ("subject"), one column per option ("student"). IUT Flow already
 * lists every material one below the other; Procurement is grouped by RM/PM material code so
 * plants ordering the same code sit together instead of being split by plant. Every material and
 * procurement line — for the selected option's column — carries its own Edit / Delete / Accept
 * actions via the trailing Actions column.
 */
export function IutProcurementDrawerV1({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState<FocusViewOption["id"]>(
    () => OPTIONS.find((o) => o.isBest)?.id ?? OPTIONS[0].id,
  );
  // Every group but Scenario Summary starts collapsed — this Set holds which ones the reader
  // has opened.
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (key: string) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Line-level state — keyed `${optionId}:${kind}:${code}:${index}` so it's safe even if a
  // future dataset has more than one line sharing a code within the same option.
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [excludedKeys, setExcludedKeys] = useState<Set<string>>(new Set());
  const [acceptedKeys, setAcceptedKeys] = useState<Set<string>>(new Set());
  const [orderQtyOverrides, setOrderQtyOverrides] = useState<Record<string, number>>({});
  const [materialQtyOverrides, setMaterialQtyOverrides] = useState<Record<string, number>>({});

  const toggleEdit = (key: string) => setEditingKey((cur) => (cur === key ? null : key));
  const excludeLine = (key: string) => {
    setExcludedKeys((prev) => new Set(prev).add(key));
    setEditingKey((cur) => (cur === key ? null : cur));
  };
  const restoreLine = (key: string) => setExcludedKeys((prev) => { const next = new Set(prev); next.delete(key); return next; });
  const acceptLine = (key: string) => {
    setAcceptedKeys((prev) => new Set(prev).add(key));
    setEditingKey((cur) => (cur === key ? null : cur));
  };
  const unacceptLine = (key: string) => setAcceptedKeys((prev) => { const next = new Set(prev); next.delete(key); return next; });

  const perOption = OPTIONS.map(buildOptionMetrics);
  const selectedIdx = perOption.findIndex((r) => r.option.id === selectedId);
  const maxMaterials = Math.max(...perOption.map((r) => r.materials.length));

  // Procurement grouped by RM/PM material code — plants that happen to order the same code sit
  // together, one below the other, instead of the old per-plant grouping.
  const materialCodes = Array.from(new Set(perOption.flatMap((r) => r.procurement.map((p) => p.code))));

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: "rgba(0,48,135,0.18)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="h-full flex flex-col bg-white"
        style={{ width: "min(96vw, 980px)", boxShadow: "-20px 0 60px rgba(0,48,135,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-2.5 flex items-center justify-between gap-3 shrink-0" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <div className="min-w-0">
            <h2 className="text-xs font-bold" style={{ color: C.navy }}>{title}</h2>
            {subtitle && <p className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer transition-colors shrink-0"
            style={{ color: "#64748b" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-bold" style={{ border: BORDER, backgroundColor: "#f1f5f9", color: "#64748b", width: "30%" }}>
                  Detail
                </th>
                {perOption.map(({ option }) => {
                  const isSelected = selectedId === option.id;
                  return (
                    <th
                      key={option.id}
                      onClick={() => setSelectedId(option.id)}
                      title={isSelected ? undefined : `Select ${option.label}`}
                      className="px-3 py-2 text-center"
                      style={{ border: BORDER, backgroundColor: isSelected ? C.bgBlue : "#f1f5f9", cursor: isSelected ? "default" : "pointer" }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[12px] font-bold" style={{ color: C.navy }}>
                          {option.label}{option.isBest ? " (Best)" : ""}
                        </span>
                        <span className="text-[10px]" style={{ color: "#64748b" }}>{option.routeFrom} → {option.routeTo}</span>
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: isSelected ? "#166534" : C.blue, textDecoration: isSelected ? "none" : "underline" }}
                        >
                          {isSelected ? "✓ Selected" : "Select"}
                        </span>
                      </div>
                    </th>
                  );
                })}
                <th className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wide" style={{ border: BORDER, backgroundColor: "#f1f5f9", color: "#64748b", width: ACTIONS_COL_WIDTH }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <GroupHeader label="Scenario Summary" colSpan={2 + OPTIONS.length} />
              <Row label="Total Cost (₹)" values={perOption.map((r) => formatIndianNumber(r.option.totalCost))} selectedIdx={selectedIdx} />
              <Row label="Total FG Producible (EA)" values={perOption.map((r) => formatIndianNumber(r.totalFg))} selectedIdx={selectedIdx} />
              <Row label="IUT Materials (count)" values={perOption.map((r) => flagged(r.iutSummary.materialCount, r.iutSummary.slaBreachCount > 0))} selectedIdx={selectedIdx} />
              <Row label="  – of which SLA breach" values={perOption.map((r) => flagged(r.iutSummary.slaBreachCount, r.iutSummary.slaBreachCount > 0))} indent selectedIdx={selectedIdx} />
              <Row label="Procurement Orders (count)" values={perOption.map((r) => flagged(r.procurementSummary.orderCount, r.procurementSummary.attentionCount > 0))} selectedIdx={selectedIdx} />
              <Row label="  – of which below MOQ" values={perOption.map((r) => flagged(r.procurementSummary.attentionCount, r.procurementSummary.attentionCount > 0))} indent selectedIdx={selectedIdx} />
              <Row label="Plan Changes Needed" values={perOption.map((r) => flagged(`${r.planChangeCount} of ${r.option.plants.length}`, r.planChangeCount > 0))} selectedIdx={selectedIdx} />
              <Row label="Lane Availability" values={perOption.map((r) => (r.option.laneAvailable === true ? "Available" : r.option.laneAvailable === false ? flagged("Unavailable", true) : "Not set"))} selectedIdx={selectedIdx} />

              <GroupHeader
                label="IUT Flow"
                colSpan={2 + OPTIONS.length}
                collapsible
                expanded={expandedGroups.has("iut-flow")}
                onToggle={() => toggleGroup("iut-flow")}
                suffix={`${maxMaterials} material line${maxMaterials > 1 ? "s" : ""}, one below the other`}
              />
              {expandedGroups.has("iut-flow") && Array.from({ length: maxMaterials }, (_, mi) => {
                const cells = perOption.map((r) => r.materials[mi]);
                const selectedMaterial = cells[selectedIdx];
                const lineKey = selectedMaterial ? `${selectedId}:material:${selectedMaterial.code}:${mi}` : null;
                const isEditing = lineKey !== null && editingKey === lineKey;
                const isExcluded = lineKey !== null && excludedKeys.has(lineKey);
                const isAccepted = lineKey !== null && acceptedKeys.has(lineKey);
                const qtyOverrideKey = lineKey;
                const effQty = (qtyOverrideKey && materialQtyOverrides[qtyOverrideKey]) ?? selectedMaterial?.transferQty;

                return (
                  <Fragment key={`m${mi}`}>
                    <Row
                      label={`Material ${mi + 1}`}
                      values={cells.map((m) => (m ? `${m.name} (${m.type} · ${m.code})` : dash))}
                      selectedIdx={selectedIdx}
                      actions={
                        lineKey && (
                          <LineActions
                            isEditing={isEditing}
                            isExcluded={isExcluded}
                            isAccepted={isAccepted}
                            canDelete={false}
                            onToggleEdit={() => toggleEdit(lineKey)}
                            onDelete={() => {}}
                            onRestore={() => restoreLine(lineKey)}
                            onAccept={() => acceptLine(lineKey)}
                            onUnaccept={() => unacceptLine(lineKey)}
                          />
                        )
                      }
                    />
                    <Row
                      label="  – Transfer Qty (EA)"
                      values={cells.map((m, i) =>
                        !m ? dash : i === selectedIdx && isEditing ? (
                          <input
                            type="number"
                            min={0}
                            value={effQty}
                            onChange={(e) => setMaterialQtyOverrides((prev) => ({ ...prev, [qtyOverrideKey as string]: Number(e.target.value) || 0 }))}
                            className="w-20 text-center text-[11px] rounded px-1 py-0.5"
                            style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                          />
                        ) : (
                          formatIndianNumber(i === selectedIdx ? effQty ?? m.transferQty : m.transferQty)
                        )
                      )}
                      indent
                      selectedIdx={selectedIdx}
                    />
                    <Row label="  – Lead Time (days)" values={cells.map((m) => (m ? flagged(`${m.leadTimeDays}d`, m.leadTimeDays > IUT_TRANSFER_SLA_DAYS) : dash))} indent selectedIdx={selectedIdx} />
                    <Row label="  – Initiation Date" values={cells.map((m) => (m ? m.initiationDate : dash))} indent selectedIdx={selectedIdx} />
                    <Row label="  – Cost/Trip (₹)" values={cells.map((m) => (m ? m.costPerTrip : dash))} indent selectedIdx={selectedIdx} />
                  </Fragment>
                );
              })}

              {materialCodes.map((code) => {
                const ordersPerOption = perOption.map((r) => r.procurement.filter((p) => p.code === code));
                const maxOrders = Math.max(...ordersPerOption.map((o) => o.length));
                if (maxOrders === 0) return null;
                const groupKey = `procurement-${code}`;
                const isOpen = expandedGroups.has(groupKey);
                const sampleLine = ordersPerOption.flat()[0];
                return (
                  <Fragment key={code}>
                    <GroupHeader
                      label={`Procurement — ${sampleLine.type} ${code}${sampleLine.name ? ` · ${sampleLine.name}` : ""}`}
                      colSpan={2 + OPTIONS.length}
                      collapsible
                      expanded={isOpen}
                      onToggle={() => toggleGroup(groupKey)}
                      suffix={`up to ${maxOrders} PO${maxOrders > 1 ? "s" : ""} for this code`}
                    />
                    {isOpen && Array.from({ length: maxOrders }, (_, oi) => {
                      const cells = ordersPerOption.map((list) => list[oi]);
                      const selectedOrder = cells[selectedIdx];
                      const lineKey = selectedOrder ? `${selectedId}:order:${code}:${oi}` : null;
                      const isEditing = lineKey !== null && editingKey === lineKey;
                      const isExcluded = lineKey !== null && excludedKeys.has(lineKey);
                      const isAccepted = lineKey !== null && acceptedKeys.has(lineKey);
                      const effQty = (lineKey && orderQtyOverrides[lineKey]) ?? selectedOrder?.orderQty;

                      return (
                        <Fragment key={`${code}-o${oi}`}>
                          <Row
                            label={`Order ${oi + 1} — Plant`}
                            values={cells.map((o) => (o ? o.plant : dash))}
                            selectedIdx={selectedIdx}
                            actions={
                              lineKey && (
                                <LineActions
                                  isEditing={isEditing}
                                  isExcluded={isExcluded}
                                  isAccepted={isAccepted}
                                  canDelete
                                  onToggleEdit={() => toggleEdit(lineKey)}
                                  onDelete={() => excludeLine(lineKey)}
                                  onRestore={() => restoreLine(lineKey)}
                                  onAccept={() => acceptLine(lineKey)}
                                  onUnaccept={() => unacceptLine(lineKey)}
                                />
                              )
                            }
                          />
                          <Row label="  – Supplier" values={cells.map((o) => (o ? o.supplier : dash))} indent selectedIdx={selectedIdx} />
                          <Row
                            label="  – Order Qty"
                            values={cells.map((o, i) => {
                              if (!o) return dash;
                              if (i === selectedIdx && isEditing) {
                                return (
                                  <input
                                    type="number"
                                    min={0}
                                    value={effQty}
                                    onChange={(e) => setOrderQtyOverrides((prev) => ({ ...prev, [lineKey as string]: Number(e.target.value) || 0 }))}
                                    className="w-20 text-center text-[11px] rounded px-1 py-0.5"
                                    style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                                  />
                                );
                              }
                              const qty = i === selectedIdx ? effQty ?? o.orderQty : o.orderQty;
                              return flagged(formatIndianNumber(qty), o.neededQty < o.moq);
                            })}
                            indent
                            selectedIdx={selectedIdx}
                          />
                          <Row label="  – MOQ" values={cells.map((o) => (o ? formatIndianNumber(o.moq) : dash))} indent selectedIdx={selectedIdx} />
                          <Row label="  – Price/Unit (₹)" values={cells.map((o) => (o ? o.pricePerUnit : dash))} indent selectedIdx={selectedIdx} />
                          <Row
                            label="  – Est. Total (₹)"
                            values={cells.map((o, i) => {
                              if (!o) return dash;
                              const qty = i === selectedIdx ? effQty ?? o.orderQty : o.orderQty;
                              return isExcluded && i === selectedIdx
                                ? <span style={{ textDecoration: "line-through", color: "#94a3b8" }}>{formatIndianNumber(qty * o.pricePerUnit)}</span>
                                : formatIndianNumber(qty * o.pricePerUnit);
                            })}
                            indent
                            selectedIdx={selectedIdx}
                          />
                          <Row label="  – Production Date" values={cells.map((o) => (o ? o.productionDate : dash))} indent selectedIdx={selectedIdx} />
                        </Fragment>
                      );
                    })}
                  </Fragment>
                );
              })}

              <GroupHeader
                label="Total"
                colSpan={2 + OPTIONS.length}
                collapsible
                expanded={expandedGroups.has("total")}
                onToggle={() => toggleGroup("total")}
              />
              {expandedGroups.has("total") && (
                <>
                  <Row label="Total Cost (₹)" values={perOption.map((r) => <b>{formatIndianNumber(r.option.totalCost)}</b>)} selectedIdx={selectedIdx} />
                  <Row label="Total FG Producible (EA)" values={perOption.map((r) => <b>{formatIndianNumber(r.totalFg)}</b>)} selectedIdx={selectedIdx} />
                </>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
