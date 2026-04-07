// © 2026 김용현
import { type CubeGraphData, type GraphOptions } from '../data/types';
import { clearCanvas, getFont } from '../canvas/renderer';
// labels는 큐브에서 직접 그림

// 사각 투영 (oblique / cabinet)
// 앞면: Z→오른쪽, Y→위 (직사각형)
// 깊이(X): 좌하 대각선
const DEPTH_ANGLE = 35 * Math.PI / 180;
const DEPTH_RATIO = 0.5;
const DEPTH_COS = Math.cos(DEPTH_ANGLE) * DEPTH_RATIO;
const DEPTH_SIN = Math.sin(DEPTH_ANGLE) * DEPTH_RATIO;

function project(
  x: number, y: number, z: number,
  cx: number, cy: number, scale: number
): [number, number] {
  // x=깊이(좌하), y=위, z=오른쪽
  const px = cx + z * scale - x * DEPTH_COS * scale;
  const py = cy - y * scale + x * DEPTH_SIN * scale;
  return [px, py];
}

// 꼭짓점
const V: [number, number, number][] = [
  [0, 0, 0], // 0: 앞-하-좌 (원점)
  [0, 0, 1], // 1: 앞-하-우
  [0, 1, 0], // 2: 앞-상-좌
  [0, 1, 1], // 3: 앞-상-우
  [1, 0, 0], // 4: 뒤-하-좌 (숨김 꼭짓점)
  [1, 0, 1], // 5: 뒤-하-우
  [1, 1, 0], // 6: 뒤-상-좌
  [1, 1, 1], // 7: 뒤-상-우
];

// 모서리: [시작, 끝, 숨김여부]
// vertex 4 (1,0,0) 에 연결된 3개가 뒤쪽(점선)
const EDGES: [number, number, boolean][] = [
  [4, 0, false],
  [4, 5, false],
  // 나머지 전부 실선
  [4, 6, false], // 뒤하좌 → 뒤상좌 (Y축 방향)
  // 앞면
  [0, 1, false],
  [0, 2, false],
  [1, 3, false],
  [2, 3, false],
  // 깊이 방향
  [1, 5, false],
  [2, 6, false],
  [3, 7, false],
  // 뒷면
  [5, 7, false],
  [6, 7, false],
];

