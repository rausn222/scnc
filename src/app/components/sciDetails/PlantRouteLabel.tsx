import { PLANT_CLUSTER_MAP } from "../data";
import { C } from "./constants";

export function PlantRouteLabel({ from, to }: { from: string; to: string }) {
  const fromCluster = PLANT_CLUSTER_MAP[from] ?? from;
  const toCluster = PLANT_CLUSTER_MAP[to] ?? to;
  return (
    <span className="text-sm">
      <span className="font-semibold" style={{ color: C.blue }}>
        {from}
      </span>
      <span className="text-xs ml-1" style={{ color: "#64748b" }}>
        ({fromCluster})
      </span>
      <span className="mx-1.5" style={{ color: "#94a3b8" }}>
        →
      </span>
      <span className="font-semibold" style={{ color: C.blue }}>
        {to}
      </span>
      <span className="text-xs ml-1" style={{ color: "#64748b" }}>
        ({toCluster})
      </span>
    </span>
  );
}
