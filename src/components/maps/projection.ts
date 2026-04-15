// © 2026 김용현
// 지도 단위별 투영법 선택
import { geoMercator, type GeoProjection } from 'd3-geo';
// @ts-expect-error d3-geo-projection 타입 선언 없음
import { geoMiller } from 'd3-geo-projection';
import type { FeatureCollection } from 'geojson';
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
    // 태평양 중심: λ를 180° 회전하여 경도 180°(국제 날짜 변경선)를 지도 중앙으로
    if (unit === 'world_pacific') {
      proj.rotate([-180, 0, 0]);
    }
    proj.fitSize([width, height], data);
    return proj;
  }
  // 한국: Mercator
  return geoMercator().fitSize([width, height], data);
}
