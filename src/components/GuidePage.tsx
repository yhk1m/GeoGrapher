// © 2026 김용현
import { type GraphType } from '../data/types';

interface Props {
  onNavigate: (type: GraphType) => void;
}

export default function GuidePage({ onNavigate }: Props) {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>GeoGrapher</h1>
        <p style={styles.subtitle}>수능/모의고사 지리 과목 출제용 그래프 제작 도구</p>

        <section style={styles.section}>
          <h2 style={styles.h2}>시작하기</h2>
          <ol style={styles.ol}>
            <li>우측 상단 드롭다운에서 원하는 <strong>그래프 유형</strong>을 선택합니다.</li>
            <li>우측 <strong>데이터 입력 패널</strong>에서 데이터와 옵션을 설정합니다.</li>
            <li>그래프가 실시간으로 캔버스에 렌더링됩니다.</li>
            <li>완성된 그래프를 <strong>PNG</strong> 버튼으로 내보냅니다.</li>
          </ol>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>지원 그래프 유형 (8종)</h2>

          <div style={styles.card} onClick={() => onNavigate('climate')}>
            <h3 style={styles.cardTitle}>기후 그래프</h3>
            <p style={styles.cardDesc}>
              기온(꺾은선, 좌축)과 강수량(막대, 우축)을 함께 표시합니다.
              월 표시 간격(12/4/2개월)을 선택할 수 있고, <strong>편차 모드</strong>로 월별 시계열 편차 또는 지역별 비교 편차를 표현할 수 있습니다.
            </p>
          </div>

          <div style={styles.card} onClick={() => onNavigate('pyramid')}>
            <h3 style={styles.cardTitle}>인구 피라미드</h3>
            <p style={styles.cardDesc}>
              남성(좌)과 여성(우)의 연령별 인구를 수평 막대로 표시합니다.
              5세 단위 17구간(0-4세~80+세)이며, 인구수 또는 비율(%)로 전환 가능합니다.
            </p>
          </div>

          <div style={styles.card} onClick={() => onNavigate('ternary')}>
            <h3 style={styles.cardTitle}>삼각 그래프</h3>
            <p style={styles.cardDesc}>
              정삼각형 좌표계에 3개 변수의 비율(합계 100%)을 표시합니다.
              산업 구조(1/2/3차), 토양 삼각도 등에 활용되며, 격자선 간격(10/20/25%)을 설정할 수 있습니다.
              좌변·우변 축 라벨에 <code style={styles.code}>\n</code>을 입력하면 줄바꿈할 수 있습니다.
            </p>
          </div>

          <div style={styles.card} onClick={() => onNavigate('stacked')}>
            <h3 style={styles.cardTitle}>누적 막대/원 그래프</h3>
            <p style={styles.cardDesc}>
              누적 막대 그래프와 원 그래프를 토글로 전환합니다.
              막대는 가로/세로 방향 선택 가능하며, 최대 11개 항목을 흑백 패턴(단색, 사선, 격자, 도트 등)으로 구분합니다.
            </p>
          </div>

          <div style={styles.card} onClick={() => onNavigate('scatter')}>
            <h3 style={styles.cardTitle}>산점도/버블 차트</h3>
            <p style={styles.cardDesc}>
              XY 산점도에 버블 크기(3번째 변수)를 추가할 수 있습니다.
              <strong>편차 산점도 모드</strong>에서는 원점(0,0) 기준 십자선으로 4사분면을 표현합니다.
              Y축 라벨에 <code style={styles.code}>\n</code>을 입력하면 줄바꿈할 수 있습니다.
            </p>
          </div>

          <div style={styles.card} onClick={() => onNavigate('hythergraph')}>
            <h3 style={styles.cardTitle}>하이서그래프</h3>
            <p style={styles.cardDesc}>
              X축(기온)과 Y축(강수량)에 12개월 데이터를 폐합 루프로 연결합니다.
              최대 5개 지역을 동시에 비교할 수 있으며, 기호(원/네모/세모)와 선 스타일(실선/파선/점선)로 구분합니다.
            </p>
          </div>

          <div style={styles.card} onClick={() => onNavigate('cube')}>
            <h3 style={styles.cardTitle}>정육면체 그래프</h3>
            <p style={styles.cardDesc}>
              3D 정육면체의 꼭짓점에 데이터 포인트를 배치하여 3개 변수로 분류합니다.
              각 축(X/Y/Z)의 이름과 방향 라벨(낮음/높음)을 자유롭게 설정할 수 있으며, 라벨 위치를 슬라이더로 미세 조정 가능합니다.
            </p>
          </div>

          <div style={styles.card} onClick={() => onNavigate('radar')}>
            <h3 style={styles.cardTitle}>방사형 그래프</h3>
            <p style={styles.cardDesc}>
              중심에서 방사형으로 뻗는 3~12개 축에 값을 찍어 다각형으로 연결합니다.
              최대 5개 계열을 선 스타일로 구분하며, 다각형 내부 채움을 on/off 할 수 있습니다.
            </p>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>공통 기능</h2>
          <table style={styles.table}>
            <tbody>
              <tr><td style={styles.tdLabel}>제목 / 출처 / 각주</td><td style={styles.tdDesc}>우측 패널에서 입력하면 그래프에 표시됩니다.</td></tr>
              <tr><td style={styles.tdLabel}>글꼴</td><td style={styles.tdDesc}>세리프(수능 기본) / 산세리프 / 사용자 지정을 선택합니다. 사용자 지정 시 컴퓨터에 설치된 글꼴명을 입력하면 적용됩니다.</td></tr>
              <tr><td style={styles.tdLabel}>글자 크기</td><td style={styles.tdDesc}>제목, 축 라벨, 눈금, 데이터 라벨의 크기를 각각 조절합니다.</td></tr>
              <tr><td style={styles.tdLabel}>데이터 라벨</td><td style={styles.tdDesc}>각 데이터 포인트에 값을 직접 표시합니다.</td></tr>
              <tr><td style={styles.tdLabel}>범례</td><td style={styles.tdDesc}>하단 또는 우측에 범례를 배치합니다.</td></tr>
              <tr><td style={styles.tdLabel}>PNG 내보내기</td><td style={styles.tdDesc}>시험 출제용(800x600) 또는 사용자 정의 크기 + 배율(1x/2x/3x)로 다운로드합니다.</td></tr>
              <tr><td style={styles.tdLabel}>드로어 토글</td><td style={styles.tdDesc}>우측 상단 ✕/☰ 버튼으로 데이터 입력 패널을 열고 닫습니다.</td></tr>
            </tbody>
          </table>
        </section>

        <section style={styles.tipSection}>
          <h2 style={styles.h2}>TIP: 라벨 줄바꿈</h2>
          <p style={styles.tipText}>
            세로 방향 축 라벨이 길 경우, 입력란에 <code style={styles.codeBig}>\n</code>을 입력하면 해당 위치에서 줄바꿈됩니다.
          </p>
          <p style={styles.tipExample}>
            예시: <code style={styles.codeBig}>최난월\n평균 기온</code> →
          </p>
          <div style={styles.tipResult}>
            <span>최난월</span><br />
            <span>평균 기온</span>
          </div>
          <p style={styles.tipApply}>
            적용 대상: <strong>산점도/버블 차트</strong>(Y축 라벨), <strong>삼각 그래프</strong>(좌변·우변 라벨)
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>출력 스타일</h2>
          <ul style={styles.ul}>
            <li>수능 출제 스타일: <strong>흑백, 세리프체</strong> 기본</li>
            <li>선 굵기: 축선 2px, 데이터선 2.5px, 보조선 0.5px(점선)</li>
            <li>패턴 구분: 단색 그레이스케일 + 사선/격자/도트 등 흑백 패턴</li>
            <li>PNG 내보내기 시 흰색 배경 포함</li>
          </ul>
        </section>

        <footer style={styles.footer}>
          <p>양정고등학교 김용현 | https://bgnl.kr</p>
        </footer>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    overflow: 'auto',
    background: '#fff',
  },
  content: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '40px 24px 60px',
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    color: '#1B2A4A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  tipSection: {
    marginBottom: 32,
    padding: '20px 24px',
    background: '#F0F4FF',
    borderRadius: 10,
    border: '2px solid #1B2A4A',
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 1.8,
    margin: '8px 0',
  },
  tipExample: {
    fontSize: 13,
    color: '#6B7280',
    margin: '8px 0 4px',
  },
  tipResult: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1B2A4A',
    textAlign: 'center' as const,
    padding: '10px 0',
    background: '#fff',
    borderRadius: 6,
    border: '1px solid #D1D5DB',
    margin: '4px 0 12px',
  },
  tipApply: {
    fontSize: 12,
    color: '#6B7280',
    margin: 0,
  },
  code: {
    background: '#E5E7EB',
    padding: '1px 5px',
    borderRadius: 3,
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    color: '#1B2A4A',
    fontWeight: 700,
  },
  codeBig: {
    background: '#E5E7EB',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 14,
    fontFamily: "'JetBrains Mono', monospace",
    color: '#1B2A4A',
    fontWeight: 700,
  },
  h2: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1B2A4A',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: '2px solid #E5E7EB',
  },
  ol: {
    paddingLeft: 20,
    fontSize: 14,
    lineHeight: 1.8,
    color: '#374151',
  },
  ul: {
    paddingLeft: 20,
    fontSize: 14,
    lineHeight: 1.8,
    color: '#374151',
  },
  card: {
    padding: '14px 18px',
    marginBottom: 8,
    borderRadius: 8,
    border: '1px solid #E5E7EB',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1B2A4A',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 1.6,
    margin: 0,
  },
  table: {
    width: '100%',
    fontSize: 13,
    borderCollapse: 'collapse' as const,
  },
  tdLabel: {
    padding: '8px 12px',
    fontWeight: 600,
    color: '#374151',
    borderBottom: '1px solid #F3F4F6',
    whiteSpace: 'nowrap' as const,
    verticalAlign: 'top',
    width: 140,
  },
  tdDesc: {
    padding: '8px 12px',
    color: '#6B7280',
    borderBottom: '1px solid #F3F4F6',
    lineHeight: 1.5,
  },
  footer: {
    marginTop: 40,
    paddingTop: 16,
    borderTop: '1px solid #E5E7EB',
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center' as const,
  },
};
