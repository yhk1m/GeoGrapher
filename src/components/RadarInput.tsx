// © 2026 김용현
import { useState } from 'react';
import { type RadarGraphData } from '../data/types';

interface Props {
  data: RadarGraphData;
  onChange: (data: RadarGraphData) => void;
}

const SERIES_LABELS = ['(가)','(나)','(다)','(라)','(마)'];

export default function RadarInput({ data, onChange }: Props) {
  const [activeSeries, setActiveSeries] = useState(0);
  const n = data.axisLabels.length;

  // 축 개수 변경
  const setAxisCount = (count: number) => {
    if (count < 3 || count > 12) return;
    const axisLabels = Array.from({ length: count }, (_, i) => data.axisLabels[i] || `축${i + 1}`);
    const series = data.series.map((s) => ({
      ...s,
      values: Array.from({ length: count }, (_, i) => s.values[i] || 0),
    }));
    onChange({ ...data, axisLabels, series });
  };

  const updateAxisLabel = (idx: number, value: string) => {
    const axisLabels = data.axisLabels.map((l, i) => i === idx ? value : l);
    onChange({ ...data, axisLabels });
  };

  const updateValue = (seriesIdx: number, axisIdx: number, value: string) => {
    const num = parseFloat(value);
    const series = data.series.map((s, si) => {
      if (si !== seriesIdx) return s;
      const values = s.values.map((v, ai) => ai === axisIdx ? (isNaN(num) ? v : num) : v);
      return { ...s, values };
    });
    onChange({ ...data, series });
  };

  const updateSeriesLabel = (idx: number, value: string) => {
    const series = data.series.map((s, i) => i === idx ? { ...s, label: value } : s);
    onChange({ ...data, series });
  };

  const addSeries = () => {
    if (data.series.length >= 5) return;
    const label = SERIES_LABELS[data.series.length] || `계열${data.series.length + 1}`;
    const newSeries = { label, values: Array(n).fill(0) };
    onChange({ ...data, series: [...data.series, newSeries] });
    setActiveSeries(data.series.length);
  };

  const removeSeries = () => {
    if (data.series.length <= 1) return;
    const series = data.series.slice(0, -1);
    onChange({ ...data, series });
    if (activeSeries >= series.length) setActiveSeries(series.length - 1);
  };

  const active = data.series[activeSeries] || data.series[0];

  return (
    <div>
      {/* 축 개수 */}
      <section style={styles.section}>
        <div style={styles.headerRow}>
          <label style={styles.label}>축 개수</label>
          <div style={styles.btnGroup}>
            <button onClick={() => setAxisCount(n - 1)} style={styles.smallBtn} disabled={n <= 3}>−</button>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{n}개</span>
            <button onClick={() => setAxisCount(n + 1)} style={styles.smallBtn} disabled={n >= 12}>+</button>
          </div>
        </div>
      </section>

      {/* 축 라벨 */}
      <section style={styles.section}>
        <label style={styles.label}>축 라벨</label>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {data.axisLabels.map((l, i) => (
            <input
              key={i}
              type="text"
              value={l}
              onChange={(e) => updateAxisLabel(i, e.target.value)}
              style={{ ...styles.input, width: 80, textAlign: 'center', padding: '4px 6px' }}
            />
          ))}
        </div>
      </section>

      {/* 옵션 */}
      <section style={styles.section}>
        <label style={styles.toggleRow}>
          <span>최대값 자동</span>
          <input type="checkbox" checked={data.autoMax} onChange={(e) => onChange({ ...data, autoMax: e.target.checked })} />
        </label>
        {!data.autoMax && (
          <div style={{ marginTop: 4 }}>
            <input type="number" value={data.maxValue} onChange={(e) => onChange({ ...data, maxValue: parseFloat(e.target.value) || 100 })} style={styles.numInput} />
          </div>
        )}
        <div style={{ ...styles.row, marginTop: 8 }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>눈금 수</span>
          <input type="number" value={data.gridSteps} onChange={(e) => onChange({ ...data, gridSteps: Math.max(2, Math.min(10, parseInt(e.target.value) || 5)) })} style={styles.numInput} min={2} max={10} />
        </div>
        <label style={{ ...styles.toggleRow, marginTop: 8 }}>
          <span>다각형 채움</span>
          <input type="checkbox" checked={data.showFill} onChange={(e) => onChange({ ...data, showFill: e.target.checked })} />
        </label>
      </section>

      {/* 계열 관리 */}
      <section style={styles.section}>
        <div style={styles.headerRow}>
          <label style={styles.label}>계열</label>
          <div style={styles.btnGroup}>
            <button onClick={removeSeries} style={styles.smallBtn} disabled={data.series.length <= 1}>−</button>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{data.series.length}개</span>
            <button onClick={addSeries} style={styles.smallBtn} disabled={data.series.length >= 5}>+</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {data.series.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveSeries(i)}
              style={{
                padding: '4px 12px', borderRadius: 4, border: '1px solid #D1D5DB',
                fontSize: 12, fontWeight: activeSeries === i ? 700 : 400,
                background: activeSeries === i ? '#1B2A4A' : '#fff',
                color: activeSeries === i ? '#fff' : '#374151', cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 6 }}>
          <input
            type="text"
            value={active.label}
            onChange={(e) => updateSeriesLabel(activeSeries, e.target.value)}
            style={{ ...styles.input, width: '100%' }}
            placeholder="계열 라벨"
          />
        </div>
      </section>

      {/* 데이터 입력 */}
      <section>
        <label style={styles.label}>{active.label} 데이터</label>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>축</th>
              <th style={styles.th}>값</th>
            </tr>
          </thead>
          <tbody>
            {data.axisLabels.map((label, i) => (
              <tr key={i}>
                <td style={{ ...styles.td, fontWeight: 600, color: '#374151', textAlign: 'left' }}>{label}</td>
                <td style={styles.td}>
                  <input
                    type="number"
                    value={active.values[i] || 0}
                    onChange={(e) => updateValue(activeSeries, i, e.target.value)}
                    style={styles.cellInput}
                    step="any"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: { marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #E5E7EB' },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 4 },
  toggleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, cursor: 'pointer' },
  row: { display: 'flex', gap: 6, alignItems: 'center' },
  input: { padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13, outline: 'none' },
  numInput: { width: 70, padding: '5px 8px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' as const, outline: 'none' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  btnGroup: { display: 'flex', alignItems: 'center', gap: 8 },
  smallBtn: { width: 24, height: 24, borderRadius: 4, border: '1px solid #D1D5DB', background: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: { padding: '6px 4px', borderBottom: '2px solid #E5E7EB', textAlign: 'center' as const, fontSize: 11, fontWeight: 600, color: '#6B7280' },
  td: { padding: '3px 4px', borderBottom: '1px solid #F3F4F6', textAlign: 'center' as const, whiteSpace: 'nowrap' as const },
  cellInput: { width: 80, padding: '3px 5px', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' as const, outline: 'none' },
};
