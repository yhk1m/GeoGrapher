// © 2026 김용현
// 그래프 유형
export type GraphType =
  | 'guide'
  | 'climate'
  | 'pyramid'
  | 'ternary'
  | 'stacked'
  | 'absbar'
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
  tempRange: { min: number; max: number; auto: boolean; step?: number };
  precipRange: { min: number; max: number; auto: boolean; step?: number };
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
  /** step 을 주면 눈금 간격을 그 값으로 고정한다. 미지정이면 기존대로 자동 계산 */
  tempRange: { min: number; max: number; auto: boolean; step?: number };
  precipRange: { min: number; max: number; auto: boolean; step?: number };
  /**
   * 막대 채움을 하나로 고정한다. 미지정이면 기존대로 양수는 진회색,
   * 음수는 연회색으로 나뉜다. 시험지는 부호와 무관하게 한 색이다.
   */
  barFill?: string;
  /** 막대 테두리색 — 미지정이면 `#444` */
  barStroke?: string;
  /** 꺾은선의 점 모양 — 미지정이면 원. 시험지는 검은 정사각형을 쓴다. */
  markerShape?: 'circle' | 'square';
  /**
   * 좌·우 축 이름. 주면 눈금 숫자 바깥에 **한 글자씩 세로로** 쌓아 그린다.
   * 미지정이면 단위 표기(tempLabel·precipLabel)만 축 위에 놓는다.
   */
  tempAxisName?: string;
  precipAxisName?: string;
  /** 범례를 플롯 안쪽 모서리 상자에 둔다. 자료를 덮는 모서리는 피한다. */
  insideLegend?: InsideLegendCorner;
  /** 위·오른쪽까지 이어 사각 테두리로 감싼다. 미지정이면 ㄷ자 축선만 그린다. */
  showFrame?: boolean;
}

// 모드 B — 지역별 편차 (비교형)
export interface DeviationBRegion {
  label: string;
  precip: number;
  temp: number;
}

export type LegendPosition = 'bottom' | 'right';

/** 플롯 안쪽 범례를 놓을 모서리 */
export type InsideLegendCorner = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

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
  pieRotation?: number;  // 0~360도
  pieScale?: number;     // 퍼센트 (기본 100)
  axisStep?: number;     // 축 눈금 간격 (기본 20)
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
  /**
   * 세로축을 연령대 이름(0-4, 5-9…) 대신 **나이 수치 눈금**으로 그린다.
   * 시험지 피라미드가 이 방식이다 — 왼쪽에 (세) 0/20/40/60/80.
   * 미지정이면 기존대로 연령대 이름을 쓴다.
   */
  numericAgeAxis?: boolean;
  /** 나이 축 단위 표기 (numericAgeAxis 일 때만). 예: '(세)' */
  ageUnit?: string;
  /**
   * 남·여 막대 채움색 [남, 여]. 미지정이면 기존 색(진회색/연회색).
   * 시험지는 둘 다 같은 연회색에 검정 테두리다.
   */
  sexFills?: [string, string];
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
  /**
   * 이 점(버블)의 채움색. 미지정이면 기존 회색을 쓴다.
   * 크기와 별개인 두 번째 값(예: 1인당 GDP 구간)을 색으로 나타낼 때 쓴다.
   */
  fill?: string;
}

export type BubbleLegendPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface ScatterGraphData {
  mode: ScatterMode;
  points: ScatterPoint[];
  bubbleLegendPosition: BubbleLegendPosition;
  xLabel: string;
  yLabel: string;
  xUnit: string;
  yUnit: string;
  /** step 을 주면 눈금 간격을 그 값으로 고정한다. 미지정이면 기존대로 자동 계산 */
  xRange: { min: number; max: number; auto: boolean; step?: number };
  yRange: { min: number; max: number; auto: boolean; step?: number };
  showBubble: boolean;
  bubbleScale: number; // 버블 최대 반지름 (px)
  /**
   * 바깥 사각 테두리를 그린다. 미지정이면 그린다(기존 동작).
   * 시험지 편차 그래프는 테두리 없이 교차하는 두 축만 둔다.
   */
  showFrame?: boolean;
  /**
   * 축 이름을 상자에 넣어 y는 그래프 위, x는 그래프 오른쪽에 세운다.
   * 시험지 편차 그래프 관습이다. 미지정이면 기존대로 축 옆에 쓴다.
   * 편차 모드에서만 쓴다.
   */
  boxedAxisLabels?: boolean;
  /**
   * 눈금과 눈금 숫자를 가운데 십자선 축에 붙인다. 미지정이면 플롯 가장자리에 붙인다.
   * 테두리를 끄면(showFrame: false) 가장자리에 붙은 눈금이 허공에 뜨므로 함께 쓴다.
   * 편차 모드에서만 쓴다.
   */
  ticksOnAxis?: boolean;
  /**
   * 채움색이 무엇을 뜻하는지 알려주는 범례. 버블 크기 범례 아래에 놓인다.
   * 미지정이면 그리지 않는다.
   */
  fillLegend?: {
    title: string;
    items: { label: string; fill: string }[];
  };
  /**
   * 버블 크기 범례에 쓸 항목을 직접 지정한다.
   * 미지정이면 최댓값에서 자동으로 세 단계를 잡고 숫자를 그대로 쓴다 —
   * 인구처럼 자릿수가 큰 값은 그대로 두면 읽을 수 없으므로 여기서 정해 준다.
   */
  bubbleLegendItems?: { size: number; label: string }[];
  // 편차 모드 전용
  quadrantLabels: [string, string, string, string]; // 1사분면(우상), 2(좌상), 3(좌하), 4(우하)
}

