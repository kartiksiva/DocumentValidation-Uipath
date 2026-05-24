# Contract Comparison Agent — Implementation Plan (Plan A: Coded App)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a UiPath Coded App (React + Vite) that lets business users manage contract workspaces, trigger Maestro-based AI comparisons, render both documents with AI findings highlighted inline, and confirm/reject the review as a Maestro human task.

**Architecture:** React + Vite frontend using `@uipath/uipath-typescript` SDK directly in the browser — no separate backend. SDK calls UiPath Buckets (file storage), Entities (workspace/template registry), MaestroProcesses (trigger comparison), and Tasks (human task confirm/reject). Maestro process and agents are a separate UiPath Studio project (Plan B).

**Tech Stack:** React 18, Vite, TypeScript, react-router-dom v6, react-pdf, mammoth, mark.js, @uipath/coded-apps-dev, vitest, @testing-library/react, Tailwind CSS, @uipath/uipath-typescript

**Spec:** `docs/superpowers/specs/2026-05-23-contract-comparison-agent-design.md`
**Plan B (Maestro):** `docs/superpowers/plans/2026-05-23-maestro-agents-plan.md`

---

## File Map

```
src/
  main.tsx
  App.tsx
  types/
    workspace.ts          # ContractWorkspace, Version, Comparison
    template.ts           # Template, Guideline
    review.ts             # Finding, Scorecard, DiffJSON, ReviewPayload
  lib/
    sdk.ts                # SDK singleton + initialize()
    buckets.ts            # upload / download / buildKey helpers
    entities.ts           # Workspace + Template CRUD
    maestro.ts            # startComparison()
    tasks.ts              # listPendingTasks() / completeTask()
  hooks/
    useTaskPolling.ts     # 5s poll, returns pending tasks
    useWorkspace.ts       # workspace fetch + mutate
  components/
    layout/
      AppShell.tsx        # nav sidebar + outlet
      Sidebar.tsx         # flat nav items + badges
    workspace/
      WorkspaceBrowser.tsx   # card grid + search/filter
      WorkspaceCard.tsx      # single card
      WorkspaceDetail.tsx    # versions + run form + history
      VersionList.tsx        # version rows + drop zone
      RunComparisonForm.tsx  # trigger maestro
      ComparisonHistory.tsx  # history rows
    review/
      ReviewWorkspace.tsx    # full review layout
      DocumentPanel.tsx      # PDF or DOCX router
      PdfViewer.tsx          # react-pdf renderer
      DocxViewer.tsx         # mammoth → HTML
      FindingsSidebar.tsx    # scorecard + findings + summary
      HighlightLayer.tsx     # mark.js fuzzy highlight
      ConfirmBar.tsx         # confirm / reject bar
    admin/
      TemplateManager.tsx
      TemplateCard.tsx
      GuidelineLibrary.tsx
      GuidelineRow.tsx
  pages/
    WorkspacesPage.tsx
    WorkspaceDetailPage.tsx
    ReviewPage.tsx
    TemplatesPage.tsx
    GuidelinesPage.tsx
index.html
vite.config.ts
uipath.json               # Coded App OAuth config
tailwind.config.ts
postcss.config.ts
```

---

## Task 1: Vite + React Scaffold

**Files:**
- Modify: `package.json`
- Create: `vite.config.ts`, `index.html`, `src/main.tsx`, `tailwind.config.ts`, `postcss.config.ts`

- [ ] **Step 1: Install dependencies**

```bash
npm install react react-dom react-router-dom react-pdf mammoth mark.js
npm install -D vite @vitejs/plugin-react tailwindcss postcss autoprefixer \
  @uipath/coded-apps-dev vitest @testing-library/react @testing-library/jest-dom \
  @types/react @types/react-dom @types/mammoth jsdom
npx tailwindcss init -p
```

- [ ] **Step 2: Update `package.json` scripts**

```json
{
  "name": "my-uipath-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@uipath/uipath-typescript": "^1.3.8",
    "mammoth": "^1.8.0",
    "mark.js": "^8.11.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-pdf": "^9.2.1",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.0",
    "@types/mammoth": "^1.5.4",
    "@types/mark.js": "^8.11.12",
    "@types/node": "^25.8.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@uipath/coded-apps-dev": "latest",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "ts-node": "^10.9.2",
    "typescript": "^6.0.3",
    "vite": "^6.0.1",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 3: Create `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import codedAppsDev from '@uipath/coded-apps-dev/vite';

export default defineConfig({
  base: './',
  plugins: [react(), codedAppsDev()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
});
```

- [ ] **Step 4: Create `src/test-setup.ts`**

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 5: Create `tsconfig.json`** (replace existing)

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "types": ["vitest/globals"]
  },
  "include": ["src", "vite.config.ts"]
}
```

- [ ] **Step 6: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ContractAI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create `tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss';
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 8: Create `src/main.tsx`**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 9: Create `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 10: Verify dev server starts**

```bash
npm run dev
```
Expected: Vite dev server at `http://localhost:5173` with blank page, no console errors.

- [ ] **Step 11: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold React + Vite Coded App"
```

---

## Task 2: Domain Types

**Files:**
- Create: `src/types/workspace.ts`, `src/types/template.ts`, `src/types/review.ts`

- [ ] **Step 1: Create `src/types/workspace.ts`**

```typescript
export type ComparisonMode = 'buyer-seller-diff' | 'template-compliance';
export type ComparisonStatus = 'running' | 'awaiting-review' | 'confirmed' | 'rejected';

export interface WorkspaceVersion {
  versionNumber: number;
  bucketKey: string;
  filename: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSizeBytes: number;
}

export interface WorkspaceComparison {
  comparisonId: string;
  docAVersion: number;
  docBVersion: number;
  mode: ComparisonMode;
  templateId: string;
  includeVersionHistory: boolean;
  status: ComparisonStatus;
  confirmedBy?: string;
  confirmedAt?: string;
  rejectionNote?: string;
  startedAt: string;
  findingSummary?: {
    high: number;
    medium: number;
    aligned: number;
    missing: number;
    modified: number;
    extra: number;
  };
}

export interface ContractWorkspace {
  id: string;
  name: string;
  description: string;
  defaultTemplateId: string;
  buyerParty: string;
  sellerParty: string;
  contractType: string;
  ownerId: string;
  createdAt: string;
  versions: WorkspaceVersion[];
  comparisons: WorkspaceComparison[];
}
```

- [ ] **Step 2: Create `src/types/template.ts`**

```typescript
export type TemplateStatus = 'active' | 'draft';
export type GuidelineStatus = 'indexing' | 'indexed' | 'error';
export type TemplateMode = 'buyer-seller' | 'compliance';

export interface Template {
  id: string;
  name: string;
  description: string;
  bucketKey: string;
  systemMessage: string;
  linkedGuidelineIds: string[];
  comparisonMode: TemplateMode;
  status: TemplateStatus;
}

export interface Guideline {
  id: string;
  name: string;
  description: string;
  bucketKey: string;
  chunkCount: number;
  indexingStatus: GuidelineStatus;
  linkedTemplateIds: string[];
  uploadedAt: string;
}
```

- [ ] **Step 3: Create `src/types/review.ts`**

```typescript
export type DeviationType = 'high-risk' | 'medium-risk' | 'aligned' | 'missing' | 'modified' | 'extra';
export type RagStatus = 'HIGH' | 'MEDIUM' | 'OK' | 'MISSING' | 'MODIFIED' | 'EXTRA';

export interface Finding {
  id: string;
  clauseRef: string;
  deviationType: DeviationType;
  snippetA: string;
  snippetB?: string;
  explanation: string;
  guidelineCitation?: string;
  insertAfterClause?: string;
}

export interface ScorecardCategory {
  name: string;
  status: RagStatus;
  summary: string;
}

export interface ReviewPayload {
  comparisonId: string;
  workspaceId: string;
  mode: string;
  scorecard: ScorecardCategory[];
  compliancePercent?: number;
  findings: Finding[];
  narrative: string;
  taskId: string;
}
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/types/
git commit -m "feat: add domain types for workspace, template, review"
```

---

## Task 3: SDK Singleton + uipath.json

**Files:**
- Create: `src/lib/sdk.ts`, `uipath.json`
- Test: `src/lib/sdk.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/lib/sdk.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('@uipath/uipath-typescript', () => ({
  UiPath: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    Buckets: {},
    Entities: {},
    MaestroProcesses: {},
    Tasks: {},
  })),
}));

