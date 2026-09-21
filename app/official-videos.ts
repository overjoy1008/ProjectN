export type OfficialVideoSection = '공통' | '확통' | '미적' | '기하';

type Session = '6모' | '9모' | '수능';
type Subject = '확통' | '미적' | '기하' | '가형' | '나형';

type VideoOverride = { videoId: string; time?: string };
type OfficialVideo = {
  videoId: string;
  title: string;
  timelines: Partial<Record<OfficialVideoSection, Record<number, string>>>;
  sectionVideos?: Partial<Record<OfficialVideoSection, { videoId: string; title?: string }>>;
  overrides?: Partial<Record<OfficialVideoSection, Record<number, VideoOverride>>>;
};

export type OfficialVideoLink = {
  href: string;
  timeLabel: string | null;
  title: string;
};

const timeline = (firstQuestion: number, times: string) => Object.fromEntries(
  times.trim().split(/\s+/).flatMap((time, index) => (
    time === '-' ? [] : [[firstQuestion + index, time]]
  )),
);

const videos: Record<string, OfficialVideo> = {
  '2027|6모': {
    videoId: 'RtZcqVBc4kQ',
    title: '2027학년도 6월 모의평가 수학 전 문항 해설',
    timelines: {
      공통: timeline(1, '2:18 2:30 2:40 2:55 3:06 3:30 3:55 4:42 5:27 6:13 7:26 8:59 10:53 14:41 17:25 22:04 22:18 22:38 22:59 23:23 24:49 30:44'),
      확통: timeline(23, '35:48 36:00 36:27 37:06 38:00 38:48 44:22 46:02'),
      미적: timeline(23, '49:01 49:12 49:51 50:26 51:24 52:59 57:45 1:04:57'),
    },
  },
  '2027|9모': {
    videoId: '2nqZAlbpiGY',
    title: '2027학년도 9월 모의평가 수학 전 문항 해설',
    timelines: {
      공통: timeline(1, '0:51 1:06 1:21 1:46 2:07 2:32 3:10 4:21 5:52 7:10 9:09 10:34 13:08 18:05 23:39 32:58 33:27 33:45 34:39 36:20 40:04 47:42'),
      확통: timeline(23, '53:57 54:11 54:34 54:51 55:59 58:02 1:05:02 1:10:09'),
      미적: timeline(23, '1:13:18 1:13:27 1:13:59 1:14:44 1:16:59 1:19:18 1:25:26 1:31:35'),
    },
  },
  '2026|6모': {
    videoId: 'YdHTpydLrjI',
    title: '2026학년도 6월 모의평가 수학 전 문항 해설',
    timelines: {
      공통: timeline(1, '1:06 1:15 1:27 1:39 2:00 2:17 2:44 3:18 3:58 4:41 6:04 7:21 9:07 10:25 15:17 20:38 21:09 21:29 21:53 22:45'),
      확통: timeline(23, '25:12 25:24 25:50 26:39 27:23 28:24 31:50 34:46'),
      미적: timeline(23, '39:00 39:13 39:54 41:30 43:09 46:13 53:05 57:02'),
    },
    overrides: {
      공통: {
        21: { videoId: 'YEflCEIBsK0' },
        22: { videoId: 'jKQ5h4Z3f6s' },
      },
    },
  },
  '2026|9모': {
    videoId: 'uh074A4is_M',
    title: '2026학년도 9월 모의평가 수학 전 문항 해설',
    timelines: {
      공통: timeline(1, '1:53 2:07 2:24 2:41 2:52 3:23 4:09 4:45 5:46 7:07 10:05 12:54 15:47 19:54 23:32 31:00 31:22 31:51 32:59 35:01'),
      확통: timeline(23, '47:47 48:09 48:44 49:42 50:21 52:21 58:11 1:02:25'),
      미적: timeline(23, '1:06:53 1:07:15 1:07:54 1:08:50 1:10:40 1:13:27 1:22:40 1:29:39'),
    },
    overrides: {
      공통: {
        21: { videoId: 'yaknUe03vLc' },
        22: { videoId: 'uh074A4is_M', time: '39:20' },
      },
    },
  },
  '2026|수능': {
    videoId: 'LMqpyIMOMqE',
    title: '2026학년도 수능 수학 전 문항 해설',
    timelines: {
      공통: timeline(1, '1:11 1:24 1:43 2:10 2:34 3:04 4:22 4:57 6:16 9:19 12:56 17:14 19:00 22:06 27:46 36:38 37:00 37:24 38:17 40:42 45:13 57:20'),
      확통: timeline(23, '1:02:12 1:02:33 1:03:19 1:04:32 1:05:51 1:08:13 1:14:31 1:18:34'),
      미적: timeline(23, '1:22:34 1:22:49 1:23:40 1:24:05 1:25:37 1:28:55 1:36:14 1:41:55'),
    },
  },
  '2025|수능': {
    videoId: 'LgyGhI8ye4c',
    title: '2025학년도 수능 수학 전 문항 해설',
    timelines: {
      공통: timeline(1, '0:10 0:19 0:37 1:00 1:26 1:55 2:23 2:41 3:20 4:36 6:09 6:56 8:48 11:58 15:49 21:37 22:11 22:36 23:32 25:02 27:52 31:30'),
      확통: timeline(23, '38:03 38:19 39:02 39:36 40:46 42:41 46:07 48:57'),
      미적: timeline(23, '51:15 51:25 51:42 52:21 53:26 59:24 1:06:26 1:15:04'),
    },
  },
  '2025|6모': {
    videoId: '8KpFTgnZzH0',
    title: '2025학년도 6월 모의평가 수학 해설',
    timelines: {
      공통: timeline(1, '1:21 1:38 1:53 2:12 2:26 2:46 3:26 5:05 6:16 7:14 9:50 12:06 17:18 18:48 22:42 33:54 34:54 35:17 35:42 38:35 44:55 49:56'),
    },
    sectionVideos: {
      확통: { videoId: 'qD-15TURGfc', title: '2025학년도 6월 모의평가 수학 선택과목 해설' },
      미적: { videoId: 'qD-15TURGfc', title: '2025학년도 6월 모의평가 수학 선택과목 해설' },
    },
  },
  '2024|6모': {
    videoId: 'DNw_hnriQjM',
    title: '2024학년도 6월 모의평가 수학 전 문항 해설',
    timelines: {
      공통: timeline(1, '0:37 0:50 1:03 1:21 1:40 2:13 3:34 4:41 5:58 7:21 8:58 11:21 16:28 21:19 25:13 30:19 30:40 31:05 32:13 34:27 39:13 45:11'),
      확통: timeline(23, '54:24 54:39 55:15 56:29 57:48 59:35 1:04:33 1:07:14'),
      미적: timeline(23, '1:09:15 1:09:33 1:10:46 1:11:45 1:14:40 0:00 1:17:29 1:21:26'),
    },
    overrides: { 미적: { 28: { videoId: 'B80BWouyEhc' } } },
  },
  '2024|9모': {
    videoId: 'oRllHeD-TAs',
    title: '2024학년도 9월 모의평가 수학 전 문항 해설',
    timelines: {
      공통: timeline(1, '0:58 1:04 1:13 1:33 1:43 2:13 3:04 3:50 4:38 6:32 9:52 14:18 19:11 25:28 30:35 34:21 34:48 35:20 36:00 36:32 39:00 43:19'),
      확통: timeline(23, '46:31 46:43 46:56 48:00 48:44 50:13 55:58 58:07'),
      미적: timeline(23, '1:01:57 1:02:06 1:02:44 1:03:41 1:05:30 1:08:38 1:16:29 1:18:16'),
      기하: timeline(23, '1:23:01 1:23:17 1:23:33 1:24:00 1:26:24 1:27:51 1:31:14 1:34:21'),
    },
  },
  '2024|수능': {
    videoId: 'gdcisxia9ZM',
    title: '2024학년도 수능 수학 해설',
    timelines: {
      공통: timeline(1, '0:43 1:07 1:23 1:54 2:12 3:19 4:08 4:34 5:37 6:34 9:00 11:14 16:56 19:16 25:00 29:13 29:26 29:44 30:20 33:39 37:23 41:45'),
      확통: timeline(23, '0:13 0:29 1:06 2:00 3:50 5:32 8:58 11:23'),
      미적: timeline(23, '13:41 13:54 14:33 16:13 18:20 22:31 30:20 35:45'),
      기하: timeline(23, '40:39 41:11 42:09 43:16 45:55 49:20 55:13 57:37'),
    },
    sectionVideos: {
      확통: { videoId: '3jggenmEcO8', title: '2024학년도 수능 수학 선택과목 해설' },
      미적: { videoId: '3jggenmEcO8', title: '2024학년도 수능 수학 선택과목 해설' },
      기하: { videoId: '3jggenmEcO8', title: '2024학년도 수능 수학 선택과목 해설' },
    },
  },
  '2023|6모': {
    videoId: 'ZiOHXmNvOoM',
    title: '2023학년도 6월 모의평가 수학 전 문항 해설',
    timelines: {
      공통: timeline(1, '0:14 0:33 0:46 1:08 1:18 1:52 2:45 3:49 5:02 6:22 9:21 10:11 14:19 17:21 23:23 28:00 28:24 28:46 29:01 29:47 33:16 36:17'),
      확통: timeline(23, '43:03 43:17 43:49 45:02 46:11 47:11 49:48 52:41'),
      미적: timeline(23, '55:30 55:44 56:21 56:47 58:28 59:36 1:04:06 1:07:58'),
      기하: timeline(23, '1:13:48 1:14:02 1:14:36 1:15:29 1:18:30 - 1:20:13 1:24:55'),
    },
  },
  '2023|9모': {
    videoId: '4V6MeB_o9Js',
    title: '2023학년도 9월 모의평가 수학 전 문항 해설',
    timelines: {
      공통: timeline(1, '0:37 0:50 1:09 1:50 2:13 3:03 3:46 4:43 5:44 9:09 10:23 12:09 14:04 17:42 24:52 30:28 30:59 31:33 31:54 33:41 38:34 42:41'),
      확통: timeline(23, '50:17 50:37 51:25 52:45 53:39 55:33 57:55 1:00:06'),
      미적: timeline(23, '1:03:20 1:03:43 1:04:38 1:04:52 1:06:11 1:09:55 1:12:54 1:17:16'),
      기하: timeline(23, '1:21:26 1:21:56 1:22:36 1:23:15 1:24:28 1:26:09 1:29:04 1:34:34'),
    },
  },
  '2023|수능': {
    videoId: 'hnsh2xd2HSM',
    title: '2023학년도 수능 수학 전 문항 해설',
    timelines: {
      공통: timeline(1, '0:12 0:30 0:43 1:23 1:56 2:42 3:20 4:52 5:52 8:14 9:15 11:28 14:46 0:00 16:47 22:41 23:04 23:23 23:57 25:02 27:30 31:38'),
      확통: timeline(23, '37:21 37:35 38:28 39:23 41:24 44:04 46:31 49:21'),
      미적: timeline(23, '55:31 55:54 56:38 57:19 58:34 1:01:23 1:05:02 1:08:59'),
      기하: timeline(23, '1:15:51 1:16:16 1:16:53 1:18:25 1:20:15 1:21:38 1:23:58 1:28:31'),
    },
    overrides: { 공통: { 14: { videoId: 'ePyZAt_sOr0' } } },
  },
  '2022|6모': {
    videoId: 'blRwC0qTRqg',
    title: '2022학년도 6월 모의평가 수학 전 문항 해설',
    timelines: {
      공통: timeline(1, '0:21 0:28 0:48 1:14 1:23 1:53 2:22 3:03 3:41 4:59 6:30 8:16 10:41 13:08 18:22 22:57 23:07 23:29 24:07 24:58 27:05 29:31'),
      확통: timeline(23, '34:03 34:17 34:35 35:23 36:24 38:14 39:56 41:40'),
      미적: timeline(23, '43:07 43:29 44:02 45:22 46:32 47:52 54:36 57:45'),
      기하: timeline(23, '1:01:09 1:01:30 1:01:49 1:02:35 1:03:31 1:06:19 1:08:20 1:12:22'),
    },
  },
  '2022|9모': {
    videoId: 'hE3PsTES8tE',
    title: '2022학년도 9월 모의평가 수학 전 문항 해설',
    timelines: {
      공통: timeline(1, '0:18 0:33 0:46 1:20 1:46 2:42 3:26 4:26 6:01 7:41 9:51 11:56 14:10 17:27 20:37 28:53 29:03 29:28 29:56 30:56 34:51'),
      확통: timeline(23, '38:50 39:00 39:48 40:38 41:46 43:59 47:00 49:58'),
      미적: timeline(23, '53:11 53:26 54:14 55:03 55:52 1:00:44 1:04:32 1:07:50'),
      기하: timeline(23, '1:15:18 1:15:40 1:16:01 1:17:12 1:19:43 1:20:53 1:22:54 1:26:50'),
    },
    overrides: { 공통: { 22: { videoId: 'vowoz3IP8Og' } } },
  },
  '2022|수능': {
    videoId: 'fTJFdn_m4J0',
    title: '2022학년도 수능 수학 전 문항 해설',
    timelines: {
      공통: timeline(1, '0:16 0:35 0:50 1:19 1:31 2:24 4:05 5:01 6:51 8:56 11:47 14:05 16:24 19:01 22:09 25:34 25:48 26:07 26:34 27:19 29:47 32:44'),
      확통: timeline(23, '39:26 39:46 40:09 41:04 43:00 45:26 49:53 52:07'),
      미적: timeline(23, '56:44 57:00 57:24 58:52 1:00:04 1:03:22 1:08:18 1:13:47'),
      기하: timeline(23, '1:19:23 1:19:58 1:20:27 1:20:57 1:23:49 1:25:51 1:30:06 1:36:20'),
    },
  },
};

