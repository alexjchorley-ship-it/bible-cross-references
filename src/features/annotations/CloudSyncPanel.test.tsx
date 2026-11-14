import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CloudSyncPanel } from './CloudSyncPanel.tsx';
import * as auth from './cloud-auth.ts';
import * as sync from './cloud-sync.ts';

vi.mock('./cloud-auth.ts', () => ({
  cloudSession: vi.fn(),
  signInCloud: vi.fn(),
  signOutCloud: vi.fn(),
  signUpCloud: vi.fn(),
}));
vi.mock('./cloud-sync.ts', () => ({
  syncCloudAnnotations: vi.fn(),
}));

const session = {
  access_token: 'token',
  refresh_token: 'refresh',
  expires_at: Date.now() + 3600000,
  user: { id: 'owner', email: 'owner@example.com' },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth.cloudSession).mockReturnValue(null);
  vi.mocked(auth.signInCloud).mockResolvedValue();
  vi.mocked(auth.signUpCloud).mockResolvedValue(false);
  vi.mocked(sync.syncCloudAnnotations).mockResolvedValue();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function fillCredentials() {
  const user = userEvent.setup();
  await user.type(screen.getByRole('textbox', { name: 'Email' }), 'owner@example.com');
  await user.type(screen.getByLabelText('Password'), 'passphrase123');
  return user;
}

describe('cross-device synchronisation notebook panel', () => {
  it('explains local-first storage and offers account actions', () => {
    render(<CloudSyncPanel />);
    expect(screen.getByText(/notes are saved locally first/i)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeDefined();
  });

  it('signs in with the entered credentials and hides the password', async () => {
    render(<CloudSyncPanel />);
    const user = await fillCredentials();
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => {
      expect(auth.signInCloud).toHaveBeenCalledWith('owner@example.com', 'passphrase123');
    });
    expect(screen.getByLabelText<HTMLInputElement>('Password').value).toBe('');
  });

  it('handles confirmation-required signup without pretending a session exists', async () => {
    render(<CloudSyncPanel />);
    const user = await fillCredentials();
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => {
      expect(screen.getByText(/check your email to confirm/i)).toBeDefined();
    });
    expect(auth.signUpCloud).toHaveBeenCalledWith('owner@example.com', 'passphrase123');
  });

  it('shows authentication errors without discarding local notes', async () => {
    vi.mocked(auth.signInCloud).mockRejectedValue(new Error('Incorrect password'));
    render(<CloudSyncPanel />);
    const user = await fillCredentials();
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Incorrect password');
  });

  it('shows logged-in account and allows manual synchronisation', async () => {
    vi.mocked(auth.cloudSession).mockReturnValue(session);
    render(<CloudSyncPanel />);
    expect(screen.getByText(/signed in as owner@example.com/i)).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: 'Sync now' }));
    await waitFor(() => {
      expect(sync.syncCloudAnnotations).toHaveBeenCalled();
      expect(screen.getByText(/all local changes synchronised/i)).toBeDefined();
    });
    expect(screen.getByText(/last synced:/i)).toBeDefined();
  });

  it('shows a failed cloud request as local-only rather than claiming success', async () => {
    vi.mocked(auth.cloudSession).mockReturnValue(session);
    vi.mocked(sync.syncCloudAnnotations).mockRejectedValue(new Error('Database unavailable'));
    render(<CloudSyncPanel />);
    await userEvent.click(screen.getByRole('button', { name: 'Sync now' }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Database unavailable');
    expect(screen.getByText(/changes are still stored locally/i)).toBeDefined();
  });

  it('signs out without deleting browser annotations', async () => {
    vi.mocked(auth.cloudSession).mockReturnValue(session);
    render(<CloudSyncPanel />);
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(auth.signOutCloud).toHaveBeenCalledOnce();
    expect(screen.getByText(/local notes remain on this device/i)).toBeDefined();
  });

  it('retries sync on network availability and changes', async () => {
    vi.mocked(auth.cloudSession).mockReturnValue(session);
    render(<CloudSyncPanel />);
    window.dispatchEvent(new Event('online'));
    window.dispatchEvent(new Event('bible-annotations-changed'));
    await waitFor(
      () => {
        expect(sync.syncCloudAnnotations).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );
  });

  it('can create and immediately sync an account when confirmation is disabled', async () => {
    vi.mocked(auth.signUpCloud).mockImplementation(() => {
      vi.mocked(auth.cloudSession).mockReturnValue(session);
      return Promise.resolve(true);
    });
    render(<CloudSyncPanel />);
    const user = await fillCredentials();
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => {
      expect(auth.signUpCloud).toHaveBeenCalled();
      expect(sync.syncCloudAnnotations).toHaveBeenCalled();
    });
  });

  it('updates the account controls when authentication changes in another tab', async () => {
    render(<CloudSyncPanel />);
    vi.mocked(auth.cloudSession).mockReturnValue(session);
    window.dispatchEvent(new Event('bible-cloud-auth'));
    expect(await screen.findByRole('button', { name: 'Sign out' })).toBeDefined();
    vi.mocked(auth.cloudSession).mockReturnValue(null);
    window.dispatchEvent(new Event('bible-cloud-auth'));
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeDefined();
  });
});
