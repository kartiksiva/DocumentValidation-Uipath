import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
export default function PdfViewer({ blob, className }) {
    const [numPages, setNumPages] = useState(0);
    const url = useMemo(() => URL.createObjectURL(blob), [blob]);
    useEffect(() => () => URL.revokeObjectURL(url), [url]);
    return (_jsx("div", { className: `overflow-y-auto ${className ?? ''}`, children: _jsx(Document, { file: url, onLoadSuccess: ({ numPages }) => setNumPages(numPages), loading: _jsx("div", { className: "p-4 text-slate-400 text-xs", children: "Loading PDF\u2026" }), children: Array.from({ length: numPages }, (_, i) => (_jsx(Page, { pageNumber: i + 1, width: 560, className: "mb-2" }, i + 1))) }) }));
}
//# sourceMappingURL=PdfViewer.js.map