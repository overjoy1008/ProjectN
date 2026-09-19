import type { Metadata } from 'next';
import { CategoryProblemBrowser, type CategoryProblem } from './CategoryProblemBrowser';
import problemJourneyData from '../problem-journeys.json';
import calculusJourneyData from '../calculus-journeys.json';
import legacyJourneyData from '../legacy-journeys.json';

export const metadata: Metadata = {
  title: '출제 유형별 문항',
  description: '평가원 수학 문항을 출제 유형별로 모아 최신순과 난이도순으로 살펴봅니다.',
};

const categoryProblems: CategoryProblem[] = [
  ...legacyJourneyData.problems,
  ...problemJourneyData.problems,
  ...calculusJourneyData.problems,
].map(({ id, year, session, section, number, difficulty, categories }) => ({
  id,
  year,
  session,
  section,
  number,
  difficulty,
  categories,
}));

export default function CategoriesPage() {
  return (
    <main className="category-page">
      <header className="site-header site-header-with-nav">
        <div className="brand-lockup">
          <a href="/" aria-label="Project N 메인으로"><h1 className="wordmark">Project <i>/N/</i></h1></a>
          <p>평가원 수학 아카이브</p>
        </div>
        <nav className="site-nav" aria-label="주요 메뉴"><a href="/">문제 아카이브</a><a href="/curriculum.html">교육 범위</a></nav>
      </header>

      <div className="curriculum-workspace category-workspace">
        <a className="category-back-link" href="/curriculum.html">← 교육 범위로 돌아가기</a>
        <div className="section-heading category-page-heading">
          <span>TYPE</span>
          <div><p>PROBLEM INDEX</p><h1>출제 유형별 문항</h1></div>
        </div>
        <CategoryProblemBrowser problems={categoryProblems} />
      </div>
    </main>
  );
}
