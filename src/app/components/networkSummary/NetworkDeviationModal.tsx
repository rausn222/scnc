import { motion } from "motion/react";
import { X } from "lucide-react";
import { useNav } from "../../App";
import { deviationStatusColor, type NetworkRow } from "./networkData";

const BORDER = "#e2e8f0";

interface Props {
  row: NetworkRow;
  onClose: () => void;
}

export function NetworkDeviationModal({ row, onClose }: Props) {
  const { navigate } = useNav();
  const progressPct = row.progressPct;
  const actionItems = row.deviationDetails ?? [];

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
          width: "min(92vw, 560px)",
          maxHeight: "85vh",
          backgroundColor: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 60px rgba(0,48,135,0.18), 0 4px 16px rgba(0,0,0,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 pt-4 pb-4 shrink-0"
          style={{ background: "linear-gradient(135deg, #003087 0%, #1565C0 100%)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p
                className="text-xs font-bold tracking-widest mb-1"
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                }}
              >
                NETWORK MONITORING
              </p>
              <h2 className="font-bold text-white truncate" style={{ fontSize: 18 }}>
                {row.networkId}
              </h2>
              <p className="text-sm mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.65)" }}>
                {row.projectName}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Close"
              className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer transition-colors shrink-0 mt-0.5"
              style={{ color: "rgba(255,255,255,0.55)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "rgba(255,255,255,0.55)";
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <Field
            label="Project Progress %"
            value={
              <div className="flex flex-col gap-1 w-full">
                <span className="font-semibold" style={{ color: "#111827" }}>
                  {progressPct}%
                </span>
                <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "#f3f4f6" }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${progressPct}%`, backgroundColor: "#f59e0b" }}
                  />
                </div>
                <span className="text-[10px]" style={{ color: "#9ca3af" }}>
                  Considers the total actions and completed actions
                </span>
              </div>
            }
          />
          <Field
            label="Deviations Count"
            value={
              <span className="font-semibold" style={{ color: "#1565C0" }}>
                {row.deviationCount ?? 0}
              </span>
            }
          />
          <div className="flex flex-col gap-1.5">
            <span
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: "#6b7280" }}
            >
              Deviation Details
            </span>
            {actionItems.length === 0 ? (
              <p className="text-xs" style={{ color: "#9ca3af" }}>
                No action item details available.
              </p>
            ) : (
              <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: `1px solid ${BORDER}` }}>
                      <th
                        className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide"
                        style={{ color: "#94a3b8" }}
                      >
                        Action Item
                      </th>
                      <th
                        className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                        style={{ color: "#94a3b8" }}
                      >
                        Owner
                      </th>
                      <th
                        className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                        style={{ color: "#94a3b8" }}
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {actionItems.map((item, i) => {
                      const sc = deviationStatusColor(item.status);
                      return (
                        <tr
                          key={item.actionId}
                          style={{ borderTop: i > 0 ? `1px solid ${BORDER}` : undefined }}
                        >
                          <td className="px-3 py-2.5" style={{ color: "#111827" }}>
                            {item.description}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: "#374151" }}>
                            {item.owner}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span
                              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                              style={{ backgroundColor: sc.bg, color: sc.text }}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 shrink-0" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate({ page: "tracking-details" });
            }}
            className="w-full text-center text-xs font-semibold py-2 rounded-lg cursor-pointer transition-colors"
            style={{ backgroundColor: "#1565C0", color: "#ffffff" }}
          >
            View details
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#6b7280" }}>
        {label}
      </span>
      <div className="text-xs" style={{ color: "#111827" }}>
        {value}
      </div>
    </div>
  );
}
