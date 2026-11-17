// © 2026 김용현
import { type StackedGraphData, type StackedDisplayMode, type StackedBarDirection } from '../data/types';
import { withUi } from '../styles/ui';
import Select from './ui/Select';

interface Props {
  data: StackedGraphData;
  onChange: (data: StackedGraphData) => void;
}

export default function StackedInput({ data, onChange }: Props) {
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
    if (data.seriesLabels.length <= 2) return;
    const seriesLabels = data.seriesLabels.slice(0, -1);
    const categories = data.categories.map((c) => ({ ...c, values: c.values.slice(0, -1) }));
    onChange({ ...data, seriesLabels, categories });
  };

  return (
    <div>
      {/* 표시 모드 */}
      <section style={styles.section}>
        <label style={styles.label}>표시 모드</label>
        <div style={styles.radioGroup}>
          {(['bar', 'pie'] as StackedDisplayMode[]).map((m) => (
            <label key={m} style={styles.radio}>
              <input
                type="radio"
                checked={data.displayMode === m}
                onChange={() => onChange({ ...data, displayMode: m })}
              />
              <span>{m === 'bar' ? '100% 막대' : '원 그래프'}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 막대 방향 (막대 모드일 때만) */}
      {data.displayMode === 'bar' && (
        <section style={styles.section}>
          <label style={styles.label}>막대 방향</label>
          <div style={styles.radioGroup}>
            {(['vertical', 'horizontal'] as StackedBarDirection[]).map((d) => (
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
          <label style={{ ...styles.label, marginTop: 10 }}>축 단위 설정</label>
          <Select
            value={data.axisStep ?? 20}
            onChange={(e) => onChange({ ...data, axisStep: Number(e.target.value) })}
            style={{ padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 13 }}
          >
            {[5, 10, 20, 25, 50].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </Select>
        </section>
      )}

      {/* 원 설정 (원 모드일 때만) */}
      {data.displayMode === 'pie' && (
        <section style={styles.section}>
          <label style={styles.label}>원 회전 (°)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range"
              min={0}
              max={360}
              value={data.pieRotation ?? 0}
              onChange={(e) => onChange({ ...data, pieRotation: Number(e.target.value) })}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              min={0}
              max={360}
              value={data.pieRotation ?? 0}
              onChange={(e) => {
                const v = Number(e.target.value);
                onChange({ ...data, pieRotation: isNaN(v) ? 0 : Math.max(0, Math.min(360, v)) });
              }}
              style={{ ...styles.cellInput, width: 56 }}
            />
          </div>
          <label style={{ ...styles.label, marginTop: 10 }}>원 크기 (%)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range"
              min={30}
              max={200}
              value={data.pieScale ?? 100}
              onChange={(e) => onChange({ ...data, pieScale: Number(e.target.value) })}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              min={30}
              max={200}
              value={data.pieScale ?? 100}
              onChange={(e) => {
                const v = Number(e.target.value);
                onChange({ ...data, pieScale: isNaN(v) ? 100 : Math.max(30, Math.min(200, v)) });
              }}
              style={{ ...styles.cellInput, width: 56 }}
            />
          </div>
        </section>
      )}

      {/* 항목(시리즈) 관리 */}
      <section style={styles.section}>
        <div style={styles.headerRow}>
          <label style={styles.label}>항목 (시리즈)</label>
          <div style={styles.btnGroup}>
            <button onClick={removeSeries} style={styles.smallBtn} disabled={data.seriesLabels.length <= 2}>−</button>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{data.seriesLabels.length}개</span>
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
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{data.categories.length}개</span>
            <button onClick={addCategory} style={styles.smallBtn}>+</button>
          </div>
        </div>
        {/* 항목 6개까지 첫 번째 테이블 */}
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
        {/* 항목 7개 이상일 때 두 번째 테이블 */}
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
                      style={{ ...styles.cellInput, width: 60, textAlign: 'center', background: 'var(--fill)', color: 'var(--muted)' }}
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

const styles: Record<string, React.CSSProperties> = withUi({
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
});
