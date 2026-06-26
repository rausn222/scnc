export interface CBURow {
  srNo: number;
  cbuCode: string;
  cbuDescription: string;
  weightKg: number; // kg per EA unit for tonnes conversion
  fg: {
    dcStock: number;
    factoryStock: number;
    inTransitStock: number;
    totalStock: number;
  };
  rmpm: {
    physicalStock: number;
    qualityStock: number;
    openPOStock: number;
    totalStock: number;
    blockedStock: number;
  };
  demand: {
    sumNext3TDP: number;
    next6Months: number;
    next12Months: number;
  };
  totalFG: number;
  cover: {
    fgCoverDate: string;
    totalCoverDate: string;
    coverExclOpenPO: string;
  };
}

export const cbuData: CBURow[] = [
  {
    srNo: 1, cbuCode: "VAFA1R", cbuDescription: "Vaseline aloe fresh 96X85 ml", weightKg: 0.096,
    fg: { dcStock: 133135, factoryStock: 0, inTransitStock: 1920, totalStock: 135055 },
    rmpm: { physicalStock: 55200, qualityStock: 0, openPOStock: 144000, totalStock: 199200, blockedStock: 0 },
    demand: { sumNext3TDP: 134945, next6Months: 579016, next12Months: 1888100 },
    totalFG: 334255,
    cover: { fgCoverDate: "01-07-2026", totalCoverDate: "01-10-2026", coverExclOpenPO: "24-07-2026" },
  },
  {
    srNo: 2, cbuCode: "VAFB1R", cbuDescription: "VASELINE INTENSIVE CARE ALOE FRSH 400ML", weightKg: 0.4,
    fg: { dcStock: 81838, factoryStock: 13032, inTransitStock: 37872, totalStock: 132742 },
    rmpm: { physicalStock: 29268, qualityStock: 0, openPOStock: 50821, totalStock: 80089, blockedStock: 0 },
    demand: { sumNext3TDP: 103430, next6Months: 396103, next12Months: 890802 },
    totalFG: 212831,
    cover: { fgCoverDate: "12-07-2026", totalCoverDate: "22-08-2026", coverExclOpenPO: "12-07-2026" },
  },
  {
    srNo: 3, cbuCode: "VAFG1R", cbuDescription: "Vaseline healthy Bright 96X85 ml", weightKg: 0.096,
    fg: { dcStock: 166720, factoryStock: 113280, inTransitStock: 18912, totalStock: 298912 },
    rmpm: { physicalStock: 26112, qualityStock: 0, openPOStock: 0, totalStock: 26112, blockedStock: 0 },
    demand: { sumNext3TDP: 187075, next6Months: 1022366, next12Months: 2755719 },
    totalFG: 325024,
    cover: { fgCoverDate: "27-07-2026", totalCoverDate: "03-08-2026", coverExclOpenPO: "03-08-2026" },
  },
  {
    srNo: 4, cbuCode: "VAFH2R", cbuDescription: "VASL HB Brightening Ltn 200ml", weightKg: 0.2,
    fg: { dcStock: 39629, factoryStock: 2304, inTransitStock: 2592, totalStock: 44525 },
    rmpm: { physicalStock: 300, qualityStock: 0, openPOStock: 0, totalStock: 300, blockedStock: 0 },
    demand: { sumNext3TDP: 24820, next6Months: 203565, next12Months: 387002 },
    totalFG: 44825,
    cover: { fgCoverDate: "17-07-2026", totalCoverDate: "27-07-2026", coverExclOpenPO: "—" },
  },
  {
    srNo: 5, cbuCode: "VAFK1R", cbuDescription: "VASL HB DBL 45ml", weightKg: 0.045,
    fg: { dcStock: 37115, factoryStock: 0, inTransitStock: 5568, totalStock: 102683 },
    rmpm: { physicalStock: 11520, qualityStock: 0, openPOStock: 0, totalStock: 11520, blockedStock: 0 },
    demand: { sumNext3TDP: 0, next6Months: 0, next12Months: 0 },
    totalFG: 114203,
    cover: { fgCoverDate: "N/A", totalCoverDate: "N/A", coverExclOpenPO: "N/A" },
  },
  {
    srNo: 6, cbuCode: "VAFM1R", cbuDescription: "VTM ALOE FRESH LTN 200ml", weightKg: 0.2,
    fg: { dcStock: 48963, factoryStock: 0, inTransitStock: 1008, totalStock: 49971 },
    rmpm: { physicalStock: 5720, qualityStock: 0, openPOStock: 0, totalStock: 5720, blockedStock: 0 },
    demand: { sumNext3TDP: 29885, next6Months: 128470, next12Months: 239796 },
    totalFG: 55691,
    cover: { fgCoverDate: "27-07-2026", totalCoverDate: "05-08-2026", coverExclOpenPO: "N/A" },
  },
  {
    srNo: 7, cbuCode: "VBAA1R", cbuDescription: "Vas Deep Moisture Lotion 5 20ml", weightKg: 0.02,
    fg: { dcStock: 1396377, factoryStock: 2273184, inTransitStock: 0, totalStock: 3672161 },
    rmpm: { physicalStock: 2576080, qualityStock: 0, openPOStock: 1427000, totalStock: 4003080, blockedStock: 43200 },
    demand: { sumNext3TDP: 114000, next6Months: 31674254, next12Months: 57762331 },
    totalFG: 7675241,
    cover: { fgCoverDate: "19-03-2026", totalCoverDate: "02-10-2026", coverExclOpenPO: "2026-10" },
  },
  {
    srNo: 8, cbuCode: "VBKA10", cbuDescription: "Vaseline Sun Protect SPF 50 400ML", weightKg: 0.4,
    fg: { dcStock: 46415, factoryStock: 2232, inTransitStock: 504, totalStock: 49151 },
    rmpm: { physicalStock: 50000, qualityStock: 0, openPOStock: 0, totalStock: 50000, blockedStock: 0 },
    demand: { sumNext3TDP: 33218, next6Months: 167504, next12Months: 211074 },
    totalFG: 99151,
    cover: { fgCoverDate: "11-07-2026", totalCoverDate: "16-03-2026", coverExclOpenPO: "—" },
  },
  {
    srNo: 9, cbuCode: "VBLA2R", cbuDescription: "Vas Deep Moisture Lotion N 85ml", weightKg: 0.085,
    fg: { dcStock: 731275, factoryStock: 41856, inTransitStock: 5376, totalStock: 778507 },
    rmpm: { physicalStock: 0, qualityStock: 0, openPOStock: 0, totalStock: 0, blockedStock: 0 },
    demand: { sumNext3TDP: 249665, next6Months: 6741212, next12Months: 11367114 },
    totalFG: 778507,
    cover: { fgCoverDate: "04-09-2026", totalCoverDate: "04-09-2026", coverExclOpenPO: "04-09-2026" },
  },
  {
    srNo: 10, cbuCode: "VBLA2R", cbuDescription: "Vas Deep Moisture Lotion S 85ml", weightKg: 0.085,
    fg: { dcStock: 209637, factoryStock: 37056, inTransitStock: 25632, totalStock: 272325 },
    rmpm: { physicalStock: 0, qualityStock: 0, openPOStock: 6984, totalStock: 6984, blockedStock: 0 },
    demand: { sumNext3TDP: 249665, next6Months: 6741212, next12Months: 11367114 },
    totalFG: 272325,
    cover: { fgCoverDate: "04-07-2026", totalCoverDate: "04-07-2026", coverExclOpenPO: "04-07-2026" },
  },
  {
    srNo: 11, cbuCode: "VBLB2R", cbuDescription: "Vas Deep Moisture Lotion N 400ml", weightKg: 0.4,
    fg: { dcStock: 211329, factoryStock: 0, inTransitStock: 33204, totalStock: 252533 },
    rmpm: { physicalStock: 0, qualityStock: 0, openPOStock: 6984, totalStock: 6984, blockedStock: 0 },
    demand: { sumNext3TDP: 84510, next6Months: 4658533, next12Months: 9514845 },
    totalFG: 293517,
    cover: { fgCoverDate: "18-08-2026", totalCoverDate: "20-08-2026", coverExclOpenPO: "20-08-2026" },
  },
  {
    srNo: 12, cbuCode: "VBLB2R", cbuDescription: "Vas Deep Moisture Lotion S 400ml", weightKg: 0.4,
    fg: { dcStock: 247227, factoryStock: 0, inTransitStock: 0, totalStock: 247227 },
    rmpm: { physicalStock: 0, qualityStock: 0, openPOStock: 0, totalStock: 0, blockedStock: 0 },
    demand: { sumNext3TDP: 0, next6Months: 0, next12Months: 0 },
    totalFG: 247227,
    cover: { fgCoverDate: "N/A", totalCoverDate: "N/A", coverExclOpenPO: "N/A" },
  },
  {
    srNo: 13, cbuCode: "VBLP1R", cbuDescription: "Vas Advanced Repair Ltn 100 ml", weightKg: 0.1,
    fg: { dcStock: 24823, factoryStock: 0, inTransitStock: 1344, totalStock: 26167 },
    rmpm: { physicalStock: 6050, qualityStock: 0, openPOStock: 50400, totalStock: 56450, blockedStock: 0 },
    demand: { sumNext3TDP: 9540, next6Months: 65180, next12Months: 125074 },
    totalFG: 82617,
    cover: { fgCoverDate: "02-09-2026", totalCoverDate: "02-01-2027", coverExclOpenPO: "2026-12" },
  },
  {
    srNo: 14, cbuCode: "VBLQ1R", cbuDescription: "Vaseline Advanced Repair Lotion 400ml", weightKg: 0.4,
    fg: { dcStock: 28611, factoryStock: 3708, inTransitStock: 829, totalStock: 33148 },
    rmpm: { physicalStock: 8944, qualityStock: 0, openPOStock: 5760, totalStock: 14704, blockedStock: 0 },
    demand: { sumNext3TDP: 7773, next6Months: 55672, next12Months: 101801 },
    totalFG: 47852,
    cover: { fgCoverDate: "03-10-2026", totalCoverDate: "07-11-2026", coverExclOpenPO: "24-10-2026" },
  },
  {
    srNo: 15, cbuCode: "VBLS1R1", cbuDescription: "VSL COCOA GLOW LT 600ML", weightKg: 0.6,
    fg: { dcStock: 84165, factoryStock: 3906, inTransitStock: 5814, totalStock: 93885 },
    rmpm: { physicalStock: 8460, qualityStock: 0, openPOStock: 0, totalStock: 8460, blockedStock: 0 },
    demand: { sumNext3TDP: 3652, next6Months: 185357, next12Months: 336916 },
    totalFG: 102345,
    cover: { fgCoverDate: "21-10-2026", totalCoverDate: "24-10-2026", coverExclOpenPO: "24-10-2026" },
  },
  {
    srNo: 16, cbuCode: "VBLV1R", cbuDescription: "Vas Light Hydrate Ltn 90ml", weightKg: 0.09,
    fg: { dcStock: 34449, factoryStock: 0, inTransitStock: 384, totalStock: 34833 },
    rmpm: { physicalStock: 10944, qualityStock: 0, openPOStock: 0, totalStock: 10944, blockedStock: 0 },
    demand: { sumNext3TDP: 18733, next6Months: 184819, next12Months: 379020 },
    totalFG: 45777,
    cover: { fgCoverDate: "06-08-2026", totalCoverDate: "18-07-2026", coverExclOpenPO: "18-07-2026" },
  },
  {
    srNo: 17, cbuCode: "VBLW1R", cbuDescription: "Vas Light Hydrate Lotion 400ml", weightKg: 0.4,
    fg: { dcStock: 50220, factoryStock: 0, inTransitStock: 0, totalStock: 50220 },
    rmpm: { physicalStock: 4200, qualityStock: 0, openPOStock: 0, totalStock: 4200, blockedStock: 0 },
    demand: { sumNext3TDP: 27128, next6Months: 137306, next12Months: 278315 },
    totalFG: 54420,
    cover: { fgCoverDate: "17-08-2026", totalCoverDate: "26-08-2026", coverExclOpenPO: "26-08-2026" },
  },
  {
    srNo: 18, cbuCode: "VBMB3R", cbuDescription: "VASL HEALTHY BRT DAILY BRIGHTENING 400ML", weightKg: 0.4,
    fg: { dcStock: 74007, factoryStock: 72, inTransitStock: 11556, totalStock: 85635 },
    rmpm: { physicalStock: 10134, qualityStock: 0, openPOStock: 66132, totalStock: 76266, blockedStock: 0 },
    demand: { sumNext3TDP: 81795, next6Months: 605239, next12Months: 1137068 },
    totalFG: 161901,
    cover: { fgCoverDate: "02-07-2026", totalCoverDate: "07-08-2026", coverExclOpenPO: "24-10-2026" },
  },
  {
    srNo: 19, cbuCode: "VBMZ1R", cbuDescription: "Vaseline Deep Moisture Lotion", weightKg: 0.2,
    fg: { dcStock: 63585, factoryStock: 9444, inTransitStock: 5352, totalStock: 78381 },
    rmpm: { physicalStock: 780, qualityStock: 0, openPOStock: 0, totalStock: 780, blockedStock: 0 },
    demand: { sumNext3TDP: 2671, next6Months: 160845, next12Months: 227703 },
    totalFG: 79161,
    cover: { fgCoverDate: "12-10-2026", totalCoverDate: "13-10-2026", coverExclOpenPO: "13-10-2026" },
  },
  {
    srNo: 20, cbuCode: "VBNF1R", cbuDescription: "VSL COCOA GLOW LT 200ML", weightKg: 0.2,
    fg: { dcStock: 57090, factoryStock: 0, inTransitStock: 7728, totalStock: 64818 },
    rmpm: { physicalStock: 7540, qualityStock: 0, openPOStock: 0, totalStock: 7540, blockedStock: 0 },
    demand: { sumNext3TDP: 31600, next6Months: 605735, next12Months: 1147249 },
    totalFG: 72358,
    cover: { fgCoverDate: "25-07-2026", totalCoverDate: "31-07-2026", coverExclOpenPO: "31-07-2026" },
  },
  {
    srNo: 21, cbuCode: "VBNN1R", cbuDescription: "Vas Deep Moisture Lotion N 600ml", weightKg: 0.6,
    fg: { dcStock: 191335, factoryStock: 65052, inTransitStock: 3114, totalStock: 259501 },
    rmpm: { physicalStock: 37602, qualityStock: 0, openPOStock: 0, totalStock: 37602, blockedStock: 0 },
    demand: { sumNext3TDP: 0, next6Months: 0, next12Months: 0 },
    totalFG: 297103,
    cover: { fgCoverDate: "N/A", totalCoverDate: "N/A", coverExclOpenPO: "N/A" },
  },
  {
    srNo: 22, cbuCode: "VBNN1R", cbuDescription: "Vas Deep Moisture Lotion S 600ml", weightKg: 0.6,
    fg: { dcStock: 237703, factoryStock: 0, inTransitStock: 72, totalStock: 237775 },
    rmpm: { physicalStock: 0, qualityStock: 0, openPOStock: 0, totalStock: 0, blockedStock: 0 },
    demand: { sumNext3TDP: 0, next6Months: 0, next12Months: 0 },
    totalFG: 237775,
    cover: { fgCoverDate: "N/A", totalCoverDate: "N/A", coverExclOpenPO: "N/A" },
  },
  {
    srNo: 23, cbuCode: "VBNS10", cbuDescription: "Vas Moisture Aloe Fresh 600ml", weightKg: 0.6,
    fg: { dcStock: 21255, factoryStock: 0, inTransitStock: 0, totalStock: 21255 },
    rmpm: { physicalStock: 15624, qualityStock: 0, openPOStock: 2736, totalStock: 18360, blockedStock: 0 },
    demand: { sumNext3TDP: 23706, next6Months: 90408, next12Months: 171744 },
    totalFG: 39615,
    cover: { fgCoverDate: "25-07-2026", totalCoverDate: "21-07-2026", coverExclOpenPO: "21-07-2026" },
  },
  {
    srNo: 24, cbuCode: "VBNT100", cbuDescription: "Vaseline Healthy Bright SPF 30 600", weightKg: 0.6,
    fg: { dcStock: 54759, factoryStock: 15498, inTransitStock: 14634, totalStock: 84891 },
    rmpm: { physicalStock: 2340, qualityStock: 0, openPOStock: 14400, totalStock: 16740, blockedStock: 0 },
    demand: { sumNext3TDP: 33697, next6Months: 128242, next12Months: 226474 },
    totalFG: 101631,
    cover: { fgCoverDate: "16-09-2026", totalCoverDate: "13-10-2026", coverExclOpenPO: "22-11-2026" },
  },
  {
    srNo: 25, cbuCode: "VBZW10", cbuDescription: "Vaseline Light Volume 200ml", weightKg: 0.2,
    fg: { dcStock: 816, factoryStock: 0, inTransitStock: 0, totalStock: 816 },
    rmpm: { physicalStock: 0, qualityStock: 0, openPOStock: 0, totalStock: 2000, blockedStock: 0 },
    demand: { sumNext3TDP: 125, next6Months: 625, next12Months: 7230 },
    totalFG: 816,
    cover: { fgCoverDate: "14-12-2026", totalCoverDate: "14-12-2026", coverExclOpenPO: "14-12-2026" },
  },
  {
    srNo: 26, cbuCode: "VCBL1R", cbuDescription: "VSL COCOA GLOW LT 90ML", weightKg: 0.09,
    fg: { dcStock: 100188, factoryStock: 119616, inTransitStock: 88704, totalStock: 308508 },
    rmpm: { physicalStock: 27482, qualityStock: 0, openPOStock: 144000, totalStock: 171482, blockedStock: 0 },
    demand: { sumNext3TDP: 80254, next6Months: 1660572, next12Months: 3935376 },
    totalFG: 479990,
    cover: { fgCoverDate: "05-09-2026", totalCoverDate: "21-03-2026", coverExclOpenPO: "N/A" },
  },
  {
    srNo: 27, cbuCode: "VCBM2R", cbuDescription: "VSL COCOA GLOW LT 400ML", weightKg: 0.4,
    fg: { dcStock: 140650, factoryStock: 36, inTransitStock: 3528, totalStock: 144214 },
    rmpm: { physicalStock: 11091, qualityStock: 0, openPOStock: 72000, totalStock: 83091, blockedStock: 0 },
    demand: { sumNext3TDP: 55310, next6Months: 1668039, next12Months: 3538713 },
    totalFG: 227305,
    cover: { fgCoverDate: "11-09-2026", totalCoverDate: "19-09-2026", coverExclOpenPO: "22-08-2026" },
  },
  {
    srNo: 28, cbuCode: "VCCA2R", cbuDescription: "Vaseline cocoa glow lotion 40ml", weightKg: 0.04,
    fg: { dcStock: 86859, factoryStock: 0, inTransitStock: 1920, totalStock: 88779 },
    rmpm: { physicalStock: 15360, qualityStock: 0, openPOStock: 0, totalStock: 15360, blockedStock: 0 },
    demand: { sumNext3TDP: 1770, next6Months: 143730, next12Months: 241849 },
    totalFG: 104139,
    cover: { fgCoverDate: "26-10-2026", totalCoverDate: "04-11-2026", coverExclOpenPO: "04-11-2026" },
  },
];

