// © 2026 김용현
// 등치선도 — IDW 보간 → 그리드 → d3-contour → SVG path
import { useEffect, useMemo, useRef, useState } from 'react';
import { geoPath } from 'd3-geo';
import { contours as d3contours } from 'd3-contour';
import type { Feature } from 'geojson';
import type { IsolineState, RegionProps } from './types';
import { MAP_UNIT_ASPECT, MAP_UNIT_SCOPE, getBasePaletteColors } from './types';
import { createProjection } from './projection';
import { useGeoData } from './useGeoData';

interface Props {
  state: IsolineState;
  legendPos: { x: number; y: number };
  onLegendPosChange: (p: { x: number; y: number }) => void;
  legendScale: number;
  legendWidthOverride: number | null;
}

export default function IsolineCanvas({
  state,
  legendPos,
  onLegendPosChange,
  legendScale,
  legendWidthOverride,
}: Props) {
  const geo = useGeoData(state.unit);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState({ s: 1, tx: 0, ty: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setBox({ w: Math.round(r.width), h: Math.round(r.height) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { svgW, svgH } = useMemo(() => {
    if (box.w === 0 || box.h === 0) return { svgW: 0, svgH: 0 };
    const { w: aw, h: ah } = MAP_UNIT_ASPECT[state.unit];
    const byW = { w: box.w, h: (box.w * ah) / aw };
    const byH = { w: (box.h * aw) / ah, h: box.h };
    const fit = byW.h <= box.h ? byW : byH;
    return { svgW: Math.floor(fit.w), svgH: Math.floor(fit.h) };
  }, [box, state.unit]);

  // 휠 줌
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      setZoom((z) => {
        const ns = Math.max(1, Math.min(12, z.s * factor));
        const a = ns / z.s;
        const tx = mx - (mx - z.tx) * a;
        const ty = my - (my - z.ty) * a;
        return ns === 1 ? { s: 1, tx: 0, ty: 0 } : { s: ns, tx, ty };
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [svgW, svgH]);

  useEffect(() => {
    setZoom({ s: 1, tx: 0, ty: 0 });
  }, [state.unit]);

  // 범례 드래그
  const legendDragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!legendDragRef.current) return;
      onLegendPosChange({
        x: legendDragRef.current.ox + (e.clientX - legendDragRef.current.sx),
        y: legendDragRef.current.oy + (e.clientY - legendDragRef.current.sy),
      });
    };
    const onUp = () => { legendDragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [onLegendPosChange]);
  const handleLegendMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    legendDragRef.current = { sx: e.clientX, sy: e.clientY, ox: legendPos.x, oy: legendPos.y };
  };

  // 투영 + centroid 기반 포인트 수집
  const { pathFn, features, mapOutlinePath, points } = useMemo(() => {
    if (geo.status !== 'ready' || svgW === 0) {
      return { pathFn: null, features: [] as Feature<GeoJSON.Geometry, RegionProps>[], mapOutlinePath: '', points: [] as { x: number; y: number; v: number; name: string }[] };
    }
    const projection = createProjection(state.unit, svgW, svgH, geo.data);
    const path = geoPath(projection);
    const pts: { x: number; y: number; v: number; name: string }[] = [];
    for (const f of geo.data.features) {
      const code = String(f.properties.code ?? '');
      if (state.values[code] == null) continue;
      const [cx, cy] = path.centroid(f);
      if (!isFinite(cx) || !isFinite(cy)) continue;
      pts.push({ x: cx, y: cy, v: state.values[code], name: f.properties.name });
    }
    // 전체 지도 외곽선 (클리핑용): 모든 feature의 path 합쳐서 단일 문자열
    const outline = geo.data.features.map((f) => path(f) ?? '').join(' ');
    return { pathFn: path, features: geo.data.features, mapOutlinePath: outline, points: pts };
  }, [geo, svgW, svgH, state.values, state.unit]);

  // IDW 보간으로 그리드 생성
  const gridData = useMemo(() => {
    if (svgW === 0 || points.length === 0) return null;
    const gw = state.gridResolution;
    const gh = Math.round(gw * (svgH / svgW));
    const grid = new Float64Array(gw * gh);
    const cellW = svgW / gw;
    const cellH = svgH / gh;
    const power = state.interpolationPower;
    for (let j = 0; j < gh; j++) {
      for (let i = 0; i < gw; i++) {
        const x = (i + 0.5) * cellW;
        const y = (j + 0.5) * cellH;
        let sum = 0;
        let wsum = 0;
        let hit: number | null = null;
        for (const p of points) {
          const dx = x - p.x;
          const dy = y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 0.01) { hit = p.v; break; }
          const w = 1 / Math.pow(d2, power / 2);
          sum += p.v * w;
          wsum += w;
        }
        grid[j * gw + i] = hit !== null ? hit : (wsum > 0 ? sum / wsum : 0);
      }
    }
    return { grid, gw, gh, cellW, cellH };
  }, [svgW, svgH, points, state.gridResolution, state.interpolationPower]);

  // 등치선 레벨 결정
  const levels = useMemo(() => {
    if (!gridData) return { thresholds: [] as number[], majors: new Set<number>(), min: 0, max: 0 };
    let min = Infinity;
    let max = -Infinity;
    for (const v of gridData.grid) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (!isFinite(min) || !isFinite(max) || min === max) return { thresholds: [], majors: new Set<number>(), min, max };

    const majors = new Set<number>();
    let thresholds: number[] = [];

    const MAX_MAJORS = 100;
    const MAX_MINORS = 500;
    if (state.intervalMode === 'auto') {
      const step = (max - min) / state.levelCount;
      let rounded = niceStep(step);
      if (!isFinite(rounded) || rounded <= 0) rounded = (max - min) || 1;
      let first = Math.ceil(min / rounded) * rounded;
      let count = 0;
      for (let v = first; v <= max && count < MAX_MAJORS; v += rounded, count++) {
        thresholds.push(v);
        majors.add(v);
      }
    } else {
      // manual
      const major = state.majorInterval;
      if (major > 0) {
        const minor = state.minorSubdivisions > 0 ? major / state.minorSubdivisions : 0;
        let first = Math.ceil(min / major) * major;
        let majorCount = 0;
        for (let v = first; v <= max && majorCount < MAX_MAJORS; v += major, majorCount++) {
          thresholds.push(v);
          majors.add(v);
        }
        if (minor > 0) {
          let start = Math.ceil(min / minor) * minor;
          let minorCount = 0;
          for (let v = start; v <= max && minorCount < MAX_MINORS; v += minor, minorCount++) {
            if (!majors.has(v)) thresholds.push(v);
          }
        }
      }
    }
    thresholds.sort((a, b) => a - b);
    return { thresholds, majors, min, max };
  }, [gridData, state.intervalMode, state.levelCount, state.majorInterval, state.minorSubdivisions]);

  // d3-contour 호출
  const contourShapes = useMemo(() => {
    if (!gridData || levels.thresholds.length === 0) {
      return [] as { value: number; d: string; longestRing: [number, number][] | null; isMajor: boolean }[];
    }
    try {
      const { grid, gw, gh, cellW, cellH } = gridData;
      const gen = d3contours().size([gw, gh]).thresholds(levels.thresholds);
      const list = gen(Array.from(grid));
      return list.map((c) => {
        const scaledRings: [number, number][][] = [];
        for (const polygon of c.coordinates) {
          for (const ring of polygon) {
            scaledRings.push(ring.map(([x, y]) => [x * cellW, y * cellH] as [number, number]));
          }
        }
        const d = ringsToPath(scaledRings);
        let longestRing: [number, number][] | null = null;
        let longestLen = 0;
        for (const ring of scaledRings) {
          const len = ringLength(ring);
          if (len > longestLen) {
            longestLen = len;
            longestRing = ring;
          }
        }
        return { value: c.value, d, longestRing, isMajor: levels.majors.has(c.value) };
      });
    } catch (err) {
      console.error('[등치선도] 컨투어 계산 오류:', err);
      return [];
    }
  }, [gridData, levels]);

  // 채우기 색상 (선택적)
  const fillColors = useMemo(() => {
    if (!state.fillEnabled || levels.thresholds.length === 0) return null;
    return getBasePaletteColors(state.fillPalette, levels.thresholds.length + 1);
  }, [state.fillEnabled, state.fillPalette, levels.thresholds.length]);

  if (geo.status === 'error') {
    return <div style={styles.container}><Placeholder error message={`GeoJSON을 찾을 수 없습니다 (${geo.message}).`} /></div>;
  }
  if (geo.status !== 'ready' || svgW === 0 || !pathFn) {
    return <div ref={containerRef} style={styles.container}><Placeholder message="지도 데이터를 불러오는 중…" /></div>;
  }
  if (svgH < 200) {
    return <div ref={containerRef} style={styles.container}><Placeholder error message={`지도 영역이 너무 작습니다 (${box.w}×${box.h}).\n창 크기를 키워주세요.`} /></div>;
  }

  const clipId = 'korea-clip';

  return (
    <div ref={containerRef} style={styles.container}>
      <svg
        ref={svgRef}
        id="isoline-svg"
        width={svgW}
        height={svgH}
        xmlns="http://www.w3.org/2000/svg"
        style={styles.svg}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={mapOutlinePath} />
          </clipPath>
        </defs>
        <rect x={0} y={0} width={svgW} height={svgH} fill="#ffffff" />

        <g transform={`translate(${zoom.tx}, ${zoom.ty}) scale(${zoom.s})`}>
          {/* 배경 지도 (연한 회색) */}
          {features.map((f, i) => {
            const code = String(f.properties.code ?? f.properties.name ?? i);
            const d = pathFn(f);
            if (!d) return null;
            return (
              <path
                key={code}
                d={d}
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth={state.unit === 'sido' ? 1 : MAP_UNIT_SCOPE[state.unit] === 'world' ? 0.5 : 0.4}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* 등치선 채우기 (옵션) */}
          {state.fillEnabled && fillColors && (
            <g clipPath={state.clipToBoundary ? `url(#${clipId})` : undefined}>
              {contourShapes.map((c, i) => (
                <path
                  key={`fill-${i}`}
                  d={c.d}
                  fill={fillColors[Math.min(i, fillColors.length - 1)]}
                  opacity={0.55}
                  stroke="none"
                />
              ))}
            </g>
          )}

          {/* 등치선 stroke */}
          <g clipPath={state.clipToBoundary ? `url(#${clipId})` : undefined}>
            {contourShapes.map((c, i) => (
              <path
                key={`line-${i}`}
                d={c.d}
                fill="none"
                stroke={state.lineColor}
                strokeWidth={c.isMajor ? state.majorLineWidth : state.minorLineWidth}
                strokeDasharray={c.isMajor ? undefined : '3,2'}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>

          {/* 주곡선 값 라벨 (등치선 위에 직접 배치) */}
          {state.showLabels && (
            <g clipPath={state.clipToBoundary ? `url(#${clipId})` : undefined}>
              {contourShapes.filter((c) => c.isMajor).map((c, i) => {
                if (!c.longestRing) return null;
                const pos = midpointOfRing(c.longestRing);
                if (!pos) return null;
                const label = formatNumber(c.value);
                return (
                  <text
                    key={`lbl-${i}`}
                    x={pos[0]}
                    y={pos[1]}
                    fontSize={11}
                    fill={state.lineColor}
                    stroke="#ffffff"
                    strokeWidth={3}
                    paintOrder="stroke"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ pointerEvents: 'none' }}
                  >
                    {label}
                  </text>
                );
              })}
            </g>
          )}

          {/* 입력 포인트 표시 (작은 점) */}
          {points.map((p, i) => (
            <g key={`pt-${i}`}>
              <circle cx={p.x} cy={p.y} r={2} fill={state.lineColor} stroke="#ffffff" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </g>

        <SvgLegend
          state={state}
          pos={legendPos}
          scale={legendScale}
          widthOverride={legendWidthOverride}
          onMouseDown={handleLegendMouseDown}
          fillColors={fillColors}
          thresholds={levels.thresholds}
          majors={levels.majors}
        />
      </svg>
    </div>
  );
}

// 링 배열 → SVG path 문자열
function ringsToPath(rings: [number, number][][]): string {
  const out: string[] = [];
  for (const ring of rings) {
    if (ring.length === 0) continue;
    let d = `M${ring[0][0].toFixed(2)},${ring[0][1].toFixed(2)}`;
    for (let i = 1; i < ring.length; i++) {
      d += `L${ring[i][0].toFixed(2)},${ring[i][1].toFixed(2)}`;
    }
    d += 'Z';
    out.push(d);
  }
  return out.join(' ');
}

function ringLength(ring: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < ring.length; i++) {
    total += Math.hypot(ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]);
  }
  return total;
}

// 링 둘레의 중간 지점 좌표 (등치선 위)
function midpointOfRing(ring: [number, number][]): [number, number] | null {
  if (ring.length < 2) return null;
  const totalLen = ringLength(ring);
  if (totalLen <= 0) return null;
  const target = totalLen / 2;
  let acc = 0;
  for (let i = 1; i < ring.length; i++) {
    const segLen = Math.hypot(ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]);
    if (acc + segLen >= target) {
      const t = segLen > 0 ? (target - acc) / segLen : 0;
      return [
        ring[i - 1][0] + (ring[i][0] - ring[i - 1][0]) * t,
        ring[i - 1][1] + (ring[i][1] - ring[i - 1][1]) * t,
      ];
    }
    acc += segLen;
  }
  return ring[Math.floor(ring.length / 2)];
}

// 간격 "nice" 반올림
function niceStep(raw: number): number {
  if (raw <= 0) return 1;
  const exp = Math.floor(Math.log10(raw));
  const pow = Math.pow(10, exp);
  const norm = raw / pow;
  let nice: number;
  if (norm < 1.5) nice = 1;
  else if (norm < 3) nice = 2;
  else if (norm < 7) nice = 5;
  else nice = 10;
  return nice * pow;
}

function formatNumber(v: number): string {
  if (Math.abs(v) >= 1000) return v.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(1);
}

function SvgLegend({
  state,
  pos,
  scale,
  widthOverride,
  onMouseDown,
  fillColors,
  thresholds,
  majors,
}: {
  state: IsolineState;
  pos: { x: number; y: number };
  scale: number;
  widthOverride: number | null;
  onMouseDown: (e: React.MouseEvent) => void;
  fillColors: string[] | null;
  thresholds: number[];
  majors: Set<number>;
}) {
  const hasContent = state.legendTitle || state.legendUnit || state.legendSource;
  if (!hasContent) return null;

  const padding = 10;
  const rowH = 18;
  const titleH = state.legendTitle ? 22 : 0;
  const sourceH = state.legendSource ? 18 : 0;

  // 범례 항목 결정
  const majorLevels = thresholds.filter((t) => majors.has(t));
  const showFill = state.fillEnabled && fillColors && thresholds.length > 0;
  const rows = showFill
    ? majorLevels.map((v) => ({ kind: 'fill' as const, value: v }))
    : majorLevels.map((v) => ({ kind: 'line' as const, value: v, major: true }));

  const titleText = state.legendTitle + (state.legendUnit ? ` (${state.legendUnit})` : '');

  const autoW = (() => {
    let m = 0;
    if (titleText) m = Math.max(m, estimateTextWidth(titleText, 13, 700));
    for (const r of rows) {
      m = Math.max(m, 22 + 8 + estimateTextWidth(formatNumber(r.value), 12, 400));
    }
    if (state.legendSource) m = Math.max(m, estimateTextWidth(`출처: ${state.legendSource}`, 11, 400));
    return Math.ceil(m + padding * 2);
  })();

  const w = widthOverride ?? autoW;
  const h = padding * 2 + titleH + rows.length * rowH + sourceH;

  return (
    <g transform={`translate(${pos.x}, ${pos.y}) scale(${scale})`} onMouseDown={onMouseDown} style={{ cursor: 'move' }}>
      <rect x={0} y={0} width={w} height={h} fill="#ffffff" stroke="#d4d4d4" strokeWidth={1} rx={4} />
      {state.legendTitle && (
        <text x={padding} y={padding + 14} fontSize={13} fontWeight={700} fill="#111">
          {titleText}
        </text>
      )}
      {rows.map((r, i) => {
        const y = padding + titleH + i * rowH;
        if (r.kind === 'fill' && fillColors) {
          return (
            <g key={i}>
              <rect x={padding} y={y + 2} width={22} height={13} fill={fillColors[Math.min(i, fillColors.length - 1)]} stroke="#d4d4d4" strokeWidth={0.5} />
              <text x={padding + 30} y={y + 13} fontSize={12} fill="#111">{formatNumber(r.value)}</text>
            </g>
          );
        }
        return (
          <g key={i}>
            <line x1={padding} y1={y + 8} x2={padding + 22} y2={y + 8} stroke={state.lineColor} strokeWidth={state.majorLineWidth} />
            <text x={padding + 30} y={y + 13} fontSize={12} fill="#111">{formatNumber(r.value)}</text>
          </g>
        );
      })}
      {state.legendSource && (
        <text x={padding} y={padding + titleH + rows.length * rowH + 13} fontSize={11} fill="#737373">
          출처: {state.legendSource}
        </text>
      )}
    </g>
  );
}

function estimateTextWidth(text: string, fontSize: number, fontWeight: number = 400): number {
  const boldFactor = fontWeight >= 600 ? 1.05 : 1.0;
  let w = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    const isCJK =
      (code >= 0x1100 && code <= 0x11ff) ||
      (code >= 0x3130 && code <= 0x318f) ||
      (code >= 0xac00 && code <= 0xd7af) ||
      (code >= 0x4e00 && code <= 0x9fff);
    w += (isCJK ? 1.0 : 0.55) * fontSize * boldFactor;
  }
  return w;
}

function Placeholder({ message, error }: { message: string; error?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#fafafa', color: error ? '#b91c1c' : '#737373',
      fontSize: 13, textAlign: 'center', whiteSpace: 'pre-line',
      padding: 24, boxSizing: 'border-box', width: '100%', height: '100%',
    }}>
      {message}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1, minWidth: 0, minHeight: 0, position: 'relative' as const,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#fff', overflow: 'hidden',
  },
  svg: {
    display: 'block', background: '#fff', userSelect: 'none' as const,
  },
};
