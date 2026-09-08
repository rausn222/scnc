import type { ExplainabilityContent, ExplainabilitySection } from "../ExplainabilityPanel";
import { fmtMoney, type DeviationActionItem, type NetworkCbuMapping, type NetworkRow } from "./networkData";

function cbuBreakdown(cbus: NetworkCbuMapping[]) {
  const counts = new Map<string, number>();
  let discontinued = 0;
  for (const cbu of cbus) {
    counts.set(cbu.status, (counts.get(cbu.status) ?? 0) + 1);
    if (!cbu.newCode) discontinued += 1;
  }
  return { counts, discontinued, total: cbus.length };
}

function blockedCount(deviations: DeviationActionItem[]): number {
  return deviations.filter((d) => d.status === "Blocked").length;
}

function buildSingleNetworkSummary(row: NetworkRow, blocked: number): string {
  const deviationCount = row.deviationCount ?? 0;
  const bits: string[] = [
    `${row.networkId} (${row.projectName}) is ${row.status} and ${row.progressPct}% complete.`,
  ];

  if (deviationCount > 0) {
    const blockedNote = blocked > 0 ? ` (${blocked} blocked)` : "";
    const verb = deviationCount === 1 ? "is" : "are";
    bits.push(
      `${deviationCount} open deviation${deviationCount === 1 ? "" : "s"}${blockedNote} ${verb} putting ${fmtMoney(row.businessWaste)} of business waste at risk ahead of the ${row.productionStopDate} production stop.`,
    );
  } else if (row.status === "Draft") {
    bits.push("No scenario has been selected yet — work hasn't started.");
  } else if (row.progressPct >= 100) {
    bits.push(
      (row.savings ?? 0) > 0
        ? `Fully executed with ${fmtMoney(row.savings)} in savings realised.`
        : "Fully executed — no further action needed.",
    );
  } else {
    bits.push(
      (row.savings ?? 0) > 0
        ? `No open deviations — on track for ${fmtMoney(row.savings)} in savings.`
        : "No open deviations reported.",
    );
  }

  return bits.join(" ");
}

function buildSingleNetworkSections(row: NetworkRow, blocked: number): ExplainabilitySection[] {
  const sections: ExplainabilitySection[] = [];
  const deviations = row.deviationDetails ?? [];
  const deviationCount = row.deviationCount ?? 0;

  if (deviationCount > 0) {
    sections.push({
      id: "deviations",
      label: "Deviations",
      tone: "critical",
      bullets: [
        `${deviationCount} open deviation${deviationCount === 1 ? "" : "s"}${blocked > 0 ? `, ${blocked} currently blocked` : ""}.`,
        ...deviations.map((d) => `${d.status}: ${d.description} (owner: ${d.owner}).`),
      ],
    });
  }

  const { counts, discontinued, total } = cbuBreakdown(row.cbus);
  if (total > 0) {
    const byStatus = Array.from(counts.entries())
      .map(([status, n]) => `${n} ${status}`)
      .join(", ");
    const cbuBullets = [`${total} old CBU${total === 1 ? "" : "s"} connected: ${byStatus}.`];
    if (discontinued > 0) {
      cbuBullets.push(
        `${discontinued} CBU${discontinued === 1 ? "" : "s"} being discontinued with no replacement mapped.`,
      );
    }
    sections.push({
      id: "actions",
      label: "Actions & Connected CBUs",
      tone: discontinued > 0 ? "warning" : "neutral",
      bullets: cbuBullets,
    });
  }

  const progressBullets: string[] = [];
  if (row.progressPct >= 100) {
    progressBullets.push("Execution is complete — all actions closed out.");
  } else if (row.progressPct === 0) {
    progressBullets.push(
      row.status === "Draft" ? "Still in draft — no scenario selected yet." : "No progress recorded yet.",
    );
  } else {
    progressBullets.push(`${row.progressPct}% of actions complete.`);
  }
  if (row.productionStopDate && row.productionStopDate !== "—") {
    progressBullets.push(`Production stop scheduled for ${row.productionStopDate}.`);
  }
  sections.push({
    id: "progress",
    label: "Progress",
    tone: row.progressPct >= 100 ? "positive" : deviationCount > 0 ? "warning" : "neutral",
    bullets: progressBullets,
  });

  if (row.businessWaste != null) {
    const financeBullets = [`Selected scenario: ${row.selectedScenario}.`];
    financeBullets.push(
      (row.savings ?? 0) > 0
        ? `Saves ${fmtMoney(row.savings)} vs. taking no action (residual waste ${fmtMoney(row.businessWaste)}).`
        : `Business waste: ${fmtMoney(row.businessWaste)}.`,
    );
    sections.push({ id: "financial", label: "Financial Impact", tone: "neutral", bullets: financeBullets });
  }

  return sections;
}