export interface RMPMRow {
  plantco: string;
  fgMaterial: string;
  cbuDescription: string;
  componentCode: string;
  componentMaterialType: string;
  conversionFactor: number;
  unrestrictedStock: number;
  qualityStock: number;
  blockedStock: number;
  totalStock: number;
  inTransitStock: number;
}

// Aggregated component (summed across all locations, type 1008 excluded)
export interface AggregatedComponent {
  componentCode: string;
  componentMaterialType: string;
  unrestrictedStock: number;
  qualityStock: number;
  blockedStock: number;
  totalStock: number;
  openPOStock: number;
}

const COMPONENT_DESCRIPTIONS: Record<string, string> = {
  "65284824": "Mineral Oil Base — BP Grade RM",
  "65428959": "85ml Bottle Cap & Shrink Sleeve PM",
  "64322546": "CLD VVSLN INTNSV CARE ALOE FRSH 400ML",
  "64330490": "CLD VVSLN INTNSV CARE ALOE FRSH 400ML",
};

export function getComponentDescriptionByCode(code: string): string {
  return COMPONENT_DESCRIPTIONS[code] ?? "";
}

export function getComponentDescription(
  comp: AggregatedComponent,
): string {
  return (
    COMPONENT_DESCRIPTIONS[comp.componentCode] ??
    (comp.componentMaterialType === "1002"
      ? `Raw Material — Base Formula ${comp.componentCode}`
      : `Packaging Material — Bottle Component ${comp.componentCode}`)
  );
}

