import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, ClipboardList, Zap } from "lucide-react";
import type { AcceptedScenarioDetails } from "../../App";
import { C } from "./theme";
import { DeployDrawer } from "./DeployDrawer";

export type ActionTask = {
  title: string;
  sub: string;
  status: string;
  agent: string;
  team: string;
  teamColor: { bg: string; fg: string };
  duration: string;
};

export function buildActionTasks(scenario: AcceptedScenarioDetails): ActionTask[] {
  const plant = scenario.receivingPlant;

  return [
    {
      title: "Raise Intercompany Transfer Order in SAP",
      sub: "Create IC STO in SAP TM using movement type 641. Reference scenario INTERCO-VCBL190. Attach VLOOKUP-verified stock qty.",
      status: "Ready to Deploy",
      agent: "SAP Agent",
      team: "Supply Planning",
      teamColor: { bg: C.bgBlue, fg: C.blue },
      duration: "4 hrs",
    },
    {
      title: "Obtain IC Pricing Approval from Finance",
      sub: "Submit IC pricing sheet to Finance BP for sign-off. Use standard cost + 12% markup as per global IC policy. SLA: 48 hrs.",
      status: "Ready to Deploy",
      agent: "Finance Agent",
      team: "Finance",
      teamColor: { bg: "#ede9fe", fg: "#7c3aed" },
      duration: "48 hrs",
    },
    {
      title: "Book Transfer with Logistics Provider",
      sub: "Book inter-plant transfer via preferred 3PL. ETD within 5 days of IC order confirmation. Insure consignment at IC value.",
      status: "Ready to Deploy",
      agent: "Logistics Agent",
      team: "Logistics",
      teamColor: { bg: C.bgBlue, fg: C.blue },
      duration: "5 days",
    },
    {
      title: `Notify Plant ${plant} Supply Planner`,
      sub: `Share shipment ETA and product specs with Plant ${plant} planner. Confirm receiving warehouse readiness and storage conditions.`,
      status: "Ready to Deploy",
      agent: "Comms Agent",
      team: "Supply Planning",
      teamColor: { bg: C.bgBlue, fg: C.blue },
      duration: "1 day",
    },
    {
      title: "Update S&OP Demand Plan",
      sub: `Reduce local demand plan by 2,04,444 units. Add IC supply to Plant ${plant} demand bucket. Circulate revised consensus plan.`,
      status: "Ready to Deploy",
      agent: "Planning Agent",
      team: "Commercial Planning",
      teamColor: { bg: "#dcfce7", fg: "#166534" },
      duration: "2 days",
    },
  ];
}

export function ActionTaskList({ scenario }: Readonly<{ scenario: AcceptedScenarioDetails }>) {
  const [deployOpen, setDeployOpen] = useState(false);
  const tasks = useMemo(() => buildActionTasks(scenario), [scenario]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl bg-white overflow-hidden"
      style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}
    >
      <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid #e2e8f0" }}>
        <ClipboardList size={16} style={{ color: C.navy }} />
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: C.navy }}>
          Action Task List
        </span>
        <span className="text-[11px]" style={{ color: "#94a3b8" }}>
          {tasks.length} tasks · {tasks.length} agent-executable
        </span>
      </div>
      <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f8fafc" }}>
            <th className="text-left px-5 py-2 font-semibold" style={{ color: C.navy }}>Task</th>
            <th className="text-left px-3 py-2 font-semibold" style={{ color: C.navy }}>Status</th>
            <th className="text-left px-3 py-2 font-semibold" style={{ color: C.navy }}>Team Responsible</th>
            <th className="text-left px-3 py-2 font-semibold" style={{ color: C.navy }}>Duration</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, i) => (
            <tr key={task.title} style={{ borderTop: "1px solid #e2e8f0" }}>
              <td className="px-5 py-3 align-top">
                <div className="flex items-start gap-2.5">
                  <span
                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: C.bgBlue, color: C.blue }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold" style={{ color: C.navy }}>{task.title}</p>
                    <p className="mt-0.5" style={{ color: "#64748b" }}>{task.sub}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3 align-top whitespace-nowrap">
                <span
                  className="inline-block px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: "#dcfce7", color: "#166534", fontSize: 10 }}
                >
                  {task.status}
                </span>
                <p className="mt-1" style={{ color: "#94a3b8" }}>{task.agent}</p>
              </td>
              <td className="px-3 py-3 align-top whitespace-nowrap">
                <span
                  className="inline-block px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: task.teamColor.bg, color: task.teamColor.fg, fontSize: 10 }}
                >
                  {task.team}
                </span>
              </td>
              <td className="px-3 py-3 align-top whitespace-nowrap" style={{ color: "#374151" }}>
                {task.duration}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="p-4 flex justify-center" style={{ borderTop: "1px solid #e2e8f0" }}>
        <button
          type="button"
          onClick={() => setDeployOpen(true)}
          className="flex cursor-pointer items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white transition-transform hover:scale-[1.02]"
          style={{ backgroundColor: "#7c3aed", boxShadow: "0 4px 14px rgba(124,58,237,0.35)" }}
        >
          <Zap size={16} fill="currentColor" />
          Deploy Agents
          <ChevronRight size={16} />
        </button>
      </div>

      <AnimatePresence>
        {deployOpen && <DeployDrawer tasks={tasks} onClose={() => setDeployOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
