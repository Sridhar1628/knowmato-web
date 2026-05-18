// services/reviewService.ts
import api from '../api/axiosInstance';
import { apiGet, apiPost, apiPut } from './apiService';

export interface SubmitReviewPayload {
  rating: number;
  feedback?: string;
}

export interface StudentReview {
  review_id: number;
  session_id: number;
  tutor_name: string;
  rating: number;
  feedback: string;
  created_at: string;
}

// ========== API METHODS ==========

/**
 * Submit review after session ends.
 * Endpoint: POST /api/reviews/submit/<session_id>/
 */
export const submitReview = async (sessionId: number, data: SubmitReviewPayload) => {
  const response = await apiPost(`reviews/submit/${sessionId}/`, data);
  return response.data;
};

/**
 * Get all reviews written by the student.
 * Endpoint: GET /api/reviews/reviews/student/
 */
export const getMyReviews = async (): Promise<StudentReview[]> => {
  const response = await apiGet('reviews/student/');
  return response.data; // ✅ correct
};

/**
 * Update an existing review.
 * Endpoint: PUT /api/reviews/reviews/update/<review_id>/
 */
export const updateReview = async (reviewId: number, data: Partial<SubmitReviewPayload>) => {
  const response = await apiPut(`reviews/update/${reviewId}/`, data);
  return response.data;
};

/**
 * Get all reviews received by the tutor.
 * Endpoint: GET /api/reviews/reviews/tutor/
 */
export const getTutorReviews = async () => {
  const response = await apiGet('reviews/tutor/');
  return response.data;
};

/**
 * Get tutor rating summary.
 * Endpoint: GET /api/reviews/reviews/tutor/summary/
 */
export const getTutorRatingSummary = async () => {
  const response = await apiGet('reviews/tutor/summary/');
  return response.data;
};