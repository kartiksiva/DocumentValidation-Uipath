import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
const STATUS_STYLES = {
    'awaiting-review': 'bg-amber-100 text-amber-700',
    confirmed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    running: 'bg-blue-100 text-blue-700',
};
const STATUS_LABELS = {
    'awaiting-review': '⏳ Awaiting Review',
    confirmed: '✓ Confirmed',
    rejected: '✗ Rejected',
    running: '⟳ Running',
};
export default function ComparisonHistory({ workspaceId, comparisons }) {
    const navigate = useNavigate();
    return (_jsxs("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden", children: [_jsxs("div", { className: "px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-bold text-slate-800", children: "\uD83D\uDD51 Comparison History" }), _jsxs("span", { className: "text-xs text-slate-400", children: [comparisons.length, " runs \u00B7 click to open review"] })] }), _jsxs("div", { className: "divide-y divide-slate-100 p-3 flex flex-col gap-1", children: [comparisons.length === 0 && (_jsx("div", { className: "text-xs text-slate-400 text-center py-4", children: "No comparisons yet." })), [...comparisons].reverse().map(c => (_jsxs("div", { onClick: () => navigate(`/workspaces/${workspaceId}/comparisons/${c.comparisonId}`), className: "border border-slate-200 rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `text-[11px] font-bold px-2 py-px rounded ${c.mode === 'buyer-seller-diff' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`, children: c.mode === 'buyer-seller-diff' ? 'Buyer / Seller' : 'Template Check' }), _jsxs("span", { className: "text-xs font-semibold text-slate-800 flex-1", children: ["v", c.docAVersion, " vs v", c.docBVersion] }), _jsx("span", { className: `text-[11px] font-bold px-2 py-px rounded ${STATUS_STYLES[c.status] ?? ''}`, children: STATUS_LABELS[c.status] ?? c.status })] }), _jsxs("div", { className: "text-[11px] text-slate-400 mt-1.5 flex gap-4", children: [_jsx("span", { children: new Date(c.startedAt).toLocaleString() }), c.confirmedBy && _jsxs("span", { children: ["by ", c.confirmedBy] }), c.rejectionNote && _jsxs("span", { className: "text-red-400 truncate", children: ["\"", c.rejectionNote, "\""] })] }), c.findingSummary && (_jsxs("div", { className: "flex gap-1 mt-1.5", children: [c.findingSummary.high > 0 && _jsxs("span", { className: "text-[10px] bg-red-100 text-red-700 px-1.5 py-px rounded font-bold", children: [c.findingSummary.high, " High"] }), c.findingSummary.medium > 0 && _jsxs("span", { className: "text-[10px] bg-amber-100 text-amber-700 px-1.5 py-px rounded font-bold", children: [c.findingSummary.medium, " Medium"] }), c.findingSummary.aligned > 0 && _jsxs("span", { className: "text-[10px] bg-green-100 text-green-700 px-1.5 py-px rounded font-bold", children: [c.findingSummary.aligned, " Aligned"] })] }))] }, c.comparisonId)))] })] }));
}
//# sourceMappingURL=ComparisonHistory.js.map