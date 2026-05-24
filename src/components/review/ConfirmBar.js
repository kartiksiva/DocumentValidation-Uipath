import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { confirmTask, rejectTask } from '../../lib/tasks';
export default function ConfirmBar({ payload, onDone }) {
    const [rejectNote, setRejectNote] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const taskId = Number(payload.taskId);
    async function handleConfirm() {
        setSubmitting(true);
        setError(null);
        try {
            await confirmTask(taskId);
            onDone();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to confirm task');
        }
        finally {
            setSubmitting(false);
        }
    }
    async function handleReject() {
        if (!rejectNote.trim())
            return;
        setSubmitting(true);
        setError(null);
        try {
            await rejectTask(taskId, rejectNote);
            onDone();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to reject task');
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsxs("div", { className: "border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-2", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("span", { className: "text-xs text-slate-400 flex-1", children: ["Human task \u00B7 ", payload.comparisonId] }), showRejectInput && (_jsx("input", { className: "border border-slate-200 rounded-lg px-3 py-1.5 text-xs flex-1 max-w-xs outline-none", placeholder: "Rejection reason (required)\u2026", value: rejectNote, onChange: e => setRejectNote(e.target.value) })), _jsx("button", { onClick: () => showRejectInput ? void handleReject() : setShowRejectInput(true), disabled: submitting, className: "text-xs font-semibold px-4 py-2 rounded-lg bg-white border border-red-200 text-red-500 disabled:opacity-50", children: showRejectInput ? 'Confirm Rejection' : 'Reject & Escalate' }), _jsx("button", { onClick: () => void handleConfirm(), disabled: submitting, className: "text-xs font-semibold px-4 py-2 rounded-lg bg-green-600 text-white shadow-sm disabled:opacity-50", children: "Confirm Review \u2713" })] }), error && _jsx("p", { className: "text-xs text-red-500 px-1", children: error })] }));
}
//# sourceMappingURL=ConfirmBar.js.map