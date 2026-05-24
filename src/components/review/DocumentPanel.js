import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import PdfViewer from './PdfViewer';
import DocxViewer from './DocxViewer';
export default function DocumentPanel({ blob, filename, label, isTemplate, panelRef }) {
    const isDocx = filename.toLowerCase().endsWith('.docx');
    return (_jsxs("div", { className: `flex flex-col border-r border-slate-200 ${isTemplate ? 'bg-amber-50/30' : 'bg-white'}`, children: [_jsxs("div", { className: `px-3 py-2 border-b text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 ${isTemplate ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`, children: [_jsx("span", { children: isTemplate ? '📋' : '📄' }), _jsx("span", { children: label })] }), _jsx("div", { ref: panelRef, className: "flex-1 overflow-y-auto", children: isDocx ? _jsx(DocxViewer, { blob: blob }) : _jsx(PdfViewer, { blob: blob }) })] }));
}
//# sourceMappingURL=DocumentPanel.js.map