import { Check, ChevronDown, ChevronRight, Clock, Link2Off, Plus, Trash2 } from "lucide-react";
import type { IUTOption } from "../../sciDetails/types";
import { C, IUT_TRANSFER_OPTIONS, MOQ_PLANT_OPTIONS, RM_BADGE, PM_BADGE } from "../../sciDetails/constants";
import { TODAY, getComponentDescriptionByCode } from "../../data";

/** A blank, freely-editable IUT row added via the IUT section's "Add" action — not backed by
    any predefined IUT_TRANSFER_OPTIONS entry, so every field (including Plant/Material) is
    user-entered rather than read-only. */
export type AddedIutRow = {
  id: string;
  routeFrom: string;
  routeTo: string;
  matType: string;
  matCode: string;
  transferQty: number;
  transferLeadTime: string;
  initiationDate: string;
  laneAvailable: boolean | null;
  costPerTrip: number;
};

/** A blank, freely-editable Procurement row added via the Procurement section's "Add" action —
    not backed by any MOQ_PLANT_OPTIONS catalog entry, so Plant/Material/Supplier are all
    user-entered rather than read-only/selected from a dropdown. */
export type AddedProcurementRow = {
  id: string;
  plant: string;
  matType: string;
  matCode: string;
  supplierName: string;
  orderQty: number;
  moq: number;
  pricePerUnit: number;
};

/** A scenario's in-progress edits while its "More Details" popup is open in Customise mode —
    lives in the parent (`ScenarioComparisonStep`) so both the drawer's header (Customise toggle)
    and footer (Reset / Save as New Scenario) can drive it alongside `ScenarioDetailTable` itself. */
export type ScenarioEditState = {
  optionOverride: Partial<Pick<IUTOption, "transferQty" | "transferLeadTime" | "costPerTrip" | "initiationDate">>;
  moqOrderQtyOverrides: Record<string, number>;
  /** IUT row removed via its row-level delete action — hides the whole IUT section. */
  iutRemoved: boolean;
  /** Procurement row ids removed via their row-level delete action. */
  removedProcurementIds: string[];
  /** Extra IUT rows added via the IUT section's "Add" action, on top of the scenario's own row. */
  addedIutRows: AddedIutRow[];
  /** Extra Procurement rows added via the Procurement section's "Add" action, on top of the
      catalog-derived rows. */
  addedProcurementRows: AddedProcurementRow[];
  hasChanges: boolean;
};

// Shared one-off colors reused across step3 files (no exact match in the shared `C` palette) —
// defined once here since this module is already the common import hub for the rest of step3.
export const LANE_UNAVAILABLE_COLOR = "#ea580c";
export const BEST_TINT_BG = "#f0fdf4";
export const NEUTRAL_CARD_BG = "#fafafa";
export const ATTENTION_TEXT = "#c2410c";

export const EMPTY_SCENARIO_EDIT_STATE: ScenarioEditState = {
  optionOverride: {},
  moqOrderQtyOverrides: {},
  iutRemoved: false,
  removedProcurementIds: [],
  addedIutRows: [],
  addedProcurementRows: [],
  hasChanges: false,
};

export type ScenarioDetailIut = {
  routeFrom: string;
  routeTo: string;
  matType: string;
  matCode: string;
  transferQty: number;
  transferLeadTime: string;
  initiationDate: string;
  laneAvailable: boolean | null;
  costPerTrip: number;
};

export type ScenarioDetailProcurementRow = {
  id: string;
  plant: string;
  matType: string;
  matCode: string;
  supplierId: string;
  supplierName: string;
  orderQty: number;
  moq: number;
  pricePerUnit: number;
  total: number;
  belowMoq: boolean;
};

export type ScenarioDetailSnapshot = {
  sourceScenarioName: string;
  totalCost: number;
  businessWaste: string | null;
  wasteSavings: string | null;
  wasteColor: "orange" | "teal" | undefined;
  totalFg: number;
  fgDaysCover: string | null;
  productionStopDate: string;
  iut: ScenarioDetailIut | null;
  /** Extra IUT rows added via the "Add" action, saved alongside the primary `iut` row. */
  extraIut: AddedIutRow[];
  procurement: ScenarioDetailProcurementRow[] | null;
};

/** A previously-saved custom scenario's IUT/Procurement rows while its "More Details" popup is
    re-opened in Customise mode — every row (including the ones it was originally saved with) is
    represented as a freely-editable row, since a custom scenario has no catalog option/plant
    backing it the way a live scenario does. */
export type CustomSnapshotEditState = {
  iutRows: AddedIutRow[];
  procurementRows: AddedProcurementRow[];
  hasChanges: boolean;
};

export const EMPTY_CUSTOM_SNAPSHOT_EDIT_STATE: CustomSnapshotEditState = {
  iutRows: [],
  procurementRows: [],
  hasChanges: false,
};

/** Seeds a fresh edit session from a saved snapshot — its primary IUT row plus any rows added in
    a previous customisation pass all become equally-editable rows. */
