'use client';

import { useMemo, useState } from 'react';
import { Download, FileText, Image as ImageIcon } from 'lucide-react';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

type Session = '6모' | '9모' | '수능';
type Subject = '확통' | '미적' | '기하' | '가형' | '나형';

const years = Array.from({ length: 11 }, (_, index) => 2027 - index);
const sessions: Session[] = ['6모', '9모', '수능'];
const sessionLabel: Record<Session, string> = { '6모': '6월 모의평가', '9모': '9월 모의평가', 수능: '대학수학능력시험' };
const subjectLabel: Record<Subject, string> = { 확통: '확률과 통계', 미적: '미적분', 기하: '기하', 가형: '가형', 나형: '나형' };

function assetUrl(...segments: string[]) {
  return `/archive/${segments.map(encodeURIComponent).join('/')}`;
}

export default function Home() {
  const [year, setYear] = useState(2027);
  const [session, setSession] = useState<Session>('9모');
  const [subject, setSubject] = useState<Subject>('미적');
  const [question, setQuestion] = useState('');

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
  const archiveCode = `N-${year}-${session === '수능' ? 'CSAT' : session.replace('모', 'M')}-${subject.toUpperCase()}`;

  function changeYear(value: number) {
    setYear(value);
    if (value === 2027 && session === '수능') setSession('9모');
    setSubject(value >= 2022 ? '미적' : '가형');
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
          <div className="ticket-masthead" aria-hidden="true">
            <div><strong>ADMIT ONE</strong><span>수학 문항 열람권</span></div>
            <div className="ticket-route"><span>YEAR</span><b>→</b><span>SESSION</span><b>→</b><span>SUBJECT</span><b>→</b><span>QUESTION</span></div>
            <div className="ticket-serial">No. {archiveCode}</div>
          </div>

          <section className="selector-strip" aria-label="시험지 선택">
            <label><span>연도</span><NativeSelect value={year} onChange={(event) => changeYear(Number(event.target.value))} aria-label="연도 선택">{years.map((item) => <NativeSelectOption key={item} value={item}>{item}학년도</NativeSelectOption>)}</NativeSelect></label>
            <label><span>월 / 시험</span><NativeSelect value={session} onChange={(event) => setSession(event.target.value as Session)} aria-label="월 또는 시험 선택">{availableSessions.map((item) => <NativeSelectOption key={item} value={item}>{sessionLabel[item]}</NativeSelectOption>)}</NativeSelect></label>
            <label><span>선택과목</span><NativeSelect value={subject} onChange={(event) => setSubject(event.target.value as Subject)} aria-label="선택과목 선택">{subjects.map((item) => <NativeSelectOption key={item} value={item}>{subjectLabel[item]}</NativeSelectOption>)}</NativeSelect></label>
            <label><span>번호</span><NativeSelect value={question} onChange={(event) => setQuestion(event.target.value)} aria-label="문항 번호 선택"><NativeSelectOption value="">전체 시험지</NativeSelectOption>{Array.from({ length: 30 }, (_, index) => index + 1).map((item) => <NativeSelectOption key={item} value={item}>{item}번</NativeSelectOption>)}</NativeSelect></label>
          </section>

          <div className="selection-summary" aria-live="polite"><span>{modern ? '공통 1–22 · 선택 23–30' : `${subjectLabel[subject]} 1–30`}</span><span>{questionNumber ? `${questionNumber}번 문항` : '전체 시험지'}</span></div>
        </div>

        <section className="document-shell">
          <div className="document-bar">
            <div className="document-heading">
              <div className="document-mark" aria-hidden="true">{questionNumber ? String(questionNumber).padStart(2, '0') : 'PDF'}</div>
              <div><span className="eyebrow">{questionNumber ? 'QUESTION VIEW' : 'PDF VIEWER'} / {archiveCode}</span><h2>{questionNumber ? `${title} · ${questionNumber}번` : title}</h2></div>
            </div>
            <a className="download-button" href={questionNumber ? questionUrl : pdfUrl} download={questionNumber ? questionFile : paperName}><Download aria-hidden="true" /> {questionNumber ? '문항 이미지 다운로드' : 'PDF 다운로드'}</a>
          </div>

          {questionNumber ? (
            <div className="question-viewer"><div className="question-index"><ImageIcon aria-hidden="true" /><span>{String(questionNumber).padStart(2, '0')}</span></div><img key={questionUrl} src={questionUrl} alt={`${title} ${questionNumber}번 문제`} /></div>
          ) : (
            <div className="pdf-viewer-wrap"><object key={pdfUrl} data={`${pdfUrl}#view=FitH&toolbar=1`} type="application/pdf" className="pdf-viewer"><div className="preview-placeholder"><FileText aria-hidden="true" /><strong>브라우저에서 PDF 미리보기를 지원하지 않습니다.</strong><a href={pdfUrl} download={paperName}>시험지 내려받기</a></div></object></div>
          )}
        </section>
      </div>
    </main>
  );
}