// FG-equivalent stock from source sheet — Physical Stock & Open PO Stock columns
// Keyed by CBU_Material (fgMaterial) + ComponentCode
type ComponentFgStock = {
  physicalStock: number;
  openPOStock: number;
};

const FG_STOCK_SOURCE: Array<
  [fgMaterial: string, componentCode: string, physicalStock: number, openPOStock: number]
> = [
  ["VAFA1R3", "65284824", 9600, 144000],
  ["VAFA1R3", "65428959", 55200, 0],
  ["VAFB1R0", "64322546", 29268, 38628],
  ["VAFB1R0", "64330490", 4101, 50821],
  ["VAFG1R2", "65284819", 26112, 0],
  ["VAFG1R2", "65428957", 18896, 0],
  ["VAFH2R0", "11497008", 0, 0],
  ["VAFH2R0", "64311837", 0, 0],
  ["VAFH2R0", "64313918", 300, 0],
  ["VAFK1R4", "64311831", 11520, 0],
  ["VAFK1R4", "64311838", 3000, 0],
  ["VAFK1R4", "64313921", 7200, 0],
  ["VAFM1R0", "11494026", 0, 0],
  ["VAFM1R0", "64322553", 4800, 0],
  ["VAFM1R0", "64330486", 5720, 0],
  ["VBAA1R3", "65088731", 0, 0],
  ["VBAA1R3", "65088735", 2576080, 1427000],
  ["VBAA1R3", "65088741", 195696, 0],
  ["VBAA1R3", "65462725", 55800, 0],
  ["VBKA100", "64791643", 0, 0],
  ["VBKA100", "65552069", 50000, 0],
  ["VBKA100", "65552070", 50000, 0],
  ["VBKA100", "65552071", 2088, 0],
  ["VBKA100", "65659263", 3904, 0],
  ["VBLA2R3", "65088772", 0, 0],
  ["VBLA2R3", "65088775", 0, 0],
  ["VBLA2R3", "65088778", 0, 0],
  ["VBLA2R4", "11477827", 0, 0],
  ["VBLA2R4", "65088776", 0, 0],
  ["VBLA2R4", "65088777", 0, 0],
  ["VBLA2R4", "65088779", 0, 0],
  ["VBLA2R4", "65229962", 0, 0],
  ["VBLA2R4", "65459845", 0, 0],
  ["VBLA2R4", "69796522", 0, 0],
  ["VBLB2R3", "65088800", 6984, 0],
  ["VBLB2R3", "65222882", 0, 0],
  ["VBLB2R4", "65088803", 0, 0],
  ["VBLB2R4", "65222880", 0, 0],
  ["VBLP1R0", "11511433", 0, 0],
  ["VBLP1R0", "68398126", 0, 0],
  ["VBLP1R0", "68882431", 0, 50400],
  ["VBLP1R0", "68884728", 6050, 0],
  ["VBLQ1R4", "68390609", 5544, 5760],
  ["VBLQ1R4", "68408367", 8944, 0],
  ["VBLS1R1", "62679484", 8460, 0],
  ["VBLS1R1", "62681047", 0, 0],
  ["VBLV1R3", "64767251", 0, 0],
  ["VBLV1R3", "64767253", 10944, 0],
  ["VBLV1R3", "64767254", 0, 0],
  ["VBLV1R3", "65445295", 9100, 0],
  ["VBLW1R3", "64330501", 0, 0],
  ["VBLW1R3", "64767249", 2448, 0],
  ["VBLW1R3", "64781097", 4200, 0],
  ["VBMB3R3", "64311841", 6012, 66132],
  ["VBMB3R3", "64313916", 10134, 59087],
  ["VBMZ1R0", "65218881", 780, 0],
  ["VBMZ1R0", "65231193", 0, 0],
  ["VBNF1R5", "62679473", 4800, 0],
  ["VBNF1R5", "62680457", 7540, 0],
  ["VBNF1R5", "67891674", 0, 0],
  ["VBNN1R4", "65218887", 37602, 0],
  ["VBNN1R4", "65230575", 0, 0],
  ["VBNN1R5", "65218882", 0, 0],
  ["VBNN1R5", "65230577", 0, 0],
  ["VBNS100", "64322605", 0, 0],
  ["VBNS100", "64341784", 15624, 2736],
  ["VBNS100", "64352281", 0, 0],
  ["VBNS100", "64352288", 0, 0],
  ["VBNT100", "64341780", 2340, 14400],
  ["VBNT100", "64350285", 0, 0],
  ["VBZW100", "64330501", 0, 0],
  ["VBZW100", "64822411", 0, 0],
  ["VBZW100", "64835133", 0, 0],
  ["VBZW100", "64835476", 0, 0],
  ["VBZW100", "69717447", 0, 0],
  ["VCBL1R0", "62697423", 25248, 144000],
  ["VCBL1R0", "62698468", 27482, 125800],
  ["VCBM2R3", "62679479", 3348, 72000],
  ["VCBM2R3", "62680458", 11091, 160],
  ["VCCA2R0", "62717667", 0, 0],
  ["VCCA2R0", "64807419", 15360, 0],
  ["VCCA2R0", "64809706", 13480, 0],
  ["VCCA2R0", "64878880", 0, 0],
  ["VCCF1R8", "65088790", 7440, 0],
  ["VCCF1R8", "65222884", 5000, 0],
  ["VCCF1R9", "65088789", 1200, 0],
  ["VCCF1R9", "65222878", 1200, 0],
  ["VHWE2R3", "11494922", 0, 0],
  ["VHWE2R3", "65284820", 17856, 9600],
  ["VHWE2R3", "65428954", 4848, 9600],
  ["VHWF1R0", "64322544", 3204, 126000],
  ["VHWF1R0", "64330484", 4500, 0],
  ["VHWJ1R9", "69765797", 1920, 0],
  ["VHWJ1R9", "69766802", 0, 0],
  ["VHWK1R8", "69765796", 3852, 8640],
  ["VHWK1R8", "69766806", 1600, 13000],
  ["VHWL1R6", "69765798", 0, 0],
  ["VHWL1R6", "69766804", 2054, 0],
  ["VICC1R3", "65088737", 355320, 0],
  ["VICC1R3", "65088743", 342540, 0],
  ["VICC1R3", "65222886", 0, 0],
  ["VICC1R4", "65088734", 0, 0],
  ["VICC1R4", "65088746", 0, 0],
  ["VICC1R4", "65222876", 0, 0],
];

