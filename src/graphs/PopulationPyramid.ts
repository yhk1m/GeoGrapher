// © 2026 김용현
import { type PyramidGraphData, type GraphOptions, AGE_GROUPS } from '../data/types';
import { type Padding, clearCanvas, getFont, niceStep } from '../canvas/renderer';
import { drawTitle, drawSourceAndFootnote } from '../canvas/labels';
import { drawLegend, measureLegendWidth } from '../canvas/legend';

export function renderPyramidGraph(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: PyramidGraphData,
  options: GraphOptions
) {
  clearCanvas(ctx, w, h);

  const showLegend = options.showLegend;
  const legendPos = options.legendPosition;
  const legendLabels = [
    options.legendLabel1 || data.maleLabel,
    options.legendLabel2 || data.femaleLabel,
  ];
  const legendW = (showLegend && legendPos === 'right')
    ? measureLegendWidth(ctx, legendLabels, options.fontSize.dataLabel * 0.85 + 5)
    : 0;

  const padding: Padding = {
    top: options.title ? 100 : 50,
    right: 80 + legendW,
    bottom: (() => {
      let b = 90;
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
  const n = AGE_GROUPS.length; // 17

  // 입력값 그대로 사용
  const displayAges = data.ages;
  const isPercent = data.unit === 'percent';

  // 축 범위 계산
  const allVals = displayAges.flatMap((a) => [a.male, a.female]);
  let maxVal = data.range.auto
    ? Math.max(...allVals, 1)
    : data.range.max;
  // 올림 처리
  if (data.range.auto) {
    const step = niceStep(maxVal, 5);
    maxVal = Math.ceil(maxVal / step) * step;
  }

  const centerX = plotX + plotW / 2;
  const halfW = plotW / 2;
  const barH = plotH / n;
  const barGap = barH * 0.1;
  const actualBarH = barH - barGap - 2;

  // 외곽선 + 연령 라벨 위치 세로선
  const side = data.ageLabelSide;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;

  // 좌측 세로선
  if (side === 'left') {
    ctx.beginPath();
    ctx.moveTo(plotX, plotY);
    ctx.lineTo(plotX, plotY + plotH);
    ctx.stroke();
  }
  // 우측 세로선
  if (side === 'right') {
    ctx.beginPath();
    ctx.moveTo(plotX + plotW, plotY);
    ctx.lineTo(plotX + plotW, plotY + plotH);
    ctx.stroke();
  }
  // 중앙 세로선
  if (side === 'center') {
    ctx.beginPath();
    ctx.moveTo(centerX, plotY);
    ctx.lineTo(centerX, plotY + plotH);
    ctx.stroke();
  }

  // 상단 가로선
  ctx.beginPath();
  ctx.moveTo(plotX, plotY);
  ctx.lineTo(plotX + plotW, plotY);
  ctx.stroke();

  // 하단 가로선
  ctx.beginPath();
  ctx.moveTo(plotX, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.stroke();

  // 격자선 (막대 아래에 그리기 위해 먼저)
  const tickStep = niceStep(maxVal, 5);
  for (let v = tickStep; v <= maxVal; v += tickStep) {
    const offset = (v / maxVal) * halfW;
    ctx.save();
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);
    // 좌측
    ctx.beginPath();
    ctx.moveTo(centerX - offset, plotY);
    ctx.lineTo(centerX - offset, plotY + plotH);
    ctx.stroke();
    // 우측
    ctx.beginPath();
    ctx.moveTo(centerX + offset, plotY);
    ctx.lineTo(centerX + offset, plotY + plotH);
    ctx.stroke();
    ctx.restore();
  }

  // 막대 그리기
  for (let i = 0; i < n; i++) {
    const y = plotY + plotH - (i + 1) * barH + barGap / 2;
    const maleW = (displayAges[i].male / maxVal) * halfW;
    const femaleW = (displayAges[i].female / maxVal) * halfW;

    // 남성 (좌측) — 진한 회색
    ctx.fillStyle = '#666';
    ctx.fillRect(centerX - maleW, y, maleW, actualBarH);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(centerX - maleW, y, maleW, actualBarH);

    // 여성 (우측) — 연한 회색
    ctx.fillStyle = '#BBB';
    ctx.fillRect(centerX, y, femaleW, actualBarH);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(centerX, y, femaleW, actualBarH);
  }

  // 연령 라벨
  ctx.fillStyle = '#000';
  ctx.font = getFont(options.fontSize.tick * 0.75, font, customFont, 'bold');
  ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const y = plotY + plotH - (i + 1) * barH + barH / 2;
    if (side === 'center') {
      ctx.textAlign = 'center';
      ctx.fillText(AGE_GROUPS[i], centerX, y);
    } else if (side === 'left') {
      ctx.textAlign = 'right';
      ctx.fillText(AGE_GROUPS[i], plotX - 8, y);
    } else {
      ctx.textAlign = 'left';
      ctx.fillText(AGE_GROUPS[i], plotX + plotW + 8, y);
    }
  }

  // X축 눈금 (좌우 대칭)
  ctx.font = getFont(options.fontSize.tick, font, customFont, 'bold');
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#000';
  const fmtTick = (v: number) => {
    const r = Math.round(v * 1e10) / 1e10;
    return Number.isInteger(r) ? r.toString() : r.toFixed(1);
  };

  for (let v = 0; v <= maxVal + tickStep * 0.001; v += tickStep) {
    const rv = Math.round(v * 1e10) / 1e10;
    if (rv > maxVal) break;
    const offset = (rv / maxVal) * halfW;

    // 좌측
    const lx = centerX - offset;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx, plotY + plotH);
    ctx.lineTo(lx, plotY + plotH + 5);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillText(fmtTick(rv), lx, plotY + plotH + 10);

    // 우측
    const rx = centerX + offset;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx, plotY + plotH);
    ctx.lineTo(rx, plotY + plotH + 5);
    ctx.stroke();
    if (rv > 0) {
      ctx.textAlign = 'center';
      ctx.fillText(fmtTick(rv), rx, plotY + plotH + 10);
    }
  }

  // 축 라벨 (좌: 남, 우: 여)
  ctx.font = getFont(options.fontSize.axisLabel, font, customFont, 'bold');
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.fillText(data.maleLabel, plotX + halfW / 2, plotY - 16);
  ctx.fillText(data.femaleLabel, centerX + halfW / 2, plotY - 16);

  // 단위 라벨 — X축 숫자 아래, 좌우 끝 바깥
  ctx.font = getFont(options.fontSize.axisLabel * 0.85, font, customFont, 'bold');
  const unitY = plotY + plotH + 10 + options.fontSize.tick + 22;
  ctx.textAlign = 'left';
  ctx.fillText(data.axisLabel, plotX + plotW + 4, unitY);

  // 데이터 라벨
  if (options.showDataLabels) {
    ctx.font = getFont(options.fontSize.dataLabel * 0.8, font, customFont, 'bold');
    ctx.fillStyle = '#000';
    for (let i = 0; i < n; i++) {
      const y = plotY + plotH - (i + 1) * barH + barH / 2;
      const mW = (displayAges[i].male / maxVal) * halfW;
      const fW = (displayAges[i].female / maxVal) * halfW;
      const mLabel = isPercent ? displayAges[i].male.toFixed(1) : String(displayAges[i].male);
      const fLabel = isPercent ? displayAges[i].female.toFixed(1) : String(displayAges[i].female);

      if (displayAges[i].male > 0) {
        ctx.textAlign = 'right';
        ctx.fillText(mLabel, centerX - mW - 4, y);
      }
      if (displayAges[i].female > 0) {
        ctx.textAlign = 'left';
        ctx.fillText(fLabel, centerX + fW + 4, y);
      }
    }
  }

  // 제목
  drawTitle({ ctx, plotX, plotW, title: options.title, fontSize: options.fontSize.title });

  // 범례

  if (showLegend) {
    drawLegend({
      ctx,
      items: [
        { type: 'rect', fillStyle: '#666', strokeStyle: '#444', label: legendLabels[0] },
        { type: 'rect', fillStyle: '#BBB', strokeStyle: '#888', label: legendLabels[1] },
      ],
      position: legendPos,
      plotX, plotY, plotW, plotH,
      fontSize: options.fontSize.dataLabel * 0.85 + 5,
    });
  }

  // 출처 + 각주
  drawSourceAndFootnote({ ctx, plotX, plotW, height: h, source: options.source, footnotes: options.footnotes, fontSize: options.fontSize.dataLabel, canvasWidth: w });
}