describe('sdk', () => {
  it('returns same instance on repeated calls', async () => {
    const { getSDK } = await import('./sdk');
    const a = await getSDK();
    const b = await getSDK();
    expect(a).toBe(b);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test src/lib/sdk.test.ts
```
Expected: FAIL — `Cannot find module './sdk'`

- [ ] **Step 3: Create `src/lib/sdk.ts`**

```typescript
import { UiPath } from '@uipath/uipath-typescript';

let instance: InstanceType<typeof UiPath> | null = null;

export async function getSDK(): Promise<InstanceType<typeof UiPath>> {
  if (instance) return instance;
  instance = new UiPath();
  await instance.initialize();
  return instance;
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test src/lib/sdk.test.ts
```
Expected: PASS

- [ ] **Step 5: Create `uipath.json`** (fill in your org/tenant before deploying)

```json
{
  "clientId": "YOUR_CLIENT_ID",
  "scopes": [
    "OR.Buckets",
    "OR.Entities",
    "OR.Tasks",
    "OR.Maestro",
    "OR.Jobs"
  ],
  "organization": "YOUR_ORG_NAME",
  "tenant": "YOUR_TENANT_NAME",
  "baseUrl": "https://cloud.uipath.com"
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/sdk.ts src/lib/sdk.test.ts uipath.json
git commit -m "feat: add SDK singleton and uipath.json config"
```

---

## Task 4: Bucket Utilities

**Files:**
- Create: `src/lib/buckets.ts`, `src/lib/buckets.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/buckets.test.ts
import { describe, it, expect } from 'vitest';
import { buildBucketKey } from './buckets';

describe('buildBucketKey', () => {
  it('builds workspace version key', () => {
    const key = buildBucketKey({ workspaceId: 'ws1', versionNumber: 3, filename: 'doc.pdf' });
    expect(key).toBe('workspaces/ws1/versions/v3/doc.pdf');
  });

  it('builds comparison result key', () => {
    const key = buildBucketKey({ workspaceId: 'ws1', comparisonId: 'cmp1', artifact: 'findings.json' });
    expect(key).toBe('workspaces/ws1/comparisons/cmp1/findings.json');
  });

  it('builds template key', () => {
    const key = buildBucketKey({ templateId: 't1', filename: 'template.pdf' });
    expect(key).toBe('templates/t1/template.pdf');
  });

  it('builds guideline key', () => {
    const key = buildBucketKey({ guidelineId: 'g1', filename: 'source.pdf' });
    expect(key).toBe('guidelines/g1/source.pdf');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test src/lib/buckets.test.ts
```

- [ ] **Step 3: Create `src/lib/buckets.ts`**

```typescript
import { getSDK } from './sdk';

const BUCKET_NAME = 'contract-ai';

type VersionKeyParams = { workspaceId: string; versionNumber: number; filename: string };
type ComparisonKeyParams = { workspaceId: string; comparisonId: string; artifact: string };
type TemplateKeyParams = { templateId: string; filename: string };
type GuidelineKeyParams = { guidelineId: string; filename: string };

export function buildBucketKey(
  params: VersionKeyParams | ComparisonKeyParams | TemplateKeyParams | GuidelineKeyParams
): string {
  if ('versionNumber' in params) {
    return `workspaces/${params.workspaceId}/versions/v${params.versionNumber}/${params.filename}`;
  }
  if ('comparisonId' in params) {
    return `workspaces/${params.workspaceId}/comparisons/${params.comparisonId}/${params.artifact}`;
  }
  if ('templateId' in params) {
    return `templates/${params.templateId}/${params.filename}`;
  }
  return `guidelines/${params.guidelineId}/${params.filename}`;
}

export async function uploadFile(key: string, file: File): Promise<void> {
  const sdk = await getSDK();
  await sdk.Buckets.upload({ bucketName: BUCKET_NAME, key, file });
}

export async function downloadFile(key: string): Promise<Blob> {
  const sdk = await getSDK();
  return sdk.Buckets.download({ bucketName: BUCKET_NAME, key });
}

export async function uploadJSON(key: string, data: unknown): Promise<void> {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const file = new File([blob], key.split('/').pop() ?? 'data.json');
  await uploadFile(key, file);
}

export async function downloadJSON<T>(key: string): Promise<T> {
  const blob = await downloadFile(key);
  const text = await blob.text();
  return JSON.parse(text) as T;
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test src/lib/buckets.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/buckets.ts src/lib/buckets.test.ts
git commit -m "feat: add bucket key builder and upload/download helpers"
```

---

## Task 5: Entity Helpers (Workspace + Template CRUD)

**Files:**
- Create: `src/lib/entities.ts`, `src/lib/entities.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/entities.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ContractWorkspace } from '../types/workspace';

const mockEntity = {
  id: 'ws1',
  name: 'Acme MSA',
  description: '',
  defaultTemplateId: 't1',
  buyerParty: 'Buyer Corp',
  sellerParty: 'Acme Ltd',
  contractType: 'Services',
  ownerId: 'user1',
  createdAt: '2026-05-23T00:00:00Z',
  versions: [],
  comparisons: [],
};

vi.mock('./sdk', () => ({
  getSDK: vi.fn().mockResolvedValue({
    Entities: {
      list: vi.fn().mockResolvedValue({ value: [mockEntity] }),
      getById: vi.fn().mockResolvedValue(mockEntity),
      create: vi.fn().mockResolvedValue(mockEntity),
      update: vi.fn().mockResolvedValue(mockEntity),
    },
  }),
}));

describe('entities', () => {
  beforeEach(() => vi.clearAllMocks());

  it('listWorkspaces returns array', async () => {
    const { listWorkspaces } = await import('./entities');
    const result = await listWorkspaces();
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Acme MSA');
  });

  it('getWorkspace returns single workspace', async () => {
    const { getWorkspace } = await import('./entities');
    const result = await getWorkspace('ws1');
    expect(result.id).toBe('ws1');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test src/lib/entities.test.ts
```

- [ ] **Step 3: Create `src/lib/entities.ts`**

```typescript
import { getSDK } from './sdk';
import type { ContractWorkspace } from '../types/workspace';
import type { Template, Guideline } from '../types/template';

const WS_ENTITY = 'ContractWorkspace';
const TEMPLATE_ENTITY = 'Template';
const GUIDELINE_ENTITY = 'Guideline';

export async function listWorkspaces(): Promise<ContractWorkspace[]> {
  const sdk = await getSDK();
  const result = await sdk.Entities.list({ entityName: WS_ENTITY });
  return result.value as ContractWorkspace[];
}

export async function getWorkspace(id: string): Promise<ContractWorkspace> {
  const sdk = await getSDK();
  return sdk.Entities.getById({ entityName: WS_ENTITY, id }) as Promise<ContractWorkspace>;
}

export async function createWorkspace(data: Omit<ContractWorkspace, 'id'>): Promise<ContractWorkspace> {
  const sdk = await getSDK();
  return sdk.Entities.create({ entityName: WS_ENTITY, data }) as Promise<ContractWorkspace>;
}

export async function updateWorkspace(id: string, data: Partial<ContractWorkspace>): Promise<ContractWorkspace> {
  const sdk = await getSDK();
  return sdk.Entities.update({ entityName: WS_ENTITY, id, data }) as Promise<ContractWorkspace>;
}

export async function listTemplates(): Promise<Template[]> {
  const sdk = await getSDK();
  const result = await sdk.Entities.list({ entityName: TEMPLATE_ENTITY });
  return result.value as Template[];
}

export async function getTemplate(id: string): Promise<Template> {
  const sdk = await getSDK();
  return sdk.Entities.getById({ entityName: TEMPLATE_ENTITY, id }) as Promise<Template>;
}

export async function createTemplate(data: Omit<Template, 'id'>): Promise<Template> {
  const sdk = await getSDK();
  return sdk.Entities.create({ entityName: TEMPLATE_ENTITY, data }) as Promise<Template>;
}

export async function updateTemplate(id: string, data: Partial<Template>): Promise<Template> {
  const sdk = await getSDK();
  return sdk.Entities.update({ entityName: TEMPLATE_ENTITY, id, data }) as Promise<Template>;
}

export async function listGuidelines(): Promise<Guideline[]> {
  const sdk = await getSDK();
  const result = await sdk.Entities.list({ entityName: GUIDELINE_ENTITY });
  return result.value as Guideline[];
}

export async function createGuideline(data: Omit<Guideline, 'id'>): Promise<Guideline> {
  const sdk = await getSDK();
  return sdk.Entities.create({ entityName: GUIDELINE_ENTITY, data }) as Promise<Guideline>;
}

export async function updateGuideline(id: string, data: Partial<Guideline>): Promise<Guideline> {
  const sdk = await getSDK();
  return sdk.Entities.update({ entityName: GUIDELINE_ENTITY, id, data }) as Promise<Guideline>;
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test src/lib/entities.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/entities.ts src/lib/entities.test.ts
git commit -m "feat: add entity helpers for workspace, template, guideline CRUD"
```

---

## Task 6: Maestro Trigger + Task Completion

**Files:**
- Create: `src/lib/maestro.ts`, `src/lib/tasks.ts`, `src/hooks/useTaskPolling.ts`
- Test: `src/lib/tasks.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/lib/tasks.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('./sdk', () => ({
  getSDK: vi.fn().mockResolvedValue({
    Tasks: {
      list: vi.fn().mockResolvedValue({
        value: [{ id: 'task1', status: 'Pending', data: { comparisonId: 'cmp1' } }],
      }),
      complete: vi.fn().mockResolvedValue(undefined),
    },
  }),
}));

describe('tasks', () => {
  it('listPendingTasks returns pending tasks', async () => {
    const { listPendingTasks } = await import('./tasks');
    const tasks = await listPendingTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.id).toBe('task1');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test src/lib/tasks.test.ts
```

- [ ] **Step 3: Create `src/lib/tasks.ts`**

```typescript
import { getSDK } from './sdk';

export interface PendingTask {
  id: string;
  status: string;
  data: Record<string, unknown>;
}

export async function listPendingTasks(): Promise<PendingTask[]> {
  const sdk = await getSDK();
  const result = await sdk.Tasks.list({ status: 'Pending' });
  return result.value as PendingTask[];
}

export async function confirmTask(taskId: string, note?: string): Promise<void> {
  const sdk = await getSDK();
  await sdk.Tasks.complete({ taskId, action: 'Confirm', data: { note: note ?? '' } });
}

export async function rejectTask(taskId: string, note: string): Promise<void> {
  const sdk = await getSDK();
  await sdk.Tasks.complete({ taskId, action: 'Reject', data: { note } });
}
```

- [ ] **Step 4: Create `src/lib/maestro.ts`**

```typescript
import { getSDK } from './sdk';
import type { ComparisonMode } from '../types/workspace';

export interface StartComparisonInput {
  workspaceId: string;
  bucketName: string;
  docAKey: string;
  docBKey: string;
  mode: ComparisonMode;
  templateId: string;
  includeVersionHistory: boolean;
  comparisonId: string;
}

export async function startComparison(input: StartComparisonInput): Promise<void> {
  const sdk = await getSDK();
  await sdk.MaestroProcesses.start({
    processName: 'ContractComparisonProcess',
    inputArguments: input,
  });
}
```

- [ ] **Step 5: Create `src/hooks/useTaskPolling.ts`**

```typescript
import { useEffect, useState, useCallback } from 'react';
import { listPendingTasks, type PendingTask } from '../lib/tasks';

const POLL_INTERVAL_MS = 5000;

export function useTaskPolling() {
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [error, setError] = useState<string | null>(null);

  const poll = useCallback(async () => {
    try {
      const pending = await listPendingTasks();
      setTasks(pending);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch tasks');
    }
  }, []);

  useEffect(() => {
    void poll();
    const timer = setInterval(() => { void poll(); }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [poll]);

  return { tasks, error, refetch: poll };
}
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
npm test src/lib/tasks.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/maestro.ts src/lib/tasks.ts src/lib/tasks.test.ts src/hooks/useTaskPolling.ts
git commit -m "feat: add Maestro trigger, task completion, and polling hook"
```

---

## Task 7: App Shell + Routing

**Files:**
- Create: `src/App.tsx`, `src/components/layout/AppShell.tsx`, `src/components/layout/Sidebar.tsx`
- Create stub pages: `src/pages/*.tsx`

- [ ] **Step 1: Create stub pages**

```typescript
// src/pages/WorkspacesPage.tsx
export default function WorkspacesPage() { return <div>Workspaces</div>; }

// src/pages/WorkspaceDetailPage.tsx
export default function WorkspaceDetailPage() { return <div>Workspace Detail</div>; }

// src/pages/ReviewPage.tsx
export default function ReviewPage() { return <div>Review</div>; }

// src/pages/TemplatesPage.tsx
export default function TemplatesPage() { return <div>Templates</div>; }

// src/pages/GuidelinesPage.tsx
export default function GuidelinesPage() { return <div>Guidelines</div>; }
```

- [ ] **Step 2: Create `src/components/layout/Sidebar.tsx`**

```typescript
import { NavLink } from 'react-router-dom';
import { useTaskPolling } from '../../hooks/useTaskPolling';

export default function Sidebar() {
  const { tasks } = useTaskPolling();
  const pendingCount = tasks.length;

  return (
    <nav className="w-48 bg-slate-800 flex flex-col py-4 shrink-0">
      <div className="px-4 pb-4 border-b border-slate-700 mb-2">
        <div className="text-sm font-extrabold text-white">ContractAI</div>
        <div className="text-xs text-slate-500">Powered by UiPath Maestro</div>
      </div>

      <div className="text-xs font-bold uppercase tracking-widest text-slate-500 px-4 pt-3 pb-1">
        Workspace
      </div>
      <NavLink to="/workspaces" className={({ isActive }) =>
        `flex items-center justify-between px-4 py-2 text-xs border-l-2 ${isActive ? 'border-blue-500 text-white bg-blue-900/20' : 'border-transparent text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`
      }>
        <span>📁 My Workspaces</span>
      </NavLink>
      <NavLink to="/reviews" className={({ isActive }) =>
        `flex items-center justify-between px-4 py-2 text-xs border-l-2 ${isActive ? 'border-blue-500 text-white bg-blue-900/20' : 'border-transparent text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`
      }>
        <span>🕑 My Reviews</span>
        {pendingCount > 0 && (
          <span className="text-[10px] bg-amber-500 text-slate-900 rounded-full px-1.5 py-px font-bold">
            {pendingCount}
          </span>
        )}
      </NavLink>

      <div className="text-xs font-bold uppercase tracking-widest text-slate-500 px-4 pt-4 pb-1">
        Admin
      </div>
      <NavLink to="/admin/templates" className={({ isActive }) =>
        `px-4 py-2 text-xs border-l-2 ${isActive ? 'border-blue-500 text-white bg-blue-900/20' : 'border-transparent text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`
      }>
        🗂 Templates
      </NavLink>
      <NavLink to="/admin/guidelines" className={({ isActive }) =>
        `px-4 py-2 text-xs border-l-2 ${isActive ? 'border-blue-500 text-white bg-blue-900/20' : 'border-transparent text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`
      }>
        📚 Guidelines
      </NavLink>
    </nav>
  );
}
```

- [ ] **Step 3: Create `src/components/layout/AppShell.tsx`**

```typescript
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppShell() {
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/App.tsx`**

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import WorkspacesPage from './pages/WorkspacesPage';
import WorkspaceDetailPage from './pages/WorkspaceDetailPage';
import ReviewPage from './pages/ReviewPage';
import TemplatesPage from './pages/TemplatesPage';
import GuidelinesPage from './pages/GuidelinesPage';

export default function App() {
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
```

- [ ] **Step 5: Verify app loads with sidebar**

```bash
npm run dev
```
Open `http://localhost:5173` — expect sidebar visible, stub pages render on nav.

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: add app shell, sidebar, routing skeleton"
```

---

## Task 8: Workspace Browser + Card

**Files:**
- Create: `src/components/workspace/WorkspaceCard.tsx`, `src/components/workspace/WorkspaceBrowser.tsx`
- Modify: `src/pages/WorkspacesPage.tsx`
- Test: `src/components/workspace/WorkspaceBrowser.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// src/components/workspace/WorkspaceBrowser.test.tsx
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
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test src/components/workspace/WorkspaceBrowser.test.tsx
```

- [ ] **Step 3: Create `src/components/workspace/WorkspaceCard.tsx`**

```typescript
import { useNavigate } from 'react-router-dom';
import type { ContractWorkspace } from '../../types/workspace';

interface Props { workspace: ContractWorkspace; }

export default function WorkspaceCard({ workspace }: Props) {
  const navigate = useNavigate();
  const pending = workspace.comparisons.filter(c => c.status === 'awaiting-review').length;
  const lastActivity = workspace.comparisons.at(-1)?.startedAt ?? workspace.createdAt;

  return (
    <div
      onClick={() => navigate(`/workspaces/${workspace.id}`)}
      className={`bg-white rounded-xl border cursor-pointer transition-shadow hover:shadow-md flex flex-col gap-3 p-4 ${pending > 0 ? 'border-l-[3px] border-l-amber-400 border-slate-200' : 'border-slate-200'}`}
    >
      <div className="flex items-start gap-2">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-lg shrink-0">📁</div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-800 truncate">{workspace.name}</div>
          <div className="text-xs text-slate-500 truncate">{workspace.buyerParty} → {workspace.sellerParty}</div>
        </div>
      </div>
      <div className="flex gap-1 flex-wrap">
        <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-px rounded font-semibold">{workspace.contractType}</span>
      </div>
      <div className="flex gap-4 pt-2 border-t border-slate-100 text-center">
        {[
          { label: 'versions', value: workspace.versions.length },
          { label: 'runs', value: workspace.comparisons.length },
          { label: 'confirmed', value: workspace.comparisons.filter(c => c.status === 'confirmed').length },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center">
            <span className="text-sm font-bold text-slate-700">{s.value}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {new Date(lastActivity).toLocaleDateString()}
        </span>
        {pending > 0
          ? <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-px rounded-full font-bold">{pending} pending</span>
          : <span className="text-[11px] bg-green-100 text-green-700 px-2 py-px rounded-full font-bold">✓ All clear</span>
        }
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/workspace/WorkspaceBrowser.tsx`**

```typescript
import { useState } from 'react';
import type { ContractWorkspace } from '../../types/workspace';
import WorkspaceCard from './WorkspaceCard';

interface Props { workspaces: ContractWorkspace[]; }

export default function WorkspaceBrowser({ workspaces }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending'>('all');

  const filtered = workspaces.filter(ws => {
    const term = search.toLowerCase();
    const matchesSearch =
      ws.name.toLowerCase().includes(term) ||
      ws.buyerParty.toLowerCase().includes(term) ||
      ws.sellerParty.toLowerCase().includes(term) ||
      ws.contractType.toLowerCase().includes(term);
    const matchesFilter = filter === 'all' || ws.comparisons.some(c => c.status === 'awaiting-review');
    return matchesSearch && matchesFilter;
  });

  const pendingTotal = workspaces.reduce((n, ws) => n + ws.comparisons.filter(c => c.status === 'awaiting-review').length, 0);

  return (
    <div className="p-5 flex flex-col gap-4">
      {/* Stats */}
      <div className="flex gap-3">
        {[
          { label: 'Workspaces', value: workspaces.length },
          { label: 'Versions', value: workspaces.reduce((n, ws) => n + ws.versions.length, 0) },
          { label: 'Comparisons', value: workspaces.reduce((n, ws) => n + ws.comparisons.length, 0) },
          { label: 'Pending Review', value: pendingTotal, highlight: true },
        ].map(s => (
          <div key={s.label} className={`bg-white border rounded-lg px-4 py-2 text-center ${s.highlight ? 'border-amber-300' : 'border-slate-200'}`}>
            <div className={`text-lg font-extrabold ${s.highlight ? 'text-amber-600' : 'text-slate-800'}`}>{s.value}</div>
            <div className="text-[10px] uppercase tracking-wide text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 items-center">
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
          <span className="text-slate-400">🔍</span>
          <input
            className="flex-1 text-sm outline-none text-slate-700 placeholder:text-slate-400"
            placeholder="Search workspaces, parties, contract type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {(['all', 'pending'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-2 rounded-lg border ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
          >
            {f === 'all' ? 'All' : '⏳ Pending'}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3">
        {filtered.map(ws => <WorkspaceCard key={ws.id} workspace={ws} />)}
        <div className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 min-h-36 cursor-pointer text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
          <span className="text-2xl">📂</span>
          <span className="text-sm font-semibold">New Workspace</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update `src/pages/WorkspacesPage.tsx`**

```typescript
import { useEffect, useState } from 'react';
import { listWorkspaces } from '../lib/entities';
import WorkspaceBrowser from '../components/workspace/WorkspaceBrowser';
import type { ContractWorkspace } from '../types/workspace';

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<ContractWorkspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listWorkspaces().then(ws => { setWorkspaces(ws); setLoading(false); }).catch(console.error);
  }, []);

  if (loading) return <div className="p-6 text-slate-500">Loading workspaces…</div>;
  return (
    <div>
      <div className="px-5 pt-5 pb-3 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-800">My Workspaces</h1>
          <p className="text-xs text-slate-400">All contract workspaces · click to open</p>
        </div>
        <button className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg">+ New Workspace</button>
      </div>
      <WorkspaceBrowser workspaces={workspaces} />
    </div>
  );
}
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
npm test src/components/workspace/WorkspaceBrowser.test.tsx
```

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "feat: workspace browser with card grid, search, filter"
```

---

## Task 9: Workspace Detail (Versions + Run Form + History)

**Files:**
- Create: `src/components/workspace/VersionList.tsx`, `src/components/workspace/RunComparisonForm.tsx`, `src/components/workspace/ComparisonHistory.tsx`, `src/components/workspace/WorkspaceDetail.tsx`
- Modify: `src/pages/WorkspaceDetailPage.tsx`

- [ ] **Step 1: Create `src/components/workspace/VersionList.tsx`**

```typescript
import { useRef } from 'react';
import type { WorkspaceVersion } from '../../types/workspace';

interface Props {
  versions: WorkspaceVersion[];
  onUpload: (file: File) => Promise<void>;
}

export default function VersionList({ versions, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    await onUpload(files[0]!);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-800">📄 Contract Versions</span>
        <button onClick={() => inputRef.current?.click()} className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5">+ Upload Version</button>
      </div>
      <div className="divide-y divide-slate-100 p-3">
        {[...versions].reverse().map(v => (
          <div key={v.versionNumber} className="flex items-center gap-3 py-2.5">
            <span className={`text-[11px] font-bold px-2 py-px rounded min-w-[28px] text-center ${v.versionNumber === versions.length ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
              v{v.versionNumber}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-800 truncate">{v.filename}</div>
              <div className="text-[11px] text-slate-400">
                {new Date(v.uploadedAt).toLocaleDateString()} · {v.uploadedBy} · {(v.fileSizeBytes / 1024).toFixed(0)} KB
              </div>
            </div>
          </div>
        ))}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); void handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className="mt-2 border-2 border-dashed border-slate-200 rounded-lg p-3 text-center text-xs text-slate-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
        >
          ⬆ Drop new version or click to upload
        </div>
        <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => void handleFiles(e.target.files)} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/workspace/RunComparisonForm.tsx`**

```typescript
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ContractWorkspace, ComparisonMode } from '../../types/workspace';
import type { Template } from '../../types/template';
import { startComparison } from '../../lib/maestro';
import { buildBucketKey } from '../../lib/buckets';

interface Props {
  workspace: ContractWorkspace;
  templates: Template[];
  onStarted: (comparisonId: string) => void;
}

export default function RunComparisonForm({ workspace, templates, onStarted }: Props) {
  const [mode, setMode] = useState<ComparisonMode>('buyer-seller-diff');
  const [templateId, setTemplateId] = useState(workspace.defaultTemplateId);
  const [docAVersion, setDocAVersion] = useState(workspace.versions.length);
  const [docBVersion, setDocBVersion] = useState(Math.max(1, workspace.versions.length - 1));
  const [includeHistory, setIncludeHistory] = useState(false);
  const [running, setRunning] = useState(false);

  async function handleRun() {
    const vA = workspace.versions.find(v => v.versionNumber === docAVersion);
    const vB = workspace.versions.find(v => v.versionNumber === docBVersion);
    if (!vA || !vB) return;
    const comparisonId = uuidv4();
    setRunning(true);
    try {
      await startComparison({
        workspaceId: workspace.id,
        bucketName: 'contract-ai',
        docAKey: vA.bucketKey,
        docBKey: vB.bucketKey,
        mode,
        templateId,
        includeVersionHistory: includeHistory,
        comparisonId,
      });
      onStarted(comparisonId);
    } finally {
      setRunning(false);
    }
  }

  if (workspace.versions.length < 2) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-400 text-center">
        Upload at least 2 versions to run a comparison.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <span className="text-sm font-bold text-slate-800">▶ Run New Comparison</span>
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Mode', value: mode, onChange: (v: string) => setMode(v as ComparisonMode),
              options: [{ value: 'buyer-seller-diff', label: 'Buyer / Seller Diff' }, { value: 'template-compliance', label: 'Template Compliance' }] },
            { label: 'Template', value: templateId, onChange: setTemplateId,
              options: templates.map(t => ({ value: t.id, label: t.name })) },
            { label: 'Document A (Buyer)', value: String(docAVersion), onChange: (v: string) => setDocAVersion(Number(v)),
              options: workspace.versions.map(v => ({ value: String(v.versionNumber), label: `v${v.versionNumber} — ${v.filename}` })) },
            { label: 'Document B (Seller)', value: String(docBVersion), onChange: (v: string) => setDocBVersion(Number(v)),
              options: workspace.versions.map(v => ({ value: String(v.versionNumber), label: `v${v.versionNumber} — ${v.filename}` })) },
          ].map(f => (
            <div key={f.label}>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">{f.label}</div>
              <select value={f.value} onChange={e => f.onChange(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 bg-white">
                {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={includeHistory} onChange={e => setIncludeHistory(e.target.checked)} className="rounded" />
          Include version history context (Latest vs Previous)
        </label>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Runs via Maestro · est. ~2 min · assigns human task on completion</span>
          <button onClick={() => void handleRun()} disabled={running}
            className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
            {running ? 'Starting…' : '▶ Run Comparison'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/workspace/ComparisonHistory.tsx`**

```typescript
import { useNavigate } from 'react-router-dom';
import type { WorkspaceComparison } from '../../types/workspace';

interface Props { workspaceId: string; comparisons: WorkspaceComparison[]; }

const STATUS_STYLES: Record<string, string> = {
  'awaiting-review': 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  running: 'bg-blue-100 text-blue-700',
};

const STATUS_LABELS: Record<string, string> = {
  'awaiting-review': '⏳ Awaiting Review',
  confirmed: '✓ Confirmed',
  rejected: '✗ Rejected',
  running: '⟳ Running',
};

export default function ComparisonHistory({ workspaceId, comparisons }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-800">🕑 Comparison History</span>
        <span className="text-xs text-slate-400">{comparisons.length} runs · click to open review</span>
      </div>
      <div className="divide-y divide-slate-100 p-3 flex flex-col gap-1">
        {comparisons.length === 0 && (
          <div className="text-xs text-slate-400 text-center py-4">No comparisons yet.</div>
        )}
        {[...comparisons].reverse().map(c => (
          <div key={c.comparisonId}
            onClick={() => navigate(`/workspaces/${workspaceId}/comparisons/${c.comparisonId}`)}
            className="border border-slate-200 rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-2 py-px rounded ${c.mode === 'buyer-seller-diff' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                {c.mode === 'buyer-seller-diff' ? 'Buyer / Seller' : 'Template Check'}
              </span>
              <span className="text-xs font-semibold text-slate-800 flex-1">
                v{c.docAVersion} vs v{c.docBVersion}
              </span>
              <span className={`text-[11px] font-bold px-2 py-px rounded ${STATUS_STYLES[c.status] ?? ''}`}>
                {STATUS_LABELS[c.status] ?? c.status}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 flex gap-4">
              <span>{new Date(c.startedAt).toLocaleString()}</span>
              {c.confirmedBy && <span>by {c.confirmedBy}</span>}
              {c.rejectionNote && <span className="text-red-400 truncate">"{c.rejectionNote}"</span>}
            </div>
            {c.findingSummary && (
              <div className="flex gap-1 mt-1.5">
                {c.findingSummary.high > 0 && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-px rounded font-bold">{c.findingSummary.high} High</span>}
                {c.findingSummary.medium > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-px rounded font-bold">{c.findingSummary.medium} Medium</span>}
                {c.findingSummary.aligned > 0 && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-px rounded font-bold">{c.findingSummary.aligned} Aligned</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/workspace/WorkspaceDetail.tsx`**

```typescript
import type { ContractWorkspace } from '../../types/workspace';
import type { Template } from '../../types/template';
import VersionList from './VersionList';
import RunComparisonForm from './RunComparisonForm';
import ComparisonHistory from './ComparisonHistory';
import { buildBucketKey } from '../../lib/buckets';
import { uploadFile, uploadJSON } from '../../lib/buckets';
import { updateWorkspace } from '../../lib/entities';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  workspace: ContractWorkspace;
  templates: Template[];
  onUpdate: (ws: ContractWorkspace) => void;
}

export default function WorkspaceDetail({ workspace, templates, onUpdate }: Props) {
  const pending = workspace.comparisons.filter(c => c.status === 'awaiting-review').length;

  async function handleUpload(file: File) {
    const nextVersion = workspace.versions.length + 1;
    const key = buildBucketKey({ workspaceId: workspace.id, versionNumber: nextVersion, filename: file.name });
    await uploadFile(key, file);
    const updated = await updateWorkspace(workspace.id, {
      versions: [
        ...workspace.versions,
        { versionNumber: nextVersion, bucketKey: key, filename: file.name,
          uploadedBy: 'current-user', uploadedAt: new Date().toISOString(), fileSizeBytes: file.size },
      ],
    });
    onUpdate(updated);
  }

  async function handleComparisonStarted(comparisonId: string) {
    const newComparison = {
      comparisonId, docAVersion: workspace.versions.length,
      docBVersion: Math.max(1, workspace.versions.length - 1),
      mode: 'buyer-seller-diff' as const, templateId: workspace.defaultTemplateId,
      includeVersionHistory: false, status: 'running' as const,
      startedAt: new Date().toISOString(),
    };
    const updated = await updateWorkspace(workspace.id, {
      comparisons: [...workspace.comparisons, newComparison],
    });
    onUpdate(updated);
  }

  return (
    <div className="p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-2xl shrink-0">📁</div>
        <div className="flex-1">
          <h1 className="text-base font-extrabold text-slate-800">{workspace.name}</h1>
          <p className="text-xs text-slate-500">{workspace.description}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-px rounded font-semibold">{workspace.contractType}</span>
            <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-px rounded font-semibold">Buyer: {workspace.buyerParty}</span>
            <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-px rounded font-semibold">Seller: {workspace.sellerParty}</span>
          </div>
        </div>
        <div className="flex gap-4 text-center pl-4 border-l border-slate-200">
          {[{ label: 'Versions', value: workspace.versions.length },
            { label: 'Comparisons', value: workspace.comparisons.length },
            { label: 'Pending', value: pending, amber: pending > 0 }].map(s => (
            <div key={s.label}>
              <div className={`text-lg font-extrabold ${s.amber ? 'text-amber-600' : 'text-slate-800'}`}>{s.value}</div>
              <div className="text-[10px] text-slate-400 uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <VersionList versions={workspace.versions} onUpload={handleUpload} />
        <RunComparisonForm workspace={workspace} templates={templates} onStarted={handleComparisonStarted} />
      </div>

      <ComparisonHistory workspaceId={workspace.id} comparisons={workspace.comparisons} />
    </div>
  );
}
```

- [ ] **Step 5: Update `src/pages/WorkspaceDetailPage.tsx`**

```typescript
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWorkspace, listTemplates } from '../lib/entities';
import WorkspaceDetail from '../components/workspace/WorkspaceDetail';
import type { ContractWorkspace } from '../types/workspace';
import type { Template } from '../types/template';

export default function WorkspaceDetailPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<ContractWorkspace | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    Promise.all([getWorkspace(workspaceId), listTemplates()])
      .then(([ws, tmpl]) => { setWorkspace(ws); setTemplates(tmpl); })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (loading) return <div className="p-6 text-slate-500">Loading…</div>;
  if (!workspace) return <div className="p-6 text-red-500">Workspace not found.</div>;

  return (
    <div>
      <div className="px-5 pt-4 pb-2 border-b border-slate-200 text-xs text-slate-400 flex gap-1 items-center">
        <Link to="/workspaces" className="text-blue-500">My Workspaces</Link>
        <span>›</span>
        <strong className="text-slate-700">{workspace.name}</strong>
      </div>
      <WorkspaceDetail workspace={workspace} templates={templates} onUpdate={setWorkspace} />
    </div>
  );
}
```

- [ ] **Step 6: Install uuid**

```bash
npm install uuid && npm install -D @types/uuid
```

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "feat: workspace detail with version upload, run comparison form, comparison history"
```

---

## Task 10: Document Renderer (PDF + DOCX)

**Files:**
- Create: `src/components/review/PdfViewer.tsx`, `src/components/review/DocxViewer.tsx`, `src/components/review/DocumentPanel.tsx`
- Test: `src/components/review/DocxViewer.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// src/components/review/DocxViewer.test.tsx
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
    render(<DocxViewer blob={blob} />);
    await waitFor(() => expect(screen.getByText(/Liability cap text/)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test src/components/review/DocxViewer.test.tsx
```

- [ ] **Step 3: Create `src/components/review/DocxViewer.tsx`**

```typescript
import { useEffect, useState } from 'react';
import mammoth from 'mammoth';

interface Props { blob: Blob; className?: string; }

export default function DocxViewer({ blob, className }: Props) {
  const [html, setHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    blob.arrayBuffer()
      .then(buf => mammoth.convertToHtml({ arrayBuffer: buf }))
      .then(result => setHtml(result.value))
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to render document'));
  }, [blob]);

  if (error) return <div className="p-4 text-red-500 text-xs">{error}</div>;
  if (!html) return <div className="p-4 text-slate-400 text-xs">Rendering document…</div>;

  return (
    <div
      className={`prose prose-sm max-w-none p-4 font-serif text-slate-700 ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

- [ ] **Step 4: Create `src/components/review/PdfViewer.tsx`**

```typescript
import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface Props { blob: Blob; className?: string; }

export default function PdfViewer({ blob, className }: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  const url = URL.createObjectURL(blob);

  return (
    <div className={`overflow-y-auto ${className ?? ''}`}>
      <Document file={url} onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={<div className="p-4 text-slate-400 text-xs">Loading PDF…</div>}>
        {Array.from({ length: numPages }, (_, i) => (
          <Page key={i + 1} pageNumber={i + 1} width={560} className="mb-2" />
        ))}
      </Document>
    </div>
  );
}
```

- [ ] **Step 5: Create `src/components/review/DocumentPanel.tsx`**

```typescript
import PdfViewer from './PdfViewer';
import DocxViewer from './DocxViewer';

interface Props {
  blob: Blob;
  filename: string;
  label: string;
  isTemplate?: boolean;
  panelRef?: React.RefObject<HTMLDivElement>;
}

export default function DocumentPanel({ blob, filename, label, isTemplate, panelRef }: Props) {
  const isDocx = filename.toLowerCase().endsWith('.docx');

  return (
    <div className={`flex flex-col border-r border-slate-200 ${isTemplate ? 'bg-amber-50/30' : 'bg-white'}`}>
      <div className={`px-3 py-2 border-b text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 ${isTemplate ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
        <span>{isTemplate ? '📋' : '📄'}</span>
        <span>{label}</span>
      </div>
      <div ref={panelRef} className="flex-1 overflow-y-auto">
        {isDocx ? <DocxViewer blob={blob} /> : <PdfViewer blob={blob} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
npm test src/components/review/DocxViewer.test.tsx
```

- [ ] **Step 7: Commit**

```bash
git add src/components/review/
git commit -m "feat: PDF and DOCX document renderers"
```

---

## Task 11: Highlight Layer (mark.js fuzzy)

**Files:**
- Create: `src/components/review/HighlightLayer.tsx`
- Test: `src/components/review/HighlightLayer.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// src/components/review/HighlightLayer.test.tsx
import { render, screen } from '@testing-library/react';
import HighlightLayer from './HighlightLayer';
import type { Finding } from '../../types/review';

describe('HighlightLayer', () => {
  it('renders without crashing when no active finding', () => {
    const { container } = render(
      <div id="doc-panel">
        <HighlightLayer panelId="doc-panel" activeFinding={null} findings={[]} />
      </div>
    );
    expect(container).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test src/components/review/HighlightLayer.test.tsx
```

- [ ] **Step 3: Create `src/components/review/HighlightLayer.tsx`**

```typescript
import { useEffect, useRef } from 'react';
import Mark from 'mark.js';
import type { Finding } from '../../types/review';

const HIGHLIGHT_CLASSES: Record<string, string> = {
  'high-risk': 'bg-red-100 border-b-2 border-red-400',
  'medium-risk': 'bg-amber-100 border-b-2 border-amber-400',
  aligned: 'bg-green-100 border-b-2 border-green-400',
  missing: 'bg-red-100 border-b-2 border-red-400 border-dashed',
  modified: 'bg-amber-100 border-b-2 border-amber-400',
  extra: 'bg-blue-100 border-b-2 border-blue-400',
};

interface Props {
  panelId: string;
  findings: Finding[];
  activeFinding: Finding | null;
}

export default function HighlightLayer({ panelId, findings, activeFinding }: Props) {
  const markerRef = useRef<Mark | null>(null);

  useEffect(() => {
    const el = document.getElementById(panelId);
    if (!el) return;
    markerRef.current = new Mark(el);
  }, [panelId]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    marker.unmark();

    findings.forEach(finding => {
      const snippet = finding.snippetA;
      if (!snippet) return;
      const cls = `${HIGHLIGHT_CLASSES[finding.deviationType] ?? ''} ${activeFinding?.id === finding.id ? 'ring-2 ring-blue-400' : ''}`.trim();
      marker.mark(snippet, {
        separateWordSearch: false,
        accuracy: 'complementary',
        className: cls,
        element: 'mark',
      });
    });
  }, [findings, activeFinding]);

  useEffect(() => {
    if (!activeFinding) return;
    const el = document.getElementById(panelId);
    if (!el) return;
    const marked = el.querySelector('mark');
    if (marked) marked.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeFinding, panelId]);

  return null;
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test src/components/review/HighlightLayer.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/components/review/HighlightLayer.tsx src/components/review/HighlightLayer.test.tsx
git commit -m "feat: mark.js highlight layer with fuzzy snippet matching"
```

---

## Task 12: Findings Sidebar + Confirm Bar + Review Workspace

**Files:**
- Create: `src/components/review/FindingsSidebar.tsx`, `src/components/review/ConfirmBar.tsx`, `src/components/review/ReviewWorkspace.tsx`
- Modify: `src/pages/ReviewPage.tsx`

- [ ] **Step 1: Create `src/components/review/FindingsSidebar.tsx`**

```typescript
import type { Finding, ScorecardCategory, ReviewPayload } from '../../types/review';

interface Props {
  payload: ReviewPayload;
  activeFinding: Finding | null;
  onSelectFinding: (f: Finding) => void;
}

const RAG_STYLES: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700', MISSING: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700', MODIFIED: 'bg-amber-100 text-amber-700',
  OK: 'bg-green-100 text-green-700', EXTRA: 'bg-blue-100 text-blue-700',
};

const FINDING_DOT: Record<string, string> = {
  'high-risk': 'bg-red-500', missing: 'bg-red-500',
  'medium-risk': 'bg-amber-500', modified: 'bg-amber-500',
  aligned: 'bg-green-500', extra: 'bg-blue-500',
};

export default function FindingsSidebar({ payload, activeFinding, onSelectFinding }: Props) {
  return (
    <div className="w-56 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden shrink-0">
      {/* Score */}
      <div className="p-3 border-b border-slate-200">
        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">
          {payload.compliancePercent !== undefined ? 'Compliance Score' : 'Risk Scorecard'}
        </div>
        {payload.compliancePercent !== undefined && (
          <div className="text-center mb-2">
            <span className="text-2xl font-extrabold text-amber-500">{payload.compliancePercent}%</span>
            <div className="text-[10px] text-slate-400">clause compliance</div>
          </div>
        )}
        <div className="flex flex-col gap-1">
          {payload.scorecard.map(cat => (
            <div key={cat.name} className="flex justify-between items-center text-xs text-slate-600">
              <span>{cat.name}</span>
              <span className={`text-[10px] font-bold px-1.5 py-px rounded ${RAG_STYLES[cat.status] ?? 'bg-slate-100 text-slate-500'}`}>
                {cat.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Findings */}
      <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 px-3 pt-3 pb-1">Findings</div>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {payload.findings.map(f => (
          <div key={f.id}
            onClick={() => onSelectFinding(f)}
            className={`flex gap-2 items-start px-2 py-1.5 rounded-lg cursor-pointer transition-colors mb-0.5 ${activeFinding?.id === f.id ? 'bg-blue-100' : 'hover:bg-slate-100'}`}>
            <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${FINDING_DOT[f.deviationType] ?? 'bg-slate-400'}`} />
            <span className={`text-xs leading-snug ${activeFinding?.id === f.id ? 'text-blue-700 font-medium' : 'text-slate-600'}`}>
              {f.clauseRef} {f.explanation.slice(0, 60)}{f.explanation.length > 60 ? '…' : ''}
            </span>
          </div>
        ))}
      </div>

      {/* Narrative */}
      <div className="p-3 border-t border-slate-200">
        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">AI Summary</div>
        <p className="text-xs text-slate-500 leading-relaxed">{payload.narrative.slice(0, 200)}{payload.narrative.length > 200 ? '…' : ''}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/review/ConfirmBar.tsx`**

```typescript
import { useState } from 'react';
import { confirmTask, rejectTask } from '../../lib/tasks';
import type { ReviewPayload } from '../../types/review';

interface Props {
  payload: ReviewPayload;
  onDone: () => void;
}

export default function ConfirmBar({ payload, onDone }: Props) {
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    await confirmTask(payload.taskId);
    onDone();
  }

  async function handleReject() {
    if (!rejectNote.trim()) return;
    setSubmitting(true);
    await rejectTask(payload.taskId, rejectNote);
    onDone();
  }

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3 flex items-center gap-3">
      <span className="text-xs text-slate-400 flex-1">Human task · {payload.comparisonId}</span>
      {showRejectInput && (
        <input
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs flex-1 max-w-xs outline-none"
          placeholder="Rejection reason (required)…"
          value={rejectNote}
          onChange={e => setRejectNote(e.target.value)}
        />
      )}
      <button
        onClick={() => showRejectInput ? void handleReject() : setShowRejectInput(true)}
        disabled={submitting}
        className="text-xs font-semibold px-4 py-2 rounded-lg bg-white border border-red-200 text-red-500 disabled:opacity-50"
      >
        {showRejectInput ? 'Confirm Rejection' : 'Reject & Escalate'}
      </button>
      <button
        onClick={() => void handleConfirm()}
        disabled={submitting}
        className="text-xs font-semibold px-4 py-2 rounded-lg bg-green-600 text-white shadow-sm disabled:opacity-50"
      >
        Confirm Review ✓
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/review/ReviewWorkspace.tsx`**

```typescript
import { useState, useRef } from 'react';
import type { ReviewPayload, Finding } from '../../types/review';
import FindingsSidebar from './FindingsSidebar';
import DocumentPanel from './DocumentPanel';
import HighlightLayer from './HighlightLayer';
import ConfirmBar from './ConfirmBar';

interface Props {
  payload: ReviewPayload;
  docABlob: Blob;
  docBBlob: Blob;
  docAFilename: string;
  docBFilename: string;
  isComplianceMode: boolean;
  onDone: () => void;
}

export default function ReviewWorkspace({ payload, docABlob, docBBlob, docAFilename, docBFilename, isComplianceMode, onDone }: Props) {
  const [activeFinding, setActiveFinding] = useState<Finding | null>(null);
  const panelARef = useRef<HTMLDivElement>(null);
  const panelBRef = useRef<HTMLDivElement>(null);

  function handleSelectFinding(f: Finding) {
    setActiveFinding(f);
    [panelARef, panelBRef].forEach(ref => {
      const el = ref.current?.querySelector('mark');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600">
          📄 {docAFilename}
        </div>
        <span className="text-xs text-slate-400 font-semibold">vs</span>
        <div className={`flex items-center gap-2 border rounded-lg px-2 py-1 text-xs ${isComplianceMode ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
          {isComplianceMode ? '📋' : '📄'} {docBFilename}
        </div>
        <span className={`text-[11px] font-bold px-2 py-px rounded ${isComplianceMode ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
          {isComplianceMode ? 'Template Compliance' : 'Buyer / Seller Diff'}
        </span>
        <div className="ml-auto text-xs text-slate-400">
          {payload.findings.filter(f => f.deviationType === 'high-risk' || f.deviationType === 'missing').length} High ·{' '}
          {payload.findings.filter(f => f.deviationType === 'medium-risk' || f.deviationType === 'modified').length} Medium ·{' '}
          {payload.findings.filter(f => f.deviationType === 'aligned').length} Aligned
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        <FindingsSidebar payload={payload} activeFinding={activeFinding} onSelectFinding={handleSelectFinding} />

        {/* Doc panels */}
        <div className="flex-1 grid grid-cols-2 overflow-hidden">
          <div id="panel-a" className="overflow-y-auto border-r border-slate-200">
            <DocumentPanel blob={docABlob} filename={docAFilename} label="Contract (Under Review)" panelRef={panelARef} />
            <HighlightLayer panelId="panel-a" findings={payload.findings} activeFinding={activeFinding} />
          </div>
          <div id="panel-b" className="overflow-y-auto">
            <DocumentPanel blob={docBBlob} filename={docBFilename} label={isComplianceMode ? 'Standard Template (Reference)' : 'Seller Contract'} isTemplate={isComplianceMode} panelRef={panelBRef} />
            <HighlightLayer panelId="panel-b" findings={payload.findings.map(f => ({ ...f, snippetA: f.snippetB ?? f.snippetA }))} activeFinding={activeFinding} />
          </div>
        </div>
      </div>

      <ConfirmBar payload={payload} onDone={onDone} />
    </div>
  );
}
```

- [ ] **Step 4: Update `src/pages/ReviewPage.tsx`**

```typescript
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWorkspace } from '../lib/entities';
import { downloadFile, downloadJSON, buildBucketKey } from '../lib/buckets';
import ReviewWorkspace from '../components/review/ReviewWorkspace';
import type { ReviewPayload } from '../types/review';

export default function ReviewPage() {
  const { workspaceId, comparisonId } = useParams<{ workspaceId: string; comparisonId: string }>();
  const navigate = useNavigate();
  const [payload, setPayload] = useState<ReviewPayload | null>(null);
  const [docABlob, setDocABlob] = useState<Blob | null>(null);
  const [docBBlob, setDocBBlob] = useState<Blob | null>(null);
  const [filenames, setFilenames] = useState<[string, string]>(['', '']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !comparisonId) return;
    (async () => {
      const ws = await getWorkspace(workspaceId);
      const cmp = ws.comparisons.find(c => c.comparisonId === comparisonId);
      if (!cmp) return;
      const vA = ws.versions.find(v => v.versionNumber === cmp.docAVersion)!;
      const vB = ws.versions.find(v => v.versionNumber === cmp.docBVersion)!;
      const reviewKey = buildBucketKey({ workspaceId, comparisonId, artifact: 'review.json' });
      const [review, blobA, blobB] = await Promise.all([
        downloadJSON<ReviewPayload>(reviewKey),
        downloadFile(vA.bucketKey),
        downloadFile(vB.bucketKey),
      ]);
      setPayload(review);
      setDocABlob(blobA);
      setDocBBlob(blobB);
      setFilenames([vA.filename, vB.filename]);
      setLoading(false);
    })();
  }, [workspaceId, comparisonId]);

  if (loading) return <div className="p-6 text-slate-500">Loading review…</div>;
  if (!payload || !docABlob || !docBBlob) return <div className="p-6 text-red-500">Review data not found.</div>;

  return (
    <ReviewWorkspace
      payload={payload}
      docABlob={docABlob}
      docBBlob={docBBlob}
      docAFilename={filenames[0]}
      docBFilename={filenames[1]}
      isComplianceMode={payload.mode === 'template-compliance'}
      onDone={() => navigate(`/workspaces/${workspaceId}`)}
    />
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: review workspace with findings sidebar, highlight layer, confirm/reject bar"
```

---

## Task 13: Admin — Template Manager + Guideline Library

**Files:**
- Create: `src/components/admin/TemplateCard.tsx`, `src/components/admin/TemplateManager.tsx`, `src/components/admin/GuidelineRow.tsx`, `src/components/admin/GuidelineLibrary.tsx`
- Modify: `src/pages/TemplatesPage.tsx`, `src/pages/GuidelinesPage.tsx`

- [ ] **Step 1: Create `src/components/admin/TemplateCard.tsx`**

```typescript
import { useState } from 'react';
import type { Template, Guideline } from '../../types/template';
import { updateTemplate } from '../../lib/entities';

interface Props { template: Template; guidelines: Guideline[]; onUpdate: (t: Template) => void; }

export default function TemplateCard({ template, guidelines, onUpdate }: Props) {
  const [systemMessage, setSystemMessage] = useState(template.systemMessage);
  const [saving, setSaving] = useState(false);
  const linked = guidelines.filter(g => template.linkedGuidelineIds.includes(g.id));

  async function handleSave() {
    setSaving(true);
    const updated = await updateTemplate(template.id, { systemMessage });
    onUpdate(updated);
    setSaving(false);
  }

  async function handleRemoveGuideline(gId: string) {
    const updated = await updateTemplate(template.id, {
      linkedGuidelineIds: template.linkedGuidelineIds.filter(id => id !== gId),
    });
    onUpdate(updated);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-lg">📄</div>
        <div className="flex-1">
          <div className="text-sm font-bold text-slate-800">{template.name}</div>
          <div className="text-xs text-slate-500">{template.description}</div>
        </div>
        <span className={`text-[11px] font-bold px-2 py-px rounded ${template.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {template.status}
        </span>
      </div>
      <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100">
        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-3 mb-1.5 flex items-center gap-2">
          🤖 System Message <span className="text-purple-500 font-bold">LLM INSTRUCTION</span>
        </div>
        <textarea
          value={systemMessage}
          onChange={e => setSystemMessage(e.target.value)}
          rows={4}
          className="w-full border-l-4 border-l-purple-400 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-700 bg-white resize-none outline-none focus:border-purple-300"
        />
        <button onClick={() => void handleSave()} disabled={saving}
          className="mt-2 text-xs font-semibold bg-purple-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
          {saving ? 'Saving…' : 'Save System Message'}
        </button>

        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-3 mb-1.5">📚 Grounding Documents</div>
        <div className="flex flex-wrap gap-1.5">
          {linked.map(g => (
            <div key={g.id} className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600">
              📘 {g.name}
              <button onClick={() => void handleRemoveGuideline(g.id)} className="text-slate-300 hover:text-red-400 text-[11px] ml-1">×</button>
            </div>
          ))}
          <button className="bg-slate-50 border border-dashed border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-400 hover:border-blue-400 hover:text-blue-500">
            + Add guideline
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/admin/TemplateManager.tsx`**

```typescript
import type { Template, Guideline } from '../../types/template';
import TemplateCard from './TemplateCard';

interface Props { templates: Template[]; guidelines: Guideline[]; onUpdate: (t: Template) => void; }

export default function TemplateManager({ templates, guidelines, onUpdate }: Props) {
  return (
    <div className="p-5 flex flex-col gap-3">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700 leading-relaxed">
        ℹ Each template has its own <strong>system message</strong> — the LLM instruction used when comparing against it. Attach <strong>guideline documents</strong> (e.g. GAFTA, Incoterms) to ground AI analysis with industry-standard definitions.
      </div>
      {templates.map(t => <TemplateCard key={t.id} template={t} guidelines={guidelines} onUpdate={onUpdate} />)}
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center text-slate-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
        <div className="text-xl mb-1">📂</div>
        <div className="text-sm font-semibold">Upload New Template</div>
        <div className="text-xs">PDF or DOCX · then configure system message and guideline links</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/admin/GuidelineRow.tsx`**

```typescript
import type { Guideline } from '../../types/template';

interface Props { guideline: Guideline; }

const STATUS_STYLES = { indexed: 'bg-green-100 text-green-700', indexing: 'bg-amber-100 text-amber-700', error: 'bg-red-100 text-red-700' };

export default function GuidelineRow({ guideline }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-base">📘</div>
        <div className="flex-1">
          <div className="text-sm font-bold text-slate-800">{guideline.name}</div>
          <div className="text-xs text-slate-500">{guideline.description}</div>
        </div>
        <div className="text-xs text-slate-400">{guideline.chunkCount} chunks</div>
        <span className={`text-[11px] font-bold px-2 py-px rounded ${STATUS_STYLES[guideline.indexingStatus] ?? 'bg-slate-100 text-slate-500'}`}>
          {guideline.indexingStatus === 'indexed' ? '● Indexed' : guideline.indexingStatus === 'indexing' ? '● Indexing…' : '● Error'}
        </span>
        <div className="text-xs text-slate-400">
          Used by {guideline.linkedTemplateIds.length} template{guideline.linkedTemplateIds.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/admin/GuidelineLibrary.tsx`**

```typescript
import type { Guideline } from '../../types/template';
import GuidelineRow from './GuidelineRow';

interface Props { guidelines: Guideline[]; }

export default function GuidelineLibrary({ guidelines }: Props) {
  return (
    <div className="p-5 flex flex-col gap-3">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700 leading-relaxed">
        🔍 Upload guideline documents (GAFTA, Incoterms, internal policies). Each is extracted, chunked, and indexed into the vector store. Link guidelines to templates in the Template Manager.
      </div>
      {guidelines.map(g => <GuidelineRow key={g.id} guideline={g} />)}
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center text-slate-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
        <div className="text-xl mb-1">📚</div>
        <div className="text-sm font-semibold">Upload Guideline Document</div>
        <div className="text-xs">PDF or DOCX · auto-extracted, chunked, and indexed for RAG</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update admin pages**

```typescript
// src/pages/TemplatesPage.tsx
import { useEffect, useState } from 'react';
import { listTemplates, listGuidelines } from '../lib/entities';
import TemplateManager from '../components/admin/TemplateManager';
import type { Template } from '../types/template';
import type { Guideline } from '../types/template';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);

  useEffect(() => {
    Promise.all([listTemplates(), listGuidelines()]).then(([t, g]) => { setTemplates(t); setGuidelines(g); });
  }, []);

  return (
    <div>
      <div className="px-5 pt-5 pb-3 border-b border-slate-200 flex items-center justify-between">
        <div><h1 className="text-base font-bold text-slate-800">Template & Context Management</h1>
          <p className="text-xs text-slate-400">Configure templates, system prompts, and grounding documents</p></div>
        <button className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg">+ New Template</button>
      </div>
      <TemplateManager templates={templates} guidelines={guidelines}
        onUpdate={t => setTemplates(prev => prev.map(p => p.id === t.id ? t : p))} />
    </div>
  );
}
```

```typescript
// src/pages/GuidelinesPage.tsx
import { useEffect, useState } from 'react';
import { listGuidelines } from '../lib/entities';
import GuidelineLibrary from '../components/admin/GuidelineLibrary';
import type { Guideline } from '../types/template';

export default function GuidelinesPage() {
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  useEffect(() => { listGuidelines().then(setGuidelines); }, []);
  return (
    <div>
      <div className="px-5 pt-5 pb-3 border-b border-slate-200">
        <h1 className="text-base font-bold text-slate-800">Guideline Library</h1>
        <p className="text-xs text-slate-400">Upload and manage RAG grounding documents</p>
      </div>
      <GuidelineLibrary guidelines={guidelines} />
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: template manager and guideline library admin screens"
```

---

## Task 14: Build + Deploy to UiPath Cloud

**Files:**
- Create: `src/uipath-deploy.sh`

- [ ] **Step 1: Install UiPath CLI**

```bash
npm install -g @uipath/uip-cli
uip --version
```
Expected: prints version number.

- [ ] **Step 2: Login to UiPath Cloud**

```bash
uip login
```
Follow browser OAuth flow. Confirm: `uip whoami` prints your org/tenant.

- [ ] **Step 3: Fill in `uipath.json`** with real values from UiPath Cloud portal (Settings → OAuth → External Applications).

- [ ] **Step 4: Build**

```bash
npm run build
```
Expected: `dist/` folder created, no TypeScript errors.

- [ ] **Step 5: Pack + publish**

```bash
uip codedapp pack dist -n ContractAI --version 1.0.0
uip codedapp publish
uip codedapp deploy
```
Expected: App available at `https://<org>.uipath.host/ContractAI`

- [ ] **Step 6: Smoke test deployed app**
- Open `https://<org>.uipath.host/ContractAI`
- Confirm sidebar renders, workspace browser loads
- Confirm SDK auth completes (no 401 errors in console)

- [ ] **Step 7: Run full test suite**

```bash
npm test
```
Expected: All tests PASS.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: Coded App complete — workspace browser, review workspace, admin UI, deployed"
```

---

## Verification Checklist (from spec §12)

- [ ] Template upload: upload PDF, set system message, link guideline → appears in registry
- [ ] Guideline indexing: upload PDF → status transitions Indexing → Indexed (requires Plan B)
- [ ] Buyer/Seller diff: upload two MSA versions → scorecard RAG correct, highlights on correct clauses
- [ ] Template compliance: upload contract → missing clause dashed gap, amber highlights
- [ ] Human task flow: comparison completes → task in sidebar badge → Confirm → case closed
- [ ] UI swap: trigger Maestro + complete task via raw SDK calls, no app change needed

---

## Next: Plan B — Maestro + Agents

See `docs/superpowers/plans/2026-05-23-maestro-agents-plan.md` (to be written).

Plan B covers:
- UiPath Studio project setup for `ContractComparisonProcess`
- Agent 1: Extractor (DU + LLM fallback)
- Agent 2: Comparator (batched LLM + Azure AI Search RAG)
- Agent 3: Reviewer (scorecard + diff + narrative)
- Human Task creation + payload schema
- Azure AI Search index setup + guideline indexing pipeline
- UiPath Assets configuration
