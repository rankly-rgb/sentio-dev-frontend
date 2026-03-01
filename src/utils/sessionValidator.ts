import { supabase } from '@/lib/supabase';
import { logger } from './productionLogger';

/** Returns true if the session is valid and usable. Refreshes proactively if close to expiry. */
export async function validateSession(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      logger.error('SessionValidator', error ? 'Session check error' : 'No session', error);
      return false;
    }

    const expiresAt = session.expires_at || 0;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - now;

    if (timeUntilExpiry <= 0) {
      logger.error('SessionValidator', 'Session expired');
      return false;
    }

    // Proactively refresh if <5 minutes remaining
    if (timeUntilExpiry < 300) {
      logger.warn('SessionValidator', 'Session expiring soon, refreshing');
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        logger.error('SessionValidator', 'Refresh failed', refreshError);
        return false;
      }
      logger.log('SessionValidator', 'Session refreshed');
    }

    return true;
  } catch (error) {
    logger.error('SessionValidator', 'Validation exception', error);
    return false;
  }
}

/** Validate session and redirect to login if invalid. */
export async function ensureValidSession(): Promise<void> {
  const isValid = await validateSession();
  if (!isValid) {
    logger.error('SessionValidator', 'Session invalid, forcing re-login');
    await supabase.auth.signOut();
    window.location.href = '/login?reason=session_expired';
  }
}