const COMPONENT_FG_EQUIVALENT: Record<string, ComponentFgStock> =
  Object.fromEntries(
    FG_STOCK_SOURCE.map(([fgMaterial, componentCode, physicalStock, openPOStock]) => [
      `${fgMaterial}__${componentCode}`,
      { physicalStock, openPOStock },
    ]),
  );

function fgStockKey(fgMaterial: string, componentCode: string): string {
  return `${fgMaterial}__${componentCode}`;
}

export function getComponentFgStock(
  fgMaterial: string,
  componentCode: string,
): ComponentFgStock | undefined {
  return (
    COMPONENT_FG_EQUIVALENT[fgStockKey(fgMaterial, componentCode)] ??
    COMPONENT_FG_EQUIVALENT[
      fgStockKey(fgMaterial, componentCode.replace(/^65264824$/, "65284824"))
    ]
  );
}

function distributeFgAcrossPlants(
  rows: PlantComponentRow[],
  compCode: string,
  fgMaterial: string,
  field: "physicalStock" | "openPOStock",
  targetKey: "fgPhysicalStock" | "fgOpenPOStock",
): void {
  const fg = getComponentFgStock(fgMaterial, compCode);
  if (!fg) return;
  const nationalTotal = fg[field];

  const compRows = rows.filter((r) => r.componentCode === compCode);
  if (compRows.length === 0) return;

  if (nationalTotal <= 0) {
    compRows.forEach((r) => {
      r[targetKey] = 0;
    });
    return;
  }

  const weightTotal = compRows.reduce((s, r) => s + r.onHandStock, 0);
  if (weightTotal <= 0) {
    let allocated = 0;
    compRows.forEach((r, i) => {
      if (i === compRows.length - 1) {
        r[targetKey] = nationalTotal - allocated;
      } else {
        const share = Math.round(nationalTotal / compRows.length);
        r[targetKey] = share;
        allocated += share;
      }
    });
    return;
  }

  let allocated = 0;
  compRows.forEach((r, i) => {
    if (i === compRows.length - 1) {
      r[targetKey] = nationalTotal - allocated;
    } else {
      const share = Math.round((nationalTotal * r.onHandStock) / weightTotal);
      r[targetKey] = share;
      allocated += share;
    }
  });
}

function summarizeCbuRmpmFromComponents(
  comps: AggregatedComponent[],
): Pick<
  CBURow["rmpm"],
  "physicalStock" | "qualityStock" | "openPOStock" | "totalStock" | "blockedStock"
> {
  if (comps.length === 0) {
    return {
      physicalStock: 0,
      qualityStock: 0,
      openPOStock: 0,
      totalStock: 0,
      blockedStock: 0,
    };
  }
  const physicalValues = comps
    .map((c) => c.unrestrictedStock)
    .filter((v) => v > 0);
  const physicalStock =
    physicalValues.length > 0 ? Math.min(...physicalValues) : 0;

  const openPOValues = comps.map((c) => c.openPOStock).filter((v) => v > 0);
  const openPOStock =
    openPOValues.length > 0
      ? Math.min(...openPOValues)
      : comps.reduce((s, c) => s + c.openPOStock, 0);
  const blockedStock = Math.max(...comps.map((c) => c.blockedStock));
  return {
    physicalStock,
    qualityStock: 0,
    openPOStock,
    totalStock: physicalStock + openPOStock,
    blockedStock,
  };
}

// CBU_Material (fgMaterial) → component codes from source master list
export const CBU_MATERIAL_COMPONENTS: Record<string, string[]> = {
  VAFA1R3: ["65284824", "65428959"],
  VAFB1R0: ["64322546", "64330490"],
  VAFG1R2: ["65284819", "65428957"],
  VAFH2R0: ["11497008", "64311837", "64313918"],
  VAFK1R4: ["64311831", "64311838", "64313921"],
  VAFM1R0: ["11494026", "64322553", "64330486"],
  VBAA1R3: ["65088731", "65088735", "65088741", "65462725"],
  VBKA100: ["64791643", "65552069", "65552070", "65552071", "65659263"],
  VBLA2R3: ["65088772", "65088775", "65088778"],
  VBLA2R4: [
    "11477827",
    "65088776",
    "65088777",
    "65088779",
    "65229962",
    "65459845",
    "69796522",
  ],
  VBLB2R3: ["65088800", "65222882"],
  VBLB2R4: ["65088803", "65222880"],
  VBLP1R0: ["11511433", "68398126", "68882431", "68884728"],
  VBLQ1R4: ["68390609", "68408367"],
  VBLS1R1: ["62679484", "62681047"],
  VBLV1R3: ["64767251", "64767253", "64767254", "65445295"],
  VBLW1R3: ["64330501", "64767249", "64781097"],
  VBMB3R3: ["64311841", "64313916"],
  VBMZ1R0: ["65218881", "65231193"],
  VBNF1R5: ["62679473", "62680457", "67891674"],
  VBNN1R4: ["65218887", "65230575"],
  VBNN1R5: ["65218882", "65230577"],
  VBNS100: ["64322605", "64341784", "64352281", "64352288"],
  VBNT100: ["64341780", "64350285"],
  VBZW100: ["64330501", "64822411", "64835133", "64835476", "69717447"],
  VCBL1R0: ["62697423", "62698468"],
  VCBM2R3: ["62679479", "62680458"],
  VCCA2R0: ["62717667", "64807419", "64809706", "64878880"],
  VCCF1R8: ["65088790", "65222884"],
  VCCF1R9: ["65088789", "65222878"],
  VHWE2R3: ["11494922", "65284820", "65428954"],
  VHWF1R0: ["64322544", "64330484"],
  VHWJ1R9: ["69765797", "69766802"],
  VHWK1R8: ["69765796", "69766806"],
  VHWL1R6: ["69765798", "69766804"],
  VICC1R3: ["65088737", "65088743", "65222886"],
  VICC1R4: ["65088734", "65088746", "65222876"],
};

// Dashboard cbuCode row → CBU_Material (handles N/S variants sharing a cbuCode)
const FG_MATERIAL_BY_SR: Record<number, string> = {
  1: "VAFA1R3",
  2: "VAFB1R0",
  3: "VAFG1R2",
  4: "VAFH2R0",
  5: "VAFK1R4",
  6: "VAFM1R0",
  7: "VBAA1R3",
  8: "VBKA100",
  9: "VBLA2R3",
  10: "VBLA2R4",
  11: "VBLB2R3",
  12: "VBLB2R4",
  13: "VBLP1R0",
  14: "VBLQ1R4",
  15: "VBLS1R1",
  16: "VBLV1R3",
  17: "VBLW1R3",
  18: "VBMB3R3",
  19: "VBMZ1R0",
  20: "VBNF1R5",
  21: "VBNN1R4",
  22: "VBNN1R5",
  23: "VBNS100",
  24: "VBNT100",
  25: "VBZW100",
  26: "VCBL1R0",
  27: "VCBM2R3",
  28: "VCCA2R0",
};

