// © 2026 김용현
const LABEL_FONT = "'Noto Sans KR', sans-serif";

interface TitleParams {
  ctx: CanvasRenderingContext2D;
  plotX: number;
  plotW: number;
  title: string;
  fontSize: number;
}

export function drawTitle({ ctx, plotX, plotW, title, fontSize }: TitleParams) {
  if (!title) return;
  ctx.save();
  ctx.fillStyle = '#000';
  ctx.font = `bold ${fontSize}px ${LABEL_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(title, plotX + plotW / 2, 10);
  ctx.restore();
}

interface SourceFootnoteParams {
  ctx: CanvasRenderingContext2D;
  plotX: number;
  plotW: number;
  height: number;
  source: string;
  footnotes: string[];
  fontSize: number;
  canvasWidth?: number;
}

const MIN_MARGIN = 100;

export function drawSourceAndFootnote({
  ctx, plotX, plotW, height, source, footnotes, fontSize, canvasWidth,
}: SourceFootnoteParams) {
  ctx.save();

  let leftX = plotX;
  let rightX = plotX + plotW;
  if (canvasWidth != null) {
    leftX = Math.max(plotX, MIN_MARGIN);
    rightX = Math.min(plotX + plotW, canvasWidth - MIN_MARGIN);
  }

  // 위에서 아래로: 출처 → 각주들
  const filtered = footnotes.filter((f) => f.trim());
  const totalFootnoteH = filtered.length * (fontSize * 0.9 + 4);
  const sourceH = source ? fontSize + 4 : 0;
  let y = height - 6 - totalFootnoteH;

  if (source) {
    ctx.fillStyle = '#555';
    ctx.font = `bold ${fontSize}px ${LABEL_FONT}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(source, rightX, y);
    y += sourceH;
  }

  for (let i = 0; i < filtered.length; i++) {
    ctx.fillStyle = '#555';
    ctx.font = `${fontSize * 0.9}px ${LABEL_FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('* ' + filtered[i], leftX, y);
    y += fontSize * 0.9 + 4;
  }

  ctx.restore();
}

// ── 겹침 회피 라벨 배치 ─────────────────────────────────────
//
// 점이 붙어 있으면 라벨끼리, 또는 라벨과 점이 겹쳐 읽을 수 없게 된다.
// 후보 위치를 순서대로 시도해 빈 자리를 찾고, 어디에도 안 들어가면
// 가장 멀리 밀어낸 뒤 유도선을 그어 어느 점의 라벨인지 알 수 있게 한다.

export interface LabelBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** 이미 자리를 차지한 영역들을 모아 두고 충돌을 판정한다 */
export class LabelPlacer {
  private used: LabelBox[] = [];

  /** 점 자체도 자리를 차지한다 — 라벨이 점 위에 얹히지 않게 미리 등록한다 */
  reserve(box: LabelBox) {
    this.used.push(box);
  }

  reserveCircle(cx: number, cy: number, r: number) {
    this.used.push({ left: cx - r, right: cx + r, top: cy - r, bottom: cy + r });
  }

  private overlaps(box: LabelBox): boolean {
    return this.used.some(
      (u) => !(box.right < u.left || box.left > u.right || box.bottom < u.top || box.top > u.bottom)
    );
  }

  /**
   * (cx, cy) 근처에 라벨을 놓는다.
   *
   * 가까운 후보부터 8방향으로 시도하고, 다 막히면 거리를 늘려 다시 돈다.
   * 그래도 안 되면 마지막 후보에 놓고 유도선을 긋는다.
   *
   * @param bounds 라벨이 벗어나면 안 되는 영역 (플롯 영역)
   */
  place(
    ctx: CanvasRenderingContext2D,
    label: string,
    cx: number,
    cy: number,
    opts: { gap: number; lineHeight: number; bounds: LabelBox }
  ) {
    const w = ctx.measureText(label).width;
    const h = opts.lineHeight;
    const { gap, bounds } = opts;

    // 가까운 곳부터 — 오른쪽 위를 먼저 본다(기존 기본 위치)
    const dirs: [number, number][] = [
      [1, -1], [1, 0], [0, -1], [-1, -1],
      [-1, 0], [0, 1], [1, 1], [-1, 1],
    ];

    let fallback: { x: number; y: number } | null = null;

    for (const dist of [gap, gap * 2, gap * 3.5]) {
      for (const [dx, dy] of dirs) {
        const x = cx + dx * dist - (dx < 0 ? w : dx === 0 ? w / 2 : 0);
        const y = cy + dy * dist - (dy > 0 ? 0 : dy === 0 ? h / 2 : h);
        const box = { left: x, right: x + w, top: y, bottom: y + h };

        if (box.left < bounds.left || box.right > bounds.right) continue;
        if (box.top < bounds.top || box.bottom > bounds.bottom) continue;

        if (!this.overlaps(box)) {
          this.used.push(box);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(label, x, y);
          return;
        }
        if (!fallback) fallback = { x, y };
      }
    }

    // 다 막혔다 — 가장 먼 자리에 놓고 유도선을 긋는다
    const far = fallback ?? { x: cx + gap, y: cy - h };
    const box = { left: far.x, right: far.x + w, top: far.y, bottom: far.y + h };
    this.used.push(box);

    ctx.save();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(far.x + w / 2, far.y + h / 2);
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(label, far.x, far.y);
  }
}

// ── 눈금 라벨 겹침 방지 ─────────────────────────────────────

/**
 * 눈금 라벨을 몇 개 걸러 그릴지 정한다.
 *
 * 축 범위가 좁거나 칸이 많으면 숫자가 서로 붙어 읽을 수 없게 된다.
 * 라벨 크기와 눈금 간격을 재서, 겹치지 않는 최소 간격(stride)을 돌려준다.
 * 1이면 전부 그려도 된다는 뜻이다.
 *
 * 눈금 표시(작은 선)는 그대로 두고 숫자만 솎아낸다 — 축의 눈금 간격 자체는
 * 그래프가 읽히는 근거이므로 없애면 안 된다.
 *
 * @param spacing 이웃한 눈금 사이의 픽셀 거리
 * @param extent  라벨이 축 방향으로 차지하는 크기 (가로축이면 글자 너비, 세로축이면 줄 높이)
 */
export function labelStride(spacing: number, extent: number, minGap = 6): number {
  if (!Number.isFinite(spacing) || spacing <= 0) return 1;
  return Math.max(1, Math.ceil((extent + minGap) / spacing));
}

/** 눈금 라벨들 중 가장 넓은 글자 너비 */
export function widestLabel(ctx: CanvasRenderingContext2D, labels: string[]): number {
  if (labels.length === 0) return 0;
  return Math.max(...labels.map((l) => ctx.measureText(l).width));
}
