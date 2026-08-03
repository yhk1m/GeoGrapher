// © 2026 김용현
import { type ScatterGraphData, type GraphOptions } from '../data/types';
import { type Padding, clearCanvas, getFont, autoRange, fillTextMultiline } from '../canvas/renderer';
import { drawTitle, drawSourceAndFootnote, LabelPlacer, labelStride, widestLabel, type LabelBox } from '../canvas/labels';

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

  const padding: Padding = {
    top: options.title ? 100 : 50,
    right: 60,
    bottom: (() => {
      let b = 90;
      if (options.source) b += 30;
      b += options.footnotes.filter(f => f.trim()).length * 22;
      return b;
    })(),
    left: 130,
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
  const xStep = data.xRange.step ?? (data.xRange.auto ? xAuto.step : (xMax - xMin) / 5);
  const yStep = data.yRange.step ?? (data.yRange.auto ? yAuto.step : (yMax - yMin) / 5);

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
  // 숫자가 서로 붙으면 몇 개 걸러 그린다 (눈금 표시는 그대로 둔다)
  const xTicks: number[] = [];
  for (let v = xMin; v <= xMax + xStep * 0.01; v += xStep) xTicks.push(v);
  const xStride = labelStride(
    plotW / Math.max(1, xTicks.length - 1),
    widestLabel(ctx, xTicks.map(formatTick)),
  );
  xTicks.forEach((v, i) => {
    const x = toCanvasX(v);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, plotY + plotH);
    ctx.lineTo(x, plotY + plotH + 6);
    ctx.stroke();
    if (i % xStride === 0) ctx.fillText(formatTick(v), x, plotY + plotH + 10);
  });

  // Y축 눈금
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const yTicks: number[] = [];
  for (let v = yMin; v <= yMax + yStep * 0.01; v += yStep) yTicks.push(v);
  const yStride = labelStride(plotH / Math.max(1, yTicks.length - 1), fs.tick * 1.1);
  yTicks.forEach((v, i) => {
    const y = toCanvasY(v);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotX - 6, y);
    ctx.lineTo(plotX, y);
    ctx.stroke();
    if (i % yStride === 0) ctx.fillText(formatTick(v), plotX - 10, y);
  });

  // 축 라벨
  ctx.font = getFont(fs.axisLabel, font, cf, 'bold');

  // X축 라벨 (하단 중앙)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(data.xLabel, plotX + plotW / 2, plotY + plotH + 40);

  // X축 단위 (우측 끝, 라벨과 같은 높이)
  if (data.xUnit) {
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(data.xUnit, plotX + plotW + 10, plotY + plotH + 40);
  }

  // Y축 단위 (상단 끝)
  if (data.yUnit) {
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(data.yUnit, plotX - 10, plotY - 16);
  }

  // Y축 라벨 (Y축 중간, 줄바꿈 지원)
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  fillTextMultiline(ctx, data.yLabel, plotX - 55, plotY + plotH / 2, fs.axisLabel * 1.3);

  // 데이터 포인트
  drawPoints(ctx, data, toCanvasX, toCanvasY, fs, font, cf, options.showDataLabels,
    { left: plotX, right: plotX + plotW, top: plotY, bottom: plotY + plotH });

  // 버블 크기 범례
  if (data.showBubble && data.points.length > 0) {
    drawBubbleLegend(ctx, data, plotX, plotY, plotW, plotH, fs, font, cf);
  }

  drawTitle({ ctx, plotX, plotW, title: options.title, fontSize: fs.title });
  drawSourceAndFootnote({ ctx, plotX, plotW, height: h, source: options.source, footnotes: options.footnotes, fontSize: fs.dataLabel, canvasWidth: w });
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

  const padding: Padding = {
    // 상자 축이름은 그래프 위에 놓이고 그 아래에 y 단위가 들어가므로 자리를 더 준다
    top: options.title ? 100 : (data.boxedAxisLabels ? 120 : 50),
    // 상자 축이름은 플롯 오른쪽 바깥에 놓이므로 그때만 자리를 더 준다
    right: data.boxedAxisLabels ? 170 : 80,
    bottom: (() => {
      let b = 90;
      if (options.source) b += 30;
      b += options.footnotes.filter(f => f.trim()).length * 22;
      return b;
    })(),
    left: 130,
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
  const xStep = data.xRange.step ?? (data.xRange.auto ? xSymAuto.step : xLimit / 4);
  const yStep = data.yRange.step ?? (data.yRange.auto ? ySymAuto.step : yLimit / 4);

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

  // 외곽 축선 — 시험지 편차 그래프는 테두리 없이 교차하는 두 축만 둔다
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  if (data.showFrame !== false) {
    ctx.beginPath();
    ctx.moveTo(plotX, plotY);
    ctx.lineTo(plotX, plotY + plotH);
    ctx.lineTo(plotX + plotW, plotY + plotH);
    ctx.lineTo(plotX + plotW, plotY);
    ctx.closePath();
    ctx.stroke();
  }

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

  // 눈금을 어디에 붙일지 — 기본은 플롯 가장자리, ticksOnAxis 면 가운데 십자선
  const xTickBase = data.ticksOnAxis ? originY : plotY + plotH;
  const yTickBase = data.ticksOnAxis ? originX : plotX;

  // X축 눈금
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const devXTicks: number[] = [];
  for (let v = -xLimit; v <= xLimit + xStep * 0.01; v += xStep) devXTicks.push(v);
  const devXStride = labelStride(
    plotW / Math.max(1, devXTicks.length - 1),
    widestLabel(ctx, devXTicks.map(formatTick)),
  );
  devXTicks.forEach((v, i) => {
    if (Math.abs(v) < xStep * 0.01) return;
    const x = toCanvasX(v);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, xTickBase);
    ctx.lineTo(x, xTickBase + 6);
    ctx.stroke();
    if (i % devXStride === 0) ctx.fillText(formatTick(v), x, xTickBase + 10);
  });

  // Y축 눈금
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const devYTicks: number[] = [];
  for (let v = -yLimit; v <= yLimit + yStep * 0.01; v += yStep) devYTicks.push(v);
  const devYStride = labelStride(plotH / Math.max(1, devYTicks.length - 1), fs.tick * 1.1);
  devYTicks.forEach((v, i) => {
    if (Math.abs(v) < yStep * 0.01) return;
    const y = toCanvasY(v);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(yTickBase - 6, y);
    ctx.lineTo(yTickBase, y);
    ctx.stroke();
    if (i % devYStride === 0) ctx.fillText(formatTick(v), yTickBase - 10, y);
  });

  // 축 라벨
  ctx.font = getFont(fs.axisLabel, font, cf, 'bold');

  // X축 라벨 (하단 중앙). 상자 방식이면 아래에서 따로 그린다.
  if (!data.boxedAxisLabels) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(data.xLabel, plotX + plotW / 2, plotY + plotH + 40);
  }

  // 축 단위.
  // 눈금이 십자축에 붙어 있으면 단위도 그 축 끝에, 눈금 숫자와 같은 줄·열에 둔다.
  // (축선 위가 아니라 숫자와 나란히 놓여야 읽힌다.)
  if (data.xUnit) {
    ctx.textAlign = data.ticksOnAxis ? 'left' : 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(
      data.xUnit,
      plotX + plotW + (data.ticksOnAxis ? 20 : 10),
      data.ticksOnAxis ? originY + 10 : plotY + plotH + 40,
    );
  }

  if (data.yUnit) {
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      data.yUnit,
      data.ticksOnAxis ? originX - 10 : plotX - 10,
      data.ticksOnAxis ? plotY - 6 : plotY - 16,
    );
  }

  if (data.boxedAxisLabels) {
    // 시험지 관습 — y 이름은 그래프 위, x 이름은 그래프 오른쪽에 상자로 둔다
    // y 이름은 맨 위에 둔다 — 그 아래 자리는 y 단위가 쓴다.
    // y 이름은 세로축(0선)에 가운데를 맞춘다
    drawBoxedLabel(ctx, data.yLabel, originX, 10, fs.axisLabel, 'below');
    // x 이름은 x 단위 오른쪽에 둔다 — 둘 다 축 오른쪽 끝, 같은 줄이라 겹칠 수 있다.
    const xUnitW = data.xUnit && data.ticksOnAxis ? ctx.measureText(data.xUnit).width + 14 : 0;
    drawBoxedLabel(ctx, data.xLabel, plotX + plotW + 16 + xUnitW, plotY + plotH / 2, fs.axisLabel, 'right');
  } else {
    // Y축 라벨 (Y축 중간, 줄바꿈 지원)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    fillTextMultiline(ctx, data.yLabel, plotX - 55, plotY + plotH / 2, fs.axisLabel * 1.3);
  }

  // 데이터 포인트
  drawPoints(ctx, data, toCanvasX, toCanvasY, fs, font, cf, options.showDataLabels,
    { left: plotX, right: plotX + plotW, top: plotY, bottom: plotY + plotH });

  // 버블 크기 범례
  if (data.showBubble && data.points.length > 0) {
    drawBubbleLegend(ctx, data, plotX, plotY, plotW, plotH, fs, font, cf);
  }

  drawTitle({ ctx, plotX, plotW, title: options.title, fontSize: fs.title });
  drawSourceAndFootnote({ ctx, plotX, plotW, height: h, source: options.source, footnotes: options.footnotes, fontSize: fs.dataLabel, canvasWidth: w });
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
  showLabels: boolean,
  bounds?: LabelBox
) {
  const maxSize = data.points.length > 0 ? Math.max(...data.points.map((p) => p.size), 1) : 1;

  // 라벨이 서로/점과 겹치지 않게 자리를 잡는다.
  // 점을 먼저 전부 등록해야 라벨이 다른 점 위에 얹히지 않는다.
  const placer = new LabelPlacer();
  if (bounds) {
    for (const pt of data.points) {
      const r = data.showBubble && pt.size > 0 ? (pt.size / maxSize) * data.bubbleScale : 4;
      placer.reserveCircle(toX(pt.x), toY(pt.y), r);
    }
  }

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
      const offset = data.showBubble && pt.size > 0
        ? (pt.size / maxSize) * data.bubbleScale + 4
        : 8;

      if (bounds) {
        placer.place(ctx, pt.label, cx, cy, {
          gap: offset,
          lineHeight: fs.dataLabel * 1.1,
          bounds,
        });
      } else {
        // 경계를 모르면 겹침 회피를 할 수 없다 — 기존처럼 오른쪽 위에 둔다
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(pt.label, cx + offset, cy - 2);
      }
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

/** 버블 크기 범례: 겹친 원 + 박스 */
function drawBubbleLegend(
  ctx: CanvasRenderingContext2D,
  data: ScatterGraphData,
  plotX: number,
  plotY: number,
  plotW: number,
  plotH: number,
  fs: GraphOptions['fontSize'],
  font: GraphOptions['fontFamily'],
  cf: string,
) {
  const sizes = data.points.map((p) => p.size).filter((s) => s > 0);
  if (sizes.length === 0) return;

  const maxSize = Math.max(...sizes);
  if (maxSize === 0) return;

  const steps = [maxSize, Math.round(maxSize * 0.5), Math.round(maxSize * 0.2)].filter((v) => v > 0);
  const uniqueSteps = [...new Set(steps)].sort((a, b) => b - a);

  const maxR = data.bubbleScale * 1.2;
  const labelW = 50;
  const pad = 14;
  const boxW = maxR * 2 + labelW + pad * 2 + 20;
  const boxH = maxR * 2 + pad * 2 + 10;

  // 위치 계산
  const pos = data.bubbleLegendPosition || 'bottom-right';
  let boxX: number, boxY: number;
  if (pos === 'top-left') { boxX = plotX + 10; boxY = plotY + 10; }
  else if (pos === 'top-right') { boxX = plotX + plotW - boxW - 10; boxY = plotY + 10; }
  else if (pos === 'bottom-left') { boxX = plotX + 10; boxY = plotY + plotH - boxH - 10; }
  else { boxX = plotX + plotW - boxW - 10; boxY = plotY + plotH - boxH - 10; }

  // 박스 배경
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 4);
  ctx.fill();
  ctx.stroke();

  const circleX = boxX + pad + maxR;
  const bottomCircleY = boxY + boxH - pad;

  for (const size of uniqueSteps) {
    const r = (size / maxSize) * maxR;
    const cy = bottomCircleY - r;

    // 원
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(circleX, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // 점선 + 라벨
    ctx.save();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    const lineY = cy - r;
    ctx.beginPath();
    ctx.moveTo(circleX, lineY);
    ctx.lineTo(circleX + maxR + 12, lineY);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#000';
    ctx.font = getFont(fs.dataLabel * 0.85, font, cf, 'bold');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(size), circleX + maxR + 16, lineY);
  }
}

