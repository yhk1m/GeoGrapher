// © 2026 김용현
import { useRef, useEffect, useCallback } from 'react';
import {
  type ExportSettings,
  type GraphType,
  type ClimateMode,
  type ClimateGraphData,
  type DeviationAData,
  type DeviationBData,
  type PyramidGraphData,
  type TernaryGraphData,
  type StackedGraphData,
  type AbsBarGraphData,
  type LineGraphData,
  type ScatterGraphData,
  type HythergraphData,
  type CubeGraphData,
  type RadarGraphData,
  type GraphOptions,
} from '../data/types';
import { exportCanvasToPNG } from '../canvas/export';
import { renderGraph } from '../graphs/renderGraph';
import { withUi } from '../styles/ui';

interface ExportModalProps {
  settings: ExportSettings;
  onSettingsChange: (s: ExportSettings) => void;
  graphType: GraphType;
  climateMode: ClimateMode;
  climateData: ClimateGraphData;
  deviationAData: DeviationAData;
  deviationBData: DeviationBData;
  pyramidData: PyramidGraphData;
  ternaryData: TernaryGraphData;
  stackedData: StackedGraphData;
  absBarData: AbsBarGraphData;
  lineData: LineGraphData;
  scatterData: ScatterGraphData;
  hythergraphData: HythergraphData;
  cubeData: CubeGraphData;
  radarData: RadarGraphData;
  options: GraphOptions;
  onClose: () => void;
}

export default function ExportModal({
  settings,
  onSettingsChange,
  graphType,
  climateMode,
  climateData,
  deviationAData,
  deviationBData,
  pyramidData,
  ternaryData,
  stackedData,
  absBarData,
  lineData,
  scatterData,
  hythergraphData,
  cubeData,
  radarData,
  options,
  onClose,
}: ExportModalProps) {
  const previewRef = useRef<HTMLCanvasElement>(null);

  const getRenderFn = useCallback(() => {
    return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      renderGraph(ctx, w, h, graphType, {
        climateMode, climateData, deviationAData, deviationBData, pyramidData, ternaryData,
        stackedData, absBarData, lineData, scatterData, hythergraphData, cubeData, radarData,
      }, options);
    };
  }, [graphType, climateMode, climateData, deviationAData, deviationBData, pyramidData, ternaryData, stackedData, absBarData, lineData, scatterData, hythergraphData, cubeData, radarData, options]);

  const isMapExport = graphType === 'choropleth' || graphType === 'symbolmap' || graphType === 'isoline' || graphType === 'flowmap';
  const mapSvgId =
    graphType === 'symbolmap' ? 'symbolmap-svg' :
    graphType === 'isoline' ? 'isoline-svg' :
    graphType === 'flowmap' ? 'flowmap-svg' :
    'choropleth-svg';
  const mapTypeName =
    graphType === 'symbolmap' ? '도형표현도' :
    graphType === 'isoline' ? '등치선도' :
    graphType === 'flowmap' ? '유선도' :
    '단계구분도';
  const exportW = settings.mode === 'exam' ? 800 : settings.width;
  const exportH = settings.mode === 'exam' ? 600 : settings.height;

  // 미리보기 렌더링
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;

    const maxPreviewW = 500;
    const scale = Math.min(maxPreviewW / exportW, 1);
    const pw = exportW * scale;
    const ph = exportH * scale;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = pw * dpr;
    canvas.height = ph * dpr;
    canvas.style.width = `${pw}px`;
    canvas.style.height = `${ph}px`;

    const ctx = canvas.getContext('2d')!;

    if (isMapExport) {
      // SVG → Canvas
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawMapSvgToCanvas(mapSvgId, canvas, pw * dpr, ph * dpr).catch(() => {});
    } else {
      ctx.scale(dpr * scale, dpr * scale);
      const renderFn = getRenderFn();
      renderFn(ctx, exportW, exportH);
    }
  }, [exportW, exportH, getRenderFn, isMapExport]);

  const handleExport = () => {
    if (isMapExport) {
      exportMapPng(mapSvgId, mapTypeName, exportW, exportH, settings.scale).then(onClose);
    } else {
      exportCanvasToPNG(getRenderFn(), settings, graphType);
      onClose();
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>PNG로 저장</h3>

        {/* 미리보기 */}
        <div style={styles.previewWrap}>
          <canvas ref={previewRef} style={styles.previewCanvas} />
        </div>

        {/* 모드 선택 */}
        <div style={styles.field}>
          <label style={styles.label}>크기</label>
          <div style={styles.radioGroup}>
            <label style={styles.radio}>
              <input
                type="radio"
                checked={settings.mode === 'exam'}
                onChange={() => onSettingsChange({ ...settings, mode: 'exam' })}
              />
              시험 출제용 (800×600)
            </label>
            <label style={styles.radio}>
              <input
                type="radio"
                checked={settings.mode === 'custom'}
                onChange={() => onSettingsChange({ ...settings, mode: 'custom' })}
              />
              직접 정하기
            </label>
          </div>
        </div>

        {/* 사용자 정의 크기 */}
        {settings.mode === 'custom' && (
          <div style={styles.field}>
            <label style={styles.label}>크기 (px)</label>
            <div style={styles.sizeRow}>
              <input
                type="number"
                value={settings.width}
                onChange={(e) => onSettingsChange({ ...settings, width: parseInt(e.target.value) || 800 })}
                style={styles.numInput}
              />
              <span>x</span>
              <input
                type="number"
                value={settings.height}
                onChange={(e) => onSettingsChange({ ...settings, height: parseInt(e.target.value) || 600 })}
                style={styles.numInput}
              />
            </div>
          </div>
        )}

        {/* 배율 */}
        <div style={styles.field}>
          <label style={styles.label}>배율</label>
          <div style={styles.radioGroup}>
            {([1, 2, 3] as const).map((s) => (
              <label key={s} style={styles.radio}>
                <input
                  type="radio"
                  checked={settings.scale === s}
                  onChange={() => onSettingsChange({ ...settings, scale: s })}
                />
                {s}x
              </label>
            ))}
          </div>
        </div>

        {/* 해상도 정보 */}
        <div style={styles.info}>
          받을 그림 크기: {exportW * settings.scale}×{exportH * settings.scale}px
        </div>

        {/* 버튼 */}
        <div style={styles.buttons}>
          <button onClick={onClose} style={styles.cancelBtn}>닫기</button>
          <button onClick={handleExport} style={styles.exportBtn}>PNG 받기</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = withUi({
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(16,24,40,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: 'var(--surface)',
    borderRadius: 'var(--r-sheet)',
    boxShadow: 'var(--shadow-3)',
    padding: 24,
    width: 560,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 16,
    color: '#1B2A4A',
  },
  previewWrap: {
    marginBottom: 16,
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: 8,
    background: '#F8F9FA',
    display: 'flex',
    justifyContent: 'center',
  },
  previewCanvas: {
    display: 'block',
    maxWidth: '100%',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: '#6B7280',
    marginBottom: 6,
  },
  radioGroup: {
    display: 'flex',
    gap: 16,
  },
  radio: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
    cursor: 'pointer',
  },
  sizeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
  },
  numInput: {
    width: 90,
    padding: '6px 10px',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace",
    textAlign: 'right' as const,
  },
  info: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 20,
    padding: '8px 12px',
    background: '#F8F9FA',
    borderRadius: 6,
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    height: 40,
    padding: '0 16px',
    borderRadius: 'var(--r-control)',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--ink)',
    background: 'var(--ctl-weak)',
  },
  exportBtn: {
    height: 40,
    padding: '0 20px',
    borderRadius: 'var(--r-control)',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--on-accent)',
    background: 'var(--accent)',
  },
});

