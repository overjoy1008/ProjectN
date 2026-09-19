export const siteName = 'Project N - 평가원 수학 아카이브';
export const siteDescription = '2017학년도부터 최신 평가원 수학 기출문제를 연도, 시험, 선택과목, 문항과 출제 유형별로 탐색하는 수학 아카이브입니다.';

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.RENDER_EXTERNAL_URL;

export const siteUrl = configuredSiteUrl?.replace(/\/$/, '');
