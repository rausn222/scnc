import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { AIAnalysisPanel, buildAnalysisSteps } from "../components/actionDetails/AIAnalysisPanel";
import { ActionTaskList } from "../components/actionDetails/ActionTaskList";
import { C } from "../components/actionDetails/theme";
import type { AcceptedScenarioDetails } from "../App";

interface Props {
  scenario: AcceptedScenarioDetails;
  onBack: () => void;
}

export default function ActionDetails({ scenario, onBack }: Readonly<Props>) {
  const analysisSteps = useMemo(() => buildAnalysisSteps(scenario), [scenario]);
  const [analysisDone, setAnalysisDone] = useState(true);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: "#f5f7fa" }}>
      <PageHeader
        title="Action Details"
        breadcrumbs={[
          { label: "Scenario Comparison", onClick: onBack },
          { label: scenario.name },
        ]}
      />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-semibold cursor-pointer"
          style={{ color: C.blue }}
        >
          <ChevronLeft size={14} />
          Back to Scenario Comparison
        </button>

        {/* <AIAnalysisPanel steps={analysisSteps} onComplete={() => setAnalysisDone(true)} /> */}

        {analysisDone && <ActionTaskList scenario={scenario} />}
      </div>
    </div>
  );
}
