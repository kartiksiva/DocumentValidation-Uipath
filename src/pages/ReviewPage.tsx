import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWorkspace } from '../lib/entities';
import { downloadFile, downloadJSON, buildBucketKey } from '../lib/buckets';
import { useTaskPolling } from '../hooks/useTaskPolling';
import ReviewWorkspace from '../components/review/ReviewWorkspace';
import type { ReviewPayload } from '../types/review';

export default function ReviewPage() {
  const { workspaceId, comparisonId } = useParams<{ workspaceId: string; comparisonId: string }>();
  const navigate = useNavigate();
  const [payload, setPayload] = useState<ReviewPayload | null>(null);
  const [docABlob, setDocABlob] = useState<Blob | null>(null);
  const [docBBlob, setDocBBlob] = useState<Blob | null>(null);
  const [filenames, setFilenames] = useState<[string, string]>(['', '']);
  const [loading, setLoading] = useState(true);
  const { tasks } = useTaskPolling();

  // Find the pending task for this comparison by matching comparisonId in task data
  const matchedTaskId = tasks.find(
    t => (t.data as Record<string, unknown> | null)?.comparisonId === comparisonId
  )?.id ?? null;

  useEffect(() => {
    if (!workspaceId || !comparisonId) return;
    const isMounted = { current: true };
    (async () => {
      const ws = await getWorkspace(workspaceId);
      const cmp = ws.comparisons.find(c => c.comparisonId === comparisonId);
      if (!cmp || !isMounted.current) return;
      const vA = ws.versions.find(v => v.versionNumber === cmp.docAVersion);
      const vB = ws.versions.find(v => v.versionNumber === cmp.docBVersion);
      if (!vA || !vB || !isMounted.current) return;
      const reviewKey = buildBucketKey({ workspaceId, comparisonId, artifact: 'review.json' });
      const [review, blobA, blobB] = await Promise.all([
        downloadJSON<ReviewPayload>(reviewKey),
        downloadFile(vA.bucketKey),
        downloadFile(vB.bucketKey),
      ]);
      if (!isMounted.current) return;
      setPayload(review);
      setDocABlob(blobA);
      setDocBBlob(blobB);
      setFilenames([vA.filename, vB.filename]);
      setLoading(false);
    })();
    return () => { isMounted.current = false; };
  }, [workspaceId, comparisonId]);

  if (loading) return <div className="p-6 text-slate-500">Loading review…</div>;
  if (!payload || !docABlob || !docBBlob) return <div className="p-6 text-red-500">Review data not found.</div>;

  return (
    <ReviewWorkspace
      payload={payload}
      taskId={matchedTaskId}
      docABlob={docABlob}
      docBBlob={docBBlob}
      docAFilename={filenames[0]}
      docBFilename={filenames[1]}
      isComplianceMode={payload.mode === 'template-compliance'}
      onDone={() => navigate(`/workspaces/${workspaceId}`)}
    />
  );
}
