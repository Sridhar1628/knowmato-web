export interface GuidanceAction {
  type: string;
  title: string;
  screen?: string;
  agent?: 'KNOWMATO' | 'KNOWMATO_PLUS';
}

type NavigateFunction = (href: string) => void;

const SCREEN_MAP: Record<string, (push: NavigateFunction) => void> = {
  KMP: (push) => push('/student/knowmato-plus/dashboard'),

  Courses: (push) => push('/student/knowmato-plus/courses'),

  MyCourses: (push) => push('/student/knowmato-plus/my-courses'),

  Internships: (push) => push('/student/knowmato-plus/internships'),

  Profile: (push) => push('/student/knowmato-plus/profile'),

  StudentHome: (push) => push('/student/dashboard'),

  MyDoubts: (push) => push('/student/my-doubts'),

  CurrentAffairs: (push) => push('/student/current-affairs'),

  JobOpenings: (push) => push('/student/knowmato-plus/jobs'),

  Tests: (push) => push('/student/knowmato-plus/tests'),

  AssessmentDashboard: (push) => push('/student/knowmato-plus/assessments'),

  CreditsScreen: (push) => push('/student/credits'),

  Leaderboard: (push) => push('/student/leaderboard'),

  Settings: (push) => push('/student/settings'),

  PostDoubt: (push) => push('/student/post-doubt'),

  AgentChat: (push) => push('/student/knowmato-agent'),
};

export const handleAINavigation = (
  action: GuidanceAction,
  push: NavigateFunction,
) => {
  if (action.type !== 'navigate' || !action.screen) {
    return;
  }

  const handler = SCREEN_MAP[action.screen];

  if (!handler) {
    console.warn(`Unknown AI navigation screen: ${action.screen}`);
    return;
  }

  handler(push);
};