'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const eraLabels = ['2017~2020', '2021~2027', '2028~'];

export function MobileEraNavigation() {
  const [activeIndex, setActiveIndex] = useState(1);

  return (
    <nav className="era-mobile-nav" data-active-index={activeIndex} aria-label="교육과정 연도 이동">
      <button
        type="button"
        onClick={() => setActiveIndex((current) => Math.max(0, current - 1))}
        disabled={activeIndex === 0}
        aria-label="이전 교육과정"
      >
        <ChevronLeft aria-hidden="true" />
      </button>
      <strong aria-live="polite">{eraLabels[activeIndex]}</strong>
      <button
        type="button"
        onClick={() => setActiveIndex((current) => Math.min(eraLabels.length - 1, current + 1))}
        disabled={activeIndex === eraLabels.length - 1}
        aria-label="다음 교육과정"
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </nav>
  );
}
