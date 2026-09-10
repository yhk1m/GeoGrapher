# 꺾은선 그래프 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GeoGrapher 에 수능 스타일 꺾은선 그래프(유도선 라벨·계열별 굵기/회색·세로 격자·빈 x 라벨)를 추가해 배포하고, 같은 확장을 csat-chart.js `line` 에 되돌려 넣어 v1.6.0 으로 낸다.

**Architecture:** csat-chart.js 의 기존 `LineGraph` 렌더러를 GeoGrapher 시그니처로 옮겨 확장한다(스펙 §3·§4). GeoGrapher 는 `types.ts`(데이터) → `graphs/LineGraph.ts`(Canvas 렌더) → `components/LineInput.tsx`(드로어 폼) 3층이고, `App`·`GraphCanvas`·`DataDrawer`·`ExportModal`·`Header`·`GuidePage` 에 분기를 하나씩 더한다. csat 은 `src/core/{types/line.ts, graphs/LineGraph.ts, canvas/axes.ts}` 에 같은 확장을 넣고 골든 픽스처 2장으로 감시한다. **모든 새 필드는 선택이며 기본값이 기존 동작이다** — csat 골든 `line.png` 는 바이트 그대로여야 한다.

**Tech Stack:** React 19 + Vite 8 + TypeScript 6 (GeoGrapher, 테스트 틀 없음 — `npm run build` 가 검증). csat-chart.js: tsup + vitest + @napi-rs/canvas 골든 이미지.

**Spec:** `docs/superpowers/specs/2026-09-11-line-graph-design.md`

**두 저장소 경로**
- GeoGrapher: `C:/Users/김용현/Desktop/vibecoding/GeoGrapher` (git `master`, Vercel → geographer.bgnl.kr)
- csat-chart.js: `C:/Users/김용현/Desktop/vibecoding/csat-chart.js` (git `master`, origin GitHub `yhk1m/csat-chart.js`)

**주의 (이 PC)**
- Write 툴로 `.ts/.tsx` 새 파일을 만들면 전역 훅이 `// © 2026 김용현` 헤더를 자동 삽입한다 — 지우지 말 것. 아래 코드 블록에 이미 그 줄이 있으면 훅은 중복 삽입하지 않는다(내용에 같은 문자열이 있으면 건너뜀).
- Bash 명령이 너무 길면 `ENAMETOOLONG` 으로 실패한다 — 긴 파일은 Write 툴로 만든다.
- 커밋 메시지 끝에 붙일 것:
  ```
  Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_013Gjgb4JYuXTe5pcZqpTBHk
  ```
- `git add -A` 금지. 파일을 이름으로 add 한다.

---

## 원본 두 장의 값 (검증에 쓴다 — 눈대중 판독)

**2027-06 한국지리 17번** (`C:/Users/김용현/Desktop/2027_06_korgeo_17.jpg`) — y 0~200 (step 50), x 1980·1985·…·2020 (9칸, 라벨은 10년마다)

| x | 1980 | 1985 | 1990 | 1995 | 2000 | 2005 | 2010 | 2015 | 2020 |
|---|---|---|---|---|---|---|---|---|---|
| (가) 굵은 일점쇄선 검정 | 190 | 150 | 130 | 113 | 100 | 85 | 83 | 89 | 88 |
| (나) 굵은 실선 회색 | 88 | 93 | 97 | 98 | 100 | 100 | 99 | 103 | 104 |
| (다) 가는 실선 검정 | 57 | 70 | 87 | 97 | 100 | 100 | 99 | 98 | 97 |

유도선: (가) `at:2, dx:40, dy:-45` · (나) `at:2, dx:-30, dy:-45` · (다) `at:3, dx:30, dy:45`.
각주 `['각 지역의 2000년 인구를 100으로 했을 때의 상댓값임.', '2020년 행정 구역을 기준으로 함.']`, 출처 `(국가데이터처)`, `sourceInline: true`. 제목 없음. 마커 없음.

**2026-09 한국지리 13번 (오른쪽)** (`C:/Users/김용현/Desktop/2026_09_korgeo_13.jpg`) — y 80~120 (step 10), x 1990·1995·2000·2005·2010·2015·2023 (7칸)

| x | 1990 | 1995 | 2000 | 2005 | 2010 | 2015 | 2023 |
|---|---|---|---|---|---|---|---|
| A 굵은 실선 (3px) | 93 | 92.5 | 97.5 | 100 | 105 | 113 | 119 |
| B 파선 | 81 | 89 | 94 | 100 | 104.5 | 111 | 115 |
| C 일점쇄선 | 99 | 101 | 101.5 | 100 | 100 | 103 | 99.5 |

선 끝 라벨. 제목 `〈권역별 인구 변화〉`, 각주 `['각 권역의 2005년 인구를 100으로 했을 때의 상댓값임.']`, 출처 `(통계청)`, `sourceInline: true`. 마커 없음.

---

## Part A — GeoGrapher

### Task 1: 데이터 타입·기본값 (`types.ts`)

**Files:**
- Modify: `src/data/types.ts` — `GraphType` 유니온(3~17행), `GRAPH_LABELS`(19~34행), 파일 끝에 꺾은선 블록 추가

- [ ] **Step 1: `GraphType` 에 `'line'` 추가, 라벨 추가**

유니온에서 `| 'absbar'` 다음 줄에 `| 'line'` 을 넣고, `GRAPH_LABELS` 의 `absbar: '절댓값 막대 그래프',` 다음 줄에 `line: '꺾은선 그래프',` 를 넣는다.

```ts
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
```

- [ ] **Step 2: 꺾은선 데이터 블록을 파일 끝(`createDefaultExportSettings` 뒤)에 추가**

```ts
// 꺾은선 그래프 데이터
//
// 시험지 관습 — 계열은 색이 아니라 **선 종류·굵기·회색**과 기호 모양으로 구분하고,
// 계열 이름은 범례 대신 **선 끝**이나 **유도선**으로 붙이는 경우가 많다.

/** 선 종류 — 흑백 인쇄에서 계열을 구분하는 수단 */
export type LineStyle = 'solid' | 'dashed' | 'dotted' | 'dashdot';

/** 선 종류별 대시 패턴 (Canvas setLineDash 인자) */
export const LINE_DASH: Record<LineStyle, number[]> = {
  solid: [],
  dashed: [10, 6],
  dotted: [2, 5],
  dashdot: [12, 5, 3, 5],
};

export const LINE_STYLE_ORDER: LineStyle[] = ['solid', 'dashed', 'dotted', 'dashdot'];

/** 꼭짓점 기호 — 선 종류만으로 부족할 때 함께 쓴다 */
export type LineMarker = 'circle' | 'square' | 'triangle' | 'diamond';

export const LINE_MARKER_ORDER: LineMarker[] = ['circle', 'square', 'triangle', 'diamond'];

/** 유도선 라벨 자리 — 가리킬 점 번호와, 그 점에서 라벨 중심까지의 오프셋(px) */
export interface LineLeader {
  at: number;
  dx: number;
  dy: number;
}

/**
 * 유도선 라벨의 기본 자리 — 가운데 점에서 오른쪽 위.
 * 렌더러와 입력 폼이 같은 기본값을 봐야 하므로 여기 한 곳에 둔다.
 */
export function defaultLineLeader(pointCount: number): LineLeader {
  return { at: Math.floor(Math.max(0, pointCount - 1) / 2), dx: 20, dy: -30 };
}

export interface LineSeries {
  label: string;
  /** xLabels 와 같은 길이. 빠진 값은 null 로 둔다 (선이 끊긴다). */
  values: (number | null)[];
  lineStyle?: LineStyle;
  marker?: LineMarker;
  /** 기호 속을 비운다 (흰색 채움 + 검정 테두리) */
  hollowMarker?: boolean;
  /**
   * 면적 채움색. 주면 이 계열의 선 아래를 채운다.
   * `stacked` 와 함께 쓰면 아래 계열의 경계까지만 채워 누적 면적이 된다.
   */
  areaFill?: string;
  /** 선 색. 미지정이면 검정. 시험지는 회색(#999)으로 한 계열을 가르기도 한다 */
  stroke?: string;
  /** 선 굵기(px). 미지정이면 2 */
  lineWidth?: number;
  /** 유도선 라벨 자리 (labelPlacement: 'leader' 일 때). 미지정이면 defaultLineLeader */
  leader?: LineLeader;
}

/** 계열 이름을 어디에 쓸지 — 선 끝 · 범례 상자 · 유도선 */
export type LineLabelPlacement = 'lineEnd' | 'legend' | 'leader';

export interface LineGraphData {
  series: LineSeries[];
  /**
   * x축 눈금 이름. **빈 문자열이면 그 자리의 이름·세로 격자를 생략한다** —
   * 5년 자료에 10년 라벨(1980·1990·…)을 다는 시험지 관습을 이렇게 적는다.
   */
  xLabels: string[];
  /** x축 끝에 붙는 단위 (예: '(년)') */
  xUnit: string;
  /** y축 위에 붙는 단위 (예: '(°C)') */
  yUnit: string;
  yRange: { min: number; max: number; auto: boolean; step?: number };
  /** 기본은 시험지 관습대로 선 끝 */
  labelPlacement: LineLabelPlacement;
  showMarkers: boolean;
  /** 0 위치에 점선 기준선을 긋는다 (편차 그래프) */
  zeroBaseline?: boolean;
  /**
   * 계열을 아래에서부터 쌓아 올린다 (누적 면적 그래프).
   * 각 계열의 선은 "그때까지의 합"을 나타낸다.
   */
  stacked?: boolean;
  /**
   * 범례를 플롯 안쪽 왼쪽 위에 작은 상자로 둔다.
   * 시험지 누적 면적 그래프가 이 방식이다. `labelPlacement:'legend'` 와 함께 쓴다.
   */
  insideLegend?: boolean;
  /** x 눈금 자리에 세로 점선 격자. 첫·끝은 테두리와 겹치므로 안쪽만 긋는다 */
  xGrid?: boolean;
  /** 격자 색. 미지정이면 #ccc. 시험지는 #555 쯤의 진한 점선이다 */
  gridColor?: string;
}

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
  };
}
```

