import { getSDK } from './sdk';
import { TaskStatus, TaskType } from '@uipath/uipath-typescript';

export interface PendingTask {
  id: number;
  status: TaskStatus;
  data: Record<string, unknown> | null;
}

export async function listPendingTasks(): Promise<PendingTask[]> {
  const sdk = await getSDK();
  const result = await sdk.tasks.getAll();
  return result.items
    .filter((t) => t.status === TaskStatus.Pending)
    .map((t) => ({ id: t.id, status: t.status, data: t.data ?? null }));
}

export async function confirmTask(taskId: number, note?: string): Promise<void> {
  const sdk = await getSDK();
  const task = await sdk.tasks.getById(taskId);
  await task.complete({ type: TaskType.External, action: 'Confirm', data: { note: note ?? '' } });
}

export async function rejectTask(taskId: number, note: string): Promise<void> {
  const sdk = await getSDK();
  const task = await sdk.tasks.getById(taskId);
  await task.complete({ type: TaskType.External, action: 'Reject', data: { note } });
}
