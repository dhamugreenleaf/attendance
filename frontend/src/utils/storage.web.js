const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const saveToken = async (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = async () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = async () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const saveUser = async (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = async () => {
  const user = localStorage.getItem(USER_KEY);
  if (user) {
    try {
      return JSON.parse(user);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const clearAuth = async () => {
  await removeToken();
  localStorage.removeItem(USER_KEY);
};