const FG_MATERIAL_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  cbuData.map((row) => [FG_MATERIAL_BY_SR[row.srNo], row.cbuDescription]),
);

export function getRowFgMaterial(row: CBURow): string {
  return FG_MATERIAL_BY_SR[row.srNo] ?? row.cbuCode;
}

// Dashboard Srno. → basePack Code (from Excel)
const BASE_PACK_CODE_BY_SR: Record<number, string> = {
  1: "12102",
  2: "12103",
  3: "12111",
  4: "12113",
  5: "12142",
  6: "12143",
  7: "12151",
  8: "41021",
  9: "12168",
  10: "12169",
  11: "12172",
  12: "12173",
  13: "12180",
  14: "12183",
  15: "41022",
  16: "21104",
  17: "21105",
  18: "12402",
  19: "12403",
  20: "41023",
  21: "21106",
  22: "21107",
  23: "41024",
  24: "41025",
  25: "12440",
  26: "12441",
  27: "12709",
  28: "12710",
};

const BASE_PACK_DESCRIPTION_BY_CODE: Record<string, string> = {
  "12102": "VASELINE ALOE FRESH BODY LOTION 100ML",
  "12103": "VASELINE ALOE FRESH BODY LOTION 200ML",
  "12111": "VASELINE ALOE FRESH BODY LOTION 400ML",
  "12113": "VASELINE ALOE FRESH BODY LOTION 600ML",
  "12142": "VASELINE DAILY BRIGHTENING BODY LOTION 100ML",
  "12143": "VASELINE DAILY BRIGHTENING BODY LOTION 200ML",
  "12151": "VASELINE DAILY BRIGHTENING BODY LOTION 400ML",
  "41021": "VASELINE DAILY BRIGHTENING BODY LOTION 600ML",
  "12168": "VASELINE DEEP MOISTURE BODY LOTION 100ML",
  "12169": "VASELINE DEEP MOISTURE BODY LOTION 200ML",
  "12172": "VASELINE DEEP MOISTURE BODY LOTION 400ML",
  "12173": "VASELINE DEEP MOISTURE BODY LOTION 600ML",
  "12180": "VASELINE REVITALIZING BODY LOTION 100ML",
  "12183": "VASELINE REVITALIZING BODY LOTION 400ML",
  "41022": "VASELINE REVITALIZING BODY LOTION 600ML",
  "21104": "VASELINE CALMING LAVENDER BODY LOTION 200ML",
  "21105": "VASELINE CALMING LAVENDER BODY LOTION 400ML",
  "12402": "VASELINE HEALTHY BRIGHT SUN+POLLUTION PROTECTION 100ML",
  "12403": "VASELINE HEALTHY BRIGHT SUN+POLLUTION PROTECTION 200ML",
  "21107": "VASELINE INTENSIVE CARE COCOA GLOW BODY LOTION 200ML",
};

export function getRowBasePackCode(row: CBURow): string {
  return BASE_PACK_CODE_BY_SR[row.srNo] ?? "";
}

export function getRowBasePackDescription(row: CBURow): string {
  const code = getRowBasePackCode(row);
  return (
    BASE_PACK_DESCRIPTION_BY_CODE[code] ?? row.cbuDescription.toUpperCase()
  );
}

const RM_COMPONENT_PATTERNS: RegExp[] = [
  /^11\d{6}$/,
  /^652848/,
  /^652188/,
  /^650887[3457]/,
  /^6508880/,
  /^626794/,
  /^626804/,
  /^626974/,
  /^626984/,
  /^627176/,
  /^647916/,
  /^643225/,
  /^6431183[78]/,
  /^64311841/,
  /^648074/,
  /^648097/,
  /^114\d{5}$/,
  /^115\d{5}$/,
];

function inferComponentMaterialType(
  componentCode: string,
  allCodes: string[],
): string {
  if (RM_COMPONENT_PATTERNS.some((p) => p.test(componentCode))) return "1002";
  if (componentCode === allCodes[0]) return "1002";
  return "1003";
}

const STANDARD_PLANTS = [
  "U635",
  "U071",
  "ULU",
  "UTR",
  "UHI",
  "U886",
  "UCE",
] as const;

export const PLANT_CLUSTER_MAP: Record<string, string> = {
  U635: "North",
  U071: "North",
  ULU: "West",
  UTR: "Haridwar",
  U535: "DDP",
  UHI: "East",
  U886: "South",
  UCE: "East",
};

const CLUSTER_DISPLAY_ORDER = [
  "North",
  "West",
  "Central",
  "Haridwar",
  "DDP",
  "East",
  "South",
];

// VAFB1R0 plant-component stock from source sheet (orange = FG-UOM, yellow = EA)
type Vafb1r0PlantSourceRow = {
  plantco: string;
  componentCode: string;
  componentMaterialType: string;
  conversionFactor: number;
  fgUomUnrestricted: number;
  fgUomQuality: number;
  fgUomBlocked: number;
  fgUomOnHand: number;
  fgUomOpenPO: number;
  eaUnrestricted: number;
  eaQuality: number;
  eaBlocked: number;
  eaTotalProduction: number;
  eaProduceable: number;
};

const VAFB1R0_PLANT_SOURCE: Vafb1r0PlantSourceRow[] = [
  {
    plantco: "UTR",
    componentCode: "64322546",
    componentMaterialType: "1002",
    conversionFactor: 0.0278,
    fgUomUnrestricted: 65,
    fgUomQuality: 0,
    fgUomBlocked: 0,
    fgUomOnHand: 65,
    fgUomOpenPO: 0,
    eaUnrestricted: 2340,
    eaQuality: 0,
    eaBlocked: 0,
    eaTotalProduction: 2340,
    eaProduceable: 0,
  },
  {
    plantco: "U535",
    componentCode: "64322546",
    componentMaterialType: "1002",
    conversionFactor: 0.0278,
    fgUomUnrestricted: 748,
    fgUomQuality: 0,
    fgUomBlocked: 0,
    fgUomOnHand: 748,
    fgUomOpenPO: 1073,
    eaUnrestricted: 26928,
    eaQuality: 0,
    eaBlocked: 0,
    eaTotalProduction: 26928,
    eaProduceable: 38628,
  },
  {
    plantco: "UTR",
    componentCode: "64330490",
    componentMaterialType: "1003",
    conversionFactor: 1,
    fgUomUnrestricted: 1510,
    fgUomQuality: 0,
    fgUomBlocked: 0,
    fgUomOnHand: 1510,
    fgUomOpenPO: 0,
    eaUnrestricted: 1510,
    eaQuality: 0,
    eaBlocked: 0,
    eaTotalProduction: 1510,
    eaProduceable: 0,
  },
  {
    plantco: "U535",
    componentCode: "64330490",
    componentMaterialType: "1003",
    conversionFactor: 1,
    fgUomUnrestricted: 2531,
    fgUomQuality: 0,
    fgUomBlocked: 0,
    fgUomOnHand: 2531,
    fgUomOpenPO: 50821,
    eaUnrestricted: 2531,
    eaQuality: 0,
    eaBlocked: 0,
    eaTotalProduction: 2531,
    eaProduceable: 50821,
  },
];

function vafb1r0EaOpenPO(row: Vafb1r0PlantSourceRow): number {
  if (row.fgUomOpenPO <= 0) return 0;
  if (row.conversionFactor === 1) return row.fgUomOpenPO;
  return Math.max(0, row.eaProduceable - row.eaTotalProduction);
}

function buildVafb1r0RawRows(): RMPMRow[] {
  const cbuDescription =
    FG_MATERIAL_DESCRIPTIONS.VAFB1R0 ?? "VAFB1R0";
  return VAFB1R0_PLANT_SOURCE.map((s) => ({
    plantco: s.plantco,
    fgMaterial: "VAFB1R0",
    cbuDescription,
    componentCode: s.componentCode,
    componentMaterialType: s.componentMaterialType,
    conversionFactor: s.conversionFactor,
    unrestrictedStock: s.fgUomUnrestricted,
    qualityStock: s.fgUomQuality,
    blockedStock: s.fgUomBlocked,
    totalStock: s.fgUomOnHand,
    inTransitStock: 0,
  }));
}

