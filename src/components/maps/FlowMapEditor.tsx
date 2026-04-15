// © 2026 김용현
// 유선도 에디터
import { useCallback, useEffect, useState } from 'react';
import FlowMapCanvas from './FlowMapCanvas';
import {
  type FlowMapState,
  type FlowLine,
  type FlowCurveType,
  type FlowArrowStyle,
  type MapUnit,
  type RegionProps,
  MAP_UNIT_LABELS,
  MAP_UNIT_FILES,
  FLOW_CURVE_LABELS,
  FLOW_ARROW_LABELS,
  createDefaultFlowMapState,
} from './types';

type GeoFC = import('geojson').FeatureCollection<import('geojson').Geometry, RegionProps>;
const geoCache = new Map<MapUnit, GeoFC>();

export default function FlowMapEditor() {
  const [state, setState] = useState<FlowMapState>(createDefaultFlowMapState);
  const [legendPos, setLegendPos] = useState({ x: 16, y: 16 });
  const [legendScale, setLegendScale] = useState(1);
  const [legendWidthOverride, setLegendWidthOverride] = useState<number | null>(null);
  const [regions, setRegions] = useState<{ code: string; name: string }[]>([]);
  const [clickMode, setClickMode] = useState<'idle' | 'pickFrom' | 'pickTo'>('idle');
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      let fc = geoCache.get(state.unit);
      if (!fc) {
        const r = await fetch(MAP_UNIT_FILES[state.unit]);
        fc = (await r.json()) as GeoFC;
        geoCache.set(state.unit, fc);
      }
      const list = fc.features
        .map((f) => ({ code: String(f.properties.code), name: String(f.properties.name) }))
        .sort((a, b) => a.code.localeCompare(b.code));
      setRegions(list);
    };
    load().catch(() => setRegions([]));
  }, [state.unit]);

  const regionName = useCallback(
    (code: string) => regions.find((r) => r.code === code)?.name ?? code,
    [regions],
  );

  const handleUnitChange = (unit: MapUnit) => {
    if (state.flows.length > 0) {
      if (!window.confirm('행정구역 단위를 바꾸면 흐름 데이터가 초기화됩니다. 계속할까요?')) return;
    }
    setState((s) => ({ ...s, unit, flows: [] }));
    setClickMode('idle');
    setPendingFrom(null);
  };

  const addFlow = (from: string, to: string, value = 1) => {
    const id = `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const flow: FlowLine = { id, from, to, value };
    setState((s) => ({ ...s, flows: [...s.flows, flow] }));
  };

  const handleRegionClick = useCallback(
    (code: string) => {
      if (clickMode === 'pickFrom') {
        setPendingFrom(code);
        setClickMode('pickTo');
      } else if (clickMode === 'pickTo') {
        if (pendingFrom && code !== pendingFrom) {
          addFlow(pendingFrom, code);
        }
        // 연속 입력: 유선 생성 후 다음 출발점 선택 단계로 복귀 (취소 버튼으로 종료)
        setPendingFrom(null);
        setClickMode('pickFrom');
      }
    },
    [clickMode, pendingFrom],
  );

  useEffect(() => {
    if (clickMode === 'idle') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPendingFrom(null);
        setClickMode('idle');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clickMode]);

  const startAddByClick = () => {
    setPendingFrom(null);
    setClickMode('pickFrom');
  };
  const cancelClickMode = () => {
    setPendingFrom(null);
    setClickMode('idle');
  };

  const handleFlowChange = (id: string, patch: Partial<FlowLine>) => {
    setState((s) => ({
      ...s,
      flows: s.flows.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  };
  const handleFlowDelete = (id: string) => {
    setState((s) => ({ ...s, flows: s.flows.filter((f) => f.id !== id) }));
  };
  const handleClearFlows = () => {
    if (!window.confirm('모든 유선을 삭제할까요?')) return;
    setState((s) => ({ ...s, flows: [] }));
  };

  // CSV
  const handleDownloadCsvTemplate = () => {
    const rows: string[][] = [['출발코드', '출발명', '도착코드', '도착명', '값', '라벨']];
    if (regions.length >= 2) {
      rows.push([regions[0].code, regions[0].name, regions[1].code, regions[1].name, '100', '']);
    }
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GeoGrapher_유선도_템플릿_${state.unit}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const parsed = parseCsv(text);
      if (parsed.length < 2) { alert('CSV에 데이터 행이 없습니다.'); return; }
      const byCode = new Map(regions.map((r) => [r.code, r]));
      const byName = new Map(regions.map((r) => [r.name.trim(), r]));
      const newFlows: FlowLine[] = [];
      const unmatched: string[] = [];
      for (let i = 1; i < parsed.length; i++) {
        const row = parsed[i];
        if (!row.length) continue;
        // 첫 컬럼=출발, 두 번째 컬럼은 이름일 수 있음(템플릿). 실제 매칭: 코드 우선, 이름 대체
        // 값과 라벨 컬럼 추정: 마지막 문자열 라벨, 그 앞 숫자 값
        const fromKey = row[0]?.trim() ?? '';
        // to는 두 번째 "코드" 컬럼 — 템플릿 구조상 3번째 컬럼 또는 2번째
        const toKey = (row[2] ?? row[1])?.trim() ?? '';
        const from = byCode.get(fromKey) ?? byName.get(fromKey);
        const to = byCode.get(toKey) ?? byName.get(toKey);
        if (!from || !to) {
          unmatched.push(`${fromKey}→${toKey}`);
          continue;
        }
        // 숫자 컬럼 찾기
        let value = 0;
        let label: string | undefined;
        for (let j = row.length - 1; j >= 0; j--) {
          const raw = row[j]?.trim() ?? '';
          const num = Number(raw.replace(/,/g, ''));
          if (isFinite(num) && raw !== '') {
            value = num;
            label = row[j + 1]?.trim() || undefined;
            break;
          }
        }
        if (value === 0) continue;
        newFlows.push({
          id: `csv-${Date.now()}-${i}`,
          from: from.code,
          to: to.code,
          value,
          label,
        });
      }
      if (newFlows.length === 0) {
        alert('CSV에서 유효한 흐름을 찾지 못했습니다.');
        return;
      }
      setState((s) => ({ ...s, flows: [...s.flows, ...newFlows] }));
      alert(`${newFlows.length}개 유선 추가됨.${unmatched.length ? `\n매칭 실패: ${unmatched.slice(0, 5).join(', ')}${unmatched.length > 5 ? ' …' : ''}` : ''}`);
    };
    reader.readAsText(file, 'utf-8');
  };

  return (
    <div style={styles.wrap}>
      <main style={styles.canvasArea}>
        <FlowMapCanvas
          state={state}
          legendPos={legendPos}
          onLegendPosChange={setLegendPos}
          legendScale={legendScale}
          legendWidthOverride={legendWidthOverride}
          clickMode={clickMode}
          pendingFrom={pendingFrom}
          onRegionClick={handleRegionClick}
        />
        {clickMode !== 'idle' && (
          <div style={styles.clickHint}>
            {clickMode === 'pickFrom'
              ? `📍 출발 지역 클릭 · 연속 입력 중 (${state.flows.length}개)`
              : '🎯 도착 지역을 클릭하세요'}
            <button onClick={cancelClickMode} style={styles.cancelBtn}>완료 (Esc)</button>
          </div>
        )}
      </main>

      <aside style={styles.toolPanel}>
        <Section title="행정구역 단위">
          <select value={state.unit} onChange={(e) => handleUnitChange(e.target.value as MapUnit)} style={styles.select}>
            {(Object.keys(MAP_UNIT_LABELS) as MapUnit[]).map((u) => (
              <option key={u} value={u}>{MAP_UNIT_LABELS[u]}</option>
            ))}
          </select>
        </Section>

        <Section title="기본 색상">
          <input type="color" value={state.defaultColor}
            onChange={(e) => setState((s) => ({ ...s, defaultColor: e.target.value }))}
            style={styles.colorInputFull} />
        </Section>

        <Section title="선 종류">
          <select value={state.curveType}
            onChange={(e) => setState((s) => ({ ...s, curveType: e.target.value as FlowCurveType }))}
            style={styles.select}>
            {(Object.keys(FLOW_CURVE_LABELS) as FlowCurveType[]).map((k) => (
              <option key={k} value={k}>{FLOW_CURVE_LABELS[k]}</option>
            ))}
          </select>
          {state.curveType === 'bezier' && (
            <>
              <div style={styles.sectionTitle}>곡률: {state.bezierCurvature.toFixed(2)}</div>
              <input type="range" min={0} max={1} step={0.05} value={state.bezierCurvature}
                onChange={(e) => setState((s) => ({ ...s, bezierCurvature: Number(e.target.value) }))}
                style={{ width: '100%' }} />
            </>
          )}
        </Section>

        <Section title="화살표">
          <select value={state.arrowStyle}
            onChange={(e) => setState((s) => ({ ...s, arrowStyle: e.target.value as FlowArrowStyle }))}
            style={styles.select}>
            {(Object.keys(FLOW_ARROW_LABELS) as FlowArrowStyle[]).map((k) => (
              <option key={k} value={k}>{FLOW_ARROW_LABELS[k]}</option>
            ))}
          </select>
        </Section>

        <Section title="선 굵기">
          <div style={styles.sectionTitle}>최소: {state.minWidth.toFixed(1)}px</div>
          <input type="range" min={0.5} max={8} step={0.5} value={state.minWidth}
            onChange={(e) => setState((s) => ({ ...s, minWidth: Number(e.target.value) }))}
            style={{ width: '100%' }} />
          <div style={styles.sectionTitle}>최대: {state.maxWidth.toFixed(1)}px</div>
          <input type="range" min={2} max={30} step={0.5} value={state.maxWidth}
            onChange={(e) => setState((s) => ({ ...s, maxWidth: Number(e.target.value) }))}
            style={{ width: '100%' }} />
        </Section>

        <Section title={`불투명도: ${Math.round(state.opacity * 100)}%`}>
          <input type="range" min={0.2} max={1} step={0.05} value={state.opacity}
            onChange={(e) => setState((s) => ({ ...s, opacity: Number(e.target.value) }))}
            style={{ width: '100%' }} />
        </Section>

        <Section>
          <label style={styles.checkRow}>
            <input type="checkbox" checked={state.showValues}
              onChange={(e) => setState((s) => ({ ...s, showValues: e.target.checked }))} />
            <span>값 표시</span>
          </label>
        </Section>

        <Section title={`범례 크기: ${legendScale.toFixed(2)}×`}>
          <input type="range" min={0.5} max={2.5} step={0.05} value={legendScale}
            onChange={(e) => setLegendScale(Number(e.target.value))} style={{ width: '100%' }} />
        </Section>
        <Section title={`범례 폭: ${legendWidthOverride == null ? '자동' : `${legendWidthOverride}px`}`}>
          <input type="range" min={80} max={400} step={5}
            value={legendWidthOverride ?? 180}
            onChange={(e) => setLegendWidthOverride(Number(e.target.value))}
            style={{ width: '100%' }} />
          <button onClick={() => setLegendWidthOverride(null)}
            style={{ ...styles.resetBtn, marginTop: 4, padding: '4px 8px', fontSize: 12 }}>
            콘텐츠에 맞게 자동
          </button>
        </Section>

        <Section title="범례 텍스트">
          <input type="text" placeholder="제목 (예: 인구 이동)" value={state.legendTitle}
            onChange={(e) => setState((s) => ({ ...s, legendTitle: e.target.value }))} style={styles.input} />
          <input type="text" placeholder="단위 (예: 천 명)" value={state.legendUnit}
            onChange={(e) => setState((s) => ({ ...s, legendUnit: e.target.value }))} style={styles.input} />
          <input type="text" placeholder="출처 (예: 통계청, 2024)" value={state.legendSource}
            onChange={(e) => setState((s) => ({ ...s, legendSource: e.target.value }))} style={styles.input} />
        </Section>

        <Section title={`유선 데이터 (${state.flows.length}개)`}>
          <div style={styles.csvBtnRow}>
            <button onClick={startAddByClick} style={styles.csvBtn} title="지도를 클릭해 유선 추가">
              + 클릭으로 추가
            </button>
          </div>
          <div style={styles.csvBtnRow}>
            <button onClick={handleDownloadCsvTemplate} style={styles.csvBtn}>CSV 템플릿</button>
            <label style={styles.csvBtn}>
              CSV 불러오기
              <input type="file" accept=".csv,text/csv" style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadCsv(f);
                  e.target.value = '';
                }} />
            </label>
          </div>
          <div style={styles.flowList}>
            {state.flows.length === 0 ? (
              <div style={styles.empty}>
                아직 유선이 없습니다. 위 버튼으로 추가하거나 CSV를 불러오세요.
              </div>
            ) : (
              state.flows.map((f) => (
                <FlowRow
                  key={f.id}
                  flow={f}
                  regions={regions}
                  regionName={regionName}
                  onChange={(p) => handleFlowChange(f.id, p)}
                  onDelete={() => handleFlowDelete(f.id)}
                />
              ))
            )}
          </div>
          {state.flows.length > 0 && (
            <button onClick={handleClearFlows} style={{ ...styles.resetBtn, marginTop: 8 }}>
              모두 삭제
            </button>
          )}
        </Section>
      </aside>
    </div>
  );
}

function FlowRow({
  flow,
  regions,
  regionName,
  onChange,
  onDelete,
}: {
  flow: FlowLine;
  regions: { code: string; name: string }[];
  regionName: (code: string) => string;
  onChange: (p: Partial<FlowLine>) => void;
  onDelete: () => void;
}) {
  return (
    <div style={styles.flowRow}>
      <div style={styles.flowRowHead}>
        <span style={styles.flowDir}>
          {regionName(flow.from)} → {regionName(flow.to)}
        </span>
        <button onClick={onDelete} style={styles.iconBtn} title="삭제">×</button>
      </div>
      <div style={styles.flowRowBody}>
        <select value={flow.from} onChange={(e) => onChange({ from: e.target.value })} style={styles.miniSelect}>
          {regions.map((r) => (<option key={r.code} value={r.code}>{r.name}</option>))}
        </select>
        <span style={styles.arrow}>→</span>
        <select value={flow.to} onChange={(e) => onChange({ to: e.target.value })} style={styles.miniSelect}>
          {regions.map((r) => (<option key={r.code} value={r.code}>{r.name}</option>))}
        </select>
      </div>
      <div style={styles.flowRowBody}>
        <input
          type="number"
          value={flow.value}
          onChange={(e) => onChange({ value: Number(e.target.value) || 0 })}
          style={styles.miniInput}
          placeholder="값"
        />
        <input
          type="text"
          value={flow.label ?? ''}
          onChange={(e) => onChange({ label: e.target.value || undefined })}
          style={styles.miniInput}
          placeholder="라벨 (선택)"
        />
      </div>
    </div>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={styles.section}>
      {title && <div style={styles.sectionTitle}>{title}</div>}
      {children}
    </div>
  );
}

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
function parseCsv(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\r') {/**/}
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'relative' as const,
    width: '100%',
    height: 'calc(100vh - 48px)',
    minHeight: 500,
    overflow: 'hidden',
  },
  canvasArea: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 320, bottom: 0,
    display: 'flex', background: '#fff', overflow: 'hidden',
    padding: 12, boxSizing: 'border-box' as const,
  },
  toolPanel: {
    position: 'absolute' as const,
    top: 0, right: 0, bottom: 0,
    width: 320, padding: 16,
    borderLeft: '1px solid #e5e7eb', background: '#fafafa',
    overflow: 'auto', boxSizing: 'border-box' as const,
  },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 },
  select: {
    width: '100%', padding: '6px 8px', fontSize: 13,
    border: '1px solid #d4d4d4', borderRadius: 4, background: '#fff',
    boxSizing: 'border-box' as const, marginBottom: 4,
  },
  input: {
    width: '100%', padding: '6px 8px', fontSize: 13,
    border: '1px solid #d4d4d4', borderRadius: 4, background: '#fff',
    marginBottom: 6, boxSizing: 'border-box' as const,
  },
  colorInputFull: { width: '100%', height: 32, border: '1px solid #d4d4d4', borderRadius: 4, padding: 0, cursor: 'pointer' },
  checkRow: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 },
  csvBtnRow: { display: 'flex', gap: 6, marginBottom: 6 },
  csvBtn: {
    flex: 1, padding: '6px 8px', fontSize: 11,
    background: '#fff', border: '1px solid #d4d4d4', borderRadius: 4,
    cursor: 'pointer', textAlign: 'center' as const, whiteSpace: 'nowrap' as const,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  resetBtn: {
    width: '100%', padding: '8px 12px', fontSize: 13,
    background: '#fff', border: '1px solid #d4d4d4', borderRadius: 4, cursor: 'pointer',
  },
  flowList: {
    display: 'flex', flexDirection: 'column' as const, gap: 6,
    maxHeight: 360, overflow: 'auto',
    border: '1px solid #e5e7eb', borderRadius: 4, padding: 6,
    background: '#fff',
  },
  empty: { fontSize: 11, color: '#9ca3af', textAlign: 'center' as const, padding: 10, lineHeight: 1.6 },
  flowRow: {
    display: 'flex', flexDirection: 'column' as const, gap: 4,
    padding: 6, background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 4,
  },
  flowRowHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  flowRowBody: { display: 'flex', alignItems: 'center', gap: 4 },
  flowDir: { fontSize: 11, fontWeight: 600, color: '#111', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  arrow: { fontSize: 11, color: '#6b7280' },
  miniSelect: {
    flex: 1, minWidth: 0, padding: '3px 4px', fontSize: 11,
    border: '1px solid #e5e7eb', borderRadius: 3,
  },
  miniInput: {
    flex: 1, minWidth: 0, padding: '3px 6px', fontSize: 11,
    border: '1px solid #e5e7eb', borderRadius: 3,
    boxSizing: 'border-box' as const,
  },
  iconBtn: {
    fontSize: 14, padding: '1px 7px', background: '#fff',
    border: '1px solid #d4d4d4', borderRadius: 4, cursor: 'pointer', lineHeight: 1,
  },
  clickHint: {
    position: 'absolute' as const, top: 20, left: '50%', transform: 'translateX(-50%)',
    background: '#1b2a4a', color: '#fff', padding: '8px 16px', borderRadius: 6,
    fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 20,
  },
  cancelBtn: {
    background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
    padding: '3px 10px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
  },
};
