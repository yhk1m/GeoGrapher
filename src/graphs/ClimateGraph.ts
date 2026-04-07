// © 2026 김용현
import { type ClimateGraphData, type GraphOptions } from '../data/types';
import { type Padding, clearCanvas, autoRange, getFont } from '../canvas/renderer';
import { drawYAxis, drawXAxis } from '../canvas/axes';
import { drawTitle, drawSourceAndFootnote } from '../canvas/labels';
import { drawLegend, measureLegendWidth } from '../canvas/legend';

const MONTH_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const INTERVAL_INDICES: Record<number, number[]> = {
  12: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  4: [2, 5, 8, 11],
  2: [0, 6],
};

export function renderClimateGraph(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: ClimateGraphData,
  options: GraphOptions
) {
  clearCanvas(ctx, w, h);

  const showLegend = options.showLegend;
  const legendPos = options.legendPosition;
  const legendLabels = [
    options.legendLabel1 || data.precipLabel,
    options.legendLabel2 || data.tempLabel,
  ];
  const legendW = (showLegend && legendPos === 'right')
    ? measureLegendWidth(ctx, legendLabels, options.fontSize.dataLabel * 0.85 + 5)
    : 0;

  const padding: Padding = {
    top: options.title ? 100 : 50,
    right: 130 + legendW,
    bottom: (() => {
      let b = 60;
      if (showLegend && legendPos === 'bottom') b += 60;
      if (options.source) b += 30;
      if (options.footnote) b += 25;
      return b;
    })(),
    left: 130,
  };

  const plotX = padding.left;
  const plotY = padding.top;
  const plotW = w - padding.left - padding.right;
  const plotH = h - padding.top - padding.bottom;

  const temps = data.months.map((m) => m.temp);
  const precips = data.months.map((m) => m.precip);

  // 축 범위 계산
  const tempAxis = data.tempRange.auto
    ? autoRange(temps, 6)
    : { min: data.tempRange.min, max: data.tempRange.max, step: 0 };
  if (!data.tempRange.auto && tempAxis.step === 0) {
    tempAxis.step = Math.max(1, Math.round((tempAxis.max - tempAxis.min) / 6));
  }

  const precipAxis = data.precipRange.auto
    ? autoRange(precips.filter((v) => v > 0).length > 0 ? precips : [0, 100], 6)
    : { min: data.precipRange.min, max: data.precipRange.max, step: 0 };
  if (!data.precipRange.auto && precipAxis.step === 0) {
    precipAxis.step = Math.max(1, Math.round((precipAxis.max - precipAxis.min) / 6));
  }
  if (precipAxis.min < 0) precipAxis.min = 0;

  const font = options.fontFamily;
  const customFont = options.customFont;
  const indices = INTERVAL_INDICES[data.monthInterval] ?? INTERVAL_INDICES[12];

  // 격자선 + Y축 (좌: 기온)
  drawYAxis({
    ctx, padding, width: w, height: h,
    min: tempAxis.min, max: tempAxis.max, step: tempAxis.step,
    label: data.tempLabel,
    side: 'left',
    fontFamily: font, customFont,
    tickFontSize: options.fontSize.tick,
    labelFontSize: options.fontSize.axisLabel,
    drawGrid: true,
  });

  // Y축 (우: 강수량)
  drawYAxis({
    ctx, padding, width: w, height: h,
    min: precipAxis.min, max: precipAxis.max, step: precipAxis.step,
    label: data.precipLabel,
    side: 'right',
    fontFamily: font, customFont,
    tickFontSize: options.fontSize.tick,
    labelFontSize: options.fontSize.axisLabel,
  });

  // X축
  drawXAxis({
    ctx, padding, width: w, height: h,
    labels: MONTH_LABELS,
    indices,
    fontFamily: font, customFont,
    tickFontSize: options.fontSize.tick,
    labelFontSize: options.fontSize.axisLabel,
  });

  // 강수량 막대 (표시 월만)
  const slotW = plotW / 12;
  const barWidth = slotW * 0.55;

  ctx.fillStyle = '#AAAAAA';
  for (const i of indices) {
    const val = data.months[i].precip;
    if (val <= 0) continue;
    const barH = ((val - precipAxis.min) / (precipAxis.max - precipAxis.min)) * plotH;
    const cx = plotX + slotW * i + slotW / 2;
    const bx = cx - barWidth / 2;
    const by = plotY + plotH - barH;
    ctx.fillRect(bx, by, barWidth, barH);

    // 막대 테두리
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, barWidth, barH);
  }

  // 데이터 라벨 (강수량)
  if (options.showDataLabels) {
    ctx.fillStyle = '#000';
    ctx.font = getFont(options.fontSize.dataLabel, font, customFont, 'bold');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (const i of indices) {
      const val = data.months[i].precip;
      if (val <= 0) continue;
      const barH = ((val - precipAxis.min) / (precipAxis.max - precipAxis.min)) * plotH;
      const cx = plotX + slotW * i + slotW / 2;
      const by = plotY + plotH - barH;
      ctx.fillText(String(val), cx, by - 4);
    }
  }

  // 기온 꺾은선 (전체 12개월 연결)
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const cx = plotX + slotW * i + slotW / 2;
    const y =
      plotY + plotH - ((data.months[i].temp - tempAxis.min) / (tempAxis.max - tempAxis.min)) * plotH;
    if (i === 0) ctx.moveTo(cx, y);
    else ctx.lineTo(cx, y);
  }
  ctx.stroke();

  // 기온 점 (표시 월만)
  for (const i of indices) {
    const cx = plotX + slotW * i + slotW / 2;
    const y =
      plotY + plotH - ((data.months[i].temp - tempAxis.min) / (tempAxis.max - tempAxis.min)) * plotH;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx, y, 5, 0, Math.PI * 2);
    ctx.fill();

    // 데이터 라벨 (기온)
    if (options.showDataLabels) {
      ctx.fillStyle = '#000';
      ctx.font = getFont(options.fontSize.dataLabel, font, customFont, 'bold');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(data.months[i].temp), cx, y - 8);
    }
  }

  // 제목
  drawTitle({ ctx, plotX, plotW, title: options.title, fontSize: options.fontSize.title });

  // (월) 라벨
  ctx.fillStyle = '#000';
  ctx.font = getFont(options.fontSize.tick, font, customFont, 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('(월)', plotX + plotW + 30, plotY + plotH + 12);

  // 범례

  if (showLegend) {
    drawLegend({
      ctx,
      items: [
        { type: 'rect', fillStyle: '#AAA', strokeStyle: '#666', label: legendLabels[0] },
        { type: 'line', fillStyle: '#000', label: legendLabels[1] },
      ],
      position: legendPos,
      plotX, plotY, plotW, plotH,
      fontSize: options.fontSize.dataLabel * 0.85 + 5,
    });
  }

  // 출처 + 각주
  drawSourceAndFootnote({ ctx, plotX, plotW, height: h, source: options.source, footnote: options.footnote, fontSize: options.fontSize.dataLabel });
}
