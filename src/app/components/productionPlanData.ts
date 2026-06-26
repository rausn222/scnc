// Production plan data extracted from production-plan.csv
// CBU: VCBL1R0 across plants U535 and UTR

export interface PlanComponent {
  code: string;
  materialType: "1002" | "1003";
  typeName: string;
  conversionFactor: number; // KG per EA
  plants: {
    plantCode: string;
    unrestricted: number; // in native UOM (KG for RM, EA for PM)
    quality: number;
    blocked: number;
    openPO: number;
    totalStockFGEquiv: number; // pre-calculated FG equivalent
    totalProdPlan: number;
    fgProducibleNoAction: number;
    wasteNoAction: number;
    eolNoAction: string;
    iutPossible: boolean;
    transferQty: number;
    materialAfterIUT: number;
    minProdAfterIUT: number;
    totalProdWithIUT: number;
    wasteAfterIUT: number;
    eolAfterIUT: string;
    orderQtyFG: number;
    orderQtyRMPM: number;
    moq: number;
    netOrder: number;
    targetLandingDate: string;
    targetProdQty: number;
    extraOrderQty: number;
    netOrderScenario4: number;
    wasteScenario4: number;
  }[];
}

export interface ProductionPlan {
  cbuCode: string;
  totalProdPlan: number;
  components: PlanComponent[];
}

export interface PlanOpenPO {
  supplier: string;
  plant: string;
  componentCode: string;
  componentType: string;
  txDate: string;
  openQty: number;
  uom: string;
  fgEquiv: number;
  status: "Accepted" | "Proceed";
}

export interface PlanScenario {
  id: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  name: string;
  desc: string;
  eolDate: string;
  fgProducible: number;
  shortfall: number;
  scrapQty: number;
  valueAtRisk: number;
  addlProcurement: number | null;
  planCoverage: number;
  bulletPoints: string[];
}

// ─── Raw plan data for VCBL1R0 ────────────────────────────────────────────────

export const VCBL1R0_PLAN: ProductionPlan = {
  cbuCode: "VCBL1R0",
  totalProdPlan: 555555, // U535(444,444) + UTR(111,111)
  components: [
    {
      code: "62697423",
      materialType: "1002",
      typeName: "Ingredient",
      conversionFactor: 0.010416667,
      plants: [
        {
          plantCode: "U535",
          unrestricted: 123,    // KG
          quality: 0,
          blocked: 0,
          openPO: 500,          // KG
          totalStockFGEquiv: 59808,
          totalProdPlan: 444444,
          fgProducibleNoAction: 29582,
          wasteNoAction: 314.85,
          eolNoAction: "15-06-2026",
          iutPossible: true,
          transferQty: 0,
          materialAfterIUT: 30226,
          minProdAfterIUT: 12589,
          totalProdWithIUT: 42171,
          wasteAfterIUT: 184,
          eolAfterIUT: "15-06-2026",
          orderQtyFG: 402273,
          orderQtyRMPM: 4006.62,
          moq: 500,
          netOrder: 4006.62,
          targetLandingDate: "29-06-2026",
          targetProdQty: 333333,
          extraOrderQty: 2849.22,
          netOrderScenario4: 2849.22,
          wasteScenario4: 0,
        },
        {
          plantCode: "UTR",
          unrestricted: 140,    // KG
          quality: 0,
          blocked: 0,
          openPO: 1000,         // KG
          totalStockFGEquiv: 109440,
          totalProdPlan: 111111,
          fgProducibleNoAction: 109440,
          wasteNoAction: 0,
          eolNoAction: "31-05-2026",
          iutPossible: false,
          transferQty: 0,
          materialAfterIUT: 0,
          minProdAfterIUT: 0,
          totalProdWithIUT: 109440,
          wasteAfterIUT: 0,
          eolAfterIUT: "31-05-2026",
          orderQtyFG: 1671,
          orderQtyRMPM: 17,
          moq: 500,
          netOrder: 500,
          targetLandingDate: "29-06-2026",
          targetProdQty: 111111,
          extraOrderQty: 17.41,
          netOrderScenario4: 500,
          wasteScenario4: 482.59,
        },
      ],
    },
    {
      code: "62698468",
      materialType: "1003",
      typeName: "Packaging",
      conversionFactor: 1,
      plants: [
        {
          plantCode: "U535",
          unrestricted: 15782,  // EA
          quality: 0,
          blocked: 0,
          openPO: 13800,        // EA
          totalStockFGEquiv: 29582,
          totalProdPlan: 444444,
          fgProducibleNoAction: 29582,
          wasteNoAction: 0,
          eolNoAction: "15-06-2026",
          iutPossible: false,
          transferQty: 0,
          materialAfterIUT: 12589,
          minProdAfterIUT: 12589,
          totalProdWithIUT: 42171,
          wasteAfterIUT: 0,
          eolAfterIUT: "15-06-2026",
          orderQtyFG: 402273,
          orderQtyRMPM: 402273,
          moq: 0,
          netOrder: 402273,
          targetLandingDate: "29-06-2026",
          targetProdQty: 333333,
          extraOrderQty: 303751,
          netOrderScenario4: 303751,
          wasteScenario4: 0,
        },
        {
          plantCode: "UTR",
          unrestricted: 11700,  // EA
          quality: 0,
          blocked: 0,
          openPO: 112000,       // EA
          totalStockFGEquiv: 123700,
          totalProdPlan: 111111,
          fgProducibleNoAction: 109440,
          wasteNoAction: 14260,
          eolNoAction: "31-05-2026",
          iutPossible: true,
          transferQty: 12589,
          materialAfterIUT: 1671,
          minProdAfterIUT: 0,
          totalProdWithIUT: 109440,
          wasteAfterIUT: 1671,
          eolAfterIUT: "31-05-2026",
          orderQtyFG: 1671,
          orderQtyRMPM: 0,
          moq: 1000,
          netOrder: 0,
          targetLandingDate: "29-06-2026",
          targetProdQty: 111111,
          extraOrderQty: 0,
          netOrderScenario4: 0,
          wasteScenario4: 0,
        },
      ],
    },
  ],
};

