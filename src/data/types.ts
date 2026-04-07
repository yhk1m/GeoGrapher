// © 2026 김용현
// 그래프 유형
export type GraphType =
  | 'climate'
  | 'pyramid'
  | 'ternary'
  | 'stacked'
  | 'scatter'
  | 'hythergraph'
  | 'cube'
  | 'radar';

export const GRAPH_LABELS: Record<GraphType, string> = {
  climate: '기후 그래프',
  pyramid: '인구 피라미드',
  ternary: '삼각 그래프',
  stacked: '누적 막대/원 그래프',
  scatter: '산점도/버블 차트',
  hythergraph: '하이서그래프',
  cube: '정육면체 그래프',
  radar: '방사형 그래프',
};

// 기후 그래프 데이터
export interface ClimateMonthData {
  temp: number;
  precip: number;
}

export type MonthInterval = 12 | 4 | 2;

export interface ClimateGraphData {
  months: ClimateMonthData[];
  monthInterval: MonthInterval;
  tempLabel: string;
  precipLabel: string;
  tempRange: { min: number; max: number; auto: boolean };
  precipRange: { min: number; max: number; auto: boolean };
}

// 편차 그래프 모드
export type ClimateMode = 'normal' | 'deviationA' | 'deviationB';

// 모드 A — 월별 편차 (시계열)
export interface DeviationAData {
  baseMonths: ClimateMonthData[]; // 월별 기준값
  months: ClimateMonthData[]; // 실제값, 편차는 렌더링 시 계산
  monthInterval: MonthInterval;
  tempLabel: string;
  precipLabel: string;
  tempRange: { min: number; max: number; auto: boolean };
  precipRange: { min: number; max: number; auto: boolean };
}

// 모드 B — 지역별 편차 (비교형)
export interface DeviationBRegion {
  label: string;
  precip: number;
  temp: number;
}

export type LegendPosition = 'bottom' | 'right';

export interface DeviationBData {
  baseTemp: number;
  basePrecip: number;
  regions: DeviationBRegion[];
  precipDiffLabel: string;
  tempDiffLabel: string;
  precipUnit: string;
  tempUnit: string;
  precipRange: { min: number; max: number; auto: boolean };
  tempRange: { min: number; max: number; auto: boolean };
}

export function createDefaultDeviationAData(): DeviationAData {
  return {
    baseMonths: Array.from({ length: 12 }, () => ({ temp: 0, precip: 0 })),
    months: Array.from({ length: 12 }, () => ({ temp: 0, precip: 0 })),
    monthInterval: 12,
    tempLabel: '(°C)',
    precipLabel: '(mm)',
    tempRange: { min: -10, max: 10, auto: true },
    precipRange: { min: -200, max: 200, auto: true },
  };
}

export function createDefaultDeviationBData(): DeviationBData {
  return {
    baseTemp: 0,
    basePrecip: 0,
    regions: [
      { label: 'A', precip: 0, temp: 0 },
      { label: 'B', precip: 0, temp: 0 },
      { label: 'C', precip: 0, temp: 0 },
    ],
    precipDiffLabel: '강수량 차이',
    tempDiffLabel: '기온 차이',
    precipUnit: '(mm)',
    tempUnit: '(°C)',
    precipRange: { min: -200, max: 200, auto: true },
    tempRange: { min: -10, max: 10, auto: true },
  };
}

// 누적 막대/원 그래프 데이터
export type StackedDisplayMode = 'bar' | 'pie';
export type StackedBarDirection = 'vertical' | 'horizontal';

export interface StackedCategory {
  label: string;
  values: number[];
}

export interface StackedGraphData {
  displayMode: StackedDisplayMode;
  barDirection: StackedBarDirection;
  categories: StackedCategory[];
  seriesLabels: string[];
  unit: string;
}

// 채움 색상/패턴은 canvas/patterns.ts 의 getStackedFill() 사용

export function createDefaultStackedData(): StackedGraphData {
  return {
    displayMode: 'bar',
    barDirection: 'vertical',
    categories: [
      { label: '(가)', values: [40, 30, 30] },
      { label: '(나)', values: [50, 25, 25] },
      { label: '(다)', values: [20, 40, 40] },
    ],
    seriesLabels: ['항목1', '항목2', '항목3'],
    unit: '(%)',
  };
}

