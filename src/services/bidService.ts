// src/services/bidService.ts
import { apiPost } from './apiService';
import { apiGet } from './apiService';

export const placeBid = async (data: any) => {
  return await apiPost('bids/place-bid/', data);
};

export const getBids = async (doubtId: number) => {
  return await apiGet(`bids/view-bids/${doubtId}/`);
};

export const selectBid = async (bidId: number) => {
  return await apiPost(`bids/select-bid/${bidId}/`, {});
};

export const counterBid = (bidId: number, counter_price: number) => {
  return apiPost(`bids/counter/${bidId}/`, { counter_price });
};

export const updateBid = (bidId: number, price: number) => {
  return apiPost(`bids/update/${bidId}/`, { price });
};

export const rejectBid = (bidId: number) => {
  return apiPost(`bids/reject/${bidId}/`, {});
};

export const getMyBidDoubts = async () => {
  const response = await apiGet('/bids/my-bid-doubts/');
  return response.data;
};

export const convertToPool = async (doubtId: number, fixed_price: number) => {
  return await apiPost(`doubts/convert-to-pool/${doubtId}/`, {
    fixed_price
  });
};

export const counterDirectRequest = async (requestId: number, price: number) => {
  return await apiPost(`doubts/counter-request/${requestId}/`, {
    price
  });
};