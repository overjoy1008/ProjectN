'use client';

import { type TouchEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileText, Minus, Plus } from 'lucide-react';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import problemJourneyData from './problem-journeys.json';

type Session = '6모' | '9모' | '수능';
type Subject = '확통' | '미적' | '기하' | '가형' | '나형';
type ProblemJourney = {
  id: string;
  year: number;
  session: Session;
  section: '공통' | '확통';
  number: number;
  score: number;
  difficulty: { level: string; rank: number };
  categories: string[];
  officialIntent: string;
  problemText: string;
  conditions: string[];
  goal: string;
  journey: string[];
  sourceBasis: string;
};

const years = Array.from({ length: 11 }, (_, index) => 2027 - index);
const sessions: Session[] = ['6모', '9모', '수능'];
const csatDate = { year: 2026, month: 11, day: 19 };
const questionCanvas = { width: 1020, height: 2822 };
const sessionLabel: Record<Session, string> = { '6모': '6월 모의평가', '9모': '9월 모의평가', 수능: '대학수학능력시험' };
const subjectLabel: Record<Subject, string> = { 확통: '확률과 통계', 미적: '미적분', 기하: '기하', 가형: '가형', 나형: '나형' };
const problemJourneys = problemJourneyData.problems as ProblemJourney[];
const sessionOrder: Record<Session, number> = { '6모': 1, '9모': 2, 수능: 3 };

function getSimilarityScore(current: ProblemJourney, candidate: ProblemJourney) {
  const shared = candidate.categories.filter((category) => current.categories.includes(category));
  if (shared.length === 0) return -1;

  let score = shared.length * 20;
  if (candidate.categories[0] === current.categories[0]) score += 12;
  if (candidate.section === current.section) score += 6;
  if (candidate.score === current.score) score += 4;
  score -= Math.abs(candidate.difficulty.rank - current.difficulty.rank) * 3;
  return score;
}

function assetUrl(...segments: string[]) {
  return `/archive/${segments.map(encodeURIComponent).join('/')}`;
}

function getDaysUntilCsat() {
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date());
  const values = Object.fromEntries(dateParts.map(({ type, value }) => [type, Number(value)]));
  const today = Date.UTC(values.year, values.month - 1, values.day);
  const target = Date.UTC(csatDate.year, csatDate.month - 1, csatDate.day);
  return Math.ceil((target - today) / 86_400_000);
}

function getQuestionScore(year: number, question: number) {
  if (year >= 2022) {
    if (question === 1 || question === 2 || question === 23) return 2;
    if ((question >= 3 && question <= 8) || (question >= 16 && question <= 19) || (question >= 24 && question <= 27)) return 3;
    return 4;
  }

  if (question >= 1 && question <= 3) return 2;
  if ((question >= 4 && question <= 13) || (question >= 22 && question <= 25)) return 3;
  return 4;
}

