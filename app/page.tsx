'use client';

import { type TouchEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileText, Minus, Plus } from 'lucide-react';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

type Session = '6모' | '9모' | '수능';
type Subject = '확통' | '미적' | '기하' | '가형' | '나형';

const years = Array.from({ length: 11 }, (_, index) => 2027 - index);
const sessions: Session[] = ['6모', '9모', '수능'];
const csatDate = { year: 2026, month: 11, day: 19 };
const questionCanvas = { width: 1020, height: 2822 };
const sessionLabel: Record<Session, string> = { '6모': '6월 모의평가', '9모': '9월 모의평가', 수능: '대학수학능력시험' };
const subjectLabel: Record<Subject, string> = { 확통: '확률과 통계', 미적: '미적분', 기하: '기하', 가형: '가형', 나형: '나형' };

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

export default function Home() {
  const [year, setYear] = useState(2027);
  const [session, setSession] = useState<Session>('9모');
  const [subject, setSubject] = useState<Subject>('미적');
  const [question, setQuestion] = useState('');
  const [questionZoom, setQuestionZoom] = useState(0.7);
  const [questionNavTop, setQuestionNavTop] = useState<number | null>(null);
  const [daysUntilCsat, setDaysUntilCsat] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const questionViewerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateCountdown = () => setDaysUntilCsat(getDaysUntilCsat());
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const availableSessions = useMemo(() => sessions.filter((item) => !(year === 2027 && item === '수능')), [year]);
  const modern = year >= 2022;
  const subjects: Subject[] = modern ? ['확통', '미적', '기하'] : ['가형', '나형'];
  const exam = `${year} ${session}`;
  const paperName = `${exam} ${subject}.pdf`;
  const pdfUrl = assetUrl(exam, paperName);
  const questionNumber = question ? Number(question) : null;
  const questionSection = modern && questionNumber && questionNumber <= 22 ? '공통' : subject;
  const questionFile = questionNumber ? `${exam} ${questionSection} ${String(questionNumber).padStart(2, '0')}번.png` : '';
  const questionUrl = questionNumber ? assetUrl(exam, 'Questions', questionSection, questionFile) : '';
  const title = `${year}학년도 ${sessionLabel[session]} · ${subjectLabel[subject]}`;

  useEffect(() => {
    const viewer = questionViewerRef.current;
    if (!viewer || !questionNumber) {
      setQuestionNavTop(null);
      return;
    }

    let frame = 0;
    const updatePosition = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const rect = viewer.getBoundingClientRect();
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

  function changeYear(value: number) {
    setYear(value);
    if (value === 2027 && session === '수능') setSession('9모');
    setSubject(value >= 2022 ? '미적' : '가형');
  }

  function moveQuestion(direction: -1 | 1) {
    setQuestion((current) => {
      const currentNumber = Number(current);
      if (!currentNumber) return current;
      return String(Math.min(30, Math.max(1, currentNumber + direction)));
    });
  }

  function changeQuestionZoom(direction: -1 | 1) {
    setQuestionZoom((current) => Math.min(1, Math.max(0.5, Number((current + direction * 0.1).toFixed(1)))));
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
      <header className="site-header">
        <div className="brand-lockup">
          <h1 className="wordmark">Project <i>/N/</i></h1>
          <p>평가원 수학 아카이브</p>
        </div>
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
            <label><span>월</span><NativeSelect value={session} onChange={(event) => setSession(event.target.value as Session)} aria-label="시험 월 선택">{availableSessions.map((item) => <NativeSelectOption key={item} value={item}>{sessionLabel[item]}</NativeSelectOption>)}</NativeSelect></label>
            <label><span>선택과목</span><NativeSelect value={subject} onChange={(event) => setSubject(event.target.value as Subject)} aria-label="선택과목 선택">{subjects.map((item) => <NativeSelectOption key={item} value={item}>{subjectLabel[item]}</NativeSelectOption>)}</NativeSelect></label>
            <label><span>번호</span><NativeSelect value={question} onChange={(event) => setQuestion(event.target.value)} aria-label="문항 번호 선택"><NativeSelectOption value="">전체 시험지</NativeSelectOption>{Array.from({ length: 30 }, (_, index) => index + 1).map((item) => <NativeSelectOption key={item} value={item}>{item}번</NativeSelectOption>)}</NativeSelect></label>
          </section>

          <div className="selection-summary" aria-live="polite"><span>{modern ? '공통 1–22 · 선택 23–30' : `${subjectLabel[subject]} 1–30`}</span></div>
        </div>

        <section className="document-shell">
          <div className="document-bar">
            <div className="document-heading">
              <div className="document-mark" aria-hidden="true">{questionNumber ? String(questionNumber).padStart(2, '0') : 'PDF'}</div>
              <div><h2>{questionNumber ? `${title} · ${questionNumber}번` : title}</h2></div>
            </div>
            <a className="download-button" href={questionNumber ? questionUrl : pdfUrl} download={questionNumber ? questionFile : paperName}><Download aria-hidden="true" /> {questionNumber ? '문항 다운로드' : 'PDF 다운로드'}</a>
          </div>

          {questionNumber ? (
            <div
              ref={questionViewerRef}
              className="question-viewer"
              onTouchStart={(event) => { touchStartX.current = event.touches[0].clientX; }}
              onTouchEnd={finishSwipe}
              onTouchCancel={() => { touchStartX.current = null; }}
            >
              <div className="question-zoom-controls" aria-label="문항 크기 조절">
                <button type="button" onClick={() => changeQuestionZoom(-1)} disabled={questionZoom <= 0.5} aria-label="문항 축소"><Minus aria-hidden="true" /></button>
                <output aria-live="polite">{Math.round(questionZoom * 100)}%</output>
                <button type="button" onClick={() => changeQuestionZoom(1)} disabled={questionZoom >= 1} aria-label="문항 확대"><Plus aria-hidden="true" /></button>
              </div>
              <button className="question-nav question-nav-previous" style={questionNavTop === null ? undefined : { top: questionNavTop }} type="button" onClick={() => moveQuestion(-1)} disabled={questionNumber === 1} aria-label="이전 문항"><ChevronLeft aria-hidden="true" /></button>
              <div
                className="question-sheet"
                style={{
                  width: `${questionCanvas.width * questionZoom}px`,
                  height: `${questionCanvas.height * questionZoom}px`,
                }}
              >
                <div
                  className="question-canvas"
                  style={{ transform: `scale(${questionZoom})` }}
                >
                  <img key={questionUrl} src={questionUrl} alt={`${title} ${questionNumber}번 문제`} />
                </div>
              </div>
              <button className="question-nav question-nav-next" style={questionNavTop === null ? undefined : { top: questionNavTop }} type="button" onClick={() => moveQuestion(1)} disabled={questionNumber === 30} aria-label="다음 문항"><ChevronRight aria-hidden="true" /></button>
            </div>
          ) : (
            <div className="pdf-viewer-wrap"><object key={pdfUrl} data={`${pdfUrl}#view=Fit&toolbar=1`} type="application/pdf" className="pdf-viewer"><div className="preview-placeholder"><FileText aria-hidden="true" /><strong>브라우저에서 PDF 미리보기를 지원하지 않습니다.</strong><a href={pdfUrl} download={paperName}>시험지 내려받기</a></div></object></div>
          )}
        </section>
      </div>
    </main>
  );
}
