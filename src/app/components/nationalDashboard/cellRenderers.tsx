import { ChevronDown, ChevronRight, FlaskConical } from "lucide-react";
import type { NavState } from "../../App";
import { type AggregatedComponent, type CBURow } from "../data";
import { calcCover, cellBaseStyle, getColTheme, getMetaColumnValue, stickyBody, transitTooltip } from "./utils";
import { fmtDateThemed, fmtDaysThemed, fmtNWithTheme } from "./format";
import { CELL_TOOLTIPS, EMPTY_CELL_PLACEHOLDER } from "../../constants/nationalDashboard";
import type { ColDef, CoverResult, EffRmpm, UomFilter } from "./types";

export function metaCell(
  col: ColDef,
  row: CBURow,
  rowBg: string,
  isExpanded: boolean,
  onCbuClick: (row: CBURow) => void,
  navigate: (state: NavState) => void,
  stickyLeft: number,
): React.ReactNode {
  const baseStyle: React.CSSProperties = {
    ...stickyBody(stickyLeft, col.minWidth, rowBg),
    borderColor: "#e5e7eb",
  };

  if (col.id === "cbuCode") {
    return (
      <td
        key={col.id}
        className="px-2 py-1 border font-semibold cursor-pointer"
        style={baseStyle}
        onClick={() => onCbuClick(row)}
      >
        <span
          className="flex items-center gap-1.5 whitespace-nowrap"
          style={{ color: "#1565C0" }}
        >
          {isExpanded ? (
            <ChevronDown size={13} style={{ color: "#1565C0", flexShrink: 0 }} />
          ) : (
            <ChevronRight size={13} style={{ color: "#1565C0", flexShrink: 0 }} />
          )}
          {row.cbuCode}
        </span>
      </td>
    );
  }

  if (col.id === "cbuDescription") {
    return (
      <td key={col.id} className="px-2 py-1 border" style={baseStyle}>
        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            className="truncate hover:underline cursor-pointer text-left"
            style={{ color: "#1565C0", maxWidth: col.minWidth - 28, font: "inherit" }}
            title={CELL_TOOLTIPS.viewCbuDetail}
            onClick={(e) => {
              e.stopPropagation();
              navigate({ page: "cbu-detail", srNo: row.srNo });
            }}
          >
            {row.cbuDescription}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate({ page: "network-down-stocking-agent-trial", srNo: row.srNo });
            }}
            title={CELL_TOOLTIPS.openScenarioSimulation}
            className="shrink-0 p-1 rounded transition-colors cursor-pointer"
            style={{ color: "#1565C0" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#EDF5F4";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "transparent";
            }}
          >
            <FlaskConical size={12} aria-hidden="true" />
          </button>
        </div>
      </td>
    );
  }

  const value = getMetaColumnValue(row, col.id);
  return (
    <td
      key={col.id}
      className="px-2 py-1 border truncate"
      style={{ ...baseStyle, color: "#374151" }}
      title={value}
    >
      {value || EMPTY_CELL_PLACEHOLDER}
    </td>
  );
}

