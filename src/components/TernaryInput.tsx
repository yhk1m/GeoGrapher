// © 2026 김용현
import { type TernaryGraphData, type TernaryGridInterval } from '../data/types';

interface Props {
  data: TernaryGraphData;
  onChange: (data: TernaryGraphData) => void;
}

export default function TernaryInput({ data, onChange }: Props) {
  const updatePoint = (index: number, field: 'a' | 'b' | 'c' | 'label', value: string) => {
    const points = data.points.map((p, i) => {
      if (i !== index) return p;
      if (field === 'label') return { ...p, label: value };
      const num = parseFloat(value);
      return { ...p, [field]: isNaN(num) ? p[field] : num };
    });
    onChange({ ...data, points });
  };

  const addPoint = () => {
    const labels = ['(가)','(나)','(다)','(라)','(마)','(바)','(사)','(아)','(자)','(차)','(카)','(타)','(파)','(하)'];
    const nextLabel = labels[data.points.length % labels.length];
    onChange({ ...data, points: [...data.points, { a: 33, b: 33, c: 34, label: nextLabel }] });
  };

  const removePoint = () => {
    if (data.points.length <= 1) return;
    onChange({ ...data, points: data.points.slice(0, -1) });
  };

  const updateAxisLabel = (index: 0 | 1 | 2, value: string) => {
    const labels = [...data.axisLabels] as [string, string, string];
    labels[index] = value;
    onChange({ ...data, axisLabels: labels });
  };

  const downloadTemplate = () => {
    const header = `${data.axisLabels[0]},${data.axisLabels[1]},${data.axisLabels[2]},라벨`;
    const csv = [header].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '삼각그래프_양식.csv';
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
      const points = lines.map((line) => {
        const cols = line.split(',');
        return {
          a: parseFloat(cols[0]) || 0,
          b: parseFloat(cols[1]) || 0,
          c: parseFloat(cols[2]) || 0,
          label: cols[3]?.trim() || '',
        };
      }).filter((p) => p.a + p.b + p.c > 0);
      if (points.length > 0) onChange({ ...data, points });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div>
      {/* 축 라벨 */}
      <section style={styles.section}>
        <label style={styles.label}>축 라벨</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {([0, 1, 2] as const).map((i) => (
            <div key={i}>
              <span style={styles.subLabel}>{['좌하(A)', '우하(B)', '상단(C)'][i]}</span>
              <input
                type="text"
                value={data.axisLabels[i]}
                onChange={(e) => updateAxisLabel(i, e.target.value)}
                style={styles.textInput}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 격자선 간격 */}
      <section style={styles.section}>
        <label style={styles.label}>격자선 간격</label>
        <div style={styles.radioGroup}>
          {([10, 20, 25] as TernaryGridInterval[]).map((v) => (
            <label key={v} style={styles.radio}>
              <input
                type="radio"
                name="ternaryGrid"
                checked={data.gridInterval === v}
                onChange={() => onChange({ ...data, gridInterval: v })}
              />
              <span>{v}%</span>
            </label>
          ))}
        </div>
      </section>

      {/* 데이터 포인트 */}
      <section>
        <div style={styles.headerRow}>
          <label style={styles.label}>데이터 포인트</label>
          <div style={styles.btnGroup}>
            <button onClick={removePoint} style={styles.smallBtn} disabled={data.points.length <= 1}>−</button>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{data.points.length}개</span>
            <button onClick={addPoint} style={styles.smallBtn}>+</button>
          </div>
        </div>
        <div style={styles.csvButtons}>
          <button onClick={downloadTemplate} style={styles.csvBtn}>양식 다운로드</button>
          <label style={styles.csvBtn}>
            CSV 업로드
            <input type="file" accept=".csv" onChange={handleCsvUpload} style={{ display: 'none' }} />
          </label>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>라벨</th>
              <th style={styles.th}>{data.axisLabels[0]}</th>
              <th style={styles.th}>{data.axisLabels[1]}</th>
              <th style={styles.th}>{data.axisLabels[2]}</th>
            </tr>
          </thead>
          <tbody>
            {data.points.map((p, i) => (
              <tr key={i}>
                <td style={{ ...styles.td, textAlign: 'left' }}>
                  <input
                    type="text"
                    value={p.label}
                    onChange={(e) => updatePoint(i, 'label', e.target.value)}
                    style={{ ...styles.cellInput, width: 50, textAlign: 'center' }}
                  />
                </td>
                <td style={styles.td}>
                  <input
                    type="number"
                    value={p.a}
                    onChange={(e) => updatePoint(i, 'a', e.target.value)}
                    style={styles.cellInput}
                    step="1"
                  />
                </td>
                <td style={styles.td}>
                  <input
                    type="number"
                    value={p.b}
                    onChange={(e) => updatePoint(i, 'b', e.target.value)}
                    style={styles.cellInput}
                    step="1"
                  />
                </td>
                <td style={styles.td}>
                  <input
                    type="number"
                    value={p.c}
                    onChange={(e) => updatePoint(i, 'c', e.target.value)}
                    style={styles.cellInput}
                    step="1"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={styles.hint}>합계 = 100%</div>
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
  textInput: {
    width: '100%',
    padding: '4px 8px',
    border: '1px solid #E5E7EB',
    borderRadius: 4,
    fontSize: 13,
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
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  btnGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  smallBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    border: '1px solid #D1D5DB',
    background: '#fff',
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  csvButtons: {
    display: 'flex',
    gap: 6,
    marginBottom: 8,
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
    width: 70,
    padding: '3px 5px',
    border: '1px solid #E5E7EB',
    borderRadius: 4,
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    textAlign: 'right' as const,
    outline: 'none',
  },
  hint: {
    marginTop: 6,
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center' as const,
  },
};
