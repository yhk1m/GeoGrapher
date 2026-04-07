// © 2026 김용현
import { type PyramidGraphData, type PyramidUnit, type AgeLabelSide, AGE_GROUPS } from '../data/types';

interface Props {
  data: PyramidGraphData;
  onChange: (data: PyramidGraphData) => void;
}

export default function PyramidInput({ data, onChange }: Props) {
  const updateAge = (index: number, field: 'male' | 'female', value: string) => {
    const num = value === '' || value === '-' ? 0 : parseFloat(value);
    const ages = data.ages.map((a, i) =>
      i === index ? { ...a, [field]: isNaN(num) ? a[field] : num } : a
    );
    onChange({ ...data, ages });
  };

  const downloadTemplate = () => {
    const header = '연령,남,여';
    const rows = AGE_GROUPS.map((g) => `${g},,`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '인구피라미드_양식.csv';
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
      const ages = [...data.ages];
      for (const line of lines) {
        const cols = line.split(',');
        const groupIdx = AGE_GROUPS.indexOf(cols[0]?.trim());
        if (groupIdx === -1) continue;
        const male = parseFloat(cols[1]);
        const female = parseFloat(cols[2]);
        if (!isNaN(male)) ages[groupIdx] = { ...ages[groupIdx], male };
        if (!isNaN(female)) ages[groupIdx] = { ...ages[groupIdx], female };
      }
      onChange({ ...data, ages });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div>
      {/* 단위 선택 */}
      <section style={styles.section}>
        <label style={styles.label}>단위</label>
        <div style={styles.radioGroup}>
          {(['count', 'percent'] as PyramidUnit[]).map((u) => (
            <label key={u} style={styles.radio}>
              <input
                type="radio"
                name="pyramidUnit"
                checked={data.unit === u}
                onChange={() => onChange({
                  ...data,
                  unit: u,
                  axisLabel: u === 'count' ? '(명)' : '(%)',
                })}
              />
              <span>{u === 'count' ? '인구수' : '비율(%)'}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 연령 라벨 위치 */}
      <section style={styles.section}>
        <label style={styles.label}>연령 라벨 위치</label>
        <div style={styles.radioGroup}>
          {(['left', 'center', 'right'] as AgeLabelSide[]).map((s) => (
            <label key={s} style={styles.radio}>
              <input
                type="radio"
                name="ageLabelSide"
                checked={data.ageLabelSide === s}
                onChange={() => onChange({ ...data, ageLabelSide: s })}
              />
              <span>{s === 'left' ? '왼쪽' : s === 'center' ? '중앙' : '오른쪽'}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 축 범위 */}
      <section style={styles.section}>
        <label style={styles.label}>축 범위 (최대값)</label>
        <div style={styles.rangeRow}>
          <label style={styles.toggleRow}>
            <input
              type="checkbox"
              checked={data.range.auto}
              onChange={(e) => onChange({ ...data, range: { ...data.range, auto: e.target.checked } })}
            />
            <span>자동</span>
          </label>
          {!data.range.auto && (
            <input
              type="number"
              value={data.range.max}
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                if (!isNaN(num)) onChange({ ...data, range: { max: num, auto: false } });
              }}
              style={styles.numInput}
              step="1"
            />
          )}
        </div>
      </section>

      {/* 라벨 */}
      <section style={styles.section}>
        <label style={styles.label}>라벨</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <div>
            <span style={styles.subLabel}>남성</span>
            <input
              type="text"
              value={data.maleLabel}
              onChange={(e) => onChange({ ...data, maleLabel: e.target.value })}
              style={styles.textInput}
            />
          </div>
          <div>
            <span style={styles.subLabel}>여성</span>
            <input
              type="text"
              value={data.femaleLabel}
              onChange={(e) => onChange({ ...data, femaleLabel: e.target.value })}
              style={styles.textInput}
            />
          </div>
        </div>
      </section>

      {/* CSV 업로드/다운로드 + 데이터 테이블 */}
      <section>
        <div style={styles.csvRow}>
          <label style={styles.label}>연령별 데이터</label>
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
              <th style={styles.th}>연령</th>
              <th style={styles.th}>남</th>
              <th style={styles.th}>여</th>
            </tr>
          </thead>
          <tbody>
            {data.ages.map((a, i) => (
              <tr key={i}>
                <td style={{ ...styles.td, textAlign: 'left' }}>{AGE_GROUPS[i]}</td>
                <td style={styles.td}>
                  <input
                    type="number"
                    value={a.male}
                    onChange={(e) => updateAge(i, 'male', e.target.value)}
                    style={styles.cellInput}
                    step={data.unit === 'percent' ? '0.1' : '1'}
                  />
                </td>
                <td style={styles.td}>
                  <input
                    type="number"
                    value={a.female}
                    onChange={(e) => updateAge(i, 'female', e.target.value)}
                    style={styles.cellInput}
                    step={data.unit === 'percent' ? '0.1' : '1'}
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
  subLabel: {
    display: 'block',
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
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
  numInput: {
    width: 90,
    padding: '4px 8px',
    border: '1px solid #E5E7EB',
    borderRadius: 4,
    fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace",
    textAlign: 'right' as const,
  },
  textInput: {
    width: '100%',
    padding: '4px 8px',
    border: '1px solid #E5E7EB',
    borderRadius: 4,
    fontSize: 13,
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
