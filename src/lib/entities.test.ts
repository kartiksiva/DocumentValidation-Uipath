import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEntity = {
  id: 'ws1', name: 'Acme MSA', description: '', defaultTemplateId: 't1',
  buyerParty: 'Buyer Corp', sellerParty: 'Acme Ltd', contractType: 'Services',
  ownerId: 'user1', createdAt: '2026-05-23T00:00:00Z', versions: [], comparisons: [],
};

vi.mock('./sdk', () => ({
  getSDK: vi.fn().mockResolvedValue({
    Entities: {
      list: vi.fn().mockResolvedValue({ value: [mockEntity] }),
      getById: vi.fn().mockResolvedValue(mockEntity),
      create: vi.fn().mockResolvedValue(mockEntity),
      update: vi.fn().mockResolvedValue(mockEntity),
    },
  }),
}));

describe('entities', () => {
  beforeEach(() => vi.clearAllMocks());

  it('listWorkspaces returns array', async () => {
    const { listWorkspaces } = await import('./entities');
    const result = await listWorkspaces();
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Acme MSA');
  });

  it('getWorkspace returns single workspace', async () => {
    const { getWorkspace } = await import('./entities');
    const result = await getWorkspace('ws1');
    expect(result.id).toBe('ws1');
  });
});
