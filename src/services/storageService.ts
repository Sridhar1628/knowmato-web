export interface StoredTokens {
  access: string;
  refresh: string;
}

const TOKEN_STORAGE_KEY = 'tokens';

export const saveTokens = (
  access: string,
  refresh: string
): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const tokens: StoredTokens = {
    access,
    refresh,
  };

  // --------------------------------------------
  // LocalStorage
  // --------------------------------------------

  localStorage.setItem(
    TOKEN_STORAGE_KEY,
    JSON.stringify(tokens)
  );

  // --------------------------------------------
  // Cookies
  // Used by Next.js middleware
  // --------------------------------------------

  document.cookie =
    `accessToken=${encodeURIComponent(access)}; ` +
    `path=/; ` +
    `max-age=604800; ` +
    `SameSite=Lax`;

  document.cookie =
    `refreshToken=${encodeURIComponent(refresh)}; ` +
    `path=/; ` +
    `max-age=2592000; ` +
    `SameSite=Lax`;
};

export const getTokens = (): StoredTokens | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const data =
    localStorage.getItem(TOKEN_STORAGE_KEY);

  if (!data) {
    return null;
  }

  try {
    const parsed = JSON.parse(data);

    if (
      !parsed ||
      typeof parsed.access !== 'string' ||
      typeof parsed.refresh !== 'string'
    ) {
      return null;
    }

    return {
      access: parsed.access,
      refresh: parsed.refresh,
    };
  } catch (error) {
    console.error(
      'Failed to parse stored tokens:',
      error
    );

    return null;
  }
};

export const clearTokens = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(
    TOKEN_STORAGE_KEY
  );

  // Clear access cookie
  document.cookie =
    'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';

  // Clear refresh cookie
  document.cookie =
    'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
};