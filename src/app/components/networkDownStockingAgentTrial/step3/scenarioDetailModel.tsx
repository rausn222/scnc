import type { IUTOption, PlantRole, ScenarioRow } from "../../sciDetails/types";
import {
  IUT_TRANSFER_OPTIONS,
  MOQ_PLANT_OPTIONS,
  MOQ_PLANT_OPTIONS_BREAK,
  PLANT_BREAKDOWN_BASE,
  SCENARIOS,
} from "../../sciDetails/constants";
import { computeAfterQtyAndDate } from "../../sciDetails/utils";
import { splitMaterial, type AddedIutRow, type ScenarioDetailSnapshot, type ScenarioEditState } from "./ScenarioDetailPrimitives";

export type ScenarioProcurementRowVM = {
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
  availableSuppliers: { id: string; name: string }[];
  /** True for a row added via the Procurement section's "Add" action — not a catalog plant, so
      it renders with free-text Plant/Material/Supplier inputs instead of read-only text/select. */
  custom?: boolean;
};

export type ScenarioViewModel = {
  scenario: ScenarioRow;
  isBreakMoq: boolean;
  iutApplicable: boolean;
  iutActive: boolean;
  option: IUTOption;
  iutMaterial: { type: string; code: string };
  /** Extra IUT rows added via the IUT section's "Add" action, alongside `option`/`iutMaterial`. */
  extraIutRows: AddedIutRow[];
  procurementApplicable: boolean;
  procurementRows: ScenarioProcurementRowVM[];
  totalFg: number;
  totalCost: number;
};

/**
 * Pure computation shared by `ScenarioDetailTable` (rendering) and `ScenarioComparisonStep`
 * (building the frozen snapshot when "Save as New Scenario" is clicked in the drawer's footer) —
 * a single source of truth for "what does this scenario + these edits actually add up to",
 * independent of where the result is consumed.
 */

