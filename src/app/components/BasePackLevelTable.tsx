import React, { Fragment } from "react";
import { ChevronDown, ChevronUp, FlaskConical } from "lucide-react";
import type { BasePackRow, BasePackSortCol } from "./basePackData";
import { useNav } from "../App";

type SortDir = "asc" | "desc";

const NAVY = "#003087";
const YELLOW_HDR = "#F4C430";
const YELLOW_SUB = "#FFF8DC";
const COVER_HDR = "#D9D9D9";
const COVER_SUB = "#F2F2F2";

const W_SR = 46;
const W_CODE = 88;
const W_DESC = 248;
const W_SMALL = 52;
const W_BG = 44;
const W_FORMAT = 132;
const W_NUM = 86;
const W_COVER = 108;

const fmt = (n: number) =>
  n === 0 ? "—" : Math.round(n).toLocaleString("en-IN");

function SortIndicator({
  colId,
  sortCol,
  sortDir,
}: {
  colId: string;
  sortCol: string | null;
  sortDir: SortDir;
}) {
  if (sortCol !== colId) return null;
  return sortDir === "asc" ? (
    <ChevronUp size={11} className="inline shrink-0" />
  ) : (
    <ChevronDown size={11} className="inline shrink-0" />
  );
}

interface Props {
  rows: BasePackRow[];
  sortCol: string | null;
  sortDir: SortDir;
  onSort: (col: BasePackSortCol) => void;
}