- [ ] **Step 3: 타입 검사**

Run: `cd "C:/Users/김용현/Desktop/vibecoding/GeoGrapher" && npx tsc -b`
Expected: 통과. (`Record<GraphType, …>` 를 쓰는 곳은 `GRAPH_LABELS` 뿐이라 이미 채웠다.) 오류가 나면 Step 1·2 오타.

- [ ] **Step 4: 커밋**

```bash
git add src/data/types.ts
git commit -m "feat: 꺾은선 그래프 데이터 타입·기본값"
```

---

### Task 2: `drawYAxis` 격자 색 인자 (`axes.ts`)

**Files:**
- Modify: `src/canvas/axes.ts:17-24` (`YAxisParams`), `:36-42` (시그니처), `:88-98` (격자선)

- [ ] **Step 1: `YAxisParams` 에 `gridColor?` 추가**

```ts
interface YAxisParams extends AxisOptions {
  min: number;
  max: number;
  step: number;
  label: string;
  side: 'left' | 'right';
  drawGrid?: boolean;
  /** 격자선 색 — 미지정이면 #ccc. 시험지 틀은 더 진한 점선을 쓴다 */
  gridColor?: string;
}
```

- [ ] **Step 2: 시그니처와 격자선 색에 반영**

```ts
export function drawYAxis({
  ctx, padding, width, height,
  min, max, step, label, side,
  fontFamily, customFont, tickFontSize, labelFontSize,
  drawGrid = false,
  gridColor = '#ccc',
}: YAxisParams) {
```

격자선 블록(`// 격자선` 주석 아래)의 `ctx.strokeStyle = '#ccc';` 를 `ctx.strokeStyle = gridColor;` 로 바꾼다.

- [ ] **Step 3: 빌드 확인 후 커밋**

Run: `npx tsc -b`
Expected: 통과 (기존 호출부는 인자를 안 넘기므로 `#ccc` 그대로)

```bash
git add src/canvas/axes.ts
git commit -m "feat: drawYAxis 에 격자 색 인자 (기본 #ccc 그대로)"
```

---

### Task 3: 렌더러 (`graphs/LineGraph.ts`)

**Files:**
- Create: `src/graphs/LineGraph.ts`

- [ ] **Step 1: 파일 작성** (Write 툴)

