import { apiGet } from './apiService';

export const getProfile = async () => {
    console.log('Calling profile API...');
  return await apiGet('accounts/profile/');
};