// © 2026 김용현
// 모드 A — 월별 편차 (시계열)
import { type DeviationAData, type GraphOptions } from '../data/types';
import { type Padding, clearCanvas, autoRange, getFont } from '../canvas/renderer';
import { drawTitle, drawSourceAndFootnote } from '../canvas/labels';
import { drawLegend, measureLegendWidth } from '../canvas/legend';

const MONTH_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const INTERVAL_INDICES: Record<number, number[]> = {
  12: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  4: [2, 5, 8, 11],
  2: [0, 6],
};

export function renderDeviationAGraph(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: DeviationAData,
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

  const font = options.fontFamily;
  const customFont = options.customFont;
  const indices = INTERVAL_INDICES[data.monthInterval] ?? INTERVAL_INDICES[12];

  // 편차 계산 (월별 기준값)
  const tempDevs = data.months.map((m, i) => m.temp - data.baseMonths[i].temp);
  const precipDevs = data.months.map((m, i) => m.precip - data.baseMonths[i].precip);

  const visibleTempDevs = indices.map((i) => tempDevs[i]);
  const visiblePrecipDevs = indices.map((i) => precipDevs[i]);

  // 좌축: 강수량 편차
  const precipAxis = data.precipRange.auto
    ? autoRange(visiblePrecipDevs.length > 0 ? visiblePrecipDevs : [0], 6)
    : { min: data.precipRange.min, max: data.precipRange.max, step: 0 };
  if (precipAxis.step === 0) {
    precipAxis.step = Math.max(1, Math.round((precipAxis.max - precipAxis.min) / 6));
  }
  if (data.precipRange.auto) {
    const precipAbs = Math.max(Math.abs(precipAxis.min), Math.abs(precipAxis.max));
    precipAxis.min = -precipAbs;
    precipAxis.max = precipAbs;
  }

  // 우축: 기온 편차
  const tempAxis = data.tempRange.auto
    ? (() => {
        const r = autoRange(visibleTempDevs.length > 0 ? visibleTempDevs : [0], 6);
        const abs = Math.max(Math.abs(r.min), Math.abs(r.max));
        return { min: -abs, max: abs, step: r.step };
      })()
    : { min: data.tempRange.min, max: data.tempRange.max, step: 0 };
  if (tempAxis.step === 0) {
    tempAxis.step = Math.max(0.5, Math.round(((tempAxis.max - tempAxis.min) / 6) * 10) / 10);
  }

  // Y축 (좌: 기온, 우: 강수량)
  drawDeviationYAxis(ctx, padding, w, h, tempAxis, 'left', data.tempLabel, font, customFont, options.fontSize);
  drawDeviationYAxis(ctx, padding, w, h, precipAxis, 'right', data.precipLabel, font, customFont, options.fontSize);

  // X축
  const totalSlots = indices.length;
  const slotW = plotW / totalSlots;

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(plotX, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.stroke();

  ctx.fillStyle = '#000';
  ctx.font = getFont(options.fontSize.tick, font, customFont, 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let s = 0; s < totalSlots; s++) {
    const cx = plotX + slotW * s + slotW / 2;
    ctx.fillText(MONTH_LABELS[indices[s]], cx, plotY + plotH + 12);
  }

  // 기준선 (0선)
  const zeroYPrecip = plotY + plotH - ((0 - precipAxis.min) / (precipAxis.max - precipAxis.min)) * plotH;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(plotX, zeroYPrecip);
  ctx.lineTo(plotX + plotW, zeroYPrecip);
  ctx.stroke();

  // 강수량 편차 막대 — +/- 동일 색상
  const barWidth = slotW * 0.55;
  for (let s = 0; s < totalSlots; s++) {
    const i = indices[s];
    const val = precipDevs[i];
    const cx = plotX + slotW * s + slotW / 2;
    const bx = cx - barWidth / 2;
    const valY = plotY + plotH - ((val - precipAxis.min) / (precipAxis.max - precipAxis.min)) * plotH;

    ctx.fillStyle = val >= 0 ? '#666' : '#CCC';
    const barTop = Math.min(zeroYPrecip, valY);
    const barH = Math.abs(valY - zeroYPrecip);
    ctx.fillRect(bx, barTop, barWidth, barH);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, barTop, barWidth, barH);
  }

  // 기온 편차 꺾은선
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let s = 0; s < totalSlots; s++) {
    const i = indices[s];
    const cx = plotX + slotW * s + slotW / 2;
    const y = plotY + plotH - ((tempDevs[i] - tempAxis.min) / (tempAxis.max - tempAxis.min)) * plotH;
    if (s === 0) ctx.moveTo(cx, y);
    else ctx.lineTo(cx, y);
  }
  ctx.stroke();

  // 기온 점
  for (let s = 0; s < totalSlots; s++) {
    const i = indices[s];
    const cx = plotX + slotW * s + slotW / 2;
    const y = plotY + plotH - ((tempDevs[i] - tempAxis.min) / (tempAxis.max - tempAxis.min)) * plotH;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

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
        { type: 'rect', fillStyle: '#888', strokeStyle: '#444', label: legendLabels[0] },
        { type: 'line', fillStyle: '#000', label: legendLabels[1] },
      ],
      position: legendPos,
      plotX, plotY, plotW, plotH,
      fontSize: options.fontSize.dataLabel * 0.85 + 5,
    });
  }

  drawTitle({ ctx, plotX, plotW, title: options.title, fontSize: options.fontSize.title });
  drawSourceAndFootnote({ ctx, plotX, plotW, height: h, source: options.source, footnote: options.footnote, fontSize: options.fontSize.dataLabel, canvasWidth: w });
}

function drawDeviationYAxis(
  ctx: CanvasRenderingContext2D,
  padding: Padding,
  width: number,
  height: number,
  axis: { min: number; max: number; step: number },
  side: 'left' | 'right',
  label: string,
  fontFamily: 'serif' | 'sans' | 'custom',
  customFont: string | undefined,
  fontSize: { tick: number; axisLabel: number }
) {
  const plotX = padding.left;
  const plotY = padding.top;
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const x = side === 'left' ? plotX : plotX + plotW;

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, plotY);
  ctx.lineTo(x, plotY + plotH);
  ctx.stroke();

  ctx.fillStyle = '#000';
  ctx.font = getFont(fontSize.tick, fontFamily, customFont, 'bold');
  ctx.textBaseline = 'middle';
  ctx.textAlign = side === 'left' ? 'right' : 'left';

  const tickCount = Math.round((axis.max - axis.min) / axis.step);
  for (let i = 0; i <= tickCount; i++) {
    const val = axis.min + i * axis.step;
    const y = plotY + plotH - ((val - axis.min) / (axis.max - axis.min)) * plotH;

    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (side === 'left') {
      ctx.moveTo(x - 6, y);
      ctx.lineTo(x, y);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + 6, y);
    }
    ctx.stroke();

    const tx = side === 'left' ? x - 12 : x + 12;
    const valStr = Number.isInteger(val) ? val.toString() : val.toFixed(1);
    ctx.fillText(valStr, tx, y);
  }

  ctx.save();
  ctx.font = getFont(fontSize.axisLabel, fontFamily, customFont, 'bold');
  ctx.fillStyle = '#000';
  ctx.textBaseline = 'bottom';
  const labelX = side === 'left' ? x - 12 : x + 12;
  ctx.textAlign = side === 'left' ? 'right' : 'left';
  ctx.fillText(label, labelX, plotY - 16);
  ctx.restore();
}
