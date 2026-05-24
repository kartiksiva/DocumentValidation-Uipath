import { useEffect, useState } from 'react';
import { listGuidelines } from '../lib/entities';
import GuidelineLibrary from '../components/admin/GuidelineLibrary';
import type { Guideline } from '../types/template';

export default function GuidelinesPage() {
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  useEffect(() => { listGuidelines().then(setGuidelines); }, []);
  return (
    <div>
      <div className="px-5 pt-5 pb-3 border-b border-slate-200">
        <h1 className="text-base font-bold text-slate-800">Guideline Library</h1>
        <p className="text-xs text-slate-400">Upload and manage RAG grounding documents</p>
      </div>
      <GuidelineLibrary guidelines={guidelines} onAdd={g => setGuidelines(prev => [...prev, g])} />
    </div>
  );
}
