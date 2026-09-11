'use client';

import { useEffect, useState } from 'react';

type ConnectionPath = { key: string; d: string };

const node = (era: string, subject: string, unit: string) => `${era}|${subject}|${unit}`;

const connections: [string, string, number][] = [
  [node('2017~2020', '수학 I', '다항식'), node('2021~2027', '수학 (상)', '다항식'), 0],
  [node('2017~2020', '수학 I', '방정식과 부등식'), node('2021~2027', '수학 (상)', '방정식과 부등식'), 0],
  [node('2017~2020', '수학 I', '도형의 방정식'), node('2021~2027', '수학 (상)', '도형의 방정식'), 0],
  [node('2017~2020', '수학 II', '집합과 명제'), node('2021~2027', '수학 (하)', '집합과 명제'), 1],
  [node('2017~2020', '수학 II', '함수'), node('2021~2027', '수학 (하)', '함수'), 1],
  [node('2017~2020', '수학 II', '수열'), node('2021~2027', '수학 I', '수열'), 1],
  [node('2017~2020', '수학 II', '지수와 로그'), node('2021~2027', '수학 I', '지수·로그함수'), 2],
  [node('2017~2020', '미적분 I', '수열의 극한'), node('2021~2027', '미적분', '수열의 극한'), 2],
  [node('2017~2020', '미적분 I', '함수의 극한과 연속'), node('2021~2027', '수학 II', '함수의 극한과 연속'), 1],
  [node('2017~2020', '미적분 I', '미분'), node('2021~2027', '수학 II', '미분'), 1],
  [node('2017~2020', '미적분 I', '적분'), node('2021~2027', '수학 II', '적분'), 1],
  [node('2017~2020', '확률과 통계', '확률'), node('2021~2027', '확률과 통계', '확률'), 1],
  [node('2017~2020', '확률과 통계', '통계'), node('2021~2027', '확률과 통계', '통계'), 1],
  [node('2017~2020', '미적분 II', '지수·로그함수'), node('2021~2027', '수학 I', '지수·로그함수'), 4],
  [node('2017~2020', '미적분 II', '삼각함수'), node('2021~2027', '수학 I', '삼각함수'), 5],
  [node('2017~2020', '미적분 II', '미분법'), node('2021~2027', '미적분', '미분법'), 1],
  [node('2017~2020', '미적분 II', '적분법'), node('2021~2027', '미적분', '적분법'), 1],
  [node('2017~2020', '기하와 벡터', '평면곡선'), node('2021~2027', '기하', '이차곡선'), 1],
  [node('2017~2020', '기하와 벡터', '평면벡터'), node('2021~2027', '기하', '평면벡터'), 1],
  [node('2017~2020', '기하와 벡터', '공간도형'), node('2021~2027', '기하', '공간도형과 공간좌표'), 1],

  [node('2021~2027', '수학 (상)', '다항식'), node('2028~', '공통수학 I', '다항식'), 1],
  [node('2021~2027', '수학 (상)', '방정식과 부등식'), node('2028~', '공통수학 I', '방정식과 부등식'), 1],
  [node('2021~2027', '수학 (상)', '도형의 방정식'), node('2028~', '공통수학 II', '도형의 방정식'), 2],
  [node('2021~2027', '수학 (하)', '집합과 명제'), node('2028~', '공통수학 II', '집합과 명제'), 2],
  [node('2021~2027', '수학 (하)', '함수'), node('2028~', '공통수학 II', '함수'), 2],
  [node('2021~2027', '수학 (하)', '순열과 조합'), node('2028~', '공통수학 I', '경우의 수'), 1],
  [node('2021~2027', '수학 I', '지수·로그함수'), node('2028~', '대수', '지수·로그함수'), 0],
  [node('2021~2027', '수학 I', '삼각함수'), node('2028~', '대수', '삼각함수'), 0],
  [node('2021~2027', '수학 I', '수열'), node('2028~', '대수', '수열'), 0],
  [node('2021~2027', '수학 II', '함수의 극한과 연속'), node('2028~', '미적분 I', '함수의 극한과 연속'), 0],
  [node('2021~2027', '수학 II', '미분'), node('2028~', '미적분 I', '미분'), 0],
  [node('2021~2027', '수학 II', '적분'), node('2028~', '미적분 I', '적분'), 0],
  [node('2021~2027', '확률과 통계', '경우의 수'), node('2028~', '확률과 통계', '경우의 수'), 0],
  [node('2021~2027', '확률과 통계', '확률'), node('2028~', '확률과 통계', '확률'), 0],
  [node('2021~2027', '확률과 통계', '통계'), node('2028~', '확률과 통계', '통계'), 0],
  [node('2021~2027', '미적분', '수열의 극한'), node('2028~', '미적분 II', '수열의 극한'), 0],
  [node('2021~2027', '미적분', '미분법'), node('2028~', '미적분 II', '미분법'), 0],
  [node('2021~2027', '미적분', '적분법'), node('2028~', '미적분 II', '적분법'), 0],
  [node('2021~2027', '기하', '이차곡선'), node('2028~', '기하', '이차곡선'), 0],
  [node('2021~2027', '기하', '평면벡터'), node('2028~', '기하', '벡터'), 0],
  [node('2021~2027', '기하', '공간도형과 공간좌표'), node('2028~', '기하', '공간도형과 공간좌표'), 0],
];

