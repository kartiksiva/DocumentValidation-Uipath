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
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/workspaces" replace />} />
          <Route path="workspaces" element={<WorkspacesPage />} />
          <Route path="workspaces/:workspaceId" element={<WorkspaceDetailPage />} />
          <Route path="workspaces/:workspaceId/comparisons/:comparisonId" element={<ReviewPage />} />
          <Route path="admin/templates" element={<TemplatesPage />} />
          <Route path="admin/guidelines" element={<GuidelinesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
