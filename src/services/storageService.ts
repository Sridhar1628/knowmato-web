export const saveTokens = (access: string, refresh: string) => {
  // Save in localStorage (existing behavior)
  localStorage.setItem(
    "tokens",
    JSON.stringify({ access, refresh })
  );

  // Save access token in a cookie for Next.js middleware
  document.cookie = `accessToken=${access}; path=/; max-age=86400; SameSite=Lax`;

  // Save refresh token as well (optional, useful later)
  document.cookie = `refreshToken=${refresh}; path=/; max-age=604800; SameSite=Lax`;
};

export const getTokens = () => {
  const data = localStorage.getItem("tokens");
  return data ? JSON.parse(data) : null;
};

export const clearTokens = () => {
  // Clear localStorage
  localStorage.removeItem("tokens");

  // Clear cookies
  document.cookie =
    "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie =
    "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
};