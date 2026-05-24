import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WorkspaceBrowser from './WorkspaceBrowser';
import type { ContractWorkspace } from '../../types/workspace';

const mockWorkspace: ContractWorkspace = {
  id: 'ws1', name: 'Acme MSA', description: 'Test', defaultTemplateId: 't1',
  buyerParty: 'Buyer Corp', sellerParty: 'Acme Ltd', contractType: 'Services',
  ownerId: 'u1', createdAt: '2026-05-23T00:00:00Z', versions: [], comparisons: [],
};

describe('WorkspaceBrowser', () => {
  it('renders workspace card', () => {
    render(<MemoryRouter><WorkspaceBrowser workspaces={[mockWorkspace]} /></MemoryRouter>);
    expect(screen.getByText('Acme MSA')).toBeInTheDocument();
    expect(screen.getByText('Buyer Corp → Acme Ltd')).toBeInTheDocument();
  });

  it('filters by search term', () => {
    const ws2 = { ...mockWorkspace, id: 'ws2', name: 'GAFTA Grain', buyerParty: 'TradeA', sellerParty: 'TradeB' };
    render(<MemoryRouter><WorkspaceBrowser workspaces={[mockWorkspace, ws2]} /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'GAFTA' } });
    expect(screen.queryByText('Acme MSA')).not.toBeInTheDocument();
    expect(screen.getByText('GAFTA Grain')).toBeInTheDocument();
  });
});