function buildVafb1r0PlantComponentRows(
  demand12M: number,
): PlantComponentRow[] {
  return VAFB1R0_PLANT_SOURCE.map((s) => {
    const eaOpenPO = vafb1r0EaOpenPO(s);
    const required = Math.round(demand12M * s.conversionFactor);
    const onHandEa = s.eaTotalProduction;
    return {
      plantco: s.plantco,
      componentCode: s.componentCode,
      componentMaterialType: s.componentMaterialType,
      conversionFactor: s.conversionFactor,
      onHandStock: s.fgUomOnHand,
      unrestrictedStock: s.fgUomUnrestricted,
      qualityStock: s.fgUomQuality,
      stvStock: 0,
      blockedStock: s.fgUomBlocked,
      openPOStock: s.fgUomOpenPO,
      inTransitStock: 0,
      supplierInventory: 0,
      fgPhysicalStock: onHandEa,
      fgOpenPOStock: eaOpenPO,
      fgUnrestrictedStock: s.eaUnrestricted,
      fgQualityStock: s.eaQuality,
      fgBlockedStock: s.eaBlocked,
      available: s.fgUomOnHand,
      required,
      isSurplus: onHandEa + eaOpenPO >= required,
    };
  });
}

function buildRawRmpmRows(
  fgMaterial: string,
  componentCodes: string[],
): RMPMRow[] {
  const cbuDescription =
    FG_MATERIAL_DESCRIPTIONS[fgMaterial] ?? fgMaterial;
  const rows: RMPMRow[] = [];
  for (const plantco of STANDARD_PLANTS) {
    for (const componentCode of componentCodes) {
      const componentMaterialType = inferComponentMaterialType(
        componentCode,
        componentCodes,
      );
      rows.push({
        plantco,
        fgMaterial,
        cbuDescription,
        componentCode,
        componentMaterialType,
        conversionFactor: componentMaterialType === "1002" ? 0.01 : 1,
        unrestrictedStock: 0,
        qualityStock: 0,
        blockedStock: 0,
        totalStock: 0,
        inTransitStock: 0,
      });
    }
  }
  return rows;
}

const rawRmpmByFgMaterial: Record<string, RMPMRow[]> = Object.fromEntries(
  Object.entries(CBU_MATERIAL_COMPONENTS).map(([fgMaterial, codes]) => [
    fgMaterial,
    fgMaterial === "VAFB1R0"
      ? buildVafb1r0RawRows()
      : buildRawRmpmRows(fgMaterial, codes),
  ]),
);

function getRawRmpmRows(fgMaterial: string): RMPMRow[] {
  return rawRmpmByFgMaterial[fgMaterial] ?? [];
}

export function getAggregatedComponents(
  cbuCode: string,
  fgMaterial: string,
): AggregatedComponent[] {
  const rows = getRawRmpmRows(fgMaterial);
  const filtered = rows.filter((r) => r.componentMaterialType !== "1008");
  const map = new Map<
    string,
    AggregatedComponent & { fgMaterial: string }
  >();
  for (const r of filtered) {
    const existing = map.get(r.componentCode);
    if (existing) {
      existing.unrestrictedStock += r.unrestrictedStock;
      existing.qualityStock += r.qualityStock;
      existing.blockedStock += r.blockedStock;
      existing.totalStock += r.totalStock;
    } else {
      map.set(r.componentCode, {
        componentCode: r.componentCode,
        componentMaterialType: r.componentMaterialType,
        unrestrictedStock: r.unrestrictedStock,
        qualityStock: r.qualityStock,
        blockedStock: r.blockedStock,
        totalStock: r.totalStock,
        openPOStock: 0,
        fgMaterial: r.fgMaterial,
      });
    }
  }
  const result: AggregatedComponent[] = [];
  for (const comp of map.values()) {
    const { fgMaterial, ...rest } = comp;
    const fg = getComponentFgStock(fgMaterial, rest.componentCode);
    if (fg) {
      rest.unrestrictedStock = fg.physicalStock;
      rest.openPOStock = fg.openPOStock;
      rest.totalStock =
        fg.physicalStock + rest.qualityStock + rest.blockedStock;
    }
    result.push(rest);
  }
  return result;
}

export interface PlantComponentRow {
  plantco: string;
  componentCode: string;
  componentMaterialType: string;
  conversionFactor: number;
  onHandStock: number;
  unrestrictedStock: number;
  qualityStock: number;
  stvStock: number;
  blockedStock: number;
  openPOStock: number;
  inTransitStock: number;
  supplierInventory: number;
  fgPhysicalStock?: number;
  fgOpenPOStock?: number;
  fgUnrestrictedStock?: number;
  fgQualityStock?: number;
  fgStvStock?: number;
  fgBlockedStock?: number;
  /** @deprecated use onHandStock */
  available: number;
  required: number;
  isSurplus: boolean;
}

function supplierInventoryEstimate(
  plantco: string,
  componentCode: string,
  onHandStock: number,
): number {
  if (onHandStock <= 0) return 0;
  const seed =
    plantco.charCodeAt(0) + componentCode.charCodeAt(componentCode.length - 1);
  return Math.round(onHandStock * (0.08 + (seed % 7) * 0.01));
}

export function toFgEquivalent(
  componentQty: number,
  conversionFactor: number,
): number {
  if (componentQty <= 0 || conversionFactor <= 0) return 0;
  return Math.round(componentQty / conversionFactor);
}

function distributeFgOnHandBreakdown(rows: PlantComponentRow[]): void {
  for (const row of rows) {
    const fgTotal = row.fgPhysicalStock ?? 0;
    const baseTotal =
      row.unrestrictedStock +
      row.qualityStock +
      row.stvStock +
      row.blockedStock;

    if (fgTotal <= 0) {
      row.fgUnrestrictedStock = 0;
      row.fgQualityStock = 0;
      row.fgStvStock = 0;
      row.fgBlockedStock = 0;
      continue;
    }

    if (baseTotal <= 0) {
      row.fgUnrestrictedStock = fgTotal;
      row.fgQualityStock = 0;
      row.fgStvStock = 0;
      row.fgBlockedStock = 0;
      continue;
    }

    row.fgUnrestrictedStock = Math.round(
      (fgTotal * row.unrestrictedStock) / baseTotal,
    );
    row.fgQualityStock = Math.round((fgTotal * row.qualityStock) / baseTotal);
    row.fgStvStock = Math.round((fgTotal * row.stvStock) / baseTotal);
    row.fgBlockedStock = Math.round((fgTotal * row.blockedStock) / baseTotal);

    const splitTotal =
      row.fgUnrestrictedStock +
      row.fgQualityStock +
      row.fgStvStock +
      row.fgBlockedStock;
    if (splitTotal !== fgTotal) {
      row.fgUnrestrictedStock += fgTotal - splitTotal;
    }
  }
}

export function getComponentsByPlant(
  cbuCode: string,
  demand12M: number,
  fgMaterial: string,
): { plants: string[]; rows: PlantComponentRow[] } {
  if (fgMaterial === "VAFB1R0") {
    const rows = buildVafb1r0PlantComponentRows(demand12M);
    const plants = ["UTR", "U535"];
    return { plants, rows };
  }

  const rawRows = getRawRmpmRows(fgMaterial).filter(
    (r) => r.componentMaterialType !== "1008",
  );

  const plantsWithStock = new Set<string>();
  for (const r of rawRows) {
    if (r.unrestrictedStock + r.qualityStock + r.inTransitStock > 0) {
      plantsWithStock.add(r.plantco);
    }
  }

  const allPlants = [...new Set(rawRows.map((r) => r.plantco))];
  const plants = [
    ...allPlants.filter((p) => plantsWithStock.has(p)),
    ...allPlants.filter((p) => !plantsWithStock.has(p)),
  ];

  const map = new Map<string, PlantComponentRow>();
  for (const r of rawRows) {
    const key = `${r.plantco}__${r.componentCode}`;
    const existing = map.get(key);
    const onHand = r.unrestrictedStock + r.qualityStock;
    const inTransit = r.inTransitStock;
    const req = plantsWithStock.has(r.plantco)
      ? Math.round(demand12M * r.conversionFactor)
      : 0;

    if (existing) {
      existing.onHandStock += onHand;
      existing.unrestrictedStock += r.unrestrictedStock;
      existing.qualityStock += r.qualityStock;
      existing.blockedStock += r.blockedStock;
      existing.inTransitStock += inTransit;
      existing.available += onHand;
      existing.required = Math.max(existing.required, req);
    } else {
      map.set(key, {
        plantco: r.plantco,
        componentCode: r.componentCode,
        componentMaterialType: r.componentMaterialType,
        conversionFactor: r.conversionFactor,
        onHandStock: onHand,
        unrestrictedStock: r.unrestrictedStock,
        qualityStock: r.qualityStock,
        stvStock: 0,
        blockedStock: r.blockedStock,
        openPOStock: 0,
        inTransitStock: inTransit,
        supplierInventory: supplierInventoryEstimate(
          r.plantco,
          r.componentCode,
          onHand,
        ),
        available: onHand,
        required: req,
        isSurplus: onHand >= req,
      });
    }
  }

  for (const row of map.values()) {
    row.supplierInventory = supplierInventoryEstimate(
      row.plantco,
      row.componentCode,
      row.onHandStock,
    );
    row.isSurplus = row.onHandStock >= row.required;
  }

  // FG-equivalent physical & open PO from source sheet (columns K & N)
  const rows = Array.from(map.values());
  const fgMaterialByComp = new Map<string, string>();
  for (const r of rawRows) {
    if (!fgMaterialByComp.has(r.componentCode)) {
      fgMaterialByComp.set(r.componentCode, r.fgMaterial);
    }
  }
  for (const compCode of new Set(rows.map((r) => r.componentCode))) {
    const fgMaterial = fgMaterialByComp.get(compCode) ?? "";
    distributeFgAcrossPlants(
      rows,
      compCode,
      fgMaterial,
      "physicalStock",
      "fgPhysicalStock",
    );
    distributeFgAcrossPlants(
      rows,
      compCode,
      fgMaterial,
      "openPOStock",
      "fgOpenPOStock",
    );
  }

  distributeFgOnHandBreakdown(rows);

  for (const compCode of new Set(rows.map((r) => r.componentCode))) {
    const compRows = rows.filter((r) => r.componentCode === compCode);
    const cf = compRows[0]?.conversionFactor ?? 1;
    const nationalReq = Math.round(demand12M * cf);
    const fgTotal = compRows.reduce(
      (s, r) => s + (r.fgPhysicalStock ?? 0),
      0,
    );
    if (fgTotal > 0 && nationalReq > 0) {
      let allocated = 0;
      compRows.forEach((r, i) => {
        const share = r.fgPhysicalStock ?? 0;
        if (i === compRows.length - 1) {
          r.required = nationalReq - allocated;
        } else if (share > 0) {
          r.required = Math.round((nationalReq * share) / fgTotal);
          allocated += r.required;
        }
      });
    }
  }

  const activePlants = plants.filter((p) =>
    rows.some(
      (r) =>
        r.plantco === p &&
        ((r.fgPhysicalStock ?? 0) > 0 ||
          (r.fgOpenPOStock ?? 0) > 0 ||
          r.onHandStock > 0),
    ),
  );

  return { plants: activePlants.length > 0 ? activePlants : plants, rows };
}

