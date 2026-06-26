export interface DashboardStats {

  totalSessions: number;

  completedSessions: number;

  totalEarnings: number;

  walletBalance: number;

}

export interface ActiveSession {

  session_id: number;

  doubt_id: number;

  title: string;

  student_name: string | null;

  session_type: string;

  status: string;

  started_at: string | null;

}

export interface PendingRequest {

  request_id: number;

  doubt_id: number;

  title: string;

  student_name: string;

  price: string;

}

export const tutorDashboardCache = {

  stats: {

    totalSessions: 0,

    completedSessions: 0,

    totalEarnings: 0,

    walletBalance: 0,

  } as DashboardStats,

  pendingRequests: [] as PendingRequest[],

  activeSessions: [] as ActiveSession[],

  initialized: false,

};