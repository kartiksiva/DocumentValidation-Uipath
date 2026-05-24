# GitHub Copilot — Contract Comparison Agent

**Your role:** Code builder. Claude Code is the planner and reviewer. You implement one task at a time, commit it, and report back. Do not add features beyond the task. Do not refactor adjacent code.

---

## Project

**Contract Comparison Agent** — UiPath Coded App (React + Vite) that lets business users compare legal contracts. AI pipeline runs via UiPath Maestro on the backend. This repo is the frontend only.

Tech stack: React 18, Vite, TypeScript, Tailwind CSS, react-router-dom v6, react-pdf, mammoth, mark.js, @uipath/uipath-typescript, vitest, @testing-library/react

---

## Coding Rules (Non-Negotiable)

Derived from Karpathy's LLM coding pitfalls. Apply to every change, no exceptions.

### Think first
State assumptions explicitly before writing code. If multiple interpretations exist, surface them — don't pick silently. If a simpler approach exists, say so. Transform every task into a checkable outcome before starting:
- "Add validation" → write failing tests first, then make them pass
- "Fix bug" → reproduce in a test, then fix
- State a brief step→verify plan for multi-step tasks

### Minimum code
No features beyond what was asked. No abstractions for single-use code. No error handling for impossible scenarios. If 200 lines could be 50, rewrite. Don't design for hypothetical future requirements.

### Surgical edits
Touch only what the task requires. Don't improve adjacent code, comments, or formatting. Match existing style exactly. Remove only imports/variables made unused by *your* changes — not pre-existing dead code. Don't add features, refactor, or introduce abstractions beyond what the task requires.

### No comments
Default: write no comments. Only add one when the WHY is non-obvious — a hidden constraint, a subtle invariant, a workaround for a specific bug. Never explain WHAT the code does. Never multi-line docstrings.

### TDD (where tests are specified in the task)
Write failing test → run to confirm fail → implement → run to confirm pass. Never skip this order.

### Project-specific rules
- **No `new UiPath()` outside `src/lib/sdk.ts`.** Always import `getSDK`.
- **No hardcoded bucket paths.** Always use `buildBucketKey()` from `src/lib/buckets.ts`.
- **Process name must be exact string:** `'ContractComparisonProcess'` — never change this.
- **No custom auth code.** OAuth injected by `@uipath/coded-apps-dev` at deploy time.

---

## Architecture

```
Coded App (React + Vite)           ← THIS REPO
  ↕ @uipath/uipath-typescript SDK (browser, no backend)
UiPath Platform Services
  Buckets · Entities · MaestroProcesses · Tasks
  ↕ Maestro SDK
ContractComparisonProcess          ← separate UiPath Studio project
  Agent 1 (Extractor) → Agent 2 (Comparator) → Agent 3 (Reviewer) → Human Task
```

## File Map (target structure when complete)

```
src/
  main.tsx
  App.tsx
  index.css
  test-setup.ts
  types/
    workspace.ts
    template.ts
    review.ts
  lib/
    sdk.ts                # SDK singleton — getSDK() only
    buckets.ts            # buildBucketKey(), upload/download helpers
    entities.ts           # Workspace + Template + Guideline CRUD
    maestro.ts            # startComparison()
    tasks.ts              # listPendingTasks(), confirmTask(), rejectTask()
  hooks/
    useTaskPolling.ts     # 5s poll for pending human tasks
    useWorkspace.ts
  components/
    layout/
      AppShell.tsx
      Sidebar.tsx
    workspace/
      WorkspaceBrowser.tsx
      WorkspaceCard.tsx
      WorkspaceDetail.tsx
      VersionList.tsx
      RunComparisonForm.tsx
      ComparisonHistory.tsx
    review/
      ReviewWorkspace.tsx
      DocumentPanel.tsx
      PdfViewer.tsx
      DocxViewer.tsx
      FindingsSidebar.tsx
      HighlightLayer.tsx
      ConfirmBar.tsx
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
tailwind.config.ts
postcss.config.ts
uipath.json
```

