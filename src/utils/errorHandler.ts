import axios, { AxiosError } from "axios";
import { translateBackendMessage } from "./errorMessages";

export interface AppError {
  success: false;
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  original?: any;
}

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
  // --------------------------------------------------
  // Unknown JS Error
  // --------------------------------------------------
  if (!axios.isAxiosError(error)) {
    return {
      success: false,
      status: 500,
      message:
        "Something went wrong. Please try again.",
      original: error,
    };
  }

  const axiosError = error as AxiosError<any>;

  // --------------------------------------------------
  // Timeout
  // --------------------------------------------------
  if (axiosError.code === "ECONNABORTED") {
    return {
      success: false,
      status: 408,
      message:
        "The request timed out. Please try again.",
      original: error,
    };
  }

  // --------------------------------------------------
  // Cancelled
  // --------------------------------------------------
  if (axiosError.code === "ERR_CANCELED") {
    return {
      success: false,
      status: 499,
      message: "Request cancelled.",
      original: error,
    };
  }

  // --------------------------------------------------
  // Network Error
  // --------------------------------------------------
  if (!axiosError.response) {
    return {
      success: false,
      status: 0,
      message:
        "Unable to connect. Please check your internet connection.",
      original: error,
    };
  }

  const { status, data } = axiosError.response;

  // --------------------------------------------------
  // Backend already returned a message
  // --------------------------------------------------
  if (
    typeof data?.message === "string" &&
    data.message.trim() !== ""
  ) {
    return {
      success: false,
      status,
      message: translateBackendMessage(data.message),
      original: error,
    };
  }

  // --------------------------------------------------
  // Django detail
  // --------------------------------------------------
  if (typeof data?.detail === "string") {
    return {
      success: false,
      status,
      message: translateBackendMessage(data.detail),
      original: error,
    };
  }

  // --------------------------------------------------
  // non_field_errors
  // --------------------------------------------------
  if (
    Array.isArray(data?.non_field_errors)
  ) {
    return {
      success: false,
      status,
      message: translateBackendMessage(data.non_field_errors[0]),
      original: error,
    };
  }

  // --------------------------------------------------
  // Django serializer validation
  // --------------------------------------------------
  if (
    data &&
    typeof data === "object"
  ) {
    for (const key of Object.keys(data)) {
      if (
        Array.isArray(data[key])
      ) {
        return {
          success: false,
          status,
          message: formatFieldError(
            key,
            data[key]
          ),
          errors: data,
          original: error,
        };
      }
    }
  }

  // --------------------------------------------------
  // Status code fallback
  // --------------------------------------------------
  switch (status) {
    case 400:
      return {
        success: false,
        status,
        message:
          "The request could not be processed.",
      };

    case 401:
      return {
        success: false,
        status,
        message:
          "Your session has expired. Please log in again.",
      };

    case 403:
      return {
        success: false,
        status,
        message:
          "You don't have permission to perform this action.",
      };

    case 404:
      return {
        success: false,
        status,
        message:
          "The requested resource could not be found.",
      };

    case 405:
      return {
        success: false,
        status,
        message:
          "This action is not allowed.",
      };

    case 408:
      return {
        success: false,
        status,
        message:
          "The request timed out. Please try again.",
      };

    case 409:
      return {
        success: false,
        status,
        message:
          "This resource already exists.",
      };

    case 413:
      return {
        success: false,
        status,
        message:
          "The uploaded file is too large.",
      };

    case 415:
      return {
        success: false,
        status,
        message:
          "Unsupported file format.",
      };

    case 422:
      return {
        success: false,
        status,
        message:
          "Validation failed. Please check your input.",
      };

    case 429:
      return {
        success: false,
        status,
        message:
          "Too many requests. Please wait a moment and try again.",
      };

    case 500:
      return {
        success: false,
        status,
        message:
          "Something went wrong on our server.",
      };

    case 502:
    case 503:
    case 504:
      return {
        success: false,
        status,
        message:
          "Our services are temporarily unavailable. Please try again later.",
      };

    default:
      return {
        success: false,
        status,
        message:
          "Something went wrong.",
      };
  }
};