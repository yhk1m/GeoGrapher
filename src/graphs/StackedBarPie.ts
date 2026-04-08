// © 2026 김용현
import { type StackedGraphData, type GraphOptions } from '../data/types';
import { type Padding, clearCanvas, getFont } from '../canvas/renderer';
import { drawTitle, drawSourceAndFootnote } from '../canvas/labels';
import { drawLegend, measureLegendWidth } from '../canvas/legend';
import { getStackedFill, isLightFill } from '../canvas/patterns';

export function renderStackedGraph(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: StackedGraphData,
  options: GraphOptions
) {
  clearCanvas(ctx, w, h);

  if (data.displayMode === 'bar') {
    renderStackedBar(ctx, w, h, data, options);
  } else {
    renderPieChart(ctx, w, h, data, options);
  }
}

function renderStackedBar(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: StackedGraphData,
  options: GraphOptions
) {
  const showLegend = options.showLegend;
  const legendPos = options.legendPosition;
  const legendW = (showLegend && legendPos === 'right')
    ? measureLegendWidth(ctx, data.seriesLabels, options.fontSize.dataLabel * 0.85 + 5)
    : 0;

  const isVertical = data.barDirection === 'vertical';

  const padding: Padding = {
    top: options.title ? 100 : 50,
    right: isVertical ? 60 + legendW : 160 + legendW,
    bottom: (() => {
      let b = isVertical ? 70 : 60;
      if (showLegend && legendPos === 'bottom') b += 60;
      if (options.source) b += 30;
      b += options.footnotes.filter(f => f.trim()).length * 22;
      return b;
    })(),
    left: isVertical ? 80 : 100,
  };

  const plotX = padding.left;
  const plotY = padding.top;
  const plotW = w - padding.left - padding.right;
  const plotH = h - padding.top - padding.bottom;
  const font = options.fontFamily;
  const customFont = options.customFont;
  const n = data.categories.length;
  const sCount = data.seriesLabels.length;

  // 축선
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;

  if (isVertical) {
    // 세로 누적 막대 — 사각 테두리
    ctx.beginPath();
    ctx.moveTo(plotX, plotY);
    ctx.lineTo(plotX, plotY + plotH);
    ctx.lineTo(plotX + plotW, plotY + plotH);
    ctx.lineTo(plotX + plotW, plotY);
    ctx.lineTo(plotX, plotY);
    ctx.stroke();

    // Y축 눈금 (0~100)
    const stepV = data.axisStep ?? 20;
    ctx.font = getFont(options.fontSize.tick, font, customFont, 'bold');
    ctx.fillStyle = '#000';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let v = 0; v <= 100; v += stepV) {
      const y = plotY + plotH - (v / 100) * plotH;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotX - 5, y);
      ctx.lineTo(plotX, y);
      ctx.stroke();
      ctx.fillText(String(v), plotX - 10, y);

      if (v > 0 && v < 100) {
        ctx.save();
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(plotX, y);
        ctx.lineTo(plotX + plotW, y);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 단위
    ctx.font = getFont(options.fontSize.axisLabel, font, customFont, 'bold');
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(data.unit, plotX - 10, plotY - 16);

    // 막대
    const barArea = plotW / n;
    const barW = barArea * 0.6;
    for (let c = 0; c < n; c++) {
      const cx = plotX + barArea * c + barArea / 2;
      const total = data.categories[c].values.reduce((a, b) => a + b, 0);
      let cumY = 0;
      for (let s = 0; s < sCount; s++) {
        const val = data.categories[c].values[s] || 0;
        const ratio = total > 0 ? val / total : 0;
        const barH = ratio * plotH;
        const y = plotY + plotH - cumY - barH;

        ctx.fillStyle = getStackedFill(ctx, s);
        ctx.fillRect(cx - barW / 2, y, barW, barH);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(cx - barW / 2, y, barW, barH);

        if (options.showDataLabels && barH > options.fontSize.dataLabel) {
          ctx.fillStyle = isLightFill(s) ? '#000' : '#fff';
          ctx.font = getFont(options.fontSize.dataLabel * 0.8, font, customFont, 'bold');
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(val), cx, y + barH / 2);
        }
        cumY += barH;
      }

      // X축 라벨
      ctx.fillStyle = '#000';
      ctx.font = getFont(options.fontSize.tick, font, customFont, 'bold');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(data.categories[c].label, cx, plotY + plotH + 12);
    }
  } else {
    // 가로 누적 막대 — 사각 테두리
    ctx.beginPath();
    ctx.moveTo(plotX, plotY);
    ctx.lineTo(plotX, plotY + plotH);
    ctx.lineTo(plotX + plotW, plotY + plotH);
    ctx.lineTo(plotX + plotW, plotY);
    ctx.lineTo(plotX, plotY);
    ctx.stroke();

    // X축 눈금 (0~100)
    const stepH = data.axisStep ?? 20;
    ctx.font = getFont(options.fontSize.tick, font, customFont, 'bold');
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let v = 0; v <= 100; v += stepH) {
      const x = plotX + (v / 100) * plotW;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, plotY + plotH);
      ctx.lineTo(x, plotY + plotH + 5);
      ctx.stroke();
      ctx.fillText(String(v), x, plotY + plotH + 10);

      if (v > 0 && v < 100) {
        ctx.save();
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, plotY);
        ctx.lineTo(x, plotY + plotH);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 단위 (축 맨 오른쪽)
    ctx.font = getFont(options.fontSize.axisLabel, font, customFont, 'bold');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(data.unit, plotX + plotW + 30, plotY + plotH + 10);

    // 막대
    const barArea = plotH / n;
    const barH = barArea * 0.6;
    for (let c = 0; c < n; c++) {
      const cy = plotY + barArea * c + barArea / 2;
      const total = data.categories[c].values.reduce((a, b) => a + b, 0);
      let cumX = 0;
      for (let s = 0; s < sCount; s++) {
        const val = data.categories[c].values[s] || 0;
        const ratio = total > 0 ? val / total : 0;
        const bw = ratio * plotW;
        const x = plotX + cumX;

        ctx.fillStyle = getStackedFill(ctx, s);
        ctx.fillRect(x, cy - barH / 2, bw, barH);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(x, cy - barH / 2, bw, barH);

        if (options.showDataLabels && bw > options.fontSize.dataLabel * 2) {
          ctx.fillStyle = isLightFill(s) ? '#000' : '#fff';
          ctx.font = getFont(options.fontSize.dataLabel * 0.8, font, customFont, 'bold');
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(val), x + bw / 2, cy);
        }
        cumX += bw;
      }

      // Y축 라벨
      ctx.fillStyle = '#000';
      ctx.font = getFont(options.fontSize.tick, font, customFont, 'bold');
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(data.categories[c].label, plotX - 10, cy);
    }
  }

  // 제목
  drawTitle({ ctx, plotX, plotW, title: options.title, fontSize: options.fontSize.title });

  // 범례
  if (showLegend) {
    const items = data.seriesLabels.map((label, i) => ({
      type: 'rect' as const,
      fillStyle: getStackedFill(ctx, i),
      bordered: isLightFill(i),
      label,
    }));
    drawLegend({
      ctx, items, position: legendPos,
      plotX, plotY, plotW, plotH,
      fontSize: options.fontSize.dataLabel * 0.85 + 5,
    });
  }

  // 출처 + 각주
  drawSourceAndFootnote({ ctx, plotX, plotW, height: h, source: options.source, footnotes: options.footnotes, fontSize: options.fontSize.dataLabel, canvasWidth: w });
}

