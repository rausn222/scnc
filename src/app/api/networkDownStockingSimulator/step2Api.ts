import {
  IUT_LANE_REQUIREMENTS,
  IUT_TRANSFER_LANES,
  MOQ_BREAK_MATERIALS,
  MOQ_BREAK_SUPPLIERS,
  OPEN_PO_LINES,
  RMPM_BOM_CONNECTIVITY_ROWS,
  RMPM_BOM_PENDING_LIES_WITH,
  RMPM_BOM_PENDING_TILE_LABEL,
  RMPM_CONNECTIVITY_STATUS_MESSAGE,
  RMPM_CONNECTIVITY_STATUS_PILL_LABEL,
  SUPPLIER_INVENTORY_FEEDSTOCK_MATERIALS,
  type OpenPoLine,
  type RmpmBomConnectivityRow,
} from "../../components/sciDetails/constants";
import { PLANT_OWNERSHIP_MAP } from "../../components/data";
import { delay } from "./shared";

export type MaterialScopeRow = {
  materialType: "PM" | "RM";
  materialCode: string;
  description: string;
  oldCbu: string;
  contributionType: string;
  newCbuAssociated: string;
};

// Rows shown up front for every lane's RM/PM requirement (moved here from
// step2/MaterialScopeContent.tsx, which now reads this off the fetched catalog).
const MATERIAL_SCOPE_DATA: MaterialScopeRow[] = [
  {
    oldCbu: "VAFA1R3",
    materialType: "PM",
    materialCode: "11477867",
    description: "VAS ALOE FRESH 100ML FENOMENO CAP",
    contributionType: "Unique",
    newCbuAssociated: "VCBL1R3",
  },
  {
    oldCbu: "VAFA1R0",
    materialType: "PM",
    materialCode: "11477877",
    description: "VAS ALOE FRESH 10ML FENOMENO CAP",
    contributionType: "High Contribution",
    newCbuAssociated: "",
  },
  {
    oldCbu: "VCBL1R0",
    materialType: "PM",
    materialCode: "11477887",
    description: "VAS ALOE FRESH 150ML FENOMENO CAP",
    contributionType: "High Contribution",
    newCbuAssociated: "",
  },
  {
    oldCbu: "VAFA1R3",
    materialType: "PM",
    materialCode: "65284824",
    description: "85ml Bottle Cap & Shrink Sleeve PM",
    contributionType: "Unique",
    newCbuAssociated: "VCBL1R3",
  },
];

export type MaterialBatchRow = {
  plant: string;
  materialType: "RM" | "PM";
  materialCode: string;
  batchNumber: string;
  expiryDate: string;
};

/**
 * Batch-level detail shown behind a lane material's expand/collapse toggle in IUT Feasibility
 * (moved here from step2/IutFeasibilityContent.tsx). Keyed by the same material codes each lane
 * actually keeps after its RM/PM filter — 65428959 (PM) on U535→UTR, 64322546 (RM) on UTR→U535 —
 * one batch per plant on that lane so both endpoints are checkable.
 */
const MATERIAL_BATCH_DATA: MaterialBatchRow[] = [
  {
    plant: "U535",
    materialType: "PM",
    materialCode: "65428959",
    batchNumber: "0009843159",
    expiryDate: "19-09-2026",
  },
  {
    plant: "UTR",
    materialType: "PM",
    materialCode: "65428959",
    batchNumber: "0009843160",
    expiryDate: "29-09-2026",
  },
  {
    plant: "UTR",
    materialType: "RM",
    materialCode: "64322546",
    batchNumber: "0009843161",
    expiryDate: "18-09-2026",
  },
];

export function getMaterialBatchKey(row: MaterialBatchRow) {
  return `${row.materialCode}-${row.plant}-${row.batchNumber}`;
}

export interface SimulationAssumptionsCatalog {
  openPoLines: OpenPoLine[];
  moqBreakMaterials: typeof MOQ_BREAK_MATERIALS;
  moqBreakSuppliers: typeof MOQ_BREAK_SUPPLIERS;
  supplierInventoryFeedstockMaterials: typeof SUPPLIER_INVENTORY_FEEDSTOCK_MATERIALS;
  iutTransferLanes: typeof IUT_TRANSFER_LANES;
  iutLaneRequirements: typeof IUT_LANE_REQUIREMENTS;
  materialScopeData: MaterialScopeRow[];
  materialBatchData: MaterialBatchRow[];
  rmpmBomConnectivityRows: RmpmBomConnectivityRow[];
  rmpmBomPendingLiesWith: typeof RMPM_BOM_PENDING_LIES_WITH;
  rmpmBomPendingTileLabel: typeof RMPM_BOM_PENDING_TILE_LABEL;
  rmpmConnectivityStatusMessage: typeof RMPM_CONNECTIVITY_STATUS_MESSAGE;
  rmpmConnectivityStatusPillLabel: typeof RMPM_CONNECTIVITY_STATUS_PILL_LABEL;
  plantOwnershipMap: typeof PLANT_OWNERSHIP_MAP;
}

/**
 * GET /api/simulator/assumptions?oldCbuCode=...&newCbuCode=...
 *
 * Everything Step 2 (Simulation Assumptions) needs for the given CBU pair, bundled into one
 * response — mirrors how cbuApi.ts's fetchComponentBreakdowns batches multiple lookups into a
 * single call. The mock dataset doesn't actually vary per CBU yet (same shape a real backend
 * would fan out to Old/New CBU-specific rows for), so both params are accepted and threaded
 * through the query key, but not yet used to filter — swapping in real per-CBU data later is a
 * change to this function's body only.
 */
export async function fetchSimulationAssumptions(_params: {
  oldCbuCode: string;
  newCbuCode?: string;
}): Promise<SimulationAssumptionsCatalog> {
  return delay({
    openPoLines: OPEN_PO_LINES,
    moqBreakMaterials: MOQ_BREAK_MATERIALS,
    moqBreakSuppliers: MOQ_BREAK_SUPPLIERS,
    supplierInventoryFeedstockMaterials: SUPPLIER_INVENTORY_FEEDSTOCK_MATERIALS,
    iutTransferLanes: IUT_TRANSFER_LANES,
    iutLaneRequirements: IUT_LANE_REQUIREMENTS,
    materialScopeData: MATERIAL_SCOPE_DATA,
    materialBatchData: MATERIAL_BATCH_DATA,
    rmpmBomConnectivityRows: RMPM_BOM_CONNECTIVITY_ROWS,
    rmpmBomPendingLiesWith: RMPM_BOM_PENDING_LIES_WITH,
    rmpmBomPendingTileLabel: RMPM_BOM_PENDING_TILE_LABEL,
    rmpmConnectivityStatusMessage: RMPM_CONNECTIVITY_STATUS_MESSAGE,
    rmpmConnectivityStatusPillLabel: RMPM_CONNECTIVITY_STATUS_PILL_LABEL,
    plantOwnershipMap: PLANT_OWNERSHIP_MAP,
  });
}
