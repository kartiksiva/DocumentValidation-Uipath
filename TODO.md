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
| `[x]` | **T14** Build + deploy | Deployed to https://kartizpujinj.uipath.host/contractai (Shared folder). Pack: `contractai.1.0.0.nupkg`. Add deployed URL to External App redirect URIs in UiPath Cloud Admin |

---

## Plan B — Maestro + Agents (Python / Studio Web)

Reference: `docs/superpowers/plans/2026-05-24-plan-b-python.md` ← **active plan**  
Old C# plan: `docs/superpowers/plans/2026-05-24-maestro-agents-plan.md` (archived — Studio Web is Python only)

| Status | Task | Notes |
|--------|------|-------|
| `[x]` | **PB-T0** Assets + Context Grounding | 7 assets + `contract-guidelines` CG index already created in Shared folder |
| `[ ]` | **PB-T1** Solution scaffold | `uip solution init ContractComparisonSolution` + init flow + 3 agent projects + GuidelineIndexerSolution |
| `[ ]` | **PB-T2** Shared Pydantic schemas | `schemas.py` — ClauseBlock, DocumentClauses, RawFinding, ReviewPayload (mirrors Plan A types) |
| `[ ]` | **PB-T3** Extractor agent | `extractor/main.py` — LangGraph, download from Buckets, DU + LLM fallback, returns DocumentClauses |
| `[ ]` | **PB-T4** Comparator agent | `comparator/main.py` — LangGraph, Context Grounding RAG, batch LLM, returns RawFinding list |
| `[ ]` | **PB-T5** Reviewer agent | `reviewer/main.py` — LangGraph, scorecard + narrative, writes review.json to bucket |
| `[ ]` | **PB-T6** Maestro flow | `ContractComparisonProcess.flow` — orchestrates agents + CreateHumanTask + HITL wait + status update |
| `[ ]` | **PB-T7** Guideline indexer agent | `guideline-indexer/main.py` — LangGraph, chunk + index PDF/DOCX into Context Grounding |
| `[ ]` | **PB-T8** Deploy + E2E | Deploy agents → pack+publish flow → test 5 E2E scenarios from spec |

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
