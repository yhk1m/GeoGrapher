// © 2026 김용현
// 유선도 SVG 렌더링 — centroid 간 화살표
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import type { Feature } from 'geojson';
import type { FlowMapState, RegionProps } from './types';
import { useGeoData } from './useGeoData';

interface Props {
  state: FlowMapState;
  legendPos: { x: number; y: number };
  onLegendPosChange: (p: { x: number; y: number }) => void;
  legendScale: number;
  legendWidthOverride: number | null;
  clickMode: 'idle' | 'pickFrom' | 'pickTo';
  pendingFrom: string | null;
  onRegionClick: (code: string) => void;
}

const ASPECT_W = 9;
const ASPECT_H = 11;

export default function FlowMapCanvas({
  state,
  legendPos,
  onLegendPosChange,
  legendScale,
  legendWidthOverride,
  clickMode,
  pendingFrom,
  onRegionClick,
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
    const byW = { w: box.w, h: (box.w * ASPECT_H) / ASPECT_W };
    const byH = { w: (box.h * ASPECT_W) / ASPECT_H, h: box.h };
    const fit = byW.h <= box.h ? byW : byH;
    return { svgW: Math.floor(fit.w), svgH: Math.floor(fit.h) };
  }, [box]);

  const { pathFn, features, centroids } = useMemo(() => {
    if (geo.status !== 'ready' || svgW === 0) {
      return { pathFn: null, features: [] as Feature<GeoJSON.Geometry, RegionProps>[], centroids: new Map<string, [number, number]>() };
    }
    const projection = geoMercator().fitSize([svgW, svgH], geo.data);
    const path = geoPath(projection);
    const c = new Map<string, [number, number]>();
    for (const f of geo.data.features) {
      const code = String(f.properties.code ?? '');
      if (!code) continue;
      const [cx, cy] = path.centroid(f);
      if (isFinite(cx) && isFinite(cy)) c.set(code, [cx, cy]);
    }
    return { pathFn: path, features: geo.data.features, centroids: c };
  }, [geo, svgW, svgH]);

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

  const maxValue = useMemo(() => {
    let m = 0;
    for (const f of state.flows) if (f.value > m) m = f.value;
    return m;
  }, [state.flows]);

  const handleRegionClickInternal = useCallback(
    (code: string) => {
      if (clickMode !== 'idle') onRegionClick(code);
    },
    [clickMode, onRegionClick],
  );

  if (geo.status === 'error') {
    return <div style={styles.container}><Placeholder error message={`GeoJSON을 찾을 수 없습니다 (${geo.message}).`} /></div>;
  }
  if (geo.status !== 'ready' || svgW === 0 || !pathFn) {
    return <div ref={containerRef} style={styles.container}><Placeholder message="지도 데이터를 불러오는 중…" /></div>;
  }
  if (svgH < 200) {
    return <div ref={containerRef} style={styles.container}><Placeholder error message={`지도 영역이 너무 작습니다 (${box.w}×${box.h}).\n창 크기를 키워주세요.`} /></div>;
  }

  const strokeColor = state.unit === 'sido' ? '#334155' : '#64748b';
  const strokeWidth = state.unit === 'sido' ? 1.2 : 0.5;

  return (
    <div ref={containerRef} style={styles.container}>
      <svg
        ref={svgRef}
        id="flowmap-svg"
        width={svgW}
        height={svgH}
        xmlns="http://www.w3.org/2000/svg"
        style={{ ...styles.svg, cursor: clickMode !== 'idle' ? 'crosshair' : 'default' }}
      >
        <defs>
          {/* 각 flow 색상별로 마커를 동적 생성하기 어려우니, 기본 색상으로 공통 마커 정의 */}
          <ArrowMarker id="arrow-triangle" color={state.defaultColor} style="triangle" />
          <ArrowMarker id="arrow-open" color={state.defaultColor} style="open" />
        </defs>
        <rect x={0} y={0} width={svgW} height={svgH} fill="#ffffff" />
        <g transform={`translate(${zoom.tx}, ${zoom.ty}) scale(${zoom.s})`}>
          {/* 배경 지도 */}
          {features.map((f, i) => {
            const code = String(f.properties.code ?? f.properties.name ?? i);
            const d = pathFn(f);
            if (!d) return null;
            const isPending = code === pendingFrom;
            return (
              <path
                key={code}
                d={d}
                fill={isPending ? '#fecaca' : '#ffffff'}
                stroke={isPending ? '#dc2626' : strokeColor}
                strokeWidth={isPending ? 2 : strokeWidth}
                vectorEffect="non-scaling-stroke"
                style={{ cursor: clickMode !== 'idle' ? 'crosshair' : 'default' }}
                onClick={() => handleRegionClickInternal(code)}
              >
                <title>{f.properties.name ?? code}</title>
              </path>
            );
          })}
          {/* 유선 */}
          {state.flows.map((flow) => {
            const fromPt = centroids.get(flow.from);
            const toPt = centroids.get(flow.to);
            if (!fromPt || !toPt) return null;
            const color = flow.color ?? state.defaultColor;
            const width = flowWidth(flow.value, maxValue, state.minWidth, state.maxWidth);
            const d = buildFlowPath(fromPt, toPt, state.curveType, state.bezierCurvature, state.arrowStyle, width);
            const markerId = state.arrowStyle === 'none' ? undefined : `arrow-${state.arrowStyle}`;
            return (
              <g key={flow.id} opacity={state.opacity}>
                <path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={width}
                  strokeLinecap={state.arrowStyle === 'triangle' ? 'butt' : 'round'}
                  markerEnd={markerId ? `url(#${markerId})` : undefined}
                  vectorEffect="non-scaling-stroke"
                />
                {state.showValues && (
                  <FlowLabel fromPt={fromPt} toPt={toPt} curve={state.curveType} curvature={state.bezierCurvature} value={flow.value} label={flow.label} />
                )}
              </g>
            );
          })}
        </g>
        <SvgLegend
          state={state}
          pos={legendPos}
          scale={legendScale}
          widthOverride={legendWidthOverride}
          onMouseDown={handleLegendMouseDown}
          maxValue={maxValue}
        />
      </svg>
    </div>
  );
}

