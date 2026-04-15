// © 2026 김용현
// 지도 모듈 공통 타입

export type MapUnit = 'sido' | 'sigungu' | 'sigungu_metro_merged';

export const MAP_UNIT_LABELS: Record<MapUnit, string> = {
  sido: '시·도 (17)',
  sigungu: '시·군·구 (전체)',
  sigungu_metro_merged: '시·군·구 (광역 통합)',
};

export const MAP_UNIT_FILES: Record<MapUnit, string> = {
  sido: '/geo/sido.geojson',
  sigungu: '/geo/sigungu.geojson',
  sigungu_metro_merged: '/geo/sigungu_metro_merged.geojson',
};

export interface RegionProps {
  code: string;
  name: string;
  name_short?: string;
  parent_code?: string;
  parent_name?: string;
  region_type?: string;
}

// 채우기 모드 4종
export type FillMode = 'color' | 'pattern' | 'color_pattern' | 'grayscale';
export const FILL_MODE_LABELS: Record<FillMode, string> = {
  color: '컬러',
  pattern: '패턴 (흑백)',
  color_pattern: '컬러 + 패턴',
  grayscale: '그레이스케일',
};

// 패턴 종류 8종
export type PatternKind =
  | 'diagonal'          // 사선 /
  | 'diagonalReverse'   // 역사선 \
  | 'horizontal'        // 가로선 ─
  | 'vertical'          // 세로선 │
  | 'crosshatch'        // 격자 ╬
  | 'diagonalCrosshatch'// 사선격자 ╳
  | 'dots'              // 도트 ·
  | 'dotsReverse';      // 도트 리버스 (진한 바탕에 밝은 점)

export const PATTERN_LABELS: Record<PatternKind, string> = {
  diagonal: '사선 (/)',
  diagonalReverse: '역사선 (\\)',
  horizontal: '가로선',
  vertical: '세로선',
  crosshatch: '격자',
  diagonalCrosshatch: '사선 격자',
  dots: '도트',
  dotsReverse: '도트 리버스',
};

export const PATTERN_ORDER: PatternKind[] = [
  'diagonal',
  'diagonalReverse',
  'horizontal',
  'vertical',
  'crosshatch',
  'diagonalCrosshatch',
  'dots',
  'dotsReverse',
];

// 팔레트
export type PaletteKind =
  | 'sequential_blue'
  | 'sequential_red'
  | 'sequential_green'
  | 'grayscale'
  | 'diverging'
  | 'custom';

export const PALETTES: Record<Exclude<PaletteKind, 'custom'>, string[]> = {
  sequential_blue: ['#eff6ff', '#bfdbfe', '#60a5fa', '#2563eb', '#1e3a8a', '#0f2463', '#071438'],
  sequential_red: ['#fef2f2', '#fecaca', '#f87171', '#dc2626', '#991b1b', '#6b0f0f', '#400808'],
  sequential_green: ['#f0fdf4', '#bbf7d0', '#4ade80', '#16a34a', '#14532d', '#0a3a1c', '#052211'],
  grayscale: ['#f5f5f5', '#d4d4d4', '#a3a3a3', '#737373', '#404040', '#171717', '#000000'],
  diverging: ['#1e40af', '#60a5fa', '#dbeafe', '#f5f5f5', '#fecaca', '#dc2626', '#991b1b'],
};

export const PALETTE_LABELS: Record<PaletteKind, string> = {
  sequential_blue: '순차형 — 파랑',
  sequential_red: '순차형 — 빨강',
  sequential_green: '순차형 — 초록',
  grayscale: '흑백 명도형',
  diverging: '발산형',
  custom: '사용자 지정',
};

// 단계구분도 상태
export interface ChoroplethState {
  unit: MapUnit;
  regionBin: Record<string, number>;
  binCount: number;
  palette: PaletteKind;
  customColors: (string | null)[];
  fillMode: FillMode;
  binPatterns: PatternKind[];
  legendTitle: string;
  legendUnit: string;
  legendSource: string;
  binLabels: string[];
}

export function createDefaultChoroplethState(): ChoroplethState {
  return {
    unit: 'sido',
    regionBin: {},
    binCount: 5,
    palette: 'sequential_blue',
    customColors: Array(7).fill(null),
    fillMode: 'color',
    binPatterns: PATTERN_ORDER.slice(0, 7),
    legendTitle: '',
    legendUnit: '',
    legendSource: '',
    binLabels: Array(7).fill(''),
  };
}

// 팔레트 기반 색상 추출
export function getBasePaletteColors(palette: PaletteKind, binCount: number): string[] {
  const source: string[] = palette === 'custom' ? PALETTES.grayscale : PALETTES[palette];
  if (binCount >= source.length) return source.slice(0, binCount);
  const out: string[] = [];
  for (let i = 0; i < binCount; i++) {
    const idx = Math.round((i / (binCount - 1)) * (source.length - 1));
    out.push(source[idx]);
  }
  return out;
}

// 등급별 배경 색상 (FillMode에 따라 변경)
export function getEffectiveColors(state: ChoroplethState): string[] {
  if (state.fillMode === 'grayscale') {
    return getBasePaletteColors('grayscale', state.binCount);
  }
  if (state.fillMode === 'pattern') {
    // 패턴 전용: 바탕 흰색
    return Array(state.binCount).fill('#ffffff');
  }
  // color, color_pattern: 팔레트 + 커스텀
  const base = getBasePaletteColors(state.palette, state.binCount);
  return base.map((c, i) => state.customColors[i] ?? c);
}

// ────────────────────────────────────────
// 도형표현도 (Proportional Symbol Map)
// ────────────────────────────────────────

export type SymbolKind = 'pie' | 'bar';

