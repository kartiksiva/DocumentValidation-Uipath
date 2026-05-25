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
- **schemas.py exists in 5 places** — `ContractComparisonSolution/schemas.py` (canonical) + 4 agent copies. When changing any schema, update the canonical file first then `cp` it to all 4 agent dirs: `extractor/`, `comparator/`, `reviewer/`, `GuidelineIndexerSolution/guideline-indexer/`.

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

### PB-T7 — Guideline Indexer Agent

**File:** `GuidelineIndexerSolution/guideline-indexer/main.py`  
**Framework:** LangGraph (same pattern as extractor/comparator/reviewer)

---

#### What it does

Triggered from Plan A admin UI (user uploads a guideline PDF/DOCX → Maestro calls this agent). Takes a file from the `contract-workspaces` bucket (where Plan A uploaded it) and makes it searchable in the `contract-guidelines` Context Grounding index.

---

#### Input / Output (already defined in `schemas.py`)

```python
class IndexerInput(BaseModel):
    bucket_name: str           # always 'contract-workspaces'
    guideline_key: str         # bucket key of the PDF/DOCX (from Plan A upload)
    guideline_id: str
    guideline_name: str
    context_grounding_index: str  # always 'contract-guidelines'

class IndexerOutput(BaseModel):
    guideline_id: str
    chunk_count: int           # 0 if CG handles chunking; actual count if we chunk manually
    status: str                # 'indexed'
```

---

#### Graph nodes

```
download_guideline → upload_to_cg_bucket → return_status → END
```

1. **`download_guideline`** — download the PDF/DOCX from `contract-workspaces` bucket:
   ```python
   sdk = UiPath()
   await sdk.buckets.download_async(
       name=state.bucket_name,
       blob_file_path=state.guideline_key,
       destination_path=tmp_path,
   )
   ```

2. **`upload_to_cg_bucket`** — upload the file to the `contract-guidelines` storage bucket (which backs the CG index — UiPath auto-indexes files added to this bucket):
   ```python
   cg_key = f"guidelines/{state.guideline_id}/{os.path.basename(state.guideline_key)}"
   await sdk.buckets.upload_async(
       name=state.context_grounding_index,   # 'contract-guidelines' bucket
       blob_file_path=cg_key,
       source_path=tmp_path,
   )
   ```
   **Note:** The `contract-guidelines` CG index was pre-configured to auto-index from the `contract-guidelines` storage bucket (PB-T0). No explicit chunking code needed — the UiPath CG infrastructure handles it.

3. **`return_status`** — return output:
   ```python
   return IndexerOutput(guideline_id=state.guideline_id, chunk_count=0, status="indexed")
   ```
   `chunk_count=0` is acceptable; CG chunking is opaque. Update if SDK exposes a count.

---

#### State model

```python
class IndexerState(IndexerInput):
    tmp_path: str = ""
    cg_key: str = ""
```

---

#### Required patterns

- **Always use `try/finally` to cleanup temp files** — same pattern as reviewer
- **`UiPath()` called once per node that needs SDK** — don't store at module level
- **Graph:** `StateGraph(IndexerState, input=IndexerInput, output=IndexerOutput)`
- **`graph = builder.compile()`** at module level

---

#### Known limitation (no fix needed)

Plan A creates the Guideline in Supabase with `indexingStatus='indexing'`. After this agent runs, the status in Supabase is NOT automatically updated to `'indexed'` — the agent doesn't have Supabase access. This is acceptable for now: the Supabase update will be triggered by a Maestro wrapper process (PB-T8). The `IndexerOutput` carries `status='indexed'` for the flow to act on.

---

#### Completion report

Provide:
1. `GuidelineIndexerSolution/guideline-indexer/main.py` content
2. Commit hash

No test run needed (PB-T7 verified at deploy time in PB-T8).

---

### [Archive] PB-T6 — Maestro Flow + Supporting Schema/Plan A Updates

This task has 4 parts. Complete all 4. Run `npx tsc --noEmit` after the Plan A changes.

---

#### Part 1 — schemas.py: add `task_id` to `ReviewerInput`

In `ContractComparisonSolution/schemas.py` (canonical), add one field to `ReviewerInput`:

```python
class ReviewerInput(BaseModel):
    workspace_id: str
    comparison_id: str
    bucket_name: str
    mode: str
    findings: list[RawFinding]
    template_system_message: str
    task_id: int = 0  # passed from Maestro after CreateHumanTask
```

