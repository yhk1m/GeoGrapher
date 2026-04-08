// © 2026 김용현
import { type AbsBarGraphData, type AbsBarDirection } from '../data/types';

interface Props {
  data: AbsBarGraphData;
  onChange: (data: AbsBarGraphData) => void;
}

export default function AbsBarInput({ data, onChange }: Props) {
  const updateValue = (catIdx: number, serIdx: number, value: string) => {
    const num = parseFloat(value);
    const categories = data.categories.map((c, ci) => {
      if (ci !== catIdx) return c;
      const values = c.values.map((v, si) => si === serIdx ? (isNaN(num) ? v : num) : v);
      return { ...c, values };
    });
    onChange({ ...data, categories });
  };

  const updateCatLabel = (idx: number, value: string) => {
    const categories = data.categories.map((c, i) => i === idx ? { ...c, label: value } : c);
    onChange({ ...data, categories });
  };

  const updateSeriesLabel = (idx: number, value: string) => {
    const seriesLabels = data.seriesLabels.map((l, i) => i === idx ? value : l);
    onChange({ ...data, seriesLabels });
  };

  const addCategory = () => {
    const labels = ['(가)','(나)','(다)','(라)','(마)','(바)','(사)','(아)','(자)','(차)'];
    const nextLabel = labels[data.categories.length % labels.length];
    const values = Array(data.seriesLabels.length).fill(0);
    onChange({ ...data, categories: [...data.categories, { label: nextLabel, values }] });
  };

  const removeCategory = () => {
    if (data.categories.length <= 1) return;
    onChange({ ...data, categories: data.categories.slice(0, -1) });
  };

  const addSeries = () => {
    if (data.seriesLabels.length >= 11) return;
    const nextLabel = `항목${data.seriesLabels.length + 1}`;
    const categories = data.categories.map((c) => ({ ...c, values: [...c.values, 0] }));
    onChange({ ...data, seriesLabels: [...data.seriesLabels, nextLabel], categories });
  };

  const removeSeries = () => {
    if (data.seriesLabels.length <= 1) return;
    const seriesLabels = data.seriesLabels.slice(0, -1);
    const categories = data.categories.map((c) => ({ ...c, values: c.values.slice(0, -1) }));
    onChange({ ...data, seriesLabels, categories });
  };

  const updateRange = (field: 'min' | 'max' | 'step', value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    if (field === 'step' && num <= 0) return;
    onChange({ ...data, yRange: { ...data.yRange, [field]: num, auto: false } });
  };

  return (
    <div>
      {/* 막대 방향 */}
      <section style={styles.section}>
        <label style={styles.label}>막대 방향</label>
        <div style={styles.radioGroup}>
          {(['vertical', 'horizontal'] as AbsBarDirection[]).map((d) => (
            <label key={d} style={styles.radio}>
              <input
                type="radio"
                checked={data.barDirection === d}
                onChange={() => onChange({ ...data, barDirection: d })}
              />
              <span>{d === 'vertical' ? '세로' : '가로'}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 누적 여부 */}
      <section style={styles.section}>
        <label style={styles.toggleRow}>
          <span>누적 모드</span>
          <input
            type="checkbox"
            checked={data.stacked}
            onChange={(e) => onChange({ ...data, stacked: e.target.checked })}
          />
        </label>
      </section>

      {/* 축 범위 */}
      <section style={styles.section}>
        <label style={styles.label}>축 범위</label>
        <div style={styles.rangeRow}>
          <label style={styles.toggleRow}>
            <input
              type="checkbox"
              checked={data.yRange.auto}
              onChange={(e) => onChange({ ...data, yRange: { ...data.yRange, auto: e.target.checked } })}
            />
            <span>자동</span>
          </label>
          {data.yRange.auto && (
            <label style={styles.toggleRow}>
              <input
                type="checkbox"
                checked={data.fitMax ?? false}
                onChange={(e) => onChange({ ...data, fitMax: e.target.checked })}
              />
              <span>최댓값에 맞추기</span>
            </label>
          )}
          {!data.yRange.auto && (
            <div style={styles.rangeInputs}>
              <input
                type="number"
                value={data.yRange.min}
                onChange={(e) => updateRange('min', e.target.value)}
                style={styles.numInput}
                placeholder="최소"
              />
              <span>~</span>
              <input
                type="number"
                value={data.yRange.max}
                onChange={(e) => updateRange('max', e.target.value)}
                style={styles.numInput}
                placeholder="최대"
              />
              <span style={{ marginLeft: 6, fontSize: 12, color: '#6B7280' }}>단위</span>
              <input
                type="number"
                value={data.yRange.step ?? ''}
                onChange={(e) => updateRange('step', e.target.value)}
                style={styles.numInput}
                placeholder="자동"
                min={1}
              />
            </div>
          )}
        </div>

        <label style={{ ...styles.label, marginTop: 8 }}>단위 표기</label>
        <input
          type="text"
          value={data.unit}
          onChange={(e) => onChange({ ...data, unit: e.target.value })}
          placeholder="예: (명), (만 톤) 등"
          style={styles.unitInput}
        />
      </section>

      {/* 항목(시리즈) 관리 */}
      <section style={styles.section}>
        <div style={styles.headerRow}>
          <label style={styles.label}>항목 (시리즈)</label>
          <div style={styles.btnGroup}>
            <button onClick={removeSeries} style={styles.smallBtn} disabled={data.seriesLabels.length <= 1}>−</button>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{data.seriesLabels.length}개</span>
            <button onClick={addSeries} style={styles.smallBtn} disabled={data.seriesLabels.length >= 11}>+</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {data.seriesLabels.map((l, i) => (
            <input
              key={i}
              type="text"
              value={l}
              onChange={(e) => updateSeriesLabel(i, e.target.value)}
              style={{ ...styles.cellInput, width: 80, textAlign: 'center' }}
            />
          ))}
        </div>
      </section>

      {/* 카테고리 + 데이터 */}
      <section>
        <div style={styles.headerRow}>
          <label style={styles.label}>카테고리 데이터</label>
          <div style={styles.btnGroup}>
            <button onClick={removeCategory} style={styles.smallBtn} disabled={data.categories.length <= 1}>−</button>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{data.categories.length}개</span>
            <button onClick={addCategory} style={styles.smallBtn}>+</button>
          </div>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>이름</th>
              {data.seriesLabels.slice(0, 6).map((l, i) => (
                <th key={i} style={styles.th}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.categories.map((cat, ci) => (
              <tr key={ci}>
                <td style={{ ...styles.td, textAlign: 'left' }}>
                  <input
                    type="text"
                    value={cat.label}
                    onChange={(e) => updateCatLabel(ci, e.target.value)}
                    style={{ ...styles.cellInput, width: 60, textAlign: 'center' }}
                  />
                </td>
                {cat.values.slice(0, 6).map((v, si) => (
                  <td key={si} style={styles.td}>
                    <input
                      type="number"
                      value={v}
                      onChange={(e) => updateValue(ci, si, e.target.value)}
                      style={styles.cellInput}
                      step="1"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.seriesLabels.length > 6 && (
          <table style={{ ...styles.table, marginTop: 12 }}>
            <thead>
              <tr>
                <th style={styles.th}>이름</th>
                {data.seriesLabels.slice(6).map((l, i) => (
                  <th key={i + 6} style={styles.th}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.categories.map((cat, ci) => (
                <tr key={ci}>
                  <td style={{ ...styles.td, textAlign: 'left' }}>
                    <input
                      type="text"
                      value={cat.label}
                      disabled
                      style={{ ...styles.cellInput, width: 60, textAlign: 'center', background: '#F3F4F6', color: '#9CA3AF' }}
                    />
                  </td>
                  {cat.values.slice(6).map((v, si) => (
                    <td key={si + 6} style={styles.td}>
                      <input
                        type="number"
                        value={v}
                        onChange={(e) => updateValue(ci, si + 6, e.target.value)}
                        style={styles.cellInput}
                        step="1"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    cursor: 'pointer',
  },
  rangeRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
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
  unitInput: {
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
};
