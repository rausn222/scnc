import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { C } from "../actionDetails/theme";
import { ActionDropdown } from "./ActionDropdown";
import { ActionCommentModal } from "./ActionCommentModal";
import {
  ACTION_OPTIONS,
  type TrackingActionGroup,
  type TrackingStatus,
} from "./data";

const STATUS_BADGE: Record<TrackingStatus, { bg: string; fg: string }> = {
  Completed: { bg: "#dcfce7", fg: "#166534" },
  "In Progress": { bg: C.bgBlue, fg: C.blue },
  Pending: { bg: "#f1f5f9", fg: "#64748b" },
  Blocked: { bg: "#fee2e2", fg: "#b91c1c" },
};
type PendingAction = {
  actionId: string;
  actionName: string;
} | null;
const EXECUTION_LABEL: Record<TrackingStatus, string> = {
  Completed: "Completed",
  "In Progress": "In progress",
  Pending: "Not started",
  Blocked: "Delayed",
};

const GROUP_HEADERS = ["", "Item", "Scenario Type", "Plant", "Material", "Quantity", "Execution Action Status"];
const ACTION_HEADERS = ["Action ID", "Description", "Owner", "SLA", "Ageing", "Status", "Action",];

export function TrackingActionsList({ groups }: Readonly<{ groups: TrackingActionGroup[] }>) {
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([])); //groups.length > 0 ? [groups[0].itemNumber] :
  const [selectedActions, setSelectedActions] = useState<
    Record<string, string>
  >({});
  const [actionComments, setActionComments] = useState<
    Record<string, string>
  >({});

  const [pendingAction, setPendingAction] =
    useState<PendingAction>(null);
  const toggle = (itemNumber: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(itemNumber)) next.delete(itemNumber);
      else next.add(itemNumber);
      return next;
    });
  };
  const handleActionSubmit = (comment: string) => {
    if (!pendingAction) {
      return;
    }

    setSelectedActions((previous) => ({
      ...previous,
      [pendingAction.actionId]: pendingAction.actionName,
    }));

    setActionComments((previous) => ({
      ...previous,
      [pendingAction.actionId]: comment,
    }));

    // Replace this with the API mutation when available.
    console.log("Action submitted", {
      actionId: pendingAction.actionId,
      action: pendingAction.actionName,
      comment,
    });

    setPendingAction(null);
  };

  if (groups.length === 0) {
    return (
      <div
        className="rounded-xl bg-white flex items-center justify-center py-10 text-xs"
        style={{ border: "1px solid #e2e8f0", color: "#94a3b8" }}
      >
        No actions to show — select a project and scenario above.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
      <div className="px-4 pt-3 pb-1">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.navy }}>Actions List</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
              {GROUP_HEADERS.map((header, i) => (
                <th
                  key={header || `col-${i}`}
                  className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: "#94a3b8" }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const isOpen = expanded.has(group.itemNumber);
              const badge = STATUS_BADGE[group.executionStatus];
              return (
                <Fragment key={group.itemNumber}>
                  <tr onClick={() => toggle(group.itemNumber)} className="cursor-pointer" style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td className="pl-4 pr-1 py-3">
                      {isOpen ? (
                        <ChevronDown size={14} style={{ color: "#64748b" }} />
                      ) : (
                        <ChevronRight size={14} style={{ color: "#64748b" }} />
                      )}
                    </td>
                    <td className="px-2 py-3 text-xs font-bold" style={{ color: C.navy }}>{group.itemNumber}</td>
                    <td className="px-4 py-3 text-xs font-bold whitespace-nowrap" style={{ color: C.navy }}>{group.scenarioType}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#374151" }}>{group.plant}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#374151" }}>{group.material}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#374151" }}>{group.quantity}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                        style={{ backgroundColor: badge.bg, color: badge.fg }}
                      >
                        {EXECUTION_LABEL[group.executionStatus]}
                      </span>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={GROUP_HEADERS.length} className="p-0" style={{ backgroundColor: "#fffafc" }}>
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              {ACTION_HEADERS.map((header) => (
                                <th
                                  key={header}
                                  className="text-left pl-12 pr-4 py-2 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                                  style={{ color: "#94a3b8" }}
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {group.actions.map((action) => {
                              const actionBadge = STATUS_BADGE[action.status];
                              return (
                                <tr key={action.actionId} style={{ borderTop: "1px solid #e2e8f0" }}>
                                  <td className="pl-12 pr-4 py-2.5 text-xs font-semibold whitespace-nowrap" style={{ color: C.blue }}>
                                    {action.actionId}
                                  </td>
                                  <td className="px-4 py-2.5 text-xs" style={{ color: "#111827" }}>{action.description}</td>
                                  <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color: "#374151" }}>{action.owner}</td>
                                  <td className="px-4 py-2.5 text-xs text-center whitespace-nowrap" style={{ color: "#374151" }}>{action.sla}</td>
                                  <td className="px-2 py-2.5 text-xs text-center whitespace-nowrap" style={{ color: "#374151" }}>{action.aging}</td>
                                  <td className="px-2 py-2.5 text-center">
                                    <span
                                      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                                      style={{ backgroundColor: actionBadge?.bg, color: actionBadge?.fg }}
                                    >
                                      {action.status}
                                    </span>
                                  </td>
                                  <td
                                    className="px-2 py-2.5 whitespace-nowrap"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <ActionDropdown
                                      value={
                                        selectedActions[action.actionId] ??
                                        action.action ??
                                        ""
                                      }
                                      options={ACTION_OPTIONS}
                                      onActionRequested={(actionName) => {
                                        setPendingAction({
                                          actionId: action.actionId,
                                          actionName,
                                        });
                                      }}
                                    />

                                    {actionComments[action.actionId] && (
                                      <p
                                        className="mt-1 max-w-[150px] truncate px-1 text-[10px]"
                                        style={{ color: "#64748b" }}
                                        title={actionComments[action.actionId]}
                                      >
                                        {actionComments[action.actionId]}
                                      </p>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <ActionCommentModal
        open={pendingAction !== null}
        actionName={pendingAction?.actionName ?? null}
        actionId={pendingAction?.actionId ?? ""}
        onCancel={() => setPendingAction(null)}
        onSubmit={handleActionSubmit}
      />
    </div>
  );
}