// ─────────────────────────────────────────────────────────
// 지도 (SVG) → PNG 헬퍼 (choropleth / symbolmap 공용)

async function loadMapSvgImage(svgId: string): Promise<{ img: HTMLImageElement; w: number; h: number } | null> {
  const svg = document.getElementById(svgId) as SVGSVGElement | null;
  if (!svg) return null;
  const w = Number(svg.getAttribute('width')) || svg.clientWidth || 900;
  const h = Number(svg.getAttribute('height')) || svg.clientHeight || 1100;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));

  const svgStr = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(e);
    img.src = url;
  });
  URL.revokeObjectURL(url);
  return { img, w, h };
}

async function drawMapSvgToCanvas(svgId: string, canvas: HTMLCanvasElement, targetW: number, targetH: number) {
  const loaded = await loadMapSvgImage(svgId);
  if (!loaded) return;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, targetW, targetH);

  const { img, w, h } = loaded;
  const scale = Math.min(targetW / w, targetH / h);
  const dw = w * scale;
  const dh = h * scale;
  const dx = (targetW - dw) / 2;
  const dy = (targetH - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

async function exportMapPng(svgId: string, typeName: string, exportW: number, exportH: number, scale: 1 | 2 | 3) {
  const loaded = await loadMapSvgImage(svgId);
  if (!loaded) {
    alert('지도를 찾지 못했어요. 지도가 다 그려진 뒤에 다시 저장해 주세요.');
    return;
  }
  const { img, w, h } = loaded;

  const outW = exportW * scale;
  const outH = exportH * scale;
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, outW, outH);

  const fit = Math.min(outW / w, outH / h);
  const dw = w * fit;
  const dh = h * fit;
  ctx.drawImage(img, (outW - dw) / 2, (outH - dh) / 2, dw, dh);

  const ts = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fname = `GeoGrapher_${typeName}_${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.png`;

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fname;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
