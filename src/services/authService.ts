import { apiPost } from './apiService';

export interface RegisterData {
  email: string;
  phone: string;
  password: string;
  role: 'student' | 'tutor';
}

export interface VerifyRegisterData {
  identifier: string;    // email or phone
  email_otp: string;
  phone_otp: string;
}

export const loginWithOtp = async (data: {
  identifier: string;
  password?: string; // ✅ FIX
}) => {
  return await apiPost('accounts/login/', data);
};

export const verifyOtpLogin = async (data: {
  identifier: string;
  otp: string;
}) => {
  return await apiPost('accounts/verify-login/', data);
};

export const resendOtp = async (data: { identifier: string }) => {
  return await apiPost('accounts/resend-otp/', data);
};

export const registerUser = (data: RegisterData) =>
  apiPost('accounts/register/', data);

export const verifyRegisterOtp = (data: VerifyRegisterData) =>
  apiPost('accounts/verify-register/', data);