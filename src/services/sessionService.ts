// services/sessionService.ts
import api from '../api/axiosInstance';
import { apiGet, apiPost, apiPut, apiDelete } from './apiService';

// ==================== Type Definitions ====================

export interface Session {
  session_id: number;
  doubt: string;          // doubt title
  student: string;        // student display name
  tutor: string;          // tutor display name
  status: 'active' | 'completed' | 'cancelled';
  scheduled_time: string; // ISO datetime (started_at)
  price: number;
  started_at?: string;
  ended_at?: string | null;
}

export interface StudentSession {
  session_id: number;
  doubt: string;
  tutor: string;
  status: string;
  price: number;
  started_at: string;
  ended_at: string | null;
}

export interface TutorSession {
  session_id: number;
  doubt: string;
  student: string;
  status: string;
  price: number;
  started_at: string;
  ended_at: string | null;
}

export interface UpdateSessionPayload {
  scheduled_time?: string; // ISO datetime
  price?: number;
}

// ==================== API Methods ====================

/**
 * Get sessions for the currently authenticated user (role‑based)
 * Returns either student or tutor sessions automatically.
 */
export const getMySessions = async (): Promise<Session[]> => {
  const response = await apiGet('sessions/my-sessions/');
  // API returns an array directly: [{ session_id, doubt, student, tutor, status, scheduled_time }]
  return response as Session[];
};

/**
 * Get sessions where current user is the student.
 * Returns detailed session list with price, started_at, ended_at.
 */
export const getStudentSessions = async (): Promise<StudentSession[]> => {
  const response = await api.get('sessions/student/');
  // Response shape: { message: string, data: StudentSession[] }
  return response.data.data;
};

/**
 * Get sessions where current user is the tutor.
 */
export const getTutorSessions = async (): Promise<TutorSession[]> => {
  const response = await api.get('sessions/tutor/');
  return response.data.data;
};

/**
 * End an active session.
 * Only student or tutor who participated can end it.
 */
export const endSession = async (sessionId: number): Promise<{ message: string; session_id: number }> => {
  const response = await apiPost(`sessions/end-session/${sessionId}/`, {});
  return response.data;
};

/**
 * Update an active session (scheduled time or price).
 * Only student or tutor who participated can update.
 */
export const updateSession = async (sessionId: number, data: UpdateSessionPayload): Promise<{ message: string; session_id: number }> => {
  const response = await apiPut(`sessions/update/${sessionId}/`, data);
  return response.data;
};

/**
 * Delete an active session (only if not completed).
 * Only student or tutor who participated can delete.
 */
export const deleteSession = async (sessionId: number): Promise<{ message: string }> => {
  const response = await apiDelete(`sessions/delete/${sessionId}/`);
  return response.data;
};

export const getSessionDetails = async (sessionId: number): Promise<Session> => {
  const response = await apiGet(`sessions/${sessionId}/`);
  return response as Session;
};