```ts
// © 2026 김용현
// 꺾은선 그래프 — 연도·월별 추이. 계열은 선 종류·굵기·회색과 기호로 구분한다.
//
// csat-chart.js 의 `line` 렌더러를 가져와 시험지 두 장(2027-06 한지 17번,
// 2026-09 한지 13번)에 맞춰 넓혔다 — 유도선 라벨·계열별 굵기/색·세로 격자·
// 빈 x 라벨. 새 필드는 전부 선택이고 기본값이 예전 동작이다.
import {
  type LineGraphData,
  type LineMarker,
  type GraphOptions,
  LINE_DASH,
  LINE_STYLE_ORDER,
  LINE_MARKER_ORDER,
  defaultLineLeader,
} from '../data/types';
import { type Padding, clearCanvas, autoRange, getFont } from '../canvas/renderer';
import { drawYAxis } from '../canvas/axes';
import {
  drawTitle,
  drawSourceAndFootnote,
  LabelPlacer,
  labelStride,
  widestLabel,
} from '../canvas/labels';
import { drawLegend, measureLegendWidth, type LegendItem } from '../canvas/legend';

/** 꼭짓점 기호 하나 */
function drawMarker(
  ctx: CanvasRenderingContext2D,
  marker: LineMarker,
  cx: number,
  cy: number,
  r: number,
  hollow: boolean
) {
  ctx.beginPath();
  switch (marker) {
    case 'circle':
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      break;
    case 'square':
      ctx.rect(cx - r, cy - r, r * 2, r * 2);
      break;
    case 'triangle':
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy + r);
      ctx.lineTo(cx - r, cy + r);
      ctx.closePath();
      break;
    case 'diamond':
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      break;
  }
  ctx.fillStyle = hollow ? '#fff' : '#000';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.stroke();
}

export function renderLineGraph(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: LineGraphData,
  options: GraphOptions
) {
  clearCanvas(ctx, w, h);

  const font = options.fontFamily;
  const customFont = options.customFont;
  const n = data.xLabels.length;
  const useLegend = data.labelPlacement === 'legend' && options.showLegend;
  const legendPos = options.legendPosition;
  const legendW = (useLegend && legendPos === 'right')
    ? measureLegendWidth(ctx, data.series.map((s) => s.label), options.fontSize.dataLabel * 0.85 + 5, 'line')
    : 0;

  // 선 끝에 이름을 붙이면 오른쪽에 자리가 필요하다
  ctx.font = getFont(options.fontSize.dataLabel, font, customFont, 'bold');
  const endLabelW = data.labelPlacement === 'lineEnd'
    ? widestLabel(ctx, data.series.map((s) => s.label)) + 16
    : 0;

  // x축 단위((년) 등)도 마지막 눈금 오른쪽에 놓이므로 그만큼 자리를 비워 둔다.
  // 안 그러면 좁은 패널에서 잘린다.
  ctx.font = getFont(options.fontSize.tick, font, customFont, 'bold');
  const xUnitW = data.xUnit
    ? ctx.measureText(data.xUnit).width + ctx.measureText(data.xLabels[n - 1] ?? '').width / 2 + 12
    : 0;

  const padding: Padding = {
    top: options.title ? 100 : 50,
    right: 24 + legendW + Math.max(endLabelW, xUnitW),
    bottom: (() => {
      let b = 70;
      // 범례를 플롯 **안쪽**에 두면 아래에 자리를 비울 필요가 없다.
      if (useLegend && legendPos === 'bottom' && !data.insideLegend) b += 60;
      const notes = options.footnotes.filter((f) => f.trim()).length;
      // 출처를 각주와 같은 줄에 두면(sourceInline) 줄이 하나 줄어든다
      if (options.source && !(options.sourceInline && notes > 0)) b += 30;
      b += notes * 22;
      return b;
    })(),
    left: 130,
  };

  const plotX = padding.left;
  const plotY = padding.top;
  const plotW = w - padding.left - padding.right;
  const plotH = h - padding.top - padding.bottom;

  // 축 범위.
  // 누적이면 각 x 위치의 합이 최댓값이므로 개별 값이 아니라 합을 봐야 한다.
  const allValues = data.stacked
    ? data.xLabels.map((_, i) =>
        data.series.reduce((sum, s) => {
          const v = s.values[i];
          return sum + (v !== null && Number.isFinite(v) ? v : 0);
        }, 0))
    : data.series
        .flatMap((s) => s.values)
        .filter((v): v is number => v !== null && Number.isFinite(v));
  const axis = data.yRange.auto
    ? autoRange(allValues.length > 0 ? allValues : [0, 100], 6)
    : {
        min: data.yRange.min,
        max: data.yRange.max,
        step: data.yRange.step || Math.max(1, Math.round((data.yRange.max - data.yRange.min) / 6)),
      };

  const gridColor = data.gridColor ?? '#ccc';

  // 사각 테두리
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(plotX, plotY);
  ctx.lineTo(plotX, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY);
  ctx.lineTo(plotX, plotY);
  ctx.stroke();

  drawYAxis({
    ctx, padding, width: w, height: h,
    min: axis.min, max: axis.max, step: axis.step,
    label: data.yUnit,
    side: 'left',
    fontFamily: font, customFont,
    tickFontSize: options.fontSize.tick,
    labelFontSize: options.fontSize.axisLabel,
    drawGrid: true,
    gridColor,
  });

  // x 위치 — 첫 점과 마지막 점이 좌우 끝에 오도록 나눈다
  const stepX = n > 1 ? plotW / (n - 1) : 0;
  const toX = (i: number) => plotX + stepX * i;
  const toY = (v: number) => plotY + plotH - ((v - axis.min) / (axis.max - axis.min)) * plotH;

  // x 라벨을 어느 자리에 그리는가 — 빈 이름은 건너뛰고, 서로 붙으면 몇 개 걸러 그린다.
  // 세로 격자도 **같은 자리**에만 긋는다 (라벨과 격자가 늘 함께 간다).
  ctx.font = getFont(options.fontSize.tick, font, customFont, 'bold');
  const xStride = labelStride(stepX, widestLabel(ctx, data.xLabels));
  const labelShown = (i: number) => data.xLabels[i] !== '' && i % xStride === 0;

  // 세로 격자 — 선보다 먼저 그려야 선이 위에 남는다
  if (data.xGrid) {
    ctx.save();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    for (let i = 1; i < n - 1; i++) {
      if (!labelShown(i)) continue;
      ctx.beginPath();
      ctx.moveTo(toX(i), plotY);
      ctx.lineTo(toX(i), plotY + plotH);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 0 기준선 (편차 그래프)
  if (data.zeroBaseline && axis.min < 0 && axis.max > 0) {
    ctx.save();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(plotX, toY(0));
    ctx.lineTo(plotX + plotW, toY(0));
    ctx.stroke();
    ctx.restore();
  }

  /**
   * 계열별로 실제로 그릴 y값.
   * 누적이면 아래 계열들의 합을 얹은 "그때까지의 합"이 된다.
   * 아래 경계(baseline)는 면적을 채울 때 쓴다.
   */
  const tops: (number | null)[][] = [];
  const bases: number[][] = [];
  {
    const running = data.xLabels.map(() => 0);
    for (const s of data.series) {
      const base = [...running];
      const top = s.values.map((v, i) => {
        if (v === null || !Number.isFinite(v)) return null;
        if (!data.stacked) return v;
        running[i] += v;
        return running[i];
      });
      tops.push(top);
      bases.push(base);
    }
  }

  // 면적 채움 — 선보다 먼저 그려야 선이 위에 남는다
  data.series.forEach((s, si) => {
    if (!s.areaFill) return;
    const top = tops[si];
    const base = bases[si];
    ctx.save();
    ctx.fillStyle = s.areaFill;
    // 값이 끊기면 구간을 나눠 채운다
    let i = 0;
    while (i < top.length) {
      if (top[i] === null) { i++; continue; }
      let j = i;
      while (j + 1 < top.length && top[j + 1] !== null) j++;

      ctx.beginPath();
      for (let k = i; k <= j; k++) ctx.lineTo(toX(k), toY(top[k] as number));
      for (let k = j; k >= i; k--) ctx.lineTo(toX(k), toY(data.stacked ? base[k] : axis.min));
      ctx.closePath();
      ctx.fill();
      i = j + 1;
    }
    ctx.restore();
  });

  // 선 — 계열마다 종류·굵기·색이 다를 수 있다
  data.series.forEach((s, si) => {
    const style = s.lineStyle ?? LINE_STYLE_ORDER[si % LINE_STYLE_ORDER.length];
    ctx.save();
    ctx.strokeStyle = s.stroke ?? '#000';
    ctx.lineWidth = s.lineWidth ?? 2;
    ctx.setLineDash(LINE_DASH[style]);
    ctx.beginPath();
    let started = false;
    tops[si].forEach((v, i) => {
      if (v === null) { started = false; return; }
      const x = toX(i);
      const y = toY(v);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  });

  // 꼭짓점 기호 — 선 위에 얹는다
  if (data.showMarkers) {
    data.series.forEach((s, si) => {
      const marker = s.marker ?? LINE_MARKER_ORDER[si % LINE_MARKER_ORDER.length];
      tops[si].forEach((v, i) => {
        if (v === null) return;
        drawMarker(ctx, marker, toX(i), toY(v), 4.5, s.hollowMarker ?? false);
      });
    });
  }

  // 계열 이름 — 선 끝에 붙인다.
  // 이름들이 세로 한 줄로 나란해야 하므로 x 는 고정하고 위아래로만 민다
  // (8방향 배치는 가로 위치가 흐트러져 어긋나 보인다).
  if (data.labelPlacement === 'lineEnd') {
    ctx.fillStyle = '#000';
    ctx.font = getFont(options.fontSize.dataLabel, font, customFont, 'bold');
    const placer = new LabelPlacer();
    const lineHeight = options.fontSize.dataLabel * 1.1;
    const columnX = plotX + plotW + 10;
    const bounds = {
      left: columnX,
      right: w - 4,
      top: 4,
      bottom: h - 4,
    };
    data.series.forEach((s, si) => {
      // 값이 있는 마지막 점을 찾는다
      const top = tops[si];
      let last = -1;
      for (let i = top.length - 1; i >= 0; i--) {
        if (top[i] !== null) { last = i; break; }
      }
      if (last < 0) return;
      placer.placeInColumn(
        ctx,
        s.label,
        columnX,
        toY(top[last] as number) - lineHeight / 2,
        { lineHeight, bounds },
      );
    });
  }

  // 계열 이름 — 유도선. 라벨을 점에서 (dx, dy) 떨어진 곳에 쓰고,
  // 라벨 상자 가장자리에서 점을 향해 가는 실선을 점 3px 앞까지 긋는다.
  // 상자가 점을 덮으면 선은 생략한다.
  if (data.labelPlacement === 'leader') {
    ctx.save();
    ctx.font = getFont(options.fontSize.dataLabel, font, customFont, 'bold');
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lineH = options.fontSize.dataLabel;
    data.series.forEach((s, si) => {
      const top = tops[si];
      const leader = s.leader ?? defaultLineLeader(n);
      // 가리킬 점에 값이 없으면 값이 있는 가장 가까운 점으로 옮긴다
      let at = -1;
      for (let d = 0; d < n && at < 0; d++) {
        for (const k of [leader.at - d, leader.at + d]) {
          if (k >= 0 && k < n && top[k] !== null) { at = k; break; }
        }
      }
      if (at < 0) return;

      const px = toX(at);
      const py = toY(top[at] as number);
      const lx = px + leader.dx;
      const ly = py + leader.dy;
      const halfW = ctx.measureText(s.label).width / 2 + 2;
      const halfH = lineH / 2 + 2;

      // 라벨 중심→점 선분이 상자 경계와 만나는 매개변수 t (t < 1 이면 점이 상자 밖)
      const vx = px - lx;
      const vy = py - ly;
      const t = Math.min(
        vx !== 0 ? halfW / Math.abs(vx) : Infinity,
        vy !== 0 ? halfH / Math.abs(vy) : Infinity,
      );
      const dist = Math.hypot(vx, vy);
      if (Number.isFinite(t) && t < 1 && dist > 3) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(lx + vx * t, ly + vy * t);
        ctx.lineTo(px - (vx / dist) * 3, py - (vy / dist) * 3);
        ctx.stroke();
      }
      ctx.fillText(s.label, lx, ly);
    });
    ctx.restore();
  }

  // X축 눈금 이름 — 빈 이름은 건너뛴다
  ctx.fillStyle = '#000';
  ctx.font = getFont(options.fontSize.tick, font, customFont, 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  data.xLabels.forEach((label, i) => {
    if (!labelShown(i)) return;
    ctx.fillText(label, toX(i), plotY + plotH + 10);
  });

  // X축 단위 — 마지막 눈금 이름 오른쪽.
  // 마지막 이름은 가운데 정렬이라 절반이 축 밖으로 나온다. 그만큼 더 띄운다.
  if (data.xUnit) {
    const lastLabelHalf = ctx.measureText(data.xLabels[n - 1] ?? '').width / 2;
    ctx.textAlign = 'left';
    ctx.fillText(data.xUnit, plotX + plotW + lastLabelHalf + 6, plotY + plotH + 10);
  }

  if (options.title) {
    drawTitle({ ctx, plotX, plotW, title: options.title, fontSize: options.fontSize.title, canvasWidth: w });
  }

  if (useLegend && data.insideLegend) {
    // 시험지 누적 면적 그래프는 범례를 플롯 안쪽 왼쪽 위에 작은 상자로 둔다
    ctx.save();
    ctx.font = getFont(options.fontSize.dataLabel * 0.8, font, customFont, 'bold');
    const rowH = options.fontSize.dataLabel * 1.15;
    const swatch = rowH * 0.75;
    const boxW = swatch + 6 + widestLabel(ctx, data.series.map((s) => s.label)) + 10;
    let ly = plotY + 6;
    for (const s of data.series) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(plotX + 6, ly, boxW, rowH);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.strokeRect(plotX + 6, ly, boxW, rowH);

      ctx.fillStyle = s.areaFill ?? '#000';
      ctx.fillRect(plotX + 10, ly + (rowH - swatch) / 2, swatch, swatch);
      ctx.strokeRect(plotX + 10, ly + (rowH - swatch) / 2, swatch, swatch);

      ctx.fillStyle = '#000';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.label, plotX + 10 + swatch + 5, ly + rowH / 2);
      ly += rowH;
    }
    ctx.restore();
  } else if (useLegend) {
    // 범례 아이콘도 선과 같은 색·굵기·대시로
    const items: LegendItem[] = data.series.map((s, si) => ({
      type: 'line',
      fillStyle: s.stroke ?? '#000',
      strokeStyle: s.stroke ?? '#000',
      lineWidth: s.lineWidth,
      label: s.label,
      dash: LINE_DASH[s.lineStyle ?? LINE_STYLE_ORDER[si % LINE_STYLE_ORDER.length]],
    }));
    drawLegend({
      ctx, items, position: legendPos,
      plotX, plotY, plotW, plotH,
      fontSize: options.fontSize.dataLabel * 0.85,
    });
  }

  drawSourceAndFootnote({
    ctx, plotX, plotW, height: h, canvasWidth: w,
    source: options.source,
    sourceInline: options.sourceInline,
    footnotes: options.footnotes,
    fontSize: options.fontSize.dataLabel * 0.85,
  });
}
```

- [ ] **Step 2: 타입 검사**

Run: `npx tsc -b`
Expected: 통과. `LegendItem.lineWidth` 는 GeoGrapher `legend.ts` 에 이미 있다(15행). `LabelPlacer.placeInColumn`·`labelStride`·`widestLabel` 은 `labels.ts` 에 있다.

- [ ] **Step 3: 커밋**

```bash
git add src/graphs/LineGraph.ts
git commit -m "feat: 꺾은선 그래프 렌더러 — 유도선 라벨·계열별 굵기/색·세로 격자·빈 x 라벨"
```

---

### Task 4: 앱 연결 (Header·App·GraphCanvas·ExportModal·DataDrawer·GuidePage)

**Files:**
- Modify: `src/components/Header.tsx:16-21` (`MENU_ITEMS`)
- Modify: `src/App.tsx` (import·상태·props 3곳)
- Modify: `src/components/GraphCanvas.tsx` (import·props·분기)
- Modify: `src/components/ExportModal.tsx` (import·props·분기)
- Modify: `src/components/DataDrawer.tsx` (import·props·`sourceInline` 체크박스·placeholder 조건)
- Modify: `src/components/GuidePage.tsx:64-71` 뒤에 카드

이 태스크가 끝나면 메뉴에서 꺾은선을 고를 수 있고 기본 데이터가 그려진다. 입력 폼은 Task 5.

- [ ] **Step 1: Header 메뉴**

`MENU_ITEMS` 를 다음으로 바꾼다:

