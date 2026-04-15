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
