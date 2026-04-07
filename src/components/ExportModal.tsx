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
  type ScatterGraphData,
  type HythergraphData,
  type CubeGraphData,
  type RadarGraphData,
  type GraphOptions,
} from '../data/types';
import { exportCanvasToPNG } from '../canvas/export';
import { renderClimateGraph } from '../graphs/ClimateGraph';
import { renderDeviationAGraph } from '../graphs/DeviationAGraph';
import { renderDeviationBGraph } from '../graphs/DeviationBGraph';
import { renderPyramidGraph } from '../graphs/PopulationPyramid';
import { renderTernaryGraph } from '../graphs/TernaryDiagram';
import { renderStackedGraph } from '../graphs/StackedBarPie';
import { renderScatterGraph } from '../graphs/ScatterBubble';
import { renderHythergraph } from '../graphs/Hythergraph';
import { renderCubeGraph } from '../graphs/CubeGraph';
import { renderRadarChart } from '../graphs/RadarChart';

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
      if (graphType === 'climate') {
        if (climateMode === 'normal') renderClimateGraph(ctx, w, h, climateData, options);
        else if (climateMode === 'deviationA') renderDeviationAGraph(ctx, w, h, deviationAData, options);
        else renderDeviationBGraph(ctx, w, h, deviationBData, options);
      } else if (graphType === 'pyramid') {
        renderPyramidGraph(ctx, w, h, pyramidData, options);
      } else if (graphType === 'ternary') {
        renderTernaryGraph(ctx, w, h, ternaryData, options);
      } else if (graphType === 'stacked') {
        renderStackedGraph(ctx, w, h, stackedData, options);
      } else if (graphType === 'scatter') {
        renderScatterGraph(ctx, w, h, scatterData, options);
      } else if (graphType === 'hythergraph') {
        renderHythergraph(ctx, w, h, hythergraphData, options);
      } else if (graphType === 'cube') {
        renderCubeGraph(ctx, w, h, cubeData, options);
      } else if (graphType === 'radar') {
        renderRadarChart(ctx, w, h, radarData, options);
      }
    };
  }, [graphType, climateMode, climateData, deviationAData, deviationBData, pyramidData, ternaryData, stackedData, scatterData, hythergraphData, cubeData, radarData, options]);

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
    ctx.scale(dpr * scale, dpr * scale);

    const renderFn = getRenderFn();
    renderFn(ctx, exportW, exportH);
  }, [exportW, exportH, getRenderFn]);

  const handleExport = () => {
    exportCanvasToPNG(getRenderFn(), settings, graphType);
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>PNG 내보내기</h3>

        {/* 미리보기 */}
        <div style={styles.previewWrap}>
          <canvas ref={previewRef} style={styles.previewCanvas} />
        </div>

        {/* 모드 선택 */}
        <div style={styles.field}>
          <label style={styles.label}>모드</label>
          <div style={styles.radioGroup}>
            <label style={styles.radio}>
              <input
                type="radio"
                checked={settings.mode === 'exam'}
                onChange={() => onSettingsChange({ ...settings, mode: 'exam' })}
              />
              시험 출제용 (800x600)
            </label>
            <label style={styles.radio}>
              <input
                type="radio"
                checked={settings.mode === 'custom'}
                onChange={() => onSettingsChange({ ...settings, mode: 'custom' })}
              />
              사용자 정의
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
          실제 해상도: {exportW * settings.scale} x {exportH * settings.scale} px
        </div>

        {/* 버튼 */}
        <div style={styles.buttons}>
          <button onClick={onClose} style={styles.cancelBtn}>취소</button>
          <button onClick={handleExport} style={styles.exportBtn}>다운로드</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: '#fff',
    borderRadius: 12,
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
    padding: '8px 16px',
    borderRadius: 6,
    border: '1px solid #E5E7EB',
    fontSize: 13,
    color: '#6B7280',
    background: '#fff',
  },
  exportBtn: {
    padding: '8px 20px',
    borderRadius: 6,
    border: 'none',
    fontSize: 13,
    fontWeight: 700,
    color: '#fff',
    background: '#1B2A4A',
  },
};
