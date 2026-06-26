import { motion } from "motion/react";
import { X } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const WEEK_COUNT = 19;

interface Props {
  plantCode: string;
  cbuCode: string;
  cbuDescription: string;
  totalProduction: number;
  onClose: () => void;
}

function fmtK(n: number) {
  if (n >= 10_00_000) return `${(n / 10_00_000).toFixed(2)}M`;
  if (n >= 1_000) return n.toLocaleString("en-IN");
  return String(n);
}

function generateWeeklyProduction(total: number) {
  const weights = Array.from({ length: WEEK_COUNT }, (_, i) => {
    const seasonal = 0.85 + Math.sin((i / WEEK_COUNT) * Math.PI * 2) * 0.12;
    const ramp = 0.9 + (i / (WEEK_COUNT - 1)) * 0.2;
    return seasonal * ramp;
  });
  const weightSum = weights.reduce((sum, w) => sum + w, 0);

  const raw = weights.map((w) => Math.round((total * w) / weightSum));
  const diff = total - raw.reduce((sum, v) => sum + v, 0);
  if (diff !== 0) raw[raw.length - 1] += diff;

  return raw.map((production, i) => ({
    week: `W${i + 1}`,
    weekLabel: `Week ${i + 1}`,
    production,
  }));
}

export function ProductionPlanModal({
  plantCode,
  cbuCode,
  cbuDescription,
  totalProduction,
  onClose,
}: Props) {
  const chartData = generateWeeklyProduction(totalProduction);
  const maxProduction = Math.max(...chartData.map((d) => d.production), 0);
  const peakEntry = chartData.find((d) => d.production === maxProduction);
  const activeWeeks = chartData.filter((d) => d.production > 0).length;
  const avgPerWeek =
    activeWeeks > 0 ? Math.round(totalProduction / activeWeeks) : 0;

  const kpis = [
    {
      label: "TOTAL PRODUCTION",
      value: fmtK(totalProduction),
      sub: `${WEEK_COUNT} weeks`,
    },
    {
      label: "PEAK WEEK",
      value: peakEntry ? peakEntry.weekLabel : "—",
      sub: maxProduction > 0 ? fmtK(maxProduction) : "—",
    },
    {
      label: "AVG / WEEK",
      value: fmtK(avgPerWeek),
      sub: "across active weeks",
    },
    {
      label: "ACTIVE WEEKS",
      value: String(activeWeeks),
      sub: `of ${WEEK_COUNT} weeks`,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: "rgba(0,48,135,0.18)",
        backdropFilter: "blur(4px)",
      }}
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
          boxShadow:
            "0 20px 60px rgba(0,48,135,0.18), 0 4px 16px rgba(0,0,0,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 pt-5 pb-4 shrink-0"
          style={{
            background: "linear-gradient(135deg, #003087 0%, #1565C0 100%)",
          }}
        >
          <p
            className="text-xs font-bold tracking-widest mb-2"
            style={{
              color: "rgba(255,255,255,0.6)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
            }}
          >
            {WEEK_COUNT} WEEKS · PRODUCTION PLAN BREAKDOWN
          </p>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold text-white" style={{ fontSize: 22 }}>
                {plantCode} · {cbuCode}
              </h2>
              <p
                className="text-sm mt-0.5"
                style={{ color: "rgba(255,255,255,0.65)" }}
              >
                {cbuDescription}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-full transition-colors shrink-0 mt-0.5"
              style={{ color: "rgba(255,255,255,0.55)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  "rgba(255,255,255,0.15)";
                (e.currentTarget as HTMLElement).style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  "transparent";
                (e.currentTarget as HTMLElement).style.color =
                  "rgba(255,255,255,0.55)";
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div
          className="grid shrink-0"
          style={{
            gridTemplateColumns: "repeat(4, 1fr)",
            backgroundColor: "#EFF4FB",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          {kpis.map((k, i) => (
            <div
              key={k.label}
              className="px-5 py-4"
              style={{ borderLeft: i > 0 ? "1px solid #e2e8f0" : undefined }}
            >
              <p
                className="uppercase mb-1"
                style={{
                  color: "#1565C0",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.08em",
                }}
              >
                {k.label}
              </p>
              <p
                style={{
                  fontSize: 22,
                  color: "#003087",
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {k.value}
              </p>
              <p className="mt-1" style={{ color: "#94a3b8", fontSize: 11 }}>
                {k.sub}
              </p>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 bg-white">
          <p
            className="text-xs font-bold mb-4 tracking-widest"
            style={{
              color: "#1565C0",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
            }}
          >
            WEEKLY PRODUCTION (EA)
          </p>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
              barCategoryGap="30%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={{
                  fontSize: 10,
                  fill: "#64748b",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={48}
              />
              <YAxis
                tick={{
                  fontSize: 10,
                  fill: "#94a3b8",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                tickFormatter={(v) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(1)}M`
                    : v >= 1000
                      ? `${(v / 1000).toFixed(0)}k`
                      : String(v)
                }
                axisLine={false}
                tickLine={false}
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
                formatter={(v: number) => [
                  v > 0 ? v.toLocaleString("en-IN") : "No data",
                  "Production (EA)",
                ]}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.weekLabel ?? ""
                }
              />
              <Bar dataKey="production" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.production === 0
                        ? "#f1f5f9"
                        : entry.production === maxProduction
                          ? "#003087"
                          : "#1565C0"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="flex items-center justify-end gap-5 mt-3">
            {[
              { color: "#1565C0", label: "Production" },
              { color: "#003087", label: "Peak" },
              { color: "#e2e8f0", label: "No data" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: l.color }}
                />
                <span
                  style={{
                    color: "#64748b",
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {l.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
