// © 2026 김용현
import { type DeviationBData } from '../data/types';

interface Props {
  data: DeviationBData;
  onChange: (data: DeviationBData) => void;
}

export default function DeviationBInput({ data, onChange }: Props) {
  const updateRegion = (index: number, field: 'label' | 'precip' | 'temp', value: string) => {
    const regions = data.regions.map((r, i) => {
      if (i !== index) return r;
      if (field === 'label') return { ...r, label: value };
      const num = parseFloat(value);
      return { ...r, [field]: isNaN(num) ? r[field] : num };
    });
    onChange({ ...data, regions });
  };

  const addRegion = () => {
    if (data.regions.length >= 10) return;
    const nextLabel = String.fromCharCode(65 + data.regions.length);
    onChange({ ...data, regions: [...data.regions, { label: nextLabel, precip: 0, temp: 0 }] });
  };

  const removeRegion = () => {
    if (data.regions.length <= 2) return;
    onChange({ ...data, regions: data.regions.slice(0, -1) });
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
      {/* 기준값 */}
      <section style={styles.section}>
        <label style={styles.label}>기준값</label>
        <div style={styles.baseRow}>
          <div>
            <span style={styles.subLabel}>기준 기온(°C)</span>
            <input
              type="number"
              value={data.baseTemp}
              onChange={(e) => onChange({ ...data, baseTemp: parseFloat(e.target.value) || 0 })}
              style={styles.numInput}
              step="0.1"
            />
          </div>
          <div>
            <span style={styles.subLabel}>기준 강수량(mm)</span>
            <input
              type="number"
              value={data.basePrecip}
              onChange={(e) => onChange({ ...data, basePrecip: parseFloat(e.target.value) || 0 })}
              style={styles.numInput}
              step="1"
            />
          </div>
        </div>
      </section>

      {/* 축 범위 */}
      <section style={styles.section}>
        <label style={styles.label}>강수량 차이 축 범위</label>
        <div style={styles.rangeRow}>
          <label style={styles.toggleRow}>
            <input
              type="checkbox"
              checked={data.precipRange.auto}
              onChange={(e) => onChange({ ...data, precipRange: { ...data.precipRange, auto: e.target.checked } })}
            />
            <span>자동</span>
          </label>
          {!data.precipRange.auto && (
            <div style={styles.rangeInputs}>
              <input type="number" value={data.precipRange.min} onChange={(e) => updateRange('precipRange', 'min', e.target.value)} style={styles.numInput} />
              <span>~</span>
              <input type="number" value={data.precipRange.max} onChange={(e) => updateRange('precipRange', 'max', e.target.value)} style={styles.numInput} />
            </div>
          )}
        </div>
        <label style={{ ...styles.label, marginTop: 8 }}>기온 차이 축 범위</label>
        <div style={styles.rangeRow}>
          <label style={styles.toggleRow}>
            <input
              type="checkbox"
              checked={data.tempRange.auto}
              onChange={(e) => onChange({ ...data, tempRange: { ...data.tempRange, auto: e.target.checked } })}
            />
            <span>자동</span>
          </label>
          {!data.tempRange.auto && (
            <div style={styles.rangeInputs}>
              <input type="number" value={data.tempRange.min} onChange={(e) => updateRange('tempRange', 'min', e.target.value)} style={styles.numInput} />
              <span>~</span>
              <input type="number" value={data.tempRange.max} onChange={(e) => updateRange('tempRange', 'max', e.target.value)} style={styles.numInput} />
            </div>
          )}
        </div>
      </section>

      {/* 범례 이름 */}
      <section style={styles.section}>
        <label style={styles.label}>범례 이름</label>
        <div style={styles.legendRow}>
          <div>
            <span style={styles.subLabel}>막대</span>
            <input
              type="text"
              value={data.precipDiffLabel}
              onChange={(e) => onChange({ ...data, precipDiffLabel: e.target.value })}
              style={styles.textInput}
            />
          </div>
          <div>
            <span style={styles.subLabel}>점</span>
            <input
              type="text"
              value={data.tempDiffLabel}
              onChange={(e) => onChange({ ...data, tempDiffLabel: e.target.value })}
              style={styles.textInput}
            />
          </div>
        </div>
      </section>

      {/* 지역별 데이터 */}
      <section>
        <div style={styles.headerRow}>
          <label style={styles.label}>지역별 데이터</label>
          <div style={styles.regionBtns}>
            <button onClick={removeRegion} style={styles.smallBtn} disabled={data.regions.length <= 2}>−</button>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{data.regions.length}개</span>
            <button onClick={addRegion} style={styles.smallBtn} disabled={data.regions.length >= 10}>+</button>
          </div>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>지역</th>
              <th style={styles.th}>강수량</th>
              <th style={styles.th}>기온</th>
            </tr>
          </thead>
          <tbody>
            {data.regions.map((r, i) => (
              <tr key={i}>
                <td style={{ ...styles.td, textAlign: 'left' }}>
                  <input
                    type="text"
                    value={r.label}
                    onChange={(e) => updateRegion(i, 'label', e.target.value)}
                    style={{ ...styles.cellInput, width: 50, textAlign: 'center' }}
                  />
                </td>
                <td style={styles.td}>
                  <input
                    type="number"
                    value={r.precip}
                    onChange={(e) => updateRegion(i, 'precip', e.target.value)}
                    style={styles.cellInput}
                    step="1"
                  />
                </td>
                <td style={styles.td}>
                  <input
                    type="number"
                    value={r.temp}
                    onChange={(e) => updateRegion(i, 'temp', e.target.value)}
                    style={styles.cellInput}
                    step="0.1"
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
  baseRow: {
    display: 'flex',
    gap: 12,
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
  legendRow: {
    display: 'flex',
    gap: 12,
  },
  textInput: {
    width: '100%',
    padding: '4px 8px',
    border: '1px solid #E5E7EB',
    borderRadius: 4,
    fontSize: 13,
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  regionBtns: {
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
  numInput: {
    width: 90,
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
