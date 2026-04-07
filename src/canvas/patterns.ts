// © 2026 김용현
// Canvas 패턴 생성 유틸리티

export type PatternType =
  | 'diagonal'
  | 'grid'
  | 'diagonalGrid'
  | 'dot'
  | 'dotReverse'
  | 'vertical'
  | 'horizontal';

const TILE = 10;

function makeTile(draw: (pctx: CanvasRenderingContext2D, s: number) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = TILE;
  c.height = TILE;
  const p = c.getContext('2d')!;
  // 기본 흰색 배경
  p.fillStyle = '#fff';
  p.fillRect(0, 0, TILE, TILE);
  draw(p, TILE);
  return c;
}

function createPatternCanvas(type: PatternType): HTMLCanvasElement {
  switch (type) {
    case 'diagonal':
      return makeTile((p, s) => {
        p.strokeStyle = '#000';
        p.lineWidth = 1.5;
        p.beginPath();
        // 사선 (/) 패턴 — 타일 이음새 처리
        p.moveTo(0, s);
        p.lineTo(s, 0);
        p.moveTo(-s * 0.5, s * 0.5);
        p.lineTo(s * 0.5, -s * 0.5);
        p.moveTo(s * 0.5, s * 1.5);
        p.lineTo(s * 1.5, s * 0.5);
        p.stroke();
      });

    case 'grid':
      return makeTile((p, s) => {
        p.strokeStyle = '#000';
        p.lineWidth = 1.2;
        p.beginPath();
        p.moveTo(s / 2, 0);
        p.lineTo(s / 2, s);
        p.moveTo(0, s / 2);
        p.lineTo(s, s / 2);
        p.stroke();
      });

    case 'diagonalGrid':
      return makeTile((p, s) => {
        p.strokeStyle = '#000';
        p.lineWidth = 1.2;
        p.beginPath();
        p.moveTo(0, 0);
        p.lineTo(s, s);
        p.moveTo(s, 0);
        p.lineTo(0, s);
        p.stroke();
      });

    case 'dot':
      return makeTile((p, s) => {
        p.fillStyle = '#000';
        p.beginPath();
        p.arc(s / 2, s / 2, 1.8, 0, Math.PI * 2);
        p.fill();
      });

    case 'dotReverse':
      return makeTile((p, s) => {
        p.fillStyle = '#333';
        p.fillRect(0, 0, s, s);
        p.fillStyle = '#fff';
        p.beginPath();
        p.arc(s / 2, s / 2, 1.8, 0, Math.PI * 2);
        p.fill();
      });

    case 'vertical':
      return makeTile((p, s) => {
        p.strokeStyle = '#000';
        p.lineWidth = 1.5;
        p.beginPath();
        p.moveTo(s / 2, 0);
        p.lineTo(s / 2, s);
        p.stroke();
      });

    case 'horizontal':
      return makeTile((p, s) => {
        p.strokeStyle = '#000';
        p.lineWidth = 1.5;
        p.beginPath();
        p.moveTo(0, s / 2);
        p.lineTo(s, s / 2);
        p.stroke();
      });
  }
}

// ── 누적 차트 채움 시스템 ─────────────────────────────

// 항목 1~3: 단색 그레이스케일, 항목 4: 흰색, 항목 5+: 패턴
const SOLID_FILLS = ['#333', '#666', '#999', '#fff'];

const PATTERN_ORDER: PatternType[] = [
  'diagonal',
  'grid',
  'diagonalGrid',
  'dot',
  'dotReverse',
  'vertical',
  'horizontal',
];

// 컨텍스트별 패턴 캐시
const cache = new WeakMap<CanvasRenderingContext2D, Map<PatternType, CanvasPattern>>();

function getCached(ctx: CanvasRenderingContext2D, type: PatternType): CanvasPattern {
  let m = cache.get(ctx);
  if (!m) {
    m = new Map();
    cache.set(ctx, m);
  }
  let pat = m.get(type);
  if (!pat) {
    pat = ctx.createPattern(createPatternCanvas(type), 'repeat')!;
    m.set(type, pat);
  }
  return pat;
}

/** 누적 차트의 index번째 항목 채움값 반환 */
export function getStackedFill(
  ctx: CanvasRenderingContext2D,
  index: number
): string | CanvasPattern {
  if (index < SOLID_FILLS.length) return SOLID_FILLS[index];
  const pi = (index - SOLID_FILLS.length) % PATTERN_ORDER.length;
  return getCached(ctx, PATTERN_ORDER[pi]);
}

/** 밝은 채움인지 (흰색/패턴) — 테두리·라벨색 결정용 */
export function isLightFill(index: number): boolean {
  return index >= 3 && !isDarkPattern(index);
}

/** 어두운 패턴인지 (dotReverse 등) */
function isDarkPattern(index: number): boolean {
  if (index < SOLID_FILLS.length) return false;
  const pi = (index - SOLID_FILLS.length) % PATTERN_ORDER.length;
  return PATTERN_ORDER[pi] === 'dotReverse';
}
