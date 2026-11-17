// © 2026. 양정고등학교 김용현. All Rights Reserved.
import { useState, useRef, useEffect } from 'react';
import { type GraphType, GRAPH_LABELS } from '../data/types';

// Apps Script 웹앱 URL (배포 후 여기에 붙여넣기)
const VIEW_COUNTER_URL = 'https://script.google.com/macros/s/AKfycbz6Vhkw46y15Sqly7008IeVVEZMzaseLZzqerygPe-iozo_RuG6UwjHngTcYpcHUF_dUA/exec';

interface HeaderProps {
  graphType: GraphType;
  onGraphTypeChange: (type: GraphType) => void;
  onExport: () => void;
  onToggleDrawer: () => void;
  drawerOpen: boolean;
}

const MENU_ITEMS: GraphType[] = [
  'guide',
  'climate', 'pyramid', 'ternary', 'stacked', 'absbar', 'line',
  'scatter', 'hythergraph', 'cube', 'radar',
  'choropleth', 'symbolmap', 'isoline', 'flowmap',
];

const MAP_SECTION_START: GraphType = 'choropleth';

export default function Header({
  graphType,
  onGraphTypeChange,
  onExport,
  onToggleDrawer,
  drawerOpen,
}: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [viewCount, setViewCount] = useState<{ today: number; total: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 뷰 카운터
  useEffect(() => {
    if (!VIEW_COUNTER_URL) return;
    fetch(VIEW_COUNTER_URL)
      .then((r) => r.json())
      .then((data) => setViewCount(data))
      .catch(() => {});
  }, []);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const icon = (d: string, size = 18) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden dangerouslySetInnerHTML={{ __html: d }} />
  );

  return (
    <header style={styles.header}>
      <div style={styles.logo}>GeoGrapher</div>
      {viewCount && (
        <span style={styles.viewCount}>
          오늘 <strong style={styles.viewNum}>{viewCount.today.toLocaleString()}</strong>
          <span style={{ marginLeft: 8 }}>전체</span> <strong style={styles.viewNum}>{viewCount.total.toLocaleString()}</strong>
        </span>
      )}

      <div style={{ flex: 1 }} />

      <div style={styles.actions}>
        <span style={styles.copyright}>
          © 2026. 양정고등학교 김용현. All Rights Reserved. <a href="https://bgnl.kr" target="_blank" rel="noopener noreferrer" style={styles.copyrightLink}>bgnl.kr</a>
        </span>
        {/* 그래프 고르기 */}
        <div ref={dropdownRef} style={styles.dropdownWrap}>
          <button
            onClick={() => setOpen((v) => !v)}
            style={styles.dropdownBtn}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            {GRAPH_LABELS[graphType]}
            <span style={{ display: 'inline-flex', transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 150ms ease' }}>
              {icon('<polyline points="6 9 12 15 18 9"/>', 16)}
            </span>
          </button>
          {open && (
            <div style={styles.dropdownMenu} role="menu">
              {MENU_ITEMS.map((type, idx) => (
                <div key={type}>
                  {idx === 1 && <div style={styles.groupTitle}>그래프</div>}
                  {type === MAP_SECTION_START && <div style={styles.groupTitle}>지도</div>}
                  <button
                    role="menuitemradio"
                    aria-checked={graphType === type}
                    onClick={() => { onGraphTypeChange(type); setOpen(false); }}
                    style={{ ...styles.menuItem, ...(graphType === type ? styles.menuItemOn : null) }}
                    className="gg-menu-item"
                  >
                    <span style={{ flex: 1 }}>{GRAPH_LABELS[type]}</span>
                    {graphType === type && icon('<polyline points="20 6 9 17 4 12"/>', 16)}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onToggleDrawer}
          style={styles.actionBtn}
          className="gg-on-brand"
          title={drawerOpen ? '입력 칸 닫기' : '입력 칸 열기'}
          aria-label={drawerOpen ? '입력 칸 닫기' : '입력 칸 열기'}
          aria-pressed={drawerOpen}
        >
          {icon('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>')}
        </button>
        <button onClick={onExport} style={styles.exportBtn}>
          {icon('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', 16)}
          PNG 저장
        </button>
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    height: 52,
    padding: '0 16px',
    background: 'var(--brand)',
    color: 'var(--on-brand)',
    gap: 16,
    flexShrink: 0,
  },
  logo: {
    fontWeight: 600,
    fontSize: 17,
    letterSpacing: '-0.3px',
    whiteSpace: 'nowrap',
  },
  viewCount: {
    fontSize: 12,
    color: 'var(--on-brand-muted)',
    whiteSpace: 'nowrap',
  },
  viewNum: {
    fontWeight: 600,
    color: 'var(--on-brand)',
    fontVariantNumeric: 'tabular-nums',
  },
  copyright: {
    fontSize: 12,
    color: 'var(--on-brand-muted)',
    whiteSpace: 'nowrap',
  },
  copyrightLink: {
    color: 'var(--on-brand)',
    textDecoration: 'none',
    marginLeft: 4,
  },
  actions: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  dropdownWrap: {
    position: 'relative',
  },
  dropdownBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    height: 36,
    padding: '0 10px 0 14px',
    borderRadius: 'var(--r-control)',
    background: 'rgba(255,255,255,0.12)',
    color: 'var(--on-brand)',
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 6,
    background: 'var(--surface)',
    borderRadius: 'var(--r-card)',
    boxShadow: 'var(--shadow-3), 0 0 0 1px var(--line)',
    padding: 4,
    zIndex: 200,
    minWidth: 220,
    maxHeight: 'calc(100vh - 72px)',
    overflowY: 'auto',
  },
  groupTitle: {
    padding: '10px 10px 4px',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--muted)',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    minHeight: 34,
    padding: '0 10px',
    borderRadius: 6,
    fontSize: 13,
    color: 'var(--ink)',
    textAlign: 'left',
    whiteSpace: 'nowrap',
  },
  menuItemOn: {
    background: 'var(--accent-weak)',
    color: 'var(--accent-text)',
    fontWeight: 600,
  },
  actionBtn: {
    width: 36,
    height: 36,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--r-control)',
    color: 'var(--on-brand)',
  },
  exportBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 36,
    padding: '0 14px',
    borderRadius: 'var(--r-control)',
    background: 'var(--on-brand)',
    color: 'var(--brand)',
    fontWeight: 600,
    fontSize: 13,
    whiteSpace: 'nowrap',
  },
};
