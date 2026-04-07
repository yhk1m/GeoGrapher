// © 2026 김용현
import { type ScatterGraphData, type GraphOptions } from '../data/types';
import { type Padding, clearCanvas, getFont, autoRange } from '../canvas/renderer';
import { drawTitle, drawSourceAndFootnote } from '../canvas/labels';
import { drawLegend, measureLegendWidth } from '../canvas/legend';

export function renderScatterGraph(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: ScatterGraphData,
  options: GraphOptions
) {
  clearCanvas(ctx, w, h);

  if (data.mode === 'deviation') {
    renderDeviation(ctx, w, h, data, options);
  } else {
    renderNormal(ctx, w, h, data, options);
  }
}

// ── 일반 산점도/버블 ──────────────────────────────────

function renderNormal(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: ScatterGraphData,
  options: GraphOptions
) {
  const font = options.fontFamily;
  const cf = options.customFont;
  const fs = options.fontSize;
  const showLegend = options.showLegend && data.points.length > 0;
  const legendPos = options.legendPosition;
  const legendLabels = data.points.map((p) => p.label || '?');
  const legendW = (showLegend && legendPos === 'right')
    ? measureLegendWidth(ctx, legendLabels, fs.dataLabel * 0.85 + 5)
    : 0;

  const padding: Padding = {
    top: options.title ? 100 : 50,
    right: 60 + legendW,
    bottom: (() => {
      let b = 90;
      if (showLegend && legendPos === 'bottom') b += 60;
      if (options.source) b += 30;
      if (options.footnote) b += 25;
      return b;
    })(),
    left: 100,
  };

  const plotX = padding.left;
  const plotY = padding.top;
  const plotW = w - padding.left - padding.right;
  const plotH = h - padding.top - padding.bottom;

  // 축 범위
  const xs = data.points.map((p) => p.x);
  const ys = data.points.map((p) => p.y);
  const xAuto = autoRange(xs);
  const yAuto = autoRange(ys);
  const xMin = data.xRange.auto ? xAuto.min : data.xRange.min;
  const xMax = data.xRange.auto ? xAuto.max : data.xRange.max;
  const yMin = data.yRange.auto ? yAuto.min : data.yRange.min;
  const yMax = data.yRange.auto ? yAuto.max : data.yRange.max;
  const xStep = data.xRange.auto ? xAuto.step : (xMax - xMin) / 5;
  const yStep = data.yRange.auto ? yAuto.step : (yMax - yMin) / 5;

  const toCanvasX = (v: number) => plotX + ((v - xMin) / (xMax - xMin)) * plotW;
  const toCanvasY = (v: number) => plotY + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  // 격자선
  ctx.save();
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([3, 3]);
  for (let v = xMin + xStep; v < xMax; v += xStep) {
    const x = toCanvasX(v);
    ctx.beginPath();
    ctx.moveTo(x, plotY);
    ctx.lineTo(x, plotY + plotH);
    ctx.stroke();
  }
  for (let v = yMin + yStep; v < yMax; v += yStep) {
    const y = toCanvasY(v);
    ctx.beginPath();
    ctx.moveTo(plotX, y);
    ctx.lineTo(plotX + plotW, y);
    ctx.stroke();
  }
  ctx.restore();

  // 축선
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(plotX, plotY);
  ctx.lineTo(plotX, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.stroke();

  // X축 눈금
  ctx.fillStyle = '#000';
  ctx.font = getFont(fs.tick, font, cf, 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let v = xMin; v <= xMax + xStep * 0.01; v += xStep) {
    const x = toCanvasX(v);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, plotY + plotH);
    ctx.lineTo(x, plotY + plotH + 6);
    ctx.stroke();
    ctx.fillText(formatTick(v), x, plotY + plotH + 10);
  }

  // Y축 눈금
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let v = yMin; v <= yMax + yStep * 0.01; v += yStep) {
    const y = toCanvasY(v);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotX - 6, y);
    ctx.lineTo(plotX, y);
    ctx.stroke();
    ctx.fillText(formatTick(v), plotX - 10, y);
  }

  // 축 라벨
  ctx.font = getFont(fs.axisLabel, font, cf, 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const xLabelText = data.xLabel + (data.xUnit ? ` ${data.xUnit}` : '');
  ctx.fillText(xLabelText, plotX + plotW / 2, plotY + plotH + 40);

  ctx.save();
  ctx.translate(30, plotY + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const yLabelText = data.yLabel + (data.yUnit ? ` ${data.yUnit}` : '');
  ctx.fillText(yLabelText, 0, 0);
  ctx.restore();

  // 데이터 포인트
  drawPoints(ctx, data, toCanvasX, toCanvasY, fs, font, cf, options.showDataLabels);

  // 범례
  if (showLegend) {
    const items = data.points.map((pt) => ({
      type: 'circle' as const,
      fillStyle: '#000',
      label: pt.label || '?',
    }));
    drawLegend({
      ctx, items, position: legendPos,
      plotX, plotY, plotW, plotH,
      fontSize: fs.dataLabel * 0.85 + 5,
      bottomOffset: 75,
    });
  }

  drawTitle({ ctx, plotX, plotW, title: options.title, fontSize: fs.title });
  drawSourceAndFootnote({ ctx, plotX, plotW, height: h, source: options.source, footnote: options.footnote, fontSize: fs.dataLabel });
}

// ── 편차 산점도 ───────────────────────────────────────

function renderDeviation(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: ScatterGraphData,
  options: GraphOptions
) {
  const font = options.fontFamily;
  const cf = options.customFont;
  const fs = options.fontSize;

  const showLegend = options.showLegend && data.points.length > 0;
  const legendPos = options.legendPosition;
  const legendLabels = data.points.map((p) => p.label || '?');
  const legendW = (showLegend && legendPos === 'right')
    ? measureLegendWidth(ctx, legendLabels, fs.dataLabel * 0.85 + 5)
    : 0;

  const padding: Padding = {
    top: options.title ? 100 : 50,
    right: 80 + legendW,
    bottom: (() => {
      let b = 90;
      if (showLegend && legendPos === 'bottom') b += 60;
      if (options.source) b += 30;
      if (options.footnote) b += 25;
      return b;
    })(),
    left: 100,
  };

  const plotX = padding.left;
  const plotY = padding.top;
  const plotW = w - padding.left - padding.right;
  const plotH = h - padding.top - padding.bottom;

  // 대칭 범위 계산
  const xs = data.points.map((p) => Math.abs(p.x));
  const ys = data.points.map((p) => Math.abs(p.y));
  const xAbsMax = xs.length > 0 ? Math.max(...xs) : 10;
  const yAbsMax = ys.length > 0 ? Math.max(...ys) : 10;

  const xSymAuto = symmetricRange(xAbsMax);
  const ySymAuto = symmetricRange(yAbsMax);
  const xLimit = data.xRange.auto ? xSymAuto.limit : Math.max(Math.abs(data.xRange.min), Math.abs(data.xRange.max));
  const yLimit = data.yRange.auto ? ySymAuto.limit : Math.max(Math.abs(data.yRange.min), Math.abs(data.yRange.max));
  const xStep = data.xRange.auto ? xSymAuto.step : xLimit / 4;
  const yStep = data.yRange.auto ? ySymAuto.step : yLimit / 4;

  const toCanvasX = (v: number) => plotX + ((v + xLimit) / (2 * xLimit)) * plotW;
  const toCanvasY = (v: number) => plotY + plotH - ((v + yLimit) / (2 * yLimit)) * plotH;

  const originX = toCanvasX(0);
  const originY = toCanvasY(0);

  // 격자선
  ctx.save();
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([3, 3]);
  for (let v = -xLimit + xStep; v < xLimit; v += xStep) {
    if (Math.abs(v) < xStep * 0.01) continue;
    const x = toCanvasX(v);
    ctx.beginPath();
    ctx.moveTo(x, plotY);
    ctx.lineTo(x, plotY + plotH);
    ctx.stroke();
  }
  for (let v = -yLimit + yStep; v < yLimit; v += yStep) {
    if (Math.abs(v) < yStep * 0.01) continue;
    const y = toCanvasY(v);
    ctx.beginPath();
    ctx.moveTo(plotX, y);
    ctx.lineTo(plotX + plotW, y);
    ctx.stroke();
  }
  ctx.restore();

  // 외곽 축선
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(plotX, plotY);
  ctx.lineTo(plotX, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY);
  ctx.closePath();
  ctx.stroke();

  // 십자 기준선 (0,0)
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(originX, plotY);
  ctx.lineTo(originX, plotY + plotH);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(plotX, originY);
  ctx.lineTo(plotX + plotW, originY);
  ctx.stroke();

  // 0 표시
  ctx.fillStyle = '#000';
  ctx.font = getFont(fs.tick, font, cf, 'bold');
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText('0', originX - 6, originY + 4);

  // X축 눈금
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let v = -xLimit; v <= xLimit + xStep * 0.01; v += xStep) {
    if (Math.abs(v) < xStep * 0.01) continue;
    const x = toCanvasX(v);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, plotY + plotH);
    ctx.lineTo(x, plotY + plotH + 6);
    ctx.stroke();
    ctx.fillText(formatTick(v), x, plotY + plotH + 10);
  }

  // Y축 눈금
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let v = -yLimit; v <= yLimit + yStep * 0.01; v += yStep) {
    if (Math.abs(v) < yStep * 0.01) continue;
    const y = toCanvasY(v);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotX - 6, y);
    ctx.lineTo(plotX, y);
    ctx.stroke();
    ctx.fillText(formatTick(v), plotX - 10, y);
  }

  // 축 라벨
  ctx.font = getFont(fs.axisLabel, font, cf, 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const xLabelText = data.xLabel + (data.xUnit ? ` ${data.xUnit}` : '');
  ctx.fillText(xLabelText, plotX + plotW / 2, plotY + plotH + 40);

  ctx.save();
  ctx.translate(30, plotY + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const yLabelText = data.yLabel + (data.yUnit ? ` ${data.yUnit}` : '');
  ctx.fillText(yLabelText, 0, 0);
  ctx.restore();

  // 데이터 포인트
  drawPoints(ctx, data, toCanvasX, toCanvasY, fs, font, cf, options.showDataLabels);

  // 범례
  if (showLegend) {
    const items = data.points.map((pt) => ({
      type: 'circle' as const,
      fillStyle: '#000',
      label: pt.label || '?',
    }));
    drawLegend({
      ctx, items, position: legendPos,
      plotX, plotY, plotW, plotH,
      fontSize: fs.dataLabel * 0.85 + 5,
      bottomOffset: 75,
    });
  }

  drawTitle({ ctx, plotX, plotW, title: options.title, fontSize: fs.title });
  drawSourceAndFootnote({ ctx, plotX, plotW, height: h, source: options.source, footnote: options.footnote, fontSize: fs.dataLabel });
}

// ── 공통 유틸 ─────────────────────────────────────────

function drawPoints(
  ctx: CanvasRenderingContext2D,
  data: ScatterGraphData,
  toX: (v: number) => number,
  toY: (v: number) => number,
  fs: GraphOptions['fontSize'],
  font: GraphOptions['fontFamily'],
  cf: string,
  showLabels: boolean
) {
  const maxSize = data.points.length > 0 ? Math.max(...data.points.map((p) => p.size), 1) : 1;

  for (const pt of data.points) {
    const cx = toX(pt.x);
    const cy = toY(pt.y);

    if (data.showBubble && pt.size > 0) {
      const r = (pt.size / maxSize) * data.bubbleScale;
      // 흰색 배경으로 그래프 선 가리기
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      // 버블 원
      ctx.fillStyle = 'rgba(80,80,80,0.3)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      // 버블 없을 때만 중심 점 표시
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 라벨
    if (pt.label) {
      ctx.fillStyle = '#000';
      ctx.font = getFont(fs.dataLabel, font, cf, 'bold');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      const offset = data.showBubble && pt.size > 0
        ? (pt.size / maxSize) * data.bubbleScale + 4
        : 8;
      ctx.fillText(pt.label, cx + offset, cy - 2);
    }

    // 데이터 라벨 (좌표값)
    if (showLabels) {
      ctx.fillStyle = '#555';
      ctx.font = getFont(fs.dataLabel * 0.8, font, cf, 'normal');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const offset = data.showBubble && pt.size > 0
        ? (pt.size / maxSize) * data.bubbleScale + 4
        : 8;
      ctx.fillText(`(${pt.x}, ${pt.y})`, cx + offset, cy + 2);
    }
  }
}

function symmetricRange(absMax: number): { limit: number; step: number } {
  if (absMax === 0) return { limit: 10, step: 2 };
  const margin = absMax * 0.2;
  const raw = absMax + margin;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / pow;
  let nice: number;
  if (norm <= 1.5) nice = 1.5;
  else if (norm <= 2) nice = 2;
  else if (norm <= 3) nice = 3;
  else if (norm <= 5) nice = 5;
  else nice = 10;
  const limit = nice * pow;
  const step = limit / 4;
  return { limit, step };
}

function formatTick(v: number): string {
  return Math.abs(v) < 0.0001 ? '0' : Number(v.toFixed(2)).toString();
}
