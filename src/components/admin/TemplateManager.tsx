import { useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Template, Guideline } from '../../types/template';
import TemplateCard from './TemplateCard';
import { uploadFile, buildBucketKey } from '../../lib/buckets';
import { createTemplate } from '../../lib/entities';

interface Props { templates: Template[]; guidelines: Guideline[]; onUpdate: (t: Template) => void; onCreate: (t: Template) => void; }

export default function TemplateManager({ templates, guidelines, onUpdate, onCreate }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const templateId = uuidv4();
      const key = buildBucketKey({ templateId, filename: file.name });
      await uploadFile(key, file);
      const template = await createTemplate({
        name: file.name.replace(/\.[^.]+$/, ''),
        description: '',
        bucketKey: key,
        systemMessage: '',
        linkedGuidelineIds: [],
        comparisonMode: 'compliance',
        status: 'draft',
      });
      onCreate(template);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-5 flex flex-col gap-3">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700 leading-relaxed">
        ℹ Each template has its own <strong>system message</strong> — the LLM instruction used when comparing against it. Attach <strong>guideline documents</strong> (e.g. GAFTA, Incoterms) to ground AI analysis with industry-standard definitions.
      </div>
      {templates.map(t => <TemplateCard key={t.id} template={t} guidelines={guidelines} onUpdate={onUpdate} />)}
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center text-slate-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
      >
        <div className="text-xl mb-1">📂</div>
        <div className="text-sm font-semibold">{uploading ? 'Uploading…' : 'Upload New Template'}</div>
        <div className="text-xs">PDF or DOCX · then configure system message and guideline links</div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ''; }} />
    </div>
  );
}
