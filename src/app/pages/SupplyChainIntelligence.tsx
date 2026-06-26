import { useState } from "react";
import {
  Brain, Sparkles, BarChart2, Globe, AlertCircle,
  ChevronRight, CheckCircle2, Database, TrendingUp,
  Package, Calendar, ArrowRight, Star, Zap,
} from "lucide-react";

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  navy:     "#003087",
  blue:     "#1565C0",
  teal:     "#00695C",
  bright:   "#0277BD",
  bgBlue:   "#EFF4FB",
  bgTeal:   "#EDF5F4",
  bgNeutral:"#EDF1F7",
};

const scenarios = [
  {
    id: "no-action",
    icon: <Package size={17} />,
    title: "No Action (Stock only)",
    desc: "What can I produce from on-hand stock alone?",
    date: "24 Jul 2026",
    status: "baseline",
    accent: C.blue,
    bg: C.bgBlue,
  },
  {
    id: "open-pos",
    icon: <Database size={17} />,
    title: "Stock + Open POs",
    desc: "What if I also count open purchase orders?",
    date: "24 Jul 2026",
    status: "comparison",
    accent: C.bright,
    bg: C.bgBlue,
  },
  {
    id: "full-plan",
    icon: <TrendingUp size={17} />,
    title: "Full Plan Fulfilment",
    desc: "What if I run the entire planned volume?",
    date: "24 Jul 2026",
    status: "recommended",
    accent: C.teal,
    bg: C.bgTeal,
  },
  {
    id: "moq-topup",
    icon: <Sparkles size={17} />,
    title: "MOQ Top-up",
    desc: "What if we order one MOQ of each constraining component?",
    date: "24 Jul 2026",
    status: "comparison",
    accent: C.navy,
    bg: C.bgNeutral,
  },
  {
    id: "iut-transfer",
    icon: <Globe size={17} />,
    title: "IUT Transfer",
    desc: "What if we transfer components between plants per IUT rules?",
    date: "24 Jul 2026",
    status: "comparison",
    accent: C.teal,
    bg: C.bgTeal,
  },
  {
    id: "custom-stop",
    icon: <Calendar size={17} />,
    title: "Custom Stop Date",
    desc: "Let me pick a specific production stop date.",
    date: "15-06-2026",
    status: "comparison",
    accent: C.blue,
    bg: C.bgBlue,
  },
];

const comparison = [
  {
    title: "Stock + Open POs",
    icon: <Database size={13} />,
    accent: C.bright,
    tag: "Shortfall",
    tagBg: "#fff3cd",
    tagText: "#856404",
    feasible: "1,93,634",
    plan: "82.3%",
    planColor: "#856404",
    bg: C.bgBlue,
  },
  {
    title: "Full Plan Fulfilment",
    icon: <TrendingUp size={13} />,
    accent: C.teal,
    tag: "Recommended",
    tagBg: C.bgTeal,
    tagText: C.teal,
    feasible: "2,35,294",
    plan: "100.0%",
    planColor: C.teal,
    bg: C.bgTeal,
  },
  {
    title: "MOQ Top-up",
    icon: <Sparkles size={13} />,
    accent: C.navy,
    tag: "Shortfall",
    tagBg: "#fff3cd",
    tagText: "#856404",
    feasible: "1,93,634",
    plan: "82.3%",
    planColor: "#856404",
    bg: C.bgNeutral,
  },
];

const modules = [
  {
    icon: <BarChart2 size={20} />,
    title: "Demand Sensing",
    desc: "AI-driven short-term demand signal aggregation from POS, distributor, and market data.",
    tag: "Coming Soon",
    accent: C.blue,
    bg: C.bgBlue,
    tagBg: C.bgNeutral,
    tagColor: C.navy,
  },
  {
    icon: <Globe size={20} />,
    title: "Network Optimiser",
    desc: "Multi-echelon inventory positioning with dynamic safety stock recommendations.",
    tag: "Coming Soon",
    accent: C.bright,
    bg: "#e8f4fd",
    tagBg: C.bgNeutral,
    tagColor: C.navy,
  },
  {
    icon: <AlertCircle size={20} />,
    title: "Risk Intelligence",
    desc: "Supplier risk scoring, lead time variance monitoring, and alternate sourcing signals.",
    tag: "Coming Soon",
    accent: C.teal,
    bg: C.bgTeal,
    tagBg: C.bgNeutral,
    tagColor: C.navy,
  },
  {
    icon: <Sparkles size={20} />,
    title: "Planning Co-Pilot",
    desc: "Natural language query interface for ad-hoc supply chain analysis and scenario planning.",
    tag: "Beta",
    accent: C.navy,
    bg: C.bgNeutral,
    tagBg: C.bgTeal,
    tagColor: C.teal,
  },
];

