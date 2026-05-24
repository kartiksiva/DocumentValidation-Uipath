import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWorkspace } from '../lib/entities';
import { downloadFile, downloadJSON, buildBucketKey } from '../lib/buckets';
import ReviewWorkspace from '../components/review/ReviewWorkspace';
export default function ReviewPage() {
    const { workspaceId, comparisonId } = useParams();
    const navigate = useNavigate();
    const [payload, setPayload] = useState(null);
    const [docABlob, setDocABlob] = useState(null);
    const [docBBlob, setDocBBlob] = useState(null);
    const [filenames, setFilenames] = useState(['', '']);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!workspaceId || !comparisonId)
            return;
        const isMounted = { current: true };
        (async () => {
            const ws = await getWorkspace(workspaceId);
            const cmp = ws.comparisons.find(c => c.comparisonId === comparisonId);
            if (!cmp || !isMounted.current)
                return;
            const vA = ws.versions.find(v => v.versionNumber === cmp.docAVersion);
            const vB = ws.versions.find(v => v.versionNumber === cmp.docBVersion);
            const reviewKey = buildBucketKey({ workspaceId, comparisonId, artifact: 'review.json' });
            const [review, blobA, blobB] = await Promise.all([
                downloadJSON(reviewKey),
                downloadFile(vA.bucketKey),
                downloadFile(vB.bucketKey),
            ]);
            if (!isMounted.current)
                return;
            setPayload(review);
            setDocABlob(blobA);
            setDocBBlob(blobB);
            setFilenames([vA.filename, vB.filename]);
            setLoading(false);
        })();
        return () => { isMounted.current = false; };
    }, [workspaceId, comparisonId]);
    if (loading)
        return _jsx("div", { className: "p-6 text-slate-500", children: "Loading review\u2026" });
    if (!payload || !docABlob || !docBBlob)
        return _jsx("div", { className: "p-6 text-red-500", children: "Review data not found." });
    return (_jsx(ReviewWorkspace, { payload: payload, docABlob: docABlob, docBBlob: docBBlob, docAFilename: filenames[0], docBFilename: filenames[1], isComplianceMode: payload.mode === 'template-compliance', onDone: () => navigate(`/workspaces/${workspaceId}`) }));
}
//# sourceMappingURL=ReviewPage.js.map