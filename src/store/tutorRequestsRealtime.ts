import {
  tutorRequestsCache,
  TutorRequest,
} from "./tutorRequestsCache";

type Listener = () => void;

const listeners = new Set<Listener>();

// ------------------------------------------------
// Subscribe
// ------------------------------------------------

export const subscribeTutorRequests = (
  listener: Listener
) => {

  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    };

};

// ------------------------------------------------
// Notify
// ------------------------------------------------

export const notifyTutorRequests = () => {

  listeners.forEach(listener => listener());

};

// ------------------------------------------------
// Replace Entire List
// ------------------------------------------------

export const setTutorRequests = (
  requests: TutorRequest[]
) => {

  tutorRequestsCache.requests = requests;

  tutorRequestsCache.loaded = true;

  tutorRequestsCache.loading = false;

  notifyTutorRequests();

};

// ------------------------------------------------
// Add New Request
// ------------------------------------------------

export const addTutorRequest = (
  request: TutorRequest
) => {

  const exists =
    tutorRequestsCache.requests.find(
      r => r.request_id === request.request_id
    );

  if (exists) return;

  tutorRequestsCache.requests = [

    request,

    ...tutorRequestsCache.requests,

  ];

  notifyTutorRequests();

};

// ------------------------------------------------
// Update Request
// ------------------------------------------------

export const updateTutorRequest = (
  request: TutorRequest
) => {

  tutorRequestsCache.requests =
    tutorRequestsCache.requests.map(r =>

      r.request_id === request.request_id

        ? {
            ...r,
            ...request,
          }

        : r

    );

  notifyTutorRequests();

};

// ------------------------------------------------
// Remove Request
// ------------------------------------------------

export const removeTutorRequest = (
  requestId: number
) => {

  tutorRequestsCache.requests =
    tutorRequestsCache.requests.filter(

      r => r.request_id !== requestId

    );

  notifyTutorRequests();

};

// ------------------------------------------------
// Clear Cache
// ------------------------------------------------

export const clearTutorRequests = () => {

  tutorRequestsCache.requests = [];

  tutorRequestsCache.loaded = false;

  tutorRequestsCache.loading = false;

  notifyTutorRequests();

};

// ------------------------------------------------
// Loading State
// ------------------------------------------------

export const setTutorRequestsLoading = (
  loading: boolean
) => {

  tutorRequestsCache.loading = loading;

  notifyTutorRequests();

};

// ------------------------------------------------
// Getter
// ------------------------------------------------

export const getTutorRequests = () => {

  return tutorRequestsCache.requests;

};

// ------------------------------------------------
// Loaded?
// ------------------------------------------------

export const hasTutorRequestsLoaded = () => {

  return tutorRequestsCache.loaded;

};