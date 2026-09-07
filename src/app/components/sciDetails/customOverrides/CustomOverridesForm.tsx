import React, { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ChevronsDown,
  ChevronsUp,
  Copy,
  Download,
  Info,
  Pencil,
  Plus,
  RotateCcw,
  Upload,
  X,
  Zap,
} from "lucide-react";
import type { CustomOverrideRow, PlantGroup, CompBreakdownRow } from "../types";
import { C } from "../constants";
import {
  getBaselineTypeConversionFactor,
  CUSTOM_OVERRIDE_TYPE_OPTIONS,
  downloadCustomOverridesExcel,
  parseCustomOverridesExcel,
  buildBaselineScenario,
  CUSTOM_OVERRIDE_TEMPLATE_HEADERS,
} from "./customOverridesUtils";

const FIELD_COL_WIDTH = 120;
const COMPONENT_COL_WIDTH = 112;
const ADD_COL_WIDTH = 40;

export type ComponentMetricKey =
  | "onHandStock"
  | "openPOQty"
  | "supplierStock"
  | "inTransitStock"
  | "stvStock"
  | "conversionFactor";

const COMPONENT_METRIC_DEFS: Record<
  ComponentMetricKey,
  { label: string; required?: boolean; title: string }
> = {
  onHandStock: { label: "On-hand Stock", required: true, title: "On-hand stock quantity for this plant & component" },
  openPOQty: { label: "Open PO Qty", title: "Open PO quantity for this plant & component" },
  supplierStock: { label: "Supplier Stock", title: "Supplier stock for this plant & component" },
  inTransitStock: { label: "In Transit Stock", title: "In-transit stock quantity for this plant & component" },
  stvStock: { label: "STV Stock", title: "STV stock quantity for this plant & component" },
  conversionFactor: { label: "Conversion Factor", title: "Shared across all rows of the same type (RM/PM)" },
};

const DEFAULT_COMPONENT_METRIC_KEYS: ComponentMetricKey[] = [
  "onHandStock",
  "openPOQty",
  "supplierStock",
  "conversionFactor",
];

export type PlantLevelKey = "fgUnits" | "productionPlan";

const PLANT_LEVEL_DEFS: Record<PlantLevelKey, { label: string; placeholder: string }> = {
  fgUnits: { label: "On Hand FG Units", placeholder: "e.g. 1,234" },
  productionPlan: { label: "Production Plan", placeholder: "e.g. 4,44,444 EA" },
};

const DEFAULT_PLANT_LEVEL_KEYS: PlantLevelKey[] = ["fgUnits", "productionPlan"];

type TableColumn =
  | { kind: "row"; plantId: string; row: CustomOverrideRow }
  | { kind: "empty"; plantId: string }
  | { kind: "add"; plantId: string };

