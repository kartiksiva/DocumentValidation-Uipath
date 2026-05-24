import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import WorkspacesPage from './pages/WorkspacesPage';
import WorkspaceDetailPage from './pages/WorkspaceDetailPage';
import ReviewPage from './pages/ReviewPage';
import TemplatesPage from './pages/TemplatesPage';
import GuidelinesPage from './pages/GuidelinesPage';
import { initBuckets } from './lib/buckets';
export default function App() {
    useEffect(() => {
        void initBuckets().catch(console.error);
    }, []);
    return (_jsx(BrowserRouter, { children: _jsx(Routes, { children: _jsxs(Route, { element: _jsx(AppShell, {}), children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "/workspaces", replace: true }) }), _jsx(Route, { path: "workspaces", element: _jsx(WorkspacesPage, {}) }), _jsx(Route, { path: "workspaces/:workspaceId", element: _jsx(WorkspaceDetailPage, {}) }), _jsx(Route, { path: "workspaces/:workspaceId/comparisons/:comparisonId", element: _jsx(ReviewPage, {}) }), _jsx(Route, { path: "admin/templates", element: _jsx(TemplatesPage, {}) }), _jsx(Route, { path: "admin/guidelines", element: _jsx(GuidelinesPage, {}) })] }) }) }));
}
//# sourceMappingURL=App.js.map