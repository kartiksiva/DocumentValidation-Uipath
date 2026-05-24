# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Collaboration Model

**Claude Code = Planner + Reviewer** (token-conserving role)
**GitHub Copilot = Code Builder** (implementation role)

### Claude's responsibilities
- Read TODO.md to determine next task
- Assign specific task to Copilot via `.github/copilot-instructions.md` updates
- Review Copilot's output: type check, test results, architectural correctness, contract compliance
- Update TODO.md on task completion
- Flag issues back to Copilot with precise file:line feedback
- Never implement feature code directly — conserve tokens for planning/review

### Handoff protocol
1. Claude reads TODO.md → identifies next `[ ]` task
2. Claude updates "Current Task for Copilot" section in `.github/copilot-instructions.md`
3. Copilot implements, commits, reports back
4. Claude reviews (run `npm test`, `npx tsc --noEmit`, read changed files)
5. Claude marks task `[x]` in TODO.md or sends correction to Copilot
6. Repeat

### Token budget rule
Claude reads plan files only to extract the specific task needed. Never read entire plan for orientation — use TODO.md + targeted plan section reads only.

---

## Coding Guidelines (Always Apply)

Derived from Karpathy's LLM coding pitfalls. Non-negotiable for every change.

**Think first:** State assumptions explicitly. If multiple interpretations exist, surface them — don't pick silently. If a simpler approach exists, say so.

**Minimum code:** No features beyond what was asked. No abstractions for single-use code. No error handling for impossible scenarios. If 200 lines could be 50, rewrite.

**Surgical edits:** Touch only what the request requires. Don't improve adjacent code, comments, or formatting. Match existing style. Remove only imports/variables made unused by *your* changes — not pre-existing dead code.

**Verifiable goals:** Transform every task into a checkable outcome before starting:
- "Add validation" → write failing tests first, then make them pass
- "Fix bug" → reproduce it in a test, then fix
- State a brief step→verify plan for multi-step tasks

---

## Project

Contract Comparison Agent — a UiPath Coded App (React + Vite) that lets business users compare legal contracts via an AI pipeline orchestrated by UiPath Maestro. Two implementation projects:

- **Current status + task tracker:** `TODO.md` ← start here
- **Plan A (Coded App / frontend):** `docs/superpowers/plans/2026-05-24-coded-app-plan.md`
- **Plan B (Maestro + Agents / backend):** `docs/superpowers/plans/2026-05-24-maestro-agents-plan.md`
- **Design spec:** `docs/superpowers/specs/2026-05-23-contract-comparison-agent-design.md`

## Commands

```bash
npm run dev          # Vite dev server → http://localhost:5173
npm run build        # tsc + vite build → dist/
npm test             # vitest run (all tests)
npm test -- <path>   # run single test file
npx tsc --noEmit     # type check only
```

## Architecture

Five layers (UI-agnostic — swap the Coded App without touching Maestro):

```
Coded App (React + Vite)           ← Plan A
  ↕ Entity Provider (VITE_ENTITY_PROVIDER)
  │   supabase  → Supabase (Community Edition, default)
  │   uipath    → UiPath Data Fabric (Enterprise/Pro)
  ↕ @uipath/uipath-typescript SDK (browser, no backend)
UiPath Platform Services
  Buckets · Tasks · Processes
  ↕ Maestro SDK
ContractComparisonProcess          ← Plan B, Main.xaml
  Mode Router → Template Loader → Agent 1 → Agent 2 → Agent 3 → Human Task
  ↕ Agent calls (C# Coded Workflows)
Storage & Knowledge
  Buckets · UiPath Context Grounding (RAG) · Assets
```

## Entity Provider Setup

Entity storage is selected at build/dev time via the `VITE_ENTITY_PROVIDER` env var in `.env.local`.

