import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BORDER = "#e2e8f0";
const WASTE_COLOR = "#1565C0";
const SAVINGS_COLOR = "#15803d";

export interface BusinessWasteSavingsDatum {
  networkId: string;
  projectName: string;
  businessWaste: number;
  savings: number;
}

function formatValue(n: number): string {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}k`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[11px]" style={{ color: "#374151" }}>
        {label}
      </span>
    </div>
  );
}

// Custom two-line X-axis tick: project name on top, network ID below —
// mirrors the vendor-name / vendor-ID stacked tick style of the reference chart.
function AxisTick({
  x,
  y,
  payload,
  data,
  onNetworkClick,
}: {
  x: number;
  y: number;
  payload: { value: string; index: number };
  data: BusinessWasteSavingsDatum[];
  onNetworkClick?: (networkId: string) => void;
}) {
  const datum = data[payload.index];
  if (!datum) return null;
  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={onNetworkClick ? () => onNetworkClick(datum.networkId) : undefined}
      style={onNetworkClick ? { cursor: "pointer" } : undefined}
    >
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="middle"
        fontSize={9}
        fill="#6b7280"
        fontFamily="'JetBrains Mono', monospace"
      >
        {truncate(datum.projectName, 14)}
      </text>
      <text
        x={0}
        y={0}
        dy={25}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fill="#003087"
        fontFamily="'JetBrains Mono', monospace"
      >
        {datum.networkId}
      </text>
    </g>
  );
}

interface BusinessWasteSavingsChartProps {
  data: BusinessWasteSavingsDatum[];
  title?: string;
  subtitle?: string;
  onNetworkClick?: (networkId: string) => void;
}

export function BusinessWasteSavingsChart({
  data,
  title = "Business waste and savings",
  subtitle = "Top 10 networks by business waste",
  onNetworkClick,
}: BusinessWasteSavingsChartProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="rounded-lg shrink-0 flex flex-col overflow-hidden"
      style={{ backgroundColor: "#ffffff", border: `1px solid ${BORDER}` }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
        style={{ borderBottom: collapsed ? "none" : `1px solid ${BORDER}` }}
      >
        <div>
          <h3 className="text-sm font-bold" style={{ color: "#003087" }}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!collapsed && (
            <>
              <LegendDot color={WASTE_COLOR} label="Business Waste" />
              <LegendDot color={SAVINGS_COLOR} label="Savings" />
            </>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand chart" : "Collapse chart"}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-colors cursor-pointer shrink-0"
            style={{ color: "#1565C0" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#EDF5F4";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            }}
          >
            {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-4 py-4">
          {data.length === 0 ? (
            <div
              className="flex items-center justify-center py-12 text-sm"
              style={{ color: "#6b7280" }}
            >
              No business waste data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data}
                margin={{ top: 16, right: 12, bottom: 8, left: 0 }}
                barCategoryGap="24%"
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="networkId"
                  interval={0}
                  height={40}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                  tick={(props) => <AxisTick {...props} data={data} onNetworkClick={onNetworkClick} />}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}
                  tickFormatter={formatValue}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  cursor={{ fill: "rgba(21,101,192,0.06)" }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 11,
                    fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
                    padding: "8px 10px",
                  }}
                  labelStyle={{ color: "#003087", fontWeight: 600, marginBottom: 4, fontSize: 11 }}
                  itemStyle={{ color: "#334155", fontSize: 11, padding: 0 }}
                  formatter={(value: number, name: string) => [formatValue(value), name]}
                  labelFormatter={(label: string, payload) => {
                    const d = payload?.[0]?.payload as BusinessWasteSavingsDatum | undefined;
                    return d ? `${d.networkId} — ${d.projectName}` : label;
                  }}
                />
                <Bar
                  dataKey="businessWaste"
                  name="Business Waste"
                  fill={WASTE_COLOR}
                  radius={[4, 4, 0, 0]}
                  className={onNetworkClick ? "cursor-pointer" : undefined}
                  onClick={(bar) => onNetworkClick?.((bar as { payload?: BusinessWasteSavingsDatum })?.payload?.networkId ?? "")}
                />
                <Bar
                  dataKey="savings"
                  name="Savings"
                  fill={SAVINGS_COLOR}
                  radius={[4, 4, 0, 0]}
                  className={onNetworkClick ? "cursor-pointer" : undefined}
                  onClick={(bar) => onNetworkClick?.((bar as { payload?: BusinessWasteSavingsDatum })?.payload?.networkId ?? "")}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
