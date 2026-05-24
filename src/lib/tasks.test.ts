import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskStatus } from '@uipath/uipath-typescript';

const mockTask = {
  id: 1,
  status: TaskStatus.Pending,
  data: { comparisonId: 'cmp1' },
  complete: vi.fn().mockResolvedValue(undefined),
};

vi.mock('./sdk', () => ({
  getSDK: vi.fn().mockResolvedValue({
    tasks: {
      getAll: vi.fn().mockResolvedValue({
        items: [mockTask],
      }),
      getById: vi.fn().mockResolvedValue(mockTask),
    },
  }),
}));

describe('tasks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('listPendingTasks returns pending tasks', async () => {
    const { listPendingTasks } = await import('./tasks');
    const tasks = await listPendingTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.id).toBe(1);
  });
});
