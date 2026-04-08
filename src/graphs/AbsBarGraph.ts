// © 2026 김용현
import { type AbsBarGraphData, type GraphOptions } from '../data/types';
import { type Padding, clearCanvas, autoRange, getFont } from '../canvas/renderer';
import { drawYAxis } from '../canvas/axes';
import { drawTitle, drawSourceAndFootnote } from '../canvas/labels';
import { drawLegend, measureLegendWidth } from '../canvas/legend';
import { getStackedFill, isLightFill } from '../canvas/patterns';

export function renderAbsBarGraph(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: AbsBarGraphData,
  options: GraphOptions
) {
  clearCanvas(ctx, w, h);

  const showLegend = options.showLegend;
  const legendPos = options.legendPosition;
  const legendW = (showLegend && legendPos === 'right')
    ? measureLegendWidth(ctx, data.seriesLabels, options.fontSize.dataLabel * 0.85 + 5)
    : 0;

  const isVertical = data.barDirection === 'vertical';
  const font = options.fontFamily;
  const customFont = options.customFont;
  const n = data.categories.length;
  const sCount = data.seriesLabels.length;

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
    left: isVertical ? 130 : 100,
  };

  const plotX = padding.left;
  const plotY = padding.top;
  const plotW = w - padding.left - padding.right;
  const plotH = h - padding.top - padding.bottom;

  // 축 범위 계산
  const allValues: number[] = [0]; // 0을 항상 포함 (막대 기준선)
  for (const cat of data.categories) {
    if (data.stacked) {
      allValues.push(cat.values.reduce((a, b) => a + b, 0));
    } else {
      allValues.push(...cat.values);
    }
  }
  if (allValues.length <= 1) allValues.push(100);

  let axis = data.yRange.auto
    ? autoRange(allValues, 6)
    : {
        min: data.yRange.min,
        max: data.yRange.max,
        step: data.yRange.step || Math.max(1, Math.round((data.yRange.max - data.yRange.min) / 6)),
      };

  // 최댓값에 맞추기: 축 최댓값을 데이터 최댓값으로 설정
  if (data.yRange.auto && data.fitMax) {
    const dataMax = Math.max(...allValues);
    axis = { ...axis, max: dataMax };
  }

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;

  if (isVertical) {
    // 사각 테두리
    ctx.beginPath();
    ctx.moveTo(plotX, plotY);
    ctx.lineTo(plotX, plotY + plotH);
    ctx.lineTo(plotX + plotW, plotY + plotH);
    ctx.lineTo(plotX + plotW, plotY);
    ctx.lineTo(plotX, plotY);
    ctx.stroke();

    // Y축 눈금
    drawYAxis({
      ctx, padding, width: w, height: h,
      min: axis.min, max: axis.max, step: axis.step,
      label: data.unit,
      side: 'left',
      fontFamily: font, customFont,
      tickFontSize: options.fontSize.tick,
      labelFontSize: options.fontSize.axisLabel,
      drawGrid: true,
    });

    // 막대 (플롯 영역 클리핑)
    ctx.save();
    ctx.beginPath();
    ctx.rect(plotX, plotY, plotW, plotH);
    ctx.clip();

    const catArea = plotW / n;
    const valToY = (v: number) => plotY + plotH - ((v - axis.min) / (axis.max - axis.min)) * plotH;
    if (data.stacked) {
      const barW = Math.min(catArea * 0.5, 80);
      for (let c = 0; c < n; c++) {
        const cx = plotX + catArea * c + catArea / 2;
        let cumVal = 0;
        for (let s = 0; s < sCount; s++) {
          const val = data.categories[c].values[s] || 0;
          const y = valToY(cumVal + val);
          const barH = valToY(cumVal) - y;

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
          cumVal += val;
        }
      }
    } else {
      // 그룹 막대
      const groupW = Math.min(catArea * 0.7, sCount * 60);
      const barW = groupW / sCount;
      for (let c = 0; c < n; c++) {
        const groupStart = plotX + catArea * c + (catArea - groupW) / 2;
        for (let s = 0; s < sCount; s++) {
          const val = data.categories[c].values[s] || 0;
          const by = valToY(val);
          const barH = valToY(axis.min) - by;
          const bx = groupStart + barW * s;

          ctx.fillStyle = getStackedFill(ctx, s);
          ctx.fillRect(bx, by, barW, barH);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(bx, by, barW, barH);

          if (options.showDataLabels && barH > options.fontSize.dataLabel) {
            ctx.fillStyle = isLightFill(s) ? '#000' : '#fff';
            ctx.font = getFont(options.fontSize.dataLabel * 0.8, font, customFont, 'bold');
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(String(val), bx + barW / 2, by - 4);
          }
        }
      }
    }
    ctx.restore(); // 클리핑 해제

    // X축 라벨 (클리핑 밖에서)
    for (let c = 0; c < n; c++) {
      const cx = plotX + catArea * c + catArea / 2;
      ctx.fillStyle = '#000';
      ctx.font = getFont(options.fontSize.tick, font, customFont, 'bold');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(data.categories[c].label, cx, plotY + plotH + 12);
    }
  } else {
    // 가로 — 사각 테두리
    ctx.beginPath();
    ctx.moveTo(plotX, plotY);
    ctx.lineTo(plotX, plotY + plotH);
    ctx.lineTo(plotX + plotW, plotY + plotH);
    ctx.lineTo(plotX + plotW, plotY);
    ctx.lineTo(plotX, plotY);
    ctx.stroke();

    // X축 눈금 (하단)
    const ticks: number[] = [];
    for (let v = axis.min; v < axis.max - axis.step * 1e-9; v += axis.step) {
      ticks.push(Math.abs(v) < 1e-9 ? 0 : v);
    }
    if (ticks.length === 0 || Math.abs(ticks[ticks.length - 1] - axis.max) > 1e-9) {
      ticks.push(axis.max);
    }

    ctx.font = getFont(options.fontSize.tick, font, customFont, 'bold');
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < ticks.length; i++) {
      const v = ticks[i];
      const x = plotX + ((v - axis.min) / (axis.max - axis.min)) * plotW;
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(x, plotY + plotH);
      ctx.lineTo(x, plotY + plotH + 5);
      ctx.stroke();
      ctx.fillText(formatTick(v), x, plotY + plotH + 10);

      if (i > 0 && i < ticks.length - 1) {
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
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(data.unit, plotX + plotW + 30, plotY + plotH + 10);

    // 막대 (플롯 영역 클리핑)
    ctx.save();
    ctx.beginPath();
    ctx.rect(plotX, plotY, plotW, plotH);
    ctx.clip();

    const catArea = plotH / n;
    const valToX = (v: number) => plotX + ((v - axis.min) / (axis.max - axis.min)) * plotW;
    if (data.stacked) {
      const barH = Math.min(catArea * 0.5, 80);
      for (let c = 0; c < n; c++) {
        const cy = plotY + catArea * c + catArea / 2;
        let cumVal = 0;
        for (let s = 0; s < sCount; s++) {
          const val = data.categories[c].values[s] || 0;
          const bx = valToX(cumVal);
          const bw = valToX(cumVal + val) - bx;

          ctx.fillStyle = getStackedFill(ctx, s);
          ctx.fillRect(bx, cy - barH / 2, bw, barH);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(bx, cy - barH / 2, bw, barH);

          if (options.showDataLabels && bw > options.fontSize.dataLabel * 2) {
            ctx.fillStyle = isLightFill(s) ? '#000' : '#fff';
            ctx.font = getFont(options.fontSize.dataLabel * 0.8, font, customFont, 'bold');
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(val), bx + bw / 2, cy);
          }
          cumVal += val;
        }
      }
    } else {
      // 그룹 막대 (가로)
      const groupH = Math.min(catArea * 0.7, sCount * 60);
      const barH = groupH / sCount;
      for (let c = 0; c < n; c++) {
        const groupStart = plotY + catArea * c + (catArea - groupH) / 2;
        for (let s = 0; s < sCount; s++) {
          const val = data.categories[c].values[s] || 0;
          const bx = valToX(axis.min);
          const bw = valToX(val) - bx;
          const by = groupStart + barH * s;

          ctx.fillStyle = getStackedFill(ctx, s);
          ctx.fillRect(bx, by, bw, barH);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(bx, by, bw, barH);

          if (options.showDataLabels && bw > options.fontSize.dataLabel * 2) {
            ctx.fillStyle = isLightFill(s) ? '#000' : '#fff';
            ctx.font = getFont(options.fontSize.dataLabel * 0.8, font, customFont, 'bold');
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(val), bx + bw + 4, by + barH / 2);
          }
        }
      }
    }
    ctx.restore(); // 클리핑 해제

    // Y축 라벨 (클리핑 밖에서)
    for (let c = 0; c < n; c++) {
      const cy = plotY + catArea * c + catArea / 2;
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

function formatTick(val: number): string {
  if (Number.isInteger(val)) return val.toString();
  return val.toFixed(1);
}