// ─── Pre-built Open POs ───────────────────────────────────────────────────────

export const VCBL1R0_OPEN_POS: PlanOpenPO[] = [
  {
    supplier: "BASF SE",
    plant: "U535",
    componentCode: "62697423",
    componentType: "RM",
    txDate: "15-08-2026",
    openQty: 500,
    uom: "KG",
    fgEquiv: 48000,
    status: "Accepted",
  },
  {
    supplier: "Evonik Ind.",
    plant: "UTR",
    componentCode: "62697423",
    componentType: "RM",
    txDate: "29-06-2026",
    openQty: 1000,
    uom: "KG",
    fgEquiv: 96000,
    status: "Proceed",
  },
  {
    supplier: "Smurfit Kappa",
    plant: "U535",
    componentCode: "62698468",
    componentType: "PM",
    txDate: "15-06-2026",
    openQty: 13800,
    uom: "EA",
    fgEquiv: 13800,
    status: "Accepted",
  },
  {
    supplier: "Huhtamaki",
    plant: "UTR",
    componentCode: "62698468",
    componentType: "PM",
    txDate: "31-05-2026",
    openQty: 112000,
    uom: "EA",
    fgEquiv: 112000,
    status: "Accepted",
  },
];

// ─── Pre-built scenarios ──────────────────────────────────────────────────────

