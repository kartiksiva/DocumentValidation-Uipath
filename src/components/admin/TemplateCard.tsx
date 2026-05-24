import { useState } from 'react';
import type { Template, Guideline } from '../../types/template';
import { updateTemplate } from '../../lib/entities';

interface Props { template: Template; guidelines: Guideline[]; onUpdate: (t: Template) => void; }

export default function TemplateCard({ template, guidelines, onUpdate }: Props) {
  const [systemMessage, setSystemMessage] = useState(template.systemMessage);
  const [saving, setSaving] = useState(false);
  const linked = guidelines.filter(g => template.linkedGuidelineIds.includes(g.id));

  async function handleSave() {
    setSaving(true);
    const updated = await updateTemplate(template.id, { systemMessage });
    onUpdate(updated);
    setSaving(false);
  }

  async function handleRemoveGuideline(gId: string) {
    const updated = await updateTemplate(template.id, {
      linkedGuidelineIds: template.linkedGuidelineIds.filter(id => id !== gId),
    });
    onUpdate(updated);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-lg">📄</div>
        <div className="flex-1">
          <div className="text-sm font-bold text-slate-800">{template.name}</div>
          <div className="text-xs text-slate-500">{template.description}</div>
        </div>
        <span className={`text-[11px] font-bold px-2 py-px rounded ${template.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {template.status}
        </span>
      </div>
      <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100">
        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-3 mb-1.5 flex items-center gap-2">
          🤖 System Message <span className="text-purple-500 font-bold">LLM INSTRUCTION</span>
        </div>
        <textarea
          value={systemMessage}
          onChange={e => setSystemMessage(e.target.value)}
          rows={4}
          className="w-full border-l-4 border-l-purple-400 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-700 bg-white resize-none outline-none focus:border-purple-300"
        />
        <button onClick={() => void handleSave()} disabled={saving}
          className="mt-2 text-xs font-semibold bg-purple-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
          {saving ? 'Saving…' : 'Save System Message'}
        </button>

        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-3 mb-1.5">📚 Grounding Documents</div>
        <div className="flex flex-wrap gap-1.5">
          {linked.map(g => (
            <div key={g.id} className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600">
              📘 {g.name}
              <button onClick={() => void handleRemoveGuideline(g.id)} className="text-slate-300 hover:text-red-400 text-[11px] ml-1">×</button>
            </div>
          ))}
          <button className="bg-slate-50 border border-dashed border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-400 hover:border-blue-400 hover:text-blue-500">
            + Add guideline
          </button>
        </div>
      </div>
    </div>
  );
}