Then copy to all 4 agent dirs (surgical copy — only `ReviewerInput` changes):
```bash
cp ContractComparisonSolution/schemas.py ContractComparisonSolution/extractor/schemas.py
cp ContractComparisonSolution/schemas.py ContractComparisonSolution/comparator/schemas.py
cp ContractComparisonSolution/schemas.py ContractComparisonSolution/reviewer/schemas.py
cp ContractComparisonSolution/schemas.py GuidelineIndexerSolution/guideline-indexer/schemas.py
```

---

#### Part 2 — `reviewer/main.py` line 129: use `state.task_id`

Change one line in `assemble_payload`:

```python
# BEFORE:
task_id=0,  # Maestro patches this after CreateHumanTask

# AFTER:
task_id=state.task_id,
```

Remove the comment (stale now).

---

#### Part 3 — Plan A: pass template data to Maestro process

**`src/lib/maestro.ts`** — add two fields to `StartComparisonInput`:

```typescript
export interface StartComparisonInput {
  workspaceId: string;
  bucketName: string;
  docAKey: string;
  docBKey: string;
  mode: ComparisonMode;
  templateId: string;
  templateSystemMessage: string;   // ← new: template.systemMessage
  linkedGuidelineIds: string[];    // ← new: template.linkedGuidelineIds
  includeVersionHistory: boolean;
  comparisonId: string;
}
```

**`src/components/workspace/RunComparisonForm.tsx`** — look up selected template and pass its fields:

```typescript
// Inside handleRun(), after const comparisonId = uuidv4():
const selectedTemplate = templates.find(t => t.id === templateId);
await startComparison({
  workspaceId: workspace.id,
  bucketName: 'contract-workspaces',
  docAKey: vA.bucketKey,
  docBKey: vB.bucketKey,
  mode,
  templateId,
  templateSystemMessage: selectedTemplate?.systemMessage ?? '',
  linkedGuidelineIds: selectedTemplate?.linkedGuidelineIds ?? [],
  includeVersionHistory: includeHistory,
  comparisonId,
});
```

Run `npx tsc --noEmit` — must be clean.

---

#### Part 4 — `ContractComparisonProcess.flow`: full flow implementation

**Use the `@AGENTS.md` / uipath-maestro-flow skill docs for exact .flow JSON syntax.**

Rewrite `ContractComparisonSolution/ContractComparisonProcess/ContractComparisonProcess.flow` with this topology. **All 3 agents are in the same solution — discover them with `uip maestro flow registry list --local --output json` and wire as sibling-agent resource nodes.**

Flow inputs (from manual trigger / process start):
```
workspaceId, comparisonId, bucketName,
docAKey, docBKey, mode,
templateSystemMessage, linkedGuidelineIds
```

Nodes in order:

1. **Manual trigger** (already exists — keep, add input schema)

2. **CallExtractor** — call `extractor` agent  
   Input mapping:
   ```
   bucket_name       ← bucketName
   doc_a_key         ← docAKey
   doc_b_key         ← docBKey
   workspace_id      ← workspaceId
   comparison_id     ← comparisonId
   ```
   Output stored as: `extractorOutput`

3. **CallComparator** — call `comparator` agent  
   Input mapping:
   ```
   doc_a                  ← extractorOutput.doc_a
   doc_b                  ← extractorOutput.doc_b
   mode                   ← mode
   template_system_message ← templateSystemMessage
   linked_guideline_ids   ← linkedGuidelineIds
   ```
   Output stored as: `comparatorOutput`

4. **CreateHumanTask** — HITL node  
   Task data: `{ comparisonId, workspaceId }`  
   Output: `taskId` (integer)

5. **CallReviewer** — call `reviewer` agent  
   Input mapping:
   ```
   workspace_id            ← workspaceId
   comparison_id           ← comparisonId
   bucket_name             ← bucketName
   mode                    ← mode
   findings                ← comparatorOutput.findings
   template_system_message ← templateSystemMessage
   task_id                 ← taskId
   ```
   (Reviewer writes `review.json` to bucket with correct `taskId`)

6. **WaitForHumanDecision** — suspend until HITL  
   Output: `hitlAction` (the human's decision: Confirm or Reject)

7. **CheckDecision** — condition branch on `hitlAction`  
   - Confirmed → **End (success)**
   - Rejected → **End (rejected)**

**Validate:** `uip maestro flow validate --output json` must return no errors.

---

#### Completion report

Provide:
1. List of files modified
2. `npx tsc --noEmit` output (Plan A)
3. `uip maestro flow validate --output json` output
4. Commit hash

---

## How to Report Completion

When done with a task, provide:
1. **What you created/modified** (list of files)
2. **Test results** (paste `npm test` output if tests were written)
3. **TypeScript check** (paste `npx tsc --noEmit` output)
4. **Commit hash** or message

Claude Code will review and assign the next task.
