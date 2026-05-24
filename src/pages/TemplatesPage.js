import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { listTemplates, listGuidelines } from '../lib/entities';
import TemplateManager from '../components/admin/TemplateManager';
export default function TemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [guidelines, setGuidelines] = useState([]);
    useEffect(() => {
        Promise.all([listTemplates(), listGuidelines()]).then(([t, g]) => { setTemplates(t); setGuidelines(g); });
    }, []);
    return (_jsxs("div", { children: [_jsxs("div", { className: "px-5 pt-5 pb-3 border-b border-slate-200 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-base font-bold text-slate-800", children: "Template & Context Management" }), _jsx("p", { className: "text-xs text-slate-400", children: "Configure templates, system prompts, and grounding documents" })] }), _jsx("button", { className: "bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg", children: "+ New Template" })] }), _jsx(TemplateManager, { templates: templates, guidelines: guidelines, onUpdate: t => setTemplates(prev => prev.map(p => p.id === t.id ? t : p)) })] }));
}
//# sourceMappingURL=TemplatesPage.js.map