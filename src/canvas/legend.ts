// © 2026 김용현
// 공통 범례 렌더링
import { type LegendPosition } from '../data/types';

export interface LegendItem {
  type: 'rect' | 'circle' | 'line';
  fillStyle: string | CanvasPattern;
  strokeStyle?: string;
  label: string;
  /** 밝은 채움일 때 아이콘에 검정 테두리 표시 */
  bordered?: boolean;
  /** 선 아이콘(line)의 대시 패턴 — 미지정 시 실선 */
  dash?: number[];
  /** 선 아이콘(line)의 굵기 — 미지정 시 2.5 */
  lineWidth?: number;
}

const LINE_ICON_SIZE = 36;

interface LegendParams {
  ctx: CanvasRenderingContext2D;
  items: LegendItem[];
  position: LegendPosition;
  plotX: number;
  plotY: number;
  plotW: number;
  plotH: number;
  fontSize: number;
  /** 하단 범례의 plotH 아래 오프셋 (기본 50) */
  bottomOffset?: number;
  /** 우측 범례의 plotW 오른쪽 간격 (기본 20) */
  rightGap?: number;
}

const LEGEND_FONT = "'Noto Sans KR', sans-serif";

/** 우측 범례일 때 필요한 추가 너비를 계산 */
export function measureLegendWidth(
  ctx: CanvasRenderingContext2D,
  labels: string[],
  fontSize: number,
  iconType: 'rect' | 'circle' | 'line' = 'rect'
): number {
  ctx.save();
  ctx.font = `bold ${fontSize}px ${LEGEND_FONT}`;
  const iconSize = iconType === 'line' ? LINE_ICON_SIZE : 16;
  const iconGap = 10;
  const padding = 12;
  const maxW = Math.max(...labels.map((l) => iconSize + iconGap + ctx.measureText(l).width));
  ctx.restore();
  return maxW + padding * 2 + 30; // 박스 + 간격
}

export function drawLegend({
  ctx, items, position,
  plotX, plotY, plotW, plotH,
  fontSize,
  bottomOffset = 50,
  rightGap = 20,
}: LegendParams): number {
  if (items.length === 0) return 0;

  ctx.save();
  ctx.font = `bold ${fontSize}px ${LEGEND_FONT}`;

  const iconGap = 10;
  const padding = 12;
  const lineHeight = fontSize + 8;
  const iconWidthOf = (item: LegendItem) => (item.type === 'line' ? LINE_ICON_SIZE : 16);

  // 각 아이템 텍스트 너비 측정
  const itemWidths = items.map((item) => iconWidthOf(item) + iconGap + ctx.measureText(item.label).width);

  if (position === 'bottom') {
    // 하단: 그래프 너비 박스, 아이템 가운데 모아서 배치
    const itemSpacing = 30;
    const totalItemW = itemWidths.reduce((a, b) => a + b, 0) + itemSpacing * (items.length - 1);
    const boxW = plotW;
    const boxH = lineHeight + padding * 2;
    const boxX = plotX;
    const boxY = plotY + plotH + bottomOffset;

    // 박스
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 0);
    ctx.fill();
    ctx.stroke();

    // 아이템들 — 가운데 정렬
    let cx = boxX + (boxW - totalItemW) / 2;
    const cy = boxY + boxH / 2;

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const iSize = iconWidthOf(item);
      drawIcon(ctx, item, cx, cy, iSize);
      ctx.font = `bold ${fontSize}px ${LEGEND_FONT}`;
      ctx.fillStyle = '#000';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.label, cx + iSize + iconGap, cy);
      cx += itemWidths[idx] + itemSpacing;
    }
    ctx.restore();
    return boxY + boxH;
  } else {
    // 우측: 그래프 바로 옆, 하단 정렬
    const itemGap = 10;
    const maxItemW = Math.max(...itemWidths);
    const boxW = maxItemW + padding * 2;
    const boxH = lineHeight * items.length + itemGap * (items.length - 1) + padding * 2;
    const boxX = plotX + plotW + rightGap;
    const boxY = plotY + plotH - boxH;

    // 박스
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 0);
    ctx.fill();
    ctx.stroke();

    // 아이템들
    let cy = boxY + padding + lineHeight / 2;
    for (const item of items) {
      const ix = boxX + padding;
      const iSize = iconWidthOf(item);
      drawIcon(ctx, item, ix, cy, iSize);
      ctx.font = `bold ${fontSize}px ${LEGEND_FONT}`;
      ctx.fillStyle = '#000';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.label, ix + iSize + iconGap, cy);
      cy += lineHeight + itemGap;
    }
    ctx.restore();
    return 0;
  }
}

function drawIcon(
  ctx: CanvasRenderingContext2D,
  item: LegendItem,
  x: number,
  cy: number,
  size: number
) {
  if (item.type === 'rect') {
    ctx.fillStyle = item.fillStyle;
    ctx.fillRect(x, cy - size / 2, size, size);
    if (item.bordered) {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, cy - size / 2, size, size);
    } else if (item.strokeStyle) {
      ctx.strokeStyle = item.strokeStyle;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, cy - size / 2, size, size);
    }
  } else if (item.type === 'circle') {
    ctx.fillStyle = item.fillStyle;
    ctx.beginPath();
    ctx.arc(x + size / 2, cy, size / 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.type === 'line') {
    ctx.save();
    ctx.strokeStyle = item.fillStyle;
    ctx.lineWidth = item.lineWidth ?? 2.5;
    if (item.dash && item.dash.length > 0) ctx.setLineDash(item.dash);
    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(x + size, cy);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = item.fillStyle;
    ctx.beginPath();
    ctx.arc(x + size / 2, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
