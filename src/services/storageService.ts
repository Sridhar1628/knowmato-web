export const saveTokens = (access: string, refresh: string) => {
  localStorage.setItem(
    'tokens',
    JSON.stringify({ access, refresh })
  );
};

export const getTokens = () => {
  const data = localStorage.getItem('tokens');
  return data ? JSON.parse(data) : null;
};

export const clearTokens = () => {
  localStorage.removeItem('tokens');
};