function renderPieChart(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: StackedGraphData,
  options: GraphOptions
) {
  const showLegend = options.showLegend;
  const legendPos = options.legendPosition;
  const legendW = (showLegend && legendPos === 'right')
    ? measureLegendWidth(ctx, data.seriesLabels, options.fontSize.dataLabel * 0.85 + 5)
    : 0;

  const padding: Padding = {
    top: options.title ? 100 : 50,
    right: 60 + legendW,
    bottom: (() => {
      let b = 50;
      if (showLegend && legendPos === 'bottom') b += 60;
      if (options.source) b += 30;
      b += options.footnotes.filter(f => f.trim()).length * 22;
      return b;
    })(),
    left: 60,
  };

  const plotX = padding.left;
  const plotY = padding.top;
  const plotW = w - padding.left - padding.right;
  const plotH = h - padding.top - padding.bottom;
  const font = options.fontFamily;
  const customFont = options.customFont;
  const n = data.categories.length;
  const sCount = data.seriesLabels.length;

  // 원 그래프: 카테고리별 원 그리드 배치 (겹침 방지)
  const pieScale = (data.pieScale ?? 100) / 100;
  const rotationRad = ((data.pieRotation ?? 0) * Math.PI) / 180;
  const minGap = 24;
  const labelSpace = options.fontSize.tick + 16;

  // 기준 반지름 (scale=100%, 한 줄 배치)
  const singleColW = plotW / n;
  const refR = Math.min(singleColW * 0.4, (plotH - labelSpace) * 0.4);
  const desiredR = refR * pieScale;

  // 그리드: 열 수 계산 (겹치지 않도록)
  const cols = n === 1
    ? 1
    : Math.max(1, Math.min(n, Math.floor(plotW / (desiredR * 2 + minGap))));
  const rows = Math.ceil(n / cols);
  const colW = plotW / cols;
  const rowH = plotH / rows;

  // 셀에 맞게 반지름 제한
  const maxR = Math.min(desiredR, (colW - minGap) / 2, (rowH - labelSpace - minGap) / 2);

  for (let c = 0; c < n; c++) {
    const col = c % cols;
    const row = Math.floor(c / cols);
    const cx = plotX + colW * col + colW / 2;
    const cy = plotY + rowH * row + (rowH - labelSpace) / 2;
    const total = data.categories[c].values.reduce((a, b) => a + b, 0);
    let startAngle = -Math.PI / 2 + rotationRad;

    for (let s = 0; s < sCount; s++) {
      const val = data.categories[c].values[s] || 0;
      const ratio = total > 0 ? val / total : 0;
      const endAngle = startAngle + ratio * Math.PI * 2;

      ctx.fillStyle = getStackedFill(ctx, s);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 데이터 라벨
      if (options.showDataLabels && ratio > 0.05) {
        const midAngle = (startAngle + endAngle) / 2;
        const lx = cx + Math.cos(midAngle) * maxR * 0.65;
        const ly = cy + Math.sin(midAngle) * maxR * 0.65;
        ctx.fillStyle = isLightFill(s) ? '#000' : '#fff';
        ctx.font = getFont(options.fontSize.dataLabel * 0.8, font, customFont, 'bold');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(val), lx, ly);
      }

      startAngle = endAngle;
    }

    // 원 외곽선
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
    ctx.stroke();

    // 카테고리 라벨
    ctx.fillStyle = '#000';
    ctx.font = getFont(options.fontSize.tick, font, customFont, 'bold');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(data.categories[c].label, cx, cy + maxR + 12);
  }

  // 제목
  drawTitle({ ctx, plotX, plotW, title: options.title, fontSize: options.fontSize.title });

  // 범례
  if (showLegend) {
    const items = data.seriesLabels.map((label, i) => ({
      type: 'rect' as const,
      fillStyle: getStackedFill(ctx, i),
      bordered: isLightFill(i),
      label,
    }));
    drawLegend({
      ctx, items, position: legendPos,
      plotX, plotY, plotW, plotH,
      fontSize: options.fontSize.dataLabel * 0.85 + 5,
    });
  }

  // 출처 + 각주
  drawSourceAndFootnote({ ctx, plotX, plotW, height: h, source: options.source, footnotes: options.footnotes, fontSize: options.fontSize.dataLabel, canvasWidth: w });
}
