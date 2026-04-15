// © 2026 김용현
// 도형표현도 에디터
import { useCallback, useEffect, useMemo, useState } from 'react';
import SymbolMapCanvas from './SymbolMapCanvas';
import {
  type SymbolMapState,
  type SymbolKind,
  type SymbolSizeMode,
  type MapUnit,
  type FillMode,
  type PatternKind,
  type ItemDef,
  type RegionProps,
  MAP_UNIT_LABELS,
  MAP_UNIT_FILES,
  SYMBOL_KIND_LABELS,
  FILL_MODE_LABELS,
  PATTERN_LABELS,
  PATTERN_ORDER,
  createDefaultSymbolMapState,
  createDefaultItem,
} from './types';

type GeoFC = import('geojson').FeatureCollection<import('geojson').Geometry, RegionProps>;
const geoCache = new Map<MapUnit, GeoFC>();

export default function SymbolMapEditor() {
  const [state, setState] = useState<SymbolMapState>(createDefaultSymbolMapState);
  const [legendPos, setLegendPos] = useState({ x: 16, y: 16 });
  const [legendScale, setLegendScale] = useState(1);
  const [legendWidthOverride, setLegendWidthOverride] = useState<number | null>(null);
  const [regions, setRegions] = useState<{ code: string; name: string }[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sortedRegions = useMemo(() => {
    const arr = [...regions];
    arr.sort((a, b) =>
      sortOrder === 'asc'
        ? a.name.localeCompare(b.name, 'ko')
        : b.name.localeCompare(a.name, 'ko'),
    );
    return arr;
  }, [regions, sortOrder]);

  // 현재 unit의 지역 목록 로드 (데이터 테이블 행용)
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
    if (Object.keys(state.data).length > 0) {
      if (!window.confirm('행정구역 단위를 바꾸면 입력한 데이터가 초기화됩니다. 계속할까요?')) return;
    }
    setState((s) => ({ ...s, unit, data: {}, positionOverrides: {} }));
  };

  const handleAddItem = () => {
    setState((s) => {
      if (s.items.length >= 8) return s;
      const newItem = createDefaultItem(s.items.length);
      return { ...s, items: [...s.items, newItem] };
    });
  };
  const handleRemoveItem = (idx: number) => {
    setState((s) => {
      if (s.items.length <= 2) return s;
      const items = s.items.filter((_, i) => i !== idx);
      const data: Record<string, number[]> = {};
      for (const [k, v] of Object.entries(s.data)) {
        data[k] = v.filter((_, i) => i !== idx);
      }
      return { ...s, items, data };
    });
  };
  const handleItemChange = (idx: number, patch: Partial<ItemDef>) => {
    setState((s) => ({
      ...s,
      items: s.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));
  };

  const handleCellChange = (code: string, itemIdx: number, value: string) => {
    const num = value === '' ? 0 : Number(value);
    if (!isFinite(num)) return;
    setState((s) => {
      const row = [...(s.data[code] ?? Array(s.items.length).fill(0))];
      while (row.length < s.items.length) row.push(0);
      row[itemIdx] = num;
      return { ...s, data: { ...s.data, [code]: row } };
    });
  };

  const handleClearData = () => {
    if (!window.confirm('입력한 모든 데이터를 삭제할까요?')) return;
    setState((s) => ({ ...s, data: {}, positionOverrides: {} }));
  };

  // CSV 템플릿 다운로드
  const handleDownloadCsvTemplate = () => {
    const header = ['지역코드', '지역명', ...state.items.map((it) => it.name)];
    const rows = regions.map((r) => [r.code, r.name, ...state.items.map(() => '')]);
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GeoGrapher_도형표현도_템플릿_${state.unit}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV 업로드
  const handleUploadCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      try {
        const parsed = parseCsv(text);
        const result = applyCsvToData(parsed, regions, state.items);
        if (result.matched === 0) {
          alert(
            'CSV에서 일치하는 지역을 찾지 못했습니다.\n' +
            '첫 번째 열은 지역코드 또는 지역명이어야 합니다.',
          );
          return;
        }
        setState((s) => ({ ...s, data: result.data }));
        const msg = `${result.matched}개 지역 데이터 반영 완료.` +
          (result.unmatched.length > 0
            ? `\n\n매칭 실패 (${result.unmatched.length}건):\n${result.unmatched.slice(0, 10).join(', ')}${result.unmatched.length > 10 ? ' …' : ''}`
            : '');
        alert(msg);
      } catch (err) {
        alert('CSV 파싱 실패: ' + (err instanceof Error ? err.message : String(err)));
      }
    };
    reader.onerror = () => alert('파일을 읽을 수 없습니다.');
    reader.readAsText(file, 'utf-8');
  };

  const handleSymbolDragEnd = useCallback((code: string, dx: number, dy: number) => {
    setState((s) => ({
      ...s,
      positionOverrides: { ...s.positionOverrides, [code]: { dx, dy } },
    }));
  }, []);

  return (
    <div style={styles.wrap}>
      <main style={styles.canvasArea}>
        <SymbolMapCanvas
          state={state}
          legendPos={legendPos}
          onLegendPosChange={setLegendPos}
          legendScale={legendScale}
          legendWidthOverride={legendWidthOverride}
          onSymbolDragEnd={handleSymbolDragEnd}
        />
      </main>

      <aside style={styles.toolPanel}>
        <Section title="행정구역 단위">
          <select
            value={state.unit}
            onChange={(e) => handleUnitChange(e.target.value as MapUnit)}
            style={styles.select}
          >
            {(Object.keys(MAP_UNIT_LABELS) as MapUnit[]).map((u) => (
              <option key={u} value={u}>{MAP_UNIT_LABELS[u]}</option>
            ))}
          </select>
        </Section>

        <Section title="심볼 종류">
          <select
            value={state.symbolKind}
            onChange={(e) => setState((s) => ({ ...s, symbolKind: e.target.value as SymbolKind }))}
            style={styles.select}
          >
            {(Object.keys(SYMBOL_KIND_LABELS) as SymbolKind[]).map((k) => (
              <option key={k} value={k}>{SYMBOL_KIND_LABELS[k]}</option>
            ))}
          </select>
        </Section>

        <Section title="채우기 모드">
          <select
            value={state.fillMode}
            onChange={(e) => setState((s) => ({ ...s, fillMode: e.target.value as FillMode }))}
            style={styles.select}
          >
            {(Object.keys(FILL_MODE_LABELS) as FillMode[]).map((m) => (
              <option key={m} value={m}>{FILL_MODE_LABELS[m]}</option>
            ))}
          </select>
        </Section>

        {state.symbolKind === 'pie' && (
          <>
            <Section title="크기 모드">
              <select
                value={state.sizeMode}
                onChange={(e) => setState((s) => ({ ...s, sizeMode: e.target.value as SymbolSizeMode }))}
                style={styles.select}
              >
                <option value="uniform">균일</option>
                <option value="proportional">총합 비례</option>
              </select>
            </Section>
            {state.sizeMode === 'uniform' ? (
              <Section title={`반지름: ${state.baseRadius}px`}>
                <input
                  type="range"
                  min={8}
                  max={60}
                  value={state.baseRadius}
                  onChange={(e) => setState((s) => ({ ...s, baseRadius: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </Section>
            ) : (
              <>
                <Section title={`최소 반지름: ${state.minRadius}px`}>
                  <input type="range" min={4} max={30} value={state.minRadius}
                    onChange={(e) => setState((s) => ({ ...s, minRadius: Number(e.target.value) }))}
                    style={{ width: '100%' }} />
                </Section>
                <Section title={`최대 반지름: ${state.maxRadius}px`}>
                  <input type="range" min={20} max={80} value={state.maxRadius}
                    onChange={(e) => setState((s) => ({ ...s, maxRadius: Number(e.target.value) }))}
                    style={{ width: '100%' }} />
                </Section>
              </>
            )}
          </>
        )}

        {state.symbolKind === 'bar' && (
          <>
            <Section title={`막대 최대 높이: ${state.barMaxHeight}px`}>
              <input type="range" min={20} max={100} value={state.barMaxHeight}
                onChange={(e) => setState((s) => ({ ...s, barMaxHeight: Number(e.target.value) }))}
                style={{ width: '100%' }} />
            </Section>
            <Section title={`막대 너비: ${state.barWidth}px`}>
              <input type="range" min={3} max={20} value={state.barWidth}
                onChange={(e) => setState((s) => ({ ...s, barWidth: Number(e.target.value) }))}
                style={{ width: '100%' }} />
            </Section>
          </>
        )}

        <Section>
          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={state.showValueLabels}
              onChange={(e) => setState((s) => ({ ...s, showValueLabels: e.target.checked }))}
            />
            <span>값 표시</span>
          </label>
        </Section>

        <Section title="항목">
          <div style={styles.itemList}>
            {state.items.map((it, i) => (
              <ItemRow
                key={i}
                index={i}
                item={it}
                fillMode={state.fillMode}
                canRemove={state.items.length > 2}
                onChange={(p) => handleItemChange(i, p)}
                onRemove={() => handleRemoveItem(i)}
              />
            ))}
          </div>
          {state.items.length < 8 && (
            <button onClick={handleAddItem} style={styles.addBtn}>+ 항목 추가</button>
          )}
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
          <input type="text" placeholder="제목 (예: 산업 구조)" value={state.legendTitle}
            onChange={(e) => setState((s) => ({ ...s, legendTitle: e.target.value }))} style={styles.input} />
          <input type="text" placeholder="단위 (예: %)" value={state.legendUnit}
            onChange={(e) => setState((s) => ({ ...s, legendUnit: e.target.value }))} style={styles.input} />
          <input type="text" placeholder="출처 (예: 통계청, 2024)" value={state.legendSource}
            onChange={(e) => setState((s) => ({ ...s, legendSource: e.target.value }))} style={styles.input} />
        </Section>

        <Section title="데이터 입력">
          <div style={styles.hint}>
            빈 칸은 0으로 처리. 심볼 드래그로 위치 미세 조정 가능.
          </div>
          <div style={styles.csvBtnRow}>
            <button
              onClick={handleDownloadCsvTemplate}
              style={styles.csvBtn}
              title="현재 지역/항목으로 빈 CSV 템플릿 다운로드"
            >
              CSV 템플릿 다운로드
            </button>
            <label style={styles.csvBtn} title=".csv 파일을 올려 데이터 일괄 입력">
              CSV 불러오기
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadCsv(f);
                  e.target.value = '';
                }}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <DataTable
            regions={sortedRegions}
            items={state.items}
            data={state.data}
            onCellChange={handleCellChange}
            sortOrder={sortOrder}
            onToggleSort={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
          />
          <button onClick={handleClearData} style={{ ...styles.resetBtn, marginTop: 8 }}>
            데이터 삭제
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

function ItemRow({
  index,
  item,
  fillMode,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  item: ItemDef;
  fillMode: FillMode;
  canRemove: boolean;
  onChange: (p: Partial<ItemDef>) => void;
  onRemove: () => void;
}) {
  const showPattern = fillMode === 'pattern' || fillMode === 'color_pattern';
  return (
    <div style={styles.itemRow}>
      <div style={styles.itemRowTop}>
        <span style={styles.itemNum}>{index + 1}</span>
        <input
          type="color"
          value={item.color}
          onChange={(e) => onChange({ color: e.target.value })}
          style={styles.colorInput}
          title="색상"
        />
        <input
          type="text"
          value={item.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={`항목 ${index + 1}`}
          style={styles.itemNameInput}
        />
        {canRemove && (
          <button onClick={onRemove} style={styles.iconBtn} title="삭제">×</button>
        )}
      </div>
      {showPattern && (
        <select
          value={item.pattern}
          onChange={(e) => onChange({ pattern: e.target.value as PatternKind })}
          style={styles.patternSelect}
        >
          {PATTERN_ORDER.map((p) => (
            <option key={p} value={p}>{PATTERN_LABELS[p]}</option>
          ))}
        </select>
      )}
    </div>
  );
}

function DataTable({
  regions,
  items,
  data,
  onCellChange,
  sortOrder,
  onToggleSort,
}: {
  regions: { code: string; name: string }[];
  items: ItemDef[];
  data: Record<string, number[]>;
  onCellChange: (code: string, itemIdx: number, value: string) => void;
  sortOrder: 'asc' | 'desc';
  onToggleSort: () => void;
}) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.thRegion}>
              <button
                type="button"
                onClick={onToggleSort}
                style={styles.sortBtn}
                title={sortOrder === 'asc' ? '오름차순 (가나다) — 클릭 시 내림차순' : '내림차순 — 클릭 시 오름차순'}
              >
                지역 {sortOrder === 'asc' ? '▲' : '▼'}
              </button>
            </th>
            {items.map((it, i) => (
              <th key={i} style={styles.th} title={it.name}>
                {it.name.length > 6 ? it.name.slice(0, 6) + '…' : it.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {regions.map((r) => (
            <tr key={r.code}>
              <td style={styles.tdRegion} title={r.name}>
                {r.name.length > 8 ? r.name.slice(0, 8) + '…' : r.name}
              </td>
              {items.map((_, i) => (
                <td key={i} style={styles.tdCell}>
                  <input
                    type="number"
                    value={data[r.code]?.[i] ?? ''}
                    onChange={(e) => onCellChange(r.code, i, e.target.value)}
                    style={styles.cellInput}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
    top: 0,
    left: 0,
    right: 320,
    bottom: 0,
    display: 'flex',
    background: '#fff',
    overflow: 'hidden',
    padding: 12,
    boxSizing: 'border-box' as const,
  },
  toolPanel: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bottom: 0,
    width: 320,
    padding: 16,
    borderLeft: '1px solid #e5e7eb',
    background: '#fafafa',
    overflow: 'auto',
    boxSizing: 'border-box' as const,
  },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 },
  select: {
    width: '100%', padding: '6px 8px', fontSize: 13,
    border: '1px solid #d4d4d4', borderRadius: 4, background: '#fff',
    boxSizing: 'border-box' as const,
  },
  input: {
    width: '100%', padding: '6px 8px', fontSize: 13,
    border: '1px solid #d4d4d4', borderRadius: 4, background: '#fff',
    marginBottom: 6, boxSizing: 'border-box' as const,
  },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 },
  hint: { fontSize: 11, color: '#737373', marginBottom: 8, lineHeight: 1.5 },
  itemList: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  itemRow: {
    display: 'flex', flexDirection: 'column' as const, gap: 4,
    padding: 6, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4,
  },
  itemRowTop: { display: 'flex', alignItems: 'center', gap: 6 },
  itemNum: { fontSize: 12, fontWeight: 700, color: '#374151', width: 14 },
  colorInput: { width: 32, height: 24, border: '1px solid #d4d4d4', borderRadius: 4, padding: 0, cursor: 'pointer' },
  itemNameInput: {
    flex: 1, minWidth: 0, padding: '4px 6px', fontSize: 12,
    border: '1px solid #e5e7eb', borderRadius: 3, boxSizing: 'border-box' as const,
  },
  iconBtn: {
    fontSize: 14, padding: '1px 7px', background: '#fff',
    border: '1px solid #d4d4d4', borderRadius: 4, cursor: 'pointer', lineHeight: 1,
  },
  patternSelect: {
    width: '100%', padding: '3px 6px', fontSize: 12,
    border: '1px solid #e5e7eb', borderRadius: 3, background: '#fff',
    boxSizing: 'border-box' as const,
  },
  addBtn: {
    width: '100%', padding: '6px 12px', fontSize: 12, marginTop: 6,
    background: '#fff', border: '1px dashed #a3a3a3', borderRadius: 4, cursor: 'pointer',
  },
  resetBtn: {
    width: '100%', padding: '8px 12px', fontSize: 13,
    background: '#fff', border: '1px solid #d4d4d4', borderRadius: 4, cursor: 'pointer',
  },
  csvBtnRow: {
    display: 'flex', gap: 6, marginBottom: 8,
  },
  csvBtn: {
    flex: 1, padding: '6px 8px', fontSize: 11,
    background: '#fff', border: '1px solid #d4d4d4', borderRadius: 4,
    cursor: 'pointer', textAlign: 'center' as const, whiteSpace: 'nowrap' as const,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
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
    minWidth: 70,
  },
  sortBtn: {
    background: 'transparent', border: 'none', padding: 0, margin: 0,
    fontSize: 11, fontWeight: 600, color: '#111', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 4,
  },
  tdRegion: {
    padding: '2px 6px', fontSize: 11, borderRight: '1px solid #f3f4f6',
    borderBottom: '1px solid #f3f4f6', background: '#fafafa',
    whiteSpace: 'nowrap' as const,
  },
  tdCell: { padding: 0, borderBottom: '1px solid #f3f4f6', borderRight: '1px solid #f3f4f6' },
  cellInput: {
    width: '100%', padding: '3px 4px', fontSize: 11,
    border: 'none', background: 'transparent', fontFamily: 'monospace',
    boxSizing: 'border-box' as const, textAlign: 'right' as const,
  },
};

// ─────────────────────────────────────────────────────────
// CSV 유틸

function csvEscape(value: string | number): string {
  const s = String(value ?? '');
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// 간단한 CSV 파서: 따옴표 이스케이프, 줄바꿈 처리
function parseCsv(text: string): string[][] {
  // BOM 제거
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
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\r') { /* skip */ }
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
}

// CSV 행들을 data 맵으로 변환. 첫 번째 컬럼이 코드/지역명, 이후는 항목별 값.
// 헤더 행을 지역명/항목명과 매칭해 컬럼 순서를 맞춤.
function applyCsvToData(
  rows: string[][],
  regions: { code: string; name: string }[],
  items: ItemDef[],
): { data: Record<string, number[]>; matched: number; unmatched: string[] } {
  if (rows.length < 2) return { data: {}, matched: 0, unmatched: [] };
  const header = rows[0].map((h) => h.trim());
  // 지역 식별용 매핑
  const byCode = new Map(regions.map((r) => [r.code, r]));
  const byName = new Map(regions.map((r) => [r.name.trim(), r]));

  // 헤더에서 항목명 컬럼 인덱스 찾기. 못 찾으면 순서대로.
  const itemColIdx: number[] = items.map((it) => {
    const found = header.findIndex((h, hi) => hi > 0 && h.trim() === it.name.trim());
    return found >= 0 ? found : -1;
  });
  const unmatchedItems = itemColIdx.filter((v) => v === -1).length;
  // 모든 항목 컬럼을 못 찾으면 "지역명 다음부터 순서대로"로 fallback
  const useFallbackOrder = unmatchedItems === items.length;

  const data: Record<string, number[]> = {};
  let matched = 0;
  const unmatched: string[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0) continue;
    const key = row[0]?.trim() ?? '';
    if (!key) continue;
    let region = byCode.get(key) ?? byName.get(key);
    // 2번째 컬럼도 지역명일 수 있음 (템플릿 구조 code,name,...)
    if (!region && row.length > 1) {
      const alt = row[1]?.trim() ?? '';
      region = byName.get(alt);
    }
    if (!region) {
      unmatched.push(key);
      continue;
    }
    // 값 컬럼 시작 위치: 템플릿(code,name,...) 또는 (code,...) 감지
    const valueStartCol = header[1]?.trim() === '지역명' || header[1]?.trim() === 'name' ? 2 : 1;
    const vals: number[] = [];
    for (let i = 0; i < items.length; i++) {
      const colIdx = useFallbackOrder ? valueStartCol + i : itemColIdx[i];
      const raw = colIdx >= 0 ? row[colIdx] : '';
      const num = raw === undefined || raw === '' ? 0 : Number(String(raw).replace(/,/g, ''));
      vals.push(isFinite(num) ? num : 0);
    }
    data[region.code] = vals;
    matched++;
  }
  return { data, matched, unmatched };
}
