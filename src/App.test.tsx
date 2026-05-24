import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders sidebar brand', () => {
    render(<App />);
    expect(screen.getByText('ContractAI')).toBeInTheDocument();
  });
});
