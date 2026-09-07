import type React from "react";
import type { ComponentBreakdownRow } from "./types";
import {
  ON_HAND_EXPAND_COLUMNS,
  BREAKDOWN_TAIL_COLUMNS,
  EXPANDED_ONHAND_HEADER_BG,
  EXPANDED_BREAKDOWN_HEADER_BG,
  EXPANDED_ONHAND_CELL_BG,
  EXPANDED_BREAKDOWN_CELL_BG,
  EXPANDED_GROUP_BORDER,
  C,
} from "./constants";

export function getStockSubColumns(stockExpanded: boolean): string[] {
  if (!stockExpanded) return ["On-hand stock", "Open PO qty"];
  return ["On-hand stock", ...ON_HAND_EXPAND_COLUMNS, "Open PO qty"];
}

export function getBreakdownColumnCount(stockExpanded: boolean): number {
  return 1 + getStockSubColumns(stockExpanded).length + BREAKDOWN_TAIL_COLUMNS.length;
}

export function getStockColumnCount(stockExpanded: boolean): number {
  return getStockSubColumns(stockExpanded).length;
}

export function isOnHandParentCol(colIdx: number, stockExpanded: boolean) {
  return stockExpanded && colIdx === 1;
}

export function isStockBreakdownCol(colIdx: number, stockExpanded: boolean) {
  return stockExpanded && colIdx >= 2 && colIdx <= 1 + ON_HAND_EXPAND_COLUMNS.length;
}

export function getBorderIndices(stockExpanded: boolean) {
  const stockColCount = getStockColumnCount(stockExpanded);
  const uomIdx = 1 + stockColCount;
  const fgUomIdx = uomIdx + 3;
  const section = new Set([0, uomIdx, fgUomIdx]);
  const column = new Set([fgUomIdx + 1, fgUomIdx + 2, fgUomIdx + 3]);
  return { section, column };
}

export function breakdownColBorder(
  colIndex: number,
  stockExpanded: boolean,
  isHeader = false,
): React.CSSProperties {
  const { section, column } = getBorderIndices(stockExpanded);

  if (section.has(colIndex)) {
    return {
      borderRight: isHeader
        ? "1px solid rgba(255,255,255,0.3)"
        : "1px solid #cbd5e1",
    };
  }

  if (column.has(colIndex)) {
    return {
      borderRight: isHeader
        ? "1px solid rgba(255,255,255,0.2)"
        : "1px solid #e5e7eb",
    };
  }

  return {
    borderRight: isHeader
      ? "1px solid rgba(255,255,255,0.12)"
      : "1px solid #f1f5f9",
  };
}

export function breakdownHeaderStyle(
  colIdx: number,
  stockExpanded: boolean,
  isOnHandToggle: boolean,
): React.CSSProperties {
  const base: React.CSSProperties = {
    color: "#ffffff",
    fontSize: 9,
    cursor: isOnHandToggle ? "pointer" : undefined,
    ...breakdownColBorder(colIdx, stockExpanded, true),
  };

  if (!stockExpanded) return base;

  if (isOnHandParentCol(colIdx, true)) {
    return {
      ...base,
      backgroundColor: EXPANDED_ONHAND_HEADER_BG,
      color: "#1e40af",
      fontWeight: 700,
      borderLeft: EXPANDED_GROUP_BORDER,
    };
  }

  if (isStockBreakdownCol(colIdx, true)) {
    const lastBreakdown = 1 + ON_HAND_EXPAND_COLUMNS.length;
    return {
      ...base,
      backgroundColor: EXPANDED_BREAKDOWN_HEADER_BG,
      color: "#334155",
      borderRight:
        colIdx === lastBreakdown
          ? EXPANDED_GROUP_BORDER
          : "1px solid #dbeafe",
    };
  }

  return base;
}

export function breakdownBodyStyle(
  colIdx: number,
  rowIndex: number,
  stockExpanded: boolean,
): React.CSSProperties {
  const base = breakdownColBorder(colIdx, stockExpanded);

  if (!stockExpanded) return base;

  if (isOnHandParentCol(colIdx, true)) {
    return {
      ...base,
      backgroundColor: EXPANDED_ONHAND_CELL_BG,
      borderLeft: EXPANDED_GROUP_BORDER,
    };
  }

  if (isStockBreakdownCol(colIdx, true)) {
    const lastBreakdown = 1 + ON_HAND_EXPAND_COLUMNS.length;
    return {
      ...base,
      backgroundColor: EXPANDED_BREAKDOWN_CELL_BG,
      borderRight:
        colIdx === lastBreakdown
          ? EXPANDED_GROUP_BORDER
          : "1px solid #e2e8f0",
    };
  }

  return base;
}

export function getStockCellValues(comp: ComponentBreakdownRow, stockExpanded: boolean): string[] {
  if (!stockExpanded) {
    return [comp.onHandStock, comp.openPoQty];
  }

  return [
    comp.onHandStock,
    comp.onHandBreakdown.unrestricted,
    comp.onHandBreakdown.quality,
    comp.onHandBreakdown.stv,
    comp.onHandBreakdown.blocked,
    comp.onHandBreakdown.total,
    comp.openPoQty,
  ];
}

export function getTailCellValues(comp: ComponentBreakdownRow): string[] {
  return [
    comp.uom,
    comp.fgEquivalentStock,
    comp.fgUnitsProducible,
    comp.fgUom,
    comp.consumed,
    comp.leftoverQty,
    comp.leftoverValue,
    comp.prodStopDate,
  ];
}

export function tailCellColor(comp: ComponentBreakdownRow, tailIdx: number): string {
  if (tailIdx === 5) {
    if (comp.leftoverQty === "Nil") return C.green;
    if (comp.highlightLeftover) return "#dc2626";
  }
  if (tailIdx === 6) {
    if (comp.leftoverValue === "Nil") return C.green;
    if (comp.highlightLeftover) return "#dc2626";
  }
  return "#374151";
}
