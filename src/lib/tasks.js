import { getSDK } from './sdk';
import { TaskStatus, TaskType } from '@uipath/uipath-typescript';
export async function listPendingTasks() {
    const sdk = await getSDK();
    const result = await sdk.tasks.getAll();
    return result.items
        .filter((t) => t.status === TaskStatus.Pending)
        .map((t) => ({ id: t.id, status: t.status, data: t.data ?? null }));
}
export async function confirmTask(taskId, note) {
    const sdk = await getSDK();
    const task = await sdk.tasks.getById(taskId);
    await task.complete({ type: TaskType.External, action: 'Confirm', data: { note: note ?? '' } });
}
export async function rejectTask(taskId, note) {
    const sdk = await getSDK();
    const task = await sdk.tasks.getById(taskId);
    await task.complete({ type: TaskType.External, action: 'Reject', data: { note } });
}
//# sourceMappingURL=tasks.js.map