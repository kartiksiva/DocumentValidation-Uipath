import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWorkspace, listTemplates } from '../lib/entities';
import WorkspaceDetail from '../components/workspace/WorkspaceDetail';
import type { ContractWorkspace } from '../types/workspace';
import type { Template } from '../types/template';

export default function WorkspaceDetailPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<ContractWorkspace | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    Promise.all([getWorkspace(workspaceId), listTemplates()])
      .then(([ws, tmpl]) => { setWorkspace(ws); setTemplates(tmpl); })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (loading) return <div className="p-6 text-slate-500">Loading…</div>;
  if (!workspace) return <div className="p-6 text-red-500">Workspace not found.</div>;

  return (
    <div>
      <div className="px-5 pt-4 pb-2 border-b border-slate-200 text-xs text-slate-400 flex gap-1 items-center">
        <Link to="/workspaces" className="text-blue-500">My Workspaces</Link>
        <span>›</span>
        <strong className="text-slate-700">{workspace.name}</strong>
      </div>
      <WorkspaceDetail workspace={workspace} templates={templates} onUpdate={setWorkspace} />
    </div>
  );
}
