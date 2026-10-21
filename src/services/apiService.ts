import axiosInstance from '../api/axiosInstance';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

export const apiGet = async (
  url: string,
  config?: AxiosRequestConfig
) => {
  const response = await axiosInstance.get(url, config);
  return response.data;
};

export const apiPost = async (
  url: string,
  data: any,
  config?: AxiosRequestConfig
) => {
  const response = await axiosInstance.post(
    url,
    data,
    config
  );

  return response.data;
};

export const apiPut = async (
  url: string,
  data: any,
  config?: AxiosRequestConfig
) => {
  const response = await axiosInstance.put(
    url,
    data,
    config
  );

  return response.data;
};

export const apiDelete = async (
  url: string,
  data?: any,
  config?: AxiosRequestConfig
) => {
  const response = await axiosInstance.delete(url, {
    ...config,
    data,
  });

  return response.data;
};

export const apiPatch = async (
  url: string,
  data?: any,
  config?: AxiosRequestConfig
) => {
  const response = await axiosInstance.patch(
    url,
    data,
    config
  );

  return response.data;
};
