// © 2026 김용현
// SVG 지도 렌더링 — 단계구분도 + 패턴 + SVG 내부 범례
import { useEffect, useMemo, useRef, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import type { Feature } from 'geojson';
import type { ChoroplethState, RegionProps, PatternKind } from './types';
import { useGeoData } from './useGeoData';
import PatternDefs from './PatternDefs';

interface MapCanvasProps {
  state: ChoroplethState;
  colors: string[];
  onRegionLeftClick: (code: string) => void;
  onRegionRightClick: (code: string) => void;
  legendPos: { x: number; y: number };
  onLegendPosChange: (p: { x: number; y: number }) => void;
  legendScale: number;
  legendWidthOverride: number | null;
}

const ASPECT_W = 9;
const ASPECT_H = 11;
const PATTERN_ID_PREFIX = 'chor';

export default function MapCanvas({
  state,
  colors,
  onRegionLeftClick,
  onRegionRightClick,
  legendPos,
  onLegendPosChange,
  legendScale,
  legendWidthOverride,
}: MapCanvasProps) {
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

  const pathFn = useMemo(() => {
    if (geo.status !== 'ready' || svgW === 0) return null;
    const projection = geoMercator().fitSize([svgW, svgH], geo.data);
    return geoPath(projection);
  }, [geo, svgW, svgH]);

  const features: Feature<GeoJSON.Geometry, RegionProps>[] =
    geo.status === 'ready' ? geo.data.features : [];

  const strokeColor = state.unit === 'sido' ? '#334155' : '#64748b';
  const strokeWidth = state.unit === 'sido' ? 1.5 : 0.6;

  const fillMode = state.fillMode ?? 'color';
  const patternBins = useMemo(() => {
    const patterns = state.binPatterns ?? [];
    // 그레이스케일 모드는 패턴 없이 색상만
    const showPattern = fillMode === 'pattern' || fillMode === 'color_pattern';
    return colors.map((bg, i) => {
      const pat = patterns[i] ?? 'diagonal';
      return {
        bgColor: bg,
        fgColor: computePatternFgColor(fillMode, bg, pat),
        pattern: pat,
        showPattern,
      };
    });
  }, [colors, fillMode, state.binPatterns]);

  // 범례 드래그
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      onLegendPosChange({
        x: dragRef.current.ox + (e.clientX - dragRef.current.sx),
        y: dragRef.current.oy + (e.clientY - dragRef.current.sy),
      });
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [onLegendPosChange]);

  const handleLegendMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: legendPos.x, oy: legendPos.y };
  };

  // 행정구역 단위가 바뀌면 줌 초기화
  useEffect(() => {
    setZoom({ s: 1, tx: 0, ty: 0 });
  }, [state.unit]);

  // 휠 줌 — 커서 위치 기준 확대/축소
  // React onWheel은 passive라 preventDefault가 안 되므로 native 리스너로 등록
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const MIN = 1;
    const MAX = 12;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      setZoom((z) => {
        const newS = Math.max(MIN, Math.min(MAX, z.s * factor));
        const applied = newS / z.s;
        // 커서 아래 좌표를 고정점으로 유지
        const tx = mx - (mx - z.tx) * applied;
        const ty = my - (my - z.ty) * applied;
        return newS === 1 ? { s: 1, tx: 0, ty: 0 } : { s: newS, tx, ty };
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [svgW, svgH]);

  return (
    <div ref={containerRef} style={styles.container}>
      {geo.status === 'error' ? (
        <Placeholder
          error
          message={`GeoJSON을 찾을 수 없습니다 (${geo.message}).`}
        />
      ) : geo.status !== 'ready' || svgW === 0 || !pathFn ? (
        <Placeholder message="지도 데이터를 불러오는 중…" />
      ) : svgH < 200 ? (
        <Placeholder
          error
          message={`지도 영역이 너무 작습니다 (${box.w}×${box.h}).\n창 크기를 키워주세요.`}
        />
      ) : (
        <svg
          ref={svgRef}
          id="choropleth-svg"
          width={svgW}
          height={svgH}
          xmlns="http://www.w3.org/2000/svg"
          style={styles.svg}
          onContextMenu={(e) => e.preventDefault()}
        >
          <PatternDefs idPrefix={PATTERN_ID_PREFIX} bins={patternBins} />
          <rect x={0} y={0} width={svgW} height={svgH} fill="#ffffff" />
          <g transform={`translate(${zoom.tx}, ${zoom.ty}) scale(${zoom.s})`}>
            {features.map((f, i) => {
              const code = String(f.properties.code ?? f.properties.name ?? i);
              const binIdx = state.regionBin[code];
              const fill = binIdx != null && binIdx < colors.length
                ? `url(#${PATTERN_ID_PREFIX}-bin-${binIdx})`
                : '#ffffff';
              const d = pathFn(f);
              if (!d) return null;
              return (
                <path
                  key={code}
                  d={d}
                  fill={fill}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  vectorEffect="non-scaling-stroke"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRegionLeftClick(code);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRegionRightClick(code);
                  }}
                >
                  <title>
                    {(f.properties.name ?? code) +
                      (binIdx != null ? ` · 등급 ${binIdx + 1}` : '')}
                  </title>
                </path>
              );
            })}
          </g>
          <SvgLegend
            state={state}
            colors={colors}
            pos={legendPos}
            scale={legendScale}
            widthOverride={legendWidthOverride}
            onMouseDown={handleLegendMouseDown}
          />
        </svg>
      )}
    </div>
  );
}

