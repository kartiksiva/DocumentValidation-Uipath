import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEntity = {
  id: 'ws1', name: 'Acme MSA', description: '', defaultTemplateId: 't1',
  buyerParty: 'Buyer Corp', sellerParty: 'Acme Ltd', contractType: 'Services',
  ownerId: 'user1', createdAt: '2026-05-23T00:00:00Z', versions: [], comparisons: [],
};

const mockEntityDef = {
  name: 'ContractWorkspace',
  id: 'entity-uuid-ws',
  getAllRecords: vi.fn().mockResolvedValue({ items: [mockEntity] }),
  getRecord: vi.fn().mockResolvedValue(mockEntity),
  insertRecord: vi.fn().mockResolvedValue(mockEntity),
  updateRecord: vi.fn().mockResolvedValue(mockEntity),
};

vi.mock('./sdk', () => ({
  getSDK: vi.fn().mockResolvedValue({
    entities: {
      getAll: vi.fn().mockResolvedValue([mockEntityDef]),
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
