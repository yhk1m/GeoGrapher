// © 2026 김용현
import {
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
  type LegendPosition,
  GRAPH_LABELS,
} from '../data/types';
import ClimateInput from './ClimateInput';
import DeviationAInput from './DeviationAInput';
import DeviationBInput from './DeviationBInput';
import PyramidInput from './PyramidInput';
import TernaryInput from './TernaryInput';
import StackedInput from './StackedInput';
import ScatterInput from './ScatterInput';
import HythergraphInput from './HythergraphInput';
import CubeInput from './CubeInput';
import RadarInput from './RadarInput';

interface DataDrawerProps {
  open: boolean;
  graphType: GraphType;
  climateMode: ClimateMode;
  onClimateModeChange: (mode: ClimateMode) => void;
  climateData: ClimateGraphData;
  onClimateDataChange: (data: ClimateGraphData) => void;
  deviationAData: DeviationAData;
  onDeviationADataChange: (data: DeviationAData) => void;
  deviationBData: DeviationBData;
  onDeviationBDataChange: (data: DeviationBData) => void;
  pyramidData: PyramidGraphData;
  onPyramidDataChange: (data: PyramidGraphData) => void;
  ternaryData: TernaryGraphData;
  onTernaryDataChange: (data: TernaryGraphData) => void;
  stackedData: StackedGraphData;
  onStackedDataChange: (data: StackedGraphData) => void;
  scatterData: ScatterGraphData;
  onScatterDataChange: (data: ScatterGraphData) => void;
  hythergraphData: HythergraphData;
  onHythergraphDataChange: (data: HythergraphData) => void;
  cubeData: CubeGraphData;
  onCubeDataChange: (data: CubeGraphData) => void;
  radarData: RadarGraphData;
  onRadarDataChange: (data: RadarGraphData) => void;
  options: GraphOptions;
  onOptionsChange: (options: GraphOptions) => void;
}

const MODE_LABELS: Record<ClimateMode, string> = {
  normal: '일반',
  deviationA: '월별 편차',
  deviationB: '지역별 편차',
};

