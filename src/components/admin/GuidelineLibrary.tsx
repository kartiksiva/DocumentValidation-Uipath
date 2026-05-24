import type { Guideline } from '../../types/template';
import GuidelineRow from './GuidelineRow';

interface Props { guidelines: Guideline[]; }

export default function GuidelineLibrary({ guidelines }: Props) {
  return (
    <div className="p-5 flex flex-col gap-3">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700 leading-relaxed">
        🔍 Upload guideline documents (GAFTA, Incoterms, internal policies). Each is extracted, chunked, and indexed into the vector store. Link guidelines to templates in the Template Manager.
      </div>
      {guidelines.map(g => <GuidelineRow key={g.id} guideline={g} />)}
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center text-slate-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
        <div className="text-xl mb-1">📚</div>
        <div className="text-sm font-semibold">Upload Guideline Document</div>
        <div className="text-xs">PDF or DOCX · auto-extracted, chunked, and indexed for RAG</div>
      </div>
    </div>
  );
}