---

## Critical Contracts (never change these)

**Process name** — must match UiPath Maestro exactly:
```typescript
sdk.MaestroProcesses.start({ processName: 'ContractComparisonProcess', ... })
```

**Bucket path** for review download:
```
workspaces/{workspaceId}/comparisons/{comparisonId}/review.json
```

**ReviewPayload schema** (src/types/review.ts):
- `findings[].deviationType`: `"high-risk" | "medium-risk" | "aligned" | "missing" | "modified" | "extra"`
- `findings[].snippetA`: verbatim text — mark.js fuzzy-matches this in the DOM
- `findings[].insertAfterClause`: only on `missing` findings
- `scorecard[].status`: `"HIGH" | "MEDIUM" | "OK" | "MISSING" | "MODIFIED" | "EXTRA"`
- `taskId`: populated by Maestro after CreateHumanTask

**SDK singleton pattern** (src/lib/sdk.ts):
```typescript
import { UiPath } from '@uipath/uipath-typescript';
let instance: InstanceType<typeof UiPath> | null = null;
export async function getSDK() {
  if (instance) return instance;
  instance = new UiPath();
  await instance.initialize();
  return instance;
}
```

**Human task polling** — 5s interval, no shorter:
```typescript
const POLL_INTERVAL_MS = 5000;
```

---

## Commands

```bash
npm run dev          # Vite dev server → http://localhost:5173
npm run build        # tsc + vite build → dist/
npm test             # vitest run (all tests)
npm test -- <path>   # run single test file
npx tsc --noEmit     # type check only
```

---

## Task Status (check TODO.md for latest)

| Task | Description | Status |
|------|-------------|--------|
| T1 | Vite + React scaffold | `[x]` |
| T2 | Domain types | `[~]` |
| T3 | SDK singleton | `[ ]` |
| T4 | Bucket utilities | `[ ]` |
| T5 | Entity helpers | `[ ]` |
| T6 | Maestro + Tasks + polling hook | `[ ]` |
| T7 | App shell + routing | `[ ]` |
| T8 | Workspace browser + card | `[ ]` |
| T9 | Workspace detail | `[ ]` |
| T10 | Document renderer (PDF + DOCX) | `[ ]` |
| T11 | Highlight layer (mark.js) | `[ ]` |
| T12 | Review workspace (HITL UI) | `[ ]` |
| T13 | Admin screens | `[ ]` |
| T14 | Build + deploy | `[ ]` |

---

## Current Task for Copilot

> **Claude updates this section when assigning the next task. Implement only what is described here.**

### Task 2: Domain Types

**Goal:** Create the three core TypeScript type files. No logic — types only. `npx tsc --noEmit` must pass with zero errors.

**Files to create:**
- `src/types/workspace.ts`
- `src/types/template.ts`
- `src/types/review.ts`

---

**Step 1 — Create `src/types/workspace.ts`:**
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

**Step 2 — Create `src/types/template.ts`:**
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

**Step 3 — Create `src/types/review.ts`:**

> CRITICAL: These exact union values are shared with Plan B (Maestro agents). Do not change them.

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

**Step 4 — Verify:**
```bash
npx tsc --noEmit
```
Expected: no output (zero errors).

**Step 5 — Commit:**
```bash
git add src/types/
git commit -m "feat: add domain types for workspace, template, review"
```

**Done when:** `npx tsc --noEmit` exits clean. Report: list the 3 files created + paste tsc output.

---

## How to Report Completion

When done with a task, provide:
1. **What you created/modified** (list of files)
2. **Test results** (paste `npm test` output if tests were written)
3. **TypeScript check** (paste `npx tsc --noEmit` output)
4. **Commit hash** or message

Claude Code will review and assign the next task.
