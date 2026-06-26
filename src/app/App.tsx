import { useState, createContext, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "./components/Sidebar";
import NationalDashboard from "./pages/NationalDashboard";
import CBUDetail from "./pages/CBUDetail";
import SupplyChainIntelligence from "./pages/SupplyChainIntelligence";
import SCIDetail from "./pages/SCIDetail";
import { cbuData } from "./components/data";
import { Toaster } from "sonner";

// ─── Navigation ───────────────────────────────────────────────────────────────

export type NavState =
  | { page: "dashboard" }
  | { page: "cbu-detail"; srNo: number }
  | { page: "supply-chain" }
  | { page: "sci-detail"; srNo?: number };

export const NavContext = createContext<{
  nav: NavState;
  navigate: (s: NavState) => void;
}>({ nav: { page: "dashboard" }, navigate: () => {} });

export function useNav() {
  return useContext(NavContext);
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [nav, setNav]             = useState<NavState>({ page: "dashboard" });
  const [collapsed, setCollapsed] = useState(false);

  const detailRow = nav.page === "cbu-detail" ? cbuData.find(r => r.srNo === nav.srNo) : null;
  const sciRow =
    nav.page === "sci-detail" && nav.srNo != null
      ? cbuData.find((r) => r.srNo === nav.srNo)
      : null;

  const pageKey =
    nav.page === "cbu-detail" ? `cbu-${nav.srNo}` :
    nav.page === "sci-detail"  ? `sci-${nav.srNo ?? "default"}` :
    nav.page;

  return (
    <NavContext.Provider value={{ nav, navigate: setNav }}>
      <Toaster position="top-center" richColors closeButton />
      <div className="flex h-screen overflow-hidden"
        style={{ backgroundColor: "#f5f7fa" }}>
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
        />

        <div className="flex-1 flex flex-col overflow-hidden relative" style={{ backgroundColor: "#f5f7fa" }}>
          <div
            className="absolute inset-x-0 top-0 h-px pointer-events-none z-10"
            style={{ background: "linear-gradient(90deg, transparent, rgba(37,99,235,0.2), transparent)" }}
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={pageKey}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {nav.page === "dashboard"    && <NationalDashboard />}
              {nav.page === "cbu-detail"   && detailRow && <CBUDetail row={detailRow} />}
              {nav.page === "supply-chain" && <SupplyChainIntelligence />}
              {nav.page === "sci-detail"   && <SCIDetail row={sciRow ?? null} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </NavContext.Provider>
  );
}