export function mainCell(
  colId: string,
  row: CBURow,
  eff: EffRmpm,
  uom: UomFilter,
  totalFG: number,
  fgCov: CoverResult,
  totCov: CoverResult,
  exclCov: CoverResult,
  onDemand: (e: React.MouseEvent, period: "3tdp" | "6m" | "12m") => void,
  onDcStockClick: (e: React.MouseEvent) => void,
  onFactoryStockClick: (e: React.MouseEvent) => void,
  onInTransitClick: (e: React.MouseEvent) => void,
): React.ReactNode {
  const s = (cid: string, n: number) =>
    fmtNWithTheme(n, row.weightKg, uom, getColTheme(cid).text);
  switch (colId) {
    case "fg_dc":
      return (
        <td
          key={colId}
          style={{ ...cellBaseStyle(colId), cursor: "pointer" }}
          className="px-2 py-1 text-right hover:underline"
          title={CELL_TOOLTIPS.viewDcBreakdown}
          onClick={onDcStockClick}
        >
          {s(colId, row.fg.dcStock)}
        </td>
      );
    case "fg_factory":
      if (row.fg.factoryStock <= 0) {
        return (
          <td
            key={colId}
            style={cellBaseStyle(colId)}
            className="px-2 py-1 text-right"
            title={CELL_TOOLTIPS.noFactoryStock}
          >
            {s(colId, row.fg.factoryStock)}
          </td>
        );
      }
      return (
        <td
          key={colId}
          style={{ ...cellBaseStyle(colId), cursor: "pointer" }}
          className="px-2 py-1 text-right hover:underline"
          title={CELL_TOOLTIPS.viewFactoryBreakdown}
          onClick={onFactoryStockClick}
        >
          {s(colId, row.fg.factoryStock)}
        </td>
      );
    case "fg_intransit":
      if (row.fg.inTransitStock <= 0) {
        return (
          <td
            key={colId}
            style={cellBaseStyle(colId)}
            className="px-2 py-1 text-right"
            title={CELL_TOOLTIPS.noTransitStock}
          >
            {s(colId, row.fg.inTransitStock)}
          </td>
        );
      }
      return (
        <td
          key={colId}
          style={{ ...cellBaseStyle(colId), cursor: "pointer" }}
          className="px-2 py-1 text-right hover:underline"
          title={`${transitTooltip(row.fg.inTransitStock, row.srNo)}\n\n${CELL_TOOLTIPS.viewTransitBreakdown}`}
          onClick={onInTransitClick}
        >
          {s(colId, row.fg.inTransitStock)}
        </td>
      );
    case "fg_total":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right font-semibold"
        >
          {s(colId, row.fg.totalStock)}
        </td>
      );
    case "rmpm_physical":
      return (
        <td key={colId} style={cellBaseStyle(colId)} className="px-2 py-1 text-right">
          {s(colId, eff.physicalStock)}
        </td>
      );
    case "rmpm_quality":
      return (
        <td key={colId} style={cellBaseStyle(colId)} className="px-2 py-1 text-right">
          {s(colId, eff.qualityStock)}
        </td>
      );
    case "rmpm_openpo":
      return (
        <td key={colId} style={cellBaseStyle(colId)} className="px-2 py-1 text-right">
          {s(colId, eff.openPOStock)}
        </td>
      );
    case "rmpm_intransit":
    case "rmpm_supplier":
      return <td key={colId} style={cellBaseStyle(colId)} className="px-2 py-1 text-right" />;
    case "rmpm_total":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right font-semibold"
        >
          {s(colId, eff.totalStock)}
        </td>
      );
    case "rmpm_blocked":
      return (
        <td key={colId} style={cellBaseStyle(colId)} className="px-2 py-1 text-right">
          {s(colId, eff.blockedStock)}
        </td>
      );
    case "demand_3tdp":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right cursor-pointer transition-colors font-medium hover:underline"
          onClick={(e) => onDemand(e, "3tdp")}
        >
          {s(colId, row.demand.sumNext3TDP)}
        </td>
      );
    case "demand_6m":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right cursor-pointer transition-colors font-medium hover:underline"
          onClick={(e) => onDemand(e, "6m")}
        >
          {s(colId, row.demand.next6Months)}
        </td>
      );
    case "demand_12m":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right cursor-pointer transition-colors font-semibold hover:underline"
          onClick={(e) => onDemand(e, "12m")}
        >
          {s(colId, row.demand.next12Months)}
        </td>
      );
    case "total_fg":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right font-semibold"
        >
          {s(colId, totalFG)}
        </td>
      );
    case "fg_cover_days":
      return (
        <td key={colId} style={cellBaseStyle(colId)} className="px-2 py-1 text-right">
          {fmtDaysThemed(totCov.days, getColTheme(colId).text)}
        </td>
      );
    case "cover_fg":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right whitespace-nowrap"
        >
          {fmtDateThemed(fgCov.date, getColTheme(colId).text)}
        </td>
      );
    case "cover_total":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right whitespace-nowrap"
        >
          {fmtDateThemed(totCov.date, getColTheme(colId).text)}
        </td>
      );
    case "cover_excl":
      return (
        <td
          key={colId}
          style={cellBaseStyle(colId)}
          className="px-2 py-1 text-right whitespace-nowrap"
        >
          {fmtDateThemed(exclCov.date, getColTheme(colId).text)}
        </td>
      );
    default:
      return <td key={colId} className="px-2 py-1 border border-gray-100" />;
  }
}