export function CustomOverridesForm({
  rows,
  onRowsChange,
  plants,
  onPlantsChange,
  fgUnits,
  onFgUnitsChange,
  productionPlan,
  onProductionPlanChange,
  baseline,
  onRun,
  collapsed = false,
  onToggleCollapsed,
  computed,
  plantLevelKeys = DEFAULT_PLANT_LEVEL_KEYS,
  componentMetricKeys = DEFAULT_COMPONENT_METRIC_KEYS,
  submitLabel = "Run custom scenario",
  embedded = false,
  hideTitle = false,
}: {
  rows: CustomOverrideRow[];
  onRowsChange: (rows: CustomOverrideRow[]) => void;
  plants: PlantGroup[];
  onPlantsChange: (plants: PlantGroup[]) => void;
  fgUnits: Record<string, string>;
  onFgUnitsChange: (fgUnits: Record<string, string>) => void;
  productionPlan: Record<string, string>;
  onProductionPlanChange: (productionPlan: Record<string, string>) => void;
  baseline: CompBreakdownRow[];
  onRun: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  computed?: boolean;
  /** Which plant-level rows to show, and in what order. Defaults to the full set (On Hand FG Units + Production Plan). */
  plantLevelKeys?: PlantLevelKey[];
  /** Which component-level metric rows to show, and in what order. Defaults to the full set. */
  componentMetricKeys?: ComponentMetricKey[];
  /** Label for the submit button at the bottom of the form. */
  submitLabel?: string;
  /**
   * Strips the panel's own header (icon/title/collapse toggle) and bulk actions
   * (Load all plants, Excel import/export) for use inside another chrome — e.g. a Modal
   * that already renders its own title bar. Plants can still be added individually.
   */
  embedded?: boolean;
  /**
   * Hides just the icon/title/subtitle block and the collapse toggle, while keeping the
   * bulk-action buttons (Load all plants, Excel import/export) — for use inside another
   * chrome that already shows its own title, but where the panel should stay pinned open
   * (no collapse) and can't fall back to `embedded`, which would also drop the buttons.
   */
  hideTitle?: boolean;
}) {
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const isCollapsed = embedded ? false : collapsed;

  // Snapshot of the values as they stood when this form was opened (i.e. the last-saved
  // state) — used to power the "Reset" button once the user edits something, in embedded
  // or hideTitle mode. Captured once per mount, since both usages remount fresh each time
  // their modal reopens.
  const [savedSnapshot] = useState(() => ({ plants, rows, productionPlan, fgUnits }));
  const isDirty =
    (embedded || hideTitle) && JSON.stringify({ plants, rows, productionPlan, fgUnits }) !== JSON.stringify(savedSnapshot);

  const handleReset = () => {
    onPlantsChange(savedSnapshot.plants);
    onRowsChange(savedSnapshot.rows);
    onProductionPlanChange(savedSnapshot.productionPlan);
    onFgUnitsChange(savedSnapshot.fgUnits);
    setShowErrors(false);
  };

  const makeBlankRow = (plantId: string, defaultType?: string): CustomOverrideRow => {
    const typeConversionFactor = getBaselineTypeConversionFactor(baseline);
    const type = defaultType ?? rows.find((r) => r.plantId === plantId)?.type ?? CUSTOM_OVERRIDE_TYPE_OPTIONS[0];
    return {
      id: `custom-row-${plantId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      plantId,
      type,
      componentCode: "",
      description: "",
      onHandStock: "",
      openPOQty: "",
      supplierStock: "",
      inTransitStock: "",
      stvStock: "",
      conversionFactor: typeConversionFactor[type] ?? "",
    };
  };

  const addPlant = () => {
    const id = `plant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    onPlantsChange([{ id, name: "" }, ...plants]);
    onRowsChange([...rows, makeBlankRow(id, CUSTOM_OVERRIDE_TYPE_OPTIONS[0])]);
  };

  // Baseline plant codes not already represented in the scenario — offered as a "pick an
  // existing plant" alternative to blank "+ Add Plant" so users can start from real data.
  const availableBaselinePlants = Array.from(new Set(baseline.map((r) => r.plant))).filter(
    (code) => !plants.some((p) => p.name === code),
  );

  const addPlantFromBaseline = (code: string) => {
    if (!code || plants.some((p) => p.name === code)) return;
    const id = `plant-baseline-${code}-${Date.now()}`;
    const typeConversionFactor = getBaselineTypeConversionFactor(baseline);
    const existingConvByType: Record<string, string> = {};
    rows.forEach((r) => {
      if (r.conversionFactor) existingConvByType[r.type] = r.conversionFactor;
    });
    const newRows: CustomOverrideRow[] = baseline
      .filter((r) => r.plant === code)
      .map((r, idx) => ({
        id: `custom-row-${id}-${r.componentCode}-${idx}`,
        plantId: id,
        type: r.type,
        componentCode: r.componentCode,
        description: r.description,
        onHandStock: r.onHandStock,
        openPOQty: r.openPO,
        supplierStock: r.supplierStock,
        inTransitStock: "",
        stvStock: "",
        conversionFactor: existingConvByType[r.type] ?? typeConversionFactor[r.type] ?? r.unitPrice,
      }));
    onPlantsChange([{ id, name: code }, ...plants]);
    onRowsChange([...rows, ...newRows]);
    const baselineRow = baseline.find((r) => r.plant === code);
    onProductionPlanChange({ ...productionPlan, [id]: baselineRow?.productionPlan ?? "" });
  };

  const renamePlant = (plantId: string, name: string) => {
    onPlantsChange(plants.map((p) => (p.id === plantId ? { ...p, name } : p)));
  };

  const removePlant = (plantId: string) => {
    onPlantsChange(plants.filter((p) => p.id !== plantId));
    onRowsChange(rows.filter((r) => r.plantId !== plantId));
    const nextFgUnits = { ...fgUnits };
    delete nextFgUnits[plantId];
    onFgUnitsChange(nextFgUnits);
    const nextProductionPlan = { ...productionPlan };
    delete nextProductionPlan[plantId];
    onProductionPlanChange(nextProductionPlan);
  };

  const loadAllFromBaseline = () => {
    const seed = buildBaselineScenario(baseline);
    onPlantsChange(seed.plants);
    onRowsChange(seed.rows);
    onProductionPlanChange(seed.productionPlan);
  };

  const handleDownloadExcel = () => {
    downloadCustomOverridesExcel(rows, plants);
    toast.success(
      rows.length > 0 ? "Downloaded override rows as Excel" : "Downloaded blank override template",
      {
        description: "Edit the file offline, then use \"Upload Excel\" to bring the changes back in.",
        duration: 4000,
      },
    );
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const parsed = await parseCustomOverridesExcel(file);
      if (parsed.rows.length === 0) {
        toast.error("No valid override rows found in the uploaded file.", {
          description: `Expected columns: ${CUSTOM_OVERRIDE_TEMPLATE_HEADERS.join(", ")}`,
        });
        return;
      }
      onPlantsChange(parsed.plants);
      onRowsChange(parsed.rows);
      setShowErrors(false);
      toast.success(`${parsed.rows.length} override row${parsed.rows.length > 1 ? "s" : ""} imported`, {
        description: "Review the values below, then run the custom scenario.",
        duration: 4000,
      });
    } catch (err) {
      toast.error("Could not read the uploaded file. Please check the file format.");
    } finally {
      setUploading(false);
    }
  };

  const addComponent = (plantId: string) => {
    onRowsChange([...rows, makeBlankRow(plantId)]);
  };

  const removeComponent = (rowId: string) => {
    onRowsChange(rows.filter((r) => r.id !== rowId));
  };

  const updateRow = (
    id: string,
    patch: Partial<
      Pick<
        CustomOverrideRow,
        "componentCode" | "type" | "onHandStock" | "openPOQty" | "supplierStock" | "inTransitStock" | "stvStock" | "conversionFactor"
      >
    >,
  ) => {
    const current = rows.find((r) => r.id === id);
    if (!current) return;
    const next: CustomOverrideRow = { ...current, ...patch };

    if (patch.type !== undefined && patch.type !== current.type) {
      // Switching RM/PM picks up whatever conversion factor is already shared by that type.
      const sharedForType = rows.find((r) => r.type === patch.type)?.conversionFactor;
      next.conversionFactor = sharedForType ?? current.conversionFactor;
      onRowsChange(rows.map((r) => (r.id === id ? next : r)));
      return;
    }

    if (patch.conversionFactor !== undefined) {
      // Editing a conversion factor updates every other row of the same type (RM/PM).
      onRowsChange(
        rows.map((r) => (r.id === id ? next : r.type === next.type ? { ...r, conversionFactor: next.conversionFactor } : r)),
      );
      return;
    }

    onRowsChange(rows.map((r) => (r.id === id ? next : r)));
  };

  const incomplete = rows.some((r) => !r.onHandStock || !r.componentCode) || plants.some((p) => !p.name);

  const plantLevelRows = plantLevelKeys.map((key) => ({ key, ...PLANT_LEVEL_DEFS[key] }));
  const componentMetricRows = componentMetricKeys.map((key) => ({ key, ...COMPONENT_METRIC_DEFS[key] }));

  const handleRunCustomScenario = () => {
    if (rows.length === 0 || incomplete) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    toast.success(embedded ? "Custom inputs saved" : "Custom scenario computed", {
      description: `${plants.length} plant${plants.length === 1 ? "" : "s"}, ${rows.length} component row${rows.length === 1 ? "" : "s"} applied`,
      duration: 3000,
    });
    onRun();
  };

  const inputStyle: React.CSSProperties = { border: "1px solid #d1d5db", color: "#111827", backgroundColor: "#ffffff" };
  const errorStyle: React.CSSProperties = { border: "1px solid #dc2626", color: "#111827", backgroundColor: "#fef2f2" };
  const headerInputStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,0.35)", color: "#ffffff", backgroundColor: "rgba(255,255,255,0.12)" };
  const headerInputErrorStyle: React.CSSProperties = { border: "2px solid #fca5a5", color: "#7f1d1d", backgroundColor: "#ffffff" };
  const typeBadgeStyle = (type: string): React.CSSProperties =>
    type === "RM"
      ? { backgroundColor: "#dcfce7", color: "#166534" }
      : { backgroundColor: "#dbeafe", color: "#1e40af" };

  // Mirrors TransposedComponentBreakdownTable's layout: plants as grouped column
  // headers, components as sub-columns, fields as rows — but every cell is editable.
  const columns: TableColumn[] = plants.flatMap((plant) => {
    const plantRows = rows.filter((r) => r.plantId === plant.id);
    const cols: TableColumn[] = plantRows.length === 0
      ? [{ kind: "empty", plantId: plant.id }]
      : plantRows.map((row) => ({ kind: "row", plantId: plant.id, row }) as TableColumn);
    cols.push({ kind: "add", plantId: plant.id });
    return cols;
  });
  const columnWidth = (col: TableColumn) => (col.kind === "add" ? ADD_COL_WIDTH : COMPONENT_COL_WIDTH);
  const tableWidth = FIELD_COL_WIDTH + columns.reduce((sum, col) => sum + columnWidth(col), 0);

  const cornerHeaderStyle: React.CSSProperties = {
    backgroundColor: C.navy,
    color: "#ffffff",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.04em",
    borderRight: "1px solid rgba(255,255,255,0.2)",
    width: FIELD_COL_WIDTH,
    position: "sticky",
    top: 0,
    left: 0,
    zIndex: 5,
    textAlign: "center",
  };

  // Second header row's corner cell — same sticky-left behaviour as cornerHeaderStyle, but
  // no sticky `top` of its own since it sits below the first row within the sticky <thead>.
  const cornerSubHeaderStyle: React.CSSProperties = {
    backgroundColor: "#234e94",
    color: "#ffffff",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.04em",
    borderRight: "1px solid rgba(255,255,255,0.2)",
    borderBottom: "1px solid rgba(255,255,255,0.18)",
    width: FIELD_COL_WIDTH,
    position: "sticky",
    left: 0,
    zIndex: 5,
    textAlign: "center",
  };

  const subHeaderBaseStyle: React.CSSProperties = {
    color: "#ffffff",
    borderRight: "1px solid rgba(255,255,255,0.15)",
  };

  const labelCellStyle: React.CSSProperties = {
    position: "sticky",
    left: 0,
    zIndex: 2,
    backgroundColor: "#f8fafc",
    borderRight: "1px solid #e2e8f0",
    borderBottom: "1px solid #e2e8f0",
    color: C.navy,
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: "0.03em",
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}
    >
      {!embedded && (
      <div className="px-4 py-3 flex items-start justify-between gap-3 flex-wrap">
        {!hideTitle && (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#ecfdf5" }}
          >
            <Pencil size={18} style={{ color: "#e11d48" }} />
          </div>
          <div>
            <p className="text-sm font-bold flex items-center gap-1.5" style={{ color: C.navy }}>
              Custom Overrides
              <span
                title="Add plants from this CBU's network below. Conversion factor is shared across all rows of the same type (RM/PM)."
                style={{ cursor: "help", display: "inline-flex" }}
              >
                <Info size={13} style={{ color: "#94a3b8", flexShrink: 0 }} />
              </span>
              {computed && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
                  style={{ backgroundColor: "#dcfce7", color: "#166534" }}
                >
                  Run
                </span>
              )}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
              Add plants, then components, below
            </p>
          </div>
        </div>
        )}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {!collapsed && (
            <>
              <button
                type="button"
                onClick={loadAllFromBaseline}
                title="Add every plant in this CBU's network with baseline values"
                className="inline-flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
                style={{ backgroundColor: "#ecfdf5", color: C.teal, border: "1px solid #99f6e4" }}
              >
                <Copy size={12} />
                Load all plants
              </button>
              <button
                type="button"
                onClick={handleDownloadExcel}
                title="Download the override rows as an Excel file to edit offline"
                className="inline-flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
                style={{ backgroundColor: "#ffffff", color: C.navy, border: "1px solid #d1d5db" }}
              >
                <Download size={12} />
                Download Excel
              </button>
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={uploading}
                title="Upload an edited Excel file to replace the override rows below"
                className="inline-flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: "#ffffff", color: C.navy, border: "1px solid #d1d5db" }}
              >
                <Upload size={12} />
                {uploading ? "Uploading…" : "Upload Excel"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelected}
                className="hidden"
              />
            </>
          )}
          {!hideTitle && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            title={collapsed ? "Expand custom scenario inputs" : "Collapse custom scenario inputs"}
            aria-label={collapsed ? "Expand custom scenario inputs" : "Collapse custom scenario inputs"}
            className="inline-flex items-center justify-center cursor-pointer w-7 h-7 rounded-lg shrink-0"
            style={{ backgroundColor: "#ffffff", color: C.navy, border: "1px solid #d1d5db" }}
          >
            {collapsed ? <ChevronsDown size={14} /> : <ChevronsUp size={14} />}
          </button>
          )}
        </div>
      </div>
      )}

      {/* ── Plants + components — laid out like the Component Breakdown by Plant table (plants as
          grouped columns, components as sub-columns, fields as rows), but every cell is editable ── */}
      {!isCollapsed && (
      <>
      <div className="px-4 py-3" style={{ borderTop: embedded ? undefined : "1px solid #f1f5f9" }}>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <p className="font-bold uppercase tracking-wide" style={{ color: "#94a3b8", fontSize: 9 }}>
            Plants
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {availableBaselinePlants.length > 0 && (
              <select
                value=""
                onChange={(e) => addPlantFromBaseline(e.target.value)}
                title="Add a plant from this CBU's existing network with its real baseline data"
                className="px-2 py-1 rounded-lg text-xs focus:outline-none cursor-pointer font-semibold"
                style={{ border: "1px solid #d1d5db", color: C.navy, backgroundColor: "#ffffff" }}
              >
                <option value="">Select existing plant</option>
                {availableBaselinePlants.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={addPlant}
              title="Add a blank plant to this scenario"
              className="inline-flex items-center cursor-pointer gap-1.5 px-2 py-1 rounded-lg text-xs focus:outline-none font-semibold"
              style={{ border: `1px solid ${C.borderBlue}`, color: C.blue, backgroundColor: C.bgBlue }}
            >
              <Plus size={12} />
              Add Plant
            </button>
          </div>
        </div>

        {plants.length === 0 ? (
          <div
            className="rounded-lg py-6 text-center text-xs italic"
            style={{ border: "1px dashed #e2e8f0", color: showErrors ? "#dc2626" : "#94a3b8" }}
          >
            {showErrors
              ? "Add at least one plant and complete all required fields."
              : embedded
                ? "No plants added yet. Pick an existing plant or use “+ Add Plant” to begin."
                : "No plants added yet. Pick an existing plant, use “+ Add Plant”, or “Load all plants” above to begin."}
          </div>
        ) : (
          <div className="overflow-auto rounded-lg" style={{ maxHeight: 560, border: "1px solid #e2e8f0" }}>
            <table
              className="text-[11px] mx-auto"
              style={{ width: tableWidth, tableLayout: "fixed", borderCollapse: "collapse" }}
            >
              <colgroup>
                <col style={{ width: FIELD_COL_WIDTH }} />
                {columns.map((col, i) => (
                  <col key={`col-${i}`} style={{ width: columnWidth(col) }} />
                ))}
              </colgroup>
              <thead style={{ position: "sticky", top: 0, zIndex: 4 }}>
                <tr style={{ backgroundColor: C.navy }}>
                  <th className="px-2 py-2 align-middle uppercase" style={cornerHeaderStyle}>
                    Plant
                  </th>
                  {plants.map((plant, gIdx) => {
                    const span = columns.filter((c) => c.plantId === plant.id).length;
                    return (
                      <th
                        key={plant.id}
                        colSpan={span}
                        className="px-1.5 py-2 text-center font-bold uppercase tracking-wide"
                        style={{
                          color: "#ffffff",
                          fontSize: 9,
                          borderRight: "1px solid rgba(255,255,255,0.2)",
                          borderBottom: "1px solid rgba(255,255,255,0.18)",
                        }}
                      >
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <input
                            type="text"
                            value={plant.name}
                            onChange={(e) => renamePlant(plant.id, e.target.value)}
                            placeholder={`e.g. UTR`}
                            title={`Plant code for column group ${gIdx + 1} — updates as you type`}
                            className="px-1.5 py-1 rounded text-[11px] font-bold text-center normal-case focus:outline-none"
                            style={{ width: 60, ...(showErrors && !plant.name ? headerInputErrorStyle : headerInputStyle) }}
                          />
                          <button
                            type="button"
                            onClick={() => removePlant(plant.id)}
                            title={`Remove ${plant.name || `Plant ${gIdx + 1}`} from this scenario`}
                            className="cursor-pointer"
                            style={{ color: "rgba(255,255,255,0.7)" }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
                <tr style={{ backgroundColor: "#234e94" }}>
                  <th className="px-2 py-2 align-middle uppercase" style={cornerSubHeaderStyle}>
                    Material
                  </th>
                  {columns.map((col) =>
                    col.kind === "empty" ? (
                      <th key={`empty-${col.plantId}`} className="px-1.5 py-2 text-center align-middle" style={subHeaderBaseStyle}>
                        <span className="text-[9px] italic" style={{ color: "rgba(255,255,255,0.6)" }}>
                          No components
                        </span>
                      </th>
                    ) : col.kind === "add" ? (
                      <th key={`add-${col.plantId}`} className="px-1 py-2 text-center align-middle" style={subHeaderBaseStyle}>
                        <button
                          type="button"
                          onClick={() => addComponent(col.plantId)}
                          title="Add a component to this plant"
                          className="inline-flex items-center justify-center cursor-pointer w-6 h-6 rounded-full mx-auto"
                          style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff", border: "1px dashed rgba(255,255,255,0.5)" }}
                        >
                          <Plus size={12} />
                        </button>
                      </th>
                    ) : (
                      <th key={col.row.id} className="px-1.5 py-1.5 text-center align-top" style={subHeaderBaseStyle}>
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <select
                              value={col.row.type}
                              onChange={(e) => updateRow(col.row.id, { type: e.target.value })}
                              title="RM or PM — conversion factor is shared across rows of the same type"
                              className="px-1 py-0.5 rounded text-[9px] font-bold focus:outline-none cursor-pointer"
                              style={{ ...typeBadgeStyle(col.row.type), border: "none" }}
                            >
                              {CUSTOM_OVERRIDE_TYPE_OPTIONS.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeComponent(col.row.id)}
                              title="Remove this component"
                              className="cursor-pointer"
                              style={{ color: "rgba(255,255,255,0.7)" }}
                            >
                              <X size={11} />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={col.row.componentCode}
                            onChange={(e) => updateRow(col.row.id, { componentCode: e.target.value })}
                            placeholder="Code"
                            title="Component code"
                            className="w-full px-1.5 py-1 rounded text-[10px] font-bold text-center focus:outline-none"
                            style={showErrors && !col.row.componentCode ? headerInputErrorStyle : headerInputStyle}
                          />
                        </div>
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {plantLevelRows.map((field, rIdx) => (
                  <tr key={field.key}>
                    <td className="px-2 py-1.5" style={{ ...labelCellStyle, backgroundColor: rIdx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                      {field.label}
                    </td>
                    {plants.map((plant) => {
                      const span = columns.filter((c) => c.plantId === plant.id).length;
                      const value = field.key === "fgUnits" ? fgUnits[plant.id] ?? "" : productionPlan[plant.id] ?? "";
                      return (
                        <td
                          key={plant.id}
                          colSpan={span}
                          className="px-2 py-1.5"
                          style={{
                            backgroundColor: rIdx % 2 === 0 ? "#ffffff" : "#f8fafc",
                            borderRight: "1px solid #e2e8f0",
                            borderBottom: "1px solid #e2e8f0",
                          }}
                        >
                          <input
                            type="text"
                            value={value}
                            onChange={(e) =>
                              field.key === "fgUnits"
                                ? onFgUnitsChange({ ...fgUnits, [plant.id]: e.target.value })
                                : onProductionPlanChange({ ...productionPlan, [plant.id]: e.target.value })
                            }
                            placeholder={field.placeholder}
                            title={`${field.label} for ${plant.name || "this plant"}`}
                            className="w-full px-2 py-1 rounded text-[11px] text-center focus:outline-none"
                            style={inputStyle}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {componentMetricRows.map((field, rIdx) => {
                  const bg = (rIdx + plantLevelRows.length) % 2 === 0 ? "#ffffff" : "#f8fafc";
                  return (
                    <tr key={field.key}>
                      <td className="px-2 py-1.5" style={{ ...labelCellStyle, backgroundColor: bg }}>
                        {field.label}
                        {field.required && <span style={{ color: "#dc2626" }}> *</span>}
                      </td>
                      {columns.map((col) => {
                        if (col.kind === "empty") {
                          return (
                            <td
                              key={`empty-${col.plantId}-${field.key}`}
                              className="px-2 py-1.5 text-center"
                              style={{ backgroundColor: bg, borderRight: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", color: "#cbd5e1" }}
                            >
                              —
                            </td>
                          );
                        }
                        if (col.kind === "add") {
                          return (
                            <td
                              key={`add-${col.plantId}-${field.key}`}
                              style={{ backgroundColor: bg, borderRight: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}
                            />
                          );
                        }
                        const row = col.row;
                        const value = row[field.key] ?? "";
                        const isError = showErrors && field.required && !value;
                        return (
                          <td
                            key={row.id}
                            className="px-1.5 py-1.5"
                            style={{ backgroundColor: bg, borderRight: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}
                          >
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => updateRow(row.id, { [field.key]: e.target.value } as Partial<CustomOverrideRow>)}
                              title={field.title}
                              className="w-full px-2 py-1 rounded text-[11px] text-center focus:outline-none"
                              style={isError ? errorStyle : inputStyle}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        className="px-4 py-3 flex items-center justify-end gap-3 flex-wrap"
        style={{ borderTop: "1px solid #f1f5f9" }}
      >
        {showErrors && (rows.length === 0 || incomplete) && (
          <span className="text-[11px] font-semibold" style={{ color: "#dc2626" }}>
            Add at least one plant and complete all required fields highlighted in red.
          </span>
        )}
        {isDirty && (
          <button
            type="button"
            onClick={handleReset}
            title="Discard changes and revert to the last saved values"
            className="inline-flex items-center cursor-pointer gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: "#f1f5f9", color: "#64748b" }}
          >
            <RotateCcw size={12} />
            Reset
          </button>
        )}
        <button
          type="button"
          onClick={handleRunCustomScenario}
          title={embedded || hideTitle ? "Save the entered overrides" : "Compute business waste & FG days cover using the entered overrides"}
          className="inline-flex items-center cursor-pointer gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-opacity hover:opacity-90"
          style={{ backgroundColor: embedded || hideTitle ? C.blue : C.teal, color: "#fff" }}
        >
          {!embedded && <Zap size={12} />}
          {submitLabel}
        </button>
      </div>
      </>
      )}
    </div>
  );
}