```ts
const MENU_ITEMS: GraphType[] = [
  'guide',
  'climate', 'pyramid', 'ternary', 'stacked', 'absbar', 'line',
  'scatter', 'hythergraph', 'cube', 'radar',
  'choropleth', 'symbolmap', 'isoline', 'flowmap',
];
```

- [ ] **Step 2: GraphCanvas**

2행 import 의 타입 목록에 `type LineGraphData,` 를 `type AbsBarGraphData,` 뒤에 넣고, 렌더러 import 를 `renderAbsBarGraph` 줄 다음에 추가한다:

```ts
import { renderLineGraph } from '../graphs/LineGraph';
```

`GraphCanvasProps` 에 `lineData: LineGraphData;` 를 `absBarData` 다음에 넣고, 함수 시그니처의 구조 분해에 `lineData` 를 `absBarData` 다음에 추가한다. `render` 의 분기에서 `absbar` 블록 다음에:

```ts
    } else if (graphType === 'line') {
      renderLineGraph(ctx, displayW, displayH, lineData, options);
```

`useCallback` 의존성 배열에 `lineData` 를 `absBarData` 다음에 넣는다.

- [ ] **Step 3: ExportModal**

import 타입 목록에 `type LineGraphData,` (`type AbsBarGraphData,` 뒤), 렌더러 import 를 `renderAbsBarGraph` 줄 다음에:

```ts
import { renderLineGraph } from '../graphs/LineGraph';
```

`ExportModalProps` 에 `lineData: LineGraphData;` (`absBarData` 다음), 구조 분해에 `lineData,`, `getRenderFn` 분기의 `absbar` 블록 다음에:

```ts
      } else if (graphType === 'line') {
        renderLineGraph(ctx, w, h, lineData, options);
```

`useCallback` 의존성에 `lineData` (`absBarData` 다음).

- [ ] **Step 4: DataDrawer**

import 타입 목록에 `type LineGraphData,` (`type AbsBarGraphData,` 뒤). 컴포넌트 import 는 Task 5 에서 넣는다(지금 넣으면 파일이 없어 빌드가 깨진다). `DataDrawerProps` 의 `onAbsBarDataChange` 다음:

```ts
  lineData: LineGraphData;
  onLineDataChange: (data: LineGraphData) => void;
```

구조 분해에 `lineData, onLineDataChange,` 추가 (`onAbsBarDataChange,` 다음). `tsconfig.app.json` 에 `noUnusedParameters`/`noUnusedLocals` 가 켜져 있으면(확인: `grep -n Unused tsconfig.app.json`) 함수 첫 줄에 임시로 `void lineData; void onLineDataChange;` 를 두고 Task 5 에서 지운다.

출처 입력(`placeholder="출처 입력"` 인 `<input … />`) 바로 아래에 체크박스:

```tsx
        {(graphType === 'scatter' || graphType === 'line') && (
          <label style={{ ...styles.toggleRow, marginTop: 6 }}>
            <span>출처를 마지막 각주 줄에 (시험지 관습)</span>
            <input
              type="checkbox"
              checked={options.sourceInline ?? false}
              onChange={(e) => onOptionsChange({ ...options, sourceInline: e.target.checked })}
            />
          </label>
        )}
```

"준비 중" placeholder 조건(`graphType !== 'climate' && …`)에 `graphType !== 'line' && ` 를 `graphType !== 'absbar' && ` 다음에 추가.

- [ ] **Step 5: App**

import 목록에 `type LineGraphData,` 를 `type AbsBarGraphData,` 다음에, `createDefaultLineData,` 를 `createDefaultAbsBarData,` 다음에 넣고, 상태 선언을 `absBarData` 줄 다음에:

```ts
  const [lineData, setLineData] = useState<LineGraphData>(createDefaultLineData);
```

`<GraphCanvas … absBarData={absBarData}` 다음 줄에 `lineData={lineData}`; `<DataDrawer … onAbsBarDataChange={setAbsBarData}` 다음 줄에 `lineData={lineData}` 와 `onLineDataChange={setLineData}`; `<ExportModal … absBarData={absBarData}` 다음 줄에 `lineData={lineData}`.

- [ ] **Step 6: GuidePage 카드** — `onNavigate('absbar')` 카드의 닫는 `</div>`(71행) 바로 뒤:

```tsx
          <div style={styles.card} onClick={() => onNavigate('line')}>
            <h3 style={styles.cardTitle}>꺾은선 그래프</h3>
            <p style={styles.cardDesc}>
              연도·월별 추이를 꺾은선으로 그립니다. 계열은 <strong>선 종류(실선/파선/점선/일점쇄선)·굵기·회색</strong>과 기호로 구분하고,
              계열 이름은 <strong>선 끝·유도선·범례</strong> 중에서 고릅니다. x 이름을 비우면 그 자리의 라벨과 세로 격자를 건너뛰어
              5년 자료에 10년 라벨을 다는 시험지 관습을 재현할 수 있습니다.
            </p>
          </div>
```

- [ ] **Step 7: 빌드**

Run: `npm run build`
Expected: `tsc -b` 와 `vite build` 통과. `dist/` 가 갱신된다 — 이 저장소가 dist 를 추적하는지 `git check-ignore dist && echo ignored` 로 본다. 무시되면 신경 쓸 것 없고, 추적 중이면 Task 6 에서 과거 관례대로 처리한다(이 태스크에서는 add 하지 않는다).

- [ ] **Step 8: 화면 확인** — `npm run dev` 를 백그라운드로 띄우고(포트는 출력 참고) Chrome 으로 열어 드롭다운에서 「꺾은선 그래프」를 고른다. 기본 데이터 `(가)` 한 계열이 사각 틀 안에 그려지고 오른쪽 끝에 `(가)`, x축 `1990…2020(년)`, 진한 점선 격자(가로·세로)가 보여야 한다. 드로어에는 아직 폼이 없다(Task 5).

- [ ] **Step 9: 커밋**

```bash
git add src/components/Header.tsx src/App.tsx src/components/GraphCanvas.tsx src/components/ExportModal.tsx src/components/DataDrawer.tsx src/components/GuidePage.tsx
git commit -m "feat: 꺾은선 그래프를 메뉴·캔버스·내보내기·안내에 연결"
```

---

### Task 5: 입력 폼 (`components/LineInput.tsx`)

**Files:**
- Create: `src/components/LineInput.tsx`
- Modify: `src/components/DataDrawer.tsx` (import + 분기)

- [ ] **Step 1: 파일 작성** (Write 툴)

