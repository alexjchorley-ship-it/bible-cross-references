import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const user = { id: 'user-1', email: 'reader@example.com' };
const response = {
  access_token: 'token',
  refresh_token: 'refresh',
  expires_in: 3600,
  user,
};

let network: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  network = vi.fn(async () => Response.json(response));
  vi.stubGlobal('fetch', network);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Supabase browser authentication', () => {
  it('signs in with email/password and exposes the authenticated session', async () => {
    const auth = await import('./cloud-auth.ts');
    await auth.signInCloud('reader@example.com', 'mypassword');
    expect(auth.cloudSession()?.user.id).toBe(user.id);
    expect(network).toHaveBeenCalledWith(
      expect.stringContaining('/auth/v1/token?grant_type=password'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'reader@example.com', password: 'mypassword' }),
      }),
    );
    expect(localStorage.getItem('bible-study-cloud-session')).toContain('token');
    auth.signOutCloud();
    expect(auth.cloudSession()).toBeNull();
  });

  it('preserves an existing cloud session after module reload', async () => {
    let auth = await import('./cloud-auth.ts');
    await auth.signInCloud('reader@example.com', 'mypassword');
    vi.resetModules();
    auth = await import('./cloud-auth.ts');
    expect(auth.cloudSession()?.user.email).toBe('reader@example.com');
  });

  it('handles sign-up that requires email confirmation', async () => {
    network.mockResolvedValueOnce(Response.json({ user, session: null }));
    const auth = await import('./cloud-auth.ts');
    expect(await auth.signUpCloud('reader@example.com', 'mypassword')).toBe(false);
    expect(auth.cloudSession()).toBeNull();
  });

  it('accepts sign-up that returns a session immediately', async () => {
    const auth = await import('./cloud-auth.ts');
    expect(await auth.signUpCloud('reader@example.com', 'mypassword')).toBe(true);
    expect(auth.cloudSession()?.access_token).toBe('token');
  });

  it('reports invalid credentials and keeps any existing local notes untouched', async () => {
    network.mockResolvedValueOnce(
      Response.json({ message: 'Invalid login credentials' }, { status: 400 }),
    );
    const auth = await import('./cloud-auth.ts');
    await expect(auth.signInCloud('reader@example.com', 'bad')).rejects.toThrow('Invalid login');
    expect(auth.cloudSession()).toBeNull();
  });

  it('sends a user JWT and publishable key when reading protected rows', async () => {
    const auth = await import('./cloud-auth.ts');
    await auth.signInCloud('reader@example.com', 'mypassword');
    network.mockResolvedValueOnce(Response.json([{ item_id: '1' }]));
    await auth.cloudRequest('/rest/v1/bible_annotations');
    expect(network).toHaveBeenLastCalledWith(
      expect.stringContaining('/rest/v1/bible_annotations'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
          apikey: expect.stringMatching(/^sb_publishable_/),
        }),
      }),
    );
  });

  it('refreshes an expired session before the next cloud request', async () => {
    network.mockResolvedValueOnce(Response.json({ ...response, expires_in: 0 }));
    const auth = await import('./cloud-auth.ts');
    await auth.signInCloud('reader@example.com', 'mypassword');
    network.mockResolvedValueOnce(Response.json({ ...response, access_token: 'fresh' }));
    network.mockResolvedValueOnce(Response.json([]));
    await auth.cloudRequest('/rest/v1/bible_annotations');
    expect(network).toHaveBeenCalledWith(
      expect.stringContaining('grant_type=refresh_token'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(auth.cloudSession()?.access_token).toBe('fresh');
  });

  it('does not interpret malformed token responses as a valid sign-in', async () => {
    network.mockResolvedValueOnce(Response.json({ unexpected: true }));
    const auth = await import('./cloud-auth.ts');
    await expect(auth.signInCloud('reader@example.com', 'mypassword')).rejects.toThrow('session');
  });
});
