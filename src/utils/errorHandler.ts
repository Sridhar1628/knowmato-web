export const parseApiError = (error: any): string => {
  if (error?.response?.data) {
    const data = error.response.data;

    // 🔥 Case 1: { field: ["message"] }
    const firstKey = Object.keys(data)[0];

    if (Array.isArray(data[firstKey])) {
      return data[firstKey][0];
    }

    // 🔥 Case 2: { error: "message" }
    if (data.error) {
      return data.error;
    }

    // 🔥 Case 3: plain string
    if (typeof data === "string") {
      return data;
    }
  }

  // fallback
  return "Something went wrong. Please try again.";
};