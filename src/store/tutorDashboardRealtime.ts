import {
  tutorDashboardCache,
  DashboardStats,
  PendingRequest,
  ActiveSession,
} from "./tutorDashboardCache";

type Listener = () => void;

const listeners = new Set<Listener>();

// =======================================================
// Subscribe
// =======================================================

export const subscribeTutorDashboard = (
  listener: Listener
) => {

  listeners.add(listener);

  return () => {

    listeners.delete(listener);

  };

};

// =======================================================
// Notify
// =======================================================

export const notifyTutorDashboard = () => {

  listeners.forEach(
    listener => listener()
  );

};

// =======================================================
// Replace Entire Dashboard
// =======================================================

export const setTutorDashboard = (

  stats: DashboardStats,

  pendingRequests: PendingRequest[],

  activeSessions: ActiveSession[]

) => {

  tutorDashboardCache.stats = stats;

  tutorDashboardCache.pendingRequests =
    pendingRequests;

  tutorDashboardCache.activeSessions =
    activeSessions;

  tutorDashboardCache.initialized = true;

  notifyTutorDashboard();

};

// =======================================================
// Wallet Update
// =======================================================

export const updateTutorWallet = (
  balance: number
) => {

  tutorDashboardCache.stats = {

    ...tutorDashboardCache.stats,

    walletBalance: balance,

  };

  notifyTutorDashboard();

};

// =======================================================
// Pending Requests
// =======================================================

export const updatePendingRequests = (
  requests: PendingRequest[]
) => {

  tutorDashboardCache.pendingRequests =
    requests;

  notifyTutorDashboard();

};

// =======================================================
// Active Sessions
// =======================================================

export const updateActiveSessions = (
  sessions: ActiveSession[]
) => {

  tutorDashboardCache.activeSessions =
    sessions;

  notifyTutorDashboard();

};

// =======================================================
// Clear Cache
// =======================================================

export const clearTutorDashboard = () => {

  tutorDashboardCache.stats = {

    totalSessions: 0,

    completedSessions: 0,

    totalEarnings: 0,

    walletBalance: 0,

  };

  tutorDashboardCache.pendingRequests = [];

  tutorDashboardCache.activeSessions = [];

  tutorDashboardCache.initialized = false;

  notifyTutorDashboard();

};