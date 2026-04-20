// © 2026 김용현
// 지도 단위별 투영법 선택
import { geoMercator, type GeoPath, type GeoProjection } from 'd3-geo';
// @ts-expect-error d3-geo-projection 타입 선언 없음
import { geoMiller } from 'd3-geo-projection';
import type { Feature, FeatureCollection, Geometry, Polygon } from 'geojson';
import type { MapUnit, RegionProps } from './types';
import { MAP_UNIT_SCOPE } from './types';

export function createProjection(
  unit: MapUnit,
  width: number,
  height: number,
  data: FeatureCollection<GeoJSON.Geometry, RegionProps>,
): GeoProjection {
  if (MAP_UNIT_SCOPE[unit] === 'world') {
    const proj = geoMiller() as GeoProjection;
    // 태평양 중심: 중앙 경도를 150°E로 설정 (rotate λ=-150)
    // → antimeridian clip이 대서양 한가운데 약 30°W에 위치하므로 아프리카·유럽이 온전히 보존됨
    //   (rotate([-180])이면 cut이 0° 그리니치선 근처라 아프리카 서부가 잘림)
    if (unit === 'world_pacific') {
      proj.rotate([-150, 0, 0]);
    }
    proj.fitSize([width, height], data);
    return proj;
  }
  // 한국: Mercator
  return geoMercator().fitSize([width, height], data);
}

// MultiPolygon에서 가장 큰 폴리곤의 centroid를 반환.
// 프랑스(본토 + 기아나 + 코르시카), 미국(본토 + 알래스카 + 하와이) 등
// 해외 영토를 가진 나라에서 전체 MultiPolygon centroid가 바다에 찍히는 문제를 해결.
export function featureCentroid(
  path: GeoPath,
  feature: Feature<Geometry, RegionProps>,
): [number, number] {
  const geom = feature.geometry;
  if (geom?.type === 'MultiPolygon' && geom.coordinates.length > 1) {
    let bestArea = -Infinity;
    let best: [number, number] = [NaN, NaN];
    for (const coords of geom.coordinates) {
      const sub: Feature<Polygon, RegionProps> = {
        type: 'Feature',
        properties: feature.properties,
        geometry: { type: 'Polygon', coordinates: coords },
      };
      const area = Math.abs(path.area(sub));
      if (area > bestArea) {
        bestArea = area;
        best = path.centroid(sub);
      }
    }
    return best;
  }
  return path.centroid(feature);
}
