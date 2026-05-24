import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
export default function WorkspaceCard({ workspace }) {
    const navigate = useNavigate();
    const pending = workspace.comparisons.filter(c => c.status === 'awaiting-review').length;
    const lastActivity = workspace.comparisons.at(-1)?.startedAt ?? workspace.createdAt;
    return (_jsxs("div", { onClick: () => navigate(`/workspaces/${workspace.id}`), className: `bg-white rounded-xl border cursor-pointer transition-shadow hover:shadow-md flex flex-col gap-3 p-4 ${pending > 0 ? 'border-l-[3px] border-l-amber-400 border-slate-200' : 'border-slate-200'}`, children: [_jsxs("div", { className: "flex items-start gap-2", children: [_jsx("div", { className: "w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-lg shrink-0", children: "\uD83D\uDCC1" }), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-bold text-slate-800 truncate", children: workspace.name }), _jsxs("div", { className: "text-xs text-slate-500 truncate", children: [workspace.buyerParty, " \u2192 ", workspace.sellerParty] })] })] }), _jsx("div", { className: "flex gap-1 flex-wrap", children: _jsx("span", { className: "text-[11px] bg-amber-100 text-amber-700 px-2 py-px rounded font-semibold", children: workspace.contractType }) }), _jsx("div", { className: "flex gap-4 pt-2 border-t border-slate-100 text-center", children: [
                    { label: 'versions', value: workspace.versions.length },
                    { label: 'runs', value: workspace.comparisons.length },
                    { label: 'confirmed', value: workspace.comparisons.filter(c => c.status === 'confirmed').length },
                ].map(s => (_jsxs("div", { className: "flex flex-col items-center", children: [_jsx("span", { className: "text-sm font-bold text-slate-700", children: s.value }), _jsx("span", { className: "text-[10px] text-slate-400 uppercase tracking-wide", children: s.label })] }, s.label))) }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-[11px] text-slate-400", children: new Date(lastActivity).toLocaleDateString() }), pending > 0
                        ? _jsxs("span", { className: "text-[11px] bg-amber-100 text-amber-700 px-2 py-px rounded-full font-bold", children: [pending, " pending"] })
                        : _jsx("span", { className: "text-[11px] bg-green-100 text-green-700 px-2 py-px rounded-full font-bold", children: "\u2713 All clear" })] })] }));
}
//# sourceMappingURL=WorkspaceCard.js.map