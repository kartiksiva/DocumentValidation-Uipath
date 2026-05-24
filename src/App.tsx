import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import WorkspacesPage from './pages/WorkspacesPage';
import WorkspaceDetailPage from './pages/WorkspaceDetailPage';
import ReviewPage from './pages/ReviewPage';
import TemplatesPage from './pages/TemplatesPage';
import GuidelinesPage from './pages/GuidelinesPage';
import { initBuckets } from './lib/buckets';

export default function App() {
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initBuckets().catch(e => {
      setInitError(e instanceof Error ? e.message : 'Bucket initialization failed');
    });
  }, []);

  if (initError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 max-w-md">
          <p className="text-red-500 font-semibold mb-1">Initialization failed</p>
          <p className="text-slate-500 text-sm">{initError}</p>
        </div>
      </div>
    );
  }
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
