import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import mammoth from 'mammoth';
import DOMPurify from 'dompurify';
export default function DocxViewer({ blob, className }) {
    const [html, setHtml] = useState('');
    const [error, setError] = useState(null);
    useEffect(() => {
        blob.arrayBuffer()
            .then(buf => mammoth.convertToHtml({ arrayBuffer: buf }))
            .then(result => setHtml(result.value))
            .catch(e => setError(e instanceof Error ? e.message : 'Failed to render document'));
    }, [blob]);
    if (error)
        return _jsx("div", { className: "p-4 text-red-500 text-xs", children: error });
    if (!html)
        return _jsx("div", { className: "p-4 text-slate-400 text-xs", children: "Rendering document\u2026" });
    return (_jsx("div", { className: `prose prose-sm max-w-none p-4 font-serif text-slate-700 ${className ?? ''}`, dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(html) } }));
}
//# sourceMappingURL=DocxViewer.js.map