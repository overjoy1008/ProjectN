import type { Metadata } from 'next';
import { CurriculumConnections } from './CurriculumConnections';
import { MobileEraNavigation } from './MobileEraNavigation';

export const metadata: Metadata = {
  title: '교육 범위 — Project /N/',
  description: '2017학년도부터 2028학년도 이후까지, 수학 교육과정의 과목과 대단원 이동을 비교합니다.',
};

/*
type UnitRoute = { unit: string; middle: string; past: string; note?: string };
type CourseRoute = { id: string; course: string; summary: string; routes: UnitRoute[] };
*/

const eras = [
  { year: '2017~2020', revision: '2009 개정', subjects: ['수학 I', '수학 II', '', '미적분 I', '확률과 통계', '미적분 II', '기하와 벡터'] },
  { year: '2021~2027', revision: '2015 개정', subjects: ['수학 (상)', '수학 (하)', '수학 I', '수학 II', '확률과 통계', '미적분', '기하'] },
  { year: '2028~', revision: '2022 개정', subjects: ['공통수학 I', '공통수학 II', '대수', '미적분 I', '확률과 통계', '미적분 II', '기하'] },
];

const subjectUnits: Record<string, Record<string, string>> = {
  '2017~2020': {
    '수학 I': '다항식 · 방정식과 부등식 · 도형의 방정식',
    '수학 II': '집합과 명제 · 함수 · 수열 · 지수와 로그',
    '미적분 I': '수열의 극한 · 함수의 극한과 연속 · 미분 · 적분',
    '확률과 통계': '순열 · 조합 · 확률 · 통계',
    '미적분 II': '지수·로그함수 · 삼각함수 · 미분법 · 적분법',
    '기하와 벡터': '평면곡선 · 평면벡터 · 공간도형 · 공간벡터',
  },
  '2021~2027': {
    '수학 (상)': '다항식 · 방정식과 부등식 · 도형의 방정식',
    '수학 (하)': '집합과 명제 · 함수 · 순열과 조합',
    '수학 I': '지수·로그함수 · 삼각함수 · 수열',
    '수학 II': '함수의 극한과 연속 · 미분 · 적분',
    '확률과 통계': '경우의 수 · 확률 · 통계',
    '미적분': '수열의 극한 · 미분법 · 적분법',
    '기하': '이차곡선 · 평면벡터 · 공간도형과 공간좌표',
  },
  '2028~': {
    '공통수학 I': '다항식 · 방정식과 부등식 · 경우의 수 · 행렬',
    '공통수학 II': '도형의 방정식 · 집합과 명제 · 함수',
    '대수': '지수·로그함수 · 삼각함수 · 수열',
    '미적분 I': '함수의 극한과 연속 · 미분 · 적분',
    '확률과 통계': '경우의 수 · 확률 · 통계',
    '미적분 II': '수열의 극한 · 미분법 · 적분법',
    '기하': '이차곡선 · 벡터 · 공간도형과 공간좌표',
  },
};

