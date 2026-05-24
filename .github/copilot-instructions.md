# GitHub Copilot — Contract Comparison Agent

**Your role:** Code builder. Claude Code is the planner and reviewer. You implement one task at a time, commit it, and report back. Do not add features beyond the task. Do not refactor adjacent code.

---

## Project

**Contract Comparison Agent** — UiPath Coded App (React + Vite) that lets business users compare legal contracts. AI pipeline runs via UiPath Maestro on the backend. This repo is the frontend only.

Tech stack: React 19, Vite, TypeScript, Tailwind CSS, react-router-dom v7, react-pdf, mammoth, mark.js, @uipath/uipath-typescript, @supabase/supabase-js, dompurify, vitest, @testing-library/react

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
- **No direct provider imports.** Always use the facade in `src/lib/entities.ts`, never import from `src/lib/entity-providers/` directly.
- **Process name must be exact string:** `'ContractComparisonProcess'` — never change this.
- **No custom auth code.** OAuth injected by `@uipath/coded-apps-dev` at deploy time.

---

## Architecture

```
Coded App (React + Vite)           ← THIS REPO
  ↕ Entity Provider (VITE_ENTITY_PROVIDER env var)
  │   supabase  → Supabase (Community Edition, default)
  │   uipath    → UiPath Data Fabric (Enterprise/Pro)
  ↕ @uipath/uipath-typescript SDK (browser, no backend)
UiPath Platform Services
  Buckets · Tasks · Processes
  ↕ Maestro SDK
ContractComparisonProcess          ← separate UiPath Studio project
  Agent 1 (Extractor) → Agent 2 (Comparator) → Agent 3 (Reviewer) → Human Task
```

## `src/` Structure

```
src/
  types/        workspace.ts · template.ts · review.ts
  lib/
    sdk.ts               # UiPath SDK singleton (initPromise pattern)
    buckets.ts           # bucket key builder + upload/download + initBuckets()
    entities.ts          # public facade — always import from here
    maestro.ts           # startComparison()
    tasks.ts             # listPendingTasks · confirmTask · rejectTask
    supabase.ts          # bare Supabase client
    entity-providers/
      interface.ts       # EntityStore interface
      index.ts           # factory (reads VITE_ENTITY_PROVIDER)
      supabase.ts        # Supabase implementation
      uipath.ts          # UiPath Data Fabric implementation
  hooks/        useTaskPolling.ts
  components/   layout/ · workspace/ · review/ · admin/
  pages/        WorkspacesPage · WorkspaceDetailPage · ReviewPage · ReviewsPage · TemplatesPage · GuidelinesPage
```

## Critical Contracts (never change these)

**Process name** — must match UiPath Maestro exactly:
```typescript
sdk.processes.start({ processName: 'ContractComparisonProcess', inputArguments: JSON.stringify(input) }, folderId)
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

**SDK singleton pattern** (src/lib/sdk.ts) — uses `initPromise` so concurrent callers share one init:
```typescript
import { UiPath } from '@uipath/uipath-typescript';
let initPromise: Promise<InstanceType<typeof UiPath>> | null = null;
export function getSDK() {
  if (!initPromise) {
    const instance = new UiPath();
    initPromise = instance.initialize().then(() => instance);
  }
  return initPromise;
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
npm test             # vitest run (all tests, CI mode)
npm run test:watch   # vitest watch mode
npm test -- <path>   # run single test file
npx tsc --noEmit     # type check only
```

Vitest is configured with `globals: true` — no need to import `describe`, `it`, `expect` in test files. `@testing-library/jest-dom` matchers (e.g., `toBeInTheDocument`) are available via `src/test-setup.ts`.

`vite.config.ts` loads `@uipath/coded-apps-dev/vite` — this plugin injects OAuth at dev time and sets `base: './'` for UiPath Cloud deployment compatibility. Do not remove it.

---

## Task Status

See `TODO.md` for the authoritative task list. T1–T13 are `[x]` complete. T14 (deploy) is pending — requires Data Fabric entity types (Enterprise) or Supabase tables (Community) to be created first.

---

## Current Task for Copilot

> **Claude updates this section when assigning the next task. Implement only what is described here.**

### All Plan A tasks complete (T1–T13)

The frontend implementation is done. Awaiting T14 (deploy) after infrastructure setup:

**Community Edition path:**
1. Create Supabase tables: `contract_workspaces`, `templates`, `guidelines`
2. Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env.local`
3. Run `npm run build` then `uip codedapp pack/publish/deploy`

**Enterprise path:**
1. Create entity types in UiPath Data Service: `ContractWorkspace`, `Template`, `Guideline`
2. Add DataFabric scopes to `uipath.json` scope string
3. Set `VITE_ENTITY_PROVIDER=uipath` in `.env.local`
4. Run `npm run build` then `uip codedapp pack/publish/deploy`

---

## How to Report Completion

When done with a task, provide:
1. **What you created/modified** (list of files)
2. **Test results** (paste `npm test` output if tests were written)
3. **TypeScript check** (paste `npx tsc --noEmit` output)
4. **Commit hash** or message

Claude Code will review and assign the next task.
