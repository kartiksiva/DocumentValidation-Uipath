import { useState } from 'react';
import { confirmTask, rejectTask } from '../../lib/tasks';
import type { ReviewPayload } from '../../types/review';

interface Props {
  payload: ReviewPayload;
  onDone: () => void;
}

export default function ConfirmBar({ payload, onDone }: Props) {
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const taskId = Number(payload.taskId);

  async function handleConfirm() {
    setSubmitting(true);
    await confirmTask(taskId);
    onDone();
  }

  async function handleReject() {
    if (!rejectNote.trim()) return;
    setSubmitting(true);
    await rejectTask(taskId, rejectNote);
    onDone();
  }

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3 flex items-center gap-3">
      <span className="text-xs text-slate-400 flex-1">Human task · {payload.comparisonId}</span>
      {showRejectInput && (
        <input
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs flex-1 max-w-xs outline-none"
          placeholder="Rejection reason (required)…"
          value={rejectNote}
          onChange={e => setRejectNote(e.target.value)}
        />
      )}
      <button
        onClick={() => showRejectInput ? void handleReject() : setShowRejectInput(true)}
        disabled={submitting}
        className="text-xs font-semibold px-4 py-2 rounded-lg bg-white border border-red-200 text-red-500 disabled:opacity-50"
      >
        {showRejectInput ? 'Confirm Rejection' : 'Reject & Escalate'}
      </button>
      <button
        onClick={() => void handleConfirm()}
        disabled={submitting}
        className="text-xs font-semibold px-4 py-2 rounded-lg bg-green-600 text-white shadow-sm disabled:opacity-50"
      >
        Confirm Review ✓
      </button>
    </div>
  );
}