export default function SupplyChainIntelligence() {
  const [activeTab, setActiveTab] = useState<"planner" | "modules">("planner");
  const [selected, setSelected] = useState(5);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: C.bgBlue }}>

      {/* ── Top bar ── */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-white"
        style={{ borderBottom: `1px solid ${C.bgNeutral}` }}>
        <div className="flex items-center gap-2 text-xs">
          <span style={{ color: "#94a3b8" }}>Supply Chain Intelligence</span>
          <ChevronRight size={12} style={{ color: "#cbd5e1" }} />
          <span style={{ color: "#94a3b8" }}>FG Delisting Optimizer</span>
          <ChevronRight size={12} style={{ color: "#cbd5e1" }} />
          <span style={{ color: C.navy, fontWeight: 600 }}>Planner Studio</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: C.bgBlue, color: C.blue, border: `1px solid ${C.blue}20` }}>
            AI Agent Active
          </span>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: C.navy }}>
            DA
          </div>
        </div>
      </div>

      {/* ── Sub-header ── */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-white"
        style={{ borderBottom: `1px solid ${C.bgNeutral}` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: C.bgBlue }}>
            <Brain size={17} style={{ color: C.navy }} />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: C.navy }}>FG Delisting Optimizer</p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>CBU-level simulation & scenario planning</p>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: C.bgNeutral }}>
          <TabBtn active={activeTab === "planner"} onClick={() => setActiveTab("planner")}>Planner Studio</TabBtn>
          <TabBtn active={activeTab === "modules"} onClick={() => setActiveTab("modules")}>AI Modules</TabBtn>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {activeTab === "planner" && (
          <>
            {/* Planner header card */}
            <div className="bg-white rounded-xl px-5 py-4" style={{ border: `1px solid ${C.bgNeutral}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm" style={{ color: C.navy }}>Planner Studio</p>
                  <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                    Select a scenario to explore · Select multiple to compare · Get an instant recommendation
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold" style={{ color: "#64748b" }}>{selected} selected</span>
                  <button className="text-xs font-semibold" style={{ color: C.blue }}
                    onClick={() => setSelected(0)}>Clear all</button>
                </div>
              </div>
            </div>

            {/* AI prompt bubble */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white"
                style={{ backgroundColor: C.navy }}>
                <Brain size={14} />
              </div>
              <div className="flex-1 rounded-xl px-4 py-3 text-sm font-medium italic"
                style={{ backgroundColor: C.bgNeutral, border: `1px solid ${C.bgBlue}`, color: C.navy }}>
                "Which delisting strategy gives the best outcome for this CBU?"
              </div>
            </div>

            {/* Scenario cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {scenarios.map(s => <ScenarioCard key={s.id} scenario={s} />)}
            </div>

            {/* Open PO assumptions */}
            <div className="bg-white rounded-xl p-5" style={{ border: `1px solid ${C.bgNeutral}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Database size={15} style={{ color: C.blue }} />
                  <span className="font-semibold text-sm" style={{ color: C.navy }}>Open PO assumptions</span>
                  <span className="text-xs" style={{ color: "#94a3b8" }}>1 PO line — 1,500 units total</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "#64748b" }}>Open POs can be cancelled</span>
                  <div className="w-10 h-5 rounded-full flex items-center px-0.5 cursor-pointer"
                    style={{ backgroundColor: C.teal }}>
                    <div className="w-4 h-4 rounded-full bg-white ml-auto" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: "#64748b" }}>
                  1 of 1 included — <span style={{ color: C.navy, fontWeight: 600 }}>1,500 units</span> active
                </span>
                <div className="flex gap-3 text-xs font-semibold">
                  <button style={{ color: C.blue }}>Include all</button>
                  <button style={{ color: "#64748b" }}>Exclude all</button>
                </div>
              </div>

              <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.bgNeutral}` }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ backgroundColor: C.navy }} className="text-white">
                      {["Include", "Plant", "Component", "Open PO qty", "UOM", "Status"].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ backgroundColor: C.bgBlue }}>
                      <td className="px-3 py-2.5">
                        <div className="w-4 h-4 rounded flex items-center justify-center"
                          style={{ backgroundColor: C.teal }}>
                          <CheckCircle2 size={11} className="text-white" />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-medium" style={{ color: C.navy }}>U535</td>
                      <td className="px-3 py-2.5 font-mono font-semibold" style={{ color: C.blue }}>65284824</td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: C.navy }}>1,500</td>
                      <td className="px-3 py-2.5" style={{ color: "#64748b" }}>EA</td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: C.bgTeal, color: C.teal }}>
                          Included
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Scenario comparison */}
            <div className="bg-white rounded-xl p-5" style={{ border: `1px solid ${C.bgNeutral}` }}>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={14} style={{ color: C.blue }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.navy }}>
                  Scenario Comparison
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {comparison.map((c, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ backgroundColor: c.bg, border: `1px solid ${C.bgNeutral}` }}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span style={{ color: c.accent }}>{c.icon}</span>
                      <span className="font-semibold text-xs truncate" style={{ color: C.navy }}>{c.title}</span>
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold mb-3"
                      style={{ backgroundColor: c.tagBg, color: c.tagText }}>
                      {c.tag}
                    </span>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs mb-0.5" style={{ color: "#94a3b8" }}>Feasible produced</p>
                        <p className="font-bold text-sm" style={{ color: C.navy }}>{c.feasible}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs mb-0.5" style={{ color: "#94a3b8" }}>Plan fulfilment</p>
                        <p className="font-bold text-lg" style={{ color: c.planColor }}>{c.plan}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "modules" && (
          <>
            {/* Hero */}
            <div className="rounded-xl p-6 flex items-center gap-5"
              style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.blue} 100%)` }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                <Brain size={28} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-base text-white">Intelligence Hub</h2>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Advanced analytics and AI capabilities to transform your supply chain planning from reactive to predictive.
                </p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shrink-0"
                style={{ backgroundColor: C.teal, color: "#fff" }}>
                Explore <ArrowRight size={13} />
              </button>
            </div>

            {/* Module cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {modules.map((m, i) => (
                <div key={i} className="bg-white rounded-xl p-5 cursor-pointer transition-all"
                  style={{ border: `1px solid ${C.bgNeutral}` }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.blue + "60"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.bgNeutral}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: m.bg, color: m.accent }}>
                      {m.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-sm" style={{ color: C.navy }}>{m.title}</h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: m.tagBg, color: m.tagColor }}>
                          {m.tag}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{m.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{ backgroundColor: active ? C.navy : "transparent", color: active ? "#fff" : "#64748b" }}>
      {children}
    </button>
  );
}

function ScenarioCard({ scenario: s }: { scenario: typeof scenarios[0] }) {
  return (
    <div className="rounded-xl p-4 relative cursor-pointer transition-all hover:shadow-sm"
      style={{ backgroundColor: s.bg, border: `1.5px solid ${s.accent}25` }}>

      {s.status === "recommended" && (
        <div className="absolute top-3 right-3">
          <Star size={13} fill={C.teal} style={{ color: C.teal }} />
        </div>
      )}
      {s.status === "comparison" && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: s.accent }}>
          <CheckCircle2 size={11} className="text-white" />
        </div>
      )}

      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
        style={{ backgroundColor: "white", color: s.accent,
          boxShadow: `0 1px 4px ${s.accent}20` }}>
        {s.icon}
      </div>

      <p className="font-semibold text-xs mb-1" style={{ color: C.navy }}>{s.title}</p>
      <p className="text-xs leading-snug mb-3" style={{ color: "#64748b" }}>{s.desc}</p>

      <div className="flex items-center gap-1.5 text-xs mb-2">
        <Calendar size={10} style={{ color: s.accent }} />
        <span style={{ color: s.accent, fontWeight: 600 }}>{s.date}</span>
      </div>

      {s.status !== "baseline" && (
        <div className="flex items-center gap-1 text-xs font-semibold"
          style={{ color: C.teal }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.teal }} />
          In comparison
        </div>
      )}
    </div>
  );
}