function ArrowMarker({ id, color, style }: { id: string; color: string; style: 'triangle' | 'open' }) {
  if (style === 'triangle') {
    // refX=0: 삼각형 base가 path 끝에 위치, 촉은 앞쪽으로 markerWidth×strokeWidth만큼 돌출
    return (
      <marker id={id} viewBox="0 0 10 10" refX={0} refY={5} markerWidth={3} markerHeight={3} orient="auto-start-reverse" markerUnits="strokeWidth">
        <path d="M0,0 L10,5 L0,10 Z" fill={color} />
      </marker>
    );
  }
  return (
    <marker id={id} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={3.5} markerHeight={3.5} orient="auto-start-reverse" markerUnits="strokeWidth">
      <path d="M0,0 L10,5 L0,10" fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="miter" />
    </marker>
  );
}

function flowWidth(value: number, maxValue: number, minW: number, maxW: number): number {
  if (maxValue <= 0) return minW;
  // 제곱근 스케일 — 값 차이 큰 경우에도 작은 값 시각적으로 보임
  const t = Math.sqrt(value / maxValue);
  return minW + (maxW - minW) * t;
}

// 화살표 스타일별 path 끝단을 줄이는 거리 (user 좌표계)
// triangle: marker 전체 길이(= markerWidth × strokeWidth = 3 × strokeWidth) 만큼 선을 앞당김
// → 선은 삼각형 base에서 끝나고 촉은 원래 도착점까지 뾰족하게 도달
function arrowShortening(style: 'triangle' | 'open' | 'none', strokeWidth: number): number {
  if (style === 'triangle') return strokeWidth * 3;
  return 0;
}

