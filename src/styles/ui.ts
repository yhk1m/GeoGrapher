// © 2026 김용현
import type { CSSProperties } from 'react';

/**
 * 화면 모양 (당토 디자인, 2026-11-18).
 *
 * 컴포넌트마다 `const styles = withUi({...})` 로 감싼다. 컴포넌트는 자리(폭, 여백, 줄 맞춤)만
 * 정하고, 색과 글자와 모서리는 여기서 같은 이름의 키(section, label, input ...)에 덧씌운다.
 * - 색 값(#1B2A4A 같은)은 global.css 의 토큰 이름으로 바꾼다.
 * - 글자는 12px 아래로 내리지 않고, 굵기는 400과 600 두 가지만 쓴다.
 * - 내보내는 그림에 들어가는 것(지도 범례, svg, canvas)은 건드리지 않는다. 종이 색 그대로여야 한다.
 */

type Styles = Record<string, CSSProperties>;

const INPUT: CSSProperties = {
  border: '1px solid var(--line-strong)',
  borderRadius: 'var(--r-control)',
  background: 'var(--surface)',
  color: 'var(--ink)',
  fontFamily: 'inherit',
  fontVariantNumeric: 'tabular-nums',
  fontSize: 13,
  outline: 'none',
};

const FIELD: CSSProperties = { ...INPUT, height: 36, padding: '0 10px' };
const CELL: CSSProperties = { ...INPUT, height: 30, padding: '0 6px', borderRadius: 6 };

/* 버튼 모양은 controls.css(SEED) 값을 따른다: 회색 단추 = .dt-btn--weak */
const ICON_BTN: CSSProperties = {
  width: 32,
  height: 32,
  minWidth: 32,
  padding: 0,
  borderRadius: 'var(--r-control)',
  border: 'none',
  background: 'var(--ctl-weak)',
  color: 'var(--ink)',
  fontSize: 16,
  fontWeight: 600,
  lineHeight: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const TONAL_BTN: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 36,
  padding: '0 14px',
  borderRadius: 'var(--r-control)',
  border: 'none',
  background: 'var(--ctl-weak)',
  color: 'var(--ink)',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.35,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
};

/** 세그먼트 길: 알약 모양 회색 길 (controls.css .dt-seg) */
export const SEG_TRACK: CSSProperties = {
  display: 'flex',
  gap: 0,
  padding: 4,
  borderRadius: 999,
  background: 'var(--ctl-weak)',
};

const LABEL: CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 };
const HINT: CSSProperties = { fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 };

/** 같은 이름의 키에 덧씌우는 모양 */
const PATCH: Styles = {
  heading: { fontSize: 16, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.2px' },
  section: {
    background: 'var(--surface)',
    borderRadius: 'var(--r-card)',
    padding: 16,
    marginBottom: 8,
    border: 'none',
    borderBottom: 'none',
  },
  label: LABEL,
  sectionTitle: LABEL,
  subLabel: { fontSize: 12, fontWeight: 600, color: 'var(--muted)' },
  hint: HINT,
  small: HINT,
  info: HINT,
  clickHint: HINT,
  empty: HINT,
  placeholder: HINT,
  sliderLabel: { fontSize: 12, color: 'var(--muted)' },
  sliderVal: { fontSize: 12, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' },
  input: FIELD,
  textInput: FIELD,
  labelInput: FIELD,
  itemNameInput: FIELD,
  colorInputFull: { ...INPUT, height: 36, padding: 2 },
  numInput: { ...INPUT, height: 32, padding: '0 8px' },
  unitInput: { ...INPUT, height: 32, padding: '0 8px' },
  cellInput: CELL,
  miniInput: CELL,
  select: FIELD,
  selectInput: FIELD,
  patternSelect: CELL,
  miniSelect: CELL,
  smallBtn: ICON_BTN,
  smallFootnoteBtn: ICON_BTN,
  iconBtn: ICON_BTN,
  sortBtn: { color: 'var(--muted)' },
  csvBtn: TONAL_BTN,
  resetBtn: TONAL_BTN,
  addBtn: TONAL_BTN,
  modeGroup: SEG_TRACK,
  modeBtn: {
    flex: 1,
    minWidth: 0,
    height: 'auto',
    minHeight: 34,
    padding: '6px 8px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.35,
    whiteSpace: 'nowrap',
    transition: 'background-color 150ms ease, color 150ms ease, box-shadow 150ms ease',
  },
  toggleRow: { fontSize: 13, color: 'var(--ink)' },
  checkRow: { fontSize: 13, color: 'var(--ink)' },
  checkboxRow: { fontSize: 13, color: 'var(--ink)' },
  radio: { fontSize: 13, color: 'var(--ink)' },
  th: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--muted)',
    borderBottom: '1px solid var(--line-strong)',
  },
  td: { borderBottom: '1px solid var(--line)' },
  toolPanel: { background: 'var(--bg)' },
};

