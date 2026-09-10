import { useState, createContext, useContext, useEffect, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { getApiRequest } from "msalConfigCreditional";
import { setNpAuthToken } from "./api/apiHeaders";
import { Loader } from "./components/Loader";
import SupplyChainIntelligence from "./pages/SupplyChainIntelligence";
import SCIDetail from "./pages/SCIDetail";
import { Toaster } from "sonner";
import ActionDetails from "./pages/ActionDetails";
import TrackingDetails from "./pages/TrackingDetails";
import type { ActionTask } from "./components/actionDetails/ActionTaskList";
// Optional: only present when this module is embedded inside Samarth's
// HeaderLayout (see routers.js). The standalone Vite prototype (main.tsx)
// renders <App/> with no RefreshProvider, so this must stay optional.
import { useRefresh } from "utils/refreshContext";
import { TAB_LABELS, type PageTab } from "./components/PageTabHeader";

// Code-split the two heaviest, most frequently re-entered pages so their
// bundles load on demand rather than inflating the initial chunk.
const NationalDashboard = lazy(() => import("./pages/NationalDashboard"));
const CBUDetail = lazy(() => import("./pages/CBUDetail"));

// ─── Navigation ───────────────────────────────────────────────────────────────

export type AcceptedScenarioDetails = {
  id: string;
  name: string;
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
  | { page: "cbu-detail"; cbuCode: string }
  | { page: "supply-chain" }
  | { page: "sci-detail"; srNo?: number }
  | { page: "action-details"; scenario: AcceptedScenarioDetails; srNo?: number; from: NavState }
  | { page: "tracking-details"; tasks: ActionTask[]; scenario?: AcceptedScenarioDetails; from: NavState };

// Page ids that need no fields beyond `page` itself, so `{ page: X }` alone
// is always a valid NavState — safe to accept as a bare initial-page prop.
export type SimpleNavPage =
  | "dashboard"
  | "supply-chain"
  | "sci-detail";

export const NavContext = createContext<{
  nav: NavState;
  navigate: (s: NavState) => void;
}>({ nav: { page: "dashboard" }, navigate: () => { } });

export function useNav() {
  return useContext(NavContext);
}

function getPageKey(nav: NavState): string {
  switch (nav.page) {
    case "cbu-detail":
      return `cbu-${nav.cbuCode}`;
    case "sci-detail":
      return `sci-${nav.srNo ?? "default"}`;
    case "action-details":
      return `action-details-${nav.scenario.id}`;
    case "tracking-details":
      return "tracking-details";
    default:
      return nav.page;
  }
}

// Which PageTabHeader tab each nav page belongs to, for driving the shared
// header's "Last refreshed" label (see PAGE_TAB_MAP usage below). Pages not
// listed here (e.g. "supply-chain") don't have a home in either tab, so the
// header keeps whatever label was last set.
const PAGE_TAB_MAP: Partial<Record<NavState["page"], PageTab>> = {
  dashboard: "inventory",
  "cbu-detail": "inventory",
  "sci-detail": "stocking-agent",
  // Reached only via the SCI Detail scenario flow (ScenarioComparisonStep /
  // DeployDrawer), so they inherit the stocking-agent pipeline's data.
  "action-details": "stocking-agent",
  "tracking-details": "stocking-agent",
};

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App({ initialPage }: { initialPage?: SimpleNavPage } = {}) {
  const [nav, setNav] = useState<NavState>({ page: initialPage ?? "dashboard" });

  const pageKey = getPageKey(nav);
  const navContextValue = useMemo(() => ({ nav, navigate: setNav }), [nav]);

  // Keeps every API call in the module (cbuApi.ts, lib/api.ts, and the
  // couple of pages that call the API layer directly) authenticated with
  // the signed-in user's bearer token — see getApiHeaders/setNpAuthToken in
  // ./api/apiHeaders. Cleared on sign-out (accounts becomes empty) so no
  // stale token is reused by a subsequent, unauthenticated session.
  //
  // Must be the API access token (acquireTokenSilent), not accounts[0].idToken
  // — the API rejects id tokens, which is why NationalDashboard calls were
  // failing when this used to read idToken directly off the account.
  const { accounts, instance } = useMsal();
  useEffect(() => {
    const account = instance.getActiveAccount() || accounts[0];
    if (!account) {
      setNpAuthToken(undefined);
      return;
    }

    const request = { ...getApiRequest(), account };
    let cancelled = false;

    instance
      .acquireTokenSilent(request)
      .catch((error) => {
        if (error instanceof InteractionRequiredAuthError) {
          return instance.acquireTokenPopup(request);
        }
        throw error;
      })
      .then((response) => {
        if (!cancelled) setNpAuthToken(response.accessToken);
      })
      .catch((error) => {
        console.error("Failed to acquire Network Planning API token", error);
        if (!cancelled) setNpAuthToken(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [accounts, instance]);

  // Drive the shared Samarth header's "Last refreshed" text (see
  // Samarth Module/components/headerLayout/header.js). undefined outside
  // RefreshProvider — i.e. the standalone Vite prototype — so every access
  // below is optional-chained.
  const refreshCtx = useRefresh();
  const setCurrentPageLabel = refreshCtx?.setCurrentPageLabel;
  const setCurrentSubPageLabel = refreshCtx?.setCurrentSubPageLabel;

  useEffect(() => {
    const tab = PAGE_TAB_MAP[nav.page];
    if (!tab || !setCurrentPageLabel || !setCurrentSubPageLabel) return;

    setCurrentPageLabel(TAB_LABELS[tab]);
    setCurrentSubPageLabel("");
  }, [nav.page, setCurrentPageLabel, setCurrentSubPageLabel]);

  return (
    <NavContext.Provider value={navContextValue}>
      <Toaster position="top-center" richColors closeButton />
      <div className="flex h-full overflow-hidden"
        style={{ backgroundColor: "#f5f7fa" }}>
        {/* This module used to render its own <Sidebar/> here for
            page-to-page navigation. It's now embedded inside Samarth's
            HeaderLayout (see Samarth Module/routers/router.js), which
            already provides a top bar + side nav, so the module's own
            sidebar was removed to avoid showing two side navs at once. */}
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
              {nav.page === "dashboard" && (
                <Suspense fallback={<Loader />}>
                  <NationalDashboard />
                </Suspense>
              )}
              {nav.page === "cbu-detail" && (
                <Suspense fallback={<Loader />}>
                  <CBUDetail cbuCode={nav.cbuCode} />
                </Suspense>
              )}
              {nav.page === "supply-chain" && <SupplyChainIntelligence />}
              {nav.page === "sci-detail" && <SCIDetail srNo={nav.srNo} />}
              {nav.page === "action-details" && (
                <ActionDetails
                  scenario={nav.scenario}
                  onBack={() => setNav(nav.from)}
                />
              )}
              {nav.page === "tracking-details" && (
                <TrackingDetails
                  tasks={nav.tasks}
                  scenario={nav.scenario}
                  onBack={() => setNav(nav.from)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </NavContext.Provider>
  );
}
