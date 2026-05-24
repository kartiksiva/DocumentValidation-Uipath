import { useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Guideline } from '../../types/template';
import GuidelineRow from './GuidelineRow';
import { uploadFile, buildBucketKey } from '../../lib/buckets';
import { createGuideline } from '../../lib/entities';

interface Props { guidelines: Guideline[]; onAdd: (g: Guideline) => void; }

export default function GuidelineLibrary({ guidelines, onAdd }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const guidelineId = uuidv4();
      const key = buildBucketKey({ guidelineId, filename: file.name });
      await uploadFile(key, file);
      const guideline = await createGuideline({
        name: file.name.replace(/\.[^.]+$/, ''),
        description: '',
        bucketKey: key,
        chunkCount: 0,
        indexingStatus: 'indexing',
        linkedTemplateIds: [],
        uploadedAt: new Date().toISOString(),
      });
      onAdd(guideline);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-5 flex flex-col gap-3">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700 leading-relaxed">
        🔍 Upload guideline documents (GAFTA, Incoterms, internal policies). Each is extracted, chunked, and indexed into the vector store. Link guidelines to templates in the Template Manager.
      </div>
      {guidelines.map(g => <GuidelineRow key={g.id} guideline={g} />)}
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center text-slate-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
      >
        <div className="text-xl mb-1">📚</div>
        <div className="text-sm font-semibold">{uploading ? 'Uploading…' : 'Upload Guideline Document'}</div>
        <div className="text-xs">PDF or DOCX · auto-extracted, chunked, and indexed for RAG</div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ''; }} />
    </div>
  );
}