export const SYMBOL_KIND_LABELS: Record<SymbolKind, string> = {
  pie: '파이 차트',
  bar: '막대 차트',
};

export interface ItemDef {
  name: string;
  color: string;
  pattern: PatternKind;
}

export type SymbolSizeMode = 'uniform' | 'proportional';

export interface SymbolMapState {
  unit: MapUnit;
  symbolKind: SymbolKind;
  fillMode: FillMode;
  items: ItemDef[];
  data: Record<string, number[]>; // 지역코드 → [값1, 값2, ...]
  sizeMode: SymbolSizeMode;
  baseRadius: number;
  minRadius: number;
  maxRadius: number;
  barMaxHeight: number;
  barWidth: number;
  barGap: number;
  showValueLabels: boolean;
  legendTitle: string;
  legendUnit: string;
  legendSource: string;
  positionOverrides: Record<string, { dx: number; dy: number }>;
}

const SYMBOL_DEFAULT_COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#ea580c',
  '#9333ea', '#0891b2', '#ca8a04', '#be185d',
];

export function createDefaultSymbolMapState(): SymbolMapState {
  return {
    unit: 'sido',
    symbolKind: 'pie',
    fillMode: 'color',
    items: [
      { name: '1차 산업', color: SYMBOL_DEFAULT_COLORS[0], pattern: 'diagonal' },
      { name: '2차 산업', color: SYMBOL_DEFAULT_COLORS[1], pattern: 'diagonalReverse' },
      { name: '3차 산업', color: SYMBOL_DEFAULT_COLORS[2], pattern: 'dots' },
    ],
    data: {},
    sizeMode: 'uniform',
    baseRadius: 18,
    minRadius: 10,
    maxRadius: 40,
    barMaxHeight: 40,
    barWidth: 8,
    barGap: 1,
    showValueLabels: false,
    legendTitle: '',
    legendUnit: '',
    legendSource: '',
    positionOverrides: {},
  };
}

export function createDefaultItem(index: number): ItemDef {
  return {
    name: `항목 ${index + 1}`,
    color: SYMBOL_DEFAULT_COLORS[index % SYMBOL_DEFAULT_COLORS.length],
    pattern: PATTERN_ORDER[index % PATTERN_ORDER.length],
  };
}

// ────────────────────────────────────────
// 등치선도 (Isoline Map)
// ────────────────────────────────────────

export type IsolineIntervalMode = 'auto' | 'manual';

export interface IsolineState {
  unit: MapUnit;
  values: Record<string, number>; // regionCode → value (중심점에 할당)
  // 간격 설정
  intervalMode: IsolineIntervalMode;
  levelCount: number; // auto 모드: 3~10 단계
  majorInterval: number; // manual 모드: 주곡선 간격
  minorSubdivisions: number; // 주곡선 사이 간곡선 분할 수 (0=간곡선 없음, 2=절반, 4=4등분)
  // 스타일
  lineColor: string;
  majorLineWidth: number;
  minorLineWidth: number;
  showLabels: boolean;
  fillEnabled: boolean;
  fillPalette: PaletteKind;
  clipToBoundary: boolean;
  // 보간 설정
  interpolationPower: number; // IDW power (2 기본)
  gridResolution: number; // 그리드 크기 (예: 120)
  // 범례
  legendTitle: string;
  legendUnit: string;
  legendSource: string;
}

// ────────────────────────────────────────
// 유선도 (Flow Map)
// ────────────────────────────────────────

export interface FlowLine {
  id: string;       // 고유 키
  from: string;     // 출발 region code
  to: string;       // 도착 region code
  value: number;    // 흐름 양 (폭에 비례)
  label?: string;   // 선택적 라벨
  color?: string;   // 선택적 개별 색상 (없으면 기본 색상 사용)
}

export type FlowCurveType = 'straight' | 'bezier';
export type FlowArrowStyle = 'triangle' | 'open' | 'none';

export const FLOW_CURVE_LABELS: Record<FlowCurveType, string> = {
  straight: '직선',
  bezier: '곡선 (베지어)',
};
export const FLOW_ARROW_LABELS: Record<FlowArrowStyle, string> = {
  triangle: '삼각 화살표',
  open: '열린 화살표',
  none: '없음',
};

export interface FlowMapState {
  unit: MapUnit;
  flows: FlowLine[];
  defaultColor: string;
  curveType: FlowCurveType;
  bezierCurvature: number; // 0=직선에 가깝게, 1=크게 휨 (0~1)
  arrowStyle: FlowArrowStyle;
  minWidth: number;
  maxWidth: number;
  opacity: number; // 0~1
  showValues: boolean;
  legendTitle: string;
  legendUnit: string;
  legendSource: string;
}

export function createDefaultFlowMapState(): FlowMapState {
  return {
    unit: 'sido',
    flows: [],
    defaultColor: '#dc2626',
    curveType: 'bezier',
    bezierCurvature: 0.3,
    arrowStyle: 'triangle',
    minWidth: 1.5,
    maxWidth: 10,
    opacity: 0.85,
    showValues: false,
    legendTitle: '',
    legendUnit: '',
    legendSource: '',
  };
}

export function createDefaultIsolineState(): IsolineState {
  return {
    unit: 'sido',
    values: {},
    intervalMode: 'auto',
    levelCount: 6,
    majorInterval: 200,
    minorSubdivisions: 0,
    lineColor: '#1e293b',
    majorLineWidth: 1.6,
    minorLineWidth: 0.7,
    showLabels: true,
    fillEnabled: false,
    fillPalette: 'sequential_blue',
    clipToBoundary: true,
    interpolationPower: 2,
    gridResolution: 120,
    legendTitle: '',
    legendUnit: '',
    legendSource: '',
  };
}