export function BasePackLevelTable({
  rows,
  sortCol,
  sortDir,
  onSort,
}: Props) {
  const { navigate } = useNav();

  const frozenWidth = W_SR + W_CODE + W_DESC + W_SMALL + W_BG + W_FORMAT;

  const stickyHead = (
    left: number,
    minWidth: number,
    top: number,
    zIndex: number,
  ): React.CSSProperties => ({
    position: "sticky",
    left,
    top,
    zIndex,
    minWidth,
    maxWidth: minWidth,
  });

  const stickyBody = (
    left: number,
    minWidth: number,
    bg: string,
  ): React.CSSProperties => ({
    position: "sticky",
    left,
    zIndex: 5,
    minWidth,
    maxWidth: minWidth,
    backgroundColor: bg,
  });

  const sortTh = (
    col: BasePackSortCol,
    label: string,
    width: number,
    bg: string,
    textColor: string,
    align: "left" | "center" | "right" = "right",
  ) => (
    <th
      key={col}
      className="border px-2 py-1.5 text-xs font-semibold cursor-pointer select-none whitespace-nowrap"
      style={{
        backgroundColor: bg,
        color: textColor,
        minWidth: width,
        textAlign: align,
        position: "sticky",
        top: 38,
        zIndex: 15,
        borderColor: "#c8d8e8",
        fontWeight: 600,
      }}
      onClick={() => onSort(col)}
    >
      <span
        className={`inline-flex items-center gap-0.5 w-full ${
          align === "right"
            ? "justify-end"
            : align === "center"
              ? "justify-center"
              : "justify-start"
        }`}
      >
        {label}
        <SortIndicator colId={col} sortCol={sortCol} sortDir={sortDir} />
      </span>
    </th>
  );

  const numCell = (value: number, highlight?: boolean) => (
    <td
      className="border px-2 py-1 text-xs tabular-nums text-right"
      style={{
        borderColor: "#c8d8e8",
        backgroundColor: highlight ? "#FFF2CC" : undefined,
        color: "#111827",
      }}
    >
      {fmt(value)}
    </td>
  );

  const coverCell = (value: string) => {
    const isSurplus = value === "Surplus";
    const isAlert =
      value.includes("No demand") || value.includes("No stock");
    return (
      <td
        className="border px-2 py-1 text-xs text-center whitespace-nowrap"
        style={{
          borderColor: "#c8d8e8",
          color: isSurplus ? "#16a34a" : isAlert ? "#dc2626" : "#003087",
          fontWeight: isSurplus ? 600 : 400,
        }}
      >
        {value}
      </td>
    );
  };

  return (
    <table
      className="text-xs border-collapse"
      style={{
        backgroundColor: "#EDF5FA",
        minWidth: frozenWidth + 2200,
        width: "100%",
      }}
    >
      <thead>
        {/* Level 1 — group headers */}
        <tr style={{ height: 38 }}>
          <th
            rowSpan={2}
            className="border px-2 py-2 text-center font-semibold whitespace-nowrap cursor-pointer select-none"
            style={{
              ...stickyHead(0, W_SR, 0, 40),
              backgroundColor: NAVY,
              borderColor: "rgba(255,255,255,0.15)",
              color: "#fff",
              verticalAlign: "middle",
            }}
            onClick={() => onSort("srNo")}
          >
            <span className="inline-flex items-center gap-1 justify-center">
              Srno.
              <SortIndicator colId="srNo" sortCol={sortCol} sortDir={sortDir} />
            </span>
          </th>
          <th
            rowSpan={2}
            className="border px-2 py-2 text-left font-semibold whitespace-nowrap cursor-pointer select-none"
            style={{
              ...stickyHead(W_SR, W_CODE, 0, 40),
              backgroundColor: NAVY,
              borderColor: "rgba(255,255,255,0.15)",
              color: "#fff",
              verticalAlign: "middle",
            }}
            onClick={() => onSort("basePackCode")}
          >
            <span className="inline-flex items-center gap-1">
              basePack Code
              <SortIndicator
                colId="basePackCode"
                sortCol={sortCol}
                sortDir={sortDir}
              />
            </span>
          </th>
          <th
            rowSpan={2}
            className="border px-2 py-2 text-left font-semibold whitespace-nowrap cursor-pointer select-none"
            style={{
              ...stickyHead(W_SR + W_CODE, W_DESC, 0, 40),
              backgroundColor: NAVY,
              borderColor: "rgba(255,255,255,0.15)",
              color: "#fff",
              verticalAlign: "middle",
            }}
            onClick={() => onSort("basePackDescription")}
          >
            <span className="inline-flex items-center gap-1">
              basePack Description
              <SortIndicator
                colId="basePackDescription"
                sortCol={sortCol}
                sortDir={sortDir}
              />
            </span>
          </th>
          <th
            rowSpan={2}
            className="border px-2 py-2 text-center font-semibold whitespace-nowrap cursor-pointer select-none"
            style={{
              ...stickyHead(W_SR + W_CODE + W_DESC, W_SMALL, 0, 40),
              backgroundColor: NAVY,
              borderColor: "rgba(255,255,255,0.15)",
              color: "#fff",
              verticalAlign: "middle",
            }}
            onClick={() => onSort("smallC")}
          >
            <span className="inline-flex items-center gap-1 justify-center">
              smallC
              <SortIndicator colId="smallC" sortCol={sortCol} sortDir={sortDir} />
            </span>
          </th>
          <th
            rowSpan={2}
            className="border px-2 py-2 text-center font-semibold whitespace-nowrap cursor-pointer select-none"
            style={{
              ...stickyHead(
                W_SR + W_CODE + W_DESC + W_SMALL,
                W_BG,
                0,
                40,
              ),
              backgroundColor: NAVY,
              borderColor: "rgba(255,255,255,0.15)",
              color: "#fff",
              verticalAlign: "middle",
            }}
            onClick={() => onSort("bg")}
          >
            <span className="inline-flex items-center gap-1 justify-center">
              BG
              <SortIndicator colId="bg" sortCol={sortCol} sortDir={sortDir} />
            </span>
          </th>
          <th
            rowSpan={2}
            className="border px-2 py-2 text-left font-semibold whitespace-nowrap cursor-pointer select-none"
            style={{
              ...stickyHead(
                W_SR + W_CODE + W_DESC + W_SMALL + W_BG,
                W_FORMAT,
                0,
                40,
              ),
              backgroundColor: NAVY,
              borderColor: "rgba(255,255,255,0.15)",
              color: "#fff",
              verticalAlign: "middle",
            }}
            onClick={() => onSort("format")}
          >
            <span className="inline-flex items-center gap-1">
              Format
              <SortIndicator
                colId="format"
                sortCol={sortCol}
                sortDir={sortDir}
              />
            </span>
          </th>
          <th
            colSpan={4}
            className="border px-2 py-2 text-center font-semibold text-xs"
            style={{
              backgroundColor: YELLOW_HDR,
              borderColor: "#b8b8b8",
              color: "#111827",
              position: "sticky",
              top: 0,
              zIndex: 12,
            }}
          >
            FG Stock across all locations (EA)
          </th>
          <th
            colSpan={5}
            className="border px-2 py-2 text-center font-semibold text-xs"
            style={{
              backgroundColor: YELLOW_HDR,
              borderColor: "#b8b8b8",
              color: "#111827",
              position: "sticky",
              top: 0,
              zIndex: 12,
            }}
          >
            FG equivalent RMPM stock (Max)
          </th>
          <th
            colSpan={3}
            className="border px-2 py-2 text-center font-semibold text-xs"
            style={{
              backgroundColor: YELLOW_HDR,
              borderColor: "#b8b8b8",
              color: "#111827",
              position: "sticky",
              top: 0,
              zIndex: 12,
            }}
          >
            Demand
          </th>
          <th
            colSpan={1}
            className="border px-2 py-2 text-center font-semibold text-xs"
            style={{
              backgroundColor: YELLOW_HDR,
              borderColor: "#b8b8b8",
              color: "#111827",
              position: "sticky",
              top: 0,
              zIndex: 12,
            }}
          >
            Total FG
          </th>
          <th
            colSpan={3}
            className="border px-2 py-2 text-center font-semibold text-xs"
            style={{
              backgroundColor: COVER_HDR,
              borderColor: "#b8b8b8",
              color: "#111827",
              position: "sticky",
              top: 0,
              zIndex: 12,
            }}
          >
            Cover (Production End Date)
          </th>
        </tr>

        {/* Level 2 — sub-headers */}
        <tr style={{ height: 34 }}>
          {sortTh("fgStock", "FG Stock", W_NUM, YELLOW_SUB, "#111827")}
          {sortTh(
            "fgIntransitPlantDc",
            "FG In-transit (Plant to DC)",
            W_NUM + 28,
            YELLOW_SUB,
            "#111827",
          )}
          {sortTh(
            "fgIntransitDcDc",
            "FG In-transit (DC to DC)",
            W_NUM + 20,
            YELLOW_SUB,
            "#111827",
          )}
          {sortTh("fgAllStock", "All Stock", W_NUM, YELLOW_SUB, "#111827")}
          {sortTh(
            "fgEqPmStock",
            "FG equivalent PM stock",
            W_NUM + 16,
            YELLOW_SUB,
            "#111827",
          )}
          {sortTh(
            "fgEqRmStock",
            "FG equivalent RM stock",
            W_NUM + 16,
            YELLOW_SUB,
            "#111827",
          )}
          {sortTh(
            "fgEqIutStock",
            "FG equivalent IUT stock",
            W_NUM + 16,
            YELLOW_SUB,
            "#111827",
          )}
          {sortTh(
            "fgEqStock",
            "FG equivalent stock",
            W_NUM + 12,
            YELLOW_SUB,
            "#111827",
          )}
          {sortTh(
            "fgEqStockMax",
            "FG equivalent stock (Max)",
            W_NUM + 20,
            YELLOW_SUB,
            "#111827",
          )}
          {sortTh("forecast", "Forecast", W_NUM, YELLOW_SUB, "#111827")}
          {sortTh(
            "netForecast",
            "Net Forecast",
            W_NUM,
            YELLOW_SUB,
            "#111827",
          )}
          {sortTh(
            "totalForecast",
            "Total Forecast",
            W_NUM,
            YELLOW_SUB,
            "#111827",
          )}
          {sortTh(
            "fgEquiIutTotal",
            "FG + Equi FG + IUTs",
            W_NUM + 20,
            YELLOW_SUB,
            "#111827",
          )}
          {sortTh(
            "coverFgStock",
            "FG Stock",
            W_COVER,
            COVER_SUB,
            NAVY,
            "center",
          )}
          {sortTh(
            "coverFgEqui",
            "FG + Equi",
            W_COVER,
            COVER_SUB,
            NAVY,
            "center",
          )}
          {sortTh(
            "coverFgEquiIut",
            "FG + Equi + IUT (Production End Date)",
            W_COVER + 40,
            COVER_SUB,
            NAVY,
            "center",
          )}
        </tr>
      </thead>

      <tbody>
        {rows.map((row, idx) => {
          const bg = idx % 2 === 0 ? "#ffffff" : "#f9fafb";
          const highlightNet = row.netForecast < 0;
          const highlightMax = row.fgEqStockMax > 0 && highlightNet;

          return (
            <Fragment key={row.srNo}>
              <tr
                style={{ backgroundColor: bg }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "#EDF5F4";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = bg;
                }}
              >
                <td
                  className="border px-2 py-1 text-center text-xs"
                  style={{
                    ...stickyBody(0, W_SR, bg),
                    borderColor: "#c8d8e8",
                    color: "#1565C0",
                    fontWeight: 600,
                  }}
                >
                  {row.srNo}
                </td>
                <td
                  className="border px-2 py-1 text-center font-mono text-xs"
                  style={{
                    ...stickyBody(W_SR, W_CODE, bg),
                    borderColor: "#c8d8e8",
                    color: "#1565C0",
                    fontWeight: 600,
                  }}
                >
                  {row.basePackCode}
                </td>
                <td
                  className="border px-2 py-1 text-xs"
                  style={{
                    ...stickyBody(W_SR + W_CODE, W_DESC, bg),
                    borderColor: "#c8d8e8",
                    maxWidth: W_DESC,
                  }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="truncate hover:underline cursor-pointer flex-1 min-w-0"
                      style={{ color: "#374151" }}
                      title={row.basePackDescription}
                      onClick={() =>
                        navigate({ page: "sci-detail", srNo: row.srNo })
                      }
                    >
                      {row.basePackDescription}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        navigate({ page: "cbu-detail", srNo: row.srNo })
                      }
                      title="View CBU Detail"
                      className="shrink-0 p-1 rounded transition-colors"
                      style={{ color: "#00695C" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "#e0f2f1";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "transparent";
                      }}
                    >
                      <FlaskConical size={13} />
                    </button>
                  </div>
                </td>
                <td
                  className="border px-2 py-1 text-center text-xs"
                  style={{
                    ...stickyBody(W_SR + W_CODE + W_DESC, W_SMALL, bg),
                    borderColor: "#c8d8e8",
                    color: "#374151",
                  }}
                >
                  {row.smallC}
                </td>
                <td
                  className="border px-2 py-1 text-center text-xs"
                  style={{
                    ...stickyBody(
                      W_SR + W_CODE + W_DESC + W_SMALL,
                      W_BG,
                      bg,
                    ),
                    borderColor: "#c8d8e8",
                    color: "#374151",
                  }}
                >
                  {row.bg}
                </td>
                <td
                  className="border px-2 py-1 text-xs"
                  style={{
                    ...stickyBody(
                      W_SR + W_CODE + W_DESC + W_SMALL + W_BG,
                      W_FORMAT,
                      bg,
                    ),
                    borderColor: "#c8d8e8",
                    color: "#374151",
                  }}
                >
                  {row.format}
                </td>
                {numCell(row.fgStock)}
                {numCell(row.fgIntransitPlantDc)}
                {numCell(row.fgIntransitDcDc)}
                {numCell(row.fgAllStock)}
                {numCell(row.fgEqPmStock)}
                {numCell(row.fgEqRmStock)}
                {numCell(row.fgEqIutStock)}
                {numCell(row.fgEqStock)}
                {numCell(row.fgEqStockMax, highlightMax)}
                {numCell(row.forecast)}
                {numCell(row.netForecast, highlightNet)}
                {numCell(row.totalForecast)}
                {numCell(row.fgEquiIutTotal)}
                {coverCell(row.coverFgStock)}
                {coverCell(row.coverFgEqui)}
                {coverCell(row.coverFgEquiIut)}
              </tr>
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
