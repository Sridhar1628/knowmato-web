import { parseApiError } from "@/utils/errors/apiErrorParser.ts";

export const showApiError = (
  error: unknown
) => {
  const parsed = parseApiError(error);

  if (typeof window !== "undefined") {
    alert(`${parsed.title}\n${parsed.message}`);
  }

  return parsed;
};