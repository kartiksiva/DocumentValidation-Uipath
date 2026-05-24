import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import App from './App';
describe('App', () => {
    it('renders sidebar brand', () => {
        render(_jsx(App, {}));
        expect(screen.getByText('ContractAI')).toBeInTheDocument();
    });
});
//# sourceMappingURL=App.test.js.map