export const VCBL1R0_SCENARIOS: PlanScenario[] = [
  {
    id: "no-action",
    tag: "BASELINE",
    tagColor: "#4a7a9a",
    tagBg: "rgba(74,122,154,0.15)",
    name: "No Action",
    desc: "Produce only from on-hand FG and current unrestricted RMPM stock. No open POs actioned, no transfers, no additional procurement.",
    eolDate: "31-05-2026",
    fgProducible: 139022,
    shortfall: -416533,
    scrapQty: 14575,
    valueAtRisk: 11500,
    addlProcurement: null,
    planCoverage: 25,
    bulletPoints: [
      "Stop production at U535 on 15-Jun-2026",
      "Stop production at UTR on 31-May-2026",
      "Write-off remaining components at cost",
      "Issue credit notes to accounts within 30 days",
    ],
  },
  {
    id: "order-moq",
    tag: "SHORTFALL",
    tagColor: "#f59e0b",
    tagBg: "rgba(245,158,11,0.12)",
    name: "Order Basis MOQ",
    desc: "Place new purchase orders at minimum order quantity for each component to maximise production within the planning horizon. Target landing 29-Jun-2026.",
    eolDate: "29-06-2026",
    fgProducible: 444444,   // 333,333 (U535) + 111,111 (UTR)
    shortfall: -111111,     // 555,555 − 444,444
    scrapQty: 483,          // UTR waste 482.59
    valueAtRisk: 98660,
    addlProcurement: 14000,
    planCoverage: 80,
    bulletPoints: [
      "Order 4,006.62 KG of 62697423 at U535 (MOQ 500 KG)",
      "Order 303,751 EA of 62698468 at U535 (no MOQ)",
      "Order 500 KG of 62697423 at UTR (MOQ 500 KG)",
      "PO receipts complete by 29-Jun-2026",
      "111,111 FG demand shortfall remains",
    ],
  },
  {
    id: "network-planner",
    tag: "PROCUREMENT NEEDS",
    tagColor: "#00c8f0",
    tagBg: "rgba(0,200,240,0.1)",
    name: "Production Stop Date",
    desc: "Procure additional RMPM based on the production date input by the network planner. Optimises order quantity to minimise business waste while meeting target production.",
    eolDate: "29-06-2026",
    fgProducible: 444444,   // 333,333 (U535) + 111,111 (UTR)
    shortfall: -111111,
    scrapQty: 0,
    valueAtRisk: 0,
    addlProcurement: 14000,
    planCoverage: 80,
    bulletPoints: [
      "U535: additional 2,849.22 KG of 62697423 (MOQ 500 → net 2,849 KG)",
      "U535: additional 303,751 EA of 62698468 ordered",
      "UTR: 500 KG of 62697423 ordered at MOQ",
      "No component write-off; scrap saving vs baseline: +₹11,500",
      "Higher COGS — procurement at spot rate",
    ],
  },
  {
    id: "iut",
    tag: "OPERATIONAL UPLIFT",
    tagColor: "#22c55e",
    tagBg: "rgba(34,197,94,0.1)",
    name: "IUT — Intercompany Transfer",
    desc: "Transfer available stock between plants where IUT is feasible (U535 → UTR) to maximise production without additional procurement.",
    eolDate: "15-06-2026",
    fgProducible: 151611,
    shortfall: -403944,
    scrapQty: 1855,
    valueAtRisk: 85683,
    addlProcurement: null,
    planCoverage: 27,
    bulletPoints: [
      "Transfer 12,589 EA of 62698468 from UTR → U535",
      "U535 total production increases to 42,171 FG",
      "UTR production unchanged at 109,440 FG",
      "Excess packaging (bottles/labels) drives scrap at UTR",
    ],
  },
];

// ─── Aggregated component view for component breakdown section ────────────────

export interface PlanComponentSummary {
  code: string;
  name: string;
  type: string;
  currStock: number;
  onHandStock: number;
  openPO: number;
  unitFG: number;
  fxWPO: number;        // FG units with PO
  consumed: number;
  leftover: number;
}

export function getVCBL1R0Components(): PlanComponentSummary[] {
  return [
    {
      code: "62697423",
      name: "Lotion Base — Active Ingredient",
      type: "Ingredient",
      currStock: Math.round((123 + 140) / 0.010416667),           // 25,248 EA equiv
      onHandStock: Math.round((123 + 140) / 0.010416667),
      openPO: Math.round((500 + 1000) / 0.010416667),             // 144,000 EA equiv
      unitFG: 0.010416667,
      fxWPO: Math.round((123 + 140 + 500 + 1000) / 0.010416667), // 169,248 EA
      consumed: 139022,
      leftover: 0,
    },
    {
      code: "62698468",
      name: "Primary Packaging — Bottle/Label",
      type: "Packaging",
      currStock: 15782 + 11700,           // 27,482 EA
      onHandStock: 15782 + 11700,
      openPO: 13800 + 112000,             // 125,800 EA
      unitFG: 1,
      fxWPO: 15782 + 11700 + 13800 + 112000, // 153,282 EA
      consumed: 139022,
      leftover: Math.max(0, (15782 + 11700) - 139022),
    },
  ];
}
