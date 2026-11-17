// © 2026 김용현
import type { CSSProperties, ReactNode } from 'react';
import { type GraphType } from '../data/types';

interface Props {
  onNavigate: (type: GraphType) => void;
}

interface Kind {
  type: GraphType;
  title: string;
  desc: ReactNode;
}

const GRAPHS: Kind[] = [
  {
    type: 'climate',
    title: '기후 그래프',
    desc: <>기온(꺾은선, 왼쪽 축)과 강수량(막대, 오른쪽 축)을 함께 그려요. 월 표시 간격(12, 4, 2개월)을 고를 수 있고, <strong>편차 모드</strong>로 월별 편차나 지역별 편차도 그려요.</>,
  },
  {
    type: 'pyramid',
    title: '인구 피라미드',
    desc: <>남성(왼쪽)과 여성(오른쪽)의 연령별 인구를 가로 막대로 그려요. 5세 단위 17구간이고, 인구수와 비율(%) 중에서 고를 수 있어요.</>,
  },
  {
    type: 'ternary',
    title: '삼각 그래프',
    desc: <>세 값의 비율(합계 100%)을 정삼각형 위에 찍어요. 산업 구조, 토양 삼각도에 써요. 격자 간격은 10, 20, 25% 중에서 골라요.</>,
  },
  {
    type: 'stacked',
    title: '100% 막대, 원 그래프',
    desc: <>100% 막대와 원 그래프를 바꿔 가며 그려요. 막대는 가로나 세로로, 원은 <strong>회전</strong>과 <strong>크기</strong>를 조절해요. 항목은 11개까지 흑백 무늬로 나눠요.</>,
  },
  {
    type: 'absbar',
    title: '절댓값 막대 그래프',
    desc: <>실제 값을 막대로 그려요. 묶음 막대와 <strong>누적 막대</strong>를 고를 수 있고, <strong>최댓값에 맞추기</strong>로 가장 큰 값을 축 끝에 맞춰요.</>,
  },
  {
    type: 'line',
    title: '꺾은선 그래프',
    desc: <>연도별, 월별 변화를 꺾은선으로 그려요. 계열은 선 종류, 굵기, 회색, 기호로 나누고, 이름은 선 끝, 유도선, 오른쪽 줄, 범례 중에서 골라요. x 이름을 비우면 그 자리 라벨과 세로 격자를 건너뛰어요(5년 자료에 10년 라벨).</>,
  },
  {
    type: 'scatter',
    title: '산점도, 버블 차트',
    desc: <>x, y 값을 점으로 찍고 셋째 값을 버블 크기로 보여 줘요. <strong>편차 산점도</strong>는 (0, 0)을 지나는 십자선으로 네 칸을 나눠요.</>,
  },
  {
    type: 'hythergraph',
    title: '하이서그래프',
    desc: <>x축(기온)과 y축(강수량)에 12개월 값을 찍어 닫힌 선으로 이어요. 5개 지역까지 기호와 선 모양으로 나눠 비교해요.</>,
  },
  {
    type: 'cube',
    title: '정육면체 그래프',
    desc: <>정육면체 꼭짓점에 자료를 놓아 세 기준으로 나눠요. 축 이름과 낮음, 높음 라벨을 정하고 위치는 슬라이더로 맞춰요.</>,
  },
  {
    type: 'radar',
    title: '방사형 그래프',
    desc: <>가운데에서 뻗는 3~12개 축에 값을 찍어 다각형으로 이어요. 5개 계열까지 선 모양으로 나누고, 안쪽 채우기를 켜고 끌 수 있어요.</>,
  },
];

