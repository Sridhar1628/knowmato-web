import { apiGet } from './apiService';

export const getProfile = async () => {
    console.log('Calling profile API...');
  return await apiGet('accounts/profile/');
};

export const checkAuthentication = async () => {
  console.log("🔐 Checking authentication...");

  const response = await apiGet("accounts/profile/");

  return response;
};