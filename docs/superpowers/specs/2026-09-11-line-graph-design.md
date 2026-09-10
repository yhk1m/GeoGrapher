# 꺾은선 그래프 — 설계

> 작성일: 2026-09-11
> 대상: GeoGrapher (신규 유형 추가·배포) + csat-chart.js (기존 `line` 확장, v1.6.0)
> geotester-v2 의 `geo-graph` 는 이번에 손대지 않는다.

## 1. 목적

수능 스타일 꺾은선 그래프를 GeoGrapher 에서 만들 수 있게 한다. 기준 원본 두 장:

| 원본 | 특징 |
|---|---|
| 2027학년도 6월 모평 한국지리 17번 (`Desktop/2027_06_korgeo_17.jpg`) | 5년 자료·10년 라벨(1980·1990·…·2020), y 0~200, 계열 3개 — (가) 굵은 일점쇄선, (나) 굵은 회색 실선, (다) 가는 검정 실선. 계열 이름은 **유도선** 라벨. 각주 2줄 + 출처 인라인 `(국가데이터처)` |
| 2026학년도 9월 모평 한국지리 13번 (`Desktop/2026_09_korgeo_13.jpg`) 오른쪽 | 1990·1995·…·2015·2023 (7칸 균등), y 80~120, 계열 A 굵은 실선·B 파선·C 일점쇄선. 계열 이름은 **선 끝 바깥**. 제목 `〈권역별 인구 변화〉` |

두 장의 공통 틀: 사각 테두리, 안쪽 눈금마다 **진한 점선 격자(가로·세로)**, 첫·끝 x 가 테두리에 딱 붙음, 마커 없음, 범례 상자 없음, x 단위 `(년)` 은 마지막 눈금 옆.

## 2. 출발점

csat-chart.js `src/core/graphs/LineGraph.ts` + `src/core/types/line.ts` 에 이미 `line` 렌더러가 있다 (GeoGrapher 에만 없음). 가진 것:

- 범주형 `xLabels`, 양 끝 정렬(`plotW / (n-1)`), `xUnit` 마지막 눈금 옆
- 계열별 `lineStyle`(solid/dashed/dotted/dashdot) · `marker`(circle/square/triangle/diamond) · `hollowMarker` · `areaFill`
- `labelPlacement: 'lineEnd' | 'legend'`, `showMarkers`, `zeroBaseline`, `stacked`, `insideLegend`
- 빈 값(`null`) → 선 끊김

**이것을 GeoGrapher 로 가져와 확장하고, 확장을 csat-chart.js 에 되돌려 넣는다.** 기존 동작은 전부 기본값으로 보존한다 — csat 골든 `line.png` 가 바이트 그대로 통과해야 한다.

## 3. 데이터 타입 (확장 — 모두 선택 필드)

```ts
export interface LineSeries {
  label: string;
  values: (number | null)[];
  lineStyle?: LineStyle;
  marker?: LineMarker;
  hollowMarker?: boolean;
  areaFill?: string;
  /** 선 색. 미지정 검정. 시험지는 회색(#999)으로 한 계열을 가르기도 한다 */
  stroke?: string;
  /** 선 굵기 px. 미지정 2 */
  lineWidth?: number;
  /**
   * 유도선 라벨 (labelPlacement: 'leader' 일 때). `at` 은 가리킬 점 번호,
   * `dx`·`dy` 는 그 점에서 라벨 중심까지의 오프셋(px).
   * 미지정이면 at = 가운데 점, dx = 20, dy = -30.
   */
  leader?: { at: number; dx: number; dy: number };
}

export type LineLabelPlacement = 'lineEnd' | 'legend' | 'leader';

export interface LineGraphData {
  series: LineSeries[];
  /** 빈 문자열이면 그 자리의 이름·눈금·세로 격자를 생략한다 (5년 자료·10년 라벨) */
  xLabels: string[];
  xUnit: string;
  yUnit: string;
  yRange: { min: number; max: number; auto: boolean; step?: number };
  labelPlacement: LineLabelPlacement;
  showMarkers: boolean;
  zeroBaseline?: boolean;
  stacked?: boolean;
  insideLegend?: boolean;
  /** x 눈금 자리에 세로 점선 격자. 첫·끝은 테두리와 겹치므로 안쪽만 */
  xGrid?: boolean;
  /** 격자 색. 미지정 #ccc. 시험지는 #555 */
  gridColor?: string;
}
```