export interface ClusterComponentRow {
  cluster: string;
  componentCode: string;
  componentMaterialType: string;
  conversionFactor: number;
  unrestricted: number;
  quality: number;
  blocked: number;
  totalStock: number;
  unrestrictedProd: number;
  qualityProd: number;
  blockedProd: number;
  totalProduction: number;
}

export function getComponentsByCluster(
  cbuCode: string,
  demand12M: number,
  fgMaterial: string,
): { clusters: string[]; rows: ClusterComponentRow[] } {
  const { rows: plantRows } = getComponentsByPlant(
    cbuCode,
    demand12M,
    fgMaterial,
  );

  const map = new Map<string, ClusterComponentRow>();

  for (const pr of plantRows) {
    const cluster = PLANT_CLUSTER_MAP[pr.plantco] ?? pr.plantco;
    const key = `${cluster}__${pr.componentCode}`;
    const onHand =
      pr.fgPhysicalStock ??
      (pr.conversionFactor > 0
        ? toFgEquivalent(pr.onHandStock, pr.conversionFactor)
        : pr.onHandStock);
    const openPO =
      pr.fgOpenPOStock ??
      (pr.conversionFactor > 0
        ? toFgEquivalent(pr.openPOStock, pr.conversionFactor)
        : pr.openPOStock);

    const existing = map.get(key);
    if (existing) {
      existing.unrestricted += onHand;
      existing.unrestrictedProd += pr.required + openPO;
    } else {
      map.set(key, {
        cluster,
        componentCode: pr.componentCode,
        componentMaterialType: pr.componentMaterialType,
        conversionFactor: pr.conversionFactor,
        unrestricted: onHand,
        quality: 0,
        blocked: 0,
        totalStock: onHand,
        unrestrictedProd: pr.required + openPO,
        qualityProd: 0,
        blockedProd: 0,
        totalProduction: pr.required + openPO,
      });
    }
  }

  for (const row of map.values()) {
    row.totalStock = row.unrestricted + row.quality + row.blocked;
    row.totalProduction =
      row.unrestrictedProd + row.qualityProd + row.blockedProd;
  }

  const clusters = CLUSTER_DISPLAY_ORDER.filter((c) =>
    [...map.values()].some((r) => r.cluster === c),
  );
  for (const row of map.values()) {
    if (!clusters.includes(row.cluster)) clusters.push(row.cluster);
  }

  return { clusters, rows: Array.from(map.values()) };
}

export interface DemandRow {
  srNo: number;
  cbu: string;
  uom: string;
  monthly: Record<string, number>;
}

export const demandMonths = [
  "2026-06","2026-07","2026-08","2026-09","2026-10","2026-11",
  "2026-12","2027-01","2027-02","2027-03","2027-04","2027-05",
];

