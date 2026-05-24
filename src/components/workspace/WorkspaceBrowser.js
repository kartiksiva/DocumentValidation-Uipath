import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import WorkspaceCard from './WorkspaceCard';
export default function WorkspaceBrowser({ workspaces }) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const filtered = workspaces.filter(ws => {
        const term = search.toLowerCase();
        const matchesSearch = ws.name.toLowerCase().includes(term) ||
            ws.buyerParty.toLowerCase().includes(term) ||
            ws.sellerParty.toLowerCase().includes(term) ||
            ws.contractType.toLowerCase().includes(term);
        const matchesFilter = filter === 'all' || ws.comparisons.some(c => c.status === 'awaiting-review');
        return matchesSearch && matchesFilter;
    });
    const pendingTotal = workspaces.reduce((n, ws) => n + ws.comparisons.filter(c => c.status === 'awaiting-review').length, 0);
    return (_jsxs("div", { className: "p-5 flex flex-col gap-4", children: [_jsx("div", { className: "flex gap-3", children: [
                    { label: 'Workspaces', value: workspaces.length },
                    { label: 'Versions', value: workspaces.reduce((n, ws) => n + ws.versions.length, 0) },
                    { label: 'Comparisons', value: workspaces.reduce((n, ws) => n + ws.comparisons.length, 0) },
                    { label: 'Pending Review', value: pendingTotal, highlight: true },
                ].map(s => (_jsxs("div", { className: `bg-white border rounded-lg px-4 py-2 text-center ${s.highlight ? 'border-amber-300' : 'border-slate-200'}`, children: [_jsx("div", { className: `text-lg font-extrabold ${s.highlight ? 'text-amber-600' : 'text-slate-800'}`, children: s.value }), _jsx("div", { className: "text-[10px] uppercase tracking-wide text-slate-400", children: s.label })] }, s.label))) }), _jsxs("div", { className: "flex gap-2 items-center", children: [_jsxs("div", { className: "flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2", children: [_jsx("span", { className: "text-slate-400", children: "\uD83D\uDD0D" }), _jsx("input", { className: "flex-1 text-sm outline-none text-slate-700 placeholder:text-slate-400", placeholder: "Search workspaces, parties, contract type\u2026", value: search, onChange: e => setSearch(e.target.value) })] }), ['all', 'pending'].map(f => (_jsx("button", { onClick: () => setFilter(f), className: `text-xs font-semibold px-3 py-2 rounded-lg border ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`, children: f === 'all' ? 'All' : '⏳ Pending' }, f)))] }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [filtered.map(ws => _jsx(WorkspaceCard, { workspace: ws }, ws.id)), _jsxs("div", { className: "border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 min-h-36 cursor-pointer text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors", children: [_jsx("span", { className: "text-2xl", children: "\uD83D\uDCC2" }), _jsx("span", { className: "text-sm font-semibold", children: "New Workspace" })] })] })] }));
}
//# sourceMappingURL=WorkspaceBrowser.js.map