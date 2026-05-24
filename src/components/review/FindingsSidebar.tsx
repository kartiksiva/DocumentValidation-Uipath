import type { Finding, ReviewPayload } from '../../types/review';

interface Props {
  payload: ReviewPayload;
  activeFinding: Finding | null;
  onSelectFinding: (f: Finding) => void;
}

const RAG_STYLES: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700', MISSING: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700', MODIFIED: 'bg-amber-100 text-amber-700',
  OK: 'bg-green-100 text-green-700', EXTRA: 'bg-blue-100 text-blue-700',
};

const FINDING_DOT: Record<string, string> = {
  'high-risk': 'bg-red-500', missing: 'bg-red-500',
  'medium-risk': 'bg-amber-500', modified: 'bg-amber-500',
  aligned: 'bg-green-500', extra: 'bg-blue-500',
};

export default function FindingsSidebar({ payload, activeFinding, onSelectFinding }: Props) {
  return (
    <div className="w-56 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden shrink-0">
      <div className="p-3 border-b border-slate-200">
        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">
          {payload.compliancePercent !== undefined ? 'Compliance Score' : 'Risk Scorecard'}
        </div>
        {payload.compliancePercent !== undefined && (
          <div className="text-center mb-2">
            <span className="text-2xl font-extrabold text-amber-500">{payload.compliancePercent}%</span>
            <div className="text-[10px] text-slate-400">clause compliance</div>
          </div>
        )}
        <div className="flex flex-col gap-1">
          {payload.scorecard.map(cat => (
            <div key={cat.name} className="flex justify-between items-center text-xs text-slate-600">
              <span>{cat.name}</span>
              <span className={`text-[10px] font-bold px-1.5 py-px rounded ${RAG_STYLES[cat.status] ?? 'bg-slate-100 text-slate-500'}`}>
                {cat.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 px-3 pt-3 pb-1">Findings</div>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {payload.findings.map(f => (
          <div key={f.id}
            onClick={() => onSelectFinding(f)}
            className={`flex gap-2 items-start px-2 py-1.5 rounded-lg cursor-pointer transition-colors mb-0.5 ${activeFinding?.id === f.id ? 'bg-blue-100' : 'hover:bg-slate-100'}`}>
            <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${FINDING_DOT[f.deviationType] ?? 'bg-slate-400'}`} />
            <span className={`text-xs leading-snug ${activeFinding?.id === f.id ? 'text-blue-700 font-medium' : 'text-slate-600'}`}>
              {f.clauseRef} {f.explanation.slice(0, 60)}{f.explanation.length > 60 ? '…' : ''}
            </span>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-slate-200">
        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">AI Summary</div>
        <p className="text-xs text-slate-500 leading-relaxed">{payload.narrative.slice(0, 200)}{payload.narrative.length > 200 ? '…' : ''}</p>
      </div>
    </div>
  );
}
