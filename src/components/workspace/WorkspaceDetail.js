import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { v4 as uuidv4 } from 'uuid';
import VersionList from './VersionList';
import RunComparisonForm from './RunComparisonForm';
import ComparisonHistory from './ComparisonHistory';
import { buildBucketKey, uploadFile } from '../../lib/buckets';
import { updateWorkspace } from '../../lib/entities';
export default function WorkspaceDetail({ workspace, templates, onUpdate }) {
    const pending = workspace.comparisons.filter(c => c.status === 'awaiting-review').length;
    async function handleUpload(file) {
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
    async function handleComparisonStarted(comparisonId) {
        const newComparison = {
            comparisonId, docAVersion: workspace.versions.length,
            docBVersion: Math.max(1, workspace.versions.length - 1),
            mode: 'buyer-seller-diff', templateId: workspace.defaultTemplateId,
            includeVersionHistory: false, status: 'running',
            startedAt: new Date().toISOString(),
        };
        const updated = await updateWorkspace(workspace.id, {
            comparisons: [...workspace.comparisons, newComparison],
        });
        onUpdate(updated);
    }
    return (_jsxs("div", { className: "p-5 flex flex-col gap-4", children: [_jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3", children: [_jsx("div", { className: "w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-2xl shrink-0", children: "\uD83D\uDCC1" }), _jsxs("div", { className: "flex-1", children: [_jsx("h1", { className: "text-base font-extrabold text-slate-800", children: workspace.name }), _jsx("p", { className: "text-xs text-slate-500", children: workspace.description }), _jsxs("div", { className: "flex gap-2 mt-2 flex-wrap", children: [_jsx("span", { className: "text-[11px] bg-amber-100 text-amber-700 px-2 py-px rounded font-semibold", children: workspace.contractType }), _jsxs("span", { className: "text-[11px] bg-blue-100 text-blue-700 px-2 py-px rounded font-semibold", children: ["Buyer: ", workspace.buyerParty] }), _jsxs("span", { className: "text-[11px] bg-blue-100 text-blue-700 px-2 py-px rounded font-semibold", children: ["Seller: ", workspace.sellerParty] })] })] }), _jsx("div", { className: "flex gap-4 text-center pl-4 border-l border-slate-200", children: [{ label: 'Versions', value: workspace.versions.length },
                            { label: 'Comparisons', value: workspace.comparisons.length },
                            { label: 'Pending', value: pending, amber: pending > 0 }].map(s => (_jsxs("div", { children: [_jsx("div", { className: `text-lg font-extrabold ${'amber' in s && s.amber ? 'text-amber-600' : 'text-slate-800'}`, children: s.value }), _jsx("div", { className: "text-[10px] text-slate-400 uppercase", children: s.label })] }, s.label))) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(VersionList, { versions: workspace.versions, onUpload: handleUpload }), _jsx(RunComparisonForm, { workspace: workspace, templates: templates, onStarted: handleComparisonStarted })] }), _jsx(ComparisonHistory, { workspaceId: workspace.id, comparisons: workspace.comparisons })] }));
}
void uuidv4; // imported transitively via uuid; keep to avoid tree-shake warning
//# sourceMappingURL=WorkspaceDetail.js.map