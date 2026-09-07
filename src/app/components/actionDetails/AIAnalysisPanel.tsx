import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Bot, CheckCircle2, Loader2 } from "lucide-react";
import type { AcceptedScenarioDetails } from "../../App";
import { C } from "./theme";

const STEP_DURATION_MS = 1100;

export type AnalysisStep = { title: string; sub: string };

export function buildAnalysisSteps(scenario: AcceptedScenarioDetails): AnalysisStep[] {
  const fg = scenario.feasibleProducible;
  const componentEquiv = Math.round(fg * 19.4);
  const total = fg + componentEquiv;
  const transferEligible = Math.round(fg * 0.4);
  const remainingLocal = fg - transferEligible;

  return [
    {
      title: "Scanning on-hand stock positions",
      sub: `FG: ${fg.toLocaleString("en-IN")} units · Component equiv: ${componentEquiv.toLocaleString("en-IN")} units · Total: ${total.toLocaleString("en-IN")} units`,
    },
    {
      title: "Valid contract coverage",
      sub: "Open contracts checked across 3 suppliers · Coverage: 68% of demand · Next renewal: Sep 2026",
    },
    {
      title: "Identifying transfer eligibility",
      sub: `Lane availability: confirmed · Transfer-eligible: ${transferEligible.toLocaleString("en-IN")} units · Remaining local: ${remainingLocal.toLocaleString("en-IN")} units`,
    },
    {
      title: "Checking historical movement of same component",
      sub: `Avg daily movement: ${scenario.dailyRunRate.toLocaleString("en-IN")} units · Trend: stable · Last transfer: 14 Feb 2026`,
    },
    {
      title: "Estimating logistics",
      sub: "Route assessed · Freight est: ₹8,900 · Lead time: 18-22 days",
    },
    {
      title: "Generating action task list",
      sub: "6 tasks identified across 4 teams · 2 critical path items · Est. completion: 26 working days",
    },
  ];
}

export function AIAnalysisPanel({ steps, onComplete }: { steps: AnalysisStep[]; onComplete: () => void }) {
  const [completedCount, setCompletedCount] = useState(0);
  const isComplete = completedCount >= steps.length;

  useEffect(() => {
    if (completedCount >= steps.length) {
      if (completedCount === steps.length) onComplete();
      return;
    }
    const timer = setTimeout(() => setCompletedCount((c) => c + 1), STEP_DURATION_MS);
    return () => clearTimeout(timer);
  }, [completedCount, steps.length, onComplete]);

  return (
    <div className="rounded-xl bg-white overflow-hidden" style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}>
      <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid #e2e8f0" }}>
        <Bot size={16} style={{ color: "#7c3aed" }} />
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: C.navy }}>
          AI Analysis
        </span>
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
          style={
            isComplete
              ? { backgroundColor: "#dcfce7", color: "#166534" }
              : { backgroundColor: C.bgBlue, color: C.blue }
          }
        >
          {isComplete ? "Complete" : "Running"}
        </span>
      </div>
      <div className="p-5 space-y-2.5">
        {steps.map((step, i) => {
          if (i > completedCount) return null;
          const done = i < completedCount;
          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-lg px-4 py-3 flex items-start justify-between gap-3"
              style={
                done
                  ? { backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }
                  : { backgroundColor: C.bgBlue, border: "1px solid #93c5fd" }
              }
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {done ? (
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" style={{ color: "#16a34a" }} />
                ) : (
                  <Loader2 size={16} className="shrink-0 mt-0.5 animate-spin" style={{ color: C.blue }} />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold" style={{ color: done ? "#166534" : C.blue }}>
                    {step.title}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: done ? "#15803d" : "#3b6bb0" }}>
                    {step.sub}
                  </p>
                </div>
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-wide shrink-0"
                style={{ color: done ? "#166534" : C.blue }}
              >
                {done ? "Done" : "Running"}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
