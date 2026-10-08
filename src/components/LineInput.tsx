// © 2026 김용현
import {
  type LineGraphData,
  type LineSeries,
  type LineStyle,
  type LineMarker,
  type LineLabelPlacement,
  LINE_STYLE_ORDER,
  LINE_MARKER_ORDER,
  defaultLineLeader,
} from '../data/types';

interface Props {
  data: LineGraphData;
  onChange: (data: LineGraphData) => void;
}

const STYLE_LABELS: Record<LineStyle, string> = {
  solid: '실선', dashed: '파선', dotted: '점선', dashdot: '일점쇄선',
};
const MARKER_LABELS: Record<LineMarker, string> = {
  circle: '○ 원', square: '□ 네모', triangle: '△ 세모', diamond: '◇ 마름모',
};
const WIDTHS: { label: string; value: number }[] = [
  { label: '가늘게', value: 1.5 },
  { label: '보통', value: 2 },
  { label: '굵게', value: 3.5 },
];
const STROKES: { label: string; value: string }[] = [
  { label: '검정', value: '#000' },
  { label: '회색', value: '#999' },
];
const PLACEMENT_LABELS: Record<LineLabelPlacement, string> = {
  lineEnd: '선 끝', leader: '유도선', rightLeader: '오른쪽 줄', legend: '범례',
};
const SERIES_NAMES = ['(가)', '(나)', '(다)', '(라)', '(마)', '(바)'];
const MAX_SERIES = 6;
// 「격자 진하게」는 색과 굵기를 함께 바꾼다 — 시험지 점선은 진하고 1px 쯤이다
const DARK_GRID = '#555';
const LIGHT_GRID = '#ccc';
const DARK_GRID_WIDTH = 1;
const LIGHT_GRID_WIDTH = 0.5;

