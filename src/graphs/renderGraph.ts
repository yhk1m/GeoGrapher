// © 2026 김용현
// 캔버스 그래프 12종을 csat-chart.js 저수준 렌더러로 그린다.
// 화면 캔버스(GraphCanvas)와 내보내기(ExportModal)가 같은 함수를 쓴다.
import {
  installRoundRectPolyfill,
  renderAbsBarGraph,
  renderClimateGraph,
  renderCubeGraph,
  renderDeviationAGraph,
  renderDeviationBGraph,
  renderHythergraph,
  renderLineGraph,
  renderPyramidGraph,
  renderRadarChart,
  renderScatterGraph,
  renderStackedGraph,
  renderTernaryGraph,
} from 'csat-chart.js';
import type {
  AbsBarGraphData,
  ClimateGraphData,
  ClimateMode,
  CubeGraphData,
  DeviationAData,
  DeviationBData,
  GraphOptions,
  GraphType,
  HythergraphData,
  LineGraphData,
  PyramidGraphData,
  RadarGraphData,
  ScatterGraphData,
  StackedGraphData,
  TernaryGraphData,
} from '../data/types';

// 파사드(CsatChart)를 거치지 않으므로 roundRect 폴리필은 직접 건다 — 옛 브라우저용
installRoundRectPolyfill();

export interface GraphDataSet {
  climateMode: ClimateMode;
  climateData: ClimateGraphData;
  deviationAData: DeviationAData;
  deviationBData: DeviationBData;
  pyramidData: PyramidGraphData;
  ternaryData: TernaryGraphData;
  stackedData: StackedGraphData;
  absBarData: AbsBarGraphData;
  lineData: LineGraphData;
  scatterData: ScatterGraphData;
  hythergraphData: HythergraphData;
  cubeData: CubeGraphData;
  radarData: RadarGraphData;
}

/** 그렸으면 true, 캔버스 그래프가 아닌 종류면 false */
export function renderGraph(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  graphType: GraphType,
  d: GraphDataSet,
  options: GraphOptions,
): boolean {
  switch (graphType) {
    case 'climate':
      if (d.climateMode === 'normal') renderClimateGraph(ctx, w, h, d.climateData, options);
      else if (d.climateMode === 'deviationA') renderDeviationAGraph(ctx, w, h, d.deviationAData, options);
      else renderDeviationBGraph(ctx, w, h, d.deviationBData, options);
      return true;
    case 'pyramid': renderPyramidGraph(ctx, w, h, d.pyramidData, options); return true;
    case 'ternary': renderTernaryGraph(ctx, w, h, d.ternaryData, options); return true;
    case 'stacked': renderStackedGraph(ctx, w, h, d.stackedData, options); return true;
    case 'absbar': renderAbsBarGraph(ctx, w, h, d.absBarData, options); return true;
    case 'line': renderLineGraph(ctx, w, h, d.lineData, options); return true;
    case 'scatter': renderScatterGraph(ctx, w, h, d.scatterData, options); return true;
    case 'hythergraph': renderHythergraph(ctx, w, h, d.hythergraphData, options); return true;
    case 'cube': renderCubeGraph(ctx, w, h, d.cubeData, options); return true;
    case 'radar': renderRadarChart(ctx, w, h, d.radarData, options); return true;
    default: return false;
  }
}
