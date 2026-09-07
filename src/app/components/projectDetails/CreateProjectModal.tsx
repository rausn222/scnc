import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { C, NEW_PROJECT_STATUS_OPTIONS } from "../../constants/projectDetails";
import type { NewProjectRecord, NewProjectStatus, NewProjectPriority } from "./types";
import { Field, TextInput, TextArea, DateInput, SelectInput } from "./FormFields";
import { downloadSampleTemplate, makeNewProjectId, parseTemplateFile } from "./templateImport";
import { cbuData } from "../data";

const emptyForm = {
  name: "",
  description: "",
  owner: "",
  startDate: "",
  targetDate: "",
  status: "Not Started" as NewProjectStatus,
  priority: "Medium" as NewProjectPriority,
};

interface CbuTransitionRow {
  id: string;
  oldCodes: string[];
  newCodes: string[];
  discontinued: boolean;
}

function makeEmptyTransition(): CbuTransitionRow {
  return {
    id: `cbu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    oldCodes: [],
    newCodes: [],
    discontinued: false,
  };
}

interface CbuOption {
  value: string;
  label: string;
  description: string;
}

const cbuOptions: CbuOption[] = Array.from(
  new Map(
    cbuData.map((item: any) => [
      item.cbuCode,
      {
        value: item.cbuCode,
        label: item.cbuCode,
        description: item.cbuDescription,
      },
    ])
  ).values()
);

interface Props {
  open: boolean;
  existing: NewProjectRecord[];
  onClose: () => void;
  onCreated: (records: NewProjectRecord[]) => void;
}

interface CbuMultiSelectProps {
  value: string[];
  options: CbuOption[];
  excludedValues: string[];
  placeholder: string;
  disabled?: boolean;
  maxSelections?: number;
  onChange: (values: string[]) => void;
}

function CbuMultiSelect({
  value,
  options,
  excludedValues,
  placeholder,
  disabled = false,
  maxSelections,
  onChange,
}: CbuMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const availableOptions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return options.filter((option) => {
      const isExcluded =
        excludedValues.includes(option.value) &&
        !value.includes(option.value);

      if (isExcluded) return false;

      if (!normalizedSearch) return true;

      return (
        option.label.toLowerCase().includes(normalizedSearch) ||
        option.description.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [options, excludedValues, value, search]);

  function toggleOption(code: string) {
    if (value.includes(code)) {
      onChange(value.filter((selectedCode) => selectedCode !== code));
      return;
    }

    if (maxSelections && value.length >= maxSelections) {
      return;
    }

    onChange([...value, code]);
  }

  function removeOption(
    event: React.MouseEvent<HTMLButtonElement>,
    code: string
  ) {
    event.stopPropagation();
    onChange(value.filter((selectedCode) => selectedCode !== code));
  }

  const selectionLimitReached =
    maxSelections !== undefined && value.length >= maxSelections;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="w-full min-h-11 px-3 py-2 rounded-lg flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:bg-gray-100"
        style={{
          border: "1px solid #cbd5e1",
          backgroundColor: disabled ? "#f8fafc" : "#ffffff",
        }}
      >
        <div className="flex flex-1 flex-wrap gap-1.5">
          {value.length === 0 ? (
            <span className="text-sm" style={{ color: "#94a3b8" }}>
              {placeholder}
            </span>
          ) : (
            value.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: C.bgBlue,
                  color: C.blue,
                  border: `1px solid ${C.borderBlue}`,
                }}
              >
                {code}

                {!disabled && (
                  <button
                    type="button"
                    aria-label={`Remove ${code}`}
                    onClick={(event) => removeOption(event, code)}
                    className="rounded-sm hover:bg-blue-100"
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            ))
          )}
        </div>

        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""
            }`}
          style={{ color: "#64748b" }}
        />
      </button>

      {open && !disabled && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg bg-white shadow-xl"
          style={{ border: "1px solid #cbd5e1" }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ borderBottom: "1px solid #e2e8f0" }}
          >
            <Search size={15} style={{ color: "#94a3b8" }} />

            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search CBU code or description"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <div className="max-h-60 overflow-y-auto p-1">
            {availableOptions.length === 0 ? (
              <div
                className="px-3 py-4 text-center text-xs"
                style={{ color: "#64748b" }}
              >
                No available CBU codes
              </div>
            ) : (
              availableOptions.map((option) => {
                const selected = value.includes(option.value);
                const optionDisabled =
                  !selected && selectionLimitReached;

                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={optionDisabled}
                    onClick={() => toggleOption(option.value)}
                    className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span
                      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded"
                      style={{
                        border: `1px solid ${selected ? C.blue : "#cbd5e1"
                          }`,
                        backgroundColor: selected
                          ? C.blue
                          : "#ffffff",
                      }}
                    >
                      {selected && (
                        <Check size={11} color="#ffffff" />
                      )}
                    </span>

                    <span className="min-w-0">
                      <span
                        className="block text-xs font-semibold"
                        style={{ color: "#1e293b" }}
                      >
                        {option.label}
                      </span>

                      <span
                        className="block truncate text-[11px]"
                        style={{ color: "#64748b" }}
                      >
                        {option.description}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {maxSelections === 1 && (
            <div
              className="px-3 py-2 text-[11px]"
              style={{
                color: "#64748b",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              Only one code can be selected because the opposite side
              has multiple selections.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CreateProjectModal({ open, existing, onClose, onCreated }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [transitions, setTransitions] = useState<CbuTransitionRow[]>([makeEmptyTransition()]);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const hasCbuTransition = transitions.some(
    (transition) => transition.oldCodes.length > 0
  );
  const formStarted = form.name.trim() !== "" || hasCbuTransition;
  const validTransitions = transitions.filter(
    (transition) => transition.oldCodes.length > 0
  );

  const manualValid =
    form.name.trim().length > 0 &&
    validTransitions.length > 0;

  const canSubmit = manualValid || file !== null;


  function updateField<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateTransitionField<K extends keyof CbuTransitionRow>(id: string, key: K, value: CbuTransitionRow[K]) {
    setTransitions((rows) => rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  }

  function toggleDiscontinued(id: string, discontinued: boolean) {
    setTransitions((rows) =>
      rows.map((row) =>
        row.id === id
          ? {
            ...row,
            discontinued,
            newCodes: discontinued ? [] : row.newCodes,
          }
          : row
      )
    );
  }

  function addTransitionRow() {
    setTransitions((rows) => [...rows, makeEmptyTransition()]);
  }

  function removeTransitionRow(id: string) {
    setTransitions((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
  }

  function clearTransitionRow(id: string) {
    setTransitions((rows) => rows.map((r) => (r.id === id ? { ...makeEmptyTransition(), id } : r)));
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function resetForm() {
    setForm(emptyForm);
    setTransitions([makeEmptyTransition()]);
    clearFile();
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!canSubmit) {
      toast.error(
        "Enter a Project Name and select at least one Old CBU, or upload a completed project template."
      );
      return;
    }

    if (file) {
      setParsing(true);

      try {
        const rows = await parseTemplateFile(file);

        if (rows.length === 0) {
          toast.error(
            "No valid project rows were found in the uploaded file."
          );
          return;
        }

        const created: NewProjectRecord[] = [];
        let pool = [...existing];

        for (const row of rows) {
          const id = makeNewProjectId(pool);

          const project: NewProjectRecord = {
            ...row,
            id,
            source: "Excel",
            createdAt: new Date().toISOString(),
          };

          pool = [project, ...pool];
          created.push(project);
        }

        onCreated(created);

        toast.success(
          rows.length > 1
            ? `${rows.length} projects created from the template.`
            : "Project created from the template."
        );

        handleClose();
      } catch {
        toast.error(
          "Could not read the uploaded file. Please check the template format."
        );
      } finally {
        setParsing(false);
      }

      return;
    }

    const projectTransitions = transitions
      .filter((transition) => transition.oldCodes.length > 0)
      .map((transition) => ({
        id: transition.id,
        oldCodes: transition.oldCodes,
        newCodes: transition.newCodes,
        discontinued: transition.discontinued,
      }));

    const id = makeNewProjectId(existing);

    const project: NewProjectRecord = {
      ...form,
      id,
      transitions: projectTransitions,
      source: "Manual",
      createdAt: new Date().toISOString(),
    };

    onCreated([project]);
    toast.success("Project created successfully.");
    handleClose();
  }

  function updateOldCodes(id: string, oldCodes: string[]) {
    setTransitions((rows) =>
      rows.map((row) => {
        if (row.id !== id) return row;

        const filteredOldCodes = oldCodes.filter(
          (code) => !row.newCodes.includes(code)
        );

        // If Old becomes multiple, New must contain no more than one item.
        const normalizedNewCodes =
          filteredOldCodes.length > 1
            ? row.newCodes.slice(0, 1)
            : row.newCodes;

        return {
          ...row,
          oldCodes: filteredOldCodes,
          newCodes: normalizedNewCodes,
        };
      })
    );
  }

  function updateNewCodes(id: string, newCodes: string[]) {
    setTransitions((rows) =>
      rows.map((row) => {
        if (row.id !== id) return row;

        const filteredNewCodes = newCodes.filter(
          (code) => !row.oldCodes.includes(code)
        );

        // If New becomes multiple, Old must contain no more than one item.
        const normalizedOldCodes =
          filteredNewCodes.length > 1
            ? row.oldCodes.slice(0, 1)
            : row.oldCodes;

        return {
          ...row,
          oldCodes: normalizedOldCodes,
          newCodes: filteredNewCodes,
        };
      })
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden max-h-[95vh] flex flex-col"
        style={{ border: "1px solid #e2e8f0" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <div>
            <p className="text-sm font-bold tracking-wide uppercase" style={{ color: C.navy }}>
              Create New Project
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
              Fill in the basic info below, or download the template, update it, and upload it. Either path is enough to create a project.
            </p>
          </div>
          <button type="button" onClick={handleClose} aria-label="Close" className="shrink-0 p-1 rounded hover:bg-gray-100 cursor-pointer">
            <X size={16} style={{ color: "#94a3b8" }} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: C.navy }}>
                Basic Info
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Project Name" span={2}>
                  <TextInput
                    value={form.name}
                    onChange={(v) => updateField("name", v)}
                    placeholder="e.g. West Region RM Consolidation"
                    disabled={!!file}
                  />
                </Field>
                {/* <Field label="Description" span={2}>
                  <TextArea
                    value={form.description}
                    onChange={(v) => updateField("description", v)}
                    placeholder="Short description of the project scope and goal"
                    disabled={!!file}
                  />
                </Field>
                <Field label="Owner">
                  <TextInput
                    value={form.owner}
                    onChange={(v) => updateField("owner", v)}
                    placeholder="e.g. A. Sharma"
                    disabled={!!file}
                  />
                </Field>
                <Field label="Status">
                  <SelectInput
                    value={form.status}
                    onChange={(v) => updateField("status", v as NewProjectStatus)}
                    options={NEW_PROJECT_STATUS_OPTIONS}
                    disabled={!!file}
                  />
                </Field> */}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: C.navy }}>
                CBU Transitions
              </p>
              <p className="text-xs mb-3" style={{ color: "#64748b" }}>
                At least one Old CBU is required — New CBU is optional.
              </p>

              <div className="space-y-3">
                {transitions.map((t, idx) => (
                  <div
                    key={t.id}
                    className="rounded-xl p-3.5"
                    style={{
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#fafbfc",
                    }}
                  >
                    <div className="grid grid-cols-[28px_minmax(240px,1fr)_20px_minmax(240px,1fr)_auto] items-center gap-3">
                      {/* Serial number */}
                      <div className="flex items-center justify-center">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: C.navy }}
                        >
                          {idx + 1}
                        </span>
                      </div>

                      {/* Old CBU */}
                      <CbuMultiSelect
                        value={t.oldCodes}
                        options={cbuOptions}
                        excludedValues={t.newCodes}
                        placeholder="Select Old CBU Code"
                        disabled={!!file}
                        maxSelections={t.newCodes.length > 1 ? 1 : undefined}
                        onChange={(codes) => updateOldCodes(t.id, codes)}
                      />

                      {/* Arrow */}
                      <ArrowRight
                        size={16}
                        style={{ color: "#94a3b8" }}
                      />

                      {/* New CBU */}
                      <CbuMultiSelect
                        value={t.newCodes}
                        options={cbuOptions}
                        excludedValues={t.oldCodes}
                        placeholder={
                          t.discontinued
                            ? "Not applicable"
                            : "Select New CBU Code"
                        }
                        disabled={!!file || t.discontinued}
                        maxSelections={t.oldCodes.length > 1 ? 1 : undefined}
                        onChange={(codes) => updateNewCodes(t.id, codes)}
                      />

                      {/* Row actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* <label
          className="flex items-center gap-1.5 text-xs whitespace-nowrap"
          style={{
            color: "#374151",
            cursor: file ? "not-allowed" : "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={t.discontinued}
            onChange={(e) =>
              toggleDiscontinued(t.id, e.target.checked)
            }
            disabled={!!file}
            style={{
              cursor: file ? "not-allowed" : "pointer",
            }}
          />
          Discontinued
        </label> */}

                        <button
                          type="button"
                          onClick={() => clearTransitionRow(t.id)}
                          title="Clear row"
                          disabled={!!file}
                          className="p-1 rounded hover:bg-gray-100 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <RotateCcw size={13} style={{ color: "#94a3b8" }} />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeTransitionRow(t.id)}
                          disabled={transitions.length === 1 || !!file}
                          title={
                            transitions.length === 1
                              ? "At least one CBU is required"
                              : "Remove row"
                          }
                          className="p-1 rounded hover:bg-gray-100 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={13} style={{ color: "#94a3b8" }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addTransitionRow}
                disabled={!!file}
                className="flex items-center gap-1.5 mt-3 text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ color: C.blue }}
              >
                <Plus size={14} />
                Add CBU Transition Row
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: "#e2e8f0" }} />
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                Or
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: "#e2e8f0" }} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: C.navy }}>
                Upload Project Template
              </p>
              <div
                className="rounded-lg p-4 flex flex-wrap items-center gap-3"
                style={{ border: `1.5px dashed ${C.borderBlue}`, backgroundColor: C.bgBlue }}
              >
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
                  style={{ backgroundColor: "#ffffff", color: C.blue, border: `1px solid ${C.borderBlue}` }}
                >
                  <Download size={14} />
                  Download Sample Template
                </button>

                <label
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
                  style={{ backgroundColor: C.blue, color: "#ffffff" }}
                >
                  <Upload size={14} />
                  Upload Updated Template
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                    disabled={formStarted}
                  />
                </label>

                {file ? (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                    style={{ backgroundColor: "#ffffff", border: "1px solid #d1d5db", color: "#374151" }}
                  >
                    <FileSpreadsheet size={14} style={{ color: C.blue }} />
                    <span className="max-w-[220px] truncate">{file.name}</span>
                    <button type="button" onClick={clearFile} aria-label="Remove file" className="cursor-pointer">
                      <X size={13} style={{ color: "#94a3b8" }} />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs" style={{ color: "#64748b" }}>
                    Accepts .xlsx / .xls files matching the sample template.
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                style={{ color: "#64748b", border: "1px solid #d1d5db" }}
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={!canSubmit || parsing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: C.navy }}
              >
                <Plus size={14} />
                {parsing ? "Creating" : "Create New Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
