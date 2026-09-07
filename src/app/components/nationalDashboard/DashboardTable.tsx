import { Fragment } from "react";
import type { NavState } from "../../App";
import {
  getComponentDescription,
  type AggregatedComponent,
  type CBURow,
} from "../data";
import { metaCell, mainCell, compCell } from "./cellRenderers";
import { SortIndicator } from "./SortIndicator";
import {
  COVER_COL_TOOLTIPS,
  G,
  G_LABEL,
  W_SR,
  SR_NO_LABEL,
  noComponentDataMessage,
  UNIQUE_COMPONENTS_LABEL,
  FILTERED_BADGE_LABEL,
  HIGH_CONTRIBUTING_GROUP_LABEL,
  HIGH_CONTRIBUTING_EMPTY_MESSAGE,
} from "../../constants/nationalDashboard";
import { calcCover, computeEffRmpm, metaColLeft, stickyBody, stickyHead, subHdrStyle } from "./utils";
import type { ColDef, ColumnGroup, SortDir, TypeFilter, UomFilter } from "./types";

interface DashboardTableProps {
  orderedMetaCols: ColDef[];
  orderedDataCols: ColDef[];
  groupRuns: Array<{ group: ColumnGroup; count: number }>;
  tableMinWidth: number;
  metaWidth: number;
  stickyColCount: number;
  sortCol: string | null;
  sortDir: SortDir;
  onSort: (colId: string) => void;
  paginatedRows: CBURow[];
  expandedSrNo: number | null;
  componentCache: Record<number, AggregatedComponent[]>;
  highContributingCache: Record<number, AggregatedComponent[]>;
  selectedComponents: Record<number, Set<string>>;
  typeFilter: TypeFilter;
  uom: UomFilter;
  showHighContributing: boolean;
  onCbuClick: (row: CBURow) => void;
  navigate: (state: NavState) => void;
  onToggleComp: (srNo: number, code: string) => void;
  onToggleAll: (srNo: number, comps: AggregatedComponent[], allSel: boolean) => void;
  onDemandClick: (row: CBURow, period: "3tdp" | "6m" | "12m") => void;
  onDcStockClick: (row: CBURow) => void;
  onFactoryStockClick: (row: CBURow) => void;
  onInTransitClick: (row: CBURow) => void;
}

