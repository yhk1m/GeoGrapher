// © 2026. 양정고등학교 김용현. All Rights Reserved.
import { useState, useRef, useEffect } from 'react';
import { type GraphType, GRAPH_LABELS } from '../data/types';

interface HeaderProps {
  graphType: GraphType;
  onGraphTypeChange: (type: GraphType) => void;
  onExport: () => void;
  onToggleDrawer: () => void;
  drawerOpen: boolean;
}

const MENU_ITEMS: GraphType[] = [
  'guide',
  'climate', 'pyramid', 'ternary', 'stacked',
  'scatter', 'hythergraph', 'cube', 'radar',
];

export default function Header({
  graphType,
  onGraphTypeChange,
  onExport,
  onToggleDrawer,
  drawerOpen,
}: HeaderProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <header style={styles.header}>
      <div style={styles.logo}>GeoGrapher</div>

      <div style={{ flex: 1 }} />

      <div style={styles.actions}>
        <span style={styles.copyright}>
          © 2026. 양정고등학교 김용현. All Rights Reserved. | <a href="https://bgnl.kr" target="_blank" rel="noopener noreferrer" style={styles.copyrightLink}>https://bgnl.kr</a>
        </span>
        <button onClick={onToggleDrawer} style={styles.actionBtn} title={drawerOpen ? '드로어 닫기' : '드로어 열기'}>
          {drawerOpen ? '✕' : '☰'}
        </button>
        {/* 그래프 선택 드롭다운 */}
        <div ref={dropdownRef} style={styles.dropdownWrap}>
          <button onClick={() => setOpen((v) => !v)} style={styles.dropdownBtn}>
            {GRAPH_LABELS[graphType]}
            <span style={{ marginLeft: 6, fontSize: 10 }}>▼</span>
          </button>
          {open && (
            <div style={styles.dropdownMenu}>
              {MENU_ITEMS.map((type, idx) => (
                <div key={type}>
                  {idx === 1 && <div style={styles.separator} />}
                  <button
                    onClick={() => { onGraphTypeChange(type); setOpen(false); }}
                    style={{
                      ...styles.menuItem,
                      background: graphType === type ? '#1B2A4A' : '#fff',
                      color: graphType === type ? '#fff' : '#374151',
                    }}
                  >
                    {GRAPH_LABELS[type]}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={onExport} style={styles.exportBtn}>
          PNG
        </button>
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    height: 48,
    padding: '0 16px',
    background: '#1B2A4A',
    color: '#fff',
    gap: 12,
    flexShrink: 0,
  },
  logo: {
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: '-0.02em',
    whiteSpace: 'nowrap',
  },
  dropdownWrap: {
    position: 'relative' as const,
  },
  dropdownBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 14px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.25)',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  dropdownMenu: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    marginTop: 4,
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    padding: 4,
    zIndex: 200,
    minWidth: 180,
  },
  separator: {
    height: 1,
    background: '#E5E7EB',
    margin: '4px 8px',
  },
  menuItem: {
    display: 'block',
    width: '100%',
    padding: '8px 14px',
    borderRadius: 4,
    border: 'none',
    fontSize: 13,
    fontWeight: 500,
    textAlign: 'left' as const,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  copyright: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    whiteSpace: 'nowrap' as const,
  },
  copyrightLink: {
    color: '#fff',
    textDecoration: 'none',
  },
  actions: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  actionBtn: {
    color: '#fff',
    fontSize: 16,
    padding: '4px 8px',
    borderRadius: 4,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  exportBtn: {
    background: '#fff',
    color: '#1B2A4A',
    fontWeight: 700,
    fontSize: 13,
    padding: '6px 14px',
    borderRadius: 6,
    border: 'none',
    letterSpacing: '-0.01em',
    cursor: 'pointer',
  },
};
