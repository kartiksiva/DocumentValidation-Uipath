import { describe, it, expect, vi } from 'vitest';

vi.mock('./sdk', () => ({
  getSDK: vi.fn().mockResolvedValue({
    Tasks: {
      list: vi.fn().mockResolvedValue({
        value: [{ id: 'task1', status: 'Pending', data: { comparisonId: 'cmp1' } }],
      }),
      complete: vi.fn().mockResolvedValue(undefined),
    },
  }),
}));

describe('tasks', () => {
  it('listPendingTasks returns pending tasks', async () => {
    const { listPendingTasks } = await import('./tasks');
    const tasks = await listPendingTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.id).toBe('task1');
  });
});
