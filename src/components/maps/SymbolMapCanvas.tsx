// © 2026 김용현
// 도형표현도 SVG 렌더링 — 지도 배경 + 중심점 위 파이/막대 심볼
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { geoPath } from 'd3-geo';
import type { Feature } from 'geojson';
import type { SymbolMapState, RegionProps, ItemDef } from './types';
import { MAP_UNIT_ASPECT, MAP_UNIT_SCOPE } from './types';
import { createProjection } from './projection';
import { useGeoData } from './useGeoData';
import PatternDefs from './PatternDefs';

interface Props {
  state: SymbolMapState;
  legendPos: { x: number; y: number };
  onLegendPosChange: (p: { x: number; y: number }) => void;
  legendScale: number;
  legendWidthOverride: number | null;
  onSymbolDragEnd: (code: string, dx: number, dy: number) => void;
}

const PATTERN_ID_PREFIX = 'sym';

export default function SymbolMapCanvas({
  state,
  legendPos,
  onLegendPosChange,
  legendScale,
  legendWidthOverride,
  onSymbolDragEnd,
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

  const { pathFn, features, centroids } = useMemo(() => {
    if (geo.status !== 'ready' || svgW === 0) {
      return { pathFn: null, features: [] as Feature<GeoJSON.Geometry, RegionProps>[], centroids: new Map<string, [number, number]>() };
    }
    const projection = createProjection(state.unit, svgW, svgH, geo.data);
    const path = geoPath(projection);
    const c = new Map<string, [number, number]>();
    for (const f of geo.data.features) {
      const code = String(f.properties.code ?? f.properties.name ?? '');
      if (!code) continue;
      const [cx, cy] = path.centroid(f);
      if (isFinite(cx) && isFinite(cy)) c.set(code, [cx, cy]);
    }
    return { pathFn: path, features: geo.data.features, centroids: c };
  }, [geo, svgW, svgH, state.unit]);

  const isWorld = MAP_UNIT_SCOPE[state.unit] === 'world';
  const strokeColor = state.unit === 'sido' ? '#334155' : '#64748b';
  const strokeWidth = state.unit === 'sido' ? 1.2 : isWorld ? 0.4 : 0.5;

  // 휠 줌 (choropleth와 동일)
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

  // 심볼 드래그
  const symbolDragRef = useRef<{ code: string; sx: number; sy: number; origDx: number; origDy: number } | null>(null);
  const [dragPreview, setDragPreview] = useState<Record<string, { dx: number; dy: number }>>({});
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!symbolDragRef.current) return;
      const { code, sx, sy, origDx, origDy } = symbolDragRef.current;
      const dx = origDx + (e.clientX - sx) / zoom.s;
      const dy = origDy + (e.clientY - sy) / zoom.s;
      setDragPreview((p) => ({ ...p, [code]: { dx, dy } }));
    };
    const onUp = () => {
      if (symbolDragRef.current) {
        const { code } = symbolDragRef.current;
        const preview = dragPreview[code];
        if (preview) onSymbolDragEnd(code, preview.dx, preview.dy);
        setDragPreview((p) => {
          const next = { ...p };
          delete next[code];
          return next;
        });
      }
      symbolDragRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragPreview, onSymbolDragEnd, zoom.s]);

  const handleSymbolMouseDown = useCallback(
    (code: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      const cur = state.positionOverrides[code] ?? { dx: 0, dy: 0 };
      symbolDragRef.current = {
        code,
        sx: e.clientX,
        sy: e.clientY,
        origDx: cur.dx,
        origDy: cur.dy,
      };
    },
    [state.positionOverrides],
  );

  // 심볼에 쓸 패턴 정의 (항목마다 1개)
  const patternBins = useMemo(() => {
    const showPattern = state.fillMode === 'pattern' || state.fillMode === 'color_pattern';
    return state.items.map((it) => ({
      bgColor: state.fillMode === 'pattern' ? '#ffffff' : it.color,
      fgColor: state.fillMode === 'pattern' ? '#111' : 'rgba(0,0,0,0.55)',
      pattern: it.pattern,
      showPattern,
    }));
  }, [state.items, state.fillMode]);

  // 비례 모드용 max total
  const maxTotal = useMemo(() => {
    let m = 0;
    for (const vals of Object.values(state.data)) {
      const t = vals.reduce((a, b) => a + (b || 0), 0);
      if (t > m) m = t;
    }
    return m;
  }, [state.data]);

  const maxValue = useMemo(() => {
    let m = 0;
    for (const vals of Object.values(state.data)) {
      for (const v of vals) if (v > m) m = v;
    }
    return m;
  }, [state.data]);

  if (geo.status === 'error') {
    return <Placeholder error message={`GeoJSON을 찾을 수 없습니다 (${geo.message}).`} />;
  }
  if (geo.status !== 'ready' || svgW === 0 || !pathFn) {
    return (
      <div ref={containerRef} style={styles.container}>
        <Placeholder message="지도 데이터를 불러오는 중…" />
      </div>
    );
  }
  if (svgH < 200) {
    return (
      <div ref={containerRef} style={styles.container}>
        <Placeholder error message={`지도 영역이 너무 작습니다 (${box.w}×${box.h}).\n창 크기를 키워주세요.`} />
      </div>
    );
  }

  return (
    <div ref={containerRef} style={styles.container}>
      <svg
        ref={svgRef}
        id="symbolmap-svg"
        width={svgW}
        height={svgH}
        xmlns="http://www.w3.org/2000/svg"
        style={styles.svg}
      >
        <PatternDefs idPrefix={PATTERN_ID_PREFIX} bins={patternBins} />
        <rect x={0} y={0} width={svgW} height={svgH} fill="#ffffff" />
        <g transform={`translate(${zoom.tx}, ${zoom.ty}) scale(${zoom.s})`}>
          {/* 배경 지도 */}
          {features.map((f, i) => {
            const code = String(f.properties.code ?? f.properties.name ?? i);
            const d = pathFn(f);
            if (!d) return null;
            return (
              <path
                key={code}
                d={d}
                fill="#ffffff"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
              >
                <title>{f.properties.name ?? code}</title>
              </path>
            );
          })}
          {/* 심볼 */}
          {features.map((f, i) => {
            const code = String(f.properties.code ?? f.properties.name ?? i);
            const centroid = centroids.get(code);
            if (!centroid) return null;
            const data = state.data[code];
            if (!data || data.every((v) => !v)) return null;
            const total = data.reduce((a, b) => a + (b || 0), 0);
            if (total <= 0) return null;

            const override = state.positionOverrides[code] ?? { dx: 0, dy: 0 };
            const preview = dragPreview[code];
            const dx = preview?.dx ?? override.dx;
            const dy = preview?.dy ?? override.dy;
            const [cx, cy] = centroid;

            return (
              <g
                key={`sym-${code}`}
                transform={`translate(${cx + dx}, ${cy + dy})`}
                onMouseDown={handleSymbolMouseDown(code)}
                style={{ cursor: 'grab' }}
              >
                {state.symbolKind === 'pie'
                  ? renderPie(data, state.items, state.sizeMode, state.baseRadius, state.minRadius, state.maxRadius, maxTotal, state.showValueLabels, total, PATTERN_ID_PREFIX)
                  : renderBar(data, state.items, state.barMaxHeight, state.barWidth, state.barGap, maxValue, state.showValueLabels, PATTERN_ID_PREFIX)
                }
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
        />
      </svg>
    </div>
  );
}

function renderPie(
  data: number[],
  items: ItemDef[],
  sizeMode: 'uniform' | 'proportional',
  baseR: number,
  minR: number,
  maxR: number,
  maxTotal: number,
  showLabels: boolean,
  total: number,
  patternPrefix: string,
) {
  const r = sizeMode === 'uniform'
    ? baseR
    : maxTotal > 0 ? minR + (maxR - minR) * Math.sqrt(total / maxTotal) : baseR;

  const paths: React.ReactNode[] = [];
  // 1) 세그먼트 fill (흰색 경계로 조각 구분)
  let acc = 0;
  for (let i = 0; i < data.length && i < items.length; i++) {
    const v = data[i] || 0;
    if (v <= 0) continue;
    const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const end = ((acc + v) / total) * Math.PI * 2 - Math.PI / 2;
    acc += v;
    const d = arcPath(r, start, end);
    paths.push(
      <path
        key={`seg-${i}`}
        d={d}
        fill={`url(#${patternPrefix}-bin-${i})`}
        stroke="#ffffff"
        strokeWidth={0.8}
        vectorEffect="non-scaling-stroke"
      />
    );
  }
  // 2) 외곽선 (전체 원 테두리, 어두운 색)
  paths.push(
    <circle
      key="outer"
      cx={0}
      cy={0}
      r={r}
      fill="none"
      stroke="#1e293b"
      strokeWidth={1.2}
      vectorEffect="non-scaling-stroke"
      style={{ pointerEvents: 'none' }}
    />
  );
  // 3) 값 라벨 (옵션)
  if (showLabels) {
    acc = 0;
    for (let i = 0; i < data.length && i < items.length; i++) {
      const v = data[i] || 0;
      if (v <= 0) continue;
      const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
      const end = ((acc + v) / total) * Math.PI * 2 - Math.PI / 2;
      acc += v;
      const mid = (start + end) / 2;
      const lx = Math.cos(mid) * r * 0.6;
      const ly = Math.sin(mid) * r * 0.6;
      const pct = Math.round((v / total) * 100);
      paths.push(
        <text
          key={`lbl-${i}`}
          x={lx}
          y={ly}
          fontSize={Math.max(8, r / 3)}
          fill="#ffffff"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ pointerEvents: 'none', fontWeight: 700 }}
        >
          {pct}%
        </text>
      );
    }
  }
  return <>{paths}</>;
}

function arcPath(r: number, start: number, end: number): string {
  const sx = Math.cos(start) * r;
  const sy = Math.sin(start) * r;
  const ex = Math.cos(end) * r;
  const ey = Math.sin(end) * r;
  const large = end - start > Math.PI ? 1 : 0;
  return `M0,0 L${sx.toFixed(3)},${sy.toFixed(3)} A${r},${r} 0 ${large} 1 ${ex.toFixed(3)},${ey.toFixed(3)} Z`;
}

function renderBar(
  data: number[],
  items: ItemDef[],
  maxH: number,
  barW: number,
  gap: number,
  maxValue: number,
  showLabels: boolean,
  patternPrefix: string,
) {
  const n = Math.min(data.length, items.length);
  const totalW = n * barW + (n - 1) * gap;
  const startX = -totalW / 2;
  const paths: React.ReactNode[] = [];

  // 기준선
  paths.push(
    <line
      key="base"
      x1={startX - 2}
      y1={0}
      x2={startX + totalW + 2}
      y2={0}
      stroke="#333"
      strokeWidth={0.8}
      vectorEffect="non-scaling-stroke"
    />
  );

  for (let i = 0; i < n; i++) {
    const v = data[i] || 0;
    const h = maxValue > 0 ? (v / maxValue) * maxH : 0;
    const x = startX + i * (barW + gap);
    paths.push(
      <rect
        key={i}
        x={x}
        y={-h}
        width={barW}
        height={h}
        fill={`url(#${patternPrefix}-bin-${i})`}
        stroke="#ffffff"
        strokeWidth={0.5}
        vectorEffect="non-scaling-stroke"
      />
    );
    if (showLabels && h > 0) {
      paths.push(
        <text
          key={`l-${i}`}
          x={x + barW / 2}
          y={-h - 2}
          fontSize={9}
          fill="#111"
          textAnchor="middle"
          style={{ pointerEvents: 'none' }}
        >
          {v}
        </text>
      );
    }
  }
  return <>{paths}</>;
}

function SvgLegend({
  state,
  pos,
  scale,
  widthOverride,
  onMouseDown,
}: {
  state: SymbolMapState;
  pos: { x: number; y: number };
  scale: number;
  widthOverride: number | null;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  const hasContent = state.legendTitle || state.legendUnit || state.legendSource;
  if (!hasContent) return null;

  const padding = 10;
  const rowH = 18;
  const titleH = state.legendTitle ? 22 : 0;
  const sourceH = state.legendSource ? 18 : 0;
  const rows = state.items.length;

  const titleText = state.legendTitle +
    (state.legendUnit ? ` (${state.legendUnit})` : '');

  const autoW = (() => {
    let m = 0;
    if (titleText) m = Math.max(m, estimateTextWidth(titleText, 13, 700));
    for (const it of state.items) {
      m = Math.max(m, 22 + 8 + estimateTextWidth(it.name, 12, 400));
    }
    if (state.legendSource) m = Math.max(m, estimateTextWidth(`출처: ${state.legendSource}`, 11, 400));
    return Math.ceil(m + padding * 2);
  })();

  const w = widthOverride ?? autoW;
  const h = padding * 2 + titleH + rows * rowH + sourceH;

  return (
    <g
      transform={`translate(${pos.x}, ${pos.y}) scale(${scale})`}
      onMouseDown={onMouseDown}
      style={{ cursor: 'move' }}
    >
      <rect x={0} y={0} width={w} height={h} fill="#ffffff" stroke="#d4d4d4" strokeWidth={1} rx={4} />
      {state.legendTitle && (
        <text x={padding} y={padding + 14} fontSize={13} fontWeight={700} fill="#111">
          {titleText}
        </text>
      )}
      {state.items.map((it, i) => {
        const y = padding + titleH + i * rowH;
        return (
          <g key={i}>
            <rect
              x={padding}
              y={y + 2}
              width={22}
              height={13}
              fill={`url(#sym-bin-${i})`}
              stroke="#d4d4d4"
              strokeWidth={0.5}
            />
            <text x={padding + 30} y={y + 13} fontSize={12} fill="#111">
              {it.name}
            </text>
          </g>
        );
      })}
      {state.legendSource && (
        <text
          x={padding}
          y={padding + titleH + rows * rowH + 13}
          fontSize={11}
          fill="#737373"
        >
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
        color: error ? '#b91c1c' : '#737373',
        fontSize: 13,
        textAlign: 'center',
        whiteSpace: 'pre-line',
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      {message}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    overflow: 'hidden',
  },
  svg: {
    display: 'block',
    background: '#fff',
    userSelect: 'none' as const,
  },
};
