import axios, { AxiosError } from "axios";

import { getErrorTranslation } from "./errorTranslations";
import { formatValidationError } from "./validationFormatter";
import { getHttpErrorMessage } from "./httpErrorMessages";
import type { AppError } from "./types";

const buildError = (
  partial: Partial<AppError>
): AppError => ({
  success: false,
  status: partial.status ?? 500,
  title: partial.title ?? "Unexpected Error",
  message:
    partial.message ??
    "Something unexpected happened.",
  code: partial.code,
  errors: partial.errors,
  original: partial.original,
});


const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

const formatFieldError = (
  field: string,
  messages: string[]
): string => {
  const msg = messages[0];

  const fieldName = capitalize(
    field.replace(/_/g, " ")
  );

  if (msg.toLowerCase().includes("required")) {
    return `${fieldName} is required.`;
  }

  if (msg.toLowerCase().includes("blank")) {
    return `${fieldName} cannot be empty.`;
  }

  if (msg.toLowerCase().includes("null")) {
    return `${fieldName} cannot be empty.`;
  }

  return `${fieldName}: ${msg}`;
};

export const parseApiError = (
  error: unknown
): AppError => {

  // ==========================================
  // Unknown Error
  // ==========================================

  if (!axios.isAxiosError(error)) {
    return buildError({
      title: "Unexpected Error",
      message:
        "Something unexpected happened. Please try again.",
      original: error,
    });
  }

  const axiosError = error as AxiosError<any>;

  // ==========================================
  // Timeout
  // ==========================================

  if (axiosError.code === "ECONNABORTED") {
    return buildError({
      status: 408,
      title: "Request Timed Out",
      message:
        "The request timed out. Please try again.",
      original: error,
    });
  }

  // ==========================================
  // Request Cancelled
  // ==========================================

  if (axiosError.code === "ERR_CANCELED") {
    return buildError({
      status: 499,
      title: "Request Cancelled",
      message: "The request was cancelled.",
      original: error,
    });
  }

  // ==========================================
  // Network Error
  // ==========================================

  if (!axiosError.response) {
    return buildError({
      status: 0,
      title: "Connection Failed",
      message:
        "Unable to connect. Please check your internet connection.",
      original: error,
    });
  }

  const { data } = axiosError.response;

  const status =
    data?.status ??
    axiosError.response.status;

  // ==========================================
  // Business Exception
  // ==========================================

  if (typeof data?.code === "string") {

    const translation =
      getErrorTranslation(data.code);

    if (translation) {

      return buildError({
        status,
        code: data.code,
        title: translation.title,
        message: translation.message,
        errors: data.errors,
        original: error,
      });

    }

    return buildError({
      status,
      code: data.code,
      title: "Error",
      message:
        data.message ??
        "Something went wrong.",
      errors: data.errors,
      original: error,
    });
  }

  // ==========================================
  // Validation Errors
  // ==========================================

  if (
    data?.errors &&
    typeof data.errors === "object"
  ) {

    const firstField =
      Object.keys(data.errors)[0];

    const formatted =
      formatValidationError(
        firstField,
        data.errors[firstField]
      );

    return buildError({
      status,
      title: formatted.title,
      message: formatted.message,
      errors: data.errors,
      original: error,
    });

  }

  // ==========================================
  // HTTP Status Fallback
  // ==========================================

  const httpError =
    getHttpErrorMessage(status);

  return buildError({
    status,
    title: httpError.title,
    message: httpError.message,
    original: error,
  });

};