GeoGrapher 기본값 `createDefaultLineData()`: 계열 1개 `(가)`, x `1990·1995·…·2020` 7칸, `xUnit '(년)'`, `labelPlacement 'lineEnd'`, `showMarkers false`, `xGrid true`, `gridColor '#555'`. (csat 의 기본값은 기존 그대로 둔다 — 골든 보존.)

## 4. 렌더러 동작

- **선**: `stroke`·`lineWidth` 를 계열마다 반영. 범례 상자(`legend` 모드) 항목도 같은 색·굵기·대시로 그린다 (`LegendItem.strokeStyle`·`lineWidth`·`dash`).
- **세로 격자**: `xGrid` 이면 `xLabels[i] !== ''` 이고 `0 < i < n-1` 인 x 에 `gridColor` 점선(`[4,4]`, 0.5px — 가로 격자와 같은 스타일).
- **가로 격자 색**: `drawYAxis` 에 `gridColor?: string` 인자를 추가(기본 `#ccc`)하고 꺾은선이 넘긴다.
- **x 라벨**: 빈 문자열은 건너뛴다. 기존 자동 걸러 그리기(`labelStride`)는 그대로 — `i % stride === 0` 이고 라벨이 비지 않았을 때만 그린다. `widestLabel` 은 빈 라벨을 빼고 잰다.
- **유도선 라벨**(`labelPlacement: 'leader'`): 계열마다 `leader` 를 읽어 점 `(toX(at), toY(v[at]))` 에서 `(dx, dy)` 만큼 떨어진 곳에 이름을 가운데 정렬로 쓴다. 라벨 상자(글자 폭·높이에 여백 2px) 가장자리에서 점을 향해 1px 검정 실선을 긋되 점 3px 앞에서 멈춘다. `at` 의 값이 `null` 이면 값이 있는 가장 가까운 점으로 바꾼다. 오른쪽 여백은 `lineEnd` 때와 달리 추가로 확보하지 않는다.
- **출처 인라인**: `drawSourceAndFootnote` 에 `sourceInline: options.sourceInline` 을 넘기고, 아래 여백 계산에서 산점도와 같은 규칙(`source && !(sourceInline && 각주 있음)` 일 때만 +30)을 쓴다.
- 나머지(선 끝 라벨의 세로 열 배치, 마커, 누적, 면적, 0 기준선)는 기존 코드 그대로.

## 5. GeoGrapher 연결

| 파일 | 변경 |
|---|---|
| `src/data/types.ts` | `GraphType` 에 `'line'`, `GRAPH_LABELS.line = '꺾은선 그래프'`, §3 타입·상수(`LINE_DASH`·`LINE_STYLE_ORDER`·`LINE_MARKER_ORDER`)·`createDefaultLineData()` |
| `src/graphs/LineGraph.ts` | 신규. csat 것을 GeoGrapher 시그니처(`getFont(size, font, customFont, weight)`, `drawLegend` 등)로 옮기고 §4 확장 |
| `src/canvas/axes.ts` | `drawYAxis` 에 `gridColor?` |
| `src/components/LineInput.tsx` | 신규 (§6) |
| `src/components/Header.tsx` | `MENU_ITEMS` 에 `'absbar'` 다음 `'line'` |
| `src/App.tsx` | `lineData` 상태 + 세 컴포넌트에 전달 |
| `src/components/GraphCanvas.tsx` · `ExportModal.tsx` | `'line'` 분기 → `renderLineGraph` |
| `src/components/DataDrawer.tsx` | props·`LineInput` 분기·"준비 중" 조건에 `'line'` 추가. 공통 섹션에 **"출처를 각주 줄에"** 체크박스(`options.sourceInline`) — `graphType` 이 `'scatter'` 또는 `'line'` 일 때만 표시 |
| `src/components/GuidePage.tsx` | 카드 1개 (`onNavigate('line')`) |

