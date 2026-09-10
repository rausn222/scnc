import {
  CUSTOM_SCENARIO,
  IUT_TRANSFER_OPTIONS,
  MOQ_PLANT_OPTIONS,
  MOQ_PLANT_OPTIONS_BREAK,
  NO_ACTION_WASTE,
  PLANT_BREAKDOWN_BASE,
  PREDEFINED_DETAIL,
  SCENARIOS,
} from "../../components/sciDetails/constants";
import {
  FOCUS_VIEW_IUT_MATERIALS,
  FOCUS_VIEW_OPTIONS,
  FOCUS_VIEW_PROCUREMENT,
  FOCUS_VIEW_SAVINGS_TIER_COLOR,
  IUT_TRANSFER_SLA_DAYS,
} from "../../constants/networkDownStockingAgent";
import type { ScenarioDetailSnapshot } from "../../components/networkDownStockingSimulator/step3/ScenarioDetailPrimitives";
import type { ScenarioRow } from "../../components/sciDetails/types";
import { delay } from "./shared";

export interface ScenarioCatalog {
  scenarios: typeof SCENARIOS;
  customScenario: typeof CUSTOM_SCENARIO;
  iutTransferOptions: typeof IUT_TRANSFER_OPTIONS;
  moqPlantOptions: typeof MOQ_PLANT_OPTIONS;
  moqPlantOptionsBreak: typeof MOQ_PLANT_OPTIONS_BREAK;
  noActionWaste: typeof NO_ACTION_WASTE;
  plantBreakdownBase: typeof PLANT_BREAKDOWN_BASE;
  predefinedDetail: typeof PREDEFINED_DETAIL;
  focusViewOptions: typeof FOCUS_VIEW_OPTIONS;
  focusViewSavingsTierColor: typeof FOCUS_VIEW_SAVINGS_TIER_COLOR;
  focusViewIutMaterials: typeof FOCUS_VIEW_IUT_MATERIALS;
  focusViewProcurement: typeof FOCUS_VIEW_PROCUREMENT;
  iutTransferSlaDays: typeof IUT_TRANSFER_SLA_DAYS;
}

/**
 * GET /api/simulator/scenario-catalog?oldCbuCode=...&newCbuCode=...
 *
 * Everything Step 3 (Scenario Comparison, More Details, Compare, the "Sample" Focus View page)
 * needs for the given CBU pair, bundled into one response. Same "not yet CBU-filtered, but
 * shaped like it will be" note as fetchSimulationAssumptions — this mock dataset is fixed today,
 * a real backend would vary it per CBU pair.
 */
export async function fetchScenarioCatalog(_params: {
  oldCbuCode: string;
  newCbuCode?: string;
}): Promise<ScenarioCatalog> {
  return delay({
    scenarios: SCENARIOS,
    customScenario: CUSTOM_SCENARIO,
    iutTransferOptions: IUT_TRANSFER_OPTIONS,
    moqPlantOptions: MOQ_PLANT_OPTIONS,
    moqPlantOptionsBreak: MOQ_PLANT_OPTIONS_BREAK,
    noActionWaste: NO_ACTION_WASTE,
    plantBreakdownBase: PLANT_BREAKDOWN_BASE,
    predefinedDetail: PREDEFINED_DETAIL,
    focusViewOptions: FOCUS_VIEW_OPTIONS,
    focusViewSavingsTierColor: FOCUS_VIEW_SAVINGS_TIER_COLOR,
    focusViewIutMaterials: FOCUS_VIEW_IUT_MATERIALS,
    focusViewProcurement: FOCUS_VIEW_PROCUREMENT,
    iutTransferSlaDays: IUT_TRANSFER_SLA_DAYS,
  });
}

export interface CreateCustomScenarioPayload {
  oldCbuCode: string;
  name: string;
  snapshot: ScenarioDetailSnapshot;
}

export interface CreateCustomScenarioResult {
  scenario: ScenarioRow;
  snapshot: ScenarioDetailSnapshot;
}

/** POST /api/simulator/scenarios — commits a "Create New Scenario" / "Save as New Scenario". */
export async function createCustomScenario(
  payload: CreateCustomScenarioPayload,
): Promise<CreateCustomScenarioResult> {
  const id = `custom-${Date.now()}`;
  const scenario: ScenarioRow = {
    id,
    name: payload.name,
    businessWaste: payload.snapshot.businessWaste,
    wasteSavings: payload.snapshot.wasteSavings,
    wasteColor: payload.snapshot.wasteColor,
    fgDaysCover: payload.snapshot.fgDaysCover,
    isBest: false,
    nextActionPrefix: "",
    nextAction: "Review Custom Scenario",
    icon: "custom",
    feasibleProducible: payload.snapshot.totalFg,
    productionStopDate: payload.snapshot.productionStopDate,
    dailyRunRate: 0,
  };
  return delay({ scenario, snapshot: payload.snapshot });
}

export interface UpdateCustomScenarioPayload {
  scenarioId: string;
  snapshot: ScenarioDetailSnapshot;
}

/** POST /api/simulator/scenarios/:id — re-saves an already-created custom scenario's edits. */
export async function updateCustomScenario(
  payload: UpdateCustomScenarioPayload,
): Promise<{ snapshot: ScenarioDetailSnapshot }> {
  return delay({ snapshot: payload.snapshot });
}

export interface AcceptScenarioPayload {
  scenarioId: string;
  oldCbuCode: string;
}

/** POST /api/simulator/scenarios/:id/accept */
export async function acceptScenario(
  payload: AcceptScenarioPayload,
): Promise<{ acceptedId: string }> {
  return delay({ acceptedId: payload.scenarioId });
}
