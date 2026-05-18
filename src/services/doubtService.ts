// services/doubtService.ts
import { apiPost, apiGet } from './apiService';
import api from '../api/axiosInstance';

export interface CreateDoubtPayload {
  title: string;
  description: string;
  category: string;
  mode: 'pool' | 'specific';
  preferred_explanation?: 'text' | 'audio' | 'video';
}

export const createDoubt = async (data: CreateDoubtPayload) => {
  return await apiPost('doubts/create/', data);
};

// ✅ Accept query parameters for filtering
// services/doubtService.ts
export const getMyDoubts = async (params?: { mode?: string; status?: string; type?: string }) => {
  try {
    const response = await api.get('/doubts/my-doubts/', { params });
    
    // Safe extraction – always return an array
    const doubtsArray = response.data?.results?.data;
    
    if (Array.isArray(doubtsArray)) {
      return doubtsArray;
    }
    
    console.warn('API did not return an array:', response.data);
    return [];
  } catch (error) {
    console.error('Error in getMyDoubts:', error);
    return []; // Return empty array on error
  }
};

export const getAvailableDoubts = async () => {
  return await apiGet('bids/available-doubts/');
};

export const respondToRequest = async (
  requestId: number,
  data: { action: 'accept' | 'reject'; price?: number; scheduled_time?: string }
) => {
  return await apiPost(`doubts/respond-request/${requestId}/`, data);
};

export const getTutorRequests = async () => {
  const response = await apiGet('doubts/tutor-requests/');
  console.log("🔥 FULL RESPONSE:", response.data);
  return response.data;  // ✅ FIX
};

export const sendDirectRequest = async (data: { doubt: number; tutor: number }) => {
  return await apiPost('doubts/send-request/', data);
};


export const getDoubtDetails = async (doubtId: number) => {
  const response = await api.get(`/doubts/${doubtId}/`);
  return response.data;
};

export const getTutorDoubtDetails = async (doubtId: number) => {
  const response = await api.get(`/doubts/tutor-doubt/${doubtId}/`);
  return response.data;
};

export const rejectDirectRequest = async (requestId: number) => {
  return await apiPost(`doubts/reject-request/${requestId}/`, {});
};

export const acceptDirectRequest = async (requestId: number, price: number, scheduled_time: string) => {
  return await apiPost(`doubts/accept-request/${requestId}/`, { price, scheduled_time });
};  

export const getFixedPriceDoubts = async () => {
  try {
    const response = await api.get('/doubts/fixed-price-doubts/');
    // Response is an array directly
    if (Array.isArray(response.data)) {
      return response.data;
    }
    console.warn('Fixed price doubts API did not return an array:', response.data);
    return [];
  } catch (error) {
    console.error('Error fetching fixed price doubts:', error);
    return [];
  }
};