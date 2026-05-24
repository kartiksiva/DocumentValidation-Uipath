import { useEffect, useState } from 'react';
import { listTemplates, listGuidelines } from '../lib/entities';
import TemplateManager from '../components/admin/TemplateManager';
import type { Template, Guideline } from '../types/template';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);

  useEffect(() => {
    Promise.all([listTemplates(), listGuidelines()]).then(([t, g]) => { setTemplates(t); setGuidelines(g); });
  }, []);

  return (
    <div>
      <div className="px-5 pt-5 pb-3 border-b border-slate-200 flex items-center justify-between">
        <div><h1 className="text-base font-bold text-slate-800">Template & Context Management</h1>
          <p className="text-xs text-slate-400">Configure templates, system prompts, and grounding documents</p></div>
        <button className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg">+ New Template</button>
      </div>
      <TemplateManager templates={templates} guidelines={guidelines}
        onUpdate={t => setTemplates(prev => prev.map(p => p.id === t.id ? t : p))}
        onCreate={t => setTemplates(prev => [...prev, t])} />
    </div>
  );
}