const legacyVideos: Record<string, { videoId: string; title: string }> = {
  '2021|6모|나형': { videoId: 'OkeJDDHh3UQ', title: '2021학년도 6월 모의평가 수학 나형 전 문항 해설' },
  '2021|9모|가형': { videoId: '7ZTp9t70ups', title: '2021학년도 9월 모의평가 수학 가형 전 문항 해설' },
  '2021|9모|나형': { videoId: 'u16UD1BXwk0', title: '2021학년도 9월 모의평가 수학 나형 전 문항 해설' },
  '2021|수능|가형': { videoId: 'L9fFwHIqIW0', title: '2021학년도 수능 수학 가형 전 문항 해설' },
  '2020|6모|가형': { videoId: '_719gmDDt-I', title: '2020학년도 6월 모의평가 수학 가형 전 문항 해설' },
  '2020|6모|나형': { videoId: 'pCgCcfLJeR4', title: '2020학년도 6월 모의평가 수학 나형 전 문항 해설' },
  '2020|9모|가형': { videoId: '3y27-3Xe0RE', title: '2020학년도 9월 모의평가 수학 가형 전 문항 해설' },
  '2020|9모|나형': { videoId: 'mzaktshHGZ8', title: '2020학년도 9월 모의평가 수학 나형 전 문항 해설' },
  '2020|수능|가형': { videoId: 'tS_9lO_Fprw', title: '2020학년도 수능 수학 가형 전 문항 해설' },
  '2020|수능|나형': { videoId: 'ePuJDCpBzfw', title: '2020학년도 수능 수학 나형 전 문항 해설' },
  '2019|9모|가형': { videoId: 'tygh1hPHd2g', title: '2019학년도 9월 모의평가 수학 가형 전 문항 해설' },
  '2019|9모|나형': { videoId: '5McsnYk5daw', title: '2019학년도 9월 모의평가 수학 나형 전 문항 해설' },
  '2018|6모|가형': { videoId: 'QZ5v27JfXpk', title: '2018학년도 6월 모의평가 수학 가형 전 문항 해설' },
  '2018|6모|나형': { videoId: 'jUUC-7L670k', title: '2018학년도 6월 모의평가 수학 나형 전 문항 해설' },
  '2018|9모|가형': { videoId: 'c_va76x6ef8', title: '2018학년도 9월 모의평가 수학 가형 전 문항 해설' },
  '2017|6모|나형': { videoId: 'M114cciVwew', title: '2017학년도 6월 모의평가 수학 나형 전 문항 해설' },
  '2017|수능|나형': { videoId: 'dxyTgaut8oc', title: '2017학년도 수능 수학 나형 전 문항 해설' },
};