```tsx
// © 2026 김용현
import {
  type LineGraphData,
  type LineSeries,
  type LineStyle,
  type LineMarker,
  type LineLabelPlacement,
  LINE_STYLE_ORDER,
  LINE_MARKER_ORDER,
  defaultLineLeader,
} from '../data/types';

interface Props {
  data: LineGraphData;
  onChange: (data: LineGraphData) => void;
}

const STYLE_LABELS: Record<LineStyle, string> = {
  solid: '실선', dashed: '파선', dotted: '점선', dashdot: '일점쇄선',
};
const MARKER_LABELS: Record<LineMarker, string> = {
  circle: '○ 원', square: '□ 네모', triangle: '△ 세모', diamond: '◇ 마름모',
};
const WIDTHS: { label: string; value: number }[] = [
  { label: '가늘게', value: 1.5 },
  { label: '보통', value: 2 },
  { label: '굵게', value: 3.5 },
];
const STROKES: { label: string; value: string }[] = [
  { label: '검정', value: '#000' },
  { label: '회색', value: '#999' },
];
const PLACEMENT_LABELS: Record<LineLabelPlacement, string> = {
  lineEnd: '선 끝', leader: '유도선', legend: '범례',
};
const SERIES_NAMES = ['(가)', '(나)', '(다)', '(라)', '(마)', '(바)'];
const MAX_SERIES = 6;
const DARK_GRID = '#555';
const LIGHT_GRID = '#ccc';

export default function LineInput({ data, onChange }: Props) {
  const n = data.xLabels.length;

  const updateSeries = (idx: number, patch: Partial<LineSeries>) => {
    onChange({ ...data, series: data.series.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  };

  const addSeries = () => {
    if (data.series.length >= MAX_SERIES) return;
    const i = data.series.length;
    onChange({
      ...data,
      series: [...data.series, {
        label: SERIES_NAMES[i % SERIES_NAMES.length],
        values: Array<number | null>(n).fill(null),
        lineStyle: LINE_STYLE_ORDER[i % LINE_STYLE_ORDER.length],
        marker: LINE_MARKER_ORDER[i % LINE_MARKER_ORDER.length],
      }],
    });
  };

  const removeSeries = () => {
    if (data.series.length <= 1) return;
    onChange({ ...data, series: data.series.slice(0, -1) });
  };

  const addRow = () => {
    onChange({
      ...data,
      xLabels: [...data.xLabels, ''],
      series: data.series.map((s) => ({ ...s, values: [...s.values, null] })),
    });
  };

  const removeRow = () => {
    if (n <= 2) return;
    onChange({
      ...data,
      xLabels: data.xLabels.slice(0, -1),
      series: data.series.map((s) => ({ ...s, values: s.values.slice(0, -1) })),
    });
  };

  const updateXLabel = (idx: number, value: string) => {
    onChange({ ...data, xLabels: data.xLabels.map((l, i) => (i === idx ? value : l)) });
  };

  /** 빈 칸은 null(선 끊김). type=number 라 숫자가 아닌 글자는 애초에 안 들어온다 */
  const updateValue = (serIdx: number, rowIdx: number, raw: string) => {
    const next = raw === '' ? null : parseFloat(raw);
    if (next !== null && !Number.isFinite(next)) return;
    const series = data.series.map((s, i) => {
      if (i !== serIdx) return s;
      return { ...s, values: s.values.map((v, j) => (j === rowIdx ? next : v)) };
    });
    onChange({ ...data, series });
  };

  const updateRange = (field: 'min' | 'max' | 'step', value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    if (field === 'step' && num <= 0) return;
    onChange({ ...data, yRange: { ...data.yRange, [field]: num, auto: false } });
  };

  const leaderOf = (s: LineSeries) => s.leader ?? defaultLineLeader(n);

  return (
    <div>
      {/* 계열 */}
      <section style={styles.section}>
        <div style={styles.headerRow}>
          <label style={styles.label}>계열</label>
          <div style={styles.btnGroup}>
            <button onClick={removeSeries} style={styles.smallBtn} disabled={data.series.length <= 1}>−</button>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{data.series.length}개</span>
            <button onClick={addSeries} style={styles.smallBtn} disabled={data.series.length >= MAX_SERIES}>+</button>
          </div>
        </div>
        {data.series.map((s, i) => (
          <div key={i} style={styles.seriesRow}>
            <input
              type="text"
              value={s.label}
              onChange={(e) => updateSeries(i, { label: e.target.value })}
              style={{ ...styles.cellInput, width: 56, textAlign: 'center' }}
            />
            <select
              value={s.lineStyle ?? LINE_STYLE_ORDER[i % LINE_STYLE_ORDER.length]}
              onChange={(e) => updateSeries(i, { lineStyle: e.target.value as LineStyle })}
              style={styles.select}
            >
              {LINE_STYLE_ORDER.map((st) => <option key={st} value={st}>{STYLE_LABELS[st]}</option>)}
            </select>
            <select
              value={s.lineWidth ?? 2}
              onChange={(e) => updateSeries(i, { lineWidth: Number(e.target.value) })}
              style={styles.select}
            >
              {WIDTHS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>
            <select
              value={s.stroke ?? '#000'}
              onChange={(e) => updateSeries(i, { stroke: e.target.value })}
              style={styles.select}
            >
              {STROKES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select
              value={s.marker ?? LINE_MARKER_ORDER[i % LINE_MARKER_ORDER.length]}
              onChange={(e) => updateSeries(i, { marker: e.target.value as LineMarker })}
              style={styles.select}
              disabled={!data.showMarkers}
              title={data.showMarkers ? '' : '아래 「마커 표시」를 켜면 쓸 수 있습니다'}
            >
              {LINE_MARKER_ORDER.map((m) => <option key={m} value={m}>{MARKER_LABELS[m]}</option>)}
            </select>
            <label style={styles.toggleRow} title="기호 속을 비웁니다">
              <input
                type="checkbox"
                checked={s.hollowMarker ?? false}
                disabled={!data.showMarkers}
                onChange={(e) => updateSeries(i, { hollowMarker: e.target.checked })}
              />
              <span>속 비움</span>
            </label>
          </div>
        ))}
      </section>

      {/* 자료 표 */}
      <section style={styles.section}>
        <div style={styles.headerRow}>
          <label style={styles.label}>자료 (x 이름을 비우면 라벨·격자 생략, 값을 비우면 선 끊김)</label>
          <div style={styles.btnGroup}>
            <button onClick={removeRow} style={styles.smallBtn} disabled={n <= 2}>−</button>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{n}칸</span>
            <button onClick={addRow} style={styles.smallBtn}>+</button>
          </div>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>x</th>
              {data.series.map((s, i) => <th key={i} style={styles.th}>{s.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.xLabels.map((label, ri) => (
              <tr key={ri}>
                <td style={styles.td}>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => updateXLabel(ri, e.target.value)}
                    placeholder="(비움)"
                    style={{ ...styles.cellInput, width: 60, textAlign: 'center' }}
                  />
                </td>
                {data.series.map((s, si) => (
                  <td key={si} style={styles.td}>
                    <input
                      type="number"
                      value={s.values[ri] ?? ''}
                      onChange={(e) => updateValue(si, ri, e.target.value)}
                      style={styles.cellInput}
                      step="any"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 계열 이름 표시 */}
      <section style={styles.section}>
        <label style={styles.label}>계열 이름 표시</label>
        <div style={styles.modeGroup}>
          {(['lineEnd', 'leader', 'legend'] as LineLabelPlacement[]).map((p) => (
            <button
              key={p}
              onClick={() => onChange({ ...data, labelPlacement: p })}
              style={{
                ...styles.modeBtn,
                background: data.labelPlacement === p ? '#1B2A4A' : '#fff',
                color: data.labelPlacement === p ? '#fff' : '#374151',
              }}
            >
              {PLACEMENT_LABELS[p]}
            </button>
          ))}
        </div>
        {data.labelPlacement === 'legend' && (
          <p style={styles.hint}>범례 상자는 위 공통 옵션의 「범례 표시」·「범례 위치」를 따릅니다.</p>
        )}
        {data.labelPlacement === 'leader' && data.series.map((s, i) => {
          const leader = leaderOf(s);
          return (
            <div key={i} style={styles.leaderRow}>
              <span style={styles.leaderName}>{s.label}</span>
              <select
                value={leader.at}
                onChange={(e) => updateSeries(i, { leader: { ...leader, at: Number(e.target.value) } })}
                style={styles.select}
                title="가리킬 점"
              >
                {data.xLabels.map((l, k) => <option key={k} value={k}>{l || `#${k + 1}`}</option>)}
              </select>
              <span style={styles.sliderLabel}>dx</span>
              <input
                type="range" min={-120} max={120} value={leader.dx}
                onChange={(e) => updateSeries(i, { leader: { ...leader, dx: Number(e.target.value) } })}
                style={styles.slider}
              />
              <span style={styles.sliderVal}>{leader.dx}</span>
              <span style={styles.sliderLabel}>dy</span>
              <input
                type="range" min={-120} max={120} value={leader.dy}
                onChange={(e) => updateSeries(i, { leader: { ...leader, dy: Number(e.target.value) } })}
                style={styles.slider}
              />
              <span style={styles.sliderVal}>{leader.dy}</span>
            </div>
          );
        })}
      </section>

      {/* 축 */}
      <section style={styles.section}>
        <label style={styles.label}>축</label>
        <div style={styles.rangeInputs}>
          <span style={styles.small}>x 단위</span>
          <input
            type="text"
            value={data.xUnit}
            onChange={(e) => onChange({ ...data, xUnit: e.target.value })}
            placeholder="(년)"
            style={{ ...styles.cellInput, width: 64, textAlign: 'center' }}
          />
          <span style={styles.small}>y 단위</span>
          <input
            type="text"
            value={data.yUnit}
            onChange={(e) => onChange({ ...data, yUnit: e.target.value })}
            placeholder="(%)"
            style={{ ...styles.cellInput, width: 64, textAlign: 'center' }}
          />
        </div>
        <label style={{ ...styles.toggleRow, marginTop: 8 }}>
          <input
            type="checkbox"
            checked={data.yRange.auto}
            onChange={(e) => onChange({ ...data, yRange: { ...data.yRange, auto: e.target.checked } })}
          />
          <span>y 범위 자동</span>
        </label>
        {!data.yRange.auto && (
          <div style={{ ...styles.rangeInputs, marginTop: 6 }}>
            <input type="number" value={data.yRange.min} onChange={(e) => updateRange('min', e.target.value)} style={styles.numInput} placeholder="최소" />
            <span>~</span>
            <input type="number" value={data.yRange.max} onChange={(e) => updateRange('max', e.target.value)} style={styles.numInput} placeholder="최대" />
            <span style={styles.small}>간격</span>
            <input type="number" value={data.yRange.step ?? ''} onChange={(e) => updateRange('step', e.target.value)} style={styles.numInput} placeholder="자동" min={0} step="any" />
          </div>
        )}
      </section>

      {/* 격자·기타 */}
      <section style={styles.section}>
        <label style={styles.label}>격자·기타</label>
        <div style={styles.checkGrid}>
          <label style={styles.toggleRow}>
            <input type="checkbox" checked={data.xGrid ?? false} onChange={(e) => onChange({ ...data, xGrid: e.target.checked })} />
            <span>세로 격자</span>
          </label>
          <label style={styles.toggleRow}>
            <input
              type="checkbox"
              checked={(data.gridColor ?? LIGHT_GRID) === DARK_GRID}
              onChange={(e) => onChange({ ...data, gridColor: e.target.checked ? DARK_GRID : LIGHT_GRID })}
            />
            <span>격자 진하게</span>
          </label>
          <label style={styles.toggleRow}>
            <input type="checkbox" checked={data.showMarkers} onChange={(e) => onChange({ ...data, showMarkers: e.target.checked })} />
            <span>마커 표시</span>
          </label>
          <label style={styles.toggleRow}>
            <input type="checkbox" checked={data.zeroBaseline ?? false} onChange={(e) => onChange({ ...data, zeroBaseline: e.target.checked })} />
            <span>0 기준선</span>
          </label>
        </div>
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: { marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #E5E7EB' },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 4 },
  small: { fontSize: 12, color: '#6B7280' },
  hint: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 },
  btnGroup: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  smallBtn: {
    width: 24, height: 24, borderRadius: 4, border: '1px solid #D1D5DB', background: '#fff',
    fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  seriesRow: { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, flexWrap: 'wrap' as const },
  select: { padding: '3px 4px', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 12, background: '#fff' },
  toggleRow: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' as const },
  modeGroup: { display: 'flex', gap: 4 },
  modeBtn: {
    flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 12,
    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
  },
  leaderRow: { display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 12 },
  leaderName: { width: 40, fontWeight: 600, color: '#374151', flexShrink: 0 },
  sliderLabel: { fontSize: 10, color: '#9CA3AF' },
  slider: { flex: 1, height: 4, cursor: 'pointer', minWidth: 50 },
  sliderVal: { fontSize: 10, color: '#9CA3AF', width: 28, textAlign: 'right' as const },
  rangeInputs: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, flexWrap: 'wrap' as const },
  numInput: {
    width: 70, padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' as const,
  },
  checkGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: { padding: '6px 4px', borderBottom: '2px solid #E5E7EB', textAlign: 'center' as const, fontSize: 11, fontWeight: 600, color: '#6B7280' },
  td: { padding: '3px 4px', borderBottom: '1px solid #F3F4F6', textAlign: 'center' as const, whiteSpace: 'nowrap' as const },
  cellInput: {
    width: 70, padding: '3px 5px', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' as const, outline: 'none',
  },
};
```

- [ ] **Step 2: DataDrawer 에 연결**

`import RadarInput from './RadarInput';` 다음에:

```ts
import LineInput from './LineInput';
```

`{graphType === 'absbar' && (…AbsBarInput…)}` 블록 다음에:

```tsx
      {graphType === 'line' && (
        <LineInput data={lineData} onChange={onLineDataChange} />
      )}
