// © 2026 김용현
// 그래프 자료·옵션 타입과 기본값은 csat-chart.js 가 원본이다. GeoGrapher 에만
// 있는 것(메뉴 종류 GraphType — 지도 4종 포함, 내보내기 설정)만 여기서 정의한다.

export type {
  GraphOptions,
  FontRole,
  FontStack,
  StyleName,
  TickDirection,
  LegendPosition,
  InsideLegendCorner,
  AbsBarCategory,
  AbsBarDirection,
  AbsBarGraphData,
  ClimateGraphData,
  ClimateMode,
  ClimateMonthData,
  MonthInterval,
  DeviationAData,
  DeviationBData,
  DeviationBRegion,
  CubeAxisConfig,
  CubeGraphData,
  CubePoint,
  LabelOffset,
  HythergraphData,
  HythergraphMode,
  HythergraphSeries,
  MonthLabelStyle,
  LineGraphData,
  LineLabelPlacement,
  LineLeader,
  LineMarker,
  LineSeries,
  LineStyle,
  AgeLabelSide,
  PyramidAgeData,
  PyramidGraphData,
  PyramidUnit,
  RadarGraphData,
  RadarSeries,
  BubbleLegendPosition,
  ScatterGraphData,
  ScatterMode,
  ScatterPoint,
  StackedBarDirection,
  StackedCategory,
  StackedDisplayMode,
  StackedGraphData,
  TernaryGraphData,
  TernaryGridInterval,
  TernaryPoint,
} from 'csat-chart.js';

export {
  createDefaultGraphOptions,
  createDefaultAbsBarData,
  createDefaultClimateData,
  createDefaultCubeData,
  createDefaultDeviationAData,
  createDefaultDeviationBData,
  createDefaultHythergraphData,
  defaultLineLeader,
  createDefaultPyramidData,
  createDefaultRadarData,
  createDefaultScatterData,
  createDefaultStackedData,
  createDefaultTernaryData,
  AGE_GROUPS,
  LINE_DASH,
  LINE_MARKER_ORDER,
  LINE_STYLE_ORDER,
  MONTH_LABELS_EN,
  MONTH_LABELS_NUM,
} from 'csat-chart.js';

import type { LineGraphData } from 'csat-chart.js';

// 그래프 유형 (메뉴) — 지도 4종은 GeoGrapher 자체 편집기다
export type GraphType =
  | 'guide'
  | 'climate'
  | 'pyramid'
  | 'ternary'
  | 'stacked'
  | 'absbar'
  | 'line'
  | 'scatter'
  | 'hythergraph'
  | 'cube'
  | 'radar'
  | 'choropleth'
  | 'symbolmap'
  | 'isoline'
  | 'flowmap';

export const GRAPH_LABELS: Record<GraphType, string> = {
  guide: '사용법 보기',
  climate: '기후 그래프',
  pyramid: '인구 피라미드',
  ternary: '삼각 그래프',
  stacked: '100% 막대/원 그래프',
  absbar: '절댓값 막대 그래프',
  line: '꺾은선 그래프',
  scatter: '산점도/버블 차트',
  hythergraph: '하이서그래프',
  cube: '정육면체 그래프',
  radar: '방사형 그래프',
  choropleth: '단계구분도',
  symbolmap: '도형표현도',
  isoline: '등치선도',
  flowmap: '유선도',
};

export const MAP_GRAPH_TYPES: ReadonlyArray<GraphType> = ['choropleth', 'symbolmap', 'isoline', 'flowmap'];
export function isMapGraphType(t: GraphType): boolean {
  return (MAP_GRAPH_TYPES as ReadonlyArray<GraphType>).includes(t);
}

// PNG 내보내기 설정
export interface ExportSettings {
  mode: 'exam' | 'custom';
  width: number;
  height: number;
  scale: 1 | 2 | 3;
}

export function createDefaultExportSettings(): ExportSettings {
  return {
    mode: 'exam',
    width: 800,
    height: 600,
    scale: 2,
  };
}

/**
 * 꺾은선 시작 자료는 GeoGrapher 것을 쓴다 — 패키지 기본값(1~12월)보다 시험지
 * 꺾은선에 흔한 연도 축·세로 격자·진한 점선 격자로 시작한다.
 */
export function createDefaultLineData(): LineGraphData {
  return {
    series: [
      { label: '(가)', values: [100, 104, 108, 110, 113, 115, 118], lineStyle: 'solid' },
    ],
    xLabels: ['1990', '1995', '2000', '2005', '2010', '2015', '2020'],
    xUnit: '(년)',
    yUnit: '',
    yRange: { min: 0, max: 100, auto: true },
    labelPlacement: 'lineEnd',
    showMarkers: false,
    xGrid: true,
    gridColor: '#555',
    gridWidth: 1,
  };
}