function buildPortfolioContent(rows: NetworkRow[]): ExplainabilityContent {
  const total = rows.length;
  if (total === 0) {
    return {
      subjectLabel: "All Networks",
      subjectSub: "0 networks in view",
      summary: "No networks match the current filters.",
      sections: [],
    };
  }

  const withDeviations = rows.filter((r) => (r.deviationCount ?? 0) > 0);
  const totalAtRisk = withDeviations.reduce((sum, r) => sum + (r.businessWaste ?? 0), 0);
  const avgProgress = Math.round(rows.reduce((sum, r) => sum + r.progressPct, 0) / total);
  const complete = rows.filter((r) => r.status === "Complete").length;
  const draft = rows.filter((r) => r.status === "Draft").length;
  const totalOldCbus = rows.reduce((sum, r) => sum + r.oldCbuCount, 0);
  const sortedByRisk = [...withDeviations].sort((a, b) => (b.businessWaste ?? 0) - (a.businessWaste ?? 0));

  const sections: ExplainabilitySection[] = [];

  if (withDeviations.length > 0) {
    sections.push({
      id: "deviations",
      label: "Deviations",
      tone: "critical",
      bullets: [
        `${withDeviations.length} of ${total} network${total === 1 ? "" : "s"} have open deviations, totaling ${fmtMoney(totalAtRisk)} at risk.`,
        ...sortedByRisk
          .slice(0, 3)
          .map(
            (r) =>
              `${r.networkId} — ${r.deviationCount} deviation${r.deviationCount === 1 ? "" : "s"}, ${fmtMoney(r.businessWaste)} at risk.`,
          ),
      ],
    });
  }

  sections.push({
    id: "actions",
    label: "Actions & Connected CBUs",
    tone: "neutral",
    bullets: [`${totalOldCbus} old CBU${totalOldCbus === 1 ? "" : "s"} being transitioned across ${total} network${total === 1 ? "" : "s"}.`],
  });

  sections.push({
    id: "progress",
    label: "Progress",
    tone: avgProgress >= 70 ? "positive" : "neutral",
    bullets: [
      `Portfolio is ${avgProgress}% complete on average.`,
      `${complete} network${complete === 1 ? "" : "s"} fully complete, ${draft} still in draft.`,
    ],
  });

  const summary =
    withDeviations.length > 0
      ? `${withDeviations.length} of ${total} network${total === 1 ? "" : "s"} have open deviations totaling ${fmtMoney(totalAtRisk)} at risk, led by ${sortedByRisk[0].networkId}. Overall progress is ${avgProgress}% complete.`
      : `All ${total} network${total === 1 ? "" : "s"} in view are free of open deviations. Overall progress is ${avgProgress}% complete.`;

  return {
    subjectLabel: "All Networks",
    subjectSub: `${total} network${total === 1 ? "" : "s"} in view`,
    summary,
    sections,
  };
}

/** Builds the Explainability panel's content from whatever the page is
 * currently showing: pass the focused row when the user has drilled into a
 * single network, or `null` to summarize the full (filtered) set. */
export function buildNetworkExplainability(
  rows: NetworkRow[],
  focusedRow: NetworkRow | null,
): ExplainabilityContent {
  if (!focusedRow) return buildPortfolioContent(rows);

  const blocked = blockedCount(focusedRow.deviationDetails ?? []);
  return {
    subjectLabel: focusedRow.networkId,
    subjectSub: focusedRow.projectName,
    summary: buildSingleNetworkSummary(focusedRow, blocked),
    sections: buildSingleNetworkSections(focusedRow, blocked),
  };
}