export function createDefaultScatterData(): ScatterGraphData {
  return {
    mode: 'normal',
    bubbleLegendPosition: 'bottom-right',
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
  labelDx: number; // 유도선 X 오프셋
  labelDy: number; // 유도선 Y 오프셋
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
      { x: 0, y: 1, z: 1, label: 'ㄱ', labelDx: 0, labelDy: 0 },
      { x: 0, y: 0, z: 0, label: 'ㄴ', labelDx: 0, labelDy: 0 },
      { x: 1, y: 0, z: 1, label: 'ㄷ', labelDx: 0, labelDy: 0 },
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

// 절댓값 막대 그래프 데이터
export type AbsBarDirection = 'vertical' | 'horizontal';

export interface AbsBarCategory {
  label: string;
  values: number[];
}

export interface AbsBarGraphData {
  barDirection: AbsBarDirection;
  stacked: boolean;
  categories: AbsBarCategory[];
  seriesLabels: string[];
  unit: string;
  yRange: { min: number; max: number; auto: boolean; step?: number };
  fitMax?: boolean; // 최댓값에 맞추기
  /**
   * 계열별 채움색 직접 지정. 미지정이면 기존 팔레트(getStackedFill)를 쓴다.
   * 원본 시험지를 재현할 때 기본 팔레트와 색이 다른 경우에 쓴다.
   */
  seriesFills?: string[];
  /**
   * 0을 기준으로 막대를 그린다. 음수는 0에서 아래로 내려가고 0 위치에 실선을 긋는다.
   *
   * 미지정이면 기존대로 축 바닥에서 막대가 자란다. 축이 음수까지 내려가는
   * 편차 그래프에서는 그 방식이 막대를 허공에 띄운 것처럼 보이게 한다.
   */
  zeroBaseline?: boolean;
  /**
   * 범주 라벨을 0선 바로 아래에 놓는다. 미지정이면 플롯 아래(축 바깥)에 놓는다.
   *
   * 시험지마다 다르다 — 2026 수능 한국지리 6번은 0선 아래, 2025 수능
   * 세계지리 19번은 플롯 아래다. 그래서 zeroBaseline 과 따로 둔다.
   */
  categoryLabelAtBaseline?: boolean;
  /**
   * 범주를 묶어 2단 라벨로 만든다 (가로 막대 전용).
   *
   * 시험지에서 흔한 형태다 — 바깥 라벨이 A·B·C, 안쪽 라벨이 1990년·2020년.
   * `span` 은 그 그룹에 속한 범주 개수이고, 합이 categories 길이와 같아야 한다.
   * 그룹 안 막대는 서로 붙고 그룹 사이는 벌어진다.
   *
   * 미지정이면 기존대로 범주마다 라벨 하나를 고르게 배치한다.
   */
  groups?: { label: string; span: number }[];
  /**
   * 범례를 플롯 안쪽 모서리에 작은 상자로 둔다.
   *
   * 미지정이면 기존대로 options.legendPosition 을 따라 플롯 바깥에 그린다.
   */
  insideLegend?: InsideLegendCorner;
  /**
   * 단위를 마지막 눈금 숫자 바로 옆에 붙인다 (가로 막대 전용).
   *
   * 원본 시험지는 축 끝이 `100(EJ)` 처럼 붙어 있다.
   * 미지정이면 기존대로 축 오른쪽에 조금 떨어뜨려 그린다.
   */
  unitAdjacent?: boolean;
}

export function createDefaultAbsBarData(): AbsBarGraphData {
  return {
    barDirection: 'vertical',
    stacked: false,
    categories: [
      { label: '(가)', values: [30, 50] },
      { label: '(나)', values: [45, 35] },
      { label: '(다)', values: [60, 20] },
    ],
    seriesLabels: ['항목1', '항목2'],
    unit: '',
    yRange: { min: 0, max: 100, auto: true },
  };
}

// 공통 그래프 옵션
export interface GraphOptions {
  title: string;
  source: string;
  footnotes: string[];
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
    footnotes: [''],
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
