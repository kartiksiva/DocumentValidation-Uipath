import { useState } from 'react';
import { confirmTask, rejectTask } from '../../lib/tasks';
import type { ReviewPayload } from '../../types/review';

interface Props {
  payload: ReviewPayload;
  taskId: number | null;
  onDone: () => void;
}

export default function ConfirmBar({ payload, taskId, onDone }: Props) {
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (taskId === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await confirmTask(taskId);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to confirm task');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (taskId === null || !rejectNote.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await rejectTask(taskId, rejectNote);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reject task');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center gap-3">
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
        disabled={submitting || taskId === null}
        className="text-xs font-semibold px-4 py-2 rounded-lg bg-white border border-red-200 text-red-500 disabled:opacity-50"
      >
        {showRejectInput ? 'Confirm Rejection' : 'Reject & Escalate'}
      </button>
      <button
        onClick={() => void handleConfirm()}
        disabled={submitting || taskId === null}
        className="text-xs font-semibold px-4 py-2 rounded-lg bg-green-600 text-white shadow-sm disabled:opacity-50"
      >
        {taskId === null ? 'Awaiting Task…' : 'Confirm Review ✓'}
      </button>
      </div>
      {error && <p className="text-xs text-red-500 px-1">{error}</p>}
    </div>
  );
}
