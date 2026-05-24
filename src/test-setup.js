import '@testing-library/jest-dom';
// react-pdf uses DOMMatrix not available in jsdom
vi.mock('react-pdf', () => ({
    Document: () => null,
    Page: () => null,
    pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
}));
//# sourceMappingURL=test-setup.js.map