function buildFlowPath(
  from: [number, number],
  to: [number, number],
  curve: 'straight' | 'bezier',
  curvature: number,
  arrowStyle: 'triangle' | 'open' | 'none',
  width: number,
): string {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return `M${x1},${y1}L${x2},${y2}`;

  const shorten = arrowShortening(arrowStyle, width);

  if (curve === 'straight') {
    const ratio = shorten > 0 && dist > shorten ? (dist - shorten) / dist : 1;
    const ex = x1 + dx * ratio;
    const ey = y1 + dy * ratio;
    return `M${x1.toFixed(1)},${y1.toFixed(1)} L${ex.toFixed(1)},${ey.toFixed(1)}`;
  }

  // 베지어: 중점에서 법선 방향으로 offset
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const nx = -dy / dist;
  const ny = dx / dist;
  const off = dist * curvature * 0.5;
  const cx = mx + nx * off;
  const cy = my + ny * off;

  // 종단 접선 방향(제어점→끝)으로 shorten 만큼 당겨서 end 좌표 계산
  let ex = x2;
  let ey = y2;
  if (shorten > 0) {
    const tdx = x2 - cx;
    const tdy = y2 - cy;
    const tdist = Math.hypot(tdx, tdy);
    if (tdist > shorten) {
      ex = x2 - (tdx / tdist) * shorten;
      ey = y2 - (tdy / tdist) * shorten;
    }
  }
  return `M${x1.toFixed(1)},${y1.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
}

function FlowLabel({
  fromPt,
  toPt,
  curve,
  curvature,
  value,
  label,
}: {
  fromPt: [number, number];
  toPt: [number, number];
  curve: 'straight' | 'bezier';
  curvature: number;
  value: number;
  label?: string;
}) {
  const [x1, y1] = fromPt;
  const [x2, y2] = toPt;
  let lx: number, ly: number;
  if (curve === 'straight') {
    lx = (x1 + x2) / 2;
    ly = (y1 + y2) / 2;
  } else {
    // 베지어 t=0.5 지점
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const nx = -dy / dist;
    const ny = dx / dist;
    const off = dist * curvature * 0.5;
    const cx = mx + nx * off;
    const cy = my + ny * off;
    // 2차 베지어 t=0.5: 0.25*P0 + 0.5*C + 0.25*P2
    lx = 0.25 * x1 + 0.5 * cx + 0.25 * x2;
    ly = 0.25 * y1 + 0.5 * cy + 0.25 * y2;
  }
  const text = label ? `${label} (${formatNumber(value)})` : formatNumber(value);
  return (
    <g transform={`translate(${lx.toFixed(1)}, ${ly.toFixed(1)})`} style={{ pointerEvents: 'none' }}>
      <rect x={-text.length * 3.2} y={-7} width={text.length * 6.4} height={14} fill="#ffffff" opacity={0.9} />
      <text fontSize={10} textAnchor="middle" dominantBaseline="middle" fill="#111">{text}</text>
    </g>
  );
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
  maxValue,
}: {
  state: FlowMapState;
  pos: { x: number; y: number };
  scale: number;
  widthOverride: number | null;
  onMouseDown: (e: React.MouseEvent) => void;
  maxValue: number;
}) {
  const hasContent = state.legendTitle || state.legendUnit || state.legendSource;
  if (!hasContent) return null;

  const padding = 10;
  const titleH = state.legendTitle ? 22 : 0;
  const sourceH = state.legendSource ? 18 : 0;
  const sampleCount = 3;
  const rowH = 22;

  const samples: number[] = [];
  if (maxValue > 0) {
    for (let i = sampleCount; i >= 1; i--) {
      samples.push(maxValue * (i / sampleCount));
    }
  }

  const titleText = state.legendTitle + (state.legendUnit ? ` (${state.legendUnit})` : '');

  const autoW = (() => {
    let m = 0;
    if (titleText) m = Math.max(m, estimateTextWidth(titleText, 13, 700));
    for (const s of samples) {
      m = Math.max(m, 40 + 8 + estimateTextWidth(formatNumber(s), 12, 400));
    }
    if (state.legendSource) m = Math.max(m, estimateTextWidth(`출처: ${state.legendSource}`, 11, 400));
    return Math.ceil(m + padding * 2);
  })();

  const w = widthOverride ?? autoW;
  const h = padding * 2 + titleH + samples.length * rowH + sourceH;

  return (
    <g transform={`translate(${pos.x}, ${pos.y}) scale(${scale})`} onMouseDown={onMouseDown} style={{ cursor: 'move' }}>
      <rect x={0} y={0} width={w} height={h} fill="#ffffff" stroke="#d4d4d4" strokeWidth={1} rx={4} />
      {state.legendTitle && (
        <text x={padding} y={padding + 14} fontSize={13} fontWeight={700} fill="#111">{titleText}</text>
      )}
      {samples.map((s, i) => {
        const y = padding + titleH + i * rowH;
        const lineW = flowWidth(s, maxValue, state.minWidth, state.maxWidth);
        return (
          <g key={i}>
            <line x1={padding} y1={y + rowH / 2} x2={padding + 40} y2={y + rowH / 2} stroke={state.defaultColor} strokeWidth={lineW} strokeLinecap="round" opacity={state.opacity} />
            <text x={padding + 48} y={y + rowH / 2 + 4} fontSize={12} fill="#111">{formatNumber(s)}</text>
          </g>
        );
      })}
      {state.legendSource && (
        <text x={padding} y={padding + titleH + samples.length * rowH + 13} fontSize={11} fill="#737373">출처: {state.legendSource}</text>
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
  svg: { display: 'block', background: '#fff', userSelect: 'none' as const },
};