export function compCell(
  colId: string,
  comp: AggregatedComponent,
  row: CBURow,
  uom: UomFilter,
): React.ReactNode {
  const s = (cid: string, n: number) =>
    fmtNWithTheme(n, row.weightKg, uom, getColTheme(cid).text);
  const avail = comp.unrestrictedStock + comp.qualityStock + comp.openPOStock;
  const cov = calcCover(avail, row.demand.next12Months);
  const covExcl = calcCover(
    comp.unrestrictedStock + comp.qualityStock,
    row.demand.next12Months,
  );
  const blank = (
    <td
      key={colId}
      className="border"
      style={{ ...cellBaseStyle(colId), borderColor: "#c8d8e8" }}
    />
  );
  switch (colId) {
    case "fg_dc":
    case "fg_factory":
    case "fg_intransit":
    case "fg_total":
      return blank;
    case "rmpm_physical":
      return (
        <td key={colId} className="px-3 py-2 text-right font-medium" style={cellBaseStyle(colId)}>
          {s(colId, comp.unrestrictedStock)}
        </td>
      );
    case "rmpm_quality":
      return (
        <td key={colId} className="px-3 py-2 text-right" style={cellBaseStyle(colId)}>
          {s(colId, comp.qualityStock)}
        </td>
      );
    case "rmpm_openpo":
      return (
        <td key={colId} className="px-3 py-2 text-right" style={cellBaseStyle(colId)}>
          {s(colId, comp.openPOStock)}
        </td>
      );
    case "rmpm_intransit":
    case "rmpm_supplier":
      return blank;
    case "rmpm_total":
      return (
        <td key={colId} className="px-3 py-2 text-right font-semibold" style={cellBaseStyle(colId)}>
          {s(colId, avail)}
        </td>
      );
    case "rmpm_blocked":
      return (
        <td key={colId} className="px-3 py-2 text-right" style={cellBaseStyle(colId)}>
          {s(colId, comp.blockedStock)}
        </td>
      );
    case "demand_3tdp":
    case "demand_6m":
    case "demand_12m":
      return blank;
    case "total_fg":
      return (
        <td key={colId} className="px-3 py-2 text-right font-semibold" style={cellBaseStyle(colId)}>
          {s(colId, avail)}
        </td>
      );
    case "fg_cover_days":
      return (
        <td key={colId} className="px-3 py-2 text-right" style={cellBaseStyle(colId)}>
          {fmtDaysThemed(cov.days, getColTheme(colId).text)}
        </td>
      );
    case "cover_fg":
      return blank;
    case "cover_total":
      return (
        <td key={colId} className="px-3 py-2 text-right whitespace-nowrap" style={cellBaseStyle(colId)}>
          {fmtDateThemed(cov.date, getColTheme(colId).text)}
        </td>
      );
    case "cover_excl":
      return (
        <td key={colId} className="px-3 py-2 text-right whitespace-nowrap" style={cellBaseStyle(colId)}>
          {fmtDateThemed(covExcl.date, getColTheme(colId).text)}
        </td>
      );
    default:
      return blank;
  }
}