export function CurriculumConnections() {
  const [paths, setPaths] = useState<ConnectionPath[]>([]);

  useEffect(() => {
    const grid = document.querySelector<HTMLElement>('.era-grid');
    if (!grid) return;

    const update = () => {
      const gridRect = grid.getBoundingClientRect();
      const nodes = new Map<string, HTMLElement>();
      grid.querySelectorAll<HTMLElement>('[data-unit-node]').forEach((element) => {
        if (element.dataset.unitNode) nodes.set(element.dataset.unitNode, element);
      });

      const nextPaths = connections.flatMap(([sourceKey, targetKey, lane], index) => {
        const source = nodes.get(sourceKey);
        const target = nodes.get(targetKey);
        const sourceCard = source?.closest<HTMLElement>('.era-card');
        if (!source || !target || !sourceCard) return [];

        const sourceRect = source.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const sourceCardRect = sourceCard.getBoundingClientRect();
        const startX = sourceRect.right + 8 - gridRect.left;
        const endX = targetRect.left - 8 - gridRect.left;
        const startY = sourceRect.top + sourceRect.height / 2 - gridRect.top;
        const endY = targetRect.top + targetRect.height / 2 - gridRect.top;
        const boundaryX = sourceCardRect.right - gridRect.left;
        const laneStep = Math.min(14, sourceCardRect.width * 0.035);
        const middleX = boundaryX - laneStep * (6 - lane);
        const bend = Math.min(12, Math.abs(endY - startY) / 2);
        const direction = endY >= startY ? 1 : -1;
        const d = lane === 0 || Math.abs(endY - startY) < 1
          ? `M ${startX} ${startY} H ${endX}`
          : `M ${startX} ${startY} H ${middleX - bend} Q ${middleX} ${startY} ${middleX} ${startY + direction * bend} V ${endY - direction * bend} Q ${middleX} ${endY} ${middleX + bend} ${endY} H ${endX}`;

        return [{ key: `${index}-${sourceKey}`, d }];
      });

      const branchPaths: ConnectionPath[] = [];
      const permutation = nodes.get(node('2017~2020', '확률과 통계', '순열'));
      const combination = nodes.get(node('2017~2020', '확률과 통계', '조합'));
      const mathTarget = nodes.get(node('2021~2027', '수학 (하)', '순열과 조합'));
      const probabilityTarget = nodes.get(node('2021~2027', '확률과 통계', '경우의 수'));
      const probabilityCard = permutation?.closest<HTMLElement>('.era-card');

      if (permutation && combination && mathTarget && probabilityTarget && probabilityCard) {
        const permutationRect = permutation.getBoundingClientRect();
        const combinationRect = combination.getBoundingClientRect();
        const mathTargetRect = mathTarget.getBoundingClientRect();
        const probabilityTargetRect = probabilityTarget.getBoundingClientRect();
        const cardRect = probabilityCard.getBoundingClientRect();
        const laneStep = Math.min(14, cardRect.width * 0.035);
        const boundaryX = cardRect.right - gridRect.left;
        const lane1X = boundaryX - laneStep * 5;
        const lane3X = boundaryX - laneStep * 3;
        const permutationY = permutationRect.top + permutationRect.height / 2 - gridRect.top;
        const combinationY = combinationRect.top + combinationRect.height / 2 - gridRect.top;
        const probabilityTargetY = probabilityTargetRect.top + probabilityTargetRect.height / 2 - gridRect.top;
        const mergeY = probabilityTargetY;
        const bend = 8;

        const incomingPath = (rect: DOMRect, y: number) => {
          const startX = rect.right + 8 - gridRect.left;
          const direction = mergeY >= y ? 1 : -1;
          return `M ${startX} ${y} H ${lane1X - bend} Q ${lane1X} ${y} ${lane1X} ${y + direction * bend} V ${mergeY}`;
        };

        const mathTargetY = mathTargetRect.top + mathTargetRect.height / 2 - gridRect.top;
        const mathEndX = mathTargetRect.left - 8 - gridRect.left;
        const mathDirection = mathTargetY >= mergeY ? 1 : -1;
        const mathPath = `M ${lane1X} ${mergeY} H ${lane3X - bend} Q ${lane3X} ${mergeY} ${lane3X} ${mergeY + mathDirection * bend} V ${mathTargetY - mathDirection * bend} Q ${lane3X} ${mathTargetY} ${lane3X + bend} ${mathTargetY} H ${mathEndX}`;

        const probabilityEndX = probabilityTargetRect.left - 8 - gridRect.left;
        const probabilityPath = `M ${lane1X} ${mergeY} H ${probabilityEndX}`;

        branchPaths.push(
          { key: 'permutation-to-merge', d: incomingPath(permutationRect, permutationY) },
          { key: 'combination-to-merge', d: incomingPath(combinationRect, combinationY) },
          { key: 'merge-to-math-lane-3', d: mathPath },
          { key: 'merge-to-probability', d: probabilityPath },
        );
      }

      setPaths([...nextPaths, ...branchPaths]);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(grid);
    window.addEventListener('resize', update);
    document.fonts?.ready.then(update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <svg className="curriculum-connections" aria-hidden="true">
      {paths.map((path) => <path d={path.d} key={path.key} />)}
    </svg>
  );
}
