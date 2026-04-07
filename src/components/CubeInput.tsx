// © 2026 김용현
import { type CubeGraphData, type CubeAxisConfig, type LabelOffset } from '../data/types';

interface Props {
  data: CubeGraphData;
  onChange: (data: CubeGraphData) => void;
}

const POINT_LABELS = ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ'];
const AXIS_NAMES: Record<string, string> = { xAxis: 'X축', yAxis: 'Y축', zAxis: 'Z축' };

export default function CubeInput({ data, onChange }: Props) {
  const updatePoint = (idx: number, field: 'x' | 'y' | 'z', value: number) => {
    const points = data.points.map((p, i) =>
      i === idx ? { ...p, [field]: value } : p
    );
    onChange({ ...data, points });
  };

  const updateLabel = (idx: number, value: string) => {
    const points = data.points.map((p, i) => i === idx ? { ...p, label: value } : p);
    onChange({ ...data, points });
  };

  const addPoint = () => {
    const label = POINT_LABELS[data.points.length % POINT_LABELS.length];
    onChange({ ...data, points: [...data.points, { x: 0, y: 0, z: 0, label, labelDx: 0, labelDy: 0 }] });
  };

  const removePoint = () => {
    if (data.points.length <= 1) return;
    onChange({ ...data, points: data.points.slice(0, -1) });
  };

  const updateAxis = (axis: 'xAxis' | 'yAxis' | 'zAxis', field: keyof CubeAxisConfig, value: string) => {
    onChange({ ...data, [axis]: { ...data[axis], [field]: value } });
  };

  const updateOffset = (axis: 'xAxis' | 'yAxis' | 'zAxis', which: 'lowOffset' | 'highOffset', dir: 'x' | 'y', value: number) => {
    const current = data[axis][which] as LabelOffset;
    onChange({ ...data, [axis]: { ...data[axis], [which]: { ...current, [dir]: value } } });
  };

  return (
    <div>
      {/* 축 설정 */}
      {(['xAxis', 'yAxis', 'zAxis'] as const).map((axis) => (
        <section key={axis} style={styles.section}>
          <label style={styles.label}>{AXIS_NAMES[axis]} 설정</label>
          <div style={styles.row}>
            <input type="text" value={data[axis].name} onChange={(e) => updateAxis(axis, 'name', e.target.value)} placeholder="축 이름" style={{ ...styles.input, flex: 1 }} />
          </div>
          <div style={{ ...styles.row, marginTop: 4 }}>
            <input type="text" value={data[axis].lowLabel} onChange={(e) => updateAxis(axis, 'lowLabel', e.target.value)} placeholder="낮음" style={{ ...styles.input, flex: 1 }} />
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>↔</span>
            <input type="text" value={data[axis].highLabel} onChange={(e) => updateAxis(axis, 'highLabel', e.target.value)} placeholder="높음" style={{ ...styles.input, flex: 1 }} />
          </div>
          {/* 라벨 위치 조정 */}
          <div style={{ marginTop: 6 }}>
            <div style={styles.sliderRow}>
              <span style={styles.sliderLabel}>낮음 X</span>
              <input type="range" min={-50} max={50} value={data[axis].lowOffset.x} onChange={(e) => updateOffset(axis, 'lowOffset', 'x', Number(e.target.value))} style={styles.slider} />
              <span style={styles.sliderVal}>{data[axis].lowOffset.x}</span>
            </div>
            <div style={styles.sliderRow}>
              <span style={styles.sliderLabel}>낮음 Y</span>
              <input type="range" min={-50} max={50} value={data[axis].lowOffset.y} onChange={(e) => updateOffset(axis, 'lowOffset', 'y', Number(e.target.value))} style={styles.slider} />
              <span style={styles.sliderVal}>{data[axis].lowOffset.y}</span>
            </div>
            <div style={styles.sliderRow}>
              <span style={styles.sliderLabel}>높음 X</span>
              <input type="range" min={-50} max={50} value={data[axis].highOffset.x} onChange={(e) => updateOffset(axis, 'highOffset', 'x', Number(e.target.value))} style={styles.slider} />
              <span style={styles.sliderVal}>{data[axis].highOffset.x}</span>
            </div>
            <div style={styles.sliderRow}>
              <span style={styles.sliderLabel}>높음 Y</span>
              <input type="range" min={-50} max={50} value={data[axis].highOffset.y} onChange={(e) => updateOffset(axis, 'highOffset', 'y', Number(e.target.value))} style={styles.slider} />
              <span style={styles.sliderVal}>{data[axis].highOffset.y}</span>
            </div>
          </div>
        </section>
      ))}

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
        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6 }}>각 값은 0 또는 1</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>라벨</th>
              <th style={styles.th}>X</th>
              <th style={styles.th}>Y</th>
              <th style={styles.th}>Z</th>
            </tr>
          </thead>
          <tbody>
            {data.points.map((pt, i) => (
              <tr key={i}>
                <td style={styles.td}>
                  <input type="text" value={pt.label} onChange={(e) => updateLabel(i, e.target.value)} style={{ ...styles.cellInput, width: 40, textAlign: 'center' }} />
                </td>
                {(['x', 'y', 'z'] as const).map((field) => (
                  <td key={field} style={styles.td}>
                    <select
                      value={pt[field]}
                      onChange={(e) => updatePoint(i, field, Number(e.target.value))}
                      style={styles.selectInput}
                    >
                      <option value={0}>0</option>
                      <option value={1}>1</option>
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* 유도선 오프셋 조정 */}
        <div style={{ marginTop: 12 }}>
          <label style={styles.label}>유도선 위치 조정</label>
          {data.points.map((pt, i) => (
            <div key={i} style={{ marginBottom: 8, padding: '6px 8px', background: '#F8F9FA', borderRadius: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{pt.label}</div>
              <div style={styles.sliderRow}>
                <span style={styles.sliderLabel}>X</span>
                <input type="range" min={-80} max={80} value={pt.labelDx} onChange={(e) => { const points = data.points.map((p, j) => j === i ? { ...p, labelDx: Number(e.target.value) } : p); onChange({ ...data, points }); }} style={styles.slider} />
                <span style={styles.sliderVal}>{pt.labelDx}</span>
              </div>
              <div style={styles.sliderRow}>
                <span style={styles.sliderLabel}>Y</span>
                <input type="range" min={-80} max={80} value={pt.labelDy} onChange={(e) => { const points = data.points.map((p, j) => j === i ? { ...p, labelDy: Number(e.target.value) } : p); onChange({ ...data, points }); }} style={styles.slider} />
                <span style={styles.sliderVal}>{pt.labelDy}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: { marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #E5E7EB' },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 4 },
  row: { display: 'flex', gap: 6, alignItems: 'center' },
  input: { padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13, outline: 'none' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  btnGroup: { display: 'flex', alignItems: 'center', gap: 8 },
  smallBtn: { width: 24, height: 24, borderRadius: 4, border: '1px solid #D1D5DB', background: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: { padding: '6px 4px', borderBottom: '2px solid #E5E7EB', textAlign: 'center' as const, fontSize: 11, fontWeight: 600, color: '#6B7280' },
  td: { padding: '3px 4px', borderBottom: '1px solid #F3F4F6', textAlign: 'center' as const, whiteSpace: 'nowrap' as const },
  cellInput: { width: 60, padding: '3px 5px', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' as const, outline: 'none' },
  selectInput: { width: 50, padding: '3px 4px', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", textAlign: 'center' as const, outline: 'none', cursor: 'pointer' },
  sliderRow: { display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 },
  sliderLabel: { fontSize: 10, color: '#9CA3AF', width: 36, flexShrink: 0 },
  slider: { flex: 1, height: 4, cursor: 'pointer' },
  sliderVal: { fontSize: 10, color: '#9CA3AF', width: 24, textAlign: 'right' as const },
};
