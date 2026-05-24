import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import FindingsSidebar from './FindingsSidebar';
import DocumentPanel from './DocumentPanel';
import HighlightLayer from './HighlightLayer';
import ConfirmBar from './ConfirmBar';
export default function ReviewWorkspace({ payload, docABlob, docBBlob, docAFilename, docBFilename, isComplianceMode, onDone }) {
    const [activeFinding, setActiveFinding] = useState(null);
    const panelARef = useRef(null);
    const panelBRef = useRef(null);
    function handleSelectFinding(f) {
        setActiveFinding(f);
        [panelARef, panelBRef].forEach(ref => {
            const el = ref.current?.querySelector('mark');
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }
    return (_jsxs("div", { className: "flex flex-col h-screen", children: [_jsxs("div", { className: "bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-3 shrink-0", children: [_jsxs("div", { className: "flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600", children: ["\uD83D\uDCC4 ", docAFilename] }), _jsx("span", { className: "text-xs text-slate-400 font-semibold", children: "vs" }), _jsxs("div", { className: `flex items-center gap-2 border rounded-lg px-2 py-1 text-xs ${isComplianceMode ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`, children: [isComplianceMode ? '📋' : '📄', " ", docBFilename] }), _jsx("span", { className: `text-[11px] font-bold px-2 py-px rounded ${isComplianceMode ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`, children: isComplianceMode ? 'Template Compliance' : 'Buyer / Seller Diff' }), _jsxs("div", { className: "ml-auto text-xs text-slate-400", children: [payload.findings.filter(f => f.deviationType === 'high-risk' || f.deviationType === 'missing').length, " High \u00B7", ' ', payload.findings.filter(f => f.deviationType === 'medium-risk' || f.deviationType === 'modified').length, " Medium \u00B7", ' ', payload.findings.filter(f => f.deviationType === 'aligned').length, " Aligned"] })] }), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsx(FindingsSidebar, { payload: payload, activeFinding: activeFinding, onSelectFinding: handleSelectFinding }), _jsxs("div", { className: "flex-1 grid grid-cols-2 overflow-hidden", children: [_jsxs("div", { id: "panel-a", className: "overflow-y-auto border-r border-slate-200", children: [_jsx(DocumentPanel, { blob: docABlob, filename: docAFilename, label: "Contract (Under Review)", panelRef: panelARef }), _jsx(HighlightLayer, { panelId: "panel-a", findings: payload.findings, activeFinding: activeFinding })] }), _jsxs("div", { id: "panel-b", className: "overflow-y-auto", children: [_jsx(DocumentPanel, { blob: docBBlob, filename: docBFilename, label: isComplianceMode ? 'Standard Template (Reference)' : 'Seller Contract', isTemplate: isComplianceMode, panelRef: panelBRef }), _jsx(HighlightLayer, { panelId: "panel-b", findings: payload.findings.map(f => ({ ...f, snippetA: f.snippetB ?? f.snippetA })), activeFinding: activeFinding })] })] })] }), _jsx(ConfirmBar, { payload: payload, onDone: onDone })] }));
}
//# sourceMappingURL=ReviewWorkspace.js.map