export function snapshotToEditState(snapshot: ScenarioDetailSnapshot): CustomSnapshotEditState {
  const iutRows: AddedIutRow[] = [];
  if (snapshot.iut) {
    iutRows.push({ id: `iut-primary-${Date.now()}`, ...snapshot.iut });
  }
  iutRows.push(...snapshot.extraIut);
  const procurementRows: AddedProcurementRow[] = (snapshot.procurement ?? []).map((r) => ({
    id: r.id,
    plant: r.plant,
    matType: r.matType,
    matCode: r.matCode,
    supplierName: r.supplierName,
    orderQty: r.orderQty,
    moq: r.moq,
    pricePerUnit: r.pricePerUnit,
  }));
  return { iutRows, procurementRows, hasChanges: false };
}

/** Folds an edit session's rows back into a snapshot — Business Waste / FG Cover stay frozen at
    whatever the scenario was originally saved with (same as a live scenario's Customise mode),
    only Total Cost and the IUT/Procurement rows themselves reflect the edits. */
export function editStateToSnapshot(base: ScenarioDetailSnapshot, edit: CustomSnapshotEditState): ScenarioDetailSnapshot {
  const [primaryIut, ...restIut] = edit.iutRows;
  const iut: ScenarioDetailIut | null = primaryIut
    ? {
        routeFrom: primaryIut.routeFrom,
        routeTo: primaryIut.routeTo,
        matType: primaryIut.matType,
        matCode: primaryIut.matCode,
        transferQty: primaryIut.transferQty,
        transferLeadTime: primaryIut.transferLeadTime,
        initiationDate: primaryIut.initiationDate,
        laneAvailable: primaryIut.laneAvailable,
        costPerTrip: primaryIut.costPerTrip,
      }
    : null;
  const procurement: ScenarioDetailProcurementRow[] = edit.procurementRows.map((r) => ({
    id: r.id,
    plant: r.plant,
    matType: r.matType,
    matCode: r.matCode,
    supplierId: r.id,
    supplierName: r.supplierName,
    orderQty: r.orderQty,
    moq: r.moq,
    pricePerUnit: r.pricePerUnit,
    total: r.orderQty * r.pricePerUnit,
    belowMoq: false,
  }));
  const totalCost =
    (iut?.costPerTrip ?? 0) +
    restIut.reduce((sum, r) => sum + r.costPerTrip, 0) +
    procurement.reduce((sum, r) => sum + r.total, 0);
  return { ...base, iut, extraIut: restIut, procurement, totalCost };
}

export function splitMaterial(material: string): { type: string; code: string } {
  const [type, ...rest] = material.split(" ");
  return { type, code: rest.join(" ") };
}

export function materialDescription(type: string, code: string): string {
  return (
    getComponentDescriptionByCode(code) ||
    (type === "RM" ? `Raw material component ${code}` : `Packaging material component ${code}`)
  );
}

export function materialCodeBadge(type: string, code: string) {
  const badge = type === "RM" ? RM_BADGE : type === "PM" ? PM_BADGE : { bg: C.bgSlate, color: C.muted };
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>
        {type}
      </span>
      <span className="text-[11px] font-bold tabular-nums" style={{ color: C.navy }}>{code}</span>
    </span>
  );
}

export function laneBadge(available: boolean | null) {
  if (available === true) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold whitespace-nowrap" style={{ color: C.green }}>
        <Check size={10} strokeWidth={2.5} />Available
      </span>
    );
  }
  if (available === false) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold whitespace-nowrap" style={{ color: LANE_UNAVAILABLE_COLOR }}>
        <Link2Off size={10} />Unavailable
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold whitespace-nowrap" style={{ color: C.warning }}>
      <Clock size={10} />Not set
    </span>
  );
}

