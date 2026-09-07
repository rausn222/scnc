import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { ProjectSummaryCards } from "../components/projectDetails/ProjectSummaryCards";
import { ProjectFilterTabs } from "../components/projectDetails/ProjectFilterTabs";
import { ProjectListTable } from "../components/projectDetails/ProjectListTable";
import { ProjectMonitorPanel } from "../components/projectDetails/ProjectMonitorPanel";
import { CreateProjectModal } from "../components/projectDetails/CreateProjectModal";
import type { NewProjectRecord, Project, ProjectFilter } from "../components/projectDetails/types";
import { filterProjects, newRecordToProject, summarize } from "../components/projectDetails/utils";
import { C, FILTER_TABS, NEW_PROJECT_LABEL, PAGE_TITLE, SEED_PROJECTS } from "../constants/projectDetails";

export default function ProjectDetails() {
  const [projects, setProjects] = useState<Project[]>(SEED_PROJECTS);
  const [filter, setFilter] = useState<ProjectFilter>("All");
  const [selectedId, setSelectedId] = useState<string | null>(SEED_PROJECTS[0]?.id ?? null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [monitorVisible, setMonitorVisible] = useState(true);

  const filteredProjects = useMemo(() => filterProjects(projects, filter), [projects, filter]);
  const summary = useMemo(() => summarize(projects), [projects]);
  const filterCounts = useMemo(() => {
    const counts = {} as Record<ProjectFilter, number>;
    for (const tab of FILTER_TABS) counts[tab] = filterProjects(projects, tab).length;
    return counts;
  }, [projects]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedId) ?? filteredProjects[0] ?? null,
    [projects, selectedId, filteredProjects]
  );

  function handleSelectFilter(next: ProjectFilter) {
    setFilter(next);
    const stillVisible = filterProjects(projects, next);
    if (!stillVisible.some((p) => p.id === selectedId)) {
      setSelectedId(stillVisible[0]?.id ?? null);
    }
  }

  function handleSelectProject(id: string) {
    setSelectedId(id);
    setMonitorVisible(true);
  }

  function handleCreated(records: NewProjectRecord[]) {
    setProjects((prev) => {
      let next = prev;
      const added: Project[] = [];
      for (const record of records) {
        const project = newRecordToProject(record, next);
        next = [project, ...next];
        added.push(project);
      }
      if (added[0]) setSelectedId(added[0].id);
      return next;
    });
  }

  function handleResimulate(projectId: string) {
    const project = projects.find((p) => p.id === projectId);
    toast.success(project ? `Re-simulating "${project.name}" with the latest signals.` : "Re-simulating with the latest signals.");
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: "#f5f7fa" }}>
      <PageHeader title={PAGE_TITLE} breadcrumbs={[{ label: "Projects" }]} />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <ProjectSummaryCards
          totalProjects={summary.totalProjects}
          atRiskProjectCount={summary.atRiskProjectCount}
          totalCbus={summary.totalCbus}
          acceptedCbus={summary.acceptedCbus}
          atRiskCbus={summary.atRiskCbus}
          valueAtRisk={summary.valueAtRisk}
        />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <ProjectFilterTabs active={filter} onChange={handleSelectFilter} counts={filterCounts} />
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white shrink-0 cursor-pointer"
            style={{ backgroundColor: C.navy }}
          >
            <Plus size={14} />
            {NEW_PROJECT_LABEL}
          </button>
        </div>

        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: monitorVisible && selectedProject ? "minmax(0,1fr) 340px" : "1fr" }}
        >
          <ProjectListTable
            projects={filteredProjects}
            selectedId={selectedProject?.id ?? null}
            onSelect={handleSelectProject}
          />
          {monitorVisible && selectedProject && (
            <ProjectMonitorPanel
              project={selectedProject}
              onResimulate={handleResimulate}
              onClose={() => setMonitorVisible(false)}
              alwaysShowResimulate
            />
          )}
        </div>
      </div>

      <CreateProjectModal
        open={showCreateModal}
        existing={[]}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
