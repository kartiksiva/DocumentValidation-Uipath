import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWorkspace, listTemplates } from '../lib/entities';
import WorkspaceDetail from '../components/workspace/WorkspaceDetail';
export default function WorkspaceDetailPage() {
    const { workspaceId } = useParams();
    const [workspace, setWorkspace] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!workspaceId)
            return;
        Promise.all([getWorkspace(workspaceId), listTemplates()])
            .then(([ws, tmpl]) => { setWorkspace(ws); setTemplates(tmpl); })
            .finally(() => setLoading(false));
    }, [workspaceId]);
    if (loading)
        return _jsx("div", { className: "p-6 text-slate-500", children: "Loading\u2026" });
    if (!workspace)
        return _jsx("div", { className: "p-6 text-red-500", children: "Workspace not found." });
    return (_jsxs("div", { children: [_jsxs("div", { className: "px-5 pt-4 pb-2 border-b border-slate-200 text-xs text-slate-400 flex gap-1 items-center", children: [_jsx(Link, { to: "/workspaces", className: "text-blue-500", children: "My Workspaces" }), _jsx("span", { children: "\u203A" }), _jsx("strong", { className: "text-slate-700", children: workspace.name })] }), _jsx(WorkspaceDetail, { workspace: workspace, templates: templates, onUpdate: setWorkspace })] }));
}
//# sourceMappingURL=WorkspaceDetailPage.js.map