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
  wrongRate: number | null;
};

type SortOrder = 'latest' | 'oldest' | 'easiest' | 'hardest';

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
      const latestFirst = b.year - a.year
        || (sessionOrder[b.session] ?? 0) - (sessionOrder[a.session] ?? 0)
        || a.number - b.number;

      if (sortOrder === 'oldest') {
        return a.year - b.year
          || (sessionOrder[a.session] ?? 0) - (sessionOrder[b.session] ?? 0)
          || a.number - b.number;
      }
      if (sortOrder === 'easiest') return a.difficulty.rank - b.difficulty.rank || latestFirst;
      if (sortOrder === 'hardest') return b.difficulty.rank - a.difficulty.rank || latestFirst;
      return latestFirst;
    }), [category, problems, sortOrder]);

  const sortOptions: { value: SortOrder; label: string }[] = [
    { value: 'latest', label: '최신부터' },
    { value: 'oldest', label: '과거부터' },
    { value: 'easiest', label: '쉬운 문제부터' },
    { value: 'hardest', label: '어려운 문제부터' },
  ];

  return (
    <section className="category-browser" aria-labelledby="category-browser-title">
      <div className="category-problems-head">
        <div>
          <p>선택한 출제 유형</p>
          <h2 id="category-browser-title">{category || '카테고리를 선택해 주세요'}</h2>
          {category && <span>총 {selectedProblems.length}문항 · 오답률은 EBSi 채점 참여자 TOP15 기준</span>}
        </div>
        {category && (
          <fieldset className="category-sort">
            <legend>문항 정렬</legend>
            <div className="category-sort-layout">
              <span aria-hidden="true">정렬</span>
              <div className="category-sort-options">
                {sortOptions.map(({ value, label }) => (
                  <button
                    type="button"
                    aria-pressed={sortOrder === value}
                    onClick={() => setSortOrder(value)}
                    key={value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>
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
                  <small>
                    {problem.number}번 · 오답률 {problem.wrongRate === null ? '자료 없음' : `${problem.wrongRate}%`}
                  </small>
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
