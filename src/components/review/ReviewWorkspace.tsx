import { useState, useRef } from 'react';
import type { ReviewPayload, Finding } from '../../types/review';
import FindingsSidebar from './FindingsSidebar';
import DocumentPanel from './DocumentPanel';
import HighlightLayer from './HighlightLayer';
import ConfirmBar from './ConfirmBar';

interface Props {
  payload: ReviewPayload;
  docABlob: Blob;
  docBBlob: Blob;
  docAFilename: string;
  docBFilename: string;
  isComplianceMode: boolean;
  onDone: () => void;
}

export default function ReviewWorkspace({ payload, docABlob, docBBlob, docAFilename, docBFilename, isComplianceMode, onDone }: Props) {
  const [activeFinding, setActiveFinding] = useState<Finding | null>(null);
  const panelARef = useRef<HTMLDivElement>(null);
  const panelBRef = useRef<HTMLDivElement>(null);

  function handleSelectFinding(f: Finding) {
    setActiveFinding(f);
    [panelARef, panelBRef].forEach(ref => {
      const el = ref.current?.querySelector('mark');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600">
          📄 {docAFilename}
        </div>
        <span className="text-xs text-slate-400 font-semibold">vs</span>
        <div className={`flex items-center gap-2 border rounded-lg px-2 py-1 text-xs ${isComplianceMode ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
          {isComplianceMode ? '📋' : '📄'} {docBFilename}
        </div>
        <span className={`text-[11px] font-bold px-2 py-px rounded ${isComplianceMode ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
          {isComplianceMode ? 'Template Compliance' : 'Buyer / Seller Diff'}
        </span>
        <div className="ml-auto text-xs text-slate-400">
          {payload.findings.filter(f => f.deviationType === 'high-risk' || f.deviationType === 'missing').length} High ·{' '}
          {payload.findings.filter(f => f.deviationType === 'medium-risk' || f.deviationType === 'modified').length} Medium ·{' '}
          {payload.findings.filter(f => f.deviationType === 'aligned').length} Aligned
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <FindingsSidebar payload={payload} activeFinding={activeFinding} onSelectFinding={handleSelectFinding} />

        <div className="flex-1 grid grid-cols-2 overflow-hidden">
          <div id="panel-a" className="overflow-y-auto border-r border-slate-200">
            <DocumentPanel blob={docABlob} filename={docAFilename} label="Contract (Under Review)" panelRef={panelARef} />
            <HighlightLayer panelId="panel-a" findings={payload.findings} activeFinding={activeFinding} />
          </div>
          <div id="panel-b" className="overflow-y-auto">
            <DocumentPanel blob={docBBlob} filename={docBFilename} label={isComplianceMode ? 'Standard Template (Reference)' : 'Seller Contract'} isTemplate={isComplianceMode} panelRef={panelBRef} />
            <HighlightLayer panelId="panel-b" findings={payload.findings.map(f => ({ ...f, snippetA: f.snippetB ?? f.snippetA }))} activeFinding={activeFinding} />
          </div>
        </div>
      </div>

      <ConfirmBar payload={payload} onDone={onDone} />
    </div>
  );
}
