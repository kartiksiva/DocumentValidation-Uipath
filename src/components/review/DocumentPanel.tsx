import PdfViewer from './PdfViewer';
import DocxViewer from './DocxViewer';

interface Props {
  blob: Blob;
  filename: string;
  label: string;
  isTemplate?: boolean;
  panelRef?: React.RefObject<HTMLDivElement>;
}

export default function DocumentPanel({ blob, filename, label, isTemplate, panelRef }: Props) {
  const isDocx = filename.toLowerCase().endsWith('.docx');

  return (
    <div className={`flex flex-col border-r border-slate-200 ${isTemplate ? 'bg-amber-50/30' : 'bg-white'}`}>
      <div className={`px-3 py-2 border-b text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 ${isTemplate ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
        <span>{isTemplate ? '📋' : '📄'}</span>
        <span>{label}</span>
      </div>
      <div ref={panelRef} className="flex-1 overflow-y-auto">
        {isDocx ? <DocxViewer blob={blob} /> : <PdfViewer blob={blob} />}
      </div>
    </div>
  );
}
