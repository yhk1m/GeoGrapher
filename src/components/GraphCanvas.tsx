// © 2026 김용현
import { useRef, useEffect, useCallback } from 'react';
import { type GraphType, type ClimateMode, type ClimateGraphData, type DeviationAData, type DeviationBData, type PyramidGraphData, type TernaryGraphData, type StackedGraphData, type AbsBarGraphData, type LineGraphData, type ScatterGraphData, type HythergraphData, type CubeGraphData, type RadarGraphData, type GraphOptions } from '../data/types';
import { renderGraph } from '../graphs/renderGraph';

interface GraphCanvasProps {
  graphType: GraphType;
  climateMode: ClimateMode;
  climateData: ClimateGraphData;
  deviationAData: DeviationAData;
  deviationBData: DeviationBData;
  pyramidData: PyramidGraphData;
  ternaryData: TernaryGraphData;
  stackedData: StackedGraphData;
  absBarData: AbsBarGraphData;
  lineData: LineGraphData;
  scatterData: ScatterGraphData;
  hythergraphData: HythergraphData;
  cubeData: CubeGraphData;
  radarData: RadarGraphData;
  options: GraphOptions;
}

export default function GraphCanvas({ graphType, climateMode, climateData, deviationAData, deviationBData, pyramidData, ternaryData, stackedData, absBarData, lineData, scatterData, hythergraphData, cubeData, radarData, options }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const displayW = rect.width;
    const displayH = rect.height;

    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    canvas.style.width = `${displayW}px`;
    canvas.style.height = `${displayH}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const drawn = renderGraph(ctx, displayW, displayH, graphType, {
      climateMode, climateData, deviationAData, deviationBData, pyramidData, ternaryData,
      stackedData, absBarData, lineData, scatterData, hythergraphData, cubeData, radarData,
    }, options);
    if (!drawn) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, displayW, displayH);
      ctx.fillStyle = '#ccc';
      ctx.font = "16px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('이 그래프 유형은 아직 준비 중입니다.', displayW / 2, displayH / 2);
    }
  }, [graphType, climateMode, climateData, deviationAData, deviationBData, pyramidData, ternaryData, stackedData, absBarData, lineData, scatterData, hythergraphData, cubeData, radarData, options]);

  useEffect(() => {
    render();
    const observer = new ResizeObserver(render);
    if (containerRef.current) observer.observe(containerRef.current);
    // 웹폰트(Noto)가 늦게 도착하면 대체 글꼴로 그린 그림을 다시 그린다
    const fonts = document.fonts;
    fonts?.addEventListener?.('loadingdone', render);
    return () => {
      observer.disconnect();
      fonts?.removeEventListener?.('loadingdone', render);
    };
  }, [render]);

  return (
    <div ref={containerRef} style={styles.container}>
      <canvas ref={canvasRef} style={styles.canvas} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    minWidth: 0,
    position: 'relative',
    background: '#fff',
  },
  canvas: {
    display: 'block',
    position: 'absolute',
    top: 0,
    left: 0,
  },
};
