import { Fragment, useState } from "react";
import type React from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
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

// Drawer is capped at the best 2 routing options — same scope as the rest of this popup family.
const OPTIONS = FOCUS_VIEW_OPTIONS.slice(0, 2);

const BORDER = "1px solid #d6dce5";

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
    a marksheet's subject/marks-per-student row. Bad values (flagged) render in red like a
    failing mark; everything else stays plain black text — no badges, no icons, no fills. The
    selected option's column is tinted the whole way down so it stays easy to pick out while
    scrolling through the sheet. */
function Row({ label, values, indent, selectedIdx }: { label: string; values: React.ReactNode[]; indent?: boolean; selectedIdx?: number }) {
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
}: {
  label: string;
  colSpan: number;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
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

/**
 * "IUT + Procurement - v1" row's More Details — a right-side drawer holding a plain marksheet-
 * style table: one row per field ("subject"), one column per option ("student"), read straight
 * down the page with no hidden/expandable content, no badges, no sticky-scroll mechanics.
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

  const perOption = OPTIONS.map(buildOptionMetrics);
  const selectedIdx = perOption.findIndex((r) => r.option.id === selectedId);
  const maxMaterials = Math.max(...perOption.map((r) => r.materials.length));
  const plantCodes = Array.from(new Set(perOption.flatMap((r) => r.option.plants.map((p) => p.code))));

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
        style={{ width: "min(94vw, 900px)", boxShadow: "-20px 0 60px rgba(0,48,135,0.18)" }}
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
                <th className="px-3 py-2 text-left text-[11px] font-bold" style={{ border: BORDER, backgroundColor: "#f1f5f9", color: "#64748b", width: "34%" }}>
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
              </tr>
            </thead>
            <tbody>
              <GroupHeader label="Scenario Summary" colSpan={1 + OPTIONS.length} />
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
                colSpan={1 + OPTIONS.length}
                collapsible
                expanded={expandedGroups.has("iut-flow")}
                onToggle={() => toggleGroup("iut-flow")}
              />
              {expandedGroups.has("iut-flow") && Array.from({ length: maxMaterials }, (_, mi) => {
                const cells = perOption.map((r) => r.materials[mi]);
                return (
                  <Fragment key={`m${mi}`}>
                    <Row label={`Material ${mi + 1}`} values={cells.map((m) => (m ? `${m.name} (${m.type} · ${m.code})` : dash))} selectedIdx={selectedIdx} />
                    <Row label="  – Transfer Qty (EA)" values={cells.map((m) => (m ? formatIndianNumber(m.transferQty) : dash))} indent selectedIdx={selectedIdx} />
                    <Row label="  – Lead Time (days)" values={cells.map((m) => (m ? flagged(`${m.leadTimeDays}d`, m.leadTimeDays > IUT_TRANSFER_SLA_DAYS) : dash))} indent selectedIdx={selectedIdx} />
                    <Row label="  – Initiation Date" values={cells.map((m) => (m ? m.initiationDate : dash))} indent selectedIdx={selectedIdx} />
                    <Row label="  – Cost/Trip (₹)" values={cells.map((m) => (m ? m.costPerTrip : dash))} indent selectedIdx={selectedIdx} />
                  </Fragment>
                );
              })}

              {plantCodes.map((plantCode) => {
                const ordersPerOption = perOption.map((r) => r.procurement.filter((p) => p.plant === plantCode));
                const maxOrders = Math.max(...ordersPerOption.map((o) => o.length));
                if (maxOrders === 0) return null;
                const groupKey = `procurement-${plantCode}`;
                const isOpen = expandedGroups.has(groupKey);
                return (
                  <Fragment key={plantCode}>
                    <GroupHeader
                      label={`Procurement — Plant ${plantCode}`}
                      colSpan={1 + OPTIONS.length}
                      collapsible
                      expanded={isOpen}
                      onToggle={() => toggleGroup(groupKey)}
                    />
                    {isOpen && Array.from({ length: maxOrders }, (_, oi) => {
                      const cells = ordersPerOption.map((list) => list[oi]);
                      return (
                        <Fragment key={`${plantCode}-o${oi}`}>
                          <Row label={`Order ${oi + 1}`} values={cells.map((o) => (o ? `${o.name} (${o.type} · ${o.code})` : dash))} selectedIdx={selectedIdx} />
                          <Row label="  – Supplier" values={cells.map((o) => (o ? o.supplier : dash))} indent selectedIdx={selectedIdx} />
                          <Row label="  – Order Qty" values={cells.map((o) => (o ? flagged(formatIndianNumber(o.orderQty), o.neededQty < o.moq) : dash))} indent selectedIdx={selectedIdx} />
                          <Row label="  – MOQ" values={cells.map((o) => (o ? formatIndianNumber(o.moq) : dash))} indent selectedIdx={selectedIdx} />
                          <Row label="  – Price/Unit (₹)" values={cells.map((o) => (o ? o.pricePerUnit : dash))} indent selectedIdx={selectedIdx} />
                          <Row label="  – Est. Total (₹)" values={cells.map((o) => (o ? formatIndianNumber(o.orderQty * o.pricePerUnit) : dash))} indent selectedIdx={selectedIdx} />
                          <Row label="  – Production Date" values={cells.map((o) => (o ? o.productionDate : dash))} indent selectedIdx={selectedIdx} />
                        </Fragment>
                      );
                    })}
                  </Fragment>
                );
              })}

              <GroupHeader
                label="Total"
                colSpan={1 + OPTIONS.length}
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
