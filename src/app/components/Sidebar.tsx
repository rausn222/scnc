import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNav } from "../App";
import { cbuData } from "./data";
import {
  LayoutGrid, Brain, ChevronRight, ChevronDown,
  ChevronLeft, Network, Activity, Cpu, Zap,
} from "lucide-react";

const NAV_BG     = "#003087";
const NAV_ACTIVE = "#0a3d7a";
const NAV_HOVER  = "#0a3d7a";
const NAV_BORDER = "rgba(255, 255, 255, 0.1)";

const EXPANDED_W  = 230;
const COLLAPSED_W = 56;

interface Props {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: Props) {
  const { nav, navigate } = useNav();
  const isDashboard = nav.page === "dashboard" || nav.page === "cbu-detail";
  const isSCI       = nav.page === "supply-chain" || nav.page === "sci-detail";
  const [openPlanning, setOpenPlanning] = useState(true);
  const [openIntel,    setOpenIntel]    = useState(true);

  return (
    <motion.div
      animate={{ width: collapsed ? COLLAPSED_W : EXPANDED_W }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col h-full shrink-0 select-none overflow-hidden relative"
      style={{
        backgroundColor: NAV_BG,
        borderRight: `1px solid ${NAV_BORDER}`,
        boxShadow: "4px 0 24px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Scanning line animation */}
      <div
        className="absolute inset-x-0 pointer-events-none z-50"
        style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
      >
        <motion.div
          animate={{ y: [0, 800, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", inset: 0 }}
        />
      </div>

      {/* ── Brand + collapse toggle ── */}
      <div
        className="flex items-center shrink-0"
        style={{
          borderBottom: `1px solid ${NAV_BORDER}`,
          padding: collapsed ? "18px 0" : "18px 16px",
          justifyContent: collapsed ? "center" : "space-between",
          minHeight: 64,
        }}
      >
        <button
          onClick={() => collapsed && onToggleCollapse()}
          title={collapsed ? "Expand sidebar" : undefined}
          className="flex items-center gap-3 shrink-0"
          style={{ cursor: collapsed ? "pointer" : "default" }}
        >
          {/* Animated logo */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ai-glow-pulse"
            style={{
              background: "linear-gradient(135deg, #1565C0 0%, #003087 100%)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            <Network size={18} className="text-white" />
          </motion.div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-white font-bold text-sm leading-tight tracking-tight whitespace-nowrap"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Network Planner
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="ai-dot-blink w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: "#90caf9", display: "inline-block" }} />
                  <span className="text-xs font-semibold tracking-widest uppercase whitespace-nowrap"
                    style={{ color: "#90caf9", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                    Agent Active
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <AnimatePresence>
          {!collapsed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              className="w-6 h-6 rounded-md flex items-center justify-center transition-colors shrink-0"
              style={{ color: "rgba(255,255,255,0.4)" }}
              whileHover={{ color: "#ffffff", backgroundColor: NAV_HOVER }}
            >
              <ChevronLeft size={14} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ padding: collapsed ? "16px 8px" : "16px 12px" }}>

        {/* ── Planning section ── */}
        {collapsed ? (
          <NavIconBtn
            active={isDashboard}
            icon={<LayoutGrid size={17} />}
            title="National Level Transition Dashboard"
            onClick={() => navigate({ page: "dashboard" })}
          />
        ) : (
          <>
            <SectionHeader
              label="Planning"
              open={openPlanning}
              onToggle={() => setOpenPlanning(p => !p)}
            />
            <AnimatePresence>
              {openPlanning && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  <NavItemFull
                    active={isDashboard}
                    icon={<LayoutGrid size={15} />}
                    label="National Level Transition Dashboard"
                    onClick={() => navigate({ page: "dashboard" })}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* ── Intelligence section ── */}
        {collapsed ? (
          <NavIconBtn
            active={isSCI}
            icon={<Brain size={17} />}
            title="Supply Chain Intelligence"
            onClick={() => navigate({ page: "sci-detail" })}
            style={{ marginTop: 4 }}
          />
        ) : (
          <div style={{ marginTop: 16 }}>
            <SectionHeader
              label="Intelligence"
              open={openIntel}
              onToggle={() => setOpenIntel(p => !p)}
            />
            <AnimatePresence>
              {openIntel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  <NavItemFull
                    active={isSCI}
                    icon={<Brain size={15} />}
                    label="Supply Chain Intelligence"
                    onClick={() => navigate({ page: "sci-detail" })}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>

      {/* ── Footer ── */}
      <div
        className="shrink-0 flex items-center gap-2"
        style={{
          borderTop: `1px solid ${NAV_BORDER}`,
          padding: collapsed ? "12px 0" : "12px 16px",
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Activity size={12} style={{ color: "#90caf9", flexShrink: 0 }} />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs whitespace-nowrap"
              style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              FMCG · v2.1
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Expand button when collapsed ── */}
      {collapsed && (
        <motion.button
          whileHover={{ backgroundColor: NAV_HOVER }}
          onClick={onToggleCollapse}
          title="Expand sidebar"
          className="shrink-0 flex items-center justify-center py-2 transition-colors"
          style={{ borderTop: `1px solid ${NAV_BORDER}`, color: "rgba(255,255,255,0.4)" }}
        >
          <ChevronRight size={14} />
        </motion.button>
      )}
    </motion.div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  label, open, onToggle, style,
}: { label: string; open: boolean; onToggle: () => void; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 rounded-md transition-colors"
      style={{ paddingTop: 6, paddingBottom: 6, ...style }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = NAV_HOVER}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
    >
      <span className="text-xs uppercase tracking-widest font-semibold"
        style={{ color: "rgba(255,255,255,0.45)", fontFamily: "'JetBrains Mono', monospace", fontSize: 9 }}>
        {label}
      </span>
      {open
        ? <ChevronDown size={11} style={{ color: "rgba(255,255,255,0.45)" }} />
        : <ChevronRight size={11} style={{ color: "rgba(255,255,255,0.45)" }} />}
    </button>
  );
}

function NavItemFull({
  active, icon, label, onClick,
}: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={!active ? { x: 2 } : {}}
      className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all relative overflow-hidden"
      style={{
        backgroundColor: active ? "rgba(255,255,255,0.12)" : "transparent",
        border: active ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent",
        boxShadow: "none",
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = NAV_HOVER; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
    >
      {active && (
        <motion.div
          layoutId="nav-active-indicator"
          className="absolute left-0 inset-y-0 w-0.5 rounded-full"
          style={{ background: "linear-gradient(180deg, #90caf9, #1565C0)" }}
        />
      )}
      <span className="shrink-0 mt-0.5" style={{ color: active ? "#ffffff" : "rgba(255,255,255,0.55)" }}>{icon}</span>
      <span className="text-xs leading-snug" style={{ color: active ? "#ffffff" : "rgba(255,255,255,0.7)" }}>{label}</span>
      {active && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-auto shrink-0 mt-0.5">
          <ChevronRight size={12} style={{ color: "#90caf9" }} />
        </motion.div>
      )}
    </motion.button>
  );
}

function NavIconBtn({
  active, icon, title, onClick, style,
}: { active: boolean; icon: React.ReactNode; title: string; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <motion.button
      onClick={onClick}
      title={title}
      whileHover={!active ? { scale: 1.1 } : {}}
      whileTap={{ scale: 0.95 }}
      className="w-full flex items-center justify-center rounded-lg transition-all"
      style={{
        padding: "10px 0",
        backgroundColor: active ? "rgba(255,255,255,0.12)" : "transparent",
        border: active ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent",
        color: active ? "#ffffff" : "rgba(255,255,255,0.55)",
        boxShadow: "none",
        ...style,
      }}
    >
      {icon}
    </motion.button>
  );
}
