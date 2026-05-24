import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { listWorkspaces } from '../lib/entities';
import WorkspaceBrowser from '../components/workspace/WorkspaceBrowser';
export default function WorkspacesPage() {
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        listWorkspaces().then(ws => { setWorkspaces(ws); setLoading(false); }).catch(console.error);
    }, []);
    if (loading)
        return _jsx("div", { className: "p-6 text-slate-500", children: "Loading workspaces\u2026" });
    return (_jsxs("div", { children: [_jsxs("div", { className: "px-5 pt-5 pb-3 border-b border-slate-200 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-base font-bold text-slate-800", children: "My Workspaces" }), _jsx("p", { className: "text-xs text-slate-400", children: "All contract workspaces \u00B7 click to open" })] }), _jsx("button", { className: "bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg", children: "+ New Workspace" })] }), _jsx(WorkspaceBrowser, { workspaces: workspaces })] }));
}
//# sourceMappingURL=WorkspacesPage.js.map