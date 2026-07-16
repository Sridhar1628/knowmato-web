const MESSAGE_MAP: Record<string, string> = {
  // --------------------------
  // Authentication
  // --------------------------
  "Authentication credentials were not provided.":
    "Please log in to continue.",

  "No active account found with the given credentials":
    "Incorrect email or password.",

  "Unable to log in with provided credentials.":
    "Incorrect email or password.",

  "Given token not valid for any token type":
    "Your session has expired. Please log in again.",

  "Token is invalid or expired":
    "Your session has expired. Please log in again.",

  "Token has expired":
    "Your session has expired. Please log in again.",

  "Token is blacklisted":
    "Your session has expired. Please log in again.",

  "User is inactive":
    "Your account has been deactivated. Please contact support.",

  "Invalid token.":
    "Your session has expired. Please log in again.",

  "Invalid credentials":
    "Incorrect email or password.",

  // --------------------------
  // OTP
  // --------------------------

  "Invalid OTP":
    "The OTP you entered is incorrect.",

  "OTP expired":
    "Your OTP has expired. Please request a new one.",

  "OTP already verified":
    "This OTP has already been used.",

  // --------------------------
  // Permission
  // --------------------------

  "Permission denied.":
    "You don't have permission to perform this action.",

  // --------------------------
  // File Upload
  // --------------------------

  "Invalid file":
    "Please upload a valid file.",

  "Unsupported file type":
    "This file type is not supported.",

  // --------------------------
  // Generic
  // --------------------------

  "Not found.":
    "The requested information could not be found.",

  "Method not allowed.":
    "This action is not allowed.",

  "Internal Server Error":
    "Something went wrong on our server.",

  "Server Error":
    "Something went wrong on our server.",
};

export const translateBackendMessage = (
  message: string
): string => {
  return MESSAGE_MAP[message] || message;
};