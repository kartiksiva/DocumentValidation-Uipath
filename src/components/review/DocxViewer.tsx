import { useEffect, useState } from 'react';
import mammoth from 'mammoth';

interface Props { blob: Blob; className?: string; }

export default function DocxViewer({ blob, className }: Props) {
  const [html, setHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    blob.arrayBuffer()
      .then(buf => mammoth.convertToHtml({ arrayBuffer: buf }))
      .then(result => setHtml(result.value))
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to render document'));
  }, [blob]);

  if (error) return <div className="p-4 text-red-500 text-xs">{error}</div>;
  if (!html) return <div className="p-4 text-slate-400 text-xs">Rendering document…</div>;

  return (
    <div
      className={`prose prose-sm max-w-none p-4 font-serif text-slate-700 ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
