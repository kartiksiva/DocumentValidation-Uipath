# GitHub Copilot — Contract Comparison Agent

**Your role:** Code builder. Claude Code is the planner and reviewer. You implement one task at a time, commit it, and report back. Do not add features beyond the task. Do not refactor adjacent code.

---

## Project

**Contract Comparison Agent** — UiPath Coded App (React + Vite) that lets business users compare legal contracts. AI pipeline runs via UiPath Maestro on the backend. This repo is the frontend only.

Tech stack: React 19, Vite, TypeScript, Tailwind CSS, react-router-dom v7, react-pdf, mammoth, mark.js, @uipath/uipath-typescript, vitest, @testing-library/react

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

## Target `src/` Structure

```
src/
  types/        workspace.ts · template.ts · review.ts
  lib/          sdk.ts · buckets.ts · entities.ts · maestro.ts · tasks.ts
  hooks/        useTaskPolling.ts · useWorkspace.ts
  components/   layout/ · workspace/ · review/ · admin/
  pages/        WorkspacesPage · WorkspaceDetailPage · ReviewPage · TemplatesPage · GuidelinesPage
```

Full file-by-file breakdown: `docs/superpowers/plans/2026-05-24-coded-app-plan.md`

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
npm test             # vitest run (all tests, CI mode)
npm run test:watch   # vitest watch mode
npm test -- <path>   # run single test file
npx tsc --noEmit     # type check only
```

Vitest is configured with `globals: true` — no need to import `describe`, `it`, `expect` in test files. `@testing-library/jest-dom` matchers (e.g., `toBeInTheDocument`) are available via `src/test-setup.ts`.

`vite.config.ts` loads `@uipath/coded-apps-dev/vite` — this plugin injects OAuth at dev time and sets `base: './'` for UiPath Cloud deployment compatibility. Do not remove it.

---

## Task Status

See `TODO.md` for the authoritative task list. T1 (scaffold) and T2 (domain types) are `[x]` done. The "Current Task for Copilot" section below is updated by Claude Code before each session.

---

## Current Task for Copilot

> **Claude updates this section when assigning the next task. Implement only what is described here.**

### Task 3: SDK Singleton + Type Fix

Two parts: fix a type inconsistency from T2, then build the SDK singleton.

---

#### Part A — Fix mode type inconsistency (surgical, types only)

`workspace.ts` defines `ComparisonMode = 'buyer-seller-diff' | 'template-compliance'`.  
`template.ts` defines `TemplateMode = 'buyer-seller' | 'compliance'` — different values for the same concept.

**Fix:** Delete `TemplateMode` from `template.ts`. Change `Template.comparisonMode` to use `ComparisonMode` imported from `workspace.ts`. Also type `ReviewPayload.mode` in `review.ts` as `ComparisonMode` (import from `workspace.ts`) instead of `string`.

After fix, `npx tsc --noEmit` must still be clean.

---

#### Part B — SDK singleton (`src/lib/sdk.ts`)

**Goal:** Single file that owns the `UiPath` instance. Zero tests needed (SDK is a third-party class — don't mock it). `npx tsc --noEmit` must pass.

**Create `src/lib/sdk.ts`:**
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

That is the entire file. No exports beyond `getSDK`. No error handling — `initialize()` throws if auth fails and that is correct behavior.

---

**Verify:**
```bash
npx tsc --noEmit
```
Expected: no output.

**Commit (two commits):**
```bash
git add src/types/
git commit -m "fix: align TemplateMode with ComparisonMode, type ReviewPayload.mode"

git add src/lib/sdk.ts
git commit -m "feat: add SDK singleton (getSDK)"
```

**Done when:** Two commits made, `npx tsc --noEmit` clean. Report: paste tsc output + both commit hashes.

---

## How to Report Completion

When done with a task, provide:
1. **What you created/modified** (list of files)
2. **Test results** (paste `npm test` output if tests were written)
3. **TypeScript check** (paste `npx tsc --noEmit` output)
4. **Commit hash** or message

Claude Code will review and assign the next task.
