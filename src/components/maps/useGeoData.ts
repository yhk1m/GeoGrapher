// © 2026 김용현
// GeoJSON fetch + 메모리 캐시
import { useEffect, useState } from 'react';
import type { FeatureCollection } from 'geojson';
import { MAP_UNIT_FILES, type MapUnit, type RegionProps } from './types';

type GeoFC = FeatureCollection<GeoJSON.Geometry, RegionProps>;

const cache = new Map<MapUnit, GeoFC>();

export type GeoDataState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: GeoFC }
  | { status: 'error'; message: string };

export function useGeoData(unit: MapUnit): GeoDataState {
  const [state, setState] = useState<GeoDataState>({ status: 'idle' });

  useEffect(() => {
    const cached = cache.get(unit);
    if (cached) {
      setState({ status: 'ready', data: cached });
      return;
    }
    setState({ status: 'loading' });
    let cancelled = false;
    // 캐시 버스터: 데이터 파일 변경 시 새 fetch 강제
    const v = import.meta.env.DEV ? Date.now() : '2026041500';
    fetch(`${MAP_UNIT_FILES[unit]}?v=${v}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<GeoFC>;
      })
      .then((data) => {
        if (cancelled) return;
        cache.set(unit, data);
        setState({ status: 'ready', data });
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setState({ status: 'error', message: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, [unit]);

  return state;
}
