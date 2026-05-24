import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders loading text', () => {
    render(<App />);
    expect(screen.getByText('ContractAI loading...')).toBeInTheDocument();
  });
});
