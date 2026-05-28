import axiosInstance from '../api/axiosInstance';

export const apiGet = async (url: string) => {
  const response = await axiosInstance.get(url);
  return response.data;
};

export const apiPost = async (url: string, data: any) => {
  const response = await axiosInstance.post(url, data);
  return response.data;
};

export const apiPut = async (url: string, data: any) => {
  const response = await axiosInstance.put(url, data);
  return response.data;
};

export const apiDelete = async (url: string) => {
  const response = await axiosInstance.delete(url);
  return response.data;
};

export const apiPatch = async (
  url: string,
  data?: any
) => {

  return axiosInstance.patch(
    url,
    data
  );

};