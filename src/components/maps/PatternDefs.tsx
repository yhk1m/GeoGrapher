// © 2026 김용현
// 단계구분도용 SVG 패턴 정의 — 등급별 bgColor + patternKind를 합친 단일 fill URL 생성
import type { PatternKind } from './types';

interface PatternDefsProps {
  idPrefix: string; // 예: 'chor'
  bins: { bgColor: string; fgColor: string; pattern: PatternKind; showPattern: boolean }[];
}

const TILE = 10;        // 패턴 타일 크기 (userSpaceOnUse)
const STROKE = 1.5;     // 선 두께
const DOT_R = 1.6;      // 점 반지름
const LARGE_DOT_R = 2.6;// 큰 점 반지름 (도트 리버스에 사용)

export default function PatternDefs({ idPrefix, bins }: PatternDefsProps) {
  return (
    <defs>
      {bins.map((b, i) => {
        // 도트 리버스는 바탕이 검정, 점이 흰색으로 반전
        const isReverse = b.showPattern && b.pattern === 'dotsReverse';
        const bg = isReverse ? '#111111' : b.bgColor;
        const fg = isReverse ? '#ffffff' : b.fgColor;
        return (
          <pattern
            key={i}
            id={`${idPrefix}-bin-${i}`}
            width={TILE}
            height={TILE}
            patternUnits="userSpaceOnUse"
          >
            <rect x={0} y={0} width={TILE} height={TILE} fill={bg} />
            {b.showPattern && renderPatternShape(b.pattern, fg)}
          </pattern>
        );
      })}
    </defs>
  );
}

function renderPatternShape(kind: PatternKind, color: string) {
  switch (kind) {
    case 'diagonal': // /
      return (
        <g stroke={color} strokeWidth={STROKE}>
          <line x1={-1} y1={TILE + 1} x2={TILE + 1} y2={-1} />
          <line x1={-1} y1={1} x2={1} y2={-1} />
          <line x1={TILE - 1} y1={TILE + 1} x2={TILE + 1} y2={TILE - 1} />
        </g>
      );
    case 'diagonalReverse': // \
      return (
        <g stroke={color} strokeWidth={STROKE}>
          <line x1={-1} y1={-1} x2={TILE + 1} y2={TILE + 1} />
          <line x1={-1} y1={TILE - 1} x2={1} y2={TILE + 1} />
          <line x1={TILE - 1} y1={-1} x2={TILE + 1} y2={1} />
        </g>
      );
    case 'horizontal':
      return (
        <g stroke={color} strokeWidth={STROKE}>
          <line x1={0} y1={TILE / 2} x2={TILE} y2={TILE / 2} />
        </g>
      );
    case 'vertical':
      return (
        <g stroke={color} strokeWidth={STROKE}>
          <line x1={TILE / 2} y1={0} x2={TILE / 2} y2={TILE} />
        </g>
      );
    case 'crosshatch':
      return (
        <g stroke={color} strokeWidth={STROKE}>
          <line x1={0} y1={TILE / 2} x2={TILE} y2={TILE / 2} />
          <line x1={TILE / 2} y1={0} x2={TILE / 2} y2={TILE} />
        </g>
      );
    case 'diagonalCrosshatch':
      return (
        <g stroke={color} strokeWidth={STROKE}>
          <line x1={-1} y1={TILE + 1} x2={TILE + 1} y2={-1} />
          <line x1={-1} y1={-1} x2={TILE + 1} y2={TILE + 1} />
        </g>
      );
    case 'dots':
      return <circle cx={TILE / 2} cy={TILE / 2} r={DOT_R} fill={color} />;
    case 'dotsReverse':
      // 큰 반점. 배경이 어두울 때 더 효과적. 여기선 fg 색상의 원을 크게.
      return <circle cx={TILE / 2} cy={TILE / 2} r={LARGE_DOT_R} fill={color} />;
  }
}
