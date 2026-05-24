import { useEffect, useState, useCallback } from 'react';
import { listPendingTasks } from '../lib/tasks';
const POLL_INTERVAL_MS = 5000;
export function useTaskPolling() {
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState(null);
    const poll = useCallback(async () => {
        try {
            const pending = await listPendingTasks();
            setTasks(pending);
            setError(null);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to fetch tasks');
        }
    }, []);
    useEffect(() => {
        void poll();
        const timer = setInterval(() => { void poll(); }, POLL_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [poll]);
    return { tasks, error, refetch: poll };
}
//# sourceMappingURL=useTaskPolling.js.map