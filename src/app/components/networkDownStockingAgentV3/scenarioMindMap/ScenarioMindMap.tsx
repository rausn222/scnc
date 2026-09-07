import type React from "react";
import { motion } from "motion/react";
import { C } from "../../sciDetails/constants";
import type { MindMapBranch } from "./scenarioMindMapData";

// Ellipse radius (as a % of the container's own width/height) that the branch
// nodes sit on — kept well inside 50% so the node cards never spill past the
// container edge once their own half-width (NODE_WIDTH / 2) is added back on.
const RADIUS_X = 33;
const RADIUS_Y = 32;
const NODE_WIDTH = 176;
const CONTAINER_WIDTH = 880;

function branchPosition(index: number, total: number) {
  const angle = (-90 + (360 / total) * index) * (Math.PI / 180);
  return {
    x: 50 + RADIUS_X * Math.cos(angle),
    y: 50 + RADIUS_Y * Math.sin(angle),
  };
}

/**
 * Radial "mind map": a subject (scenario, routing option, ...) sits in the
 * centre, with its key outcome drivers branching out around it. Purely a
 * read-only summary — nothing here is editable, it's a different lens on
 * data already produced elsewhere. Kept generic (icon/title/badge in, not a
 * specific data shape) so both the Step 4 scenario explorer and the routing
 * option explorer can render through the same component.
 */
export function ScenarioMindMap({
  centerIcon,
  centerTitle,
  centerBadge,
  branches,
}: {
  centerIcon: React.ReactNode;
  centerTitle: string;
  centerBadge?: string;
  branches: MindMapBranch[];
}) {
  return (
    <div
      className="relative"
      style={{ width: CONTAINER_WIDTH, aspectRatio: "16 / 11", minHeight: 460 }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ overflow: "visible" }}
      >
        {branches.map((b, i) => {
          const { x, y } = branchPosition(i, branches.length);
          return (
            <line
              key={b.key}
              x1={50}
              y1={50}
              x2={x}
              y2={y}
              stroke="#cbd5e1"
              strokeWidth={0.4}
              strokeDasharray="1.6 1.6"
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Centre node — the subject itself */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="absolute flex flex-col items-center gap-1.5 px-4 py-3.5 rounded-2xl text-center"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 176,
          background: "linear-gradient(135deg, #003087 0%, #1565C0 100%)",
          boxShadow: "0 10px 28px rgba(0,48,135,0.28)",
          zIndex: 2,
        }}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
          {centerIcon}
        </div>
        <p className="text-xs font-bold text-white leading-tight">{centerTitle}</p>
        {centerBadge && (
          <span
            className="px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap"
            style={{ backgroundColor: "rgba(255,255,255,0.22)", color: "#fff" }}
          >
            {centerBadge}
          </span>
        )}
      </motion.div>

      {/* Branch nodes — the scenario's outcome drivers */}
      {branches.map((b, i) => {
        const { x, y } = branchPosition(i, branches.length);
        return (
          <motion.div
            key={b.key}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: 0.05 + i * 0.05, ease: [0.4, 0, 0.2, 1] }}
            className="absolute rounded-xl px-3 py-2.5"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
              width: NODE_WIDTH,
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderLeft: `3px solid ${b.accent}`,
              boxShadow: "0 2px 10px rgba(0,48,135,0.07)",
              zIndex: 2,
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: b.accent }} />
              <p className="text-[9px] font-bold uppercase tracking-wide truncate" style={{ color: b.accent }}>
                {b.label}
              </p>
            </div>
            <p className="text-sm font-bold mt-0.5 tabular-nums truncate" style={{ color: C.navy }} title={b.value}>
              {b.value}
            </p>
            {b.detail && (
              <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "#64748b" }}>
                {b.detail}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
