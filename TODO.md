# Project TODO — Contract Comparison Agent

Last updated: 2026-05-24 (Plan A implementation complete — awaiting Claude review)

## Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
- `[*]` To be reviewed
- `[!]` Blocked / needs decision

---

## Setup & Docs

| Status | Item | Notes |
|--------|------|-------|
| `[x]` | Design spec | `docs/superpowers/specs/2026-05-23-contract-comparison-agent-design.md` |
| `[x]` | Plan A — Coded App | `docs/superpowers/plans/2026-05-24-coded-app-plan.md` |
| `[x]` | Plan B — Maestro + Agents | `docs/superpowers/plans/2026-05-24-maestro-agents-plan.md` |
| `[x]` | CLAUDE.md | Karpathy guidelines + architecture + Plan A↔B contracts |
| `[x]` | GEMINI.md | Exists, covers project overview |

---

## Plan A — Coded App (React + Vite)

Reference: `docs/superpowers/plans/2026-05-24-coded-app-plan.md`

| Status | Task | Notes |
|--------|------|-------|
| `[x]` | **T1** Vite + React scaffold | `npm install`, `vite.config.ts`, `index.html`, `tailwind`, `tsconfig.json` |
| `[x]` | **T2** Domain types | `src/types/workspace.ts`, `template.ts`, `review.ts` |
| `[x]` | **T3** SDK singleton | `initPromise` pattern — safe for concurrent callers. Fixed `TemplateMode`→`ComparisonMode` + `taskId: string`→`number` |
| `[x]` | **T4** Bucket utilities | `buildBucketKey()`, `initBuckets()`, upload/download helpers |
| `[x]` | **T5** Entity helpers | Provider abstraction: `VITE_ENTITY_PROVIDER=supabase` (default) or `uipath`. Facade in `entities.ts`, implementations in `entity-providers/` |
| `[x]` | **T6** Maestro + Tasks | `startComparison()`, `listPendingTasks()`, `useTaskPolling` 5s hook |
| `[x]` | **T7** App shell + routing | `AppShell`, `Sidebar` with pending badge, all routes including `/reviews` |
| `[x]` | **T8** Workspace browser | Card grid, search/filter, `WorkspaceBrowser` + `WorkspaceCard` |
| `[x]` | **T9** Workspace detail | `VersionList`, `RunComparisonForm`, `ComparisonHistory`, `WorkspaceDetail` |
| `[x]` | **T10** Document renderer | `PdfViewer` (react-pdf, URL revoked), `DocxViewer` (mammoth + DOMPurify), `DocumentPanel` |
| `[x]` | **T11** Highlight layer | mark.js fuzzy match on `finding.snippetA`, per-type CSS classes |
| `[x]` | **T12** Review workspace | `FindingsSidebar`, `ConfirmBar`, `ReviewWorkspace` — full HITL confirm/reject |
| `[x]` | **T13** Admin screens | `TemplateManager`, `GuidelineLibrary` — upload + CRUD |
| `[ ]` | **T14** Build + deploy | **Community:** create Supabase tables + set env vars. **Enterprise:** create Data Fabric entity types + add DataFabric scopes. Then `uip codedapp pack/publish/deploy` |

---

## Plan B — Maestro + Agents (UiPath Studio / C#)

Reference: `docs/superpowers/plans/2026-05-24-maestro-agents-plan.md`

| Status | Task | Notes |
|--------|------|-------|
| `[!]` | **T1** Studio project setup | Need UiPath Studio installed. Two projects: `ContractComparisonAgent` + `GuidelineIndexer` |
| `[x]` | **T2** Assets + Orchestrator config | 7 assets created in Shared folder. Buckets: contract-workspaces, contract-guidelines |
| `[x]` | **T3** Azure AI Search index | Replaced by UiPath Context Grounding. Index `contract-guidelines` created in Shared folder from contract-guidelines bucket |
| `[ ]` | **T4** Helper classes | `BucketClient.cs`, `AzureSearchClient.cs`, `LlmClient.cs` |
| `[ ]` | **T5** JSON schemas | `ClauseJSON`, `FindingsJSON`, `ReviewPayload` schemas in `data/` |
| `[ ]` | **T6** Agent 1 — Extractor | `ExtractClauses.cs` — DU + LLM fallback (threshold: 0.75) |
| `[ ]` | **T7** Agent 2 — Comparator | `CompareClauses.cs` — batch size 7, RAG top-5, Azure AI Search |
| `[ ]` | **T8** Agent 3 — Reviewer | `GenerateReview.cs` — scorecard, compliance %, narrative |
| `[ ]` | **T9** Main orchestration | `Main.xaml` — `ContractComparisonProcess` (exact name, must match Plan A) |
| `[ ]` | **T10** Guideline indexer | `GuidelineIndexer/Main.xaml` — `GuidelineIndexingProcess` |
| `[ ]` | **T11** E2E verification | All 7 scenarios from spec §12 |

---

## Decisions Needed

| Status | Decision | Options | Notes |
|--------|----------|---------|-------|
| `[x]` | LLM model | UiPath managed gpt-4o | `UiPathAzureChatOpenAI()` — no BYO keys needed |
| `[x]` | Azure subscription | Not needed | Using UiPath Context Grounding instead of Azure AI Search |
| `[!]` | UiPath tenant details | `clientId`, `organization`, `tenant` | Goes in `uipath.json` — don't commit real values |
| `[!]` | Execution mode for Plan A | Inline session vs batched subagents | Context at 60% — start fresh session recommended |

---

## Context / Session Notes

Plan A T3–T13 implemented across sessions. Two rounds of code review + fixes applied (commits `4bc56e4`, `a826b4d`, `01da12e`). All 26 tests pass · tsc clean. Awaiting Claude's final sign-off before T14 (deploy).
