import { useNavigate } from 'react-router-dom';
import type { ContractWorkspace } from '../../types/workspace';

interface Props { workspace: ContractWorkspace; }

export default function WorkspaceCard({ workspace }: Props) {
  const navigate = useNavigate();
  const pending = workspace.comparisons.filter(c => c.status === 'awaiting-review').length;
  const lastActivity = workspace.comparisons.at(-1)?.startedAt ?? workspace.createdAt;

  return (
    <div
      onClick={() => navigate(`/workspaces/${workspace.id}`)}
      className={`bg-white rounded-xl border cursor-pointer transition-shadow hover:shadow-md flex flex-col gap-3 p-4 ${pending > 0 ? 'border-l-[3px] border-l-amber-400 border-slate-200' : 'border-slate-200'}`}
    >
      <div className="flex items-start gap-2">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-lg shrink-0">📁</div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-800 truncate">{workspace.name}</div>
          <div className="text-xs text-slate-500 truncate">{workspace.buyerParty} → {workspace.sellerParty}</div>
        </div>
      </div>
      <div className="flex gap-1 flex-wrap">
        <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-px rounded font-semibold">{workspace.contractType}</span>
      </div>
      <div className="flex gap-4 pt-2 border-t border-slate-100 text-center">
        {[
          { label: 'versions', value: workspace.versions.length },
          { label: 'runs', value: workspace.comparisons.length },
          { label: 'confirmed', value: workspace.comparisons.filter(c => c.status === 'confirmed').length },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center">
            <span className="text-sm font-bold text-slate-700">{s.value}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {new Date(lastActivity).toLocaleDateString()}
        </span>
        {pending > 0
          ? <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-px rounded-full font-bold">{pending} pending</span>
          : <span className="text-[11px] bg-green-100 text-green-700 px-2 py-px rounded-full font-bold">✓ All clear</span>
        }
      </div>
    </div>
  );
}
