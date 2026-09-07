import * as XLSX from "xlsx";
import { NEW_PROJECT_STATUS_OPTIONS, NEW_PROJECT_PRIORITY_OPTIONS, TEMPLATE_HEADERS } from "../../constants/projectDetails";
import type { NewProjectRecord, NewProjectStatus, NewProjectPriority, ParsedProjectRow } from "./types";

export function makeNewProjectId(existing: NewProjectRecord[]): string {
  const max = existing.reduce((m, p) => {
    const n = Number(p.id.replace("PRJ-", ""));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 1000);
  return `PRJ-${max + 1}`;
}

export function downloadSampleTemplate() {
  const sampleRows = [
    {
      "Project Name": "West Region CBU Transition",
      "Old CBU Codes": "CBU001; CBU002",
      "New CBU Codes": "CBU010",
      Description: "",
      Owner: "",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);

  worksheet["!cols"] = [
    { wch: 32 },
    { wch: 28 },
    { wch: 28 },
    { wch: 15 },
    { wch: 40 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 12 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Project Template"
  );

  XLSX.writeFile(
    workbook,
    "New_Project_Template.xlsx"
  );
}

function normalizeDate(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "number") {
    const d = XLSX.SSF.parse_date_code(value);
    if (!d) return "";
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(value).trim();
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return s;
}

function coerceStatus(value: unknown): NewProjectStatus {
  const s = String(value ?? "").trim().toLowerCase();
  const match = NEW_PROJECT_STATUS_OPTIONS.find((opt) => opt.toLowerCase() === s);
  return match ?? "Not Started";
}

function coercePriority(value: unknown): NewProjectPriority {
  const s = String(value ?? "").trim().toLowerCase();
  const match = NEW_PROJECT_PRIORITY_OPTIONS.find((opt) => opt.toLowerCase() === s);
  return match ?? "Medium";
}
function splitCbuCodes(value: unknown): string[] {
  if (!value) return [];

  return String(value)
    .split(/[;,]/)
    .map((code) => code.trim())
    .filter(Boolean);
}

function parseDiscontinued(value: unknown): boolean {
  const normalizedValue = String(value ?? "")
    .trim()
    .toLowerCase();

  return ["yes", "true", "1", "y"].includes(normalizedValue);
}

export async function parseTemplateFile(
  file: File
): Promise<Omit<NewProjectRecord, "id" | "source" | "createdAt">[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheetName];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    worksheet,
    {
      defval: "",
    }
  );

  return rows
    .map((row, index) => {
      const projectName = String(
        row["Project Name"] ?? ""
      ).trim();

      const oldCodes = splitCbuCodes(
        row["Old CBU Codes"]
      );

      const newCodes = splitCbuCodes(
        row["New CBU Codes"]
      );

      if (!projectName || oldCodes.length === 0) {
        return null;
      }

      return {
        name: projectName,
        description: String(
          row.Description ?? ""
        ).trim(),
        owner: String(row.Owner ?? "").trim(),
        startDate: String(
          row["Start Date"] ?? ""
        ).trim(),
        targetDate: String(
          row["Target Date"] ?? ""
        ).trim(),
        status:
          String(row.Status ?? "").trim() ||
          "Not Started",
        priority:
          String(row.Priority ?? "").trim() ||
          "Medium",
        transitions: [
          {
            id: `excel-cbu-${index}-${Date.now()}`,
            oldCodes,
            newCodes,
            discontinued: parseDiscontinued(
              row.Discontinued
            ),
          },
        ],
      } as Omit<
        NewProjectRecord,
        "id" | "source" | "createdAt"
      >;
    })
    .filter(
      (
        project
      ): project is Omit<
        NewProjectRecord,
        "id" | "source" | "createdAt"
      > => project !== null
    );
}
