import { apiGet } from './apiService';

export const getTutors = async () => {
    console.log('Calling tutors API...');
  return await apiGet('accounts/tutors/available/');
};