// SVG 내부에서 렌더링되는 범례 (PNG 내보내기 시 함께 캡처됨)
function SvgLegend({
  state,
  colors,
  pos,
  scale,
  widthOverride,
  onMouseDown,
}: {
  state: ChoroplethState;
  colors: string[];
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
  const contentRows = colors.length;
  const swatchW = 22;
  const swatchGap = 8;

  const titleText = state.legendTitle +
    (state.legendUnit ? ` (${state.legendUnit})` : '');

  // 콘텐츠 기반 자동 폭 계산
  const autoW = (() => {
    let maxText = 0;
    if (titleText) maxText = Math.max(maxText, estimateTextWidth(titleText, 13, 700));
    for (let i = 0; i < contentRows; i++) {
      const label = state.binLabels?.[i] || `등급 ${i + 1}`;
      maxText = Math.max(maxText, swatchW + swatchGap + estimateTextWidth(label, 12, 400));
    }
    if (state.legendSource) {
      maxText = Math.max(maxText, estimateTextWidth(`출처: ${state.legendSource}`, 11, 400));
    }
    return Math.ceil(maxText + padding * 2);
  })();

  const w = widthOverride ?? autoW;
  const h = padding * 2 + titleH + contentRows * rowH + sourceH;

  return (
    <g
      transform={`translate(${pos.x}, ${pos.y}) scale(${scale})`}
      onMouseDown={onMouseDown}
      style={{ cursor: 'move' }}
    >
      <rect
        x={0}
        y={0}
        width={w}
        height={h}
        fill="#ffffff"
        stroke="#d4d4d4"
        strokeWidth={1}
        rx={4}
      />
      {state.legendTitle && (
        <text x={padding} y={padding + 14} fontSize={13} fontWeight={700} fill="#111">
          {titleText}
        </text>
      )}
      {colors.map((_, i) => {
        const y = padding + titleH + i * rowH;
        const label = state.binLabels?.[i] || `등급 ${i + 1}`;
        return (
          <g key={i}>
            <rect
              x={padding}
              y={y + 2}
              width={22}
              height={13}
              fill={`url(#chor-bin-${i})`}
              stroke="#d4d4d4"
              strokeWidth={0.5}
            />
            <text x={padding + 30} y={y + 13} fontSize={12} fill="#111">
              {label}
            </text>
          </g>
        );
      })}
      {state.legendSource && (
        <text
          x={padding}
          y={padding + titleH + contentRows * rowH + 13}
          fontSize={11}
          fill="#737373"
        >
          출처: {state.legendSource}
        </text>
      )}
    </g>
  );
}

// 한국어/영문 혼용 문자열의 SVG 상 폭 추정 (Pretendard 기준 근사)
function estimateTextWidth(text: string, fontSize: number, fontWeight: number = 400): number {
  const boldFactor = fontWeight >= 600 ? 1.05 : 1.0;
  let w = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    const isCJK =
      (code >= 0x1100 && code <= 0x11ff) || // 한글 자모
      (code >= 0x3130 && code <= 0x318f) || // 한글 호환 자모
      (code >= 0xac00 && code <= 0xd7af) || // 한글 음절
      (code >= 0x4e00 && code <= 0x9fff);   // 한중일 공통 한자
    w += (isCJK ? 1.0 : 0.55) * fontSize * boldFactor;
  }
  return w;
}

function computePatternFgColor(
  fillMode: ChoroplethState['fillMode'],
  _bg: string,
  _pattern: PatternKind,
): string {
  if (fillMode === 'pattern') return '#111111';
  if (fillMode === 'color_pattern') return 'rgba(0,0,0,0.55)';
  return '#111111';
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