## 6. 입력 UI (`LineInput.tsx`)

기존 `AbsBarInput`(표) · `CubeInput`(오프셋 슬라이더) 의 스타일·패턴을 따른다.

1. **계열** — `+`/`−` 로 추가·삭제(최대 6). 계열마다 한 줄: 이름 · 선 종류 select(실선/파선/점선/일점쇄선) · 굵기 select(가늘게 1.5 / 보통 2 / 굵게 3.5) · 색 select(검정 `#000` / 회색 `#999`) · 마커 select(○ □ △ ◇) · 속 비움 checkbox
2. **자료 표** — 행 = x 지점, 열 = `x 이름 | 계열1 | 계열2 …`. 행 `+`/`−`. x 이름을 비우면 라벨·격자 생략, 값을 비우면 `null`(선 끊김). 숫자 입력은 `type="number"` 가 아니라 텍스트로 받아 빈 칸을 허용한다.
3. **계열 이름 표시** — `선 끝 / 유도선 / 범례` 3버튼(모드 버튼 스타일). `유도선` 일 때 계열마다: 가리킬 점 select(x 이름, 빈 이름은 번호로 표시) + `dx`·`dy` 슬라이더(−120~120)
4. **축** — x 단위, y 단위, y 범위 자동 checkbox / 수동 min·max·step
5. **격자·기타** — 세로 격자 ☐, 격자 진하게 ☐(`gridColor` `#555` ↔ `#ccc`), 마커 표시 ☐, 0 기준선 ☐

드로어 공통 "범례 표시/위치" 는 `범례` 모드에서만 효력이 있다(기존 csat 규칙). 누적·면적 채움은 UI 에 올리지 않는다.

## 7. csat-chart.js (v1.6.0)

- `src/core/types/line.ts` · `src/core/graphs/LineGraph.ts` · `src/core/canvas/axes.ts` 에 §3·§4 를 csat 시그니처(`fonts: options`)로 반영. `createDefaultLineData()` 는 바꾸지 않는다.
- 골든 픽스처 추가 (`test/core/fixtures.ts` → `golden.test.ts`): `lineLeader`(2027-06-17 모양 — 유도선·회색 굵은 선·빈 라벨·세로 격자·`sourceInline`) · `lineEndExam`(2026-09-13 모양 — 선 끝 라벨·80~120 축·제목). 기존 `line.png` 는 바이트 동일해야 한다.
- `validate.ts` 는 기본 데이터의 키만 얕게 보므로 변경 없음(새 필드는 전부 선택).
- 문서: `README.md`·`docs/ai-reference.md` 의 line 항목에 새 필드와 `'leader'`; `sourceInline` 의 "scatter·econ-plane 에서만" 문구에 line 추가. `CHANGELOG.md` 1.6.0. `package.json` 1.6.0. `npm run build` 로 `docs/lib` 갱신 후 함께 커밋. `v1.6.0` 태그.
- npm 발행은 사용자 몫(`npm login` 대화형).

## 8. 검증

- **GeoGrapher**: `npm run build` 통과. 로컬 dev 서버에서 두 원본을 값으로 재현해 스크린샷을 원본과 나란히 대조(형태·라벨 위치·격자·선 종류). 통과 후 커밋 → Vercel 배포 → 배포 URL 에서 꺾은선 메뉴 확인.
- **csat-chart.js**: `npx vitest run`(골든 포함, 이 PC) · `npx tsc --noEmit` · `npm run build` · `git diff --exit-code docs/lib` 가 깨끗함.

## 9. 범위 밖

- geotester-v2 `geo-graph/LineGraph.ts` 동기화 (별건 — 메모리에 기록)
- 수치형 x 축 (비례 배치)
- 누적·면적 채움의 GeoGrapher UI
- 두 원본을 GeoTester 문항으로 추가