const MAPS: Kind[] = [
  {
    type: 'choropleth',
    title: '단계구분도',
    desc: <>지역을 등급별 색이나 무늬로 칠해요. 등급은 3~7단계이고, 지도를 눌러 칠하고 오른쪽 클릭으로 그 지역 등급을 집어요. 범례는 끌어서 옮겨요.</>,
  },
  {
    type: 'symbolmap',
    title: '도형표현도',
    desc: <>지역 가운데에 <strong>원 그래프나 막대</strong>를 올려 여러 값을 함께 보여 줘요. 크기는 값에 비례하거나 같게 하고, 겹치면 끌어서 옮겨요.</>,
  },
  {
    type: 'isoline',
    title: '등치선도',
    desc: <>지역 값을 이어 <strong>등치선</strong>을 그려요. 간격, 주곡선과 간곡선, 색 채우기를 정하고, 선은 지도 경계 안에서만 그려요.</>,
  },
  {
    type: 'flowmap',
    title: '유선도',
    desc: <>지역이나 나라 사이의 <strong>이동, 물류, 무역</strong>을 화살표로 그려요. 지도를 눌러 출발지와 도착지를 정하거나 CSV로 한 번에 넣어요. 선 굵기는 값에 비례해요.</>,
  },
];

const COMMON: [string, ReactNode][] = [
  ['그림 양식', <><strong>시험지 양식</strong>(기본)은 평가원 시험지에서 잰 글꼴과 선 굵기를 따라요. 예전 그림이 필요하면 <strong>옛 모양(1.x)</strong>을 골라요. 축이 있는 그래프는 눈금 방향도 골라요.</>],
  ['제목, 출처, 각주', '오른쪽 입력 칸에 적으면 그래프에 바로 보여요.'],
  ['글꼴', '세리프(수능 기본), 산세리프, 사용자 지정 중에서 골라요. 사용자 지정은 컴퓨터에 깔린 글꼴 이름을 적어요.'],
  ['데이터 라벨', '점이나 막대마다 값을 바로 적어요.'],
  ['범례', '그래프 아래나 오른쪽에 둬요.'],
  ['PNG 저장', '시험 출제용(800×600)이나 원하는 크기로, 1배에서 3배까지 키워 받아요.'],
  ['입력 칸 열고 닫기', '오른쪽 위 패널 단추로 입력 칸을 접어 그래프를 넓게 봐요.'],
];

function KindRow({ kind, onNavigate }: { kind: Kind; onNavigate: Props['onNavigate'] }) {
  return (
    <button type="button" className="gg-row" style={styles.row} onClick={() => onNavigate(kind.type)}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={styles.rowTitle}>{kind.title}</span>
        <span style={styles.rowDesc}>{kind.desc}</span>
      </span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0, color: 'var(--icon)' }}>
        <polyline points="9 6 15 12 9 18" />
      </svg>
    </button>
  );
}

