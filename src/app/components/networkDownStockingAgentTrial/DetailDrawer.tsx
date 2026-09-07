import type React from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { C } from "../sciDetails/constants";

/**
 * Shared right-side drawer shell for Step 3's "More Details" popups — same sliding-panel
 * mechanics as the IUT + Procurement drawer, but generic over its content so every scenario
 * keeps its own existing breakdown (Card/Table toggle, MOQ-break view, custom recap, etc.)
 * unchanged, just presented in a drawer instead of the centered Modal.
 */
export function DetailDrawer({
  title,
  subtitle,
  onClose,
  children,
  width = "min(96vw, 1400px)",
  footer,
  headerRight,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** CSS width value for the sliding panel — widen for content-heavy breakdowns. */
  width?: string;
  /** Replaces the default "Done" footer button when provided. Pass `null` to render no footer at all. */
  footer?: React.ReactNode | null;
  /** Extra controls in the header, between the title and the close button (e.g. a Customise toggle). */
  headerRight?: React.ReactNode;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: "rgba(0,48,135,0.18)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="h-full flex flex-col bg-white"
        style={{ width, boxShadow: "-20px 0 60px rgba(0,48,135,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-2.5 flex items-center justify-between gap-3 shrink-0" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <div className="min-w-0">
            <h2 className="text-xs font-bold" style={{ color: C.navy }}>{title}</h2>
            {subtitle && <p className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerRight}
            <button
              type="button"
              onClick={onClose}
              title="Close"
              className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer transition-colors shrink-0"
              style={{ color: "#64748b" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto min-w-0">{children}</div>

        {footer !== null && (
          <div className="px-4 py-3 flex justify-end shrink-0" style={{ borderTop: "1px solid #e2e8f0" }}>
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
    </div>,
    document.body,
  );
}