export default function LineInput({ data, onChange }: Props) {
  const n = data.xLabels.length;

  const updateSeries = (idx: number, patch: Partial<LineSeries>) => {
    onChange({ ...data, series: data.series.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  };

  const addSeries = () => {
    if (data.series.length >= MAX_SERIES) return;
    const i = data.series.length;
    onChange({
      ...data,
      series: [...data.series, {
        label: SERIES_NAMES[i % SERIES_NAMES.length],
        values: Array<number | null>(n).fill(null),
        lineStyle: LINE_STYLE_ORDER[i % LINE_STYLE_ORDER.length],
        marker: LINE_MARKER_ORDER[i % LINE_MARKER_ORDER.length],
      }],
    });
  };

  const removeSeries = () => {
    if (data.series.length <= 1) return;
    onChange({ ...data, series: data.series.slice(0, -1) });
  };

  const addRow = () => {
    onChange({
      ...data,
      xLabels: [...data.xLabels, ''],
      series: data.series.map((s) => ({ ...s, values: [...s.values, null] })),
    });
  };

  const removeRow = () => {
    if (n <= 2) return;
    const last = n - 2;
    onChange({
      ...data,
      xLabels: data.xLabels.slice(0, -1),
      // 지운 행을 가리키던 유도선은 마지막 행으로 당긴다 — 렌더러의 클램프와 같은 규칙
      series: data.series.map((s) => ({
        ...s,
        values: s.values.slice(0, -1),
        leader: s.leader && s.leader.at > last ? { ...s.leader, at: last } : s.leader,
      })),
    });
  };

  const updateXLabel = (idx: number, value: string) => {
    onChange({ ...data, xLabels: data.xLabels.map((l, i) => (i === idx ? value : l)) });
  };

  /** 빈 칸은 null(선 끊김). type=number 라 숫자가 아닌 글자는 애초에 안 들어온다 */
  const updateValue = (serIdx: number, rowIdx: number, raw: string) => {
    const next = raw === '' ? null : parseFloat(raw);
    if (next !== null && !Number.isFinite(next)) return;
    const series = data.series.map((s, i) => {
      if (i !== serIdx) return s;
      return { ...s, values: s.values.map((v, j) => (j === rowIdx ? next : v)) };
    });
    onChange({ ...data, series });
  };

  const updateRange = (field: 'min' | 'max' | 'step', value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    if (field === 'step' && num <= 0) return;
    onChange({ ...data, yRange: { ...data.yRange, [field]: num, auto: false } });
  };

  const leaderOf = (s: LineSeries) => s.leader ?? defaultLineLeader(n);

  return (
    <div>
      {/* 계열 */}
      <section style={styles.section}>
        <div style={styles.headerRow}>
          <label style={styles.label}>계열</label>
          <div style={styles.btnGroup}>
            <button onClick={removeSeries} style={styles.smallBtn} disabled={data.series.length <= 1}>−</button>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{data.series.length}개</span>
            <button onClick={addSeries} style={styles.smallBtn} disabled={data.series.length >= MAX_SERIES}>+</button>
          </div>
        </div>
        {data.series.map((s, i) => (
          <div key={i} style={styles.seriesRow}>
            <input
              type="text"
              value={s.label}
              onChange={(e) => updateSeries(i, { label: e.target.value })}
              style={{ ...styles.cellInput, width: 56, textAlign: 'center' }}
            />
            <select
              value={s.lineStyle ?? LINE_STYLE_ORDER[i % LINE_STYLE_ORDER.length]}
              onChange={(e) => updateSeries(i, { lineStyle: e.target.value as LineStyle })}
              style={styles.select}
            >
              {LINE_STYLE_ORDER.map((st) => <option key={st} value={st}>{STYLE_LABELS[st]}</option>)}
            </select>
            <select
              value={s.lineWidth ?? 2}
              onChange={(e) => updateSeries(i, { lineWidth: Number(e.target.value) })}
              style={styles.select}
            >
              {WIDTHS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>
            <select
              value={s.stroke ?? '#000'}
              onChange={(e) => updateSeries(i, { stroke: e.target.value })}
              style={styles.select}
            >
              {STROKES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select
              value={s.marker ?? LINE_MARKER_ORDER[i % LINE_MARKER_ORDER.length]}
              onChange={(e) => updateSeries(i, { marker: e.target.value as LineMarker })}
              style={styles.select}
              disabled={!data.showMarkers}
              title={data.showMarkers ? '' : '아래 「마커 표시」를 켜면 쓸 수 있습니다'}
            >
              {LINE_MARKER_ORDER.map((m) => <option key={m} value={m}>{MARKER_LABELS[m]}</option>)}
            </select>
            <label style={styles.toggleRow} title="기호 속을 비웁니다">
              <input
                type="checkbox"
                checked={s.hollowMarker ?? false}
                disabled={!data.showMarkers}
                onChange={(e) => updateSeries(i, { hollowMarker: e.target.checked })}
              />
              <span>속 비움</span>
            </label>
          </div>
        ))}
      </section>

      {/* 자료 표 */}
      <section style={styles.section}>
        <div style={styles.headerRow}>
          <label style={styles.label}>자료 (x 이름을 비우면 라벨·격자 생략, 값을 비우면 선 끊김)</label>
          <div style={styles.btnGroup}>
            <button onClick={removeRow} style={styles.smallBtn} disabled={n <= 2}>−</button>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{n}칸</span>
            <button onClick={addRow} style={styles.smallBtn}>+</button>
          </div>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>x</th>
              {data.series.map((s, i) => <th key={i} style={styles.th}>{s.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.xLabels.map((label, ri) => (
              <tr key={ri}>
                <td style={styles.td}>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => updateXLabel(ri, e.target.value)}
                    placeholder="(비움)"
                    style={{ ...styles.cellInput, width: 60, textAlign: 'center' }}
                  />
                </td>
                {data.series.map((s, si) => (
                  <td key={si} style={styles.td}>
                    <input
                      type="number"
                      value={s.values[ri] ?? ''}
                      onChange={(e) => updateValue(si, ri, e.target.value)}
                      style={styles.cellInput}
                      step="any"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 계열 이름 표시 */}
      <section style={styles.section}>
        <label style={styles.label}>계열 이름 표시</label>
        <div style={styles.modeGroup}>
          {(['lineEnd', 'leader', 'rightLeader', 'legend'] as LineLabelPlacement[]).map((p) => (
            <button
              key={p}
              onClick={() => onChange({ ...data, labelPlacement: p })}
              style={{
                ...styles.modeBtn,
                background: data.labelPlacement === p ? '#1B2A4A' : '#fff',
                color: data.labelPlacement === p ? '#fff' : '#374151',
              }}
            >
              {PLACEMENT_LABELS[p]}
            </button>
          ))}
        </div>
        {data.labelPlacement === 'legend' && (
          <p style={styles.hint}>범례 상자는 위 공통 옵션의 「범례 표시」·「범례 위치」를 따릅니다.</p>
        )}
        {data.labelPlacement === 'rightLeader' && (
          <p style={styles.hint}>이름을 그래프 오른쪽 바깥에 한 줄로 세우고, 선 끝에서 유도선으로 잇습니다.</p>
        )}
        {data.labelPlacement === 'leader' && data.series.map((s, i) => {
          const leader = leaderOf(s);
          return (
            <div key={i} style={styles.leaderRow}>
              <span style={styles.leaderName}>{s.label}</span>
              <select
                value={Math.min(n - 1, Math.max(0, leader.at))}
                onChange={(e) => updateSeries(i, { leader: { ...leader, at: Number(e.target.value) } })}
                style={styles.select}
                title="가리킬 점"
              >
                {data.xLabels.map((l, k) => <option key={k} value={k}>{l || `#${k + 1}`}</option>)}
              </select>
              <span style={styles.sliderLabel}>dx</span>
              <input
                type="range" min={-120} max={120} value={leader.dx}
                onChange={(e) => updateSeries(i, { leader: { ...leader, dx: Number(e.target.value) } })}
                style={styles.slider}
              />
              <span style={styles.sliderVal}>{leader.dx}</span>
              <span style={styles.sliderLabel}>dy</span>
              <input
                type="range" min={-120} max={120} value={leader.dy}
                onChange={(e) => updateSeries(i, { leader: { ...leader, dy: Number(e.target.value) } })}
                style={styles.slider}
              />
              <span style={styles.sliderVal}>{leader.dy}</span>
            </div>
          );
        })}
      </section>

      {/* 축 */}
      <section style={styles.section}>
        <label style={styles.label}>축</label>
        <div style={styles.rangeInputs}>
          <span style={styles.small}>x 단위</span>
          <input
            type="text"
            value={data.xUnit}
            onChange={(e) => onChange({ ...data, xUnit: e.target.value })}
            placeholder="(년)"
            style={{ ...styles.cellInput, width: 64, textAlign: 'center' }}
          />
          <span style={styles.small}>y 단위</span>
          <input
            type="text"
            value={data.yUnit}
            onChange={(e) => onChange({ ...data, yUnit: e.target.value })}
            placeholder="(%)"
            style={{ ...styles.cellInput, width: 64, textAlign: 'center' }}
          />
        </div>
        <label style={{ ...styles.label, marginTop: 8 }}>틀</label>
        <div style={styles.modeGroup}>
          {(['closed', 'open'] as const).map((f) => (
            <button
              key={f}
              onClick={() => onChange({ ...data, frame: f })}
              style={{
                ...styles.modeBtn,
                background: (data.frame ?? 'closed') === f ? '#1B2A4A' : '#fff',
                color: (data.frame ?? 'closed') === f ? '#fff' : '#374151',
              }}
            >
              {f === 'closed' ? '닫힌 틀(사각)' : '열린 틀(L자)'}
            </button>
          ))}
        </div>
        <label style={{ ...styles.toggleRow, marginTop: 8 }}>
          <input
            type="checkbox"
            checked={data.yRange.auto}
            onChange={(e) => onChange({ ...data, yRange: { ...data.yRange, auto: e.target.checked } })}
          />
          <span>y 범위 자동</span>
        </label>
        {!data.yRange.auto && (
          <div style={{ ...styles.rangeInputs, marginTop: 6 }}>
            <input type="number" value={data.yRange.min} onChange={(e) => updateRange('min', e.target.value)} style={styles.numInput} placeholder="최소" />
            <span>~</span>
            <input type="number" value={data.yRange.max} onChange={(e) => updateRange('max', e.target.value)} style={styles.numInput} placeholder="최대" />
            <span style={styles.small}>간격</span>
            <input type="number" value={data.yRange.step ?? ''} onChange={(e) => updateRange('step', e.target.value)} style={styles.numInput} placeholder="자동" min={0} step="any" />
          </div>
        )}
      </section>

      {/* 격자·기타 */}
      <section style={styles.section}>
        <label style={styles.label}>격자·기타</label>
        <div style={styles.checkGrid}>
          <label style={styles.toggleRow}>
            <input type="checkbox" checked={data.xGrid ?? false} onChange={(e) => onChange({ ...data, xGrid: e.target.checked })} />
            <span>세로 격자</span>
          </label>
          <label style={styles.toggleRow}>
            <input
              type="checkbox"
              checked={(data.gridColor ?? LIGHT_GRID) === DARK_GRID}
              onChange={(e) => onChange({
                ...data,
                gridColor: e.target.checked ? DARK_GRID : LIGHT_GRID,
                gridWidth: e.target.checked ? DARK_GRID_WIDTH : LIGHT_GRID_WIDTH,
              })}
            />
            <span>격자 진하게</span>
          </label>
          <label style={styles.toggleRow}>
            <input type="checkbox" checked={data.showMarkers} onChange={(e) => onChange({ ...data, showMarkers: e.target.checked })} />
            <span>마커 표시</span>
          </label>
          <label style={styles.toggleRow}>
            <input type="checkbox" checked={data.zeroBaseline ?? false} onChange={(e) => onChange({ ...data, zeroBaseline: e.target.checked })} />
            <span>0 기준선</span>
          </label>
        </div>
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: { marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #E5E7EB' },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 4 },
  small: { fontSize: 12, color: '#6B7280' },
  hint: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 },
  btnGroup: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  smallBtn: {
    width: 24, height: 24, borderRadius: 4, border: '1px solid #D1D5DB', background: '#fff',
    fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  seriesRow: { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, flexWrap: 'wrap' as const },
  select: { padding: '3px 4px', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 12, background: '#fff' },
  toggleRow: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' as const },
  modeGroup: { display: 'flex', gap: 4 },
  modeBtn: {
    flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 12,
    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
  },
  leaderRow: { display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 12 },
  leaderName: { width: 40, fontWeight: 600, color: '#374151', flexShrink: 0 },
  sliderLabel: { fontSize: 10, color: '#9CA3AF' },
  slider: { flex: 1, height: 4, cursor: 'pointer', minWidth: 50 },
  sliderVal: { fontSize: 10, color: '#9CA3AF', width: 28, textAlign: 'right' as const },
  rangeInputs: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, flexWrap: 'wrap' as const },
  numInput: {
    width: 70, padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' as const,
  },
  checkGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: { padding: '6px 4px', borderBottom: '2px solid #E5E7EB', textAlign: 'center' as const, fontSize: 11, fontWeight: 600, color: '#6B7280' },
  td: { padding: '3px 4px', borderBottom: '1px solid #F3F4F6', textAlign: 'center' as const, whiteSpace: 'nowrap' as const },
  cellInput: {
    width: 70, padding: '3px 5px', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' as const, outline: 'none',
  },
};