export default function DataDrawer({
  open,
  graphType,
  climateMode,
  onClimateModeChange,
  climateData,
  onClimateDataChange,
  deviationAData,
  onDeviationADataChange,
  deviationBData,
  onDeviationBDataChange,
  pyramidData,
  onPyramidDataChange,
  ternaryData,
  onTernaryDataChange,
  stackedData,
  onStackedDataChange,
  scatterData,
  onScatterDataChange,
  hythergraphData,
  onHythergraphDataChange,
  cubeData,
  onCubeDataChange,
  radarData,
  onRadarDataChange,
  options,
  onOptionsChange,
}: DataDrawerProps) {
  const heading = graphType === 'climate'
    ? climateMode === 'normal' ? GRAPH_LABELS.climate : climateMode === 'deviationA' ? '월별 편차 그래프' : '지역별 편차 그래프'
    : GRAPH_LABELS[graphType];

  return (
    <div
      style={{
        ...styles.drawer,
        width: open ? 'fit-content' : 0,
        minWidth: open ? 380 : 0,
        maxWidth: open ? '55vw' : 0,
        padding: open ? '16px 20px' : '0',
        borderLeft: open ? '1px solid #E5E7EB' : 'none',
        overflow: open ? 'auto' : 'hidden',
      }}
    >
      <h3 style={styles.heading}>{heading}</h3>

      {/* 기후 그래프 모드 선택 */}
      {graphType === 'climate' && (
        <section style={styles.section}>
          <label style={styles.label}>모드</label>
          <div style={styles.modeGroup}>
            {(['normal', 'deviationA', 'deviationB'] as ClimateMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onClimateModeChange(mode)}
                style={{
                  ...styles.modeBtn,
                  background: climateMode === mode ? '#1B2A4A' : '#fff',
                  color: climateMode === mode ? '#fff' : '#374151',
                }}
              >
                {MODE_LABELS[mode]}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 공통 옵션: 제목, 출처 */}
      <section style={styles.section}>
        <label style={styles.label}>그래프 제목</label>
        <input
          type="text"
          value={options.title}
          onChange={(e) => onOptionsChange({ ...options, title: e.target.value })}
          placeholder="제목 입력"
          style={styles.input}
        />
        <label style={{ ...styles.label, marginTop: 8 }}>출처 표기</label>
        <input
          type="text"
          value={options.source}
          onChange={(e) => onOptionsChange({ ...options, source: e.target.value })}
          placeholder="출처 입력"
          style={styles.input}
        />
        <div style={{ ...styles.label, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>각주</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => {
                const f = [...options.footnotes];
                if (f.length > 1) f.pop();
                onOptionsChange({ ...options, footnotes: f });
              }}
              style={styles.smallFootnoteBtn}
              disabled={options.footnotes.length <= 1}
            >−</button>
            <button
              onClick={() => onOptionsChange({ ...options, footnotes: [...options.footnotes, ''] })}
              style={styles.smallFootnoteBtn}
            >+</button>
          </div>
        </div>
        {options.footnotes.map((fn, i) => (
          <input
            key={i}
            type="text"
            value={fn}
            onChange={(e) => {
              const footnotes = options.footnotes.map((f, j) => j === i ? e.target.value : f);
              onOptionsChange({ ...options, footnotes });
            }}
            placeholder={`각주 ${i + 1}`}
            style={{ ...styles.input, marginTop: i > 0 ? 4 : 0 }}
          />
        ))}
      </section>

      {/* 글꼴 선택 */}
      <section style={styles.section}>
        <label style={styles.label}>글꼴</label>
        <div style={styles.modeGroup}>
          {(['serif', 'sans', 'custom'] as const).map((f) => (
            <button
              key={f}
              onClick={() => onOptionsChange({ ...options, fontFamily: f })}
              style={{
                ...styles.modeBtn,
                background: options.fontFamily === f ? '#1B2A4A' : '#fff',
                color: options.fontFamily === f ? '#fff' : '#374151',
              }}
            >
              {f === 'serif' ? '세리프' : f === 'sans' ? '산세리프' : '사용자 지정'}
            </button>
          ))}
        </div>
        {options.fontFamily === 'custom' && (
          <input
            type="text"
            value={options.customFont}
            onChange={(e) => onOptionsChange({ ...options, customFont: e.target.value })}
            placeholder="글꼴명 입력 (예: 바탕, HY신명조)"
            style={{ ...styles.input, marginTop: 6 }}
          />
        )}
      </section>

      {/* 데이터 라벨 토글 */}
      <section style={styles.section}>
        <label style={styles.toggleRow}>
          <span>데이터 라벨 표시</span>
          <input
            type="checkbox"
            checked={options.showDataLabels}
            onChange={(e) => onOptionsChange({ ...options, showDataLabels: e.target.checked })}
          />
        </label>
      </section>

      {/* 범례 on/off + 위치 (산점도/버블은 자체 범례 사용) */}
      {graphType !== 'scatter' && graphType !== 'cube' && <section style={styles.section}>
        <label style={styles.toggleRow}>
          <span>범례 표시</span>
          <input
            type="checkbox"
            checked={options.showLegend}
            onChange={(e) => onOptionsChange({ ...options, showLegend: e.target.checked })}
          />
        </label>
        {options.showLegend && (
          <>
            <label style={{ ...styles.label, marginTop: 8 }}>범례 위치</label>
            <div style={styles.modeGroup}>
              {(['bottom', 'right'] as LegendPosition[]).map((pos) => (
                <button
                  key={pos}
                  onClick={() => onOptionsChange({ ...options, legendPosition: pos })}
                  style={{
                    ...styles.modeBtn,
                    background: options.legendPosition === pos ? '#1B2A4A' : '#fff',
                    color: options.legendPosition === pos ? '#fff' : '#374151',
                  }}
                >
                  {pos === 'bottom' ? '하단' : '우측'}
                </button>
              ))}
            </div>
            <label style={{ ...styles.label, marginTop: 8 }}>범례 라벨</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={options.legendLabel1}
                onChange={(e) => onOptionsChange({ ...options, legendLabel1: e.target.value })}
            placeholder="막대 (자동)"
            style={styles.input}
          />
          <input
            type="text"
            value={options.legendLabel2}
            onChange={(e) => onOptionsChange({ ...options, legendLabel2: e.target.value })}
            placeholder="꺾은선/점 (자동)"
            style={styles.input}
          />
            </div>
          </>
        )}
      </section>}

      {/* 그래프별 데이터 입력 */}
      {graphType === 'climate' && climateMode === 'normal' && (
        <ClimateInput data={climateData} onChange={onClimateDataChange} />
      )}
      {graphType === 'climate' && climateMode === 'deviationA' && (
        <DeviationAInput data={deviationAData} onChange={onDeviationADataChange} />
      )}
      {graphType === 'climate' && climateMode === 'deviationB' && (
        <DeviationBInput data={deviationBData} onChange={onDeviationBDataChange} />
      )}
      {graphType === 'pyramid' && (
        <PyramidInput data={pyramidData} onChange={onPyramidDataChange} />
      )}
      {graphType === 'ternary' && (
        <TernaryInput data={ternaryData} onChange={onTernaryDataChange} />
      )}
      {graphType === 'stacked' && (
        <StackedInput data={stackedData} onChange={onStackedDataChange} />
      )}
      {graphType === 'scatter' && (
        <ScatterInput data={scatterData} onChange={onScatterDataChange} />
      )}
      {graphType === 'hythergraph' && (
        <HythergraphInput data={hythergraphData} onChange={onHythergraphDataChange} />
      )}
      {graphType === 'cube' && (
        <CubeInput data={cubeData} onChange={onCubeDataChange} />
      )}
      {graphType === 'radar' && (
        <RadarInput data={radarData} onChange={onRadarDataChange} />
      )}
      {graphType !== 'climate' && graphType !== 'pyramid' && graphType !== 'ternary' && graphType !== 'stacked' && graphType !== 'scatter' && graphType !== 'hythergraph' && graphType !== 'cube' && graphType !== 'radar' && (
        <div style={styles.placeholder}>
          이 그래프 유형은 아직 준비 중입니다.
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  drawer: {
    flexShrink: 0,
    background: '#F8F9FA',
    height: '100%',
    transition: 'min-width 0.2s ease, padding 0.2s ease',
    overflowY: 'auto',
  },
  heading: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 16,
    color: '#1B2A4A',
  },
  section: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottom: '1px solid #E5E7EB',
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: '#6B7280',
    marginBottom: 4,
  },
  input: {
    width: '100%',
    padding: '6px 10px',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 13,
    cursor: 'pointer',
  },
  smallFootnoteBtn: {
    width: 20,
    height: 20,
    borderRadius: 3,
    border: '1px solid #D1D5DB',
    background: '#fff',
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
  },
  modeGroup: {
    display: 'flex',
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    padding: '6px 0',
    borderRadius: 6,
    border: '1px solid #D1D5DB',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  placeholder: {
    padding: '24px 0',
    textAlign: 'center' as const,
    color: '#9CA3AF',
    fontSize: 13,
  },
};