export const demandData: DemandRow[] = [
  { srNo: 1, cbu: "VAFA1R", uom: "EA", monthly: { "2026-06": 134945, "2026-07": 74096, "2026-08": 50790, "2026-09": 73943, "2026-10": 99391, "2026-11": 145851, "2026-12": 225488, "2027-01": 150392, "2027-02": 139732, "2027-03": 334753, "2027-04": 338708, "2027-05": 120011 } },
  { srNo: 2, cbu: "VAFB1R", uom: "EA", monthly: { "2026-06": 103430, "2026-07": 76885, "2026-08": 47370, "2026-09": 57728, "2026-10": 59277, "2026-11": 51413, "2026-12": 63160, "2027-01": 63368, "2027-02": 81187, "2027-03": 102093, "2027-04": 112228, "2027-05": 72663 } },
  { srNo: 3, cbu: "VAFG1R", uom: "EA", monthly: { "2026-06": 187075, "2026-07": 133250, "2026-08": 62331, "2026-09": 151310, "2026-10": 215358, "2026-11": 273042, "2026-12": 468388, "2027-01": 323844, "2027-02": 175309, "2027-03": 255874, "2027-04": 343235, "2027-05": 166703 } },
  { srNo: 4, cbu: "VAFH2R", uom: "EA", monthly: { "2026-06": 24820, "2026-07": 22980, "2026-08": 11585, "2026-09": 19935, "2026-10": 60755, "2026-11": 63490, "2026-12": 74810, "2027-01": 54580, "2027-02": 18825, "2027-03": 11746, "2027-04": 17268, "2027-05": 6208 } },
  { srNo: 5, cbu: "VAFK1R", uom: "EA", monthly: { "2026-06": 0, "2026-07": 0, "2026-08": 0, "2026-09": 0, "2026-10": 0, "2026-11": 0, "2026-12": 0, "2027-01": 0, "2027-02": 0, "2027-03": 0, "2027-04": 0, "2027-05": 0 } },
  { srNo: 6, cbu: "VAFM1R", uom: "EA", monthly: { "2026-06": 29885, "2026-07": 23710, "2026-08": 13990, "2026-09": 16265, "2026-10": 19270, "2026-11": 25350, "2026-12": 34035, "2027-01": 32885, "2027-02": 17378, "2027-03": 32753, "2027-04": 37567, "2027-05": 12708 } },
  { srNo: 7, cbu: "VBAA1R", uom: "EA", monthly: { "2026-06": 114000, "2026-07": 135651, "2026-08": 105051, "2026-09": 5334200, "2026-10": 14242552, "2026-11": 11742800, "2026-12": 17543600, "2027-01": 7883400, "2027-02": 376589, "2027-03": 205653, "2027-04": 75627, "2027-05": 3808 } },
  { srNo: 8, cbu: "VBKA10", uom: "EA", monthly: { "2026-06": 39218, "2026-07": 29068, "2026-08": 16660, "2026-09": 27065, "2026-10": 36100, "2026-11": 19793, "2026-12": 18565, "2027-01": 24605, "2027-02": 0, "2027-03": 0, "2027-04": 0, "2027-05": 0 } },
  { srNo: 9, cbu: "VBLA2R", uom: "EA", monthly: { "2026-06": 249665, "2026-07": 180000, "2026-08": 152000, "2026-09": 200000, "2026-10": 220000, "2026-11": 198000, "2026-12": 175000, "2027-01": 163000, "2027-02": 145000, "2027-03": 190000, "2027-04": 210000, "2027-05": 185000 } },
  { srNo: 10, cbu: "VBLB2R", uom: "EA", monthly: { "2026-06": 84510, "2026-07": 72000, "2026-08": 65000, "2026-09": 80000, "2026-10": 92000, "2026-11": 88000, "2026-12": 76000, "2027-01": 70000, "2027-02": 65000, "2027-03": 78000, "2027-04": 85000, "2027-05": 79000 } },
  { srNo: 11, cbu: "VBLP1R", uom: "EA", monthly: { "2026-06": 9540, "2026-07": 8200, "2026-08": 6500, "2026-09": 7800, "2026-10": 9100, "2026-11": 10200, "2026-12": 11500, "2027-01": 9800, "2027-02": 8400, "2027-03": 10100, "2027-04": 12300, "2027-05": 8900 } },
  { srNo: 12, cbu: "VBLQ1R", uom: "EA", monthly: { "2026-06": 7773, "2026-07": 6500, "2026-08": 5200, "2026-09": 6800, "2026-10": 7900, "2026-11": 8600, "2026-12": 9200, "2027-01": 7800, "2027-02": 6900, "2027-03": 8100, "2027-04": 9500, "2027-05": 7200 } },
  { srNo: 13, cbu: "VBLS1R1", uom: "EA", monthly: { "2026-06": 3652, "2026-07": 12000, "2026-08": 9800, "2026-09": 14500, "2026-10": 18200, "2026-11": 21000, "2026-12": 24500, "2027-01": 19800, "2027-02": 16500, "2027-03": 22000, "2027-04": 25800, "2027-05": 18900 } },
  { srNo: 14, cbu: "VBLV1R", uom: "EA", monthly: { "2026-06": 18733, "2026-07": 14500, "2026-08": 10200, "2026-09": 15800, "2026-10": 19200, "2026-11": 22100, "2026-12": 25400, "2027-01": 20800, "2027-02": 17900, "2027-03": 23500, "2027-04": 27100, "2027-05": 19800 } },
  { srNo: 15, cbu: "VBLW1R", uom: "EA", monthly: { "2026-06": 27128, "2026-07": 22000, "2026-08": 16500, "2026-09": 21000, "2026-10": 25800, "2026-11": 29200, "2026-12": 33500, "2027-01": 27800, "2027-02": 23400, "2027-03": 30100, "2027-04": 35200, "2027-05": 25900 } },
  { srNo: 16, cbu: "VBMB3R", uom: "EA", monthly: { "2026-06": 81795, "2026-07": 68000, "2026-08": 52000, "2026-09": 71000, "2026-10": 85000, "2026-11": 92000, "2026-12": 108000, "2027-01": 89000, "2027-02": 76000, "2027-03": 94000, "2027-04": 110000, "2027-05": 82000 } },
  { srNo: 17, cbu: "VBMZ1R", uom: "EA", monthly: { "2026-06": 2671, "2026-07": 10800, "2026-08": 8500, "2026-09": 12000, "2026-10": 14500, "2026-11": 18000, "2026-12": 21000, "2027-01": 17200, "2027-02": 14800, "2027-03": 19500, "2027-04": 22800, "2027-05": 16700 } },
  { srNo: 18, cbu: "VBNF1R", uom: "EA", monthly: { "2026-06": 31600, "2026-07": 42000, "2026-08": 38000, "2026-09": 55000, "2026-10": 68000, "2026-11": 82000, "2026-12": 98000, "2027-01": 79000, "2027-02": 65000, "2027-03": 88000, "2027-04": 102000, "2027-05": 74000 } },
  { srNo: 19, cbu: "VBNS10", uom: "EA", monthly: { "2026-06": 23706, "2026-07": 9200, "2026-08": 7500, "2026-09": 9800, "2026-10": 11200, "2026-11": 13500, "2026-12": 15800, "2027-01": 12900, "2027-02": 10800, "2027-03": 14500, "2027-04": 17200, "2027-05": 12600 } },
  { srNo: 20, cbu: "VBNT100", uom: "EA", monthly: { "2026-06": 33697, "2026-07": 14800, "2026-08": 11200, "2026-09": 15600, "2026-10": 18900, "2026-11": 21500, "2026-12": 25800, "2027-01": 20900, "2027-02": 17400, "2027-03": 23200, "2027-04": 27500, "2027-05": 20100 } },
  { srNo: 21, cbu: "VBZW10", uom: "EA", monthly: { "2026-06": 125, "2026-07": 300, "2026-08": 500, "2026-09": 800, "2026-10": 1200, "2026-11": 1000, "2026-12": 900, "2027-01": 650, "2027-02": 480, "2027-03": 720, "2027-04": 850, "2027-05": 600 } },
  { srNo: 22, cbu: "VCBL1R", uom: "EA", monthly: { "2026-06": 80254, "2026-07": 115000, "2026-08": 98000, "2026-09": 138000, "2026-10": 175000, "2026-11": 198000, "2026-12": 235000, "2027-01": 190000, "2027-02": 162000, "2027-03": 215000, "2027-04": 252000, "2027-05": 185000 } },
  { srNo: 23, cbu: "VCBM2R", uom: "EA", monthly: { "2026-06": 55310, "2026-07": 112000, "2026-08": 95000, "2026-09": 132000, "2026-10": 168000, "2026-11": 192000, "2026-12": 228000, "2027-01": 184000, "2027-02": 155000, "2027-03": 205000, "2027-04": 242000, "2027-05": 178000 } },
  { srNo: 24, cbu: "VCCA2R", uom: "EA", monthly: { "2026-06": 1770, "2026-07": 9800, "2026-08": 8200, "2026-09": 11500, "2026-10": 14200, "2026-11": 17800, "2026-12": 21500, "2027-01": 17200, "2027-02": 14200, "2027-03": 18900, "2027-04": 22500, "2027-05": 16400 } },
];

// ─── Filter metadata ──────────────────────────────────────────────────────────

const BG_OPTIONS = ["HPC", "Foods"] as const;
const SMALL_C_OPTIONS = ["Skin Care", "Hair Care", "Oral Care"] as const;
const FORMAT_OPTIONS = ["Bottle", "Sachet", "Tube", "Bar"] as const;

function inferBrand(description: string): string {
  if (/vaseline|vasl|vas |vtm/i.test(description)) return "Vaseline";
  if (/dove/i.test(description)) return "Dove";
  if (/lux/i.test(description)) return "Lux";
  return description.split(/\s+/)[0] || "Other";
}

function inferBasePack(description: string): string {
  const match = description.match(
    /(\d+\s*[xX]\s*\d+\s*(?:ml|ML|g|G)?|\d+\s*(?:ml|ML|g|G))/,
  );
  return match?.[1]?.replace(/\s+/g, " ").trim() ?? "Standard";
}

export interface CBURowFilterAttributes {
  bg: string;
  smallC: string;
  format: string;
  brand: string;
  materialCode: string;
  materialDescription: string;
  cbuCode: string;
  cbuDescription: string;
  basePack: string;
  basePackDescription: string;
}

export function getRowFilterAttributes(row: CBURow): CBURowFilterAttributes {
  const brand = inferBrand(row.cbuDescription);
  const basePack = inferBasePack(row.cbuDescription);
  return {
    bg: BG_OPTIONS[(row.srNo - 1) % BG_OPTIONS.length],
    smallC: SMALL_C_OPTIONS[(row.srNo - 1) % SMALL_C_OPTIONS.length],
    format: FORMAT_OPTIONS[(row.srNo - 1) % FORMAT_OPTIONS.length],
    brand,
    materialCode: row.cbuCode,
    materialDescription: row.cbuDescription,
    cbuCode: row.cbuCode,
    cbuDescription: row.cbuDescription,
    basePack,
    basePackDescription: `${brand} ${basePack} Base Pack`,
  };
}

export function buildFilterOptions(
  key: keyof CBURowFilterAttributes,
): string[] {
  const values = new Set(
    cbuData.map((row) => getRowFilterAttributes(row)[key]),
  );
  return ["All", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
}

export const STATIC_FILTER_OPTIONS: Partial<
  Record<keyof CBURowFilterAttributes, string[]>
> = {
  bg: ["All", ...BG_OPTIONS],
  smallC: ["All", ...SMALL_C_OPTIONS],
  format: ["All", ...FORMAT_OPTIONS],
};

function syncCbuRmpmFromComponentFgStock(): void {
  for (const row of cbuData) {
    const fgMaterial = getRowFgMaterial(row);
    if (!rawRmpmByFgMaterial[fgMaterial]) continue;
    const summary = summarizeCbuRmpmFromComponents(
      getAggregatedComponents(row.cbuCode, fgMaterial),
    );
    row.rmpm = { ...row.rmpm, ...summary };
  }
}

syncCbuRmpmFromComponentFgStock();
