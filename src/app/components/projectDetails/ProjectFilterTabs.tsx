import { C, FILTER_TABS } from "../../constants/projectDetails";
import type { ProjectFilter } from "./types";

interface Props {
  active: ProjectFilter;
  onChange: (filter: ProjectFilter) => void;
  counts: Record<ProjectFilter, number>;
}

export function ProjectFilterTabs({ active, onChange, counts }: Props) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs font-semibold mr-1" style={{ color: "#64748b" }}>
        Filter:
      </span>
      {FILTER_TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            style={
              isActive
                ? { backgroundColor: C.navy, color: "#fff" }
                : { backgroundColor: "#fff", color: "#475569", border: "1px solid #e2e8f0" }
            }
          >
            {tab} ({counts[tab]})
          </button>
        );
      })}
    </div>
  );
}
