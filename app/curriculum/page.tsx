import type { Metadata } from 'next';
import { ArrowDownRight, ArrowUpRight, Plus } from 'lucide-react';

export const metadata: Metadata = {
  title: '교육 범위 — Project /N/',
  description: '2017학년도부터 2028학년도 이후까지, 수학 교육과정의 과목과 대단원 이동을 비교합니다.',
};

type UnitRoute = { unit: string; middle: string; past: string; note?: string };
type CourseRoute = { id: string; course: string; summary: string; routes: UnitRoute[] };

const eras = [
  { year: '2017~2020', revision: '2009 개정', subjects: ['수학 I', '수학 II', '미적분 I', '확률과 통계', '미적분 II', '기하와 벡터'] },
  { year: '2021~2027', revision: '2015 개정', subjects: ['수학 (상)', '수학 (하)', '수학 I', '수학 II', '확률과 통계', '미적분', '기하'] },
  { year: '2028~', revision: '2022 개정', subjects: ['공통수학 I', '공통수학 II', '대수', '미적분 I', '확률과 통계', '미적분 II', '기하'] },
];

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
        <section className="curriculum-intro">
          <h2>CURRICULUM.</h2>
        </section>

        <section className="era-section" aria-labelledby="era-title">
          <div className="section-heading"><span>01</span><div><p>CURRICULUM INDEX</p><h2 id="era-title">시대별 과목 체계</h2></div></div>
          <div className="era-grid">
            {eras.map((era, index) => (
              <article className={index === 1 ? 'era-card era-card-current' : 'era-card'} key={era.year}>
                <div className="era-card-head"><span>{era.revision}</span><strong>{era.year}</strong></div>
                <ol>{era.subjects.map((subject) => <li key={subject}>{subject}</li>)}</ol>
              </article>
            ))}
          </div>
        </section>

        <section className="route-section" aria-labelledby="route-title">
          <div className="section-heading"><span>02</span><div><p>CONTENT ROUTES</p><h2 id="route-title">대단원 이동 경로</h2></div></div>
          <p className="route-lead">대단원별로 나눠 보여주는 편이 정확합니다. 아래 표는 2022 개정 과목을 출발점으로 같은 내용이 과거 어느 과목에 있었는지 추적합니다.</p>

          <nav className="course-jump" aria-label="과목 바로가기">
            {courseRoutes.map(({ id, course }) => <a href={`#${id}`} key={id}>{course}</a>)}
          </nav>

          <div className="route-list">
            {courseRoutes.map((course, index) => (
              <details className="route-card" id={course.id} key={course.id} open={index === 0 || course.id === 'algebra'}>
                <summary>
                  <span className="route-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="route-title"><strong>{course.course}</strong><small>{course.summary}</small></span>
                  <span className="route-toggle"><Plus aria-hidden="true" /></span>
                </summary>
                <div className="route-table" role="table" aria-label={`${course.course} 대단원 이동 경로`}>
                  <div className="route-row route-row-head" role="row"><b role="columnheader">2022 개정 대단원</b><b role="columnheader">2015 개정</b><b role="columnheader">2009 개정</b></div>
                  {course.routes.map((route) => (
                    <div className="route-row" role="row" key={route.unit}>
                      <strong role="cell">{route.unit}{route.note && <small>{route.note}</small>}</strong>
                      <span role="cell">{route.middle}</span>
                      <span role="cell">{route.past}</span>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="example-callout">
          <span>EXAMPLE</span>
          <div><h2>“수학 I”은 같은 수학 I이 아닙니다.</h2><p>2015 개정의 수학 I은 <b>지수·로그함수, 삼각함수, 수열</b>로 구성됩니다. 2009 개정에서는 앞의 두 대단원이 미적분 II에, 수열은 수학 II에 있었습니다.</p></div>
          <ArrowDownRight aria-hidden="true" />
        </section>

        <footer className="curriculum-footer">
          <div><span>기준 자료</span><p>교육부·국가교육과정정보센터 고시와 수능 적용 범위를 바탕으로 정리했습니다.</p></div>
          <div className="source-links">
            <a href="https://ncic.go.kr/board/B0031.cs?act=read&amp;bwrId=1271&amp;pageIndex=1&amp;pageUnit=15" target="_blank" rel="noreferrer">2022 개정 <ArrowUpRight aria-hidden="true" /></a>
            <a href="https://ncic.go.kr/board/B0028.cs?act=read&amp;bwrId=912&amp;m=41&amp;pageIndex=1&amp;pageUnit=15" target="_blank" rel="noreferrer">2015 개정 <ArrowUpRight aria-hidden="true" /></a>
            <a href="https://www.korea.kr/news/policyNewsView.do?newsId=156118863" target="_blank" rel="noreferrer">2017 수능 적용 <ArrowUpRight aria-hidden="true" /></a>
          </div>
        </footer>
      </div>
    </main>
  );
}
