import axiosInstance from '../api/axiosInstance';

export const apiGet = async (url: string) => {
  try {
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error: any) {
    console.log('GET Error:', error?.response?.data || error.message);
    throw error;
  }
};

export const apiPost = async (url: string, data: any) => {
  try {
    const res = await axiosInstance.post(url, data);
    return res.data;
  } catch (error: any) {
    console.log('POST Error:', error?.response?.data || error.message);
    throw error;
  }
};