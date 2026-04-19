import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';

const SESSION_PING_KEY = 'sentio_session_pinged';
const LAST_SEEN_KEY = 'sentio_last_seen_at';

interface SessionPingResponse {
  data: {
    last_seen_at: string | null;
    current_seen_at: string;
    new_insights_count: number;
    new_score_changes_count: number;
  };
}

export function useSessionPing() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.organization_id) return;
    if (sessionStorage.getItem(SESSION_PING_KEY)) return;

    sessionStorage.setItem(SESSION_PING_KEY, '1');

    fetchWithUserJwt<SessionPingResponse>('session-ping', { method: 'POST' })
      .then((res) => {
        if (res.data.last_seen_at) {
          sessionStorage.setItem(LAST_SEEN_KEY, res.data.last_seen_at);
        }
      })
      .catch(() => {});
  }, [user?.organization_id]);
}
