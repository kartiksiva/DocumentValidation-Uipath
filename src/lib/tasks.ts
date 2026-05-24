import { getSDK } from './sdk';

export interface PendingTask {
  id: string;
  status: string;
  data: Record<string, unknown>;
}

export async function listPendingTasks(): Promise<PendingTask[]> {
  const sdk = await getSDK();
  const result = await sdk.Tasks.list({ status: 'Pending' });
  return result.value as PendingTask[];
}

export async function confirmTask(taskId: string, note?: string): Promise<void> {
  const sdk = await getSDK();
  await sdk.Tasks.complete({ taskId, action: 'Confirm', data: { note: note ?? '' } });
}

export async function rejectTask(taskId: string, note: string): Promise<void> {
  const sdk = await getSDK();
  await sdk.Tasks.complete({ taskId, action: 'Reject', data: { note } });
}