function timeToSeconds(time: string) {
  return time.split(':').reduce((total, part) => total * 60 + Number(part), 0);
}

function getSection(subject: Subject, question?: number | null): OfficialVideoSection | null {
  if (subject === '가형' || subject === '나형') return null;
  if (question && question <= 22) return '공통';
  return subject;
}

export function getOfficialVideoLink(
  year: number,
  session: Session,
  subject: Subject,
  question?: number | null,
): OfficialVideoLink | null {
  const legacyVideo = legacyVideos[`${year}|${session}|${subject}`];
  if (legacyVideo) {
    return {
      href: `https://www.youtube.com/watch?v=${legacyVideo.videoId}`,
      timeLabel: null,
      title: `${legacyVideo.title}${question ? ` · ${question}번` : ''}`,
    };
  }

  const video = videos[`${year}|${session}`];
  const section = getSection(subject, question);
  if (!video || !section) return null;
  const sectionVideo = video.sectionVideos?.[section];
  const targetVideoId = sectionVideo?.videoId ?? video.videoId;
  const targetTitle = sectionVideo?.title ?? video.title;

  if (!question) {
    if (!video.timelines[section] && !sectionVideo && !video.timelines.공통) return null;
    return {
      href: `https://www.youtube.com/watch?v=${targetVideoId}`,
      timeLabel: null,
      title: targetTitle,
    };
  }

  const override = video.overrides?.[section]?.[question];
  const time = override?.time ?? video.timelines[section]?.[question];
  if (!override && !time && !sectionVideo) return null;

  const videoId = override?.videoId ?? targetVideoId;
  const seconds = time ? timeToSeconds(time) : 0;
  return {
    href: `https://www.youtube.com/watch?v=${videoId}${seconds ? `&t=${seconds}s` : ''}`,
    timeLabel: time ?? null,
    title: `${targetTitle} · ${question}번`,
  };
}
