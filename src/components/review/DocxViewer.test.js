import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, waitFor } from '@testing-library/react';
import DocxViewer from './DocxViewer';
vi.mock('mammoth', () => ({
    default: {
        convertToHtml: vi.fn().mockResolvedValue({ value: '<p>Clause <strong>5</strong>. Liability cap text.</p>' }),
    },
}));
describe('DocxViewer', () => {
    it('renders converted HTML from mammoth', async () => {
        const blob = new Blob(['fake docx'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        render(_jsx(DocxViewer, { blob: blob }));
        await waitFor(() => expect(screen.getByText(/Liability cap text/)).toBeInTheDocument());
    });
});
//# sourceMappingURL=DocxViewer.test.js.map