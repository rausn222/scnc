import type React from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { C } from "../sciDetails/constants";

/**
 * Shared popup shell for the Network Down Stocking Agent page. Editing
 * happens live via the handlers each caller passes down to its content —
 * Done/close/backdrop-click just dismiss the popup, they don't persist
 * anything themselves.
 */
export function Modal({
  icon,
  title,
  subtitle,
  onClose,
  children,
  maxWidth = "min(92vw, 640px)",
  maxHeight = "85vh",
  footer,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** CSS max-width value — widen for content-heavy popups (e.g. data tables). */
  maxWidth?: string;
  /** CSS max-height value — raise for popups with a lot of stacked content. */
  maxHeight?: string;
  /** Replaces the default "Done" footer button when provided. Pass `null` to render no footer at all. */
  footer?: React.ReactNode | null;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
          width: "fit-content",
          minWidth: 380,
          maxWidth,
          maxHeight,
          backgroundColor: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 60px rgba(0,48,135,0.18), 0 4px 16px rgba(0,0,0,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 py-4 flex items-start gap-3 shrink-0"
          style={{ background: "linear-gradient(135deg, #003087 0%, #1565C0 100%)" }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white">{title}</h2>
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer transition-colors shrink-0"
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

        <div className="flex-1 overflow-auto min-w-0">{children}</div>

        {footer !== null && (
          <div
            className="px-5 py-3 flex justify-end shrink-0"
            style={{ borderTop: "1px solid #e2e8f0" }}
          >
            {footer ?? (
              <button
                type="button"
                onClick={onClose}
                title="Close this popup"
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer"
                style={{ backgroundColor: C.blue }}
              >
                Done
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
