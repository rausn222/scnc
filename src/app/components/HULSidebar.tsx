import React from "react";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  BarChart2,
  Database,
  Network,
  Sliders,
} from "lucide-react";

export type HULActiveRoute =
  | "transition"
  | "simulation"
  | "simulation-v2"
  | "simulation-hub"
  | "data-intelligence";

interface HULSidebarProps {
  activeRoute: HULActiveRoute;
  onNavigateTransition: () => void;
  onNavigateSimulation: () => void;
  onNavigateSimulationV2?: () => void;
  onNavigateSimulationHub?: () => void;
  onNavigateDataIntelligence?: () => void;
}

export default function HULSidebar({
  activeRoute,
  onNavigateTransition,
  onNavigateSimulation,
  onNavigateSimulationV2,
  onNavigateSimulationHub,
  onNavigateDataIntelligence,
}: HULSidebarProps) {
  const [panelOpen, setPanelOpen] = useState(true);

  const isScenario =
    activeRoute === "simulation" || activeRoute === "simulation-v2";
  const goScenario = onNavigateSimulationV2 ?? onNavigateSimulation;

  return (
    <>
      <style>{`
        @keyframes aiPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
        .ai-dot { animation: aiPulse 2s ease-in-out infinite; }
      `}</style>

      <aside
        className="shrink-0 flex flex-col overflow-hidden transition-all duration-300 ease-in-out border-r"
        style={{
          width: panelOpen ? "220px" : "52px",
          background: "#003087",
          borderColor: "rgba(255,255,255,0.12)",
        }}
      >
        <div
          className="shrink-0 flex items-center justify-end px-2 py-2 border-b"
          style={{ borderColor: "rgba(255,255,255,0.12)" }}
        >
          <button
            type="button"
            onClick={() => setPanelOpen(!panelOpen)}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-white/10"
            style={{ color: "rgba(255,255,255,0.5)" }}
            title={panelOpen ? "Collapse" : "Expand"}
          >
            {panelOpen ? (
              <ChevronLeft className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

   
  
      </aside>
    </>
  );
}
