import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { CheckCircle2, Clock, Loader2, PackageCheck, X, Zap } from "lucide-react";
import { useNav } from "../../App";
import { C } from "./theme";
import type { ActionTask } from "./ActionTaskList";

const DEPLOY_STEP_DURATION_MS = 1200;

export function DeployDrawer({ tasks, onClose }: { tasks: ActionTask[]; onClose: () => void }) {
  const [completedCount, setCompletedCount] = useState(0);
  const isComplete = completedCount >= tasks.length;
  const { nav, navigate } = useNav();

  useEffect(() => {
    if (completedCount >= tasks.length) return;
    const timer = setTimeout(() => setCompletedCount((c) => c + 1), DEPLOY_STEP_DURATION_MS);
    return () => clearTimeout(timer);
  }, [completedCount, tasks.length]);

  const handleTrackingDetails = () => {
    navigate({
      page: "tracking-details",
      tasks,
      scenario: nav.page === "action-details" ? nav.scenario : undefined,
      from: nav,
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={isComplete ? onClose : undefined}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 py-4 flex items-center justify-between shrink-0"
          style={{ backgroundColor: C.navy }}
        >
          <div className="flex items-center gap-2">
            <Zap size={16} style={{ color: "#fbbf24" }} fill="#fbbf24" />
            <span className="text-sm font-bold text-white">
              {isComplete ? "Agents Deployed" : "Deploying Agents"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-3 shrink-0" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span style={{ color: "#64748b" }}>Progress</span>
            <span className="font-semibold" style={{ color: C.navy }}>
              {completedCount}/{tasks.length} completed
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#e2e8f0" }}>
            <motion.div
              className="h-full"
              style={{ backgroundColor: isComplete ? C.green : "#7c3aed" }}
              animate={{ width: `${(completedCount / tasks.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {tasks.map((task, i) => {
            const done = i < completedCount;
            const running = i === completedCount && !isComplete;
            return (
              <motion.div
                key={task.title}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: running || done ? 1 : 0.55, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-lg px-3.5 py-3 flex items-start gap-2.5"
                style={{
                  backgroundColor: done ? "#f0fdf4" : running ? "#f5f3ff" : "#f8fafc",
                  border: `1px solid ${done ? "#bbf7d0" : running ? "#ddd6fe" : "#e2e8f0"}`,
                }}
              >
                <div className="shrink-0 mt-0.5">
                  {done ? (
                    <CheckCircle2 size={15} style={{ color: C.green }} />
                  ) : running ? (
                    <Loader2 size={15} className="animate-spin" style={{ color: "#7c3aed" }} />
                  ) : (
                    <Clock size={15} style={{ color: "#94a3b8" }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-xs font-bold"
                    style={{ color: done ? "#166534" : running ? "#6d28d9" : "#64748b" }}
                  >
                    {task.title}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
                    {task.agent}
                  </p>
                </div>
                <span
                  className="text-[10px] font-bold uppercase tracking-wide shrink-0"
                  style={{ color: done ? "#166534" : running ? "#7c3aed" : "#94a3b8" }}
                >
                  {done ? "Completed" : running ? "Running" : "Queued"}
                </span>
              </motion.div>
            );
          })}
        </div>

        {isComplete && (
          <div className="p-4 shrink-0" style={{ borderTop: "1px solid #e2e8f0" }}>
            <div
              className="rounded-lg px-4 py-3 flex items-center gap-2 mb-3"
              style={{ backgroundColor: "#dcfce7" }}
            >
              <CheckCircle2 size={16} style={{ color: C.green }} />
              <span className="text-xs font-semibold" style={{ color: "#166534" }}>
                All agents deployed successfully
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                style={{ backgroundColor: "#e2e8f0", color: "#374151" }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleTrackingDetails}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer"
                style={{ backgroundColor: C.navy }}
              >
                <PackageCheck size={13} />
                Tracking Details
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
}
