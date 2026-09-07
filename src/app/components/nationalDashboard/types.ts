import type { LucideIcon } from "lucide-react";

export type UomFilter = "EA" | "MT";
export type TypeFilter = "ALL" | "RM" | "PM";
export type ColumnGroup = "meta" | "fg" | "rmpm" | "demand" | "summary" | "cover";
export type SortDir = "asc" | "desc";

export interface ColDef {
  id: string;
  group: ColumnGroup;
  label: string;
  minWidth: number;
}

export interface EffRmpm {
  physicalStock: number;
  qualityStock: number;
  openPOStock: number;
  totalStock: number;
  blockedStock: number;
}

export interface CoverResult {
  days: number | null;
  date: string;
}

export type ColDragTarget = { group: ColumnGroup; index: number };

export type TableHint = {
  target: string;
  action: string;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
};
