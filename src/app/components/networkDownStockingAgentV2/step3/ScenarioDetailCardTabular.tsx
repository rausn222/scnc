import React, { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  Box,
  Check,
  Clock,
  Columns3,
  Link2Off,
  Maximize2,
  Minimize2,
  Rows3,
  ShoppingCart,
  Star,
  X,
  Zap,
} from "lucide-react";
import type {
  TransferScenarioId,
  IUTOption,
  MOQPlantOption,
  MOQSupplierData,
  PlantRole,
} from "../../sciDetails/types";
import {
  C,
  IUT_TRANSFER_OPTIONS,
  SCENARIOS,
  RM_BADGE,
  PM_BADGE,
  MOQ_PLANT_OPTIONS,
  PLANT_BREAKDOWN_BASE,
} from "../../sciDetails/constants";
import { bizWasteColor, computeAfterQtyAndDate, formatIndianNumber } from "../../sciDetails/utils";

/**
 * Table-view copy of SCIDetail's tabular scenario detail breakdown (see
 * sciDetails/step3/ScenarioDetailCardTabular.tsx), used as the "Table view"
 * option alongside this page's own card-based ScenarioDetailCard.
 */

export function ScenarioDetailCard({
  scenarioId,
  cardDefs,
  selTransfer,
  onSelTransfer,
  moqSuppliers,
  onMoqSupplier,
  layoutMode,
}: {
  scenarioId: string;
  cardDefs: { sid: string; transferId: TransferScenarioId | null }[];
  selTransfer: string;
  onSelTransfer: (id: string) => void;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
  /** When set, locks the combo table layout to this mode and hides the Vertical/Horizontal toggle. */
  layoutMode?: "vertical" | "horizontal";
}) {
  const [hasChanges, setHasChanges] = useState(false);
  // "Plan change" alert only applies to IUT route changes — MOQ supplier
  // changes don't require an STO route review, so they're tracked separately.
  const [iutChanged, setIutChanged] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Combo scenarios (e.g. IUT + Procurement): "vertical" keeps IUT/Procurement stacked as
  // row-sections under one table; "horizontal" groups each option into its own card with
  // Scenario Summary / IUT / Procurement laid out side by side.
  const [internalTableLayoutMode, setInternalTableLayoutMode] = useState<"vertical" | "horizontal">("vertical");
  const tableLayoutMode = layoutMode ?? internalTableLayoutMode;
  const showLayoutToggle = layoutMode === undefined;

  const handleSelTransfer = (id: string) => {
    if (id !== selTransfer) {
      setHasChanges(true);
      setIutChanged(true);
      setAlertDismissed(false);
    }
    onSelTransfer(id);
  };
  const handleMoqSupplier = (plantId: string, supplierId: string) => {
    if (moqSuppliers[plantId] !== supplierId) {
      setHasChanges(true);
    }
    onMoqSupplier(plantId, supplierId);
  };

  const showTransfer =
    scenarioId === "iut" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break";
  const showMOQTable = scenarioId === "moq";
  const transferCount = scenarioId === "iut-moq" ? 3 : 2;
  const transferOptions = IUT_TRANSFER_OPTIONS.slice(0, showTransfer ? transferCount : 0);

  // Primary = IUT card (first). Secondary = additional scenarios shown below (e.g. MOQ in combo).
  const primaryDef = cardDefs[0];
  const secondaryDefs = cardDefs.slice(1);
  const primaryScenario = SCENARIOS.find((s) => s.id === primaryDef.sid);

  const transferRows: { label: string; render: (o: IUTOption) => React.ReactNode }[] = [
    {
      label: "Business Waste",
      render: (o) => (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-bold tabular-nums" style={{ color: bizWasteColor(o.businessWasteAfter, o.businessWasteBefore) }}>
            ₹{o.businessWasteAfter.toLocaleString("en-IN")}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums" style={{ color: C.green }}>
            ↓ ₹{o.reductionVsNoAction.toLocaleString("en-IN")}
          </span>
        </div>
      ),
    },
    {
      label: "Material",
      render: (o) => {
        const [type, ...rest] = o.material.split(" ");
        const badge = type === "RM" ? RM_BADGE : type === "PM" ? PM_BADGE : { bg: "#f1f5f9", color: "#64748b" };
        return (
          <span className="flex items-center justify-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>
              {type}
            </span>
            <span className="text-[10px] font-bold" style={{ color: C.navy }}>{rest.join(" ")}</span>
          </span>
        );
      },
    },
    {
      label: "Transfer Qty",
      render: (o) => (
        <span className="text-xs tabular-nums" style={{ color: "#374151" }}>
          {o.transferQty.toLocaleString("en-IN")} units
        </span>
      ),
    },
    {
      label: "Lead Time",
      render: (o) => (
        <span className="text-xs tabular-nums" style={{ color: "#374151" }}>
          {o.transferLeadTime}
        </span>
      ),
    },
    {
      label: "IUT Initiation Date",
      render: (o) => (
        <span className="text-xs font-semibold tabular-nums" style={{ color: C.navy }}>
          {o.initiationDate}
        </span>
      ),
    },
    {
      label: "Lane",
      render: (o) =>
        o.laneAvailable === true ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.green }}>
            <Check size={10} strokeWidth={2.5} />Available
          </span>
        ) : o.laneAvailable === false ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#ea580c" }}>
            <Link2Off size={10} />Unavailable
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#d97706" }}>
            <Clock size={10} />Not set
          </span>
        ),
    },
    {
      label: "Cost / Trip",
      render: (o) => (
        <span className="text-xs" style={{ color: "#374151" }}>₹{o.costPerTrip.toLocaleString("en-IN")}</span>
      ),
    },
    {
      label: "Prod. Stop (Source)",
      render: (o) => (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-medium" style={{ color: "#94a3b8" }}>{o.routeFrom}</span>
          <span className="text-xs font-semibold" style={{ color: "#374151" }}>{o.prodStopSource}</span>
        </div>
      ),
    },
    {
      label: "Prod. Stop (Dest)",
      render: (o) => (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-medium" style={{ color: "#94a3b8" }}>{o.routeTo}</span>
          <span className="text-xs font-semibold" style={{ color: "#374151" }}>{o.prodStopDest}</span>
        </div>
      ),
    },
  ];

  if (!primaryScenario) return null;

  const isComboLayout = showTransfer && secondaryDefs.length > 0;

  const cardBody = (
    <>
      {/* ── Card header — full screen toggle ── */}
      <div
        className="px-3 py-1.5 flex items-center justify-between gap-2"
        style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#fff" }}
      >
        <span className="text-xs font-bold truncate" style={{ color: C.navy }}>
          {isComboLayout ? SCENARIOS.find((s) => s.id === scenarioId)?.name ?? primaryScenario.name : primaryScenario.name}
        </span>
        {isComboLayout && (
          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            className="flex items-center cursor-pointer justify-center rounded-md shrink-0 transition-colors hover:bg-slate-100"
            style={{ width: 24, height: 24, color: "#64748b", border: "1px solid #e2e8f0" }}
            title={isFullscreen ? "Exit full screen" : "Full screen"}
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        )}
      </div>

      <div style={isFullscreen ? { flex: "1 1 auto", overflow: "auto" } : undefined}>
      {isComboLayout ? (() => {
        /* ── Simple side-by-side plan comparison: Selected plan vs. next-best
           alternate, each broken down by plant with Business Waste, plant
           metrics, IUT and Procurement grouped underneath ── */
        type ComboItem = {
          key: string;
          transfer: IUTOption;
          supplierMap: Record<string, string>;
          isSelected: boolean;
        };
        type PlantMetrics = {
          base: (typeof PLANT_BREAKDOWN_BASE)[string];
          moqPlant: MOQPlantOption | null;
          supplier: MOQSupplierData | null;
          isIutSource: boolean;
          finalFgProducible: number;
          productionStopDate: string;
          planChangeRequired: boolean;
        };

        const PLANTS = ["UTR", "U535"];
        const currentTransfer =
          transferOptions.find((o) => o.id === selTransfer) ??
          transferOptions.find((o) => o.isBest) ??
          transferOptions[0];
        if (!currentTransfer) return null;

        const buildSupplierMap = (flip: boolean): Record<string, string> =>
          Object.fromEntries(
            MOQ_PLANT_OPTIONS.map((p) => {
              const currentId = moqSuppliers[p.id] ?? p.suppliers[0]?.id;
              if (!flip) return [p.id, currentId];
              const alt = p.suppliers.find((s) => s.id !== currentId) ?? p.suppliers[0];
              return [p.id, alt.id];
            }),
          );

        // Keep each option pinned to its natural column position — only the
        // "Selected" / "Alternate" badge and styling should change on click,
        // the columns themselves must not swap places.
        const combos: ComboItem[] = transferOptions.map((t) => ({
          key: t.id,
          transfer: t,
          supplierMap: buildSupplierMap(t.id !== currentTransfer.id),
          isSelected: t.id === currentTransfer.id,
        }));

        const computeForPlant = (plantCode: string, combo: ComboItem): PlantMetrics => {
          const base = PLANT_BREAKDOWN_BASE[plantCode];
          const moqPlant = MOQ_PLANT_OPTIONS.find((p) => p.plant === plantCode) ?? null;
          const roles: PlantRole[] = [];
          if (combo.transfer.routeFrom === plantCode) roles.push("source");
          if (combo.transfer.routeTo === plantCode) roles.push("destination");
          if (moqPlant) roles.push("ordering");
          const { qty, date } = computeAfterQtyAndDate(
            plantCode,
            roles,
            scenarioId,
            combo.transfer,
            moqPlant,
            combo.supplierMap,
            base.totalProductionPlanQty,
            base.prodStopDate,
          );
          const supplier = moqPlant
            ? moqPlant.suppliers.find((s) => s.id === combo.supplierMap[moqPlant.id]) ?? moqPlant.suppliers[0]
            : null;
          return {
            base,
            moqPlant,
            supplier,
            isIutSource: combo.transfer.routeFrom === plantCode,
            finalFgProducible: qty,
            productionStopDate: date,
            planChangeRequired: date !== base.prodStopDate,
          };
        };

        const dash = <span style={{ color: "#cbd5e1" }}>—</span>;

        // Visual gap between option columns so each plan reads as its own
        // tile/card instead of one continuous table.
        const GROUP_GAP = "10px solid #eef2f7";
        const groupDivider = (idx: number): React.CSSProperties =>
          idx > 0 ? { borderLeft: GROUP_GAP } : {};

        // Thick colored outline (same blue as the "Selected" header badge)
        // wrapped around the selected option's cells so the whole section —
        // not just the header — reads as clearly chosen. Uses inset box-shadow
        // instead of border so it isn't affected by the table's border-collapse.
        const SELECTED_BORDER_PX = 3;
        type BoxSide = "top" | "bottom" | "left" | "right";
        const selectedOutline = (isSelected: boolean, sides: BoxSide[]): React.CSSProperties => {
          if (!isSelected || sides.length === 0) return {};
          const shadows = sides.map((side) => {
            if (side === "top") return `inset 0 ${SELECTED_BORDER_PX}px 0 0 ${C.blue}`;
            if (side === "bottom") return `inset 0 -${SELECTED_BORDER_PX}px 0 0 ${C.blue}`;
            if (side === "left") return `inset ${SELECTED_BORDER_PX}px 0 0 0 ${C.blue}`;
            return `inset -${SELECTED_BORDER_PX}px 0 0 0 ${C.blue}`;
          });
          return { boxShadow: shadows.join(", ") };
        };
        const comboCellStyle = (ci: number, pi: number, isSelected: boolean, extraSides: BoxSide[] = []): React.CSSProperties => ({
          ...(pi === 0 ? groupDivider(ci) : {}),
          ...selectedOutline(isSelected, [pi === 0 ? "left" : "right", ...extraSides]),
        });

        const plantRows: { label: string; render: (p: PlantMetrics) => React.ReactNode }[] = [
          { label: "Production Plan Qty", render: (p) => <span className="text-xs tabular-nums" style={{ color: "#374151" }}>{p.base.totalProductionPlan}</span> },
          { label: "Final FG Producible", render: (p) => <span className="text-xs font-bold tabular-nums" style={{ color: C.navy }}>{formatIndianNumber(p.finalFgProducible)}</span> },
          { label: "Production Stop Date", render: (p) => <span className="text-xs font-semibold" style={{ color: "#7c3aed" }}>{p.productionStopDate}</span> },
          {
            label: "Plan Change Required",
            render: (p) =>
              p.planChangeRequired ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#d97706" }}><Zap size={10} />Yes</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.green }}><Check size={10} strokeWidth={2.5} />No</span>
              ),
          },
        ];

        const iutRows: { label: string; render: (p: PlantMetrics, combo: ComboItem) => React.ReactNode }[] = [
          { label: "Material Code", render: (p, c) => (p.isIutSource ? <span className="text-xs font-bold" style={{ color: C.navy }}>{c.transfer.material}</span> : dash) },
          { label: "Destination Plant", render: (p, c) => (p.isIutSource ? <span className="text-xs font-semibold" style={{ color: C.navy }}>{c.transfer.routeTo}</span> : dash) },
          { label: "Transfer Qty", render: (p, c) => (p.isIutSource ? <span className="text-xs tabular-nums" style={{ color: "#374151" }}>{c.transfer.transferQty.toLocaleString("en-IN")} units</span> : dash) },
          { label: "IUT Lead Time", render: (p, c) => (p.isIutSource ? <span className="text-xs tabular-nums" style={{ color: "#374151" }}>{c.transfer.transferLeadTime}</span> : dash) },
          { label: "IUT Initiation Date", render: (p, c) => (p.isIutSource ? <span className="text-xs font-semibold tabular-nums" style={{ color: C.navy }}>{c.transfer.initiationDate}</span> : dash) },
          {
            label: "Lane Availability",
            render: (p, c) =>
              !p.isIutSource ? dash : c.transfer.laneAvailable === true ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.green }}><Check size={10} strokeWidth={2.5} />Available</span>
              ) : c.transfer.laneAvailable === false ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#ea580c" }}><Link2Off size={10} />Unavailable</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#d97706" }}><Clock size={10} />Not set</span>
              ),
          },
          { label: "Cost / Trip", render: (p, c) => (p.isIutSource ? <span className="text-xs tabular-nums" style={{ color: "#374151" }}>₹{c.transfer.costPerTrip.toLocaleString("en-IN")}</span> : dash) },
        ];

        const procurementRows: { label: string; render: (p: PlantMetrics, combo: ComboItem) => React.ReactNode }[] = [
          { label: "Material Code", render: (p) => (p.moqPlant ? <span className="text-xs font-bold" style={{ color: C.navy }}>{p.moqPlant.material}</span> : dash) },
          {
            label: "Supplier",
            render: (p, combo) => {
              if (!p.moqPlant || !p.supplier) return dash;
              if (!combo.isSelected) {
                return <span className="text-xs font-semibold" style={{ color: "#374151" }}>{p.supplier.name}</span>;
              }
              return (
                <select
                  value={p.supplier.id}
                  onChange={(e) => handleMoqSupplier(p.moqPlant!.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] rounded px-1.5 py-0.5 cursor-pointer"
                  style={{ border: `1px solid ${C.blue}`, color: C.navy, backgroundColor: "#fff", outline: "none" }}
                >
                  {p.moqPlant.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              );
            },
          },
          { label: "Order Qty", render: (p) => (p.moqPlant ? <span className="text-xs tabular-nums" style={{ color: "#374151" }}>{p.moqPlant.orderQty.toLocaleString("en-IN")} units</span> : dash) },
          { label: "MOQ", render: (p) => (p.supplier ? <span className="text-xs tabular-nums" style={{ color: "#374151" }}>{p.supplier.moq.toLocaleString("en-IN")} units</span> : dash) },
          { label: "Price / Unit", render: (p) => (p.supplier ? <span className="text-xs tabular-nums" style={{ color: "#374151" }}>₹{p.supplier.pricePerUnit}</span> : dash) },
          { label: "Total Order Price", render: (p) => (p.moqPlant && p.supplier ? <span className="text-xs font-bold tabular-nums" style={{ color: C.navy }}>₹{(p.moqPlant.orderQty * p.supplier.pricePerUnit).toLocaleString("en-IN")}</span> : dash) },
        ];

        const renderCardHeader = (label: React.ReactNode) => (
          <thead>
            <tr>
              <th
                rowSpan={2}
                className="px-2 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap align-bottom"
                style={{ color: "#94a3b8", backgroundColor: "#f1f5f9", borderBottom: "2px solid #cbd5e1", borderRight: "1px solid #e2e8f0", width: 130 }}
              >
                {label}
              </th>
              {combos.map((combo, ci) => (
                <th
                  key={combo.key}
                  colSpan={2}
                  className="px-2 py-1.5 text-center cursor-pointer select-none"
                  style={{
                    backgroundColor: combo.isSelected ? C.navy : "#f1f5f9",
                    borderBottom: "1px solid #cbd5e1",
                    width: 220,
                    ...groupDivider(ci),
                    ...selectedOutline(combo.isSelected, ["left", "right", "top"]),
                  }}
                  onClick={() => handleSelTransfer(combo.transfer.id)}
                  title="Click to make this the selected plan"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xs font-bold" style={{ color: combo.isSelected ? "#fff" : C.navy }}>
                      Option {ci + 1}
                    </span>
                    {combo.isSelected ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold" style={{ backgroundColor: C.blue, color: "#fff" }}>
                        Selected
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold" style={{ color: "#64748b" }}>Alternate</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
            <tr>
              {combos.map((combo, ci) =>
                PLANTS.map((plantCode, pi) => (
                  <th
                    key={`${combo.key}-${plantCode}`}
                    className="px-2 py-1 text-center text-[10px] font-bold"
                    style={{
                      color: combo.isSelected ? "#fff" : C.navy,
                      backgroundColor: combo.isSelected ? "#234e94" : "#e2e8f0",
                      borderBottom: "2px solid #cbd5e1",
                      width: 110,
                      ...(pi === 0 ? groupDivider(ci) : {}),
                      ...selectedOutline(combo.isSelected, pi === 0 ? ["left"] : ["right"]),
                    }}
                  >
                    {plantCode}
                  </th>
                )),
              )}
            </tr>
          </thead>
        );

        const renderCardRows = (
          rows: { label: string; render: (p: PlantMetrics, combo: ComboItem) => React.ReactNode }[],
          closeBottom = false,
        ) =>
          rows.map((row, ri) => (
            <tr key={row.label} style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
              <td className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#94a3b8", borderRight: "1px solid #e2e8f0" }}>
                {row.label}
              </td>
              {combos.map((combo, ci) =>
                PLANTS.map((plantCode, pi) => (
                  <td
                    key={`${combo.key}-${plantCode}`}
                    className="px-2 py-1.5 text-center whitespace-nowrap"
                    style={comboCellStyle(ci, pi, combo.isSelected, closeBottom && ri === rows.length - 1 ? ["bottom"] : [])}
                  >
                    {row.render(computeForPlant(plantCode, combo), combo)}
                  </td>
                )),
              )}
            </tr>
          ));

        const businessWasteRow = (
          <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: C.bgBlue }}>
            <td className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#94a3b8", borderRight: "1px solid #e2e8f0" }}>
              Business Waste
            </td>
            {combos.map((combo, ci) => (
              <td key={combo.key} colSpan={2} className="px-2 py-1.5 text-center whitespace-nowrap" style={{ ...groupDivider(ci), ...selectedOutline(combo.isSelected, ["left", "right"]) }}>
                <span className="text-xs font-bold tabular-nums" style={{ color: bizWasteColor(combo.transfer.businessWasteAfter, combo.transfer.businessWasteBefore) }}>
                  ₹{combo.transfer.businessWasteAfter.toLocaleString("en-IN")}
                </span>
                <span className="ml-1.5 text-[10px] font-semibold tabular-nums" style={{ color: C.green }}>
                  ↓ ₹{combo.transfer.reductionVsNoAction.toLocaleString("en-IN")}
                </span>
              </td>
            ))}
          </tr>
        );

        // ── IUT + Break MOQ: group by option first — each option gets its
        // own block, with Overview / IUT / Procurement as columns inside it ──
        // Wrapped in its own bordered box (rather than a bare <table>) so adjacent category
        // tables — IUT next to Procurement — read as clearly separate blocks, not one merged grid.
        const renderCategoryTable = (
          title: string,
          icon: React.ReactNode,
          headerBg: string,
          bodyRows: React.ReactNode,
          fullWidth = false,
        ) => (
          <div className="rounded-lg overflow-hidden shrink-0" style={{ border: "1px solid #cbd5e1", width: fullWidth ? "100%" : "max-content" }}>
            <table className="border-collapse" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th
                    colSpan={1 + PLANTS.length}
                    className="px-2 py-1 text-center text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: C.navy, backgroundColor: headerBg, borderBottom: "1px solid #cbd5e1" }}
                  >
                    <span className="inline-flex items-center justify-center gap-1">{icon}{title}</span>
                  </th>
                </tr>
                <tr>
                  <th
                    className="px-2 py-1 text-left text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: "#94a3b8", backgroundColor: "#f1f5f9", borderRight: "1px solid #e2e8f0", borderBottom: "2px solid #cbd5e1", width: 130 }}
                  >
                    Detail
                  </th>
                  {PLANTS.map((plantCode) => (
                    <th
                      key={plantCode}
                      className="px-2 py-1 text-center text-[10px] font-bold"
                      style={{ color: C.navy, backgroundColor: "#e2e8f0", borderBottom: "2px solid #cbd5e1", width: 110 }}
                    >
                      {plantCode}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>{bodyRows}</tbody>
            </table>
          </div>
        );

        const renderPlantRowsForCombo = (
          rows: { label: string; render: (p: PlantMetrics, combo: ComboItem) => React.ReactNode }[],
          combo: ComboItem,
        ) =>
          rows.map((row) => (
            <tr key={row.label} style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
              <td className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#94a3b8", borderRight: "1px solid #e2e8f0" }}>
                {row.label}
              </td>
              {PLANTS.map((plantCode) => (
                <td key={plantCode} className="px-2 py-1.5 text-center whitespace-nowrap">
                  {row.render(computeForPlant(plantCode, combo), combo)}
                </td>
              ))}
            </tr>
          ));

        const renderOverviewTable = (combo: ComboItem) =>
          renderCategoryTable(
            "Scenario Summary",
            <Box size={10} />,
            C.bgBlue,
            <>
              <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: C.bgBlue }}>
                <td className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#94a3b8", borderRight: "1px solid #e2e8f0" }}>
                  Business Waste
                </td>
                <td colSpan={PLANTS.length} className="px-2 py-1.5 text-center whitespace-nowrap">
                  <span className="text-xs font-bold tabular-nums" style={{ color: bizWasteColor(combo.transfer.businessWasteAfter, combo.transfer.businessWasteBefore) }}>
                    ₹{combo.transfer.businessWasteAfter.toLocaleString("en-IN")}
                  </span>
                  <span className="ml-1.5 text-[10px] font-semibold tabular-nums" style={{ color: C.green }}>
                    ↓ ₹{combo.transfer.reductionVsNoAction.toLocaleString("en-IN")}
                  </span>
                </td>
              </tr>
              {renderPlantRowsForCombo(plantRows, combo)}
            </>,
            true,
          );

        const optionSections = combos.map((combo, ci) => (
          <div
            key={combo.key}
            className="rounded-xl overflow-hidden bg-white shrink-0"
            style={{
              border: combo.isSelected ? `3px solid ${C.navy}` : "1px solid #e2e8f0",
              boxShadow: "0 1px 4px rgba(0,48,135,0.06)",
            }}
          >
            <div
              className="px-3 py-2 flex items-center gap-2 cursor-pointer select-none"
              style={{ backgroundColor: combo.isSelected ? C.navy : "#f1f5f9" }}
              onClick={() => handleSelTransfer(combo.transfer.id)}
              title="Click to make this the selected plan"
            >
              <span className="text-sm font-bold" style={{ color: combo.isSelected ? "#fff" : C.navy }}>
                Option {ci + 1}
              </span>
              {combo.isSelected ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold" style={{ backgroundColor: C.blue, color: "#fff" }}>
                  Selected
                </span>
              ) : (
                <span className="text-[9px] font-semibold" style={{ color: "#64748b" }}>Alternate</span>
              )}
            </div>
            {/* Scenario Summary spans the top; IUT and Procurement sit side by side underneath it,
                each its own bordered box with a distinct tint so they read apart at a glance. */}
            <div className="flex flex-col gap-3 p-3">
              <div style={{ overflowX: "auto" }}>{renderOverviewTable(combo)}</div>
              <div className="flex flex-nowrap gap-3" style={{ overflowX: "auto" }}>
                {renderCategoryTable("IUT", <ArrowLeftRight size={10} />, "#f0fdfa", renderPlantRowsForCombo(iutRows, combo))}
                {renderCategoryTable("Procurement", <ShoppingCart size={10} />, "#fdf4ff", renderPlantRowsForCombo(procurementRows, combo))}
              </div>
            </div>
          </div>
        ));
        const allowLayoutToggle = showLayoutToggle && scenarioId !== "iut-moq-break";
        const useOptionGrouping = scenarioId === "iut-moq-break" || tableLayoutMode === "horizontal";

        return (
          <div style={{ overflow: "auto", backgroundColor: "#ffffff" }}>
            <div
              className="px-3 py-1.5 flex items-center justify-between gap-1.5 flex-wrap"
              style={{ borderBottom: iutChanged && !alertDismissed ? "none" : "1px solid #cbd5e1", backgroundColor: "#f1f5f9" }}
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: C.blue }}>
                  Plan Comparison
                </span>
                <span className="text-xs" style={{ color: "#475569" }}>
                  · click a plan's header to select it · change supplier to update procurement data
                </span>
              </div>
              {allowLayoutToggle && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setInternalTableLayoutMode("vertical")}
                    title="Stack IUT and Procurement as rows under one table"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-colors"
                    style={
                      tableLayoutMode === "vertical"
                        ? { backgroundColor: C.navy, color: "#fff", border: `1px solid ${C.navy}` }
                        : { backgroundColor: "#fff", color: "#64748b", border: "1px solid #e2e8f0" }
                    }
                  >
                    <Rows3 size={12} />
                    Vertical
                  </button>
                  <button
                    type="button"
                    onClick={() => setInternalTableLayoutMode("horizontal")}
                    title="Show Scenario Summary, IUT and Procurement side by side per option"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-colors"
                    style={
                      tableLayoutMode === "horizontal"
                        ? { backgroundColor: C.navy, color: "#fff", border: `1px solid ${C.navy}` }
                        : { backgroundColor: "#fff", color: "#64748b", border: "1px solid #e2e8f0" }
                    }
                  >
                    <Columns3 size={12} />
                    Horizontal
                  </button>
                </div>
              )}
            </div>
            {iutChanged && !alertDismissed && (
              <div
                className="px-3 py-2 flex items-center justify-between gap-2"
                style={{ backgroundColor: "#fffbeb", borderBottom: "1px solid #fde68a", borderTop: "1px solid #fde68a" }}
              >
                <div className="flex items-center gap-1.5">
                  <Zap size={11} style={{ color: "#d97706", flexShrink: 0 }} />
                  <span className="text-[10px] font-semibold" style={{ color: "#92400e" }}>
                    This option needs a plan change
                  </span>
                  <span className="text-[10px]" style={{ color: "#b45309" }}>
                    — review the selected route before raising STO
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAlertDismissed(true)}
                  className="shrink-0"
                  style={{ color: "#d97706" }}
                >
                  <X size={12} />
                </button>
              </div>
            )}
            {useOptionGrouping ? (
              <div className="p-4 flex items-start gap-4" style={{ overflowX: "auto" }}>
                {optionSections}
              </div>
            ) : (
              <div className="flex justify-start p-4">
              <div
                className="rounded-xl overflow-hidden bg-white"
                style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}
              >
              <table className="border-collapse" style={{ width: "max-content" }}>
                {renderCardHeader("Detail")}
                <tbody>
                  {/* ── Scenario Summary section ── */}
                  <tr>
                    <td colSpan={1 + combos.length * 2} className="px-2 py-1" style={{ backgroundColor: C.bgBlue }}>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: C.blue }}>
                        <Box size={9} />Scenario Summary
                      </span>
                    </td>
                  </tr>
                  {businessWasteRow}
                  {renderCardRows(plantRows)}

                  {/* ── IUT section ── */}
                  <tr>
                    <td colSpan={1 + combos.length * 2} className="px-2 py-1" style={{ backgroundColor: "#f0fdfa" }}>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: C.navy }}>
                        <ArrowLeftRight size={9} />IUT
                      </span>
                    </td>
                  </tr>
                  {renderCardRows(iutRows)}

                  {/* ── Procurement section ── */}
                  <tr>
                    <td colSpan={1 + combos.length * 2} className="px-2 py-1" style={{ backgroundColor: "#f0fdfa" }}>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: C.teal }}>
                        <ShoppingCart size={9} />Procurement
                      </span>
                    </td>
                  </tr>
                  {renderCardRows(procurementRows, true)}
                </tbody>
              </table>
              </div>
              </div>
            )}
          </div>
        );
      })() : (
        <div style={{ overflow: "auto" }}>
          {/* MOQ procurement table (standalone moq scenario) */}
          {showMOQTable && (
            <div>
              <div
                className="px-3 py-1.5 flex items-center gap-1.5"
                style={{ borderBottom: "1px solid #cbd5e1", backgroundColor: "#f1f5f9" }}
              >
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: C.blue }}>
                  Procurement Options
                </span>
                <span className="ml-1 text-[9px]" style={{ color: "#94a3b8" }}>· change supplier to update data</span>
              </div>
              <table className="border-collapse" style={{ width: "100%", minWidth: "max-content" }}>
                <thead>
                  <tr>
                    <th
                      className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
                      style={{ color: "#94a3b8", backgroundColor: "#f1f5f9", borderBottom: "2px solid #cbd5e1", borderRight: "1px solid #e2e8f0", minWidth: 100 }}
                    >
                      Metric
                    </th>
                    {MOQ_PLANT_OPTIONS.map((plant) => (
                      <th
                        key={plant.id}
                        className="px-3 py-2 text-center"
                        style={{ backgroundColor: plant.isBest ? "#dbeafe" : "#f1f5f9", borderBottom: `2px solid ${plant.isBest ? C.blue : "#cbd5e1"}`, minWidth: 150 }}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold" style={{ color: C.navy }}>{plant.plant}</span>
                            {plant.isBest && (
                              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold" style={{ backgroundColor: C.green, color: "#fff" }}>
                                <Star size={6} fill="currentColor" />Best
                              </span>
                            )}
                          </div>
                          <label className="flex items-center gap-1 w-full">
                            <span className="text-[9px] font-semibold whitespace-nowrap" style={{ color: "#94a3b8" }}>Supplier</span>
                            <select
                              value={moqSuppliers[plant.id]}
                              onChange={(e) => handleMoqSupplier(plant.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] rounded px-1.5 py-0.5 w-full cursor-pointer"
                              style={{ border: `1px solid ${C.blue}`, color: C.navy, backgroundColor: "#fff", outline: "none" }}
                            >
                              {plant.suppliers.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      { label: "Business Waste",   render: (_p: MOQPlantOption, s: MOQSupplierData) => <span className="text-xs font-bold tabular-nums" style={{ color: bizWasteColor(s.bizWaste) }}>₹{s.bizWaste.toLocaleString("en-IN")}</span> },
                      { label: "Material",        render: (p: MOQPlantOption, _s: MOQSupplierData) => { const [type, ...rest] = p.material.split(" "); const badge = type === "RM" ? RM_BADGE : type === "PM" ? PM_BADGE : { bg: "#f1f5f9", color: "#64748b" }; return <span className="flex items-center justify-center gap-1.5"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>{type}</span><span className="text-[10px] font-bold" style={{ color: C.navy }}>{rest.join(" ")}</span></span>; } },
                      { label: "Order Qty",        render: (p: MOQPlantOption, _s: MOQSupplierData) => <span className="text-xs tabular-nums" style={{ color: "#374151" }}>{p.orderQty.toLocaleString("en-IN")} units</span> },
                      { label: "MOQ",              render: (_p: MOQPlantOption, s: MOQSupplierData) => <span className="text-xs font-semibold tabular-nums" style={{ color: "#374151" }}>{s.moq.toLocaleString("en-IN")} units</span> },
                      { label: "Price / Unit",     render: (_p: MOQPlantOption, s: MOQSupplierData) => <span className="text-xs tabular-nums" style={{ color: "#374151" }}>₹{s.pricePerUnit}</span> },
                      { label: "Production Date",  render: (_p: MOQPlantOption, s: MOQSupplierData) => <span className="text-xs font-semibold" style={{ color: "#374151" }}>{s.productionDate}</span> },
                    ] as { label: string; render: (p: MOQPlantOption, s: MOQSupplierData) => React.ReactNode }[]
                  ).map((row, i) => (
                    <tr key={row.label} style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
                      <td className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#94a3b8", borderRight: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
                        {row.label}
                      </td>
                      {MOQ_PLANT_OPTIONS.map((plant) => {
                        const selSup = plant.suppliers.find((s) => s.id === moqSuppliers[plant.id]) ?? plant.suppliers[0];
                        return (
                          <td key={plant.id} className="px-3 py-1.5 text-center">
                            {row.render(plant, selSup)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* IUT transfer options table */}
          {showTransfer && transferOptions.length > 0 && (
            <div>
              {/* Sub-header */}
              <div
                className="px-3 py-1.5 flex items-center gap-1.5"
                style={{ borderBottom: iutChanged && !alertDismissed ? "none" : "1px solid #cbd5e1", backgroundColor: "#f1f5f9" }}
              >
                <ArrowLeftRight size={9} style={{ color: C.blue }} />
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: C.blue }}>
                  IUT Options
                </span>
                <span className="ml-1 text-[9px]" style={{ color: "#94a3b8" }}>
                  · click a column to select
                </span>
              </div>
              {iutChanged && !alertDismissed && (
                <div
                  className="px-3 py-2 flex items-center justify-between gap-2"
                  style={{ backgroundColor: "#fffbeb", borderBottom: "1px solid #fde68a", borderTop: "1px solid #fde68a" }}
                >
                  <div className="flex items-center gap-1.5">
                    <Zap size={11} style={{ color: "#d97706", flexShrink: 0 }} />
                    <span className="text-[10px] font-semibold" style={{ color: "#92400e" }}>
                      This option needs a plan change
                    </span>
                    <span className="text-[10px]" style={{ color: "#b45309" }}>
                      — review the selected route before raising STO
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlertDismissed(true)}
                    className="shrink-0"
                    style={{ color: "#d97706" }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <table className="border-collapse" style={{ width: "100%", minWidth: "max-content" }}>
                <thead>
                  <tr style={{ height: 64 }}>
                    <th
                      className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
                      style={{
                        color: "#94a3b8",
                        backgroundColor: "#f1f5f9",
                        borderBottom: "2px solid #cbd5e1",
                        borderRight: "1px solid #e2e8f0",
                        minWidth: 100,
                      }}
                    >
                      Metric
                    </th>
                    {transferOptions.map((o) => {
                      const isSel = selTransfer === o.id;
                      return (
                        <th
                          key={o.id}
                          className="px-3 py-2 text-center cursor-pointer select-none"
                          style={{
                            backgroundColor: isSel ? C.navy : o.isBest ? "#dbeafe" : "#f1f5f9",
                            borderBottom: `2px solid ${isSel ? C.blue : o.isBest ? C.blue : "#cbd5e1"}`,
                            minWidth: 120,
                          }}
                          onClick={() => handleSelTransfer(o.id)}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[11px] font-bold leading-tight" style={{ color: isSel ? "#fff" : C.navy }}>
                              {o.routeFrom}
                              <span className="mx-1 opacity-60" style={{ color: isSel ? "#fff" : C.blue }}>→</span>
                              {o.routeTo}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px]" style={{ color: isSel ? "rgba(255,255,255,0.6)" : "#64748b" }}>{o.label}</span>
                              {o.isBest && !isSel && (
                                <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold" style={{ backgroundColor: C.green, color: "#fff" }}>
                                  <Star size={6} fill="currentColor" />Best
                                </span>
                              )}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {transferRows.map((row, i) => (
                    <tr key={row.label} style={{ height: 44, backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
                      <td
                        className="px-3 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
                        style={{ color: "#94a3b8", borderRight: "1px solid #e2e8f0", backgroundColor: "#ffffff", verticalAlign: "middle" }}
                      >
                        {row.label}
                      </td>
                      {transferOptions.map((o) => {
                        const isSel = selTransfer === o.id;
                        return (
                          <td
                            key={o.id}
                            className="px-3 text-center cursor-pointer"
                            style={{
                              verticalAlign: "middle",
                              backgroundColor: isSel ? "rgba(21,101,192,0.05)" : undefined,
                              borderLeft: isSel ? `2px solid ${C.blue}` : undefined,
                              borderRight: isSel ? `2px solid ${C.blue}` : undefined,
                            }}
                            onClick={() => handleSelTransfer(o.id)}
                          >
                            {row.render(o)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      </div>

      {hasChanges && (
        <div
          className="px-4 py-3 flex items-center justify-between gap-3"
          style={{ borderTop: "2px solid #bfdbfe", backgroundColor: "#eff6ff" }}
        >
          <p className="text-xs" style={{ color: C.blue }}>
            <span className="font-semibold">Unsaved changes</span>
            {" — "}review your selection before applying.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setHasChanges(false);
                setIutChanged(false);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ backgroundColor: "#e2e8f0", color: "#64748b" }}
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => {
                setHasChanges(false);
                setIutChanged(false);
                toast.success("Changes applied", {
                  description: "Scenario updated with your selection.",
                  duration: 3000,
                });
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ backgroundColor: C.blue, color: "#fff" }}
            >
              Apply Changes
            </button>
          </div>
        </div>
      )}
    </>
  );

  if (isFullscreen) {
    return createPortal(
      <div
        className="fixed inset-0 flex flex-col bg-white"
        style={{ zIndex: 100 }}
      >
        {cardBody}
      </div>,
      document.body
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden bg-white"
      style={{ width: isComboLayout ? "100%" : "max-content", minWidth: isComboLayout ? undefined : "50%", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}
    >
      {cardBody}
    </div>
  );
}
