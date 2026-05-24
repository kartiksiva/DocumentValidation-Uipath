import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { startComparison } from '../../lib/maestro';
export default function RunComparisonForm({ workspace, templates, onStarted }) {
    const [mode, setMode] = useState('buyer-seller-diff');
    const [templateId, setTemplateId] = useState(workspace.defaultTemplateId);
    const [docAVersion, setDocAVersion] = useState(workspace.versions.length);
    const [docBVersion, setDocBVersion] = useState(Math.max(1, workspace.versions.length - 1));
    const [includeHistory, setIncludeHistory] = useState(false);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState(null);
    async function handleRun() {
        const vA = workspace.versions.find(v => v.versionNumber === docAVersion);
        const vB = workspace.versions.find(v => v.versionNumber === docBVersion);
        if (!vA || !vB)
            return;
        const comparisonId = uuidv4();
        setRunning(true);
        setError(null);
        try {
            await startComparison({
                workspaceId: workspace.id,
                bucketName: 'contract-ai',
                docAKey: vA.bucketKey,
                docBKey: vB.bucketKey,
                mode,
                templateId,
                includeVersionHistory: includeHistory,
                comparisonId,
            });
            onStarted(comparisonId);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to start comparison');
        }
        finally {
            setRunning(false);
        }
    }
    if (workspace.versions.length < 2) {
        return (_jsx("div", { className: "bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-400 text-center", children: "Upload at least 2 versions to run a comparison." }));
    }
    return (_jsxs("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden", children: [_jsx("div", { className: "px-4 py-3 bg-slate-50 border-b border-slate-200", children: _jsx("span", { className: "text-sm font-bold text-slate-800", children: "\u25B6 Run New Comparison" }) }), _jsxs("div", { className: "p-4 flex flex-col gap-3", children: [_jsx("div", { className: "grid grid-cols-2 gap-3", children: [
                            { label: 'Mode', value: mode, onChange: (v) => setMode(v),
                                options: [{ value: 'buyer-seller-diff', label: 'Buyer / Seller Diff' }, { value: 'template-compliance', label: 'Template Compliance' }] },
                            { label: 'Template', value: templateId, onChange: setTemplateId,
                                options: templates.map(t => ({ value: t.id, label: t.name })) },
                            { label: 'Document A (Buyer)', value: String(docAVersion), onChange: (v) => setDocAVersion(Number(v)),
                                options: workspace.versions.map(v => ({ value: String(v.versionNumber), label: `v${v.versionNumber} — ${v.filename}` })) },
                            { label: 'Document B (Seller)', value: String(docBVersion), onChange: (v) => setDocBVersion(Number(v)),
                                options: workspace.versions.map(v => ({ value: String(v.versionNumber), label: `v${v.versionNumber} — ${v.filename}` })) },
                        ].map(f => (_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1", children: f.label }), _jsx("select", { value: f.value, onChange: e => f.onChange(e.target.value), className: "w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 bg-white", children: f.options.map(o => _jsx("option", { value: o.value, children: o.label }, o.value)) })] }, f.label))) }), _jsxs("label", { className: "flex items-center gap-2 text-xs text-slate-600 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: includeHistory, onChange: e => setIncludeHistory(e.target.checked), className: "rounded" }), "Include version history context (Latest vs Previous)"] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-[11px] text-slate-400", children: "Runs via Maestro \u00B7 est. ~2 min \u00B7 assigns human task on completion" }), _jsx("button", { onClick: () => void handleRun(), disabled: running, className: "bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50", children: running ? 'Starting…' : '▶ Run Comparison' })] }), error && _jsx("p", { className: "text-xs text-red-500", children: error })] })] }));
}
//# sourceMappingURL=RunComparisonForm.js.map