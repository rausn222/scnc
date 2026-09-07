import { useState, createContext, useContext, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "./components/Sidebar";
import { Loader } from "./components/Loader";
import SupplyChainIntelligence from "./pages/SupplyChainIntelligence";
import SCIDetail from "./pages/SCIDetail";
import { useCbuDetailQuery } from "./queries/cbuQueries";
import { Toaster } from "sonner";
import SCIDetail4 from "./pages/SCIDetails4";
import SCIDetailReport from "./pages/SCIDetailReport";
import ProjectDetails from "./pages/ProjectDetails";
import ActionDetails from "./pages/ActionDetails";
import TrackingDetails from "./pages/TrackingDetails";
import type { ActionTask } from "./components/actionDetails/ActionTaskList";
import type { Project } from "./components/projectDetails/types";
import NetworkSummary from "./pages/NetworkSummary";

// Code-split the two heaviest, most frequently re-entered pages so their
// bundles load on demand rather than inflating the initial chunk.
const NationalDashboard = lazy(() => import("./pages/NationalDashboard"));
const CBUDetail = lazy(() => import("./pages/CBUDetail"));
const NetworkDownStockingAgent = lazy(() => import("./pages/NetworkDownStockingAgent"));
const NetworkDownStockingAgentV2 = lazy(() => import("./pages/NetworkDownStockingAgentV2"));
const NetworkDownStockingAgentV3 = lazy(() => import("./pages/NetworkDownStockingAgentV3"));
const NetworkDownStockingAgentTrial = lazy(() => import("./pages/NetworkDownStockingAgentTrial"));
const PlantComparisonPage = lazy(() => import("./pages/PlantComparisonPage"));

// ─── Navigation ───────────────────────────────────────────────────────────────

export type AcceptedScenarioDetails = {
  id: string;
  name: string;
  projectName?: string | null;
  oldCbuCode?: string | null;
  newCbuCode?: string | null;
  oldCbuDescription?: string | null;
  newCbuDescription?: string | null;
  businessWaste: string | null;
  wasteSavings?: string | null;
  wasteColor?: "orange" | "teal";
  fgDaysCover: string | null;
  nextActionPrefix: string;
  nextAction: string;
  icon: string;
  feasibleProducible: number;
  productionStopDate: string;
  dailyRunRate: number;
  receivingPlant: string;
};

export type NavState =
  | { page: "dashboard" }
  | { page: "cbu-detail"; srNo: number }
  | { page: "supply-chain" }
  | { page: "sci-detail"; srNo?: number }
  | { page: "sci-detail4"; srNo?: number }
  | { page: "sci-detail-report"; srNo?: number }
  | { page: "project-details" }
  | { page: "network-summary" }
  | { page: "network-down-stocking-agent"; srNo?: number }
  | { page: "network-down-stocking-agent-v2"; srNo?: number }
  | { page: "network-down-stocking-agent-v3"; srNo?: number }
  | { page: "network-down-stocking-agent-trial"; srNo?: number; preserveState?: boolean }
  | { page: "plant-comparison" }
  | { page: "action-details"; scenario: AcceptedScenarioDetails; srNo?: number; from: NavState }
  | { page: "tracking-details"; tasks?: ActionTask[]; scenario?: AcceptedScenarioDetails; project?: Project; from?: NavState };

export const NavContext = createContext<{
  nav: NavState;
  navigate: (s: NavState) => void;
}>({ nav: { page: "dashboard" }, navigate: () => { } });

export function useNav() {
  return useContext(NavContext);
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [nav, setNav] = useState<NavState>({ page: "dashboard" });
  const [collapsed, setCollapsed] = useState(true);

  const sciRowSrNo =
    (nav.page === "sci-detail4" || nav.page === "sci-detail-report")
      ? nav.srNo
      : undefined;
  const { data: sciRow } = useCbuDetailQuery(sciRowSrNo);

  const pageKey =
    nav.page === "cbu-detail" ? `cbu-${nav.srNo}` :
      nav.page === "sci-detail" ? `sci-${nav.srNo ?? "default"}` :
        nav.page === "sci-detail4" ? `sci-detail4-${nav.srNo ?? "default"}` :
          nav.page === "sci-detail-report" ? `sci-detail-report-${nav.srNo ?? "default"}` :
            nav.page === "action-details" ? `action-details-${nav.scenario.id}` :
              nav.page === "tracking-details" ? "tracking-details" :
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
              className={`flex-1 flex flex-col ${nav.page === "plant-comparison" ? "overflow-y-auto" : "overflow-hidden"}`}
            >
              {nav.page === "dashboard" && (
                <Suspense fallback={<Loader />}>
                  <NationalDashboard />
                </Suspense>
              )}
              {nav.page === "cbu-detail" && (
                <Suspense fallback={<Loader />}>
                  <CBUDetail srNo={nav.srNo} />
                </Suspense>
              )}
              {nav.page === "supply-chain" && <SupplyChainIntelligence />}
              {nav.page === "sci-detail" && <SCIDetail srNo={nav.srNo} />}
              {nav.page === "sci-detail4" && <SCIDetail4 row={sciRow ?? null} />}
              {nav.page === "sci-detail-report" && <SCIDetailReport row={sciRow ?? null} />}
              {nav.page === "project-details" && <ProjectDetails />}
              {nav.page === "network-summary" && <NetworkSummary />}
              {nav.page === "network-down-stocking-agent" && (
                <Suspense fallback={<Loader />}>
                  <NetworkDownStockingAgent srNo={nav.srNo} />
                </Suspense>
              )}
              {nav.page === "network-down-stocking-agent-v2" && (
                <Suspense fallback={<Loader />}>
                  <NetworkDownStockingAgentV2 srNo={nav.srNo} />
                </Suspense>
              )}
              {nav.page === "network-down-stocking-agent-v3" && (
                <Suspense fallback={<Loader />}>
                  <NetworkDownStockingAgentV3 srNo={nav.srNo} />
                </Suspense>
              )}
              {nav.page === "network-down-stocking-agent-trial" && (
                <Suspense fallback={<Loader />}>
                  <NetworkDownStockingAgentTrial srNo={nav.srNo} preserveState={nav.preserveState} />
                </Suspense>
              )}
              {nav.page === "plant-comparison" && (
                <Suspense fallback={<Loader />}>
                  <PlantComparisonPage />
                </Suspense>
              )}
              {nav.page === "action-details" && (
                <ActionDetails
                  scenario={nav.scenario}
                  onBack={() => setNav(nav.from)}
                />
              )}
              {nav.page === "tracking-details" && (
                <TrackingDetails
                  tasks={nav.tasks ?? []}
                  scenario={nav.scenario}
                  project={nav.project}
                  onBack={() => setNav(nav.from ?? { page: "dashboard" })}
                  backLabel={nav.from ? "Back to Action Details" : "Back to Dashboard"}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </NavContext.Provider>
  );
}
