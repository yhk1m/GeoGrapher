// © 2026 김용현
import { type ScatterGraphData, type ScatterMode, type BubbleLegendPosition } from '../data/types';

interface Props {
  data: ScatterGraphData;
  onChange: (data: ScatterGraphData) => void;
}

export default function ScatterInput({ data, onChange }: Props) {
  const updatePoint = (idx: number, field: 'x' | 'y' | 'size', value: string) => {
    const num = parseFloat(value);
    const points = data.points.map((p, i) =>
      i === idx ? { ...p, [field]: isNaN(num) ? p[field] : num } : p
    );
    onChange({ ...data, points });
  };

  const updateLabel = (idx: number, value: string) => {
    const points = data.points.map((p, i) => i === idx ? { ...p, label: value } : p);
    onChange({ ...data, points });
  };

  const addPoint = () => {
    const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nextLabel = labels[data.points.length % 26];
    onChange({ ...data, points: [...data.points, { x: 0, y: 0, size: 50, label: nextLabel }] });
  };

  const removePoint = () => {
    if (data.points.length <= 1) return;
    onChange({ ...data, points: data.points.slice(0, -1) });
  };

  return (
    <div>
      {/* 모드 */}
      <section style={styles.section}>
        <label style={styles.label}>모드</label>
        <div style={styles.radioGroup}>
          {(['normal', 'deviation'] as ScatterMode[]).map((m) => (
            <label key={m} style={styles.radio}>
              <input
                type="radio"
                checked={data.mode === m}
                onChange={() => onChange({ ...data, mode: m })}
              />
              <span>{m === 'normal' ? '일반 산점도' : '편차 산점도'}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 버블 토글 + 스케일 */}
      <section style={styles.section}>
        <label style={styles.toggleRow}>
          <span>버블 크기 표시</span>
          <input
            type="checkbox"
            checked={data.showBubble}
            onChange={(e) => onChange({ ...data, showBubble: e.target.checked })}
          />
        </label>
        {data.showBubble && (
          <div style={{ marginTop: 8 }}>
            <label style={styles.label}>버블 최대 크기 (px)</label>
            <input
              type="number"
              value={data.bubbleScale}
              onChange={(e) => onChange({ ...data, bubbleScale: parseInt(e.target.value) || 30 })}
              style={styles.numInput}
              min={10}
              max={80}
            />
            <label style={{ ...styles.label, marginTop: 8 }}>범례 위치</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {([['top-left', '좌상'], ['top-right', '우상'], ['bottom-left', '좌하'], ['bottom-right', '우하']] as [BubbleLegendPosition, string][]).map(([pos, label]) => (
                <button
                  key={pos}
                  onClick={() => onChange({ ...data, bubbleLegendPosition: pos })}
                  style={{
                    padding: '4px 0', borderRadius: 4, border: '1px solid #D1D5DB',
                    fontSize: 11, fontWeight: data.bubbleLegendPosition === pos ? 700 : 400,
                    background: data.bubbleLegendPosition === pos ? '#1B2A4A' : '#fff',
                    color: data.bubbleLegendPosition === pos ? '#fff' : '#374151',
                    cursor: 'pointer',
                  }}
                >{label}</button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 축 라벨 */}
      <section style={styles.section}>
        <label style={styles.label}>X축 라벨 / 단위</label>
        <div style={styles.row}>
          <input
            type="text"
            value={data.xLabel}
            onChange={(e) => onChange({ ...data, xLabel: e.target.value })}
            placeholder="X축"
            style={{ ...styles.input, flex: 1 }}
          />
          <input
            type="text"
            value={data.xUnit}
            onChange={(e) => onChange({ ...data, xUnit: e.target.value })}
            placeholder="단위"
            style={{ ...styles.input, width: 60 }}
          />
        </div>
        <label style={{ ...styles.label, marginTop: 8 }}>Y축 라벨 / 단위</label>
        <div style={styles.row}>
          <input
            type="text"
            value={data.yLabel}
            onChange={(e) => onChange({ ...data, yLabel: e.target.value })}
            placeholder="Y축"
            style={{ ...styles.input, flex: 1 }}
          />
          <input
            type="text"
            value={data.yUnit}
            onChange={(e) => onChange({ ...data, yUnit: e.target.value })}
            placeholder="단위"
            style={{ ...styles.input, width: 60 }}
          />
        </div>
      </section>

      {/* 축 범위 */}
      <section style={styles.section}>
        <label style={styles.toggleRow}>
          <span>X축 자동 범위</span>
          <input
            type="checkbox"
            checked={data.xRange.auto}
            onChange={(e) => onChange({ ...data, xRange: { ...data.xRange, auto: e.target.checked } })}
          />
        </label>
        {!data.xRange.auto && (
          <div style={{ ...styles.row, marginTop: 4 }}>
            <input type="number" value={data.xRange.min} onChange={(e) => onChange({ ...data, xRange: { ...data.xRange, min: parseFloat(e.target.value) || 0 } })} style={styles.numInput} placeholder="최소" />
            <span style={{ fontSize: 12 }}>~</span>
            <input type="number" value={data.xRange.max} onChange={(e) => onChange({ ...data, xRange: { ...data.xRange, max: parseFloat(e.target.value) || 100 } })} style={styles.numInput} placeholder="최대" />
          </div>
        )}
        <label style={{ ...styles.toggleRow, marginTop: 8 }}>
          <span>Y축 자동 범위</span>
          <input
            type="checkbox"
            checked={data.yRange.auto}
            onChange={(e) => onChange({ ...data, yRange: { ...data.yRange, auto: e.target.checked } })}
          />
        </label>
        {!data.yRange.auto && (
          <div style={{ ...styles.row, marginTop: 4 }}>
            <input type="number" value={data.yRange.min} onChange={(e) => onChange({ ...data, yRange: { ...data.yRange, min: parseFloat(e.target.value) || 0 } })} style={styles.numInput} placeholder="최소" />
            <span style={{ fontSize: 12 }}>~</span>
            <input type="number" value={data.yRange.max} onChange={(e) => onChange({ ...data, yRange: { ...data.yRange, max: parseFloat(e.target.value) || 100 } })} style={styles.numInput} placeholder="최대" />
          </div>
        )}
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
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>라벨</th>
              <th style={styles.th}>X</th>
              <th style={styles.th}>Y</th>
              {data.showBubble && <th style={styles.th}>크기</th>}
            </tr>
          </thead>
          <tbody>
            {data.points.map((pt, i) => (
              <tr key={i}>
                <td style={styles.td}>
                  <input type="text" value={pt.label} onChange={(e) => updateLabel(i, e.target.value)} style={{ ...styles.cellInput, width: 50, textAlign: 'center' }} />
                </td>
                <td style={styles.td}>
                  <input type="number" value={pt.x} onChange={(e) => updatePoint(i, 'x', e.target.value)} style={styles.cellInput} step="any" />
                </td>
                <td style={styles.td}>
                  <input type="number" value={pt.y} onChange={(e) => updatePoint(i, 'y', e.target.value)} style={styles.cellInput} step="any" />
                </td>
                {data.showBubble && (
                  <td style={styles.td}>
                    <input type="number" value={pt.size} onChange={(e) => updatePoint(i, 'size', e.target.value)} style={styles.cellInput} step="1" min="0" />
                  </td>
                )}
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
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 13,
    cursor: 'pointer',
  },
  row: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  input: {
    padding: '6px 10px',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
  },
  numInput: {
    width: 80,
    padding: '5px 8px',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    textAlign: 'right' as const,
    outline: 'none',
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