const examTypes = [
  {
    subject: '중3 도형',
    items: [
      '피타고라스',
      '삼각형 각의 합',
      '삼각형 넓이',
      '삼각형의 닮음',
      '이등변 삼각형',
      '삼각형의 이등분선',
      '원의 반지름',
      '원주각과 중심각',
      '원과 접선',
    ],
  },
  {
    subject: '수학 (상)',
    items: [
      '곱셈공식과 변형',
      '인수분해',
      '완전제곱식',
      '근의공식',
      '판별식',
      '근과 계수의 관계',
      '이차부등식',
      '조립제법',
      '절댓값 함수',
      '평행이동과 대칭이동',
    ],
  },
  {
    subject: '수학 (하)',
    items: [
      '집합과 명제',
      '절대부등식',
      '산술·기하 평균',
      '함수의 종류',
      '유리함수',
      '부분분수',
      '무리함수',
      '유리화',
      '합성함수와 역함수',
      '경우의 수',
    ],
  },
  {
    subject: '수학 I',
    items: [
      '거듭제곱근',
      '지수·로그 계산',
      '지수·로그 방정식·부등식',
      '지수·로그함수 그래프',
      '삼각함수 계산',
      '삼각 방정식·부등식',
      '삼각함수 그래프',
      '사인·코사인 법칙',
      '등차·등비수열',
      '등차·등비수열의 합',
      '수열의 합 Σ',
      '수열의 합 k',
      '수열의 합과 일반항',
      '수학적 귀납법',
    ],
  },
  {
    subject: '수학 II',
    items: [
      '극한값',
      '∞/∞ 꼴',
      '0/0 꼴',
      '함수의 연속 조건',
      '미분계수',
      '곱의 미분',
      '도함수와 함수의 개형',
      '접선의 방정식',
      '함수의 교점과 방정식의 실근',
      '인수 정리와 함수 추론',
      '속도와 가속도',
      '부정적분',
      '정적분',
      '정적분과 넓이',
      '정적분으로 정의된 함수',
      '위치와 거리',
    ],
  },
  {
    subject: '확률과 통계',
    items: [
      '원순열',
      '중복순열',
      '같있순',
      '중복조합',
      '이항정리',
      '확률의 덧셈정리',
      '여사건의 확률',
      '조건부확률',
      '독립과 종속',
      '이산확률변수',
      'Y = aX+b 변환',
      '이항분포',
      '연속확률변수',
      '정규분포',
      '표본평균',
      '모평균의 추정',
    ],
  },
  {
    subject: '미적분',
    items: [
      '수열의 극한',
      '여러 가지 함수의 극한',
      '지수·로그함수의 극한',
      '삼각함수의 극한',
      '급수',
      '등비급수',
      '지수·로그함수의 미분',
      '삼각함수의 미분',
      '삼각함수의 덧셈정리',
      '여러 가지 함수의 미분',
      '몫의 미분',
      '합성함수의 미분',
      '매개변수 미분',
      '음함수와 역함수의 미분',
      '이계도함수',
      '미분법과 함수의 개형',
      '미분법과 방정식·부등식',
      '접선의 방정식',
      '치환적분',
      '부분적분',
      '여러 가지 함수의 부정적분',
      '미적분의 정적분',
      '미적분의 넓이',
      '입체도형의 부피',
      '곡선의 길이',
      '미적분의 속도·거리',
    ],
  },
];

/*
const courseRoutes: CourseRoute[] = [
  {
    id: 'common-1', course: '공통수학 I', summary: '수학 (상)을 중심으로 경우의 수와 행렬이 합류',
    routes: [
      { unit: '다항식', middle: '수학 (상)', past: '수학 I' },
      { unit: '방정식과 부등식', middle: '수학 (상)', past: '수학 I' },
      { unit: '경우의 수', middle: '수학 (하)', past: '확률과 통계', note: '공통 과정으로 이동' },
      { unit: '행렬', middle: '일반 과목 미편성', past: '일반 과목 미편성', note: '2022 개정에서 재도입' },
    ],
  },
  {
    id: 'common-2', course: '공통수학 II', summary: '수학 (하)을 중심으로 도형의 방정식이 합류',
    routes: [
      { unit: '도형의 방정식', middle: '수학 (상)', past: '수학 I' },
      { unit: '집합과 명제', middle: '수학 (하)', past: '수학 II' },
      { unit: '함수와 그래프', middle: '수학 (하)', past: '수학 II' },
      { unit: '순열과 조합', middle: '수학 (하)', past: '확률과 통계', note: '기초 경우의 수 영역' },
    ],
  },
  {
    id: 'algebra', course: '대수', summary: '2015 수학 I이 이름을 바꾸고, 과거의 두 과목을 한데 묶음',
    routes: [
      { unit: '지수함수와 로그함수', middle: '수학 I', past: '미적분 II' },
      { unit: '삼각함수', middle: '수학 I', past: '미적분 II' },
      { unit: '수열', middle: '수학 I', past: '수학 II', note: '과거에는 서로 다른 과목에 분산' },
    ],
  },
  {
    id: 'calculus-1', course: '미적분 I', summary: '2015 수학 II의 내용이 과목명을 바꿈',
    routes: [
      { unit: '함수의 극한과 연속', middle: '수학 II', past: '미적분 I' },
      { unit: '미분', middle: '수학 II', past: '미적분 I', note: '다항함수 중심' },
      { unit: '적분', middle: '수학 II', past: '미적분 I', note: '다항함수 중심' },
    ],
  },
  {
    id: 'probability', course: '확률과 통계', summary: '세 교육과정에서 과목명과 큰 구조가 가장 안정적',
    routes: [
      { unit: '경우의 수', middle: '확률과 통계', past: '확률과 통계' },
      { unit: '확률', middle: '확률과 통계', past: '확률과 통계' },
      { unit: '통계', middle: '확률과 통계', past: '확률과 통계' },
    ],
  },
  {
    id: 'calculus-2', course: '미적분 II', summary: '2015 미적분을 계승하지만, 2009 때는 I·II에 나뉘어 있었음',
    routes: [
      { unit: '수열의 극한', middle: '미적분', past: '미적분 I' },
      { unit: '미분법', middle: '미적분', past: '미적분 II', note: '여러 초월함수 포함' },
      { unit: '적분법', middle: '미적분', past: '미적분 II', note: '여러 초월함수 포함' },
    ],
  },
  {
    id: 'geometry', course: '기하', summary: '과목명은 비슷하지만 공간벡터의 포함 여부가 달라짐',
    routes: [
      { unit: '이차곡선', middle: '기하', past: '기하와 벡터' },
      { unit: '벡터', middle: '기하 · 평면벡터', past: '기하와 벡터 · 평면/공간벡터', note: '2022 개정에서 공간벡터 재도입' },
      { unit: '공간도형과 공간좌표', middle: '기하', past: '기하와 벡터' },
    ],
  },
];
*/

