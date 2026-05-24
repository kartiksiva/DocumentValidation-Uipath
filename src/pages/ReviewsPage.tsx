import { useNavigate } from 'react-router-dom';
import { useTaskPolling } from '../hooks/useTaskPolling';

export default function ReviewsPage() {
  const { tasks, loading } = useTaskPolling();
  const navigate = useNavigate();

  if (loading) return <div className="p-6 text-slate-500">Loading reviews…</div>;

  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="text-3xl mb-2">✅</div>
        <p className="font-medium">No pending reviews</p>
        <p className="text-xs mt-1">Completed comparisons awaiting your approval will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold text-slate-800 mb-4">My Reviews</h1>
      <div className="space-y-2">
        {tasks.map(task => {
          const workspaceId = typeof task.data?.workspaceId === 'string' ? task.data.workspaceId : null;
          const comparisonId = typeof task.data?.comparisonId === 'string' ? task.data.comparisonId : null;
          return (
            <button
              key={task.id}
              onClick={() => workspaceId && comparisonId && navigate(`/workspaces/${workspaceId}/comparisons/${comparisonId}`)}
              className="w-full text-left bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Task #{task.id}</span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-px rounded-full">
                  Awaiting Review
                </span>
              </div>
              {workspaceId && (
                <p className="text-xs text-slate-400 mt-0.5">Workspace: {workspaceId}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
