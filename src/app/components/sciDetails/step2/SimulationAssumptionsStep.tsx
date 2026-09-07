import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Box,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Info,
  ShoppingCart,
  X,
} from "lucide-react";
import type { CBURow } from "../../data";
import { StepSection } from "../StepSection";
import { AssumptionDateInput } from "../AssumptionDateInput";
import { ToggleSwitch } from "../ToggleSwitch";
import { ComponentCodeWithDesc } from "../ComponentCodeWithDesc";
import { C, IUT_TRANSFER_LANES, MOQ_BREAK_MATERIALS } from "../constants";
import { buildOpenPoLinesForCbu } from "../utils";
import { OpenPoWeekMonthEditor } from "./OpenPoWeekMonthEditor";
import { OpenPoAssumptionsPanel } from "./OpenPoAssumptionsPanel";
import { IutLaneRow } from "./IutLaneRow";
import { MoqBreakMaterialRow } from "./MoqBreakMaterialRow";

export function SimulationAssumptionsStep({
  newCbuRow,
  onDirty,
}: {
  newCbuRow: CBURow | null;
  /** Called whenever the user changes an assumption that should mark the page's draft as dirty. */
  onDirty?: () => void;
}) {
  const [networkTransitionDate, setNetworkTransitionDate] = useState("");
  const [openPoCancel, setOpenPoCancel] = useState(false);
  const [poIncluded, setPoIncluded] = useState(true);
  const [rmpmWeek, setRmpmWeek] = useState("");
  const [rmpmMonth, setRmpmMonth] = useState("");
  const [moqBreak, setMoqBreak] = useState<Record<string, boolean>>({
    "65284824": false,
    "65428959": false,
    "RM-XCBU-01": false,
  });
  const [iutLanes, setIutLanes] = useState<Record<string, boolean>>({
    "U535→UTR": true,
    "UTR→U535": true,
  });

  const handleNetworkTransitionDate = (v: string) => {
    setNetworkTransitionDate(v);
    onDirty?.();
  };
  const handleOpenPoCancel = (v: boolean) => {
    setOpenPoCancel(v);
    onDirty?.();
  };
  const handlePoIncluded = (v: boolean) => {
    setPoIncluded(v);
    onDirty?.();
  };
  const handleRmpmWeek = (v: string) => {
    setRmpmWeek(v);
    onDirty?.();
  };
  const handleRmpmMonth = (v: string) => {
    setRmpmMonth(v);
    onDirty?.();
  };
  const handleIutLaneToggle = (laneKey: string) => {
    setIutLanes((prev) => ({ ...prev, [laneKey]: !prev[laneKey] }));
    onDirty?.();
  };
  const [expandedIutLanes, setExpandedIutLanes] = useState<Record<string, boolean>>({});
  const [expandedMoqMaterials, setExpandedMoqMaterials] = useState<Record<string, boolean>>({});
  const [iutSectionOpen, setIutSectionOpen] = useState(false);
  const [moqSectionOpen, setMoqSectionOpen] = useState(false);
  const [feedStockIds, setFeedStockIds] = useState<Record<string, string>>({
    "65284824": "FS-65284824",
    "65428959": "",
    "RM-XCBU-01": "FS-XCBU-77",
  });
  const [feedStockConv, setFeedStockConv] = useState<Record<string, string>>({
    "65284824": "1.00",
    "65428959": "",
    "RM-XCBU-01": "1.25",
  });
  const [feedStockSelectedCbu, setFeedStockSelectedCbu] = useState<Record<string, string>>({
    "RM-XCBU-01": "VAFA1R3",
  });

  const iutPossibleCount = IUT_TRANSFER_LANES.filter(
    (lane) => iutLanes[`${lane.from}→${lane.to}`],
  ).length;
  const iutTotalLanes = IUT_TRANSFER_LANES.length;

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const newCbuOpenPoLines = useMemo(
    () => (newCbuRow ? buildOpenPoLinesForCbu(newCbuRow) : []),
    [newCbuRow],
  );

  return (
    <StepSection
      step={2}
      title="Simulation Assumptions"
      subtitle="Configure assumptions before running scenarios."
    >
      <div className="space-y-3">
        <div
          className="rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: C.bgBlue }}
            >
              <Clock size={18} style={{ color: C.blue }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: C.navy }}>
                Network transition pre-defined date
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                Transition date (today onwards)
              </p>
            </div>
          </div>
          <AssumptionDateInput
            value={networkTransitionDate}
            onChange={handleNetworkTransitionDate}
            min={todayIso}
          />
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: C.bgBlue }}
              >
                <ShoppingCart size={18} style={{ color: C.blue }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: C.navy }}>
                  Open PO assumptions
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                  1 PO line — 1,500 units total
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={openPoCancel}
              onChange={handleOpenPoCancel}
              label="Open POs can be cancelled"
            />
          </div>

          {openPoCancel && (
            <div
              className="px-4 pb-4"
              style={{ borderTop: "1px solid #f1f5f9" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
                <span style={{ color: "#64748b" }}>
                  1 of 1 included — 1,500 units active
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    title="Include all open PO lines in the simulation"
                    className="flex text-xs items-center cursor-pointer gap-1 px-2.5 py-1 rounded-full font-semibold transition-colors"
                    style={{
                      backgroundColor: poIncluded ? "#dcfce7" : "#f1f5f9",
                      color: poIncluded ? "#166534" : "#94a3b8",
                    }}
                    onClick={() => handlePoIncluded(true)}
                  >
                    <Check size={12} />
                    Include all
                  </button>
                  <button
                    type="button"
                    title="Exclude all open PO lines from the simulation"
                    className="flex text-xs items-center cursor-pointer gap-1 px-2.5 py-1 rounded-full font-semibold transition-colors"
                    style={{
                      backgroundColor: !poIncluded ? "#fee2e2" : "#f1f5f9",
                      color: !poIncluded ? "#b91c1c" : "#94a3b8",
                    }}
                    onClick={() => handlePoIncluded(false)}
                  >
                    <X size={12} />
                    Exclude all
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid #e2e8f0" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc" }}>
                      {["INCL.", "PLANT", "COMPONENT", "OPEN PO QTY", "UOM", "STATUS"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-3 py-2 text-left font-semibold"
                            style={{ color: "#64748b" }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={poIncluded}
                          onChange={(e) => handlePoIncluded(e.target.checked)}
                          title={poIncluded ? "Exclude this PO line" : "Include this PO line"}
                          className="rounded cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium">U535</td>
                      <td className="px-3 py-2">
                        <ComponentCodeWithDesc code="65284824" />
                      </td>
                      <td className="px-3 py-2 font-bold">1,500</td>
                      <td className="px-3 py-2">EA</td>
                      <td className="px-3 py-2">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{
                            backgroundColor: poIncluded ? "#dcfce7" : "#fee2e2",
                            color: poIncluded ? "#166534" : "#b91c1c",
                          }}
                        >
                          {poIncluded ? "Included" : "Excluded"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: C.bgBlue }}
              >
                <Calendar size={18} style={{ color: C.blue }} />
              </div>
              <div>
                <p className="text-sm font-bold flex items-center gap-2" style={{ color: C.navy }}>
                  RMPM connectivity date
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}
                  >
                    Mandatory
                  </span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                  {newCbuRow
                    ? `RM/PM material delivery date · New CBU ${newCbuRow.cbuCode}`
                    : "RM/PM material delivery date"}
                </p>
              </div>
            </div>
            {!newCbuRow && (
              <OpenPoWeekMonthEditor
                week={rmpmWeek}
                month={rmpmMonth}
                onWeekChange={handleRmpmWeek}
                onMonthChange={handleRmpmMonth}
              />
            )}
          </div>

          {newCbuRow && (
            <OpenPoAssumptionsPanel lines={newCbuOpenPoLines} />
          )}
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIutSectionOpen((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIutSectionOpen((prev) => !prev);
              }
            }}
            title={`${iutSectionOpen ? "Collapse" : "Expand"} IUT feasibility`}
            className="px-4 py-3 flex items-center gap-3 cursor-pointer"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: C.bgBlue }}
            >
              <ArrowLeftRight size={18} style={{ color: C.blue }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold flex items-center gap-1.5" style={{ color: C.navy }}>
                IUT feasibility
                <span
                  title="Mark which plant-to-plant lanes are possible for inter-unit transfers."
                  style={{ cursor: "help", display: "inline-flex" }}
                >
                  <Info size={13} style={{ color: "#94a3b8", flexShrink: 0 }} />
                </span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                Plant-to-plant lane availability
              </p>
            </div>
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0"
              style={{
                backgroundColor:
                  iutPossibleCount === iutTotalLanes
                    ? "#dcfce7"
                    : iutPossibleCount === 0
                      ? "#fee2e2"
                      : "#fef3c7",
                color:
                  iutPossibleCount === iutTotalLanes
                    ? "#166534"
                    : iutPossibleCount === 0
                      ? "#b91c1c"
                      : "#92400e",
              }}
            >
              {iutPossibleCount} of {iutTotalLanes} possible
            </span>
            {iutSectionOpen ? (
              <ChevronDown size={16} style={{ color: C.blue, flexShrink: 0 }} />
            ) : (
              <ChevronRight size={16} style={{ color: C.blue, flexShrink: 0 }} />
            )}
          </div>
          {iutSectionOpen && (
            <div style={{ borderTop: "1px solid #f1f5f9" }}>
              {IUT_TRANSFER_LANES.map((lane) => {
                const laneKey = `${lane.from}→${lane.to}`;
                return (
                  <IutLaneRow
                    key={laneKey}
                    lane={lane}
                    possible={iutLanes[laneKey]}
                    expanded={!!expandedIutLanes[laneKey]}
                    onToggleExpand={() =>
                      setExpandedIutLanes((prev) => ({ ...prev, [laneKey]: !prev[laneKey] }))
                    }
                    onTogglePossible={() => handleIutLaneToggle(laneKey)}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => setMoqSectionOpen((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setMoqSectionOpen((prev) => !prev);
              }
            }}
            title={`${moqSectionOpen ? "Collapse" : "Expand"} MOQ break possibility`}
            className="px-4 py-3 flex items-center gap-3 cursor-pointer"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: C.bgBlue }}
            >
              <Box size={18} style={{ color: C.blue }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold flex items-center gap-1.5" style={{ color: C.navy }}>
                MOQ break possibility
                <span
                  title="Mark whether the MOQ can be broken for each material."
                  style={{ cursor: "help", display: "inline-flex" }}
                >
                  <Info size={13} style={{ color: "#94a3b8", flexShrink: 0 }} />
                </span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                MOQ break eligibility by material
              </p>
            </div>
            {moqSectionOpen ? (
              <ChevronDown size={16} style={{ color: C.blue, flexShrink: 0 }} />
            ) : (
              <ChevronRight size={16} style={{ color: C.blue, flexShrink: 0 }} />
            )}
          </div>
          {moqSectionOpen && (
            <div style={{ borderTop: "1px solid #f1f5f9" }}>
              {MOQ_BREAK_MATERIALS.map((mat) => (
                <MoqBreakMaterialRow
                  key={mat.code}
                  mat={mat}
                  canBreak={moqBreak[mat.code]}
                  expanded={!!expandedMoqMaterials[mat.code]}
                  onToggleExpand={() =>
                    setExpandedMoqMaterials((prev) => ({ ...prev, [mat.code]: !prev[mat.code] }))
                  }
                  onToggleBreak={(next) => {
                    setMoqBreak((prev) => ({ ...prev, [mat.code]: next }));
                    onDirty?.();
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <div className="px-4 py-3 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: C.bgBlue }}
            >
              <Shuffle size={18} style={{ color: C.blue }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: C.navy }}>
                Feed stock allocation
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                Sample availability is pre-filled to illustrate each state — edit as needed. If one feed stock makes several materials, confirm with the supplier which to produce.
              </p>
            </div>
          </div>

          {(() => {
            const neededCount = MOQ_BREAK_MATERIALS.filter(
              (mat) => feedStockStatus(mat.code, feedStockIds, MOQ_BREAK_MATERIALS) === "needed",
            ).length;
            if (neededCount === 0) return null;
            return (
              <div className="px-4 pb-3">
                <div
                  className="px-3 py-2 flex items-center gap-2 rounded-lg"
                  style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}
                >
                  <AlertTriangle size={13} style={{ color: "#d97706", flexShrink: 0 }} />
                  <span className="text-xs" style={{ color: "#92400e" }}>
                    <span className="font-bold">Feed stock data needed</span> for{" "}
                    {neededCount} material{neededCount > 1 ? "s" : ""}. Request feed
                    stock details from the supplier/user to validate these scenarios.
                  </span>
                </div>
              </div>
            );
          })()}

          <div style={{ borderTop: "1px solid #f1f5f9" }}>
            {MOQ_BREAK_MATERIALS.map((mat) => (
              <FeedStockAllocationRow
                key={mat.code}
                mat={mat}
                value={feedStockIds[mat.code] ?? ""}
                conv={feedStockConv[mat.code] ?? ""}
                status={feedStockStatus(mat.code, feedStockIds, MOQ_BREAK_MATERIALS)}
                selectedCbu={feedStockSelectedCbu[mat.code]}
                onChange={(next) =>
                  setFeedStockIds((prev) => ({ ...prev, [mat.code]: next }))
                }
                onConvChange={(next) =>
                  setFeedStockConv((prev) => ({ ...prev, [mat.code]: next }))
                }
                onSelectCbu={(cbu) =>
                  setFeedStockSelectedCbu((prev) => ({ ...prev, [mat.code]: cbu }))
                }
              />
            ))}
          </div>
        </div> */}
      </div>
    </StepSection>
  );
}
