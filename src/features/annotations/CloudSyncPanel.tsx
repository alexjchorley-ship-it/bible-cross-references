import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cloudSession,
  signInCloud,
  signOutCloud,
  signUpCloud,
  type CloudSession,
} from './cloud-auth.ts';
import { syncCloudAnnotations } from './cloud-sync.ts';
import styles from './annotations.module.css';

export function CloudSyncPanel() {
  const [session, setSession] = useState<CloudSession | null>(cloudSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [lastSynced, setLastSynced] = useState('');
  const running = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSync = useCallback(async () => {
    if (!cloudSession() || running.current || !navigator.onLine) return;
    running.current = true;
    setStatus('Synchronising notes and highlights…');
    try {
      await syncCloudAnnotations();
      setLastSynced(new Date().toLocaleTimeString());
      setError('');
      setStatus('All local changes synchronised.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to reach cloud storage.');
      setStatus('Your changes are still stored locally.');
    } finally {
      running.current = false;
    }
  }, []);

  useEffect(() => {
    const onSession = () => {
      setSession(cloudSession());
    };
    const schedule = () => {
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = setTimeout(() => { void runSync(); }, 750);
    };
    window.addEventListener('bible-cloud-auth', onSession);
    window.addEventListener('bible-annotations-changed', schedule);
    window.addEventListener('online', schedule);
    const interval = window.setInterval(schedule, 30000);
    schedule();
    return () => {
      window.removeEventListener('bible-cloud-auth', onSession);
      window.removeEventListener('bible-annotations-changed', schedule);
      window.removeEventListener('online', schedule);
      window.clearInterval(interval);
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, [runSync, session]);

  async function authenticate(create: boolean): Promise<void> {
    if (busy) return;
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (create) {
        const signedIn = await signUpCloud(email.trim(), password);
        if (!signedIn) {
          setStatus('Check your email to confirm your account, then sign in.');
        } else {
          setStatus('Account created. Starting sync.');
          void runSync();
        }
      } else {
        await signInCloud(email.trim(), password);
        setStatus('Signed in. Starting sync.');
        void runSync();
      }
      setPassword('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.section} aria-label="Cross-device synchronisation">
      <h3>Sync across devices</h3>
      <p className={styles.warning}>
        Bible notes are saved locally first. Sign in with the same account on
        your phone and computer to synchronise them automatically when online.
      </p>
      {session ? (
        <div className={styles.toolbar}>
          <span>Signed in{session.user.email ? ` as ${session.user.email}` : ''}</span>
          <button
            type="button"
            className={styles.button}
            onClick={() => { void runSync(); }}
          >
            Sync now
          </button>
          <button
            type="button"
            className={styles.smallButton}
            onClick={() => {
              signOutCloud();
              setStatus('Signed out. Local notes remain on this device.');
              setLastSynced('');
            }}
          >
            Sign out
          </button>
        </div>
      ) : (
        <form
          className={styles.notes}
          onSubmit={(event) => {
            event.preventDefault();
            void authenticate(false);
          }}
        >
          <label>
            Email
            <input
              className={styles.search}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value); }}
            />
          </label>
          <label>
            Password
            <input
              className={styles.search}
              type="password"
              minLength={6}
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => { setPassword(event.target.value); }}
            />
          </label>
          <div className={styles.toolbar}>
            <button type="submit" disabled={busy} className={styles.button}>
              Sign in
            </button>
            <button
              type="button"
              disabled={busy || !email.includes('@') || password.length < 6}
              className={styles.button}
              onClick={() => { void authenticate(true); }}
            >
              Create account
            </button>
          </div>
        </form>
      )}
      {status && <p role="status">{status}</p>}
      {lastSynced && <p className={styles.warning}>Last synced: {lastSynced}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
