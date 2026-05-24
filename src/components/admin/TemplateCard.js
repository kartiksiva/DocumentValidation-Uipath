import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { updateTemplate } from '../../lib/entities';
export default function TemplateCard({ template, guidelines, onUpdate }) {
    const [systemMessage, setSystemMessage] = useState(template.systemMessage);
    const [saving, setSaving] = useState(false);
    const linked = guidelines.filter(g => template.linkedGuidelineIds.includes(g.id));
    async function handleSave() {
        setSaving(true);
        const updated = await updateTemplate(template.id, { systemMessage });
        onUpdate(updated);
        setSaving(false);
    }
    async function handleRemoveGuideline(gId) {
        const updated = await updateTemplate(template.id, {
            linkedGuidelineIds: template.linkedGuidelineIds.filter(id => id !== gId),
        });
        onUpdate(updated);
    }
    return (_jsxs("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden", children: [_jsxs("div", { className: "px-4 py-3 flex items-center gap-3", children: [_jsx("div", { className: "w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-lg", children: "\uD83D\uDCC4" }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-sm font-bold text-slate-800", children: template.name }), _jsx("div", { className: "text-xs text-slate-500", children: template.description })] }), _jsx("span", { className: `text-[11px] font-bold px-2 py-px rounded ${template.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`, children: template.status })] }), _jsxs("div", { className: "px-4 pb-4 bg-slate-50 border-t border-slate-100", children: [_jsxs("div", { className: "text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-3 mb-1.5 flex items-center gap-2", children: ["\uD83E\uDD16 System Message ", _jsx("span", { className: "text-purple-500 font-bold", children: "LLM INSTRUCTION" })] }), _jsx("textarea", { value: systemMessage, onChange: e => setSystemMessage(e.target.value), rows: 4, className: "w-full border-l-4 border-l-purple-400 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-700 bg-white resize-none outline-none focus:border-purple-300" }), _jsx("button", { onClick: () => void handleSave(), disabled: saving, className: "mt-2 text-xs font-semibold bg-purple-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50", children: saving ? 'Saving…' : 'Save System Message' }), _jsx("div", { className: "text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-3 mb-1.5", children: "\uD83D\uDCDA Grounding Documents" }), _jsxs("div", { className: "flex flex-wrap gap-1.5", children: [linked.map(g => (_jsxs("div", { className: "flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600", children: ["\uD83D\uDCD8 ", g.name, _jsx("button", { onClick: () => void handleRemoveGuideline(g.id), className: "text-slate-300 hover:text-red-400 text-[11px] ml-1", children: "\u00D7" })] }, g.id))), _jsx("button", { className: "bg-slate-50 border border-dashed border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-400 hover:border-blue-400 hover:text-blue-500", children: "+ Add guideline" })] })] })] }));
}
//# sourceMappingURL=TemplateCard.js.map