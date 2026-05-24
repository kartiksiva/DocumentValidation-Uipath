import type { Template, Guideline } from '../../types/template';
import TemplateCard from './TemplateCard';

interface Props { templates: Template[]; guidelines: Guideline[]; onUpdate: (t: Template) => void; }

export default function TemplateManager({ templates, guidelines, onUpdate }: Props) {
  return (
    <div className="p-5 flex flex-col gap-3">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700 leading-relaxed">
        ℹ Each template has its own <strong>system message</strong> — the LLM instruction used when comparing against it. Attach <strong>guideline documents</strong> (e.g. GAFTA, Incoterms) to ground AI analysis with industry-standard definitions.
      </div>
      {templates.map(t => <TemplateCard key={t.id} template={t} guidelines={guidelines} onUpdate={onUpdate} />)}
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center text-slate-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
        <div className="text-xl mb-1">📂</div>
        <div className="text-sm font-semibold">Upload New Template</div>
        <div className="text-xs">PDF or DOCX · then configure system message and guideline links</div>
      </div>
    </div>
  );
}
