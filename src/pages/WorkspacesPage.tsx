import { useEffect, useState } from 'react';
import { listWorkspaces } from '../lib/entities';
import WorkspaceBrowser from '../components/workspace/WorkspaceBrowser';
import type { ContractWorkspace } from '../types/workspace';

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<ContractWorkspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listWorkspaces().then(ws => { setWorkspaces(ws); setLoading(false); }).catch(console.error);
  }, []);

  if (loading) return <div className="p-6 text-slate-500">Loading workspaces…</div>;
  return (
    <div>
      <div className="px-5 pt-5 pb-3 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-800">My Workspaces</h1>
          <p className="text-xs text-slate-400">All contract workspaces · click to open</p>
        </div>
        <button className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg">+ New Workspace</button>
      </div>
      <WorkspaceBrowser workspaces={workspaces} />
    </div>
  );
}
