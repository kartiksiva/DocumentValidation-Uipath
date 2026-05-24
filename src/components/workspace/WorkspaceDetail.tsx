import { v4 as uuidv4 } from 'uuid';
import type { ContractWorkspace } from '../../types/workspace';
import type { Template } from '../../types/template';
import VersionList from './VersionList';
import RunComparisonForm from './RunComparisonForm';
import ComparisonHistory from './ComparisonHistory';
import { buildBucketKey, uploadFile } from '../../lib/buckets';
import { updateWorkspace } from '../../lib/entities';

interface Props {
  workspace: ContractWorkspace;
  templates: Template[];
  onUpdate: (ws: ContractWorkspace) => void;
}

export default function WorkspaceDetail({ workspace, templates, onUpdate }: Props) {
  const pending = workspace.comparisons.filter(c => c.status === 'awaiting-review').length;

  async function handleUpload(file: File) {
    const nextVersion = workspace.versions.length + 1;
    const key = buildBucketKey({ workspaceId: workspace.id, versionNumber: nextVersion, filename: file.name });
    await uploadFile(key, file);
    const updated = await updateWorkspace(workspace.id, {
      versions: [
        ...workspace.versions,
        { versionNumber: nextVersion, bucketKey: key, filename: file.name,
          uploadedBy: 'current-user', uploadedAt: new Date().toISOString(), fileSizeBytes: file.size },
      ],
    });
    onUpdate(updated);
  }

  async function handleComparisonStarted(comparisonId: string) {
    const newComparison = {
      comparisonId, docAVersion: workspace.versions.length,
      docBVersion: Math.max(1, workspace.versions.length - 1),
      mode: 'buyer-seller-diff' as const, templateId: workspace.defaultTemplateId,
      includeVersionHistory: false, status: 'running' as const,
      startedAt: new Date().toISOString(),
    };
    const updated = await updateWorkspace(workspace.id, {
      comparisons: [...workspace.comparisons, newComparison],
    });
    onUpdate(updated);
  }

  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-2xl shrink-0">📁</div>
        <div className="flex-1">
          <h1 className="text-base font-extrabold text-slate-800">{workspace.name}</h1>
          <p className="text-xs text-slate-500">{workspace.description}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-px rounded font-semibold">{workspace.contractType}</span>
            <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-px rounded font-semibold">Buyer: {workspace.buyerParty}</span>
            <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-px rounded font-semibold">Seller: {workspace.sellerParty}</span>
          </div>
        </div>
        <div className="flex gap-4 text-center pl-4 border-l border-slate-200">
          {[{ label: 'Versions', value: workspace.versions.length },
            { label: 'Comparisons', value: workspace.comparisons.length },
            { label: 'Pending', value: pending, amber: pending > 0 }].map(s => (
            <div key={s.label}>
              <div className={`text-lg font-extrabold ${'amber' in s && s.amber ? 'text-amber-600' : 'text-slate-800'}`}>{s.value}</div>
              <div className="text-[10px] text-slate-400 uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <VersionList versions={workspace.versions} onUpload={handleUpload} />
        <RunComparisonForm workspace={workspace} templates={templates} onStarted={handleComparisonStarted} />
      </div>

      <ComparisonHistory workspaceId={workspace.id} comparisons={workspace.comparisons} />
    </div>
  );
}

void uuidv4; // imported transitively via uuid; keep to avoid tree-shake warning
