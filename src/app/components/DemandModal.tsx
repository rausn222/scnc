import { useState } from "react";
import { motion } from "motion/react";
import { X, AlertTriangle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import { demandMonths, TODAY } from "./data";
import { FilterToggle } from "./FilterDropdown";
import { Loader } from "./Loader";
import { useDemandQuery } from "../queries/cbuQueries";
import { tdpCodeForDate } from "./tdpCalendar";
import {
  DEMAND_LOADING_TEXT,
  DEMAND_EMPTY_TEXT,
  DEMAND_ERROR_TEXT,
} from "../constants/nationalDashboard";

interface Props {
  cbuCode: string;
  cbuDescription: string;
  period: "3tdp" | "6m" | "12m";
  onClose: () => void;
}

type ViewMode = "bookMonth" | "moc";

const PERIOD_MONTHS: Record<Props["period"], number> = { "3tdp": 3, "6m": 6, "12m": 12 };
const PERIOD_LABEL:  Record<Props["period"], string>  = {
  "3tdp": "NEXT 3 TDP",
  "6m":   "NEXT 6 MONTHS",
  "12m":  "NEXT 12 MONTHS",
};

function fmtK(n: number) {
  if (n >= 10_00_000) return `${(n / 10_00_000).toFixed(2)}M`;
  if (n >= 1_000)     return n.toLocaleString("en-IN");
  return String(n);
}

function monthLabel(key: string) {
  const [year, mon] = key.split("-");
  const d = new Date(Number(year), Number(mon) - 1, 1);
  return d.toLocaleString("en", { month: "short" }) + " " + String(year).slice(2);
}

function daysInMonth(year: number, monthIndex0: number) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

/**
 * TDP-level (daily) forecast — each Book Month total is evenly apportioned across
 * its calendar days. This is the granular base both the Book Month and MOC views
 * roll up from, so a MOC period spanning two Book Months (21st cutover) aggregates
 * exactly rather than by re-splitting already-rounded monthly figures.
 */
function buildDailyForecast(monthly: Record<string, number>) {
  const days: { date: Date; value: number }[] = [];
  for (const [key, total] of Object.entries(monthly)) {
    const [yearStr, monStr] = key.split("-");
    const year = Number(yearStr);
    const monthIndex0 = Number(monStr) - 1;
    const count = daysInMonth(year, monthIndex0);
    const rate = total / count;
    for (let d = 1; d <= count; d++) {
      days.push({ date: new Date(year, monthIndex0, d), value: rate });
    }
  }
  return days;
}

/** MOC periods run 21st–20th, named for the month they end in (MOC 6 ends 20-Jun). */
function mocKeyForDate(date: Date) {
  let endYear = date.getFullYear();
  let endMonth0 = date.getMonth();
  if (date.getDate() > 20) {
    endMonth0 += 1;
    if (endMonth0 > 11) {
      endMonth0 = 0;
      endYear += 1;
    }
  }
  return {
    key: `${endYear}-${String(endMonth0 + 1).padStart(2, "0")}`,
    number: endMonth0 + 1,
  };
}

function bookMonthKeyForDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function aggregateDays(
  days: { date: Date; value: number }[],
  keyFor: (date: Date) => string,
) {
  const totals = new Map<string, number>();
  for (const { date, value } of days) {
    const key = keyFor(date);
    totals.set(key, (totals.get(key) ?? 0) + value);
  }
  return Array.from(totals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ key, value: Math.round(value) }));
}

