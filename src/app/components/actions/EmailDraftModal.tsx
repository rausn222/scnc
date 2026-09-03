import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Paperclip, Send, X } from "lucide-react";
import type { ActionRow } from "./actionsData";

interface Props {
  row: ActionRow;
  onClose: () => void;
  onSend: (payload: { to: string; subject: string; body: string }) => void;
}

function ownerEmail(owner: string) {
  return `${owner.trim().toLowerCase().replace(/\s+/g, ".")}@company.com`;
}

function buildBody(row: ActionRow) {
  return `Hi ${row.owner},

The following action requires your attention:

Action ID:     ${row.actionId}
Description:   ${row.description}
Scenario:      ${row.scenarioType}
Plant:         ${row.plant}
Material:      ${row.quantity} x ${row.material}
SLA:           ${row.slaHrs} hrs${row.ageingDays !== null ? `
Ageing:        ${row.ageingDays} day(s)` : ""}
Status:        ${row.status}

Please review and action at the earliest.

Regards,
Supply Chain Control Tower`;
}

export function EmailDraftModal({ row, onClose, onSend }: Props) {
  const [to, setTo] = useState(ownerEmail(row.owner));
  const [subject, setSubject] = useState(
    `Action Required: ${row.actionId} — ${row.description}`,
  );
  const [body, setBody] = useState(buildBody(row));

  const canSend = to.trim() !== "" && subject.trim() !== "";

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
          width: "min(92vw, 640px)",
          maxHeight: "88vh",
          backgroundColor: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 60px rgba(0,48,135,0.18), 0 4px 16px rgba(0,0,0,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 pt-5 pb-4 shrink-0 flex items-start justify-between gap-4"
          style={{ background: "linear-gradient(135deg, #003087 0%, #1565C0 100%)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <Mail size={15} color="#ffffff" />
            </div>
            <div>
              <h2 className="font-bold text-white" style={{ fontSize: 16 }}>
                Draft Email
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                {row.actionId} · {row.plant}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-full transition-colors shrink-0 mt-0.5"
            style={{ color: "rgba(255,255,255,0.55)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.15)";
              (e.currentTarget as HTMLElement).style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)";
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 flex flex-col gap-3" style={{ borderBottom: "1px solid #e2e8f0" }}>
            <div className="flex items-center gap-3">
              <span
                className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wide"
                style={{ color: "#6b7280" }}
              >
                To
              </span>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="flex-1 text-sm py-1.5 px-2.5 rounded-md focus:outline-none"
                style={{ border: "1px solid #d1d5db", color: "#111827" }}
              />
            </div>
            <div className="flex items-center gap-3">
              <span
                className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wide"
                style={{ color: "#6b7280" }}
              >
                Subject
              </span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 text-sm py-1.5 px-2.5 rounded-md focus:outline-none"
                style={{ border: "1px solid #d1d5db", color: "#111827" }}
              />
            </div>
          </div>

          <div className="px-6 py-4">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="w-full text-sm py-2.5 px-3 rounded-md resize-none focus:outline-none font-mono"
              style={{ border: "1px solid #d1d5db", color: "#111827", lineHeight: 1.6 }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3.5 shrink-0 flex items-center justify-between gap-3"
          style={{ backgroundColor: "#f9fafb", borderTop: "1px solid #e2e8f0" }}
        >
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "#9ca3af" }}>
            <Paperclip size={12} />
            No attachments
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              style={{ color: "#374151", border: "1px solid #d1d5db", backgroundColor: "#ffffff" }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSend}
              onClick={() => canSend && onSend({ to, subject, body })}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#003087" }}
            >
              <Send size={12} />
              Send Email
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