/** 내보내는 그림에 들어가는 키. 종이라서 토큰을 쓰지 않는다 */
const PAPER = /^(legend|svg$|canvas$|container$|previewCanvas$|canvasArea$)/;

const COLOR: Record<string, string> = {
  '#1b2a4a': 'var(--accent)',
  '#111827': 'var(--ink)',
  '#111111': 'var(--ink)',
  '#111': 'var(--ink)',
  '#1e293b': 'var(--ink)',
  '#374151': 'var(--text)',
  '#334155': 'var(--text)',
  '#6b7280': 'var(--muted)',
  '#64748b': 'var(--muted)',
  '#737373': 'var(--muted)',
  '#9ca3af': 'var(--muted)',
  '#a3a3a3': 'var(--muted)',
  '#d1d5db': 'var(--line-strong)',
  '#d4d4d4': 'var(--line-strong)',
  '#ccc': 'var(--line-strong)',
  '#e5e7eb': 'var(--line-strong)',
  '#f3f4f6': 'var(--fill)',
  '#f5f5f5': 'var(--fill)',
  '#fafafa': 'var(--fill)',
  '#f8f9fa': 'var(--bg)',
  '#dc2626': 'var(--critical)',
  '#b91c1c': 'var(--critical)',
  '#991b1b': 'var(--critical)',
  '#fecaca': 'var(--critical-weak)',
  '#2563eb': 'var(--accent)',
};

function mapColors(v: string, prop: string): string {
  return v.replace(/#[0-9a-fA-F]{3,6}\b/g, (hex) => {
    const h = hex.toLowerCase();
    if (h === '#fff' || h === '#ffffff') return prop === 'color' ? 'var(--on-accent)' : 'var(--surface)';
    // 표 칸 사이 옅은 선
    if (h === '#f3f4f6' && prop.startsWith('border')) return 'var(--line)';
    return COLOR[h] ?? hex;
  });
}

function tidy(style: CSSProperties): CSSProperties {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(style)) {
    if (k === 'fontSize' && typeof v === 'number' && v < 12) out[k] = 12;
    else if (k === 'fontWeight' && (v === 500 || v === '500')) out[k] = 400;
    else if (k === 'fontWeight' && (v === 700 || v === 'bold' || v === '700')) out[k] = 600;
    else if (k === 'fontFamily' && typeof v === 'string' && v.includes('JetBrains')) out[k] = 'inherit';
    else if (typeof v === 'string') out[k] = mapColors(v, k);
    else out[k] = v;
  }
  return out as CSSProperties;
}

export function withUi<T extends Styles>(styles: T): T {
  const out: Styles = {};
  for (const [key, style] of Object.entries(styles)) {
    if (PAPER.test(key)) { out[key] = style; continue; }
    out[key] = { ...tidy(style), ...(PATCH[key] ?? {}) };
  }
  return out as T;
}

/**
 * 세그먼트(SEG_TRACK 안의 칸)의 고른 칸과 안 고른 칸 (controls.css .dt-seg).
 * 고른 칸은 떠 있는 흰 면 + 1px 선, 안 고른 칸은 흐린 굵은 글자.
 */
export function seg(selected: boolean): CSSProperties {
  return selected
    ? { border: 'none', borderRadius: 999, fontWeight: 600, background: 'var(--surface-raised)', color: 'var(--ink)', boxShadow: 'inset 0 0 0 1px var(--line), 0 1px 2px rgba(16, 24, 40, .06)' }
    : { border: 'none', borderRadius: 999, fontWeight: 600, background: 'transparent', color: 'var(--muted)', boxShadow: 'none' };
}

/**
 * 칩 (controls.css .dt-chip, 작은 것 32). 여러 개 중 하나를 고르는 탭 줄에 쓴다.
 * 고른 칩은 진한 회색 채움(주색이 아님), 안 고른 칩은 반투명 회색.
 */
export function chip(selected: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    padding: '0 10px',
    border: 'none',
    borderRadius: 999,
    fontSize: 13,
    lineHeight: 1.35,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    fontWeight: selected ? 600 : 400,
    background: selected ? 'var(--ink)' : 'var(--ctl-weak)',
    color: selected ? 'var(--surface)' : 'var(--ink)',
  };
}