// 삼각 그래프 데이터
export interface TernaryPoint {
  a: number;
  b: number;
  c: number;
  label: string;
}

export type TernaryGridInterval = 10 | 20 | 25;

export interface TernaryGraphData {
  points: TernaryPoint[];
  axisLabels: [string, string, string];
  gridInterval: TernaryGridInterval;
}

export function createDefaultTernaryData(): TernaryGraphData {
  return {
    points: [
      { a: 33, b: 33, c: 34, label: '(가)' },
    ],
    axisLabels: ['A', 'B', 'C'],
    gridInterval: 20,
  };
}

// 인구 피라미드 데이터
export const AGE_GROUPS = [
  '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34',
  '35-39', '40-44', '45-49', '50-54', '55-59', '60-64',
  '65-69', '70-74', '75-79', '80+',
];

export interface PyramidAgeData {
  male: number;
  female: number;
}

export type PyramidUnit = 'count' | 'percent';
export type AgeLabelSide = 'left' | 'right' | 'center';

export interface PyramidGraphData {
  ages: PyramidAgeData[];
  unit: PyramidUnit;
  maleLabel: string;
  femaleLabel: string;
  axisLabel: string;
  range: { max: number; auto: boolean };
  ageLabelSide: AgeLabelSide;
}

export function createDefaultPyramidData(): PyramidGraphData {
  return {
    ages: Array.from({ length: 17 }, () => ({ male: 0, female: 0 })),
    unit: 'percent',
    maleLabel: '남',
    femaleLabel: '여',
    axisLabel: '(%)',
    range: { max: 10, auto: true },
    ageLabelSide: 'center',
  };
}

// 산점도/버블 차트 데이터
export type ScatterMode = 'normal' | 'deviation';

export interface ScatterPoint {
  x: number;
  y: number;
  size: number; // 버블 크기 (0이면 기본 점)
  label: string;
}

export interface ScatterGraphData {
  mode: ScatterMode;
  points: ScatterPoint[];
  xLabel: string;
  yLabel: string;
  xUnit: string;
  yUnit: string;
  xRange: { min: number; max: number; auto: boolean };
  yRange: { min: number; max: number; auto: boolean };
  showBubble: boolean;
  bubbleScale: number; // 버블 최대 반지름 (px)
  // 편차 모드 전용
  quadrantLabels: [string, string, string, string]; // 1사분면(우상), 2(좌상), 3(좌하), 4(우하)
}

export function createDefaultScatterData(): ScatterGraphData {
  return {
    mode: 'normal',
    points: [
      { x: 10, y: 25, size: 50, label: 'A' },
      { x: 25, y: 40, size: 80, label: 'B' },
      { x: 40, y: 15, size: 30, label: 'C' },
      { x: 55, y: 60, size: 100, label: 'D' },
    ],
    xLabel: 'X축',
    yLabel: 'Y축',
    xUnit: '',
    yUnit: '',
    xRange: { min: 0, max: 100, auto: true },
    yRange: { min: 0, max: 100, auto: true },
    showBubble: true,
    bubbleScale: 30,
    quadrantLabels: ['(가)', '(나)', '(다)', '(라)'],
  };
}

// 하이서그래프 데이터
export type HythergraphMode = 'loop' | 'points' | 'both';
export type MonthLabelStyle = 'number' | 'english';

export const MONTH_LABELS_NUM = ['1','2','3','4','5','6','7','8','9','10','11','12'];
export const MONTH_LABELS_EN = ['J','F','M','A','M','J','J','A','S','O','N','D'];

export interface HythergraphSeries {
  label: string;
  months: ClimateMonthData[];
}

export interface HythergraphData {
  series: HythergraphSeries[];
  mode: HythergraphMode;
  monthLabelStyle: MonthLabelStyle;
  xUnit: string;
  yUnit: string;
  xRange: { min: number; max: number; auto: boolean };
  yRange: { min: number; max: number; auto: boolean };
}

