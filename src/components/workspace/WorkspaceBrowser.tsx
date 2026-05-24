import { useState } from 'react';
import type { ContractWorkspace } from '../../types/workspace';
import WorkspaceCard from './WorkspaceCard';

interface Props { workspaces: ContractWorkspace[]; onNew: () => void; }

export default function WorkspaceBrowser({ workspaces, onNew }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending'>('all');

  const filtered = workspaces.filter(ws => {
    const term = search.toLowerCase();
    const matchesSearch =
      ws.name.toLowerCase().includes(term) ||
      ws.buyerParty.toLowerCase().includes(term) ||
      ws.sellerParty.toLowerCase().includes(term) ||
      ws.contractType.toLowerCase().includes(term);
    const matchesFilter = filter === 'all' || ws.comparisons.some(c => c.status === 'awaiting-review');
    return matchesSearch && matchesFilter;
  });

  const pendingTotal = workspaces.reduce((n, ws) => n + ws.comparisons.filter(c => c.status === 'awaiting-review').length, 0);

  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex gap-3">
        {[
          { label: 'Workspaces', value: workspaces.length },
          { label: 'Versions', value: workspaces.reduce((n, ws) => n + ws.versions.length, 0) },
          { label: 'Comparisons', value: workspaces.reduce((n, ws) => n + ws.comparisons.length, 0) },
          { label: 'Pending Review', value: pendingTotal, highlight: true },
        ].map(s => (
          <div key={s.label} className={`bg-white border rounded-lg px-4 py-2 text-center ${s.highlight ? 'border-amber-300' : 'border-slate-200'}`}>
            <div className={`text-lg font-extrabold ${s.highlight ? 'text-amber-600' : 'text-slate-800'}`}>{s.value}</div>
            <div className="text-[10px] uppercase tracking-wide text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
          <span className="text-slate-400">🔍</span>
          <input
            className="flex-1 text-sm outline-none text-slate-700 placeholder:text-slate-400"
            placeholder="Search workspaces, parties, contract type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {(['all', 'pending'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-2 rounded-lg border ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
          >
            {f === 'all' ? 'All' : '⏳ Pending'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {filtered.map(ws => <WorkspaceCard key={ws.id} workspace={ws} />)}
        <div onClick={onNew} className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 min-h-36 cursor-pointer text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
          <span className="text-2xl">📂</span>
          <span className="text-sm font-semibold">New Workspace</span>
        </div>
      </div>
    </div>
  );
}