export function DemandModal({ cbuCode, cbuDescription, period, onClose }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("bookMonth");
  const { data: row, isLoading, isError } = useDemandQuery(cbuCode);
  const monthCount = PERIOD_MONTHS[period];

  const currentBookMonthKey = bookMonthKeyForDate(TODAY);
  const currentMocKey = mocKeyForDate(TODAY).key;
  const isTdpPeriod = period === "3tdp";

  let chartData: { key: string; month: string; demand: number }[];
  let currentPeriodKey: string;
  let unitLabel: string;
  let unitLabelPlural: string;

  if (isTdpPeriod) {
    const dailyForecast = row ? buildDailyForecast(row.monthly) : [];
    const allTdpTotals = aggregateDays(dailyForecast, tdpCodeForDate);
    const currentTdpKey = tdpCodeForDate(TODAY);
    const currentIndex = Math.max(0, allTdpTotals.findIndex(({ key }) => key === currentTdpKey));
    const startIndex = currentIndex + 1;
    const tdpTotals = allTdpTotals.slice(startIndex, startIndex + monthCount);
    chartData = tdpTotals.map(({ key, value }) => ({
      key,
      month: key.slice(4),
      demand: value,
    }));
    currentPeriodKey = currentTdpKey;
    unitLabel = "TDP";
    unitLabelPlural = "TDPs";
  } else if (viewMode === "bookMonth") {
    const startIndex = Math.max(0, demandMonths.indexOf(currentBookMonthKey));
    const slicedKeys = demandMonths.slice(startIndex, startIndex + monthCount);
    chartData = slicedKeys.map(m => ({
      key:    m,
      month:  monthLabel(m),
      demand: row?.monthly[m] ?? 0,
    }));
    currentPeriodKey = currentBookMonthKey;
    unitLabel = "Month";
    unitLabelPlural = "months";
  } else {
    const dailyForecast = row ? buildDailyForecast(row.monthly) : [];
    const allMocTotals = aggregateDays(dailyForecast, d => mocKeyForDate(d).key);
    const startIndex = Math.max(0, allMocTotals.findIndex(({ key }) => key === currentMocKey));
    const mocTotals = allMocTotals.slice(startIndex, startIndex + monthCount);
    chartData = mocTotals.map(({ key, value }) => ({
      key,
      month: `MOC ${Number(key.split("-")[1])}`,
      demand: value,
    }));
    currentPeriodKey = currentMocKey;
    unitLabel = "MOC";
    unitLabelPlural = "MOCs";
  }

  const totalDemand  = chartData.reduce((s, d) => s + d.demand, 0);
  const maxDemand    = Math.max(...chartData.map(d => d.demand), 0);
  const peakEntry    = chartData.find(d => d.demand === maxDemand);
  const activePeriods = chartData.filter(d => d.demand > 0).length;
  const avgPerActive = activePeriods > 0 ? Math.round(totalDemand / activePeriods) : 0;

  const kpis = [
    { label: "TOTAL DEMAND",              value: fmtK(totalDemand),                sub: `all ${unitLabelPlural}` },
    { label: `PEAK ${unitLabel.toUpperCase()}`, value: peakEntry ? peakEntry.month : "—", sub: maxDemand > 0 ? fmtK(maxDemand) : "—" },
    { label: `AVG / ${unitLabel.toUpperCase()}`, value: fmtK(avgPerActive),          sub: `across active ${unitLabelPlural}` },
    ...(isTdpPeriod
      ? []
      : [{ label: `ACTIVE ${unitLabelPlural.toUpperCase()}`, value: String(activePeriods), sub: `of ${monthCount} ${unitLabelPlural}` }]),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,48,135,0.18)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col overflow-hidden"
        style={{
          width: "min(92vw, 780px)",
          maxHeight: "88vh",
          backgroundColor: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 60px rgba(0,48,135,0.18), 0 4px 16px rgba(0,0,0,0.08)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-6 pt-5 pb-4 shrink-0"
          style={{ background: "linear-gradient(135deg, #003087 0%, #1565C0 100%)" }}>

          {/* Period label */}
          <p className="text-xs font-bold tracking-widest mb-2"
            style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
            {PERIOD_LABEL[period]} · DEMAND BREAKDOWN
          </p>

          {/* CBU info + close */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold text-white" style={{ fontSize: 22 }}>
                {cbuCode}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                {cbuDescription}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-full transition-colors shrink-0 mt-0.5 cursor-pointer"
              style={{ color: "rgba(255,255,255,0.55)" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.15)";
                (e.currentTarget as HTMLElement).style.color = "#ffffff";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)";
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── KPI Strip ── */}
        <div className="grid shrink-0"
          style={{ gridTemplateColumns: `repeat(${kpis.length}, 1fr)`, backgroundColor: "#EFF4FB", borderBottom: "1px solid #e2e8f0" }}>
          {kpis.map((k, i) => (
            <div key={k.label} className="px-5 py-4"
              style={{ borderLeft: i > 0 ? "1px solid #e2e8f0" : undefined }}>
              <p className="uppercase mb-1"
                style={{ color: "#1565C0", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.08em" }}>
                {k.label}
              </p>
              <p style={{ fontSize: 22, color: "#003087", fontWeight: 700, lineHeight: 1.2 }}>
                {k.value}
              </p>
              <p className="mt-1" style={{ color: "#94a3b8", fontSize: 11 }}>
                {k.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Chart ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 bg-white">
          <div className="flex items-start justify-between gap-3 mb-4">
            <p className="text-xs font-bold tracking-widest"
              style={{ color: "#1565C0", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
              {unitLabel.toUpperCase()} VOLUME (EA)
            </p>
            {!isTdpPeriod && (
              <FilterToggle
                label="View"
                value={viewMode}
                onChange={v => setViewMode(v as ViewMode)}
                activeColor="#1565C0"
                maxWidth={190}
                options={[
                  { value: "bookMonth", label: "Book Month" },
                  { value: "moc", label: "MOC" },
                ]}
              />
            )}
          </div>

          {isError ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <AlertTriangle size={20} style={{ color: "#dc2626" }} />
              <p className="text-sm italic" style={{ color: "#94a3b8" }}>{DEMAND_ERROR_TEXT}</p>
            </div>
          ) : isLoading ? (
            <div className="h-40">
              <Loader label={DEMAND_LOADING_TEXT} />
            </div>
          ) : totalDemand === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm italic" style={{ color: "#94a3b8" }}>{DEMAND_EMPTY_TEXT}</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 20, right: 8, bottom: 4, left: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}
                    tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(21,101,192,0.06)" }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: "#003087", fontWeight: 600, marginBottom: 4 }}
                    itemStyle={{ color: "#334155" }}
                    formatter={(v: number) => [v > 0 ? v.toLocaleString("en-IN") : "No data", "Demand (EA)"]}
                  />
                  <Bar dataKey="demand" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.demand === 0
                            ? "#f1f5f9"
                            : entry.demand === maxDemand
                              ? "#003087"
                              : "#1565C0"
                        }
                        stroke={entry.key === currentPeriodKey ? "#38BDF8" : undefined}
                        strokeWidth={entry.key === currentPeriodKey ? 2 : undefined}
                      />
                    ))}
                    <LabelList
                      dataKey="demand"
                      position="top"
                      offset={6}
                      formatter={(v: number) => (v > 0 ? fmtK(v) : "")}
                      style={{
                        fontSize: 9,
                        fontFamily: "'JetBrains Mono', monospace",
                        fill: "#1e293b",
                        stroke: "none",
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex items-center justify-end gap-5 mt-3">
                {[
                  { color: "#1565C0", label: "Demand", border: undefined },
                  { color: "#003087", label: "Peak", border: undefined },
                  { color: "#e2e8f0", label: "No data", border: undefined },
                  ...(isTdpPeriod
                    ? []
                    : [{ color: "#1565C0", label: `Current ${unitLabel}`, border: "2px solid #38BDF8" }]),
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.color, border: l.border }} />
                    <span style={{ color: "#64748b", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                      {l.label}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
