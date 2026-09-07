import { useEffect, useMemo, useState } from "react";
import { useNav } from "../App";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { ScrollShadowContainer } from "../components/ScrollShadowContainer";
import { ProductionPlanModal } from "../components/ProductionPlanModal";
import { StockTable } from "../components/cbuDetails/StockTable";
import { CbuDetailLoading, CbuDetailError } from "../components/cbuDetails/CbuDetailStatus";
import { CbuDetailKpiRow } from "../components/cbuDetails/CbuDetailKpiRow";
import { StockTableHeader } from "../components/cbuDetails/StockTableHeader";
import { useCbuDetailData } from "../components/cbuDetails/useCbuDetailData";
import {
  getRowMetricsGetter,
  getPlantMetricsGetter,
  getPlantProductionPlan,
} from "../components/cbuDetails/utils";
import {
  pageBreadcrumbs,
  OPEN_SIMULATION_LABEL,
  openSimulationTitle,
  BACK_TO_DASHBOARD_LABEL,
  BACK_TO_DASHBOARD_TITLE,
  noRowsMessage,
  PAGE_TITLE_SUFFIX,
  rowHeaderSubtext,
} from "../constants/cbuDetail";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  resetCbuDetailState,
  setExpandedComponents,
  setHiddenStockCols,
  setUom,
  toggleComponentExpanded,
  toggleExpandedCluster,
} from "../store/slices/cbuDetailSlice";

interface Props {
  srNo: number;
}

export default function CBUDetail({ srNo }: Readonly<Props>) {
  const { navigate } = useNav();
  const {
    row,
    isLoading,
    isError,
    uniqueRM,
    uniquePM,
    peakMonth,
    plants,
    clusters,
    plantRows,
    peakPlant,
    highContribComps,
    uniqueComponents,
    fgTotal,
    demand12,
  } = useCbuDetailData(srNo);

  const dispatch = useAppDispatch();
  const uom = useAppSelector((s) => s.cbuDetail.uom);
  const stockView = useAppSelector((s) => s.cbuDetail.stockView);
  const expandedComponentsList = useAppSelector(
    (s) => s.cbuDetail.expandedComponents,
  );
  const expandedCluster = useAppSelector((s) => s.cbuDetail.expandedCluster);
  const hiddenStockColsList = useAppSelector(
    (s) => s.cbuDetail.hiddenStockCols,
  );
  const expandedComponents = useMemo(
    () => new Set(expandedComponentsList),
    [expandedComponentsList],
  );
  const hiddenStockCols = useMemo(
    () => new Set(hiddenStockColsList),
    [hiddenStockColsList],
  );
  const [productionPlanPlant, setProductionPlanPlant] = useState<string | null>(
    null,
  );

  // Each CBU detail visit should start from a clean slate, matching the
  // page's previous per-mount local-state behaviour.
  useEffect(() => {
    dispatch(resetCbuDetailState());
  }, [dispatch, srNo]);

  if (isLoading) return <CbuDetailLoading />;
  if (isError || !row) {
    return <CbuDetailError onBack={() => navigate({ page: "dashboard" })} />;
  }

  const anyOnHandExpanded = expandedComponents.size > 0;
  const isPlantView = stockView === "plant";
  const rowLabels = isPlantView ? plants : clusters;
  const hasRows = rowLabels.length > 0;
  const getMetrics = getRowMetricsGetter(isPlantView, plantRows, uom, demand12);
  const getPlantMetrics = getPlantMetricsGetter(plantRows, uom, demand12);

  const toggleAllOnHandExpanded = () => {
    dispatch(setExpandedComponents(anyOnHandExpanded ? [] : uniqueComponents));
  };

  const toggleComponentOnHandExpanded = (compCode: string) => {
    dispatch(toggleComponentExpanded(compCode));
  };

  const handleClusterClick = (cluster: string) => {
    dispatch(toggleExpandedCluster(cluster));
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "#f5f7fa" }}
    >
      <PageHeader
        title={`${row.cbuCode}${PAGE_TITLE_SUFFIX}`}
        breadcrumbs={pageBreadcrumbs(row.cbuCode, () => navigate({ page: "dashboard" }))}
      >
        <button
          title={openSimulationTitle(row.cbuCode)}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ backgroundColor: "#ffffff24", color: "#fff" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor =
              "#ffffff40";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor =
              "#ffffff24";
          }}
        >
          {OPEN_SIMULATION_LABEL}
        </button>
      </PageHeader>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <button
          type="button"
          onClick={() => navigate({ page: "dashboard" })}
          title={BACK_TO_DASHBOARD_TITLE}
          className="flex items-center gap-1 text-xs font-semibold cursor-pointer"
          style={{ color: "#1565C0" }}
        >
          <ChevronLeft size={14} />
          {BACK_TO_DASHBOARD_LABEL}
        </button>

        <CbuDetailKpiRow
          uniqueRM={uniqueRM}
          uniquePM={uniquePM}
          demand12={demand12}
          fgTotal={fgTotal}
          peakMonth={peakMonth}
          peakPlant={peakPlant}
          highContribComps={highContribComps}
        />

        <div
          className="bg-white rounded-xl p-5"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <StockTableHeader
            isPlantView={isPlantView}
            anyOnHandExpanded={anyOnHandExpanded}
            onToggleOnHand={toggleAllOnHandExpanded}
            uom={uom}
            onUomChange={(id) => dispatch(setUom(id))}
            hiddenCols={hiddenStockCols}
            onHiddenColsChange={(next) => dispatch(setHiddenStockCols(next))}
          />

          {!hasRows ? (
            <p className="text-sm italic" style={{ color: "#94a3b8" }}>
              {noRowsMessage(isPlantView)}
            </p>
          ) : (
            <ScrollShadowContainer
              className="overflow-x-auto rounded-lg"
              style={{ border: "1px solid #e2e8f0" }}
            >
              <StockTable
                row={row}
                uom={uom}
                rowHeader={isPlantView ? "Plant" : "Cluster"}
                rowHeaderSubtext={rowHeaderSubtext(isPlantView)}
                rowLabels={rowLabels}
                plantRows={plantRows}
                uniqueComponents={uniqueComponents}
                getMetrics={getMetrics}
                getPlantMetrics={getPlantMetrics}
                expandedComponents={expandedComponents}
                onToggleComponentExpanded={toggleComponentOnHandExpanded}
                onPlantProductionClick={setProductionPlanPlant}
                clusterDrilldown={!isPlantView}
                allPlants={plants}
                expandedCluster={expandedCluster}
                onClusterClick={handleClusterClick}
                hiddenCols={hiddenStockCols}
              />
            </ScrollShadowContainer>
          )}
        </div>
      </div>

      {productionPlanPlant && (
        <ProductionPlanModal
          plantCode={productionPlanPlant}
          cbuCode={row.cbuCode}
          cbuDescription={row.cbuDescription}
          totalProduction={getPlantProductionPlan(
            productionPlanPlant,
            row.srNo,
            demand12,
          )}
          onClose={() => setProductionPlanPlant(null)}
        />
      )}
    </div>
  );
}
