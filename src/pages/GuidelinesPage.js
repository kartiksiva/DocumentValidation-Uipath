import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { listGuidelines } from '../lib/entities';
import GuidelineLibrary from '../components/admin/GuidelineLibrary';
export default function GuidelinesPage() {
    const [guidelines, setGuidelines] = useState([]);
    useEffect(() => { listGuidelines().then(setGuidelines); }, []);
    return (_jsxs("div", { children: [_jsxs("div", { className: "px-5 pt-5 pb-3 border-b border-slate-200", children: [_jsx("h1", { className: "text-base font-bold text-slate-800", children: "Guideline Library" }), _jsx("p", { className: "text-xs text-slate-400", children: "Upload and manage RAG grounding documents" })] }), _jsx(GuidelineLibrary, { guidelines: guidelines })] }));
}
//# sourceMappingURL=GuidelinesPage.js.map