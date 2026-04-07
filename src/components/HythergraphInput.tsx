// © 2026 김용현
import { useState } from 'react';
import { type HythergraphData, type HythergraphMode, type MonthLabelStyle } from '../data/types';

interface Props {
  data: HythergraphData;
  onChange: (data: HythergraphData) => void;
}

const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const SERIES_LABELS = ['(가)','(나)','(다)','(라)','(마)'];

export default function HythergraphInput({ data, onChange }: Props) {
  const [activeSeries, setActiveSeries] = useState(0);

  const updateMonth = (seriesIdx: number, monthIdx: number, field: 'temp' | 'precip', value: string) => {
    const num = parseFloat(value);
    const series = data.series.map((s, si) => {
      if (si !== seriesIdx) return s;
      const months = s.months.map((m, mi) =>
        mi === monthIdx ? { ...m, [field]: isNaN(num) ? m[field] : num } : m
      );
      return { ...s, months };
    });
    onChange({ ...data, series });
  };

  const updateSeriesLabel = (idx: number, value: string) => {
    const series = data.series.map((s, i) => i === idx ? { ...s, label: value } : s);
    onChange({ ...data, series });
  };

  const addSeries = () => {
    if (data.series.length >= 5) return;
    const label = SERIES_LABELS[data.series.length] || `지역${data.series.length + 1}`;
    const newSeries = { label, months: Array.from({ length: 12 }, () => ({ temp: 0, precip: 0 })) };
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

  const downloadTemplate = () => {
    const header = '월,기온(°C),강수량(mm)';
    const rows = MONTH_NAMES.map((_, i) => `${i + 1},${active.months[i].temp},${active.months[i].precip}`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `하이서그래프_${active.label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split(/\r?\n/).slice(1);
      const months = [...active.months];
      for (const line of lines) {
        const cols = line.split(',');
        const monthNum = parseInt(cols[0]);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) continue;
        const idx = monthNum - 1;
        const temp = parseFloat(cols[1]);
        const precip = parseFloat(cols[2]);
        if (!isNaN(temp)) months[idx] = { ...months[idx], temp };
        if (!isNaN(precip)) months[idx] = { ...months[idx], precip };
      }
      const series = data.series.map((s, i) => i === activeSeries ? { ...s, months } : s);
      onChange({ ...data, series });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div>
      {/* 모드 */}
      <section style={styles.section}>
        <label style={styles.label}>표시 모드</label>
        <div style={styles.radioGroup}>
          {([['loop', '루프'], ['points', '점'], ['both', '둘 다']] as [HythergraphMode, string][]).map(([m, l]) => (
            <label key={m} style={styles.radio}>
              <input type="radio" checked={data.mode === m} onChange={() => onChange({ ...data, mode: m })} />
              <span>{l}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 월 라벨 스타일 */}
      <section style={styles.section}>
        <label style={styles.label}>월 라벨</label>
        <div style={styles.radioGroup}>
          {([['number', '숫자 (1~12)'], ['english', '영문 (J,F,M...)']] as [MonthLabelStyle, string][]).map(([m, l]) => (
            <label key={m} style={styles.radio}>
              <input type="radio" checked={data.monthLabelStyle === m} onChange={() => onChange({ ...data, monthLabelStyle: m })} />
              <span>{l}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 축 단위 */}
      <section style={styles.section}>
        <label style={styles.label}>축 단위</label>
        <div style={styles.row}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>X축</span>
          <input type="text" value={data.xUnit} onChange={(e) => onChange({ ...data, xUnit: e.target.value })} placeholder="(°C)" style={{ ...styles.input, width: 70 }} />
          <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 8 }}>Y축</span>
          <input type="text" value={data.yUnit} onChange={(e) => onChange({ ...data, yUnit: e.target.value })} placeholder="(mm)" style={{ ...styles.input, width: 70 }} />
        </div>
      </section>

      {/* 축 범위 */}
      <section style={styles.section}>
        <label style={styles.toggleRow}>
          <span>X축 자동 범위</span>
          <input type="checkbox" checked={data.xRange.auto} onChange={(e) => onChange({ ...data, xRange: { ...data.xRange, auto: e.target.checked } })} />
        </label>
        {!data.xRange.auto && (
          <div style={{ ...styles.row, marginTop: 4 }}>
            <input type="number" value={data.xRange.min} onChange={(e) => onChange({ ...data, xRange: { ...data.xRange, min: parseFloat(e.target.value) || 0 } })} style={styles.numInput} />
            <span style={{ fontSize: 12 }}>~</span>
            <input type="number" value={data.xRange.max} onChange={(e) => onChange({ ...data, xRange: { ...data.xRange, max: parseFloat(e.target.value) || 40 } })} style={styles.numInput} />
          </div>
        )}
        <label style={{ ...styles.toggleRow, marginTop: 8 }}>
          <span>Y축 자동 범위</span>
          <input type="checkbox" checked={data.yRange.auto} onChange={(e) => onChange({ ...data, yRange: { ...data.yRange, auto: e.target.checked } })} />
        </label>
        {!data.yRange.auto && (
          <div style={{ ...styles.row, marginTop: 4 }}>
            <input type="number" value={data.yRange.min} onChange={(e) => onChange({ ...data, yRange: { ...data.yRange, min: parseFloat(e.target.value) || 0 } })} style={styles.numInput} />
            <span style={{ fontSize: 12 }}>~</span>
            <input type="number" value={data.yRange.max} onChange={(e) => onChange({ ...data, yRange: { ...data.yRange, max: parseFloat(e.target.value) || 400 } })} style={styles.numInput} />
          </div>
        )}
      </section>

      {/* 지역(계열) 관리 */}
      <section style={styles.section}>
        <div style={styles.headerRow}>
          <label style={styles.label}>지역 (계열)</label>
          <div style={styles.btnGroup}>
            <button onClick={removeSeries} style={styles.smallBtn} disabled={data.series.length <= 1}>−</button>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{data.series.length}개</span>
            <button onClick={addSeries} style={styles.smallBtn} disabled={data.series.length >= 5}>+</button>
          </div>
        </div>
        {/* 탭 */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {data.series.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveSeries(i)}
              style={{
                padding: '4px 12px',
                borderRadius: 4,
                border: '1px solid #D1D5DB',
                fontSize: 12,
                fontWeight: activeSeries === i ? 700 : 400,
                background: activeSeries === i ? '#1B2A4A' : '#fff',
                color: activeSeries === i ? '#fff' : '#374151',
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        {/* 라벨 수정 */}
        <div style={{ marginTop: 6 }}>
          <input
            type="text"
            value={active.label}
            onChange={(e) => updateSeriesLabel(activeSeries, e.target.value)}
            style={{ ...styles.input, width: '100%' }}
            placeholder="지역 라벨"
          />
        </div>
      </section>

      {/* 월별 데이터 (선택된 계열) */}
      <section>
        <div style={styles.csvRow}>
          <label style={styles.label}>{active.label} 월별 데이터</label>
          <div style={styles.csvButtons}>
            <button onClick={downloadTemplate} style={styles.csvBtn}>양식 다운로드</button>
            <label style={styles.csvBtn}>
              CSV 업로드
              <input type="file" accept=".csv" onChange={handleCsvUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>월</th>
              <th style={styles.th}>기온(°C)</th>
              <th style={styles.th}>강수량(mm)</th>
            </tr>
          </thead>
          <tbody>
            {active.months.map((m, i) => (
              <tr key={i}>
                <td style={{ ...styles.td, fontWeight: 600, color: '#374151' }}>{MONTH_NAMES[i]}</td>
                <td style={styles.td}>
                  <input type="number" value={m.temp} onChange={(e) => updateMonth(activeSeries, i, 'temp', e.target.value)} style={styles.cellInput} step="any" />
                </td>
                <td style={styles.td}>
                  <input type="number" value={m.precip} onChange={(e) => updateMonth(activeSeries, i, 'precip', e.target.value)} style={styles.cellInput} step="any" />
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
  radioGroup: { display: 'flex', gap: 12 },
  radio: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' },
  toggleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, cursor: 'pointer' },
  row: { display: 'flex', gap: 6, alignItems: 'center' },
  input: { padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13, outline: 'none' },
  numInput: { width: 80, padding: '5px 8px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' as const, outline: 'none' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  btnGroup: { display: 'flex', alignItems: 'center', gap: 8 },
  smallBtn: { width: 24, height: 24, borderRadius: 4, border: '1px solid #D1D5DB', background: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: { padding: '6px 4px', borderBottom: '2px solid #E5E7EB', textAlign: 'center' as const, fontSize: 11, fontWeight: 600, color: '#6B7280' },
  td: { padding: '3px 4px', borderBottom: '1px solid #F3F4F6', textAlign: 'center' as const, whiteSpace: 'nowrap' as const },
  cellInput: { width: 70, padding: '3px 5px', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' as const, outline: 'none' },
  csvRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  csvButtons: { display: 'flex', gap: 6 },
  csvBtn: { padding: '4px 10px', fontSize: 11, borderRadius: 4, border: '1px solid #D1D5DB', background: '#fff', color: '#374151', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' },
};
