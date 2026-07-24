export interface ErrorTranslation {
  title: string;
  message: string;
}

const ERROR_TRANSLATIONS: Record<string, ErrorTranslation> = {
  // ======================================================
  // Authentication
  // ======================================================

  INVALID_CREDENTIALS: {
    title: "Login Failed",
    message: "Incorrect email or password.",
  },

  ACCOUNT_DISABLED: {
    title: "Account Disabled",
    message:
      "Your account has been deactivated. Please contact support.",
  },

  USER_NOT_FOUND: {
    title: "Account Not Found",
    message: "No account was found with this email address.",
  },

  // ======================================================
  // OTP
  // ======================================================

  INVALID_OTP: {
    title: "Invalid OTP",
    message: "The OTP you entered is incorrect.",
  },

  OTP_EXPIRED: {
    title: "OTP Expired",
    message:
      "Your OTP has expired. Please request a new one.",
  },

  OTP_ALREADY_USED: {
    title: "OTP Already Used",
    message:
      "This OTP has already been used.",
  },

  OTP_NOT_FOUND: {
    title: "OTP Not Found",
    message:
      "We couldn't find a valid OTP.",
  },

  OTP_RATE_LIMIT_EXCEEDED: {
    title: "Too Many Requests",
    message:
      "Please wait before requesting another OTP.",
  },

  // ======================================================
  // Validation
  // ======================================================

  VALIDATION_ERROR: {
    title: "Validation Failed",
    message:
      "Please check the highlighted fields.",
  },

  INVALID_BOOLEAN: {
    title: "Invalid Value",
    message:
      "Please enter a valid value.",
  },

  // ======================================================
  // Credits
  // ======================================================

  INSUFFICIENT_CREDITS: {
    title: "Insufficient Credits",
    message:
      "You don't have enough credits to continue.",
  },

  // ======================================================
  // Permission
  // ======================================================

  PERMISSION_DENIED: {
    title: "Access Denied",
    message:
      "You don't have permission to perform this action.",
  },

  INVALID_ROLE: {
    title: "Access Denied",
    message:
      "You don't have permission to perform this action.",
  },

  // ======================================================
  // Resources
  // ======================================================

  RESOURCE_NOT_FOUND: {
    title: "Not Found",
    message:
      "The requested information could not be found.",
  },

  COMPANY_NOT_FOUND: {
    title: "Company Not Found",
    message:
      "The requested company could not be found.",
  },

  TUTOR_NOT_FOUND: {
    title: "Tutor Not Found",
    message:
      "Tutor profile could not be found.",
  },

  // ======================================================
  // Doubts
  // ======================================================

  DOUBT_ALREADY_ACCEPTED: {
    title: "Already Accepted",
    message:
      "Another mentor has already accepted this doubt.",
  },

  // ======================================================
  // Assessment
  // ======================================================

  ASSESSMENT_EXPIRED: {
    title: "Assessment Expired",
    message:
      "This assessment is no longer available.",
  },

  // ======================================================
  // Applications
  // ======================================================

  ALREADY_APPLIED: {
    title: "Already Applied",
    message:
      "You have already applied.",
  },

  USER_ALREADY_EXISTS: {
    title: "Account Already Exists",
    message:
      "An account with this email already exists.",
  },
};

export const getErrorTranslation = (
  code?: string
): ErrorTranslation | undefined => {
  if (!code) {
    return undefined;
  }

  return ERROR_TRANSLATIONS[code];
};