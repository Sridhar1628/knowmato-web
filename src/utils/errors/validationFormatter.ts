const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

const formatFieldName = (field: string): string =>
  capitalize(field.replace(/_/g, " "));

export const formatValidationError = (
  field: string,
  messages: string[]
): {
  title: string;
  message: string;
} => {
  const fieldName = formatFieldName(field);

  const rawMessage = messages[0]?.toLowerCase() ?? "";

  // Required
  if (rawMessage.includes("required")) {
    return {
      title: `${fieldName} Required`,
      message: `Please enter your ${fieldName.toLowerCase()}.`,
    };
  }

  // Blank
  if (rawMessage.includes("blank")) {
    return {
      title: `${fieldName} Required`,
      message: `Please enter your ${fieldName.toLowerCase()}.`,
    };
  }

  // Null
  if (rawMessage.includes("null")) {
    return {
      title: `${fieldName} Required`,
      message: `Please enter your ${fieldName.toLowerCase()}.`,
    };
  }

  // Invalid email
  if (rawMessage.includes("valid email")) {
    return {
      title: "Invalid Email",
      message: "Please enter a valid email address.",
    };
  }

  // Invalid choice
  if (rawMessage.includes("valid choice")) {
    return {
      title: `Invalid ${fieldName}`,
      message: `Please select a valid ${fieldName.toLowerCase()}.`,
    };
  }

  // Already exists
  if (
    rawMessage.includes("already exists") ||
    rawMessage.includes("unique")
  ) {
    return {
      title: `${fieldName} Already Exists`,
      message: `This ${fieldName.toLowerCase()} is already in use.`,
    };
  }

  // Too short
  if (
    rawMessage.includes("at least") ||
    rawMessage.includes("min_length")
  ) {
    return {
      title: `${fieldName} Too Short`,
      message: messages[0],
    };
  }

  // Too long
  if (
    rawMessage.includes("max_length") ||
    rawMessage.includes("ensure this field has no more than")
  ) {
    return {
      title: `${fieldName} Too Long`,
      message: messages[0],
    };
  }

  // Invalid
  if (rawMessage.includes("invalid")) {
    return {
      title: `Invalid ${fieldName}`,
      message: messages[0],
    };
  }

  return {
    title: fieldName,
    message: messages[0],
  };
};