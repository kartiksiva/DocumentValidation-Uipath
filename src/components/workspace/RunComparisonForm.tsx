import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ContractWorkspace, ComparisonMode } from '../../types/workspace';
import type { Template } from '../../types/template';
import { startComparison } from '../../lib/maestro';

interface Props {
  workspace: ContractWorkspace;
  templates: Template[];
  onStarted: (comparisonId: string) => void;
}

export default function RunComparisonForm({ workspace, templates, onStarted }: Props) {
  const [mode, setMode] = useState<ComparisonMode>('buyer-seller-diff');
  const [templateId, setTemplateId] = useState(workspace.defaultTemplateId);
  const [docAVersion, setDocAVersion] = useState(workspace.versions.length);
  const [docBVersion, setDocBVersion] = useState(Math.max(1, workspace.versions.length - 1));
  const [includeHistory, setIncludeHistory] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    const vA = workspace.versions.find(v => v.versionNumber === docAVersion);
    const vB = workspace.versions.find(v => v.versionNumber === docBVersion);
    if (!vA || !vB) return;
    const comparisonId = uuidv4();
    setRunning(true);
    setError(null);
    try {
      const tpl = templates.find(t => t.id === templateId);
      await startComparison({
        workspaceId: workspace.id,
        bucketName: 'contract-workspaces',
        docAKey: vA.bucketKey,
        docBKey: vB.bucketKey,
        mode,
        templateId,
        templateSystemMessage: tpl?.systemMessage ?? '',
        linkedGuidelineIds: tpl?.linkedGuidelineIds ?? [],
        includeVersionHistory: includeHistory,
        comparisonId,
      });
      onStarted(comparisonId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start comparison');
    } finally {
      setRunning(false);
    }
  }

  if (workspace.versions.length < 2) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-400 text-center">
        Upload at least 2 versions to run a comparison.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <span className="text-sm font-bold text-slate-800">▶ Run New Comparison</span>
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Mode', value: mode, onChange: (v: string) => setMode(v as ComparisonMode),
              options: [{ value: 'buyer-seller-diff', label: 'Buyer / Seller Diff' }, { value: 'template-compliance', label: 'Template Compliance' }] },
            { label: 'Template', value: templateId, onChange: setTemplateId,
              options: templates.map(t => ({ value: t.id, label: t.name })) },
            { label: 'Document A (Buyer)', value: String(docAVersion), onChange: (v: string) => setDocAVersion(Number(v)),
              options: workspace.versions.map(v => ({ value: String(v.versionNumber), label: `v${v.versionNumber} — ${v.filename}` })) },
            { label: 'Document B (Seller)', value: String(docBVersion), onChange: (v: string) => setDocBVersion(Number(v)),
              options: workspace.versions.map(v => ({ value: String(v.versionNumber), label: `v${v.versionNumber} — ${v.filename}` })) },
          ].map(f => (
            <div key={f.label}>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">{f.label}</div>
              <select value={f.value} onChange={e => f.onChange(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 bg-white">
                {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={includeHistory} onChange={e => setIncludeHistory(e.target.checked)} className="rounded" />
          Include version history context (Latest vs Previous)
        </label>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Runs via Maestro · est. ~2 min · assigns human task on completion</span>
          <button onClick={() => void handleRun()} disabled={running}
            className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
            {running ? 'Starting…' : '▶ Run Comparison'}
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}

