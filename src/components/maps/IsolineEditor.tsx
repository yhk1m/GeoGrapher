// © 2026 김용현
// 등치선도 에디터
import { useEffect, useState } from 'react';
import IsolineCanvas from './IsolineCanvas';
import {
  type IsolineState,
  type MapUnit,
  type PaletteKind,
  type RegionProps,
  MAP_UNIT_LABELS,
  MAP_UNIT_FILES,
  PALETTE_LABELS,
  createDefaultIsolineState,
} from './types';

type GeoFC = import('geojson').FeatureCollection<import('geojson').Geometry, RegionProps>;
const geoCache = new Map<MapUnit, GeoFC>();

export default function IsolineEditor() {
  const [state, setState] = useState<IsolineState>(createDefaultIsolineState);
  const [legendPos, setLegendPos] = useState({ x: 16, y: 16 });
  const [legendScale, setLegendScale] = useState(1);
  const [legendWidthOverride, setLegendWidthOverride] = useState<number | null>(null);
  const [regions, setRegions] = useState<{ code: string; name: string }[]>([]);

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

  const handleUnitChange = (unit: MapUnit) => {
    if (Object.keys(state.values).length > 0) {
      if (!window.confirm('행정구역 단위를 바꾸면 입력한 값이 초기화됩니다. 계속할까요?')) return;
    }
    setState((s) => ({ ...s, unit, values: {} }));
  };

  const handleValueChange = (code: string, value: string) => {
    if (value === '') {
      setState((s) => {
        const next = { ...s.values };
        delete next[code];
        return { ...s, values: next };
      });
      return;
    }
    const num = Number(value);
    if (!isFinite(num)) return;
    setState((s) => ({ ...s, values: { ...s.values, [code]: num } }));
  };

  const handleClearValues = () => {
    if (!window.confirm('입력한 모든 값을 삭제할까요?')) return;
    setState((s) => ({ ...s, values: {} }));
  };

  const handleDownloadCsvTemplate = () => {
    const rows: string[][] = [['지역코드', '지역명', '값']];
    for (const r of regions) rows.push([r.code, r.name, '']);
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GeoGrapher_등치선도_템플릿_${state.unit}.csv`;
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
      const values: Record<string, number> = {};
      let matched = 0;
      const unmatched: string[] = [];
      // 헤더 무시, 첫 컬럼=식별, 마지막 숫자 컬럼=값
      for (let i = 1; i < parsed.length; i++) {
        const row = parsed[i];
        if (!row.length) continue;
        const key = row[0]?.trim() ?? '';
        if (!key) continue;
        const region = byCode.get(key) ?? byName.get(key);
        if (!region) {
          unmatched.push(key);
          continue;
        }
        // 값 컬럼: 헤더 "값"이 있는 위치 우선, 아니면 마지막 컬럼
        const rawVal = row[row.length - 1]?.toString().replace(/,/g, '') ?? '';
        const num = Number(rawVal);
        if (isFinite(num) && rawVal !== '') {
          values[region.code] = num;
          matched++;
        }
      }
      if (matched === 0) {
        alert('CSV에서 매칭되는 데이터를 찾지 못했습니다.');
        return;
      }
      setState((s) => ({ ...s, values }));
      alert(`${matched}개 지역 값 반영.${unmatched.length ? `\n매칭 실패: ${unmatched.slice(0, 10).join(', ')}${unmatched.length > 10 ? ' …' : ''}` : ''}`);
    };
    reader.readAsText(file, 'utf-8');
  };

  return (
    <div style={styles.wrap}>
      <main style={styles.canvasArea}>
        <IsolineCanvas
          state={state}
          legendPos={legendPos}
          onLegendPosChange={setLegendPos}
          legendScale={legendScale}
          legendWidthOverride={legendWidthOverride}
        />
      </main>

      <aside style={styles.toolPanel}>
        <Section title="행정구역 단위">
          <select value={state.unit} onChange={(e) => handleUnitChange(e.target.value as MapUnit)} style={styles.select}>
            {(Object.keys(MAP_UNIT_LABELS) as MapUnit[]).map((u) => (
              <option key={u} value={u}>{MAP_UNIT_LABELS[u]}</option>
            ))}
          </select>
          <div style={styles.hint}>각 지역 중심점에 할당된 값으로 보간합니다.</div>
        </Section>

        <Section title="간격 모드">
          <select
            value={state.intervalMode}
            onChange={(e) => setState((s) => ({ ...s, intervalMode: e.target.value as 'auto' | 'manual' }))}
            style={styles.select}
          >
            <option value="auto">자동 (단계 수 지정)</option>
            <option value="manual">수동 (간격 지정)</option>
          </select>
        </Section>

        {state.intervalMode === 'auto' ? (
          <Section title={`단계 수: ${state.levelCount}`}>
            <input type="range" min={3} max={10} value={state.levelCount}
              onChange={(e) => setState((s) => ({ ...s, levelCount: Number(e.target.value) }))}
              style={{ width: '100%' }} />
          </Section>
        ) : (
          <>
            <Section title="주곡선 간격">
              <input
                type="number"
                value={state.majorInterval}
                onChange={(e) => setState((s) => ({ ...s, majorInterval: Number(e.target.value) || 0 }))}
                style={styles.input}
                step={10}
                min={1}
              />
            </Section>
            <Section title={`간곡선 분할: ${state.minorSubdivisions}등분`}>
              <input type="range" min={0} max={5} value={state.minorSubdivisions}
                onChange={(e) => setState((s) => ({ ...s, minorSubdivisions: Number(e.target.value) }))}
                style={{ width: '100%' }} />
              <div style={styles.hint}>0=간곡선 없음. 2면 주곡선 사이에 1개 간곡선.</div>
            </Section>
          </>
        )}

        <Section title="스타일">
          <label style={styles.labelRow}>
            <span>선 색상</span>
            <input type="color" value={state.lineColor}
              onChange={(e) => setState((s) => ({ ...s, lineColor: e.target.value }))}
              style={styles.colorInput} />
          </label>
          <div style={styles.sectionTitle}>주곡선 두께: {state.majorLineWidth.toFixed(1)}px</div>
          <input type="range" min={0.5} max={3} step={0.1} value={state.majorLineWidth}
            onChange={(e) => setState((s) => ({ ...s, majorLineWidth: Number(e.target.value) }))}
            style={{ width: '100%' }} />
          <div style={styles.sectionTitle}>간곡선 두께: {state.minorLineWidth.toFixed(1)}px</div>
          <input type="range" min={0.3} max={2} step={0.1} value={state.minorLineWidth}
            onChange={(e) => setState((s) => ({ ...s, minorLineWidth: Number(e.target.value) }))}
            style={{ width: '100%' }} />
          <label style={styles.checkRow}>
            <input type="checkbox" checked={state.showLabels}
              onChange={(e) => setState((s) => ({ ...s, showLabels: e.target.checked }))} />
            <span>주곡선 값 표시</span>
          </label>
          <label style={styles.checkRow}>
            <input type="checkbox" checked={state.clipToBoundary}
              onChange={(e) => setState((s) => ({ ...s, clipToBoundary: e.target.checked }))} />
            <span>행정구역 경계로 자르기</span>
          </label>
        </Section>

        <Section title="채우기 (그라데이션)">
          <label style={styles.checkRow}>
            <input type="checkbox" checked={state.fillEnabled}
              onChange={(e) => setState((s) => ({ ...s, fillEnabled: e.target.checked }))} />
            <span>등치선 사이 색 채우기</span>
          </label>
          {state.fillEnabled && (
            <select value={state.fillPalette}
              onChange={(e) => setState((s) => ({ ...s, fillPalette: e.target.value as PaletteKind }))}
              style={styles.select}>
              {(Object.keys(PALETTE_LABELS) as PaletteKind[]).filter((p) => p !== 'custom').map((p) => (
                <option key={p} value={p}>{PALETTE_LABELS[p]}</option>
              ))}
            </select>
          )}
        </Section>

        <Section title="보간 설정">
          <div style={styles.sectionTitle}>IDW Power: {state.interpolationPower.toFixed(1)}</div>
          <input type="range" min={1} max={4} step={0.1} value={state.interpolationPower}
            onChange={(e) => setState((s) => ({ ...s, interpolationPower: Number(e.target.value) }))}
            style={{ width: '100%' }} />
          <div style={styles.hint}>값이 클수록 포인트 근처 영향력 강해짐.</div>
          <div style={styles.sectionTitle}>그리드 해상도: {state.gridResolution}</div>
          <input type="range" min={40} max={240} step={10} value={state.gridResolution}
            onChange={(e) => setState((s) => ({ ...s, gridResolution: Number(e.target.value) }))}
            style={{ width: '100%' }} />
          <div style={styles.hint}>높을수록 부드러우나 느려짐.</div>
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
          <input type="text" placeholder="제목 (예: 연 강수량)" value={state.legendTitle}
            onChange={(e) => setState((s) => ({ ...s, legendTitle: e.target.value }))} style={styles.input} />
          <input type="text" placeholder="단위 (예: mm)" value={state.legendUnit}
            onChange={(e) => setState((s) => ({ ...s, legendUnit: e.target.value }))} style={styles.input} />
          <input type="text" placeholder="출처 (예: 기상청, 2024)" value={state.legendSource}
            onChange={(e) => setState((s) => ({ ...s, legendSource: e.target.value }))} style={styles.input} />
        </Section>

        <Section title="지역별 값 입력">
          <div style={styles.csvBtnRow}>
            <button onClick={handleDownloadCsvTemplate} style={styles.csvBtn}>
              CSV 템플릿
            </button>
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
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thRegion}>지역</th>
                  <th style={styles.th}>값</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((r) => (
                  <tr key={r.code}>
                    <td style={styles.tdRegion} title={r.name}>
                      {r.name.length > 8 ? r.name.slice(0, 8) + '…' : r.name}
                    </td>
                    <td style={styles.tdCell}>
                      <input
                        type="number"
                        value={state.values[r.code] ?? ''}
                        onChange={(e) => handleValueChange(r.code, e.target.value)}
                        style={styles.cellInput}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleClearValues} style={{ ...styles.resetBtn, marginTop: 8 }}>
            값 삭제
          </button>
        </Section>
      </aside>
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
  hint: { fontSize: 11, color: '#737373', marginTop: 4, lineHeight: 1.5 },
  labelRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    fontSize: 12, marginBottom: 6,
  },
  checkRow: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginTop: 4 },
  colorInput: { width: 40, height: 24, border: '1px solid #d4d4d4', borderRadius: 4, padding: 0, cursor: 'pointer' },
  csvBtnRow: { display: 'flex', gap: 6, marginBottom: 8 },
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
  tableWrap: {
    border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'auto',
    maxHeight: 340, background: '#fff',
  },
  table: { width: '100%', fontSize: 11, borderCollapse: 'collapse' as const },
  th: {
    padding: '4px 6px', textAlign: 'center' as const, background: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb', fontSize: 11, fontWeight: 600,
    position: 'sticky' as const, top: 0,
  },
  thRegion: {
    padding: '4px 6px', textAlign: 'left' as const, background: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb',
    fontSize: 11, fontWeight: 600, position: 'sticky' as const, top: 0, left: 0,
  },
  tdRegion: {
    padding: '2px 6px', fontSize: 11, borderRight: '1px solid #f3f4f6',
    borderBottom: '1px solid #f3f4f6', background: '#fafafa',
    whiteSpace: 'nowrap' as const,
  },
  tdCell: { padding: 0, borderBottom: '1px solid #f3f4f6' },
  cellInput: {
    width: '100%', padding: '3px 4px', fontSize: 11,
    border: 'none', background: 'transparent', fontFamily: 'monospace',
    boxSizing: 'border-box' as const, textAlign: 'right' as const,
  },
};
