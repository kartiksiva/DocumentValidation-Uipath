import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockWorkspace = {
  id: 'ws1', name: 'Acme MSA', description: '', defaultTemplateId: 't1',
  buyerParty: 'Buyer Corp', sellerParty: 'Acme Ltd', contractType: 'Services',
  ownerId: 'user1', createdAt: '2026-05-23T00:00:00Z', versions: [], comparisons: [],
};

const mockStore = {
  listWorkspaces: vi.fn().mockResolvedValue([mockWorkspace]),
  getWorkspace: vi.fn().mockResolvedValue(mockWorkspace),
  createWorkspace: vi.fn().mockResolvedValue(mockWorkspace),
  updateWorkspace: vi.fn().mockResolvedValue(mockWorkspace),
  listTemplates: vi.fn().mockResolvedValue([]),
  getTemplate: vi.fn().mockResolvedValue({}),
  createTemplate: vi.fn().mockResolvedValue({}),
  updateTemplate: vi.fn().mockResolvedValue({}),
  listGuidelines: vi.fn().mockResolvedValue([]),
  createGuideline: vi.fn().mockResolvedValue({}),
  updateGuideline: vi.fn().mockResolvedValue({}),
};

vi.mock('./entity-providers', () => ({
  getStore: vi.fn().mockResolvedValue(mockStore),
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
