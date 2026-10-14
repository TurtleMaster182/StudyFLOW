import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { localDate } from '../domain/study';

/** Refresh tomorrow's plan after midnight and when returning from the background. */
export function useToday(): Date {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const refresh = () =>
      setToday((previous) => {
        const now = new Date();
        return localDate(previous) === localDate(now) ? previous : now;
      });
    const timer = setInterval(refresh, 30_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);
  return today;
}
