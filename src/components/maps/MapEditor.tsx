// © 2026 김용현
// 지도 에디터 — 단계구분도 (컬러·패턴·그레이+패턴)
import { useCallback, useState } from 'react';
import MapCanvas from './MapCanvas';
import {
  type ChoroplethState,
  type MapUnit,
  type PaletteKind,
  type FillMode,
  type PatternKind,
  MAP_UNIT_LABELS,
  PALETTE_LABELS,
  FILL_MODE_LABELS,
  PATTERN_LABELS,
  PATTERN_ORDER,
  createDefaultChoroplethState,
  getEffectiveColors,
} from './types';

export default function MapEditor() {
  const [state, setState] = useState<ChoroplethState>(createDefaultChoroplethState);
  const [selectedBin, setSelectedBin] = useState(0);
  const [legendPos, setLegendPos] = useState({ x: 16, y: 16 });
  const [legendScale, setLegendScale] = useState(1);
  const [legendWidthOverride, setLegendWidthOverride] = useState<number | null>(null);

  const colors = getEffectiveColors(state);
  const patternEnabled = state.fillMode === 'pattern' || state.fillMode === 'color_pattern';
  const paletteDisabled = state.fillMode === 'pattern' || state.fillMode === 'grayscale';

  const handleRegionLeftClick = useCallback(
    (code: string) => {
      setState((s) => {
        const next = { ...s.regionBin };
        if (next[code] === selectedBin) delete next[code];
        else next[code] = selectedBin;
        return { ...s, regionBin: next };
      });
    },
    [selectedBin],
  );

  const handleRegionRightClick = useCallback((code: string) => {
    setState((s) => {
      const binIdx = s.regionBin[code];
      if (binIdx == null) return s;
      setSelectedBin(binIdx);
      return s;
    });
  }, []);

  const handleUnitChange = (unit: MapUnit) => {
    if (Object.keys(state.regionBin).length > 0) {
      const ok = window.confirm('행정구역 단위를 바꾸면 현재 색칠이 초기화됩니다. 계속할까요?');
      if (!ok) return;
    }
    setState((s) => ({ ...s, unit, regionBin: {} }));
  };

  const handlePaletteChange = (palette: PaletteKind) => {
    setState((s) => ({ ...s, palette, customColors: Array(7).fill(null) }));
  };

  const handleFillModeChange = (fillMode: FillMode) => {
    setState((s) => ({ ...s, fillMode }));
  };

  const handleBinColorChange = (binIdx: number, color: string) => {
    setState((s) => {
      const next = [...s.customColors];
      next[binIdx] = color;
      return { ...s, customColors: next };
    });
  };

  const handleBinColorReset = (binIdx: number) => {
    setState((s) => {
      const next = [...s.customColors];
      next[binIdx] = null;
      return { ...s, customColors: next };
    });
  };

  const handleBinPatternChange = (binIdx: number, pattern: PatternKind) => {
    setState((s) => {
      const next = [...s.binPatterns];
      next[binIdx] = pattern;
      return { ...s, binPatterns: next };
    });
  };

  const handleBinLabelChange = (binIdx: number, label: string) => {
    setState((s) => {
      const next = [...s.binLabels];
      next[binIdx] = label;
      return { ...s, binLabels: next };
    });
  };

  const handleResetColoring = () => {
    if (!window.confirm('모든 색칠을 초기화할까요?')) return;
    setState((s) => ({ ...s, regionBin: {} }));
  };

  return (
    <div style={styles.wrap}>
      <main style={styles.canvasArea}>
        <MapCanvas
          state={state}
          colors={colors}
          onRegionLeftClick={handleRegionLeftClick}
          onRegionRightClick={handleRegionRightClick}
          legendPos={legendPos}
          onLegendPosChange={setLegendPos}
          legendScale={legendScale}
          legendWidthOverride={legendWidthOverride}
        />
      </main>

      <aside style={styles.toolPanel}>
        <Section title="행정구역 단위">
          <select
            value={state.unit}
            onChange={(e) => handleUnitChange(e.target.value as MapUnit)}
            style={styles.select}
          >
            {(Object.keys(MAP_UNIT_LABELS) as MapUnit[]).map((u) => (
              <option key={u} value={u}>
                {MAP_UNIT_LABELS[u]}
              </option>
            ))}
          </select>
        </Section>

        <Section title="채우기 모드">
          <select
            value={state.fillMode}
            onChange={(e) => handleFillModeChange(e.target.value as FillMode)}
            style={styles.select}
          >
            {(Object.keys(FILL_MODE_LABELS) as FillMode[]).map((m) => (
              <option key={m} value={m}>
                {FILL_MODE_LABELS[m]}
              </option>
            ))}
          </select>
        </Section>

        <Section title="색상 팔레트">
          <select
            value={state.palette}
            onChange={(e) => handlePaletteChange(e.target.value as PaletteKind)}
            style={styles.select}
            disabled={paletteDisabled}
            title={paletteDisabled ? '현재 모드에서는 팔레트가 자동 결정됩니다' : ''}
          >
            {(Object.keys(PALETTE_LABELS) as PaletteKind[]).map((p) => (
              <option key={p} value={p}>
                {PALETTE_LABELS[p]}
              </option>
            ))}
          </select>
        </Section>

        <Section title={`등급 수: ${state.binCount}`}>
          <input
            type="range"
            min={3}
            max={7}
            value={state.binCount}
            onChange={(e) => setState((s) => ({ ...s, binCount: Number(e.target.value) }))}
            style={{ width: '100%' }}
          />
        </Section>

        <Section title="등급 · 색상 · 패턴 · 라벨">
          <div style={styles.hint}>
            행 선택 → 지도 클릭으로 색칠. 우클릭 = 스포이드.
          </div>
          <div style={styles.binRows}>
            {colors.map((c, i) => (
              <BinRow
                key={i}
                index={i}
                color={c}
                pattern={state.binPatterns?.[i] ?? 'diagonal'}
                label={state.binLabels?.[i] ?? ''}
                selected={selectedBin === i}
                customized={state.customColors?.[i] != null}
                colorEditable={!paletteDisabled}
                patternEnabled={patternEnabled}
                onSelect={() => setSelectedBin(i)}
                onColorChange={(col) => handleBinColorChange(i, col)}
                onColorReset={() => handleBinColorReset(i)}
                onPatternChange={(p) => handleBinPatternChange(i, p)}
                onLabelChange={(l) => handleBinLabelChange(i, l)}
              />
            ))}
          </div>
        </Section>

        <Section title={`범례 크기: ${legendScale.toFixed(2)}×`}>
          <input
            type="range"
            min={0.5}
            max={2.5}
            step={0.05}
            value={legendScale}
            onChange={(e) => setLegendScale(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </Section>

        <Section title={`범례 폭: ${legendWidthOverride == null ? '자동' : `${legendWidthOverride}px`}`}>
          <input
            type="range"
            min={80}
            max={400}
            step={5}
            value={legendWidthOverride ?? 180}
            onChange={(e) => setLegendWidthOverride(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <button
            onClick={() => setLegendWidthOverride(null)}
            style={{ ...styles.resetBtn, marginTop: 4, padding: '4px 8px', fontSize: 12 }}
          >
            콘텐츠에 맞게 자동
          </button>
        </Section>

        <Section title="범례 텍스트">
          <input
            type="text"
            placeholder="제목 (예: 인구밀도)"
            value={state.legendTitle}
            onChange={(e) => setState((s) => ({ ...s, legendTitle: e.target.value }))}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="단위 (예: 명/km²)"
            value={state.legendUnit}
            onChange={(e) => setState((s) => ({ ...s, legendUnit: e.target.value }))}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="출처 (예: 통계청, 2024)"
            value={state.legendSource}
            onChange={(e) => setState((s) => ({ ...s, legendSource: e.target.value }))}
            style={styles.input}
          />
        </Section>

        <Section>
          <button onClick={handleResetColoring} style={styles.resetBtn}>
            색칠 초기화
          </button>
        </Section>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={styles.section}>
      {title && <div style={styles.sectionTitle}>{title}</div>}
      {children}
    </div>
  );
}

interface BinRowProps {
  index: number;
  color: string;
  pattern: PatternKind;
  label: string;
  selected: boolean;
  customized: boolean;
  colorEditable: boolean;
  patternEnabled: boolean;
  onSelect: () => void;
  onColorChange: (c: string) => void;
  onColorReset: () => void;
  onPatternChange: (p: PatternKind) => void;
  onLabelChange: (l: string) => void;
}

function BinRow({
  index,
  color,
  pattern,
  label,
  selected,
  customized,
  colorEditable,
  patternEnabled,
  onSelect,
  onColorChange,
  onColorReset,
  onPatternChange,
  onLabelChange,
}: BinRowProps) {
  return (
    <div
      style={{
        ...styles.binRow,
        outline: selected ? '2px solid #1B2A4A' : '1px solid #e5e7eb',
      }}
      onClick={onSelect}
    >
      <div style={styles.binRowTop}>
        <span style={styles.binNum}>{index + 1}</span>
        <input
          type="color"
          value={color.startsWith('#') ? color : '#ffffff'}
          onChange={(e) => onColorChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          title={colorEditable ? '색상 변경' : '현재 모드에서는 색상이 자동 결정됩니다'}
          disabled={!colorEditable}
          style={{ ...styles.colorInput, opacity: colorEditable ? 1 : 0.4 }}
        />
        {customized && colorEditable && (
          <button
            onClick={(e) => { e.stopPropagation(); onColorReset(); }}
            style={styles.iconBtn}
            title="기본값으로 되돌리기"
          >
            ↺
          </button>
        )}
      </div>
      {patternEnabled && (
        <select
          value={pattern}
          onChange={(e) => onPatternChange(e.target.value as PatternKind)}
          onClick={(e) => e.stopPropagation()}
          style={styles.patternSelect}
          title="패턴 종류"
        >
          {PATTERN_ORDER.map((p) => (
            <option key={p} value={p}>{PATTERN_LABELS[p]}</option>
          ))}
        </select>
      )}
      <input
        type="text"
        value={label}
        onChange={(e) => onLabelChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        placeholder={`등급 ${index + 1} 라벨 (예: 1,000 이상)`}
        style={styles.labelInput}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'relative' as const,
    width: '100%',
    height: 'calc(100vh - 48px)',
    minHeight: 500,
    overflow: 'hidden',
  },
  canvasArea: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 280,
    bottom: 0,
    display: 'flex',
    background: '#fff',
    overflow: 'hidden',
    padding: 12,
    boxSizing: 'border-box' as const,
  },
  toolPanel: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bottom: 0,
    width: 280,
    padding: 16,
    borderLeft: '1px solid #e5e7eb',
    background: '#fafafa',
    overflow: 'auto',
    boxSizing: 'border-box' as const,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
  },
  select: {
    width: '100%',
    padding: '6px 8px',
    fontSize: 13,
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    background: '#fff',
    boxSizing: 'border-box' as const,
  },
  input: {
    width: '100%',
    padding: '6px 8px',
    fontSize: 13,
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    background: '#fff',
    marginBottom: 6,
    boxSizing: 'border-box' as const,
  },
  hint: {
    fontSize: 11,
    color: '#737373',
    marginBottom: 8,
    lineHeight: 1.5,
  },
  binRows: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  binRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    padding: 6,
    borderRadius: 4,
    background: '#fff',
    cursor: 'pointer',
  },
  binRowTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  binNum: {
    fontSize: 12,
    fontWeight: 700,
    width: 14,
    color: '#374151',
  },
  colorInput: {
    width: 32,
    height: 22,
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    padding: 0,
    cursor: 'pointer',
    background: '#fff',
  },
  iconBtn: {
    fontSize: 12,
    padding: '1px 6px',
    background: '#fff',
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    cursor: 'pointer',
  },
  patternSelect: {
    width: '100%',
    padding: '3px 6px',
    fontSize: 12,
    border: '1px solid #e5e7eb',
    borderRadius: 3,
    background: '#fff',
    boxSizing: 'border-box' as const,
  },
  labelInput: {
    width: '100%',
    padding: '3px 6px',
    fontSize: 12,
    border: '1px solid #e5e7eb',
    borderRadius: 3,
    background: '#fff',
    boxSizing: 'border-box' as const,
  },
  resetBtn: {
    width: '100%',
    padding: '8px 12px',
    fontSize: 13,
    background: '#fff',
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    cursor: 'pointer',
  },
  legend: {
    position: 'absolute' as const,
    background: '#fff',
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    padding: '10px 14px',
    fontSize: 12,
    minWidth: 140,
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    cursor: 'move',
    userSelect: 'none' as const,
    zIndex: 10,
  },
  legendTitle: {
    fontWeight: 700,
    marginBottom: 8,
  },
  legendUnit: {
    fontWeight: 400,
    color: '#737373',
  },
  legendRows: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatchSvg: {
    display: 'block',
    border: '1px solid #d4d4d4',
    borderRadius: 2,
  },
  legendSource: {
    marginTop: 8,
    fontSize: 11,
    color: '#737373',
  },
};
