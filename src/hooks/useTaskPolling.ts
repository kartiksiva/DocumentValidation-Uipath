import { useEffect, useState, useCallback } from 'react';
import { listPendingTasks, type PendingTask } from '../lib/tasks';

const POLL_INTERVAL_MS = 5000;

export function useTaskPolling() {
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const poll = useCallback(async () => {
    try {
      const pending = await listPendingTasks();
      setTasks(pending);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void poll();
    const timer = setInterval(() => { void poll(); }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [poll]);

  return { tasks, loading, error, refetch: poll };
}
