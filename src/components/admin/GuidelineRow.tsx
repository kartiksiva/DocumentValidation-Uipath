import type { Guideline } from '../../types/template';

interface Props { guideline: Guideline; }

const STATUS_STYLES = { indexed: 'bg-green-100 text-green-700', indexing: 'bg-amber-100 text-amber-700', error: 'bg-red-100 text-red-700' };

export default function GuidelineRow({ guideline }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-base">📘</div>
        <div className="flex-1">
          <div className="text-sm font-bold text-slate-800">{guideline.name}</div>
          <div className="text-xs text-slate-500">{guideline.description}</div>
        </div>
        <div className="text-xs text-slate-400">{guideline.chunkCount} chunks</div>
        <span className={`text-[11px] font-bold px-2 py-px rounded ${STATUS_STYLES[guideline.indexingStatus] ?? 'bg-slate-100 text-slate-500'}`}>
          {guideline.indexingStatus === 'indexed' ? '● Indexed' : guideline.indexingStatus === 'indexing' ? '● Indexing…' : '● Error'}
        </span>
        <div className="text-xs text-slate-400">
          Used by {guideline.linkedTemplateIds.length} template{guideline.linkedTemplateIds.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