export default function CurriculumPage() {
  return (
    <main className="curriculum-page">
      <header className="site-header site-header-with-nav">
        <div className="brand-lockup">
          <a href="/" aria-label="Project N 메인으로"><h1 className="wordmark">Project <i>/N/</i></h1></a>
          <p>평가원 수학 아카이브</p>
        </div>
        <nav className="site-nav" aria-label="주요 메뉴"><a href="/">문제 아카이브</a><a href="/curriculum" aria-current="page">교육 범위</a></nav>
      </header>

      <div className="curriculum-workspace">
        <section className="exam-type-section" aria-labelledby="exam-type-title">
          <div className="section-heading">
            <span>01</span>
            <div><p>2021~2027 · 평가원/수능</p><h2 id="exam-type-title">출제 유형</h2></div>
          </div>
          <div className="exam-type-grid">
            {examTypes.map(({ subject, items }) => (
              <article className="exam-type-card" key={subject}>
                <header className="exam-type-card-head">
                  <span>{subject === '수학 I' || subject === '수학 II' || subject === '확률과 통계' ? '직접 출제' : '간접출제'}</span>
                  <h3>{subject}</h3>
                </header>
                <ol className="exam-type-list">
                  {items.map((item) => <li key={item}>{item}</li>)}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section className="era-section" aria-labelledby="era-title">
          <div className="section-heading"><span>02</span><div><p>CURRICULUM INDEX</p><h2 id="era-title">시대별 과목 체계</h2></div></div>
          <div className="era-grid">
            <MobileEraNavigation />
            <CurriculumConnections />
            {eras.map((era, index) => (
              <article className={index === 1 ? 'era-card era-card-current' : 'era-card'} data-era-index={index} key={era.year}>
                <div className="era-card-head"><span>{era.revision}</span><strong>{era.year}</strong></div>
                <ol>{era.subjects.map((subject, subjectIndex) => subject ? (
                  <li className={era.year === '2028~' && (subject === '미적분 II' || subject === '기하') ? 'era-subject-muted' : undefined} key={subject}>
                    <strong>{subject}</strong>
                    <ol className="era-unit-list">
                      {subjectUnits[era.year][subject].split(' · ').map((unit) => <li data-unit-node={`${era.year}|${subject}|${unit}`} key={unit}>{unit}</li>)}
                    </ol>
                  </li>
                ) : <li className="era-subject-spacer" aria-hidden="true" key={`spacer-${subjectIndex}`} />)}</ol>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
