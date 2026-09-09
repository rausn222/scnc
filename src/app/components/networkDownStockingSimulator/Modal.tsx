import type React from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { C } from "../sciDetails/constants";

const BACKDROP_TINT = "rgba(0,48,135,0.18)";
const HEADER_GRADIENT = `linear-gradient(135deg, ${C.navy} 0%, ${C.blue} 100%)`;
const OVERLAY_WHITE_SOFT = "rgba(255,255,255,0.15)";
const OVERLAY_WHITE_SUBTLE = "rgba(255,255,255,0.7)";
const OVERLAY_WHITE_FAINT = "rgba(255,255,255,0.55)";

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
  compactHeader = false,
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
  /** Shrinks the header's padding/icon/text so it takes less vertical space — for popups where the body is the point. */
  compactHeader?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: BACKDROP_TINT, backdropFilter: "blur(4px)" }}
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
          backgroundColor: C.white,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          boxShadow: "0 20px 60px rgba(0,48,135,0.18), 0 4px 16px rgba(0,0,0,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-start gap-3 shrink-0 ${compactHeader ? "px-4 py-2" : "px-5 py-4"}`}
          style={{ background: HEADER_GRADIENT }}
        >
          <div
            className={`rounded-lg flex items-center justify-center shrink-0 ${compactHeader ? "w-6 h-6" : "w-9 h-9"}`}
            style={{ backgroundColor: OVERLAY_WHITE_SOFT }}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={`font-bold text-white ${compactHeader ? "text-xs" : "text-sm"}`}>{title}</h2>
            {subtitle && (
              <p className={`mt-0.5 ${compactHeader ? "text-[10px]" : "text-xs"}`} style={{ color: OVERLAY_WHITE_SUBTLE }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className={`flex items-center justify-center rounded-full cursor-pointer transition-colors shrink-0 ${compactHeader ? "w-6 h-6" : "w-7 h-7"}`}
            style={{ color: OVERLAY_WHITE_FAINT }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = OVERLAY_WHITE_SOFT;
              e.currentTarget.style.color = C.white;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = OVERLAY_WHITE_FAINT;
            }}
          >
            <X size={compactHeader ? 13 : 15} />
          </button>
        </div>

        <div className="flex-1 overflow-auto min-w-0">{children}</div>

        {footer !== null && (
          <div
            className="px-5 py-3 flex justify-end shrink-0"
            style={{ borderTop: `1px solid ${C.border}` }}
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