/**
 * 축 이름을 얇은 상자에 넣어 그린다 (시험지 편차 그래프 관습).
 *
 * place 가 'below' 면 (x, y)가 상자의 **위쪽 가운데**,
 * 'right' 면 (x, y)가 상자의 왼쪽 세로 중앙이다.
 * 줄바꿈 구분자는 fillTextMultiline 과 같은 리터럴 
 이다.
 */
function drawBoxedLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  place: 'below' | 'right'
) {
  if (!text) return;
  // fillTextMultiline 과 같은 규약 — 실제 줄바꿈이 아니라 리터럴 역슬래시+n 으로 나눈다
  const lines = text.split('\\n');
  const lineH = fontSize * 1.25;
  const padX = 8;
  const padY = 6;

  ctx.save();
  const textW = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const boxW = textW + padX * 2;
  const boxH = lines.length * lineH + padY * 2;
  // 'below' 는 x 를 가로 중앙으로 본다 — 축에 맞춰 가운데 정렬하기 위해서다
  const boxX = place === 'below' ? x - boxW / 2 : x;
  const boxY = place === 'below' ? y : y - boxH / 2;

  ctx.fillStyle = '#fff';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], boxX + boxW / 2, boxY + padY + i * lineH);
  }
  ctx.restore();
}
