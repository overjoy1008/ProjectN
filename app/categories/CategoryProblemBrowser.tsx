'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';

export type CategoryProblem = {
  id: string;
  year: number;
  session: string;
  section: string;
  number: number;
  difficulty: { level: string; rank: number };
  categories: string[];
};

type SortOrder = 'latest' | 'difficulty';

const sessionOrder: Record<string, number> = { '6모': 1, '9모': 2, 수능: 3 };

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange);
  return () => window.removeEventListener('popstate', onStoreChange);
}

function getCategoryFromLocation() {
  return new URLSearchParams(window.location.search).get('category') ?? '';
}

function problemUrl(problem: CategoryProblem) {
  const subject = problem.section === '공통' ? '확통' : problem.section;
  const params = new URLSearchParams({
    year: String(problem.year),
    session: problem.session,
    subject,
    question: String(problem.number),
  });
  return `/?${params.toString()}`;
}

export function CategoryProblemBrowser({ problems }: { problems: CategoryProblem[] }) {
  const category = useSyncExternalStore(subscribeToLocation, getCategoryFromLocation, () => '');
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');

  const selectedProblems = useMemo(() => problems
    .filter(({ categories }) => categories.includes(category))
    .toSorted((a, b) => {
      if (sortOrder === 'difficulty' && b.difficulty.rank !== a.difficulty.rank) {
        return b.difficulty.rank - a.difficulty.rank;
      }
      return b.year - a.year
        || (sessionOrder[b.session] ?? 0) - (sessionOrder[a.session] ?? 0)
        || a.number - b.number;
    }), [category, problems, sortOrder]);

  return (
    <section className="category-browser" aria-labelledby="category-browser-title">
      <div className="category-problems-head">
        <div>
          <p>선택한 출제 유형</p>
          <h2 id="category-browser-title">{category || '카테고리를 선택해 주세요'}</h2>
          {category && <span>총 {selectedProblems.length}문항</span>}
        </div>
        {category && (
          <label>
            <span>정렬</span>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
              <option value="latest">최신순</option>
              <option value="difficulty">난이도 높은 순</option>
            </select>
          </label>
        )}
      </div>

      {selectedProblems.length > 0 ? (
        <ol className="category-problem-list">
          {selectedProblems.map((problem) => (
            <li key={problem.id}>
              <a href={problemUrl(problem)}>
                <span className="category-problem-number">{String(problem.number).padStart(2, '0')}</span>
                <span className="category-problem-exam">
                  <strong>{problem.year}학년도 {problem.session} · {problem.section}</strong>
                  <small>{problem.number}번 문항</small>
                </span>
                <span className={`category-problem-difficulty difficulty-rank-${problem.difficulty.rank}`}>
                  {problem.difficulty.level}
                </span>
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <p className="category-problem-empty">
          {category ? '현재 아카이브에서 이 유형으로 분류된 문항이 없습니다.' : '교육 범위나 문항의 카테고리를 선택하면 관련 문항을 볼 수 있습니다.'}
        </p>
      )}
    </section>
  );
}