export function buildScenarioViewModel(
  scenarioId: string,
  selTransfer: string,
  moqSuppliers: Record<string, string>,
  editState: ScenarioEditState,
): ScenarioViewModel | null {
if (scenarioId === "custom-new") {
  return {
    scenario: {
      id: "custom-new",
      name: "Custom Scenario",
      businessWaste: null,
      wasteSavings: null,
      wasteColor: "orange",
      fgDaysCover: null,
      isBest: false,
      nextActionPrefix: "",
      nextAction: "",
      icon: "custom",
      feasibleProducible: 0,
      productionStopDate: "—",
      dailyRunRate: 0,
    },

    isBreakMoq: false,

    iutApplicable: true,

    iutActive: true,

    option: {
      id: "custom",
      label: "",
      routeFrom: "",
      routeTo: "",
      material: "",
      transferQty: 0,
      transferLeadTime: "",
      initiationDate: "",
      laneAvailable: null,
      costPerTrip: 0,
    } as IUTOption,

    iutMaterial: {
      type: "",
      code: "",
    },

    // only show rows user adds
    extraIutRows: editState.addedIutRows ?? [],

    procurementApplicable: true,

    // only show rows user adds
    procurementRows: (editState.addedProcurementRows ?? []).map((row) => ({
      id: row.id,
      plant: row.plant,
      matType: row.matType,
      matCode: row.matCode,
      supplierId: "",
      supplierName: row.supplierName,
      orderQty: row.orderQty,
      moq: row.moq,
      pricePerUnit: row.pricePerUnit,
      total: row.orderQty * row.pricePerUnit,
      belowMoq: false,
      availableSuppliers: [],
      custom: true,
    })),

    totalFg: 0,

    totalCost: (editState.addedProcurementRows ?? []).reduce(
      (sum, r) => sum + r.orderQty * r.pricePerUnit,
      0
    ),
  };
}
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) return null;

  const iutApplicable = scenarioId === "iut" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break";
  const procurementApplicable = scenarioId === "moq" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break";
  const isBreakMoq = scenarioId === "iut-moq-break";
  const iutActive = iutApplicable && !editState.iutRemoved;

  const transferOptions = IUT_TRANSFER_OPTIONS.slice(0, 2);
  const baseOption = transferOptions.find((o) => o.id === selTransfer) ?? transferOptions.find((o) => o.isBest) ?? transferOptions[0];
  const option: IUTOption = { ...baseOption, ...editState.optionOverride };
  const iutMaterial = splitMaterial(option.material);

  const moqPlantData = isBreakMoq ? MOQ_PLANT_OPTIONS_BREAK : MOQ_PLANT_OPTIONS;
  const effMoqPlantData = moqPlantData
    .filter((p) => !editState.removedProcurementIds.includes(p.id))
    .map((p) => ({ ...p, orderQty: editState.moqOrderQtyOverrides[p.id] ?? p.orderQty }));

  const computeFg = (plantCode: string): number => {
    const base = PLANT_BREAKDOWN_BASE[plantCode];
    if (!base) return 0;
    const roles: PlantRole[] = [];
    if (iutActive && option.routeFrom === plantCode) roles.push("source");
    if (iutActive && option.routeTo === plantCode) roles.push("destination");
    const moqPlant = procurementApplicable ? effMoqPlantData.find((p) => p.plant === plantCode) ?? null : null;
    if (moqPlant) roles.push("ordering");
    const { qty } = computeAfterQtyAndDate(
      plantCode,
      roles,
      scenarioId,
      iutActive ? option : null,
      moqPlant,
      moqSuppliers,
      base.totalProductionPlanQty,
      base.prodStopDate,
    );
    return qty;
  };

  const totalFg = Object.keys(PLANT_BREAKDOWN_BASE).reduce((sum, code) => sum + computeFg(code), 0);

  const catalogProcurementRows: ScenarioProcurementRowVM[] = procurementApplicable
    ? effMoqPlantData.map((plant) => {
        const supplier = plant.suppliers.find((s) => s.id === moqSuppliers[plant.id]) ?? plant.suppliers[0];
        const { type: matType, code: matCode } = splitMaterial(plant.material);
        return {
          id: plant.id,
          plant: plant.plant,
          matType,
          matCode,
          supplierId: supplier.id,
          supplierName: supplier.name,
          orderQty: plant.orderQty,
          moq: supplier.moq,
          pricePerUnit: supplier.pricePerUnit,
          total: plant.orderQty * supplier.pricePerUnit,
          belowMoq: isBreakMoq && plant.moqBroken != null,
          availableSuppliers: plant.suppliers.map((s) => ({ id: s.id, name: s.name })),
        };
      })
    : [];
  // User-added rows (via the Procurement section's "Add" action) tack onto the catalog rows —
  // folding them in here, rather than in the rendering component, keeps totalCost/totalFg and
  // the "Save as New Scenario" snapshot (buildSnapshotFromViewModel below) automatically
  // consistent with whatever's on screen.
  const addedProcurementRows: ScenarioProcurementRowVM[] = procurementApplicable
    ? editState.addedProcurementRows.map((row) => ({
        id: row.id,
        plant: row.plant,
        matType: row.matType,
        matCode: row.matCode,
        supplierId: row.id,
        supplierName: row.supplierName,
        orderQty: row.orderQty,
        moq: row.moq,
        pricePerUnit: row.pricePerUnit,
        total: row.orderQty * row.pricePerUnit,
        belowMoq: false,
        availableSuppliers: [],
        custom: true,
      }))
    : [];
  const procurementRows = [...catalogProcurementRows, ...addedProcurementRows];
  const procurementCost = procurementRows.reduce((sum, r) => sum + r.total, 0);
  const extraIutCost = iutActive ? editState.addedIutRows.reduce((sum, r) => sum + r.costPerTrip, 0) : 0;
  const totalCost = (iutActive ? option.costPerTrip : 0) + extraIutCost + procurementCost;

  return {
    scenario,
    isBreakMoq,
    iutApplicable,
    iutActive,
    option,
    iutMaterial,
    extraIutRows: iutActive ? editState.addedIutRows : [],
    procurementApplicable,
    procurementRows,
    totalFg,
    totalCost,
  };
}

export function buildSnapshotFromViewModel(vm: ScenarioViewModel): ScenarioDetailSnapshot {
  return {
    sourceScenarioName: vm.scenario.name,
    totalCost: vm.totalCost,
    businessWaste: vm.scenario.businessWaste,
    wasteSavings: vm.scenario.wasteSavings ?? null,
    wasteColor: vm.scenario.wasteColor,
    totalFg: vm.totalFg,
    fgDaysCover: vm.scenario.fgDaysCover,
    productionStopDate: vm.scenario.productionStopDate,
    iut:
  vm.scenario.id === "custom-new"
    ? null
    : vm.iutActive
      ? {
          routeFrom: vm.option.routeFrom,
          routeTo: vm.option.routeTo,
          matType: vm.iutMaterial.type,
          matCode: vm.iutMaterial.code,
          transferQty: vm.option.transferQty,
          transferLeadTime: vm.option.transferLeadTime,
          initiationDate: vm.option.initiationDate,
          laneAvailable: vm.option.laneAvailable,
          costPerTrip: vm.option.costPerTrip,
        }
      : null,
    extraIut: vm.extraIutRows,
    procurement: vm.procurementApplicable ? vm.procurementRows.map((r) => ({ ...r })) : null,
  };
}
