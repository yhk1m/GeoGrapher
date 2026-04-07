// © 2026 김용현
const LABEL_FONT = "'Noto Sans KR', sans-serif";

interface TitleParams {
  ctx: CanvasRenderingContext2D;
  plotX: number;
  plotW: number;
  title: string;
  fontSize: number;
}

export function drawTitle({ ctx, plotX, plotW, title, fontSize }: TitleParams) {
  if (!title) return;
  ctx.save();
  ctx.fillStyle = '#000';
  ctx.font = `bold ${fontSize}px ${LABEL_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(title, plotX + plotW / 2, 10);
  ctx.restore();
}

interface SourceFootnoteParams {
  ctx: CanvasRenderingContext2D;
  plotX: number;
  plotW: number;
  height: number;
  source: string;
  footnote: string;
  fontSize: number;
  canvasWidth?: number;
}

const MIN_MARGIN = 100;

export function drawSourceAndFootnote({
  ctx, plotX, plotW, height, source, footnote, fontSize, canvasWidth,
}: SourceFootnoteParams) {
  ctx.save();

  // 캔버스 폭이 주어지면 최소 마진 보장
  let leftX = plotX;
  let rightX = plotX + plotW;
  if (canvasWidth != null) {
    leftX = Math.max(plotX, MIN_MARGIN);
    rightX = Math.min(plotX + plotW, canvasWidth - MIN_MARGIN);
  }

  // 아래에서 위로 쌓기: 각주 → 출처
  let y = height - 6;

  if (footnote) {
    ctx.fillStyle = '#555';
    ctx.font = `${fontSize * 0.9}px ${LABEL_FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('* ' + footnote, leftX, y);
    y -= fontSize * 0.9 + 4;
  }
  if (source) {
    ctx.fillStyle = '#555';
    ctx.font = `bold ${fontSize}px ${LABEL_FONT}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(source, rightX, y);
  }

  ctx.restore();
}
