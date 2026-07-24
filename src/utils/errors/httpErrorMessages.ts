export interface HttpErrorMessage {
  title: string;
  message: string;
}

const HTTP_ERROR_MESSAGES: Record<number, HttpErrorMessage> = {
  400: {
    title: "Invalid Request",
    message: "The request could not be processed.",
  },

  401: {
    title: "Authentication Required",
    message: "Your session has expired. Please log in again.",
  },

  403: {
    title: "Access Denied",
    message: "You don't have permission to perform this action.",
  },

  404: {
    title: "Not Found",
    message: "The requested information could not be found.",
  },

  405: {
    title: "Method Not Allowed",
    message: "This action is not allowed.",
  },

  408: {
    title: "Request Timed Out",
    message: "The request timed out. Please try again.",
  },

  409: {
    title: "Conflict",
    message: "The requested operation conflicts with existing data.",
  },

  413: {
    title: "File Too Large",
    message: "The uploaded file is too large.",
  },

  415: {
    title: "Unsupported File",
    message: "This file format is not supported.",
  },

  422: {
    title: "Validation Failed",
    message: "Please check your input and try again.",
  },

  429: {
    title: "Too Many Requests",
    message: "Please wait a moment before trying again.",
  },

  500: {
    title: "Server Error",
    message: "Something went wrong on our server.",
  },

  502: {
    title: "Service Unavailable",
    message: "Our services are temporarily unavailable.",
  },

  503: {
    title: "Service Unavailable",
    message: "Our services are temporarily unavailable.",
  },

  504: {
    title: "Gateway Timeout",
    message: "The server took too long to respond.",
  },
};

export const getHttpErrorMessage = (
  status: number
): HttpErrorMessage => {
  return (
    HTTP_ERROR_MESSAGES[status] ?? {
      title: "Unexpected Error",
      message: "Something unexpected happened. Please try again.",
    }
  );
};