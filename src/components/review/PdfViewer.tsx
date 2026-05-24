import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface Props { blob: Blob; className?: string; }

export default function PdfViewer({ blob, className }: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  const url = URL.createObjectURL(blob);

  return (
    <div className={`overflow-y-auto ${className ?? ''}`}>
      <Document file={url} onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={<div className="p-4 text-slate-400 text-xs">Loading PDF…</div>}>
        {Array.from({ length: numPages }, (_, i) => (
          <Page key={i + 1} pageNumber={i + 1} width={560} className="mb-2" />
        ))}
      </Document>
    </div>
  );
}