/** Turns a "23d" style FG days-cover string into the calendar date it lands on. */
export function coverDateLabel(daysCover: string | null | undefined): string | null {
  const days = parseInt(daysCover ?? "", 10);
  if (Number.isNaN(days)) return null;
  const dt = new Date(TODAY.getTime() + days * 86_400_000);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export const editInputStyle = {
  border: `1px solid ${C.borderBlue}`,
  borderRadius: 8,
  backgroundColor: "transparent",
  color: C.navy,
  outline: "none",
  boxShadow: "none",
  minHeight: 38,
  padding: "0 10px",
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
} as const;

export function DropdownField({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative inline-flex items-center">
      {children}
      <ChevronDown
        size={14}
        strokeWidth={2}
        className="pointer-events-none absolute right-2"
        style={{ color: C.blue }}
      />
    </div>
  );
}

export function autoIutCost(routeFrom: string, routeTo: string): number {
  return IUT_TRANSFER_OPTIONS.find(
    (option) => option.routeFrom === routeFrom && option.routeTo === routeTo,
  )?.costPerTrip ?? 0;
}

export function autoProcurementValues(
  plant: string,
  matType: string,
  matCode: string,
  supplierName: string,
): { moq: number; pricePerUnit: number } {
  const material = `${matType} ${matCode}`;
  const exactPlantOption = MOQ_PLANT_OPTIONS.find(
    (option) => option.plant === plant && option.material === material,
  );
  const materialOptions = MOQ_PLANT_OPTIONS.filter((option) => option.material === material);
  const supplier =
    exactPlantOption?.suppliers.find((candidate) => candidate.name === supplierName) ??
    materialOptions
      .flatMap((option) => option.suppliers)
      .find((candidate) => candidate.name === supplierName) ??
    materialOptions[0]?.suppliers[0];
  return {
    moq: supplier?.moq ?? 0,
    pricePerUnit: supplier?.pricePerUnit ?? 0,
  };
}

export function SectionHeading({
  title,
  collapsed,
  onToggleCollapse,
  extra,
}: {
  title: string;
  /** Omit to render a plain, non-collapsible heading. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Extra content (e.g. an "Add" button) rendered before the collapse chevron — clicks on it
      won't toggle the section's collapsed state. */
  extra?: React.ReactNode;
}) {
  const collapsible = onToggleCollapse !== undefined;
  return (
    <div
      className="px-3 py-1.5 flex items-center justify-between gap-2"
      style={{
        backgroundColor: C.bgBlue,
        borderBottom: collapsed ? undefined : `1px solid ${C.borderBlue}`,
        cursor: collapsible ? "pointer" : undefined,
      }}
      onClick={collapsible ? onToggleCollapse : undefined}
      role={collapsible ? "button" : undefined}
      title={collapsible ? (collapsed ? `Expand ${title}` : `Collapse ${title}`) : undefined}
    >
      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: C.navy }}>{title}</span>
      <div className="flex items-center gap-2">
        {extra && <span onClick={(e) => e.stopPropagation()}>{extra}</span>}
        {collapsible && (
          collapsed ? <ChevronRight size={13} style={{ color: C.navy }} /> : <ChevronDown size={13} style={{ color: C.navy }} />
        )}
      </div>
    </div>
  );
}

export function StatTile({ label, value, sub, subColor }: { label: string; value: string; sub?: string; subColor?: string }) {
  return (
    <div className="rounded-lg px-3 py-2" style={{ backgroundColor: C.bgSlateLight, border: `1px solid ${C.bgSlate}` }}>
      <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: C.borderMuted }}>{label}</div>
      <div className="text-sm font-bold tabular-nums mt-0.5" style={{ color: C.navy }}>{value}</div>
      {sub && <div className="text-[10px] font-semibold mt-0.5" style={{ color: subColor ?? C.muted }}>{sub}</div>}
    </div>
  );
}

export function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" | "center" }) {
  return (
    <th
      className="px-3 py-2 font-bold uppercase tracking-wide whitespace-nowrap"
      style={{
        color: C.white,
        fontSize: 9,
        textAlign: align,
        backgroundColor: C.navy,
        borderRight: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {children}
    </th>
  );
}

export function Td({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" | "center" }) {
  return (
    <td
      className="px-3 py-2.5 text-xs whitespace-nowrap"
      style={{
        color: C.textSecondary,
        textAlign: align,
        borderRight: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        backgroundColor: C.white,
      }}
    >
      {children}
    </td>
  );
}

export function RowDeleteButton({ onClick, title }: { onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex items-center justify-center rounded-full shrink-0 cursor-pointer transition-colors hover:bg-red-50"
      style={{ width: 20, height: 20, color: C.borderMuted }}
    >
      <Trash2 size={12} />
    </button>
  );
}

export function AddRowButton({ onClick, title, label }: { onClick: () => void; title: string; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-colors"
      style={{ backgroundColor: C.white, color: C.blue, border: `1px solid ${C.blue}` }}
    >
      <Plus size={11} />
      {label}
    </button>
  );
}

/** A blank, freely-editable text/number cell for a newly-added row — used in place of the
    read-only display or catalog-driven select that existing rows render for the same column. */
export function EditableCell({
  value,
  onChange,
  type = "text",
  width = 110,
  align = "left",
  placeholder,
}: {
  value: string | number;
  onChange: (v: string) => void;
  type?: "text" | "number";
  width?: number;
  align?: "left" | "right";
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      min={type === "number" ? 0 : undefined}
      value={value}
      onChange={(e) => {
        const next = e.target.value;
        // Controlled input: rejecting a negative-producing keystroke (rather than clamping
        // after the fact) means `value` never re-renders with a negative number, so this one
        // fix covers every EditableCell caller without touching each call site's onChange.
        if (type === "number" && next !== "" && Number(next) < 0) return;
        onChange(next);
      }}
      placeholder={placeholder}
      className={`text-xs rounded px-1.5 py-0.5 ${align === "right" ? "text-right tabular-nums" : ""}`}
      style={{ ...editInputStyle, width }}
    />
  );
}

export function SelectCell({
  value,
  onChange,
  options,
  width = 120,
  placeholder,
}: {
  value: string | number;
  onChange: (v: string) => void;
  options: string[];
  width?: number;
  placeholder: string;
}) {
  return (
    <DropdownField>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs rounded px-1.5 py-0.5 pr-8 cursor-pointer"
        style={{ ...editInputStyle, width }}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </DropdownField>
  );
}