export function DashboardTable({
  orderedMetaCols,
  orderedDataCols,
  groupRuns,
  tableMinWidth,
  metaWidth,
  stickyColCount,
  sortCol,
  sortDir,
  onSort,
  paginatedRows,
  expandedSrNo,
  componentCache,
  highContributingCache,
  selectedComponents,
  typeFilter,
  uom,
  showHighContributing,
  onCbuClick,
  navigate,
  onToggleComp,
  onToggleAll,
  onDemandClick,
  onDcStockClick,
  onFactoryStockClick,
  onInTransitClick,
}: DashboardTableProps) {
  return (
    <div className="flex-1 overflow-auto" style={{ backgroundColor: "#ffffff" }}>
      <div
        className="overflow-auto shadow-lg"
        style={{
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: "#d1d5db",
          boxShadow: "0 0 30px rgba(0,200,240,0.05)",
        }}
      >
        <table
          className="text-xs border-collapse"
          style={{
            backgroundColor: "#EDF5FA",
            minWidth: `${tableMinWidth}px`,
            width: "100%",
          }}
        >
          <thead>
            {/* Group header row */}
            <tr style={{ height: 38 }}>
              <th
                rowSpan={2}
                className="text-white border px-3 py-2 font-semibold whitespace-nowrap cursor-pointer select-none"
                style={{
                  ...stickyHead(0, W_SR),
                  top: 0,
                  backgroundColor: "#003087",
                  borderColor: "#ffffff",
                  zIndex: 35,
                  textAlign: "center",
                }}
                onClick={() => onSort("srNo")}
              >
                <span className="inline-flex items-center gap-1 justify-center">
                  {SR_NO_LABEL}
                  <SortIndicator colId="srNo" sortCol={sortCol} sortDir={sortDir} light />
                </span>
              </th>
              {orderedMetaCols.map((col, index) => (
                <th
                  key={`meta-hdr-${col.id}`}
                  rowSpan={2}
                  className="text-white border px-3 py-2 text-left font-semibold whitespace-nowrap cursor-pointer select-none"
                  style={{
                    ...stickyHead(metaColLeft(orderedMetaCols, index), col.minWidth),
                    top: 0,
                    backgroundColor: "#003087",
                    borderColor: "#ffffff",
                    zIndex: 35,
                  }}
                  onClick={() => onSort(col.id)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIndicator colId={col.id} sortCol={sortCol} sortDir={sortDir} light />
                  </span>
                </th>
              ))}
              {groupRuns.map((run, i) => (
                <th
                  key={`${run.group}-${i}`}
                  colSpan={run.count}
                  className="text-white border px-3 py-2 text-center font-semibold whitespace-nowrap"
                  style={{
                    backgroundColor: G[run.group].hdr,
                    position: "sticky",
                    top: 0,
                    zIndex: 20,
                    borderColor: "#ffffff",
                  }}
                >
                  {G_LABEL[run.group]}
                </th>
              ))}
            </tr>

            {/* Sub-header row — data columns only (meta + Sr No span 2 rows) */}
            <tr style={{ height: 34 }}>
              {orderedDataCols.map((col) => (
                <th
                  key={col.id}
                  className="border px-3 py-2 font-medium whitespace-nowrap cursor-pointer select-none"
                  style={{
                    ...subHdrStyle(col.id),
                    position: "sticky",
                    top: 38,
                    zIndex: 20,
                    minWidth: col.minWidth,
                    borderColor: "#ffffff",
                    fontWeight: 600,
                  }}
                  onClick={() => onSort(col.id)}
                  title={COVER_COL_TOOLTIPS[col.id]}
                >
                  <span className="text-right flex items-center justify-end gap-1">
                    {col.label}
                    <SortIndicator colId={col.id} sortCol={sortCol} sortDir={sortDir} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedRows.map((row) => {
              const isExpanded = expandedSrNo === row.srNo;
              const rowBg = isExpanded ? "#EDF5F4" : "#ffffff";

              const components: AggregatedComponent[] = componentCache[row.srNo] ?? [];
              const allHighContribComps = highContributingCache[row.srNo] ?? [];
              const selected: Set<string> =
                selectedComponents[row.srNo] ??
                new Set([
                  ...components.map((c) => c.componentCode),
                  ...allHighContribComps.map((c) => c.componentCode),
                ]);

              const visibleComps = components.filter((c) => {
                if (typeFilter === "ALL") return true;
                if (typeFilter === "RM") return c.componentMaterialType === "1002";
                if (typeFilter === "PM") return c.componentMaterialType === "1003";
                return true;
              });

              const isFiltered = typeFilter !== "ALL";

              const effRmpm = computeEffRmpm(
                components,
                allHighContribComps,
                showHighContributing,
                selected,
                typeFilter,
                row,
              );
              const totalFG = row.fg.totalStock + effRmpm.totalStock;
              const fgCov = calcCover(row.fg.totalStock, row.demand.next12Months);
              const totCov = calcCover(totalFG, row.demand.next12Months);
              const exclCov = calcCover(
                row.fg.totalStock + effRmpm.physicalStock + effRmpm.qualityStock,
                row.demand.next12Months,
              );

              // High-contributing components are sourced separately from
              // the CBU's standard RM/PM breakdown (visibleComps) — see
              // getHighContributingComponents for details.
              const highContribComps = allHighContribComps.filter((c) => {
                if (typeFilter === "RM") return c.componentMaterialType === "1002";
                if (typeFilter === "PM") return c.componentMaterialType === "1003";
                return true;
              });

              const renderComponentGroup = (
                comps: AggregatedComponent[],
                opts: {
                  keyPrefix: string;
                  label: React.ReactNode;
                  headerBg: string;
                  emptyMessage: string;
                },
              ) => {
                if (comps.length === 0) {
                  return (
                    <tr key={`${opts.keyPrefix}-empty-${row.srNo}`}>
                      <td
                        colSpan={stickyColCount + orderedDataCols.length}
                        className="px-4 py-3 text-center italic"
                        style={{
                          backgroundColor: "#fef2f2",
                          color: "#00695C",
                          borderBottom: "1px solid rgba(124,58,237,0.15)",
                        }}
                      >
                        {opts.emptyMessage}
                      </td>
                    </tr>
                  );
                }

                const groupAllSel = comps.every((c) => selected.has(c.componentCode));
                const groupSomeSel =
                  !groupAllSel && comps.some((c) => selected.has(c.componentCode));

                return (
                  <Fragment key={`${opts.keyPrefix}-group-${row.srNo}`}>
                    <tr key={`${opts.keyPrefix}-subhdr-${row.srNo}`}>
                      <td
                        className="px-3 py-1.5 border text-center"
                        style={{
                          ...stickyBody(0, W_SR, opts.headerBg),
                          borderColor: "rgba(21,101,192,0.12)",
                          backgroundColor: opts.headerBg,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={groupAllSel}
                          ref={(el) => {
                            if (el) el.indeterminate = groupSomeSel;
                          }}
                          onChange={() => onToggleAll(row.srNo, comps, groupAllSel)}
                          className="w-3.5 h-3.5 cursor-pointer"
                          style={{ accentColor: "#6366f1" }}
                        />
                      </td>
                      {orderedMetaCols.length > 0 ? (
                        <td
                          colSpan={orderedMetaCols.length}
                          className="px-3 py-1.5 border"
                          style={{
                            ...stickyBody(W_SR, metaWidth, opts.headerBg),
                            borderColor: "rgba(21,101,192,0.12)",
                            backgroundColor: opts.headerBg,
                          }}
                        >
                          <span
                            className="flex items-center gap-2 text-xs font-semibold"
                            style={{ color: "#1565C0" }}
                          >
                            <span style={{ color: "rgba(21,101,192,0.6)" }}>└</span>
                            {opts.label}
                          </span>
                        </td>
                      ) : null}
                      {orderedDataCols.map((col) => (
                        <td
                          key={col.id}
                          className="border"
                          style={{
                            backgroundColor: opts.headerBg,
                            borderColor: "rgba(21,101,192,0.12)",
                          }}
                        />
                      ))}
                    </tr>

                    {comps.map((comp, ci) => {
                      const isChecked = selected.has(comp.componentCode);
                      const compBg = isChecked ? "#F0F4FC" : "#ffffff";
                      return (
                        <tr
                          key={`${opts.keyPrefix}-comp-${row.srNo}-${ci}`}
                          className="cursor-pointer transition-all"
                          style={{ backgroundColor: compBg, opacity: isChecked ? 1 : 0.55 }}
                          onClick={() => onToggleComp(row.srNo, comp.componentCode)}
                        >
                          <td
                            className="px-3 py-2 border text-center"
                            style={{
                              ...stickyBody(0, W_SR, compBg),
                              borderColor: "rgba(21,101,192,0.12)",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => onToggleComp(row.srNo, comp.componentCode)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-3.5 h-3.5 cursor-pointer"
                              style={{ accentColor: "#6366f1" }}
                            />
                          </td>

                          {orderedMetaCols.map((col, index) => {
                            const left = metaColLeft(orderedMetaCols, index);
                            const cellStyle = {
                              ...stickyBody(left, col.minWidth, compBg),
                              borderColor: "rgba(21,101,192,0.12)",
                            };

                            if (col.id === "cbuCode") {
                              return (
                                <td key={`comp-meta-${col.id}`} className="px-3 py-2 border" style={cellStyle}>
                                  <span className="flex items-center gap-1.5 whitespace-nowrap text-xs">
                                    <span
                                      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                                      style={{
                                        backgroundColor: "rgba(0,105,92,0.15)",
                                        color: "#00695C",
                                      }}
                                    >
                                      {comp.componentMaterialType === "1002" ? "RM" : "PM"}
                                    </span>
                                    <span style={{ color: "rgba(21,101,192,0.6)" }}>⌞</span>
                                    <span className="font-mono font-medium" style={{ color: "#1565C0" }}>
                                      {comp.componentCode}
                                    </span>
                                  </span>
                                </td>
                              );
                            }

                            if (col.id === "cbuDescription") {
                              return (
                                <td key={`comp-meta-${col.id}`} className="px-3 py-2 border" style={cellStyle}>
                                  <span className="flex items-center justify-between gap-1.5">
                                    <span
                                      className="truncate text-xs"
                                      style={{ color: "#374151" }}
                                      title={getComponentDescription(comp)}
                                    >
                                      {getComponentDescription(comp)}
                                    </span>
                                    {comp.contributionPct != null && (
                                      <span
                                        className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                                        style={{
                                          backgroundColor: "rgba(234,88,12,0.15)",
                                          color: "#c2410c",
                                        }}
                                        title="Contribution to this CBU's production"
                                      >
                                        {comp.contributionPct}%
                                      </span>
                                    )}
                                  </span>
                                </td>
                              );
                            }

                            return <td key={`comp-meta-${col.id}`} className="border" style={cellStyle} />;
                          })}

                          {orderedDataCols.map((col) =>
                            compCell(col.id, comp, row, uom),
                          )}
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              };

              return (
                <Fragment key={`row-${row.srNo}`}>
                  <tr
                    className="transition-all group"
                    style={{
                      backgroundColor: rowBg,
                      outline: isExpanded ? "2px solid #1565C0" : undefined,
                      outlineOffset: isExpanded ? "-1px" : undefined,
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded)
                        (e.currentTarget as HTMLElement).style.backgroundColor = "#EDF5F4";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = rowBg;
                    }}
                  >
                    {/* Frozen: Sr No */}
                    <td
                      className="px-2 py-1 border text-center"
                      style={{
                        ...stickyBody(0, W_SR, rowBg),
                        borderColor: "#e5e7eb",
                        color: "#1565C0",
                      }}
                    >
                      {row.srNo}
                    </td>

                    {orderedMetaCols.map((col, index) =>
                      metaCell(
                        col,
                        row,
                        rowBg,
                        isExpanded,
                        onCbuClick,
                        navigate,
                        metaColLeft(orderedMetaCols, index),
                      ),
                    )}

                    {/* Dynamic columns */}
                    {orderedDataCols.map((col) =>
                      mainCell(
                        col.id,
                        row,
                        effRmpm,
                        uom,
                        totalFG,
                        fgCov,
                        totCov,
                        exclCov,
                        (e, period) => {
                          e.stopPropagation();
                          onDemandClick(row, period);
                        },
                        (e) => {
                          e.stopPropagation();
                          onDcStockClick(row);
                        },
                        (e) => {
                          e.stopPropagation();
                          onFactoryStockClick(row);
                        },
                        (e) => {
                          e.stopPropagation();
                          onInTransitClick(row);
                        },
                      ),
                    )}
                  </tr>

                  {/* Expanded component rows */}
                  {isExpanded && (
                    <>
                      {renderComponentGroup(visibleComps, {
                        keyPrefix: "main",
                        headerBg: "#EDF5F4",
                        emptyMessage: noComponentDataMessage(typeFilter),
                        label: (
                          <>
                            {UNIQUE_COMPONENTS_LABEL}{" "}
                            {typeFilter === "ALL"
                              ? "(all locations)"
                              : typeFilter === "RM"
                                ? "(RM)"
                                : "(PM)"}
                            {isFiltered && (
                              <span
                                className="px-1.5 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: "rgba(0,105,92,0.15)",
                                  color: "#00695C",
                                }}
                              >
                                {FILTERED_BADGE_LABEL}
                              </span>
                            )}
                          </>
                        ),
                      })}

                      {showHighContributing &&
                        renderComponentGroup(highContribComps, {
                          keyPrefix: "high",
                          headerBg: "#FFF7ED",
                          emptyMessage: HIGH_CONTRIBUTING_EMPTY_MESSAGE,
                          label: <>{HIGH_CONTRIBUTING_GROUP_LABEL}</>,
                        })}
                    </>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
