GeoGrapher 지도 모듈 GeoJSON 배치 안내
=====================================

이 디렉토리에 다음 3개 파일을 배치해야 지도 시각화 모듈이 동작합니다.

필수 파일
---------
1. sido.geojson                      17개 시·도 광역 행정구역
2. sigungu.geojson                   약 250개 시·군·구 전체
3. sigungu_metro_merged.geojson      약 170개 (광역시/특별시는 통합)

좌표계: EPSG:4326 (WGS84)

Properties 표준 필드
--------------------
- code         (string)  행정구역 코드 (시·도 2자리, 시·군·구 5자리)
- name         (string)  전체 명칭 (예: "서울특별시", "수원시 장안구")
- name_short   (string)  약칭 (예: "서울", "수원 장안")
- parent_code  (string)  상위 시·도 코드 (시·군·구에만)
- parent_name  (string)  상위 시·도 명칭 (시·군·구에만)
- region_type  (string)  "sido" | "sigungu" | "metro_merged"

데이터 출처 (공공데이터 개방 라이선스 확인 필요)
-------------------------------------------
- 통계청 SGIS: https://sgis.kostat.go.kr/
- 행정안전부 행정구역 경계 (공공데이터포털)
- 공개 GitHub 저장소의 한국 GeoJSON (예: southkorea/southkorea-maps)

광역 통합(sigungu_metro_merged) 생성
-----------------------------------
sigungu.geojson에서 행정구역 코드 앞 2자리가 아래인 지역들을
dissolve(병합)하여 단일 폴리곤으로 묶는다.

- 11 서울특별시  21 부산광역시  22 대구광역시  23 인천광역시
- 24 광주광역시  25 대전광역시  26 울산광역시  29 세종특별자치시

빌드 타임에 mapshaper CLI 또는 Python geopandas로 사전 생성.

용량 최적화
----------
- mapshaper -simplify dp 10% 로 꼭짓점 수 감소
- 목표 용량: sido < 300KB, sigungu < 1.5MB, sigungu_metro_merged < 1.2MB