export function renderCubeGraph(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: CubeGraphData,
  options: GraphOptions
) {
  clearCanvas(ctx, w, h);

  const font = options.fontFamily;
  const cf = options.customFont;
  const fs = options.fontSize;

  const topPad = options.title ? 80 : 40;
  let bottomPad = 40;
  if (options.source) bottomPad += 30;
  if (options.footnote) bottomPad += 25;

  const availW = w - 240;
  const availH = h - topPad - bottomPad;
  const scale = Math.min(availW * 0.5, availH * 0.55);

  // 큐브 중심을 화면 중심에 맞추기
  const cubeCenter = project(0.5, 0.5, 0.5, 0, 0, scale);
  const cx = w / 2 - cubeCenter[0];
  const cy = topPad + availH / 2 - cubeCenter[1];

  // 꼭짓점 2D 좌표
  const v2 = V.map(([vx, vy, vz]) => project(vx, vy, vz, cx, cy, scale));

  // 뒤쪽 모서리 (점선)
  ctx.save();
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  for (const [a, b, back] of EDGES) {
    if (!back) continue;
    ctx.beginPath();
    ctx.moveTo(v2[a][0], v2[a][1]);
    ctx.lineTo(v2[b][0], v2[b][1]);
    ctx.stroke();
  }
  ctx.restore();

  // 앞쪽 모서리 (실선)
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  for (const [a, b, back] of EDGES) {
    if (back) continue;
    ctx.beginPath();
    ctx.moveTo(v2[a][0], v2[a][1]);
    ctx.lineTo(v2[b][0], v2[b][1]);
    ctx.stroke();
  }

  // 축 화살표 + 라벨
  drawAxes(ctx, data, cx, cy, scale, font, cf, fs);

  // 데이터 포인트
  for (const pt of data.points) {
    const [px, py] = project(pt.x, pt.y, pt.z, cx, cy, scale);

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(px, py, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.font = getFont(fs.dataLabel, font, cf, 'bold');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pt.label, px, py);
  }

  // 큐브 영역 기준으로 제목/출처를 가까이 배치
  const allY = v2.map(([, vy]) => vy);
  const cubeBottom = Math.max(...allY);
  const plotX = 80;
  const plotW = w - 160;

  if (options.title) {
    const yAxisTop = project(0, 1.25, 0, cx, cy, scale);
    ctx.fillStyle = '#000';
    ctx.font = `bold ${fs.title}px 'Noto Sans KR', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(options.title, w / 2, yAxisTop[1] - 50);
  }

  let footY = cubeBottom + 50;
  if (options.source) {
    ctx.fillStyle = '#555';
    ctx.font = `bold ${fs.dataLabel}px 'Noto Sans KR', sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(options.source, plotX + plotW, footY);
    footY += fs.dataLabel + 4;
  }
  if (options.footnote) {
    ctx.fillStyle = '#555';
    ctx.font = `${fs.dataLabel * 0.9}px 'Noto Sans KR', sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('* ' + options.footnote, plotX, footY);
  }
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  const headLen = 10;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4));
  ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  data: CubeGraphData,
  cx: number, cy: number, scale: number,
  font: GraphOptions['fontFamily'],
  cf: string,
  fs: GraphOptions['fontSize']
) {
  const ext = 1.25;

  ctx.strokeStyle = '#000';
  ctx.fillStyle = '#000';
  ctx.lineWidth = 1.5;

  // X축 화살표 (깊이, 좌하): 꼭짓점 (1,0,0)에서 바깥으로
  const xStart = project(1, 0, 0, cx, cy, scale);
  const xEnd = project(ext, 0, 0, cx, cy, scale);
  drawArrow(ctx, xStart[0], xStart[1], xEnd[0], xEnd[1]);

  // Y축 화살표 (위): 꼭짓점 (0,1,0)에서 바깥으로
  const yStart = project(0, 1, 0, cx, cy, scale);
  const yEnd = project(0, ext, 0, cx, cy, scale);
  drawArrow(ctx, yStart[0], yStart[1], yEnd[0], yEnd[1]);

  // Z축 화살표 (오른쪽): 꼭짓점 (0,0,1)에서 바깥으로
  const zStart = project(0, 0, 1, cx, cy, scale);
  const zEnd = project(0, 0, ext, cx, cy, scale);
  drawArrow(ctx, zStart[0], zStart[1], zEnd[0], zEnd[1]);

  const nameFont = getFont(fs.axisLabel, font, cf, 'bold');
  const dirFont = getFont(fs.axisLabel * 0.9, font, cf, 'normal');

  // 좌하 깊이 → Z축 라벨
  ctx.font = nameFont;
  ctx.fillStyle = '#000';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(data.zAxis.name, xEnd[0] - 6, xEnd[1] + 20);

  // Z축 높음 (좌하 깊이 방향)
  ctx.font = dirFont;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const zHighPos = project(1, 0, 0, cx, cy, scale);
  ctx.fillText(data.zAxis.highLabel, zHighPos[0] + 3 + data.zAxis.highOffset.x, zHighPos[1] + 10 + data.zAxis.highOffset.y);

  // 위 → Y축 라벨
  ctx.font = nameFont;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(data.yAxis.name, yEnd[0], yEnd[1] - 10);

  // Y축 높음 (위)
  ctx.font = dirFont;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const yHigh = project(0, 1, 0, cx, cy, scale);
  ctx.fillText(data.yAxis.highLabel, yHigh[0] + 6 + data.yAxis.highOffset.x, yHigh[1] - 20 + data.yAxis.highOffset.y);

  // 오른쪽 → X축 라벨
  ctx.font = nameFont;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(data.xAxis.name, zEnd[0] + 6, zEnd[1]);

  // X축 높음 (오른쪽)
  ctx.font = dirFont;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const zHigh = project(0, 0, 1, cx, cy, scale);
  ctx.fillText(data.xAxis.highLabel, zHigh[0] + data.xAxis.highOffset.x, zHigh[1] + 14 + data.xAxis.highOffset.y);

  // 각 축 낮음 라벨 — 원점(0,0,0) 주변
  ctx.font = dirFont;
  const origin = project(0, 0, 0, cx, cy, scale);

  // X축 낮음
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(data.xAxis.lowLabel, origin[0] + data.xAxis.lowOffset.x, origin[1] + 12 + data.xAxis.lowOffset.y);

  // Y축 낮음
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(data.yAxis.lowLabel, origin[0] - 10 + data.yAxis.lowOffset.x, origin[1] - 4 + data.yAxis.lowOffset.y);

  // Z축 낮음
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(data.zAxis.lowLabel, origin[0] + 10 + data.zAxis.lowOffset.x, origin[1] + 12 + data.zAxis.lowOffset.y);
}
