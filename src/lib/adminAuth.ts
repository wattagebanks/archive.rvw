const SESSION_KEY = "rvw-admin-authenticated";

function expectedPassword(): string {
  const fromEnv = import.meta.env.VITE_ADMIN_PASSWORD?.trim();
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return "archive";
  return "";
}

export function isAdminPasswordConfigured(): boolean {
  return expectedPassword().length > 0;
}

export function isAdminAuthenticated(): boolean {
  if (!isAdminPasswordConfigured()) return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function authenticateAdmin(password: string): boolean {
  const expected = expectedPassword();
  if (!expected || password !== expected) return false;
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    return false;
  }
  return true;
}

export function clearAdminSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
