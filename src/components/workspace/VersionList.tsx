import { useRef, useState } from 'react';
import type { WorkspaceVersion } from '../../types/workspace';

interface Props {
  versions: WorkspaceVersion[];
  onUpload: (file: File) => Promise<void>;
}

export default function VersionList({ versions, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      await onUpload(files[0]!);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-800">📄 Contract Versions</span>
        <button onClick={() => inputRef.current?.click()} className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5">+ Upload Version</button>
      </div>
      <div className="divide-y divide-slate-100 p-3">
        {[...versions].reverse().map(v => (
          <div key={v.versionNumber} className="flex items-center gap-3 py-2.5">
            <span className={`text-[11px] font-bold px-2 py-px rounded min-w-[28px] text-center ${v.versionNumber === versions.length ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
              v{v.versionNumber}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-800 truncate">{v.filename}</div>
              <div className="text-[11px] text-slate-400">
                {new Date(v.uploadedAt).toLocaleDateString()} · {v.uploadedBy} · {(v.fileSizeBytes / 1024).toFixed(0)} KB
              </div>
            </div>
          </div>
        ))}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); void handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className="mt-2 border-2 border-dashed border-slate-200 rounded-lg p-3 text-center text-xs text-slate-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
        >
          {uploading ? '⏳ Uploading…' : '⬆ Drop new version or click to upload'}
        </div>
        {error && <p className="text-xs text-red-500 mt-1 px-1">{error}</p>}
        <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => void handleFiles(e.target.files)} />
      </div>
    </div>
  );
}
