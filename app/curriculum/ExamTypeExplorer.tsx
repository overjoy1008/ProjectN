type ExamType = { subject: string; items: string[] };

const directlyTestedSubjects = new Set(['수학 I', '수학 II', '확률과 통계', '미적분']);

function categoryUrl(category: string) {
  return `/categories.html?category=${encodeURIComponent(category)}`;
}

export function ExamTypeExplorer({ examTypes }: { examTypes: ExamType[] }) {
  const examTypeRows = [
    { kind: 'indirect', subjects: examTypes.filter(({ subject }) => !directlyTestedSubjects.has(subject)) },
    { kind: 'direct', subjects: examTypes.filter(({ subject }) => directlyTestedSubjects.has(subject)) },
  ] as const;

  return (
    <div className="exam-type-grid">
      {examTypeRows.map(({ kind, subjects }) => (
        <div className={`exam-type-row exam-type-row-${kind}`} key={kind}>
          {subjects.map(({ subject, items }) => (
            <article className="exam-type-card" key={subject}>
              <header className="exam-type-card-head">
                <span>{kind === 'direct' ? '직접 출제' : '간접 출제'}</span>
                <h3>{subject}</h3>
              </header>
              <ol className="exam-type-list">
                {items.map((item) => (
                  <li key={item}>
                    {kind === 'direct' ? (
                      <a className="exam-type-category-link" href={categoryUrl(item)}>{item}</a>
                    ) : (
                      <span className="exam-type-category-label">{item}</span>
                    )}
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      ))}
    </div>
  );
}