export function createDefaultHythergraphData(): HythergraphData {
  return {
    series: [
      { label: '(가)', months: Array.from({ length: 12 }, () => ({ temp: 0, precip: 0 })) },
    ],
    mode: 'both',
    monthLabelStyle: 'number',
    xUnit: '(°C)',
    yUnit: '(mm)',
    xRange: { min: -10, max: 40, auto: true },
    yRange: { min: 0, max: 400, auto: true },
  };
}

// 직육면체 그래프 데이터
export interface CubePoint {
  x: number; // 0~1
  y: number; // 0~1
  z: number; // 0~1
  label: string;
}

export interface LabelOffset {
  x: number;
  y: number;
}

export interface CubeAxisConfig {
  name: string;
  lowLabel: string;
  highLabel: string;
  lowOffset: LabelOffset;
  highOffset: LabelOffset;
}

export interface CubeGraphData {
  points: CubePoint[];
  xAxis: CubeAxisConfig;
  yAxis: CubeAxisConfig;
  zAxis: CubeAxisConfig;
}

export function createDefaultCubeData(): CubeGraphData {
  return {
    points: [
      { x: 0, y: 1, z: 1, label: 'ㄱ' },
      { x: 0, y: 0, z: 0, label: 'ㄴ' },
      { x: 1, y: 0, z: 1, label: 'ㄷ' },
    ],
    xAxis: { name: 'X축', lowLabel: '낮음', highLabel: '높음', lowOffset: { x: 0, y: 0 }, highOffset: { x: 0, y: 0 } },
    yAxis: { name: 'Y축', lowLabel: '낮음', highLabel: '높음', lowOffset: { x: 0, y: 0 }, highOffset: { x: 0, y: 0 } },
    zAxis: { name: 'Z축', lowLabel: '낮음', highLabel: '높음', lowOffset: { x: 0, y: 0 }, highOffset: { x: 0, y: 0 } },
  };
}

// 방사형 그래프 데이터
export interface RadarSeries {
  label: string;
  values: number[];
}

export interface RadarGraphData {
  axisLabels: string[];
  series: RadarSeries[];
  maxValue: number;
  autoMax: boolean;
  gridSteps: number;
  showFill: boolean;
}

export function createDefaultRadarData(): RadarGraphData {
  return {
    axisLabels: ['축1', '축2', '축3', '축4', '축5'],
    series: [
      { label: '(가)', values: [0, 0, 0, 0, 0] },
    ],
    maxValue: 100,
    autoMax: true,
    gridSteps: 5,
    showFill: false,
  };
}

// 공통 그래프 옵션
export interface GraphOptions {
  title: string;
  source: string;
  footnote: string;
  fontFamily: 'serif' | 'sans' | 'custom';
  customFont: string;
  fontSize: {
    title: number;
    axisLabel: number;
    tick: number;
    dataLabel: number;
  };
  showDataLabels: boolean;
  showLegend: boolean;
  legendPosition: LegendPosition;
  legendLabel1: string;
  legendLabel2: string;
}

// PNG 내보내기 설정
export interface ExportSettings {
  mode: 'exam' | 'custom';
  width: number;
  height: number;
  scale: 1 | 2 | 3;
}

// 기본 기후 데이터
export function createDefaultClimateData(): ClimateGraphData {
  return {
    months: Array.from({ length: 12 }, () => ({ temp: 0, precip: 0 })),
    monthInterval: 12,
    tempLabel: '(°C)',
    precipLabel: '(mm)',
    tempRange: { min: -10, max: 40, auto: true },
    precipRange: { min: 0, max: 400, auto: true },
  };
}

export function createDefaultGraphOptions(): GraphOptions {
  return {
    title: '',
    source: '',
    footnote: '',
    fontFamily: 'serif',
    customFont: '',
    fontSize: {
      title: 36,
      axisLabel: 28,
      tick: 26,
      dataLabel: 22,
    },
    showDataLabels: false,
    showLegend: true,
    legendPosition: 'bottom',
    legendLabel1: '',
    legendLabel2: '',
  };
}

export function createDefaultExportSettings(): ExportSettings {
  return {
    mode: 'exam',
    width: 800,
    height: 600,
    scale: 2,
  };
}
