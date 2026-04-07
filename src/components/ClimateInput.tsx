// © 2026 김용현
import { type ClimateGraphData, type MonthInterval } from '../data/types';

interface ClimateInputProps {
  data: ClimateGraphData;
  onChange: (data: ClimateGraphData) => void;
}

const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

const INTERVAL_INDICES: Record<number, number[]> = {
  12: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  4: [2, 5, 8, 11],
  2: [0, 6],
};

export default function ClimateInput({ data, onChange }: ClimateInputProps) {
  const indices = INTERVAL_INDICES[data.monthInterval];

  const downloadTemplate = () => {
    const header = '월,기온(°C),강수량(mm)';
    const rows = indices.map((i) => `${i + 1},,`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `기후그래프_양식_${data.monthInterval}개월.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split(/\r?\n/).slice(1); // 헤더 제외
      const months = [...data.months];
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
      onChange({ ...data, months });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const updateMonth = (index: number, field: 'temp' | 'precip', value: string) => {
    const num = value === '' || value === '-' ? 0 : parseFloat(value);
    const months = data.months.map((m, i) =>
      i === index ? { ...m, [field]: isNaN(num) ? m[field] : num } : m
    );
    onChange({ ...data, months });
  };

  const updateRange = (
    axis: 'tempRange' | 'precipRange',
    field: 'min' | 'max',
    value: string
  ) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    onChange({
      ...data,
      [axis]: { ...data[axis], [field]: num, auto: false },
    });
  };

  return (
    <div>
      {/* 월 표시 간격 */}
      <section style={styles.section}>
        <label style={styles.label}>월 표시 간격</label>
        <div style={styles.radioGroup}>
          {([12, 4, 2] as MonthInterval[]).map((v) => (
            <label key={v} style={styles.radio}>
              <input
                type="radio"
                name="monthInterval"
                checked={data.monthInterval === v}
                onChange={() => onChange({ ...data, monthInterval: v })}
              />
              <span>{v === 12 ? '12개월' : v === 4 ? '4개월' : '2개월'}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 축 범위 */}
      <section style={styles.section}>
        <label style={styles.label}>기온 축 범위</label>
        <div style={styles.rangeRow}>
          <label style={styles.toggleRow}>
            <input
              type="checkbox"
              checked={data.tempRange.auto}
              onChange={(e) =>
                onChange({ ...data, tempRange: { ...data.tempRange, auto: e.target.checked } })
              }
            />
            <span>자동</span>
          </label>
          {!data.tempRange.auto && (
            <div style={styles.rangeInputs}>
              <input
                type="number"
                value={data.tempRange.min}
                onChange={(e) => updateRange('tempRange', 'min', e.target.value)}
                style={styles.numInput}
                placeholder="최소"
              />
              <span>~</span>
              <input
                type="number"
                value={data.tempRange.max}
                onChange={(e) => updateRange('tempRange', 'max', e.target.value)}
                style={styles.numInput}
                placeholder="최대"
              />
            </div>
          )}
        </div>

        <label style={{ ...styles.label, marginTop: 8 }}>강수량 축 범위</label>
        <div style={styles.rangeRow}>
          <label style={styles.toggleRow}>
            <input
              type="checkbox"
              checked={data.precipRange.auto}
              onChange={(e) =>
                onChange({ ...data, precipRange: { ...data.precipRange, auto: e.target.checked } })
              }
            />
            <span>자동</span>
          </label>
          {!data.precipRange.auto && (
            <div style={styles.rangeInputs}>
              <input
                type="number"
                value={data.precipRange.min}
                onChange={(e) => updateRange('precipRange', 'min', e.target.value)}
                style={styles.numInput}
                placeholder="최소"
              />
              <span>~</span>
              <input
                type="number"
                value={data.precipRange.max}
                onChange={(e) => updateRange('precipRange', 'max', e.target.value)}
                style={styles.numInput}
                placeholder="최대"
              />
            </div>
          )}
        </div>
      </section>

      {/* CSV 업로드/다운로드 + 데이터 테이블 */}
      <section>
        <div style={styles.csvRow}>
          <label style={styles.label}>월별 데이터</label>
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
            {INTERVAL_INDICES[data.monthInterval].map((i) => (
              <tr key={i}>
                <td style={{ ...styles.td, textAlign: 'left' }}>{MONTH_LABELS[i]}</td>
                <td style={styles.td}>
                  <input
                    type="number"
                    value={data.months[i].temp}
                    onChange={(e) => updateMonth(i, 'temp', e.target.value)}
                    style={styles.cellInput}
                    step="0.1"
                  />
                </td>
                <td style={styles.td}>
                  <input
                    type="number"
                    value={data.months[i].precip}
                    onChange={(e) => updateMonth(i, 'precip', e.target.value)}
                    style={styles.cellInput}
                    step="1"
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
  radioGroup: {
    display: 'flex',
    gap: 12,
  },
  radio: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
    cursor: 'pointer',
  },
  rangeRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    cursor: 'pointer',
  },
  rangeInputs: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
  },
  numInput: {
    width: 70,
    padding: '4px 8px',
    border: '1px solid #E5E7EB',
    borderRadius: 4,
    fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace",
    textAlign: 'right' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 13,
  },
  th: {
    padding: '6px 4px',
    borderBottom: '2px solid #E5E7EB',
    textAlign: 'center' as const,
    fontSize: 11,
    fontWeight: 600,
    color: '#6B7280',
  },
  td: {
    padding: '3px 4px',
    borderBottom: '1px solid #F3F4F6',
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const,
  },
  csvRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  csvButtons: {
    display: 'flex',
    gap: 6,
  },
  csvBtn: {
    padding: '4px 10px',
    fontSize: 11,
    borderRadius: 4,
    border: '1px solid #D1D5DB',
    background: '#fff',
    color: '#374151',
    cursor: 'pointer',
    fontWeight: 500,
  },
  cellInput: {
    width: 100,
    padding: '3px 5px',
    border: '1px solid #E5E7EB',
    borderRadius: 4,
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    textAlign: 'right' as const,
    outline: 'none',
  },
};