export default function Home() {
  const [year, setYear] = useState(2027);
  const [session, setSession] = useState<Session>('9모');
  const [subject, setSubject] = useState<Subject>('확통');
  const [question, setQuestion] = useState('');
  const [questionZoom, setQuestionZoom] = useState(0.7);
  const [questionFitScale, setQuestionFitScale] = useState(1);
  const [questionNavTop, setQuestionNavTop] = useState<number | null>(null);
  const [daysUntilCsat, setDaysUntilCsat] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const questionViewerRef = useRef<HTMLDivElement | null>(null);
  const holdDelayRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);
  const didHoldRef = useRef(false);

  useEffect(() => {
    const updateCountdown = () => setDaysUntilCsat(getDaysUntilCsat());
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const modern = year >= 2022;
  const subjects: Subject[] = modern ? ['확통', '미적', '기하'] : ['가형', '나형'];
  const exam = `${year} ${session}`;
  const paperName = `${exam} ${subject}.pdf`;
  const pdfUrl = assetUrl(exam, paperName);
  const showingSolution = question === 'solution';
  const questionNumber = /^\d+$/.test(question) ? Number(question) : null;
  const sharedSolution = (year === 2026 && session === '6모') || (year === 2027 && session === '9모');
  const solutionName = sharedSolution ? `${exam} 해설.pdf` : `${exam} ${subject} 해설.pdf`;
  const solutionUrl = assetUrl(exam, solutionName);
  const activePdfName = showingSolution ? solutionName : paperName;
  const activePdfUrl = showingSolution ? solutionUrl : pdfUrl;
  const questionScore = questionNumber ? getQuestionScore(year, questionNumber) : null;
  const compactQuestionCanvas = Boolean(
    questionNumber && (
      (questionNumber >= 1 && questionNumber <= 6)
      || (questionNumber >= 8 && questionNumber <= 9)
      || (year >= 2022 && questionNumber >= 16 && questionNumber <= 19)
      || (year < 2022 && questionNumber >= 22 && questionNumber <= 25)
    ),
  );
  const questionCanvasHeight = compactQuestionCanvas ? questionCanvas.height / 2 : questionCanvas.height;
  const questionSection = modern && questionNumber && questionNumber <= 22 ? '공통' : subject;
  const questionFile = questionNumber ? `${exam} ${questionSection} ${String(questionNumber).padStart(2, '0')}번.png` : '';
  const questionUrl = questionNumber ? assetUrl(exam, 'Questions', questionSection, questionFile) : '';
  const title = `${year}학년도 ${sessionLabel[session]} · ${subjectLabel[subject]}`;
  const questionTitle = `${year}학년도 ${sessionLabel[session]} · ${modern && questionNumber && questionNumber <= 22 ? '공통' : subjectLabel[subject]}`;
  const effectiveQuestionScale = questionFitScale * questionZoom;
  const currentJourney = questionNumber && (questionNumber <= 22 || subject === '확통')
    ? problemJourneys.find((problem) => problem.year === year && problem.session === session && problem.number === questionNumber)
    : undefined;
  const questionCategories = currentJourney?.categories ?? [];
  const similarProblems = useMemo(() => {
    if (!currentJourney) return [];
    return problemJourneys
      .filter((candidate) => candidate.id !== currentJourney.id)
      .map((candidate) => ({
        problem: candidate,
        score: getSimilarityScore(currentJourney, candidate),
        shared: candidate.categories.filter((category) => currentJourney.categories.includes(category)),
      }))
      .filter((candidate) => candidate.score >= 0)
      .sort((a, b) => b.score - a.score
        || b.problem.year - a.problem.year
        || sessionOrder[b.problem.session] - sessionOrder[a.problem.session]
        || a.problem.number - b.problem.number)
      .slice(0, 6);
  }, [currentJourney]);

  useEffect(() => {
    const viewer = questionViewerRef.current;
    if (!viewer || !questionNumber) {
      setQuestionNavTop(null);
      setQuestionFitScale(1);
      return;
    }

    let frame = 0;
    const updatePosition = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const rect = viewer.getBoundingClientRect();
        const styles = window.getComputedStyle(viewer);
        const horizontalPadding = Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.paddingRight);
        const availableWidth = Math.max(1, viewer.clientWidth - horizontalPadding);
        setQuestionFitScale(availableWidth / questionCanvas.width);
        const visibleTop = Math.max(rect.top, 0);
        const visibleBottom = Math.min(rect.bottom, window.innerHeight);
        if (visibleBottom <= visibleTop) return;
        setQuestionNavTop((visibleTop + visibleBottom) / 2 - rect.top + viewer.scrollTop);
      });
    };

    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    observer.observe(viewer);
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);
    viewer.addEventListener('scroll', updatePosition, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      viewer.removeEventListener('scroll', updatePosition);
    };
  }, [questionNumber, questionZoom]);

  useEffect(() => () => stopHoldingQuestion(), []);

  useEffect(() => {
    if (!questionNumber) return;

    const handleArrowKeys = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, select, textarea, [contenteditable="true"]')) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      moveQuestion(event.key === 'ArrowLeft' ? -1 : 1);
    };

    window.addEventListener('keydown', handleArrowKeys);
    return () => window.removeEventListener('keydown', handleArrowKeys);
  }, [questionNumber]);

  function changeYear(value: number) {
    setYear(value);
    if (value === 2027 && session === '수능') setSession('9모');
    if (value < 2026 && question === 'solution') setQuestion('');
    setSubject(value >= 2022 ? '미적' : '가형');
  }

  function moveQuestion(direction: -1 | 1) {
    setQuestion((current) => {
      const currentNumber = Number(current);
      if (!currentNumber) return current;
      return String(Math.min(30, Math.max(1, currentNumber + direction)));
    });
  }

  function stopHoldingQuestion() {
    if (holdDelayRef.current !== null) window.clearTimeout(holdDelayRef.current);
    if (holdIntervalRef.current !== null) window.clearInterval(holdIntervalRef.current);
    holdDelayRef.current = null;
    holdIntervalRef.current = null;
  }

  function startHoldingQuestion(direction: -1 | 1) {
    stopHoldingQuestion();
    didHoldRef.current = false;
    holdDelayRef.current = window.setTimeout(() => {
      didHoldRef.current = true;
      moveQuestion(direction);
      holdIntervalRef.current = window.setInterval(() => moveQuestion(direction), 180);
    }, 380);
  }

  function clickQuestionArrow(direction: -1 | 1) {
    if (didHoldRef.current) {
      didHoldRef.current = false;
      return;
    }
    moveQuestion(direction);
  }

  function changeQuestionZoom(direction: -1 | 1) {
    setQuestionZoom((current) => Math.min(1, Math.max(0.5, Number((current + direction * 0.1).toFixed(1)))));
  }

  function openSimilarProblem(problem: ProblemJourney) {
    setYear(problem.year);
    setSession(problem.session);
    if (problem.section === '확통') setSubject('확통');
    setQuestion(String(problem.number));
    window.requestAnimationFrame(() => document.querySelector('.document-shell')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function finishSwipe(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) < 48) return;
    moveQuestion(distance < 0 ? 1 : -1);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="site-header site-header-with-nav">
        <div className="brand-lockup">
          <h1 className="wordmark">Project <i>/N/</i></h1>
          <p>평가원 수학 아카이브</p>
        </div>
        <nav className="site-nav" aria-label="주요 메뉴"><a href="/" aria-current="page">문제 아카이브</a><a href="/curriculum">교육 범위</a></nav>
      </header>

      <div className="workspace">
        <div className="archive-ticket">
          <div className="ticket-masthead">
            <time dateTime="2026-11-19" aria-label="2027학년도 수능 11월 19일">11.19</time>
            <span aria-label={daysUntilCsat === null ? '수능 디데이 계산 중' : `수능까지 ${daysUntilCsat}일`}>
              {daysUntilCsat === null ? 'D-—' : daysUntilCsat >= 0 ? `D-${daysUntilCsat}` : `D+${Math.abs(daysUntilCsat)}`}
            </span>
          </div>
          <section className="selector-strip" aria-label="시험지 선택">
            <label><span>연도</span><NativeSelect value={year} onChange={(event) => changeYear(Number(event.target.value))} aria-label="연도 선택">{years.map((item) => <NativeSelectOption key={item} value={item}>{item}학년도</NativeSelectOption>)}</NativeSelect></label>
            <label><span>월</span><NativeSelect value={session} onChange={(event) => setSession(event.target.value as Session)} aria-label="시험 월 선택">{sessions.map((item) => {
              const unavailable = year === 2027 && item === '수능';
              return <NativeSelectOption disabled={unavailable} key={item} value={item}>{sessionLabel[item]}</NativeSelectOption>;
            })}</NativeSelect></label>
            <label><span>선택과목</span><NativeSelect value={subject} onChange={(event) => setSubject(event.target.value as Subject)} aria-label="선택과목 선택">{subjects.map((item) => <NativeSelectOption key={item} value={item}>{subjectLabel[item]}</NativeSelectOption>)}</NativeSelect></label>
            <label><span>번호</span><NativeSelect value={question} onChange={(event) => setQuestion(event.target.value)} aria-label="문항 번호 선택"><NativeSelectOption value="">전체 시험지</NativeSelectOption>{year >= 2026 && <NativeSelectOption value="solution">해설지</NativeSelectOption>}{Array.from({ length: 30 }, (_, index) => index + 1).map((item) => <NativeSelectOption key={item} value={item}>{item}번</NativeSelectOption>)}</NativeSelect></label>
          </section>

          <div className="selection-summary" aria-live="polite"><span>{modern ? '공통 1–22 · 선택 23–30' : `${subjectLabel[subject]} 1–30`}</span></div>
        </div>

        <section className="document-shell">
          <div className="document-bar">
            <div className="document-heading">
              <div className="document-mark" aria-hidden="true">{questionNumber ? String(questionNumber).padStart(2, '0') : 'PDF'}</div>
              <div className="document-copy">
                <h2>{questionNumber ? `${questionTitle} · ${questionNumber}번` : showingSolution ? `${title} · 해설지` : title}</h2>
              </div>
            </div>
            <a className="download-button" href={questionNumber ? questionUrl : activePdfUrl} download={questionNumber ? questionFile : activePdfName}><Download aria-hidden="true" /> {questionNumber ? '문항 다운로드' : showingSolution ? '해설지 다운로드' : 'PDF 다운로드'}</a>
          </div>

          {questionScore && (
            <div className="question-meta-bar">
              <div className="score-meter" data-score={questionScore} aria-label={`${questionScore}점 문항`}>
                <strong>{questionScore}점</strong>
                <span className="score-cells" aria-hidden="true">
                  {[1, 2, 3, 4].map((cell) => <i key={cell} className={cell <= questionScore ? 'score-cell-active' : ''} />)}
                </span>
              </div>
              {questionCategories.length > 0 && (
                <div className="question-category-list" aria-label="출제 유형">
                  {questionCategories.map((category) => <span key={category}>{category}</span>)}
                </div>
              )}
              <div className="question-zoom-controls" aria-label="문항 크기 조절">
                <button type="button" onClick={() => changeQuestionZoom(-1)} disabled={questionZoom <= 0.5} aria-label="문항 축소"><Minus aria-hidden="true" /></button>
                <output aria-live="polite">{Math.round(questionZoom * 100)}%</output>
                <button type="button" onClick={() => changeQuestionZoom(1)} disabled={questionZoom >= 1} aria-label="문항 확대"><Plus aria-hidden="true" /></button>
              </div>
            </div>
          )}

          {questionNumber ? (
            <div
              ref={questionViewerRef}
              className="question-viewer"
              onTouchStart={(event) => { touchStartX.current = event.touches[0].clientX; }}
              onTouchEnd={finishSwipe}
              onTouchCancel={() => { touchStartX.current = null; }}
            >
              <button className="question-nav question-nav-previous" style={questionNavTop === null ? undefined : { top: questionNavTop }} type="button" onClick={() => clickQuestionArrow(-1)} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); startHoldingQuestion(-1); }} onPointerUp={stopHoldingQuestion} onPointerCancel={stopHoldingQuestion} onPointerLeave={stopHoldingQuestion} onContextMenu={(event) => event.preventDefault()} disabled={questionNumber === 1} aria-label="이전 문항"><ChevronLeft aria-hidden="true" /></button>
              <div
                className="question-sheet"
                style={{
                  width: `${questionCanvas.width * effectiveQuestionScale}px`,
                  height: `${questionCanvasHeight * effectiveQuestionScale}px`,
                }}
              >
                <div
                  className="question-canvas"
                  style={{ transform: `scale(${effectiveQuestionScale})` }}
                >
                  <img key={questionUrl} src={questionUrl} alt={`${questionTitle} ${questionNumber}번 문제`} />
                </div>
              </div>
              <button className="question-nav question-nav-next" style={questionNavTop === null ? undefined : { top: questionNavTop }} type="button" onClick={() => clickQuestionArrow(1)} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); startHoldingQuestion(1); }} onPointerUp={stopHoldingQuestion} onPointerCancel={stopHoldingQuestion} onPointerLeave={stopHoldingQuestion} onContextMenu={(event) => event.preventDefault()} disabled={questionNumber === 30} aria-label="다음 문항"><ChevronRight aria-hidden="true" /></button>
            </div>
          ) : (
            <div className="pdf-viewer-wrap"><object key={activePdfUrl} data={`${activePdfUrl}#view=Fit&toolbar=1`} type="application/pdf" className="pdf-viewer"><div className="preview-placeholder"><FileText aria-hidden="true" /><strong>브라우저에서 PDF 미리보기를 지원하지 않습니다.</strong><a href={activePdfUrl} download={activePdfName}>{showingSolution ? '해설지 내려받기' : '시험지 내려받기'}</a></div></object></div>
          )}

          {currentJourney && similarProblems.length > 0 && (
            <section className="similar-problems" aria-labelledby="similar-problems-title">
              <div className="similar-problems-heading">
                <span>RELATED</span>
                <div>
                  <h3 id="similar-problems-title">유사 문항</h3>
                  <p>풀이 유형과 난이도가 가까운 순서입니다.</p>
                </div>
              </div>
              <ol className="similar-problem-list">
                {similarProblems.map(({ problem, shared }, index) => (
                  <li key={problem.id}>
                    <button type="button" onClick={() => openSimilarProblem(problem)}>
                      <span className="similar-problem-rank">{String(index + 1).padStart(2, '0')}</span>
                      <span className="similar-problem-copy">
                        <strong>{problem.year}학년도 {sessionLabel[problem.session]} · {problem.section === '공통' ? '공통' : '확률과 통계'} · {problem.number}번</strong>
                        <small>{problem.difficulty.level} · {problem.score}점</small>
                        <span className="similar-problem-tags">{shared.map((category) => <i key={category}>{category}</i>)}</span>
                      </span>
                      <ChevronRight aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
