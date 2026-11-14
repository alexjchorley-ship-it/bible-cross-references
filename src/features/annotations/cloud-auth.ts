/** Only the public, browser-safe Supabase project URL and publishable key. */
export const CLOUD_URL = 'https://nbgneowrbdwcqdrofwuw.supabase.co';
export const CLOUD_PUBLISHABLE_KEY = 'sb_publishable_Ix_Q30JYUcFYdwNshYehcw_xk6RpEP8';

export interface CloudSession {
  readonly access_token: string;
  readonly refresh_token: string;
  readonly expires_at: number;
  readonly user: { readonly id: string; readonly email?: string };
}

const SESSION_KEY = 'bible-study-cloud-session';
let session: CloudSession | null = readSession();
let refreshPromise: Promise<CloudSession> | null = null;

function readSession(): CloudSession | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== 'object' || !parsed) return null;
    const value = parsed as Partial<CloudSession>;
    return typeof value.access_token === 'string' &&
      typeof value.refresh_token === 'string' &&
      typeof value.expires_at === 'number' &&
      typeof value.user?.id === 'string'
      ? (value as CloudSession)
      : null;
  } catch {
    return null;
  }
}

export function cloudSession(): CloudSession | null {
  return session;
}

function saveSession(value: CloudSession | null): void {
  session = value;
  try {
    if (value) localStorage.setItem(SESSION_KEY, JSON.stringify(value));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // If browser storage is blocked, the session remains usable until reload.
  }
  window.dispatchEvent(new Event('bible-cloud-auth'));
}

function errorText(value: unknown, fallback: string): string {
  if (value && typeof value === 'object' && 'msg' in value &&
      typeof value.msg === 'string') return value.msg;
  if (value && typeof value === 'object' && 'message' in value &&
      typeof value.message === 'string') return value.message;
  if (value && typeof value === 'object' && 'error_description' in value &&
      typeof value.error_description === 'string') return value.error_description;
  return fallback;
}

async function request(path: string, init: RequestInit = {}, accessToken?: string): Promise<unknown> {
  const response = await fetch(`${CLOUD_URL}${path}`, {
    ...init,
    headers: {
      apikey: CLOUD_PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(errorText(result, `Cloud request failed (${response.status}).`));
  }
  return result;
}

function parseSession(value: unknown): CloudSession | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  const user = data['user'];
  if (typeof data['access_token'] !== 'string' ||
      typeof data['refresh_token'] !== 'string' ||
      typeof data['expires_in'] !== 'number' ||
      !user || typeof user !== 'object' ||
      typeof (user as { id?: unknown }).id !== 'string') return null;
  return {
    access_token: data['access_token'],
    refresh_token: data['refresh_token'],
    expires_at: Date.now() + data['expires_in'] * 1000,
    user: user as CloudSession['user'],
  };
}

/** Password sign-in avoids magic-link redirects to the wrong PWA origin. */
export async function signInCloud(email: string, password: string): Promise<void> {
  const result = await request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const signedIn = parseSession(result);
  if (!signedIn) throw new Error('Supabase did not return a sign-in session.');
  saveSession(signedIn);
}

export async function signUpCloud(email: string, password: string): Promise<boolean> {
  const result = await request('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const signedIn = parseSession(result);
  if (signedIn) saveSession(signedIn);
  return signedIn !== null;
}

export function signOutCloud(): void {
  saveSession(null);
}

async function refreshedSession(): Promise<CloudSession> {
  if (!session) throw new Error('Sign in to synchronise annotations.');
  if (session.expires_at > Date.now() + 60000) return session;
  refreshPromise ??= (async () => {
    const current = session;
    const response = await request('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: current.refresh_token }),
    });
    const renewed = parseSession(response);
    if (!renewed) throw new Error('Your cloud session has expired. Sign in again.');
    saveSession(renewed);
    return renewed;
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

export async function cloudRequest(path: string, init: RequestInit = {}): Promise<unknown> {
  const current = await refreshedSession();
  return request(path, init, current.access_token);
}
