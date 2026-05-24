import { jsx as _jsx } from "react/jsx-runtime";
import { render } from '@testing-library/react';
import HighlightLayer from './HighlightLayer';
describe('HighlightLayer', () => {
    it('renders without crashing when no active finding', () => {
        const { container } = render(_jsx("div", { id: "doc-panel", children: _jsx(HighlightLayer, { panelId: "doc-panel", activeFinding: null, findings: [] }) }));
        expect(container).toBeTruthy();
    });
});
//# sourceMappingURL=HighlightLayer.test.js.map