// © 2026 김용현
import { useRef, useEffect, useCallback } from 'react';
import { type GraphType, type ClimateMode, type ClimateGraphData, type DeviationAData, type DeviationBData, type PyramidGraphData, type TernaryGraphData, type StackedGraphData, type ScatterGraphData, type HythergraphData, type CubeGraphData, type RadarGraphData, type GraphOptions } from '../data/types';
import { renderClimateGraph } from '../graphs/ClimateGraph';
import { renderDeviationAGraph } from '../graphs/DeviationAGraph';
import { renderDeviationBGraph } from '../graphs/DeviationBGraph';
import { renderPyramidGraph } from '../graphs/PopulationPyramid';
import { renderTernaryGraph } from '../graphs/TernaryDiagram';
import { renderStackedGraph } from '../graphs/StackedBarPie';
import { renderScatterGraph } from '../graphs/ScatterBubble';
import { renderHythergraph } from '../graphs/Hythergraph';
import { renderCubeGraph } from '../graphs/CubeGraph';
import { renderRadarChart } from '../graphs/RadarChart';

interface GraphCanvasProps {
  graphType: GraphType;
  climateMode: ClimateMode;
  climateData: ClimateGraphData;
  deviationAData: DeviationAData;
  deviationBData: DeviationBData;
  pyramidData: PyramidGraphData;
  ternaryData: TernaryGraphData;
  stackedData: StackedGraphData;
  scatterData: ScatterGraphData;
  hythergraphData: HythergraphData;
  cubeData: CubeGraphData;
  radarData: RadarGraphData;
  options: GraphOptions;
}

export default function GraphCanvas({ graphType, climateMode, climateData, deviationAData, deviationBData, pyramidData, ternaryData, stackedData, scatterData, hythergraphData, cubeData, radarData, options }: GraphCanvasProps) {
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

    if (graphType === 'climate') {
      if (climateMode === 'normal') {
        renderClimateGraph(ctx, displayW, displayH, climateData, options);
      } else if (climateMode === 'deviationA') {
        renderDeviationAGraph(ctx, displayW, displayH, deviationAData, options);
      } else {
        renderDeviationBGraph(ctx, displayW, displayH, deviationBData, options);
      }
    } else if (graphType === 'pyramid') {
      renderPyramidGraph(ctx, displayW, displayH, pyramidData, options);
    } else if (graphType === 'ternary') {
      renderTernaryGraph(ctx, displayW, displayH, ternaryData, options);
    } else if (graphType === 'stacked') {
      renderStackedGraph(ctx, displayW, displayH, stackedData, options);
    } else if (graphType === 'scatter') {
      renderScatterGraph(ctx, displayW, displayH, scatterData, options);
    } else if (graphType === 'hythergraph') {
      renderHythergraph(ctx, displayW, displayH, hythergraphData, options);
    } else if (graphType === 'cube') {
      renderCubeGraph(ctx, displayW, displayH, cubeData, options);
    } else if (graphType === 'radar') {
      renderRadarChart(ctx, displayW, displayH, radarData, options);
    } else {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, displayW, displayH);
      ctx.fillStyle = '#ccc';
      ctx.font = "16px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('이 그래프 유형은 아직 준비 중입니다.', displayW / 2, displayH / 2);
    }
  }, [graphType, climateMode, climateData, deviationAData, deviationBData, pyramidData, ternaryData, stackedData, scatterData, hythergraphData, cubeData, radarData, options]);

  useEffect(() => {
    render();
    const observer = new ResizeObserver(render);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
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
