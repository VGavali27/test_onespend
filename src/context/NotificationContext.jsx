import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getNotificationCount, getNotifications } from '@/services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

// How often (ms) to poll the backend for the unread count + feed. Polling (rather than
// SSE) keeps this dependency-free; approved for this no-table, derived feed.
const POLL_INTERVAL = 30000;

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [count, setCount] = useState({ expenses: 0, procurement: 0, payments: 0, total: 0 });
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [countRes, feedRes] = await Promise.all([getNotificationCount(), getNotifications({ limit: 20 })]);
      setCount(countRes.data.data || { expenses: 0, procurement: 0, payments: 0, total: 0 });
      setFeed(feedRes.data.data || []);
    } catch {
      // Non-fatal — leave existing data untouched on failure.
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Initial fetch on login + poll while authenticated.
  useEffect(() => {
    if (!isAuthenticated) {
      setCount({ expenses: 0, procurement: 0, payments: 0, total: 0 });
      setFeed([]);
      return;
    }
    refresh();
    timerRef.current = setInterval(refresh, POLL_INTERVAL);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timerRef.current);
      window.removeEventListener('focus', onFocus);
    };
  }, [isAuthenticated, refresh]);

  return (
    <NotificationContext.Provider value={{ count, feed, loading, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
