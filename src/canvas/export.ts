// © 2026 김용현
import { type ExportSettings, type GraphType } from '../data/types';

const TYPE_NAMES: Record<GraphType, string> = {
  guide: 'guide',
  climate: 'climate',
  pyramid: 'pyramid',
  ternary: 'ternary',
  stacked: 'stacked',
  absbar: 'absbar',
  scatter: 'scatter',
  hythergraph: 'hythergraph',
  cube: 'cube',
  radar: 'radar',
  choropleth: 'choropleth',
  symbolmap: 'symbolmap',
  isoline: 'isoline',
  flowmap: 'flowmap',
};

export function exportCanvasToPNG(
  renderFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  settings: ExportSettings,
  graphType: GraphType
) {
  const w = settings.mode === 'exam' ? 800 : settings.width;
  const h = settings.mode === 'exam' ? 600 : settings.height;
  const scale = settings.scale;

  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // 흰색 배경
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);

  renderFn(ctx, w, h);

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const filename = `GeoGrapher_${TYPE_NAMES[graphType]}_${dateStr}.png`;

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