export default function GuidePage({ onNavigate }: Props) {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>GeoGrapher</h1>
        <p style={styles.subtitle}>지리 수업 자료와 문항에 넣을 그래프, 지도를 만들어요.</p>

        <section style={styles.card}>
          <h2 style={styles.h2}>이렇게 써요</h2>
          <ol style={styles.ol}>
            <li>오른쪽 위에서 만들 <strong>그래프 종류</strong>를 골라요.</li>
            <li>오른쪽 <strong>입력 칸</strong>에 자료와 옵션을 넣어요.</li>
            <li>넣는 대로 왼쪽 그래프가 바로 바뀌어요.</li>
            <li>다 되면 <strong>PNG 저장</strong>으로 받아요.</li>
          </ol>
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>그래프 {GRAPHS.length}종</h2>
          {GRAPHS.map((k) => <KindRow key={k.type} kind={k} onNavigate={onNavigate} />)}
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>통계 지도 {MAPS.length}종</h2>
          <p style={styles.lead}>
            한국 행정구역(시도, 시군구, 광역시 통합)과 <strong>세계 나라</strong>(대서양 중심, 태평양 중심)로 그려요.
            세계 지도는 밀러 도법이고, 지역 이름을 가나다순으로 정렬해 177개 나라 중에서도 금방 찾아요.
          </p>
          {MAPS.map((k) => <KindRow key={k.type} kind={k} onNavigate={onNavigate} />)}
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>모든 그래프에 있는 기능</h2>
          <dl style={styles.dl}>
            {COMMON.map(([label, desc]) => (
              <div key={label} style={styles.dlRow}>
                <dt style={styles.dt}>{label}</dt>
                <dd style={styles.dd}>{desc}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>긴 축 라벨은 두 줄로</h2>
          <p style={styles.text}>
            라벨 칸에 <code style={styles.code}>\n</code>을 넣으면 그 자리에서 줄이 바뀌어요.
            예를 들어 <code style={styles.code}>최난월\n평균 기온</code>은 「최난월」과 「평균 기온」 두 줄로 그려요.
          </p>
          <p style={styles.note}>산점도와 버블 차트의 y축 라벨, 삼각 그래프의 왼쪽과 오른쪽 변 라벨에 쓸 수 있어요.</p>
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>그림 모양</h2>
          <ul style={styles.ul}>
            <li>수능 시험지처럼 <strong>흑백</strong>으로 그려요. 축과 눈금, 값은 명조, 제목과 범례, 출처는 고딕이에요.</li>
            <li>한컴오피스 글꼴(HY신명조, HY중고딕)이 있으면 시험지와 가장 비슷하고, 없으면 Noto 글꼴로 그려요.</li>
            <li>항목은 회색 단계와 사선, 격자, 점 무늬로 나눠요.</li>
            <li>PNG는 흰 바탕으로 저장돼요.</li>
          </ul>
        </section>

        <footer style={styles.footer}>
          양정고등학교 김용현 <a href="https://bgnl.kr" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>bgnl.kr</a>
        </footer>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    flex: 1,
    overflow: 'auto',
    background: 'var(--bg)',
  },
  content: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '32px 16px 48px',
  },
  title: {
    fontSize: 28,
    fontWeight: 600,
    letterSpacing: '-0.6px',
    color: 'var(--ink)',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: 'var(--muted)',
    marginBottom: 24,
  },
  card: {
    background: 'var(--surface)',
    borderRadius: 'var(--r-card)',
    padding: '20px 20px 16px',
    marginBottom: 12,
  },
  h2: {
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: '-0.2px',
    color: 'var(--ink)',
    marginBottom: 8,
  },
  lead: {
    fontSize: 13,
    color: 'var(--muted)',
    lineHeight: 1.6,
    marginBottom: 4,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: 'calc(100% + 16px)',
    margin: '0 -8px',
    padding: '10px 8px',
    borderRadius: 'var(--r-control)',
    textAlign: 'left',
  },
  rowTitle: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--ink)',
    marginBottom: 2,
  },
  rowDesc: {
    display: 'block',
    fontSize: 13,
    color: 'var(--muted)',
    lineHeight: 1.6,
  },
  ol: {
    paddingLeft: 20,
    fontSize: 14,
    lineHeight: 1.9,
    color: 'var(--text)',
  },
  ul: {
    paddingLeft: 20,
    fontSize: 14,
    lineHeight: 1.9,
    color: 'var(--text)',
  },
  dl: {
    margin: 0,
  },
  dlRow: {
    display: 'flex',
    gap: 16,
    padding: '8px 0',
  },
  dt: {
    width: 120,
    flexShrink: 0,
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--ink)',
  },
  dd: {
    margin: 0,
    fontSize: 13,
    color: 'var(--text)',
    lineHeight: 1.6,
  },
  text: {
    fontSize: 14,
    color: 'var(--text)',
    lineHeight: 1.8,
  },
  note: {
    fontSize: 13,
    color: 'var(--muted)',
    marginTop: 6,
  },
  code: {
    background: 'var(--fill)',
    padding: '1px 6px',
    borderRadius: 4,
    fontSize: 13,
    fontFamily: 'ui-monospace, Consolas, monospace',
    color: 'var(--ink)',
  },
  footer: {
    marginTop: 24,
    fontSize: 12,
    color: 'var(--muted)',
    textAlign: 'center',
  },
  footerLink: {
    color: 'var(--text)',
    textDecoration: 'none',
    marginLeft: 6,
  },
};
