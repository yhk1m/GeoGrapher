// © 2026 김용현
import { useState, useCallback } from 'react';
import Header from './components/Header';
import GuidePage from './components/GuidePage';
import GraphCanvas from './components/GraphCanvas';
import DataDrawer from './components/DataDrawer';
import ExportModal from './components/ExportModal';
import AnnouncementModal, { shouldShowAnnouncement } from './components/AnnouncementModal';
import MapEditor from './components/maps/MapEditor';
import SymbolMapEditor from './components/maps/SymbolMapEditor';
import IsolineEditor from './components/maps/IsolineEditor';
import FlowMapEditor from './components/maps/FlowMapEditor';
import { isMapGraphType } from './data/types';
import {
  type GraphType,
  type ClimateMode,
  type ClimateGraphData,
  type DeviationAData,
  type DeviationBData,
  type PyramidGraphData,
  type TernaryGraphData,
  type StackedGraphData,
  type AbsBarGraphData,
  type ScatterGraphData,
  type HythergraphData,
  type CubeGraphData,
  type RadarGraphData,
  type GraphOptions,
  type ExportSettings,
  createDefaultClimateData,
  createDefaultDeviationAData,
  createDefaultDeviationBData,
  createDefaultPyramidData,
  createDefaultTernaryData,
  createDefaultStackedData,
  createDefaultAbsBarData,
  createDefaultScatterData,
  createDefaultHythergraphData,
  createDefaultCubeData,
  createDefaultRadarData,
  createDefaultGraphOptions,
  createDefaultExportSettings,
} from './data/types';

export default function App() {
  const [graphType, setGraphType] = useState<GraphType>('guide');
  const [climateMode, setClimateMode] = useState<ClimateMode>('normal');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(shouldShowAnnouncement);

  const [climateData, setClimateData] = useState<ClimateGraphData>(createDefaultClimateData);
  const [deviationAData, setDeviationAData] = useState<DeviationAData>(createDefaultDeviationAData);
  const [deviationBData, setDeviationBData] = useState<DeviationBData>(createDefaultDeviationBData);
  const [pyramidData, setPyramidData] = useState<PyramidGraphData>(createDefaultPyramidData);
  const [ternaryData, setTernaryData] = useState<TernaryGraphData>(createDefaultTernaryData);
  const [stackedData, setStackedData] = useState<StackedGraphData>(createDefaultStackedData);
  const [absBarData, setAbsBarData] = useState<AbsBarGraphData>(createDefaultAbsBarData);
  const [scatterData, setScatterData] = useState<ScatterGraphData>(createDefaultScatterData);
  const [hythergraphData, setHythergraphData] = useState<HythergraphData>(createDefaultHythergraphData);
  const [cubeData, setCubeData] = useState<CubeGraphData>(createDefaultCubeData);
  const [radarData, setRadarData] = useState<RadarGraphData>(createDefaultRadarData);
  const [options, setOptions] = useState<GraphOptions>(createDefaultGraphOptions);
  const [exportSettings, setExportSettings] = useState<ExportSettings>(createDefaultExportSettings);

  const handleExport = useCallback(() => {
    setExportOpen(true);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header
        graphType={graphType}
        onGraphTypeChange={setGraphType}
        onExport={handleExport}
        onToggleDrawer={() => setDrawerOpen((v) => !v)}
        drawerOpen={drawerOpen}
      />
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: isMapGraphType(graphType) ? 'auto' : 'hidden',
        }}
      >
        {graphType === 'guide' ? (
          <GuidePage onNavigate={setGraphType} />
        ) : graphType === 'choropleth' ? (
          <MapEditor />
        ) : graphType === 'symbolmap' ? (
          <SymbolMapEditor />
        ) : graphType === 'isoline' ? (
          <IsolineEditor />
        ) : graphType === 'flowmap' ? (
          <FlowMapEditor />
        ) : (
          <>
            <GraphCanvas
              graphType={graphType}
              climateMode={climateMode}
              climateData={climateData}
              deviationAData={deviationAData}
              deviationBData={deviationBData}
              pyramidData={pyramidData}
              ternaryData={ternaryData}
              stackedData={stackedData}
              absBarData={absBarData}
              scatterData={scatterData}
              hythergraphData={hythergraphData}
              cubeData={cubeData}
              radarData={radarData}
              options={options}
            />
            <DataDrawer
              open={drawerOpen}
              graphType={graphType}
              climateMode={climateMode}
              onClimateModeChange={setClimateMode}
              climateData={climateData}
              onClimateDataChange={setClimateData}
              deviationAData={deviationAData}
              onDeviationADataChange={setDeviationAData}
              deviationBData={deviationBData}
              onDeviationBDataChange={setDeviationBData}
              pyramidData={pyramidData}
              onPyramidDataChange={setPyramidData}
              ternaryData={ternaryData}
              onTernaryDataChange={setTernaryData}
              stackedData={stackedData}
              onStackedDataChange={setStackedData}
              absBarData={absBarData}
              onAbsBarDataChange={setAbsBarData}
              scatterData={scatterData}
              onScatterDataChange={setScatterData}
              hythergraphData={hythergraphData}
              onHythergraphDataChange={setHythergraphData}
              cubeData={cubeData}
              onCubeDataChange={setCubeData}
              radarData={radarData}
              onRadarDataChange={setRadarData}
              options={options}
              onOptionsChange={setOptions}
            />
          </>
        )}
      </div>
      {exportOpen && (
        <ExportModal
          settings={exportSettings}
          onSettingsChange={setExportSettings}
          graphType={graphType}
          climateMode={climateMode}
          climateData={climateData}
          deviationAData={deviationAData}
          deviationBData={deviationBData}
          pyramidData={pyramidData}
          ternaryData={ternaryData}
          stackedData={stackedData}
          absBarData={absBarData}
          scatterData={scatterData}
          hythergraphData={hythergraphData}
          cubeData={cubeData}
          radarData={radarData}
          options={options}
          onClose={() => setExportOpen(false)}
        />
      )}
      {announcementOpen && (
        <AnnouncementModal
          onClose={() => setAnnouncementOpen(false)}
          onNavigate={setGraphType}
        />
      )}
    </div>
  );
}
