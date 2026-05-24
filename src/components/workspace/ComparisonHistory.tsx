import { useNavigate } from 'react-router-dom';
import type { WorkspaceComparison } from '../../types/workspace';

interface Props { workspaceId: string; comparisons: WorkspaceComparison[]; }

const STATUS_STYLES: Record<string, string> = {
  'awaiting-review': 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  running: 'bg-blue-100 text-blue-700',
};

const STATUS_LABELS: Record<string, string> = {
  'awaiting-review': '⏳ Awaiting Review',
  confirmed: '✓ Confirmed',
  rejected: '✗ Rejected',
  running: '⟳ Running',
};

export default function ComparisonHistory({ workspaceId, comparisons }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-800">🕑 Comparison History</span>
        <span className="text-xs text-slate-400">{comparisons.length} runs · click to open review</span>
      </div>
      <div className="divide-y divide-slate-100 p-3 flex flex-col gap-1">
        {comparisons.length === 0 && (
          <div className="text-xs text-slate-400 text-center py-4">No comparisons yet.</div>
        )}
        {[...comparisons].reverse().map(c => (
          <div key={c.comparisonId}
            onClick={() => navigate(`/workspaces/${workspaceId}/comparisons/${c.comparisonId}`)}
            className="border border-slate-200 rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-2 py-px rounded ${c.mode === 'buyer-seller-diff' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                {c.mode === 'buyer-seller-diff' ? 'Buyer / Seller' : 'Template Check'}
              </span>
              <span className="text-xs font-semibold text-slate-800 flex-1">
                v{c.docAVersion} vs v{c.docBVersion}
              </span>
              <span className={`text-[11px] font-bold px-2 py-px rounded ${STATUS_STYLES[c.status] ?? ''}`}>
                {STATUS_LABELS[c.status] ?? c.status}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 flex gap-4">
              <span>{new Date(c.startedAt).toLocaleString()}</span>
              {c.confirmedBy && <span>by {c.confirmedBy}</span>}
              {c.rejectionNote && <span className="text-red-400 truncate">"{c.rejectionNote}"</span>}
            </div>
            {c.findingSummary && (
              <div className="flex gap-1 mt-1.5">
                {c.findingSummary.high > 0 && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-px rounded font-bold">{c.findingSummary.high} High</span>}
                {c.findingSummary.medium > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-px rounded font-bold">{c.findingSummary.medium} Medium</span>}
                {c.findingSummary.aligned > 0 && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-px rounded font-bold">{c.findingSummary.aligned} Aligned</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