### Community Edition (default) — Supabase
```bash
VITE_ENTITY_PROVIDER=supabase      # or omit (supabase is default)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
Required Supabase tables: `contract_workspaces`, `templates`, `guidelines` (snake_case columns matching the domain types).

### Enterprise/Pro — UiPath Data Fabric
```bash
VITE_ENTITY_PROVIDER=uipath
```
Add DataFabric scopes to `uipath.json`:
```json
"scope": "OR.Buckets OR.Tasks OR.Jobs PIMS DataFabric.Schema.Read DataFabric.Data.Read DataFabric.Data.Write"
```
Required entity types in UiPath Data Service (Admin → Data Service): `ContractWorkspace`, `Template`, `Guideline`.

### Provider abstraction files
```
src/lib/entity-providers/
  interface.ts   — EntityStore interface (all providers implement this)
  index.ts       — factory: reads VITE_ENTITY_PROVIDER, lazy-loads the right module
  supabase.ts    — Supabase implementation
  uipath.ts      — UiPath Data Fabric implementation
src/lib/entities.ts  — thin public facade; always call these, never import providers directly
src/lib/supabase.ts  — bare Supabase client (shared by supabase.ts provider)
```

## Critical Contracts Between Plan A and Plan B

**Process name** (must be exact string):
```typescript
sdk.processes.start({ processName: 'ContractComparisonProcess', inputArguments: JSON.stringify(input) }, folderId)
```

**Bucket path** Plan A downloads review from:
```
workspaces/{workspaceId}/comparisons/{comparisonId}/review.json
```

**`ReviewPayload` schema** (`src/types/review.ts` ↔ Plan B `GenerateReview.cs`):
- `findings[].deviationType`: `"high-risk" | "medium-risk" | "aligned" | "missing" | "modified" | "extra"`
- `findings[].snippetA`: exact verbatim text — mark.js uses fuzzy DOM search on this
- `findings[].insertAfterClause`: only on `missing` findings — UI renders dashed gap here
- `scorecard[].status`: `"HIGH" | "MEDIUM" | "OK" | "MISSING" | "MODIFIED" | "EXTRA"`
- `taskId`: populated by Main.xaml after `CreateHumanTask`, before storing `review.json`

## Key SDK Patterns

```typescript
// Always use the singleton — never `new UiPath()` outside sdk.ts
// Uses initPromise pattern to handle concurrent callers safely
import { getSDK } from './lib/sdk';
const sdk = await getSDK();

// Entity CRUD — always via entities.ts facade, never import providers directly
import { listWorkspaces, createWorkspace } from './lib/entities';

// Bucket key builder — use this, never hardcode paths
import { buildBucketKey } from './lib/buckets';

// Human task polling — 5s interval via useTaskPolling hook
import { useTaskPolling } from './hooks/useTaskPolling';
```

## UiPath Assets (Plan B)

All configurable thresholds live in Orchestrator Assets (Shared folder) — never hardcode:
`COMPARATOR_BATCH_SIZE` (7), `RAG_TOP_K` (5), `DU_HIERARCHY_CONFIDENCE_THRESHOLD` (0.75), `RISK_THRESHOLD_HIGH` (0.7), `RISK_THRESHOLD_MEDIUM` (0.4), `LLM_MODEL` (gpt-4o), `CONTEXT_GROUNDING_INDEX_NAME` (contract-guidelines).

**No Azure AI Search.** RAG uses UiPath Context Grounding: index `contract-guidelines` in Shared folder, sourced from `contract-guidelines` storage bucket. Agent 2 calls `sdk.context_grounding.unified_search_async(index_name=asset("CONTEXT_GROUNDING_INDEX_NAME"), ...)`. **No external LLM endpoint.** LLM uses UiPath managed `gpt-4o` via `UiPathAzureChatOpenAI()` — no custom auth or endpoint config.

## Deployment

- Coded App: Cloud-only (UiPath Automation Cloud). Auth via OAuth injected by `@uipath/coded-apps-dev` at deploy time — no custom auth code.
- `uipath.json` at root: clientId, scopes, organization, tenant, baseUrl. Fill before deploying.
- Maestro processes publish from UiPath Studio → Orchestrator → deployed as unattended robots.
