export const POST_LOGIN_REDIRECT_KEY = 'postLoginRedirect';

export const saveRedirectAfterLogin = (path: string) => {
  sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, path);
};

export const getAndClearRedirectAfterLogin = (): string | null => {
  const saved = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
  if (saved) {
    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    return saved;
  }
  return null;
};