```

Task 4 에서 임시로 둔 `void lineData; void onLineDataChange;` 가 있으면 지운다.

- [ ] **Step 3: 빌드**

Run: `npm run build`
Expected: 통과.

- [ ] **Step 4: 화면 확인 — 2027-06 재현** (dev 서버 + Chrome)

꺾은선 그래프를 고르고 폼으로 위 「원본 두 장의 값」의 2027-06 표를 그대로 넣는다(계열 3개, 행 9개, x 이름은 `1980, '', 1990, '', 2000, '', 2010, '', 2020`). 계열 설정: (가) 일점쇄선·굵게·검정, (나) 실선·굵게·회색, (다) 실선·가늘게·검정. 계열 이름 표시 = 유도선, 오프셋은 표대로. y 범위 자동 해제 → 0~200 간격 50. 세로 격자·격자 진하게 켬, 마커 끔. 공통 옵션에 각주 2줄·출처 `(국가데이터처)`·「출처를 마지막 각주 줄에」 켬.

React 폼에 값을 넣을 때는 Chrome `form_input` 이나 `javascript_tool` 로 native input value setter 를 거쳐 `input` 이벤트를 쏜다(React 는 `.value =` 직접 대입을 감지하지 못한다):

```js
const set = (el, v) => {
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
};
```

확인 항목 (원본 이미지와 나란히):
- x축에 1980·1990·2000·2010·2020 만 보이고 세로 격자는 1990·2000·2010 세 줄
- (가) 굵은 일점쇄선, (나) 굵은 회색, (다) 가는 검정
- 유도선 라벨 셋이 선 근처에 놓이고 짧은 선이 선을 가리킴
- 마지막 각주 줄 오른쪽 끝에 `(국가데이터처)`
- 캔버스를 스크린샷으로 스크래치패드에 `line-2027-06.png` 로 저장(사용자에게 보여 줄 근거)

- [ ] **Step 5: 화면 확인 — 2026-09 재현**

같은 방법으로 2026-09 표(계열 A 실선·굵게 / B 파선·보통 / C 일점쇄선·보통, 모두 검정), 선 끝 라벨, y 자동 해제 → 80~120 간격 10, 제목 `〈권역별 인구 변화〉`, 각주 1줄, 출처 `(통계청)` 인라인. A·B·C 가 오른쪽 바깥에 세로로 놓이고 겹치지 않아야 한다. 스크린샷 `line-2026-09.png` 저장.

- [ ] **Step 6: 커밋**

```bash
git add src/components/LineInput.tsx src/components/DataDrawer.tsx
git commit -m "feat: 꺾은선 그래프 입력 폼 — 계열·자료 표·이름 표시·축·격자"
```

---

### Task 6: GeoGrapher 배포

- [ ] **Step 1: 작업 트리 확인**

Run: `git status --short`
Expected: 비어 있음. dist 가 추적 중이고 바뀌었다면 `git log --oneline -3 -- dist` 로 과거에 dist 를 커밋했는지 보고 같은 방식으로 한다(커밋해 왔으면 `git add dist && git commit -m "build: dist 갱신"`, 아니면 그대로 둔다).

- [ ] **Step 2: 푸시·배포** — `cpd` 스킬(현재 세션 프로젝트 커밋·푸시·배포)을 부른다. Vercel 프로덕션 브랜치는 `.vercel/project.json` 과 `git branch -r` 로 확인한다(이 저장소는 `master` 가 유일한 로컬 브랜치).

- [ ] **Step 3: 배포 확인** — 배포 URL(geographer.bgnl.kr)을 Chrome 으로 열어 드롭다운에 「꺾은선 그래프」가 있고 기본 그래프가 그려지는지 본다.

---

## Part B — csat-chart.js (v1.6.0)

작업 디렉터리: `C:/Users/김용현/Desktop/vibecoding/csat-chart.js`. 시작 전 `git status --short` 가 비어 있어야 한다.

### Task 7: 타입 확장 (`src/core/types/line.ts`)

**Files:**
- Modify: `src/core/types/line.ts`
- Modify: `src/core/index.ts`, `src/index.ts` (공개 표면), 필요하면 `test/index.test.ts`

- [ ] **Step 1: `LineSeries` 앞에 유도선 타입, 계열 필드, 배치 유니온, 그래프 필드 추가**

`export interface LineSeries {` **앞**에:

```ts
/** 유도선 라벨 자리 — 가리킬 점 번호와, 그 점에서 라벨 중심까지의 오프셋(px) */
export interface LineLeader {
  at: number;
  dx: number;
  dy: number;
}

/** 유도선 라벨의 기본 자리 — 가운데 점에서 오른쪽 위 */
export function defaultLineLeader(pointCount: number): LineLeader {
  return { at: Math.floor(Math.max(0, pointCount - 1) / 2), dx: 20, dy: -30 };
}
```

`LineSeries` 의 `areaFill?: string;` 다음에:

```ts
  /** 선 색. 미지정이면 검정. 시험지는 회색(#999)으로 한 계열을 가르기도 한다 */
  stroke?: string;
  /** 선 굵기(px). 미지정이면 2 */
  lineWidth?: number;
  /** 유도선 라벨 자리 (labelPlacement: 'leader' 일 때). 미지정이면 defaultLineLeader */
  leader?: LineLeader;
```

`LineLabelPlacement` 를 다음으로:

```ts
/** 계열 이름을 어디에 쓸지 — 선 끝 · 범례 상자 · 유도선 */
export type LineLabelPlacement = 'lineEnd' | 'legend' | 'leader';
```

`LineGraphData.xLabels` 의 주석·선언을 다음으로:

```ts
  /**
   * x축 눈금 이름 (예: 1~12월). **빈 문자열이면 그 자리의 이름·세로 격자를
   * 생략한다** — 5년 자료에 10년 라벨(1980·1990·…)을 다는 시험지 관습.
   */
  xLabels: string[];
```

`insideLegend?: boolean;` 다음에:

```ts
  /** x 눈금 자리에 세로 점선 격자. 첫·끝은 테두리와 겹치므로 안쪽만 긋는다 */
  xGrid?: boolean;
  /** 격자 색. 미지정이면 #ccc. 시험지는 #555 쯤의 진한 점선이다 */
  gridColor?: string;
```

`createDefaultLineData()` 는 **바꾸지 않는다.**

- [ ] **Step 2: 공개 표면**

Run: `grep -n "LineLabelPlacement\|LineSeries\|createDefaultLineData" src/core/index.ts src/index.ts test/index.test.ts`

`src/core/index.ts` 가 `export * from './types/index'` 꼴이면 할 일 없다. 이름을 하나씩 적는 곳(`src/index.ts` 는 확실히 그렇다)에서는 `LineLabelPlacement` 옆에 `LineLeader` 를(타입 export), `createDefaultLineData` 옆에 `defaultLineLeader` 를(값 export) 추가한다. `test/index.test.ts` 가 공개 이름 목록을 비교하면 그 목록에도 두 이름을 넣는다.

- [ ] **Step 3: 타입 검사 후 커밋**

Run: `npx tsc --noEmit && npx vitest run test/index.test.ts`
Expected: 통과.

```bash
git add src/core/types/line.ts src/core/index.ts src/index.ts
git commit -m "feat(line): 유도선·계열별 굵기/색·세로 격자 타입"
```
(`test/index.test.ts` 를 고쳤으면 함께 add.)

---

### Task 8: 렌더러 확장 (`src/core/graphs/LineGraph.ts`, `src/core/canvas/axes.ts`)

**Files:**
- Modify: `src/core/canvas/axes.ts:17-24, 38-43, 87-98`
- Modify: `src/core/graphs/LineGraph.ts`
- 필요하면 `src/core/canvas/legend.ts` (`LegendItem.lineWidth`)

- [ ] **Step 1: `axes.ts` — Task 2 와 같은 변경.** `YAxisParams` 에 `/** 격자선 색 — 미지정이면 #ccc */ gridColor?: string;`, 시그니처의 `drawGrid = false,` 다음 줄에 `gridColor = '#ccc',`, 격자선 블록의 `ctx.strokeStyle = '#ccc';` → `ctx.strokeStyle = gridColor;`.

- [ ] **Step 2: `LineGraph.ts` import 에 `defaultLineLeader` 추가**

```ts
import {
  type LineGraphData,
  type LineMarker,
  type GraphOptions,
  LINE_DASH,
  LINE_STYLE_ORDER,
  LINE_MARKER_ORDER,
  defaultLineLeader,
} from '../types/index';
```

- [ ] **Step 3: 아래 여백 — `sourceInline`**

`bottom` 계산의
```ts
      if (options.source) b += 30;
      b += options.footnotes.filter((f) => f.trim()).length * 22;
```
를
```ts
      const notes = options.footnotes.filter((f) => f.trim()).length;
      // 출처를 각주와 같은 줄에 두면(sourceInline) 줄이 하나 줄어든다
      if (options.source && !(options.sourceInline && notes > 0)) b += 30;
      b += notes * 22;
```
로.

- [ ] **Step 4: 격자 색·세로 격자·라벨 자리**

`// 사각 테두리` 바로 앞에 `const gridColor = data.gridColor ?? '#ccc';` 를 넣고, `drawYAxis({ … drawGrid: true,` 다음 줄에 `gridColor,` 를 추가한다.

`const toY = …` 줄 다음(0 기준선 블록 **앞**)에:

```ts
  // x 라벨을 어느 자리에 그리는가 — 빈 이름은 건너뛰고, 서로 붙으면 몇 개 걸러 그린다.
  // 세로 격자도 **같은 자리**에만 긋는다 (라벨과 격자가 늘 함께 간다).
  ctx.font = getFont(options.fontSize.tick, options, 'bold');
  const xStride = labelStride(stepX, widestLabel(ctx, data.xLabels));
  const labelShown = (i: number) => data.xLabels[i] !== '' && i % xStride === 0;

  // 세로 격자 — 선보다 먼저 그려야 선이 위에 남는다
  if (data.xGrid) {
    ctx.save();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    for (let i = 1; i < n - 1; i++) {
      if (!labelShown(i)) continue;
      ctx.beginPath();
      ctx.moveTo(toX(i), plotY);
      ctx.lineTo(toX(i), plotY + plotH);
      ctx.stroke();
    }
    ctx.restore();
  }
```

기존 「X축 눈금 이름」 블록의
```ts
  const xStride = labelStride(stepX, widestLabel(ctx, data.xLabels));
  data.xLabels.forEach((label, i) => {
    if (i % xStride !== 0) return;
```
를
```ts
  data.xLabels.forEach((label, i) => {
    if (!labelShown(i)) return;
```
로 (xStride 선언은 위로 옮겨졌다 — 남겨 두면 중복 선언 컴파일 오류). 주석은 `// X축 눈금 이름 — 빈 이름은 건너뛴다`.

- [ ] **Step 5: 선 색·굵기**

「// 선」 블록의
```ts
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
```
를
```ts
    ctx.strokeStyle = s.stroke ?? '#000';
    ctx.lineWidth = s.lineWidth ?? 2;
```
로. 주석은 `// 선 — 계열마다 종류·굵기·색이 다를 수 있다`.

- [ ] **Step 6: 유도선 라벨** — `if (data.labelPlacement === 'lineEnd') { … }` 블록 **다음**에 Task 3 의 `if (data.labelPlacement === 'leader') { … }` 블록을 그대로 넣되 글꼴 줄만 csat 시그니처로:

```ts
    ctx.font = getFont(options.fontSize.dataLabel, options, 'bold');
```

(나머지 — `defaultLineLeader(n)`, 가장 가까운 값 있는 점 찾기, 상자 경계 매개변수 `t`, 3px 앞에서 멈추는 선, `fillText` — Task 3 코드와 글자까지 같다.)

- [ ] **Step 7: 범례 항목** — `else if (useLegend)` 의 items 를

```ts
    // 범례 아이콘도 선과 같은 색·굵기·대시로
    const items: LegendItem[] = data.series.map((s, si) => ({
      type: 'line',
      fillStyle: s.stroke ?? '#000',
      strokeStyle: s.stroke ?? '#000',
      lineWidth: s.lineWidth,
      label: s.label,
      dash: LINE_DASH[s.lineStyle ?? LINE_STYLE_ORDER[si % LINE_STYLE_ORDER.length]],
    }));
```
로. `grep -n "lineWidth" src/core/canvas/legend.ts` 로 `LegendItem.lineWidth` 가 있는지 본다 — 없으면 `LegendItem` 에 `/** 선 아이콘(line)의 굵기 — 미지정 시 2.5 */ lineWidth?: number;` 를 추가하고 `drawIcon` 의 line 분기에서 `ctx.lineWidth = item.lineWidth ?? 2.5;` 를 쓴다(기본값이 그대로면 골든에 영향 없다).

- [ ] **Step 8: 출처 인라인** — 마지막 `drawSourceAndFootnote({ … source: options.source,` 다음 줄에 `sourceInline: options.sourceInline,` 추가.

- [ ] **Step 9: 기존 골든이 그대로인지**

Run: `npx tsc --noEmit && npx vitest run test/core/golden.test.ts`
Expected: 전부 통과 — 특히 `line 렌더 결과가 기준 이미지와 같다`. 실패하면 기본값이 어긋난 것이다(`gridColor` 기본 `#ccc`, 선 `#000`/2, `xGrid` 미지정 → 격자 없음, `labelStride` 결과 동일). `git status --short` 에 `test/core/__snapshots__/line.png` 가 나타나면 안 된다.

- [ ] **Step 10: 커밋**

```bash
git add src/core/canvas/axes.ts src/core/graphs/LineGraph.ts
git commit -m "feat(line): 유도선 라벨·계열별 굵기/색·세로 격자·빈 x 라벨·출처 인라인"
```
(`legend.ts` 를 고쳤으면 함께.)

---

### Task 9: 골든 픽스처 2장

**Files:**
- Modify: `test/core/fixtures.ts` (`lineWithData` 뒤에 픽스처 2개, `CASES` 에 2행)
- Modify: `test/core/golden.test.ts:26-45` (`optionsFor`)
- Create (테스트가 만든다): `test/core/__snapshots__/lineLeader.png`, `lineEndExam.png`

- [ ] **Step 1: 픽스처** — `lineWithData` 정의 다음에:

```ts
/**
 * 2027학년도 6월 모평 한국지리 17번 모양 — 5년 자료에 10년 라벨(빈 이름),
 * 계열은 굵은 일점쇄선·굵은 회색 실선·가는 검정 실선, 이름은 **유도선**.
 * 세로 격자·진한 격자·출처 인라인까지 감시한다.
 */
const lineLeader = () => {
  const d = createDefaultLineData();
  d.xLabels = ['1980', '', '1990', '', '2000', '', '2010', '', '2020'];
  d.series = [
    { label: '(가)', values: [190, 150, 130, 113, 100, 85, 83, 89, 88],
      lineStyle: 'dashdot', lineWidth: 3.5, leader: { at: 2, dx: 40, dy: -45 } },
    { label: '(나)', values: [88, 93, 97, 98, 100, 100, 99, 103, 104],
      lineStyle: 'solid', lineWidth: 3.5, stroke: '#999', leader: { at: 2, dx: -30, dy: -45 } },
    { label: '(다)', values: [57, 70, 87, 97, 100, 100, 99, 98, 97],
      lineStyle: 'solid', lineWidth: 1.5, leader: { at: 3, dx: 30, dy: 45 } },
  ];
  d.xUnit = '(년)';
  d.yUnit = '';
  d.yRange = { min: 0, max: 200, auto: false, step: 50 };
  d.labelPlacement = 'leader';
  d.showMarkers = false;
  d.xGrid = true;
  d.gridColor = '#555';
  return d;
};

/**
 * 2026학년도 9월 모평 한국지리 13번 모양 — 0 에서 시작하지 않는 y(80~120),
 * 굵은 실선·파선·일점쇄선, 이름은 선 끝. 제목·세로 격자·출처 인라인.
 */
const lineEndExam = () => {
  const d = createDefaultLineData();
  d.xLabels = ['1990', '1995', '2000', '2005', '2010', '2015', '2023'];
  d.series = [
    { label: 'A', values: [93, 92.5, 97.5, 100, 105, 113, 119], lineStyle: 'solid', lineWidth: 3 },
    { label: 'B', values: [81, 89, 94, 100, 104.5, 111, 115], lineStyle: 'dashed' },
    { label: 'C', values: [99, 101, 101.5, 100, 100, 103, 99.5], lineStyle: 'dashdot' },
  ];
  d.xUnit = '(년)';
  d.yUnit = '';
  d.yRange = { min: 80, max: 120, auto: false, step: 10 };
  d.labelPlacement = 'lineEnd';
  d.showMarkers = false;
  d.xGrid = true;
  d.gridColor = '#555';
  return d;
};
```

`CASES` 의 `['line', renderLineGraph as Renderer, lineWithData],` 다음에:

```ts
  ['lineLeader', renderLineGraph as Renderer, lineLeader],
  ['lineEndExam', renderLineGraph as Renderer, lineEndExam],
```

- [ ] **Step 2: `optionsFor`** — `if (name.endsWith('ExamFrame')) {…}` 블록 다음에:

```ts
  // 꺾은선 시험지 두 장 — 각주·출처 인라인, 한 장은 제목까지
  if (name === 'lineLeader') {
    return {
      ...base,
      source: '(국가데이터처)',
      footnotes: ['각 지역의 2000년 인구를 100으로 했을 때의 상댓값임.', '2020년 행정 구역을 기준으로 함.'],
      sourceInline: true,
    };
  }
  if (name === 'lineEndExam') {
    return {
      ...base,
      title: '〈권역별 인구 변화〉',
      source: '(통계청)',
      footnotes: ['각 권역의 2005년 인구를 100으로 했을 때의 상댓값임.'],
      sourceInline: true,
    };
  }
```

- [ ] **Step 3: 기준 이미지 생성**

Run: `npx vitest run test/core/golden.test.ts`
Expected: 통과. 새 파일 `test/core/__snapshots__/lineLeader.png`·`lineEndExam.png` 가 생긴다(처음 생성은 통과 처리). `git status --short` 에 **이 두 파일만** `??` 로 보이고 `line.png` 는 안 보여야 한다.

- [ ] **Step 4: 눈으로 확인** — 두 PNG 를 Read 툴로 열어 원본 두 장과 대조한다. 확인 항목은 Task 5 Step 4·5 와 같다. 어긋나면 렌더러(Task 8)나 픽스처 값을 고치고 `UPDATE_GOLDEN=1 npx vitest run test/core/golden.test.ts` 로 다시 만든다(이때 `line.png` 가 바뀌지 않았는지 `git status` 로 재확인).

- [ ] **Step 5: 전체 테스트**

Run: `npx vitest run`
Expected: 전부 통과. `scaffold.test.ts`·`registry.test.ts` 가 CASES 개수나 스냅샷 파일 수를 세면 그 기대값을 +2 한다 — 실패 메시지가 알려 준다.

- [ ] **Step 6: 커밋**

```bash
git add test/core/fixtures.ts test/core/golden.test.ts test/core/__snapshots__/lineLeader.png test/core/__snapshots__/lineEndExam.png
git commit -m "test(line): 시험지 두 장 골든 — 유도선·선 끝"
```

---

### Task 10: 문서·버전·빌드·태그

**Files:**
- Modify: `docs/ai-reference.md:229-236` (line 블록), `:463-465` (알려진 한계)
- Modify: `README.md:209` (`sourceInline` 행), 「그래프 17종」 표 아래에 꺾은선 절
- Modify: `CHANGELOG.md` (맨 위에 1.6.0)
- Modify: `package.json`·`package-lock.json` (1.6.0)
- Modify (빌드 산출물): `docs/lib/csat-chart.umd.min.js` (+ `dist/` 가 추적 중이면)

- [ ] **Step 1: `docs/ai-reference.md` line 블록** — 다음으로 교체:

```md
**line** — 바꿔볼 만한 필드: `series`, `xLabels`
- `series`: 배열(1) of `{ label: string, values: number[] }` (실제 필드는 `(number|null)[]`도 허용 — `null`은 선이 끊김을 뜻함)
- `xLabels`: 배열(12) of string — **빈 문자열이면 그 자리의 이름·세로 격자를 생략한다** (5년 자료에 10년 라벨)
- `xUnit`: string (기본 `'(월)'`)
- `yUnit`: string (기본 `''`)
- `yRange`: `{ min: 0, max: 100, auto: true }`
- `labelPlacement`: `'lineEnd' | 'legend' | 'leader'` (기본 `'lineEnd'`). `'leader'`는 유도선 — 이름을 선 근처에 쓰고 짧은 선으로 가리킨다
- `showMarkers`: boolean (기본 `true`)
- 선택 필드(1.6.0): `series[].stroke`(선 색, 기본 검정 — 시험지는 `'#999'` 회색으로 한 계열을 가른다), `series[].lineWidth`(px, 기본 2), `series[].leader`(`{ at, dx, dy }` — 가리킬 점 번호와 라벨 오프셋, 기본 가운데 점에서 `+20, -30`), `xGrid`(세로 점선 격자), `gridColor`(격자 색, 기본 `'#ccc'` — 시험지는 `'#555'`)
```

「알려진 한계」의 `sourceInline`은 `scatter`와 `econ-plane`에서만 → `scatter`·`econ-plane`·`line`에서만 으로 고친다.

- [ ] **Step 2: `README.md`** — `sourceInline` 행의 **지금은 `scatter`·`econ-plane` 에서만 동작합니다** 를 **지금은 `scatter`·`econ-plane`·`line` 에서만 동작합니다** 로. 「그래프 17종」 표 아래 설명 문단(「…오류 가려내기 참고.」) 다음에 절을 하나 넣는다:

```md
### 꺾은선 — 시험지 관습 네 가지

`line` 은 수능 꺾은선의 관습을 옵션으로 둡니다 (1.6.0). 전부 선택이라 안 적으면
예전과 같이 그립니다.

| 칸 | 값 | 하는 일 |
|---|---|---|
| `xLabels[]` 의 빈 문자열 | `''` | 그 자리의 이름과 세로 격자를 건너뜁니다 — 자료는 5년마다, 라벨은 10년마다(`['1980','','1990',…]`) |
| `series[].stroke` · `series[].lineWidth` | `'#999'` · `3.5` | 계열을 색이 아니라 **굵기와 회색**으로 가릅니다 |
| `labelPlacement: 'leader'` + `series[].leader` | `{ at: 2, dx: 40, dy: -45 }` | 이름을 선 근처에 쓰고 짧은 **유도선**으로 가리킵니다. `at` 은 가리킬 점 번호, `dx`·`dy` 는 그 점에서 라벨까지의 거리 |
| `xGrid` · `gridColor` | `true` · `'#555'` | 세로 점선 격자와 격자 색. 시험지는 가로·세로 모두 진한 점선입니다 |
```

- [ ] **Step 3: `CHANGELOG.md`** 맨 위(`# 변경 기록 — csat-chart.js` 다음 빈 줄 뒤)에:

```md
## 1.6.0 — 2026-09-11

**꺾은선을 실물 두 장만큼 더 그릴 수 있게 했다.** 2027학년도 6월 모평 한국지리
17번(세 지역의 인구 변화)과 2026학년도 9월 모평 한국지리 13번(권역별 인구 변화)을
재어 보니, 기존 `line` 에 네 가지가 빠져 있었다.

### 새로 그릴 수 있는 것

| 칸 | 값 | 어느 그림에서 왔나 |
|---|---|---|
| `xLabels[]` 의 빈 문자열 | `''` | 17번 — 자료는 5년마다인데 라벨과 세로 격자는 10년마다(1980·1990·…). 빈 이름 자리는 이름도 격자도 건너뛴다 |
| `series[].stroke` · `series[].lineWidth` | `'#999'` · `3.5` | 17번 — (가)는 굵은 일점쇄선, (나)는 굵은 **회색** 실선, (다)는 가는 검정 실선. 흑백 시험지가 계열을 가르는 세 번째 수단이 굵기와 회색이다 |
| `labelPlacement: 'leader'` · `series[].leader` | `{ at, dx, dy }` | 17번 — 이름을 선 끝이 아니라 선 **근처**에 쓰고 짧은 유도선으로 가리킨다. `at` 은 가리킬 점, `dx`·`dy` 는 그 점에서 라벨까지의 거리. 안 주면 가운데 점의 오른쪽 위 |
| `xGrid` · `gridColor` | `true` · `'#555'` | 두 장 모두 — 가로·세로 진한 점선 격자. 예전에는 가로 격자만, 그것도 연회색이었다 |

`sourceInline` 도 `line` 이 읽는다 — 두 장 모두 출처가 마지막 각주와 같은 줄 오른쪽
끝에 있다. 「알려진 한계」의 목록에서 `line` 을 뺐다.

### 기준 이미지

`line.png` 는 **바이트 그대로**다 — 새 칸을 안 적으면 예전과 같이 그린다는 증거다.
`lineLeader.png`(17번 모양)·`lineEndExam.png`(13번 모양) 두 장이 늘어 41장이다.

### 그 밖에

- `drawYAxis` 가 `gridColor` 인자를 받는다(기본 `#ccc` 그대로). 저수준 렌더러를
  직접 쓰는 사람에게만 보이는 변화다.
- 같은 확장을 GeoGrapher(geographer.bgnl.kr)에도 넣었다 — 거기서는 폼으로 값을
  넣고 PNG 로 뽑는다.
```

(골든 총수 41 은 `ls test/core/__snapshots__ | wc -l` 로 확인해 맞춘다.)

- [ ] **Step 4: 버전**

Run: `npm version 1.6.0 --no-git-tag-version`
Expected: `package.json`·`package-lock.json` 의 version 이 1.6.0.

- [ ] **Step 5: 검증·빌드**

Run: `npm run verify`
Expected: typecheck·lint·build·test 전부 통과. `docs/lib/csat-chart.umd.min.js` 가 갱신된다.

Run: `git status --short`
Expected: 문서 3개 + package 2개 + `docs/lib/csat-chart.umd.min.js` (+ `dist/` 가 추적 중이면 그것도).

- [ ] **Step 6: 커밋·태그·푸시**

과거 릴리스 커밋이 무엇을 담았는지 먼저 본다: `git show --stat aa14822 | head -30`. 그에 맞춰:

```bash
git add CHANGELOG.md README.md docs/ai-reference.md package.json package-lock.json docs/lib/csat-chart.umd.min.js
git commit -m "chore: 1.6.0 — 꺾은선에 유도선·굵기/회색·세로 격자·빈 x 라벨"
git tag v1.6.0
git push origin master --tags
```

- [ ] **Step 7: CI·릴리스** — `gh run list --limit 1` 로 CI 가 초록인지 확인(1~2분). `gh release list | head -3` 으로 과거 태그에 GitHub Release 가 있으면 같은 형식으로 `gh release create v1.6.0 --title "v1.6.0" --notes-file <CHANGELOG 1.6.0 절을 담은 임시 파일>` 로 만든다. npm 발행은 사용자 몫 — 마지막 보고에 `npm login` 후 `npm publish` 를 안내한다.

---

### Task 11: 메모리 갱신

- [ ] `C:/Users/김용현/.claude/projects/C--Users----/memory/csat-chart-js-project.md` 의 「공개 상태」에 1.6.0(2026-09-11, 꺾은선 확장, 골든 41장)을 적고, 「알아 둘 것」의 `sourceInline` 문장에 line 을 더한다. geotester-v2 `geo-graph/LineGraph.ts` 는 **이번에 동기화하지 않아** 세 벌 중 그것만 뒤처진다는 한 줄을 적는다.
- [ ] GeoGrapher 메모리 파일이 없으므로 `geographer-project.md` 를 새로 만든다: 위치·배포(Vercel, geographer.bgnl.kr)·꺾은선 추가(2026-09-11)·스펙/플랜 경로·"csat-chart.js 와 코드가 같은 뿌리, geo-graph 는 읽기 전용 이식". `MEMORY.md` 에 한 줄 추가.
