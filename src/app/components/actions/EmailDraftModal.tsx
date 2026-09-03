import { useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Bold,
  FileEdit,
  Inbox,
  Italic,
  List,
  ListOrdered,
  Mail,
  Maximize2,
  Minimize2,
  Search,
  Send,
  Strikethrough,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import type { ActionRow } from "./actionsData";
import { formatRoute, scenarioLabel } from "./actionsData";

interface Props {
  row: ActionRow;
  onClose: () => void;
  onSend: (payload: { to: string; subject: string; body: string }) => void;
}

type Tab = "inbox" | "sent" | "drafts";

const FROM_ADDRESS = "controltower.notifications@company.com";

const EMAIL_BODY_STYLES = `
.email-body-rich table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12.5px; }
.email-body-rich th, .email-body-rich td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; vertical-align: top; }
.email-body-rich th { background: #f3f4f6; font-weight: 600; color: #374151; }
.email-body-rich p { margin: 0 0 10px; }
.email-body-rich ul, .email-body-rich ol { margin: 0 0 10px; padding-left: 20px; }
.email-body-rich:focus { outline: none; }
`;

function ownerEmail(owner: string) {
  return `${owner.trim().toLowerCase().replace(/\s+/g, ".")}@company.com`;
}

function defaultSubject(row: ActionRow) {
  return `Action Required: ${row.actionId} — ${row.description}`;
}

function buildBodyHtml(row: ActionRow) {
  return [
    `<p>Dear ${row.owner},</p>`,
    `<p>Hope you are doing well.</p>`,
    `<p>The following action requires your attention:</p>`,
    `<table><thead><tr>`,
    `<th>Action ID</th><th>Scenario</th><th>Plant</th><th>Material</th><th>Quantity</th><th>SLA</th><th>Ageing</th><th>Status</th>`,
    `</tr></thead><tbody><tr>`,
    `<td>${row.actionId}</td>`,
    `<td>${scenarioLabel(row.scenarioType, row.seq)}</td>`,
    `<td>${formatRoute(row.plant)}</td>`,
    `<td>${row.material}</td>`,
    `<td>${row.quantity}</td>`,
    `<td>${row.slaHrs} hrs</td>`,
    `<td>${row.ageingDays !== null ? `${row.ageingDays} day(s)` : "—"}</td>`,
    `<td>${row.status}</td>`,
    `</tr></tbody></table>`,
    `<p>${row.description}. Can you please confirm the current status and share next steps? This will impact the network schedule.</p>`,
    `<p>Regards,<br>Supply Chain Control Tower</p>`,
  ].join("");
}

function ToolbarButton({
  title,
  onClick,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex items-center justify-center w-7 h-7 rounded-md transition-colors cursor-pointer"
      style={{ color: danger ? "#dc2626" : "#4b5563" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = danger ? "#fee2e2" : "#e5e7eb";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
      }}
    >
      {children}
    </button>
  );
}

function ToolbarTextButton({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
      style={{ color: "#4b5563", border: "1px solid #d1d5db", backgroundColor: "#ffffff" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = "#f3f4f6";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = "#ffffff";
      }}
    >
      {title}
    </button>
  );
}

function FieldRow({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 px-6 py-2.5"
      style={{ borderBottom: last ? undefined : "1px solid #f1f5f9" }}
    >
      <span
        className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wide"
        style={{ color: "#9ca3af" }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

export function EmailDraftModal({ row, onClose, onSend }: Props) {
  const [to, setTo] = useState(ownerEmail(row.owner));
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(defaultSubject(row));
  const [tab, setTab] = useState<Tab>("drafts");
  const [search, setSearch] = useState("");
  const [maximized, setMaximized] = useState(false);
  const [initialBodyHtml] = useState(() => buildBodyHtml(row));
  const bodyRef = useRef<HTMLDivElement>(null);

  const canSend = to.trim() !== "" && subject.trim() !== "";
  const draftMatches = subject.toLowerCase().includes(search.toLowerCase().trim());

  function exec(command: string, value?: string) {
    bodyRef.current?.focus();
    document.execCommand(command, false, value);
  }

  function withTable(fn: (table: HTMLTableElement) => void) {
    const table = bodyRef.current?.querySelector("table");
    if (table) fn(table as HTMLTableElement);
  }

  function addRow() {
    withTable((table) => {
      const tbody = table.tBodies[0];
      if (!tbody) return;
      const cols = table.tHead?.rows[0]?.cells.length ?? tbody.rows[0]?.cells.length ?? 1;
      const newRow = tbody.insertRow();
      for (let i = 0; i < cols; i++) newRow.insertCell().innerHTML = "&nbsp;";
    });
  }

  function removeRow() {
    withTable((table) => {
      const tbody = table.tBodies[0];
      if (tbody && tbody.rows.length > 1) tbody.deleteRow(-1);
    });
  }

  function addCol() {
    withTable((table) => {
      table.querySelectorAll("tr").forEach((tr) => {
        const isHeaderRow = tr.closest("thead") !== null;
        const cell = document.createElement(isHeaderRow ? "th" : "td");
        cell.innerHTML = "&nbsp;";
        tr.appendChild(cell);
      });
    });
  }

  function removeCol() {
    withTable((table) => {
      table.querySelectorAll("tr").forEach((tr) => {
        if (tr.cells.length > 1) tr.deleteCell(-1);
      });
    });
  }

  function insertTable() {
    exec(
      "insertHTML",
      `<table><thead><tr><th>Column 1</th><th>Column 2</th></tr></thead><tbody><tr><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table><p><br></p>`,
    );
  }

  function deleteTable() {
    withTable((table) => table.remove());
  }

  function handleComposeNew() {
    setTo(ownerEmail(row.owner));
    setCc("");
    setSubject(defaultSubject(row));
    if (bodyRef.current) bodyRef.current.innerHTML = buildBodyHtml(row);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,48,135,0.18)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <style>{EMAIL_BODY_STYLES}</style>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col overflow-hidden"
        style={{
          width: maximized ? "98vw" : "min(94vw, 1180px)",
          height: maximized ? "94vh" : "84vh",
          backgroundColor: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 60px rgba(0,48,135,0.18), 0 4px 16px rgba(0,0,0,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-3 shrink-0 flex items-center justify-between gap-4"
          style={{ background: "linear-gradient(135deg, #003087 0%, #1565C0 100%)" }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <Mail size={15} color="#ffffff" />
            </div>
            <div className="min-w-0">
              <p
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Email Center
              </p>
              <h2 className="font-bold text-white truncate" style={{ fontSize: 15 }}>
                {row.owner}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleComposeNew}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors"
              style={{ backgroundColor: "#ffffff", color: "#1565C0" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#eff6ff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#ffffff";
              }}
            >
              <FileEdit size={12} />
              Compose New Email
            </button>
            <button
              onClick={() => setMaximized((m) => !m)}
              className="flex items-center justify-center w-7 h-7 rounded-full transition-colors shrink-0"
              style={{ color: "rgba(255,255,255,0.65)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.15)";
                (e.currentTarget as HTMLElement).style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)";
              }}
            >
              {maximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-full transition-colors shrink-0"
              style={{ color: "rgba(255,255,255,0.65)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.15)";
                (e.currentTarget as HTMLElement).style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)";
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div
            className="w-60 shrink-0 flex flex-col"
            style={{ borderRight: "1px solid #e2e8f0", backgroundColor: "#fafbfc" }}
          >
            <div className="p-3">
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md"
                style={{ border: "1px solid #d1d5db", backgroundColor: "#ffffff" }}
              >
                <Search size={13} color="#9ca3af" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search emails..."
                  className="flex-1 min-w-0 text-xs focus:outline-none"
                  style={{ color: "#111827" }}
                />
              </div>
            </div>

            <div className="flex items-center px-2" style={{ borderBottom: "1px solid #e2e8f0" }}>
              {(
                [
                  { key: "inbox" as Tab, label: "Inbox", icon: Inbox },
                  { key: "sent" as Tab, label: "Sent", icon: Send },
                  { key: "drafts" as Tab, label: "Drafts", icon: FileEdit },
                ]
              ).map(({ key, label, icon: Icon }) => {
                const active = tab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold cursor-pointer transition-colors"
                    style={{
                      color: active ? "#1565C0" : "#9ca3af",
                      borderBottom: active ? "2px solid #1565C0" : "2px solid transparent",
                    }}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto">
              {tab !== "drafts" && (
                <div className="flex flex-col items-center justify-center gap-1.5 py-10 px-4 text-center">
                  <span
                    className="flex items-center justify-center w-9 h-9 rounded-full"
                    style={{ backgroundColor: "#f1f5f9" }}
                  >
                    <Mail size={14} color="#cbd5e1" />
                  </span>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>
                    No emails yet
                  </p>
                </div>
              )}

              {tab === "drafts" && draftMatches && (
                <button
                  type="button"
                  className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left cursor-pointer"
                  style={{ backgroundColor: "#eff6ff", borderBottom: "1px solid #e2e8f0" }}
                >
                  <span
                    className="flex items-center justify-center w-7 h-7 rounded-md shrink-0 mt-0.5"
                    style={{ backgroundColor: "#fef3c7" }}
                  >
                    <FileEdit size={12} color="#d97706" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "#111827" }}>
                      {subject || "(no subject)"}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#9ca3af" }}>
                      Draft · edited just now
                    </p>
                  </div>
                </button>
              )}

              {tab === "drafts" && !draftMatches && (
                <div className="flex flex-col items-center justify-center gap-1.5 py-10 px-4 text-center">
                  <p className="text-xs" style={{ color: "#9ca3af" }}>
                    No drafts match "{search}"
                  </p>
                </div>
              )}
            </div>

            <div
              className="flex items-center gap-3 px-3 py-2.5 text-[11px]"
              style={{ borderTop: "1px solid #e2e8f0", color: "#6b7280" }}
            >
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#22c55e" }} />
                0 received
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#1565C0" }} />
                0 sent
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
                {draftMatches ? 1 : 0} draft{draftMatches ? "" : "s"}
              </span>
            </div>
          </div>

          {/* Compose panel */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center gap-3 px-6 pt-4 pb-3 shrink-0">
              <FileEdit size={15} color="#9ca3af" className="shrink-0" />
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="flex-1 min-w-0 font-bold focus:outline-none"
                style={{ fontSize: 16, color: "#111827" }}
              />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  style={{ color: "#374151", border: "1px solid #d1d5db", backgroundColor: "#ffffff" }}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={!canSend}
                  onClick={() =>
                    canSend &&
                    onSend({ to, subject, body: bodyRef.current?.innerHTML ?? "" })
                  }
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#003087" }}
                >
                  <Send size={12} />
                  Send Email
                </button>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #e2e8f0" }}>
              <FieldRow label="From">
                <span className="text-sm" style={{ color: "#6b7280" }}>
                  {FROM_ADDRESS}
                </span>
              </FieldRow>
              <FieldRow label="To">
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="flex-1 min-w-0 text-sm focus:outline-none"
                  style={{ color: "#111827" }}
                />
              </FieldRow>
              <FieldRow label="Cc" last>
                <input
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@example.com"
                  className="flex-1 min-w-0 text-sm focus:outline-none"
                  style={{ color: "#111827" }}
                />
              </FieldRow>
            </div>

            {/* Toolbar */}
            <div
              className="flex items-center gap-1 px-4 py-1.5 shrink-0"
              style={{ borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", backgroundColor: "#f9fafb" }}
            >
              <ToolbarButton title="Bold" onClick={() => exec("bold")}>
                <Bold size={13} />
              </ToolbarButton>
              <ToolbarButton title="Italic" onClick={() => exec("italic")}>
                <Italic size={13} />
              </ToolbarButton>
              <ToolbarButton title="Strikethrough" onClick={() => exec("strikeThrough")}>
                <Strikethrough size={13} />
              </ToolbarButton>
              <span className="w-px h-4 mx-1" style={{ backgroundColor: "#e5e7eb" }} />
              <ToolbarButton title="Bullet list" onClick={() => exec("insertUnorderedList")}>
                <List size={13} />
              </ToolbarButton>
              <ToolbarButton title="Numbered list" onClick={() => exec("insertOrderedList")}>
                <ListOrdered size={13} />
              </ToolbarButton>
              <span className="w-px h-4 mx-1" style={{ backgroundColor: "#e5e7eb" }} />
              <ToolbarButton title="Insert table" onClick={insertTable}>
                <Table2 size={13} />
              </ToolbarButton>
              <ToolbarTextButton title="+Row" onClick={addRow} />
              <ToolbarTextButton title="+Col" onClick={addCol} />
              <ToolbarTextButton title="-Row" onClick={removeRow} />
              <ToolbarTextButton title="-Col" onClick={removeCol} />
              <ToolbarButton title="Delete table" onClick={deleteTable} danger>
                <Trash2 size={13} />
              </ToolbarButton>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div
                ref={bodyRef}
                contentEditable
                suppressContentEditableWarning
                className="email-body-rich"
                style={{ fontSize: 13.5, lineHeight: 1.7, color: "#1f2937" }}
                dangerouslySetInnerHTML={{ __html: initialBodyHtml }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
