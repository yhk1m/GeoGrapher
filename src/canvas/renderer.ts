// © 2026 김용현
// Canvas 공통 렌더링 유틸리티

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export function getFont(
  size: number,
  family: 'serif' | 'sans' | 'custom' = 'serif',
  customFont?: string,
  weight: string = 'normal'
): string {
  const familyMap: Record<string, string> = {
    serif: "'Noto Serif KR', 'NanumMyeongjo', serif",
    sans: "'Noto Sans KR', sans-serif",
    custom: customFont || "'Noto Serif KR', serif",
  };
  return `${weight} ${size}px ${familyMap[family]}`;
}

export function clearCanvas(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
}

/** 적절한 눈금 간격을 자동 계산 */
export function niceStep(range: number, maxTicks: number = 8): number {
  const rough = range / maxTicks;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / pow;
  let step: number;
  if (norm <= 1.5) step = 1;
  else if (norm <= 3) step = 2;
  else if (norm <= 7) step = 5;
  else step = 10;
  return step * pow;
}

/** 자동 축 범위 계산 (min, max, step) */
export function autoRange(
  values: number[],
  maxTicks: number = 8
): { min: number; max: number; step: number } {
  if (values.length === 0) return { min: 0, max: 100, step: 20 };
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 10;
    max += 10;
  }
  const margin = (max - min) * 0.1;
  min = min - margin;
  max = max + margin;
  const step = niceStep(max - min, maxTicks);
  min = Math.floor(min / step) * step;
  max = Math.ceil(max / step) * step;
  return { min, max, step };
}
