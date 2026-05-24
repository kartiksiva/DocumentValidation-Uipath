# Contract Comparison — Core Pipeline Implementation Plan

**Goal:** Orchestrate three Python AI agents (Extractor, Comparator, Reviewer) with a Maestro flow and HITL task to automate legal contract comparison, enabling procurement/sales teams to review AI-generated risk findings before finalisation.
**Source:** Design spec — `docs/superpowers/specs/2026-05-23-contract-comparison-agent-design.md`
**Project type:** AI Agent + Flow (multi-skill)
**Expression language:** N/A
**Approach:** explore-first
**Execution autonomy:** interactive
**App type:** N/A
**App state:** N/A
**UI targeting:** N/A
**Solution scope:** SW

## Understanding

This plan implements the **core backend pipeline** from the spec: three Python agents (Extractor for DU-based clause extraction, Comparator for LLM-based comparison with RAG grounding, Reviewer for scorecard/diff/narrative output), a Maestro `ContractComparisonProcess` flow wiring them together, and a human approval task. Vector store is UiPath AI Index. LLM is GPT-5.4 via UiPath AI Center (OpenAI). The Coded App UI is deferred to Phase 2. Storage uses UiPath Buckets (documents + results) and Entities/Data Fabric (Template Registry). All platform resources (Buckets, Entities, Assets) are provisioned first. Pattern 3 — Flow with deployed resources — applies here since agents self-deploy via `uipath-agents` before the flow references them.

## Decisions & Trade-offs

- **Three separate agents** rather than one multi-step agent: matches the spec's explicit pipeline split (Extractor → Comparator → Reviewer), enables independent testing, and allows the Maestro flow to observe outputs at each stage.
- **`uipath-agents` for Python agents:** The spec calls for DU integration, LLM reasoning, and RAG — all naturally expressed in Python. `uipath-agents` handles scaffold, deploy, and sync.
- **`uipath-human-in-the-loop` before the flow:** HITL task schema is authored first so the flow's Human Task node can reference the exact task form during wiring.
- **Platform resources first:** Buckets, Entities, and Assets must exist before any agent can read/write to them.
- **UiPath AI Index for RAG:** User-specified. Guideline indexing pipeline (DU → chunking → embedding) is part of the Comparator agent setup; a test guideline must be pre-indexed before Comparator tests can pass.
- **SW solution scope:** Flow will be published to Studio Web; local execution references a SW-published flow.
- **Phase 2 deferred:** Coded App UI (Review Workspace, Template Manager, Guidelines Library) is out of scope for this plan.

## Stop conditions

*(Interactive mode — user is available to resolve ambiguity as it arises.)*

---

## Task T1 — uipath-platform — Provision cloud resources

**Identity:** `platform:ContractComparison:resources`
**Status:** [ ] pending
**Blocked by:** none
**Skill prompt:**

> Load `uipath-platform` and provision all UiPath Cloud resources required by the contract comparison pipeline, as defined in this plan.
>
> 1. Storage Bucket `ContractComparisonBucket` with these key prefixes:
>    - `contracts/{contractId}/{version}/docA.pdf` and `docB.pdf`
>    - `templates/{templateId}/template.pdf`
>    - `guidelines/{guidelineId}/source.pdf`
>    - `results/{jobId}/extracted.json`, `findings.json`, `review.json`, `audit.json`
>    Version retention: never overwrite; retain all versions.
>
> 2. Data Fabric entity `Template` with fields:
>    - `id` (Text, PK), `name` (Text), `description` (Text), `bucketKey` (Text)
>    - `systemMessage` (Text, long), `linkedGuidelineIds` (Text — JSON array)
>    - `comparisonMode` (Text — "buyer-seller" | "compliance")
>    - `status` (Text — "active" | "draft")
>
> 3. UiPath Assets:
>    - `LLM_API_KEY` — credential (OpenAI key for GPT-5.4 via UiPath AI Center)
>    - `LLM_MODEL` — text, value: `gpt-5.4`
>    - `LLM_ENDPOINT` — text (UiPath AI Center LLM Gateway endpoint URL)
>    - `VECTOR_STORE_ENDPOINT` — text (UiPath AI Index endpoint URL)
>    - `VECTOR_STORE_KEY` — credential (UiPath AI Index API key)
>    - `RISK_THRESHOLD_HIGH` — text, value: `0.7`
>    - `RISK_THRESHOLD_MEDIUM` — text, value: `0.4`
>    - `RAG_TOP_K` — text, value: `5`
>
> 4. Seed one test Template entity: `id: "gafta-100", name: "GAFTA 100", comparisonMode: "compliance", status: "draft"` (systemMessage and linkedGuidelineIds populated post-guideline-indexing).
>
> Use values, mappings, and structure exactly as documented in this plan. Do not infer or guess.

- [ ] Create bucket `ContractComparisonBucket` with version retention (never overwrite)
- [ ] Create Data Fabric entity `Template` with all fields as specified
- [ ] Create all 8 Assets with their types and default values
- [ ] Seed test Template entity `gafta-100`
- [ ] **Validate:** `uip` CLI confirms bucket exists; `uip df entity list` shows `Template`; asset list shows all 8 assets

---

## Task T2 — uipath-agents — Agent 1: Extractor

**Identity:** `agents:ContractComparison:agents/extractor`
**Status:** [ ] pending
**Blocked by:** T1
**Skill prompt:**

> Load `uipath-agents` and build the Extractor agent in `src/agents/extractor/` within the project at `/Users/karthicks/kAgents/Projects/my-uipath-project`.
>
> **Purpose:** Pull two contract documents from UiPath Buckets, extract structured clause JSON from each, and return a combined extraction payload.
>
> **Inputs:** `bucketId: str`, `docAKey: str`, `docBKey: str`, `priorVersionKeys: list[str]` (optional)
>
> **Processing:**
> - Download each document from Buckets using the UiPath Python SDK
> - PDF: use UiPath Document Understanding to extract text with clause structure (headings, sub-clauses, definitions, signature blocks)
> - DOCX: convert with Python `mammoth` library → HTML → clause parser (BeautifulSoup/regex) identifying headings and body text
> - Output per document as `ClauseJSON`: `{ "clauses": [{ "id": "string", "heading": "string", "body": "string", "pageNumber": number }] }`
>
> **Output:** `{ "docA": ClauseJSON, "docB": ClauseJSON, "history": [ClauseJSON] }` (history only when priorVersionKeys provided)
>
> LLM is not used in this agent (pure extraction + parsing). Deploy after build.
>
> Use values, mappings, and structure exactly as documented in this plan. Do not infer or guess.

- [ ] Scaffold agent in `src/agents/extractor/` with `uip agents init` or equivalent
- [ ] Implement PDF extraction via UiPath Document Understanding SDK
- [ ] Implement DOCX → HTML → ClauseJSON parser using `mammoth` library + BeautifulSoup
- [ ] Implement clause structure parser: `id` (auto-generated), `heading`, `body`, `pageNumber` per clause
- [ ] Implement version history aggregation (populate `history` array when `priorVersionKeys` provided)
- [ ] Deploy agent via `uip agents deploy`
- [ ] **Validate:** `uip agents run` with a sample PDF and DOCX; confirm ClauseJSON output contains at least one clause per document with `heading` and `body` populated

---

## Task T3 — uipath-agents — Testing: Extractor (MANDATORY)

**Identity:** `agents:ContractComparison:testing-extractor`
**Status:** [ ] pending
**Blocked by:** T2
**Skill prompt:**

> Load `uipath-agents` and run its testing workflow end-to-end for the Extractor agent at `src/agents/extractor/`. Always thorough: happy path + edge cases + error scenarios. See that skill's testing references for commands, test-case authoring, and best practices. Do not describe the testing procedure here — the specialist owns it.
>
> Key scenarios: PDF happy path, DOCX happy path, document with no clear headings (graceful fallback), priorVersionKeys provided (history populated), invalid bucketKey (structured error, no crash).
>
> Use values, mappings, and structure exactly as documented in this plan. Do not infer or guess.

- [ ] Run testing workflow per `uipath-agents` testing reference
- [ ] **Validate:** all tests pass; record results

---

## Task T4 — uipath-agents — Agent 2: Comparator

**Identity:** `agents:ContractComparison:agents/comparator`
**Status:** [ ] pending
**Blocked by:** T1, T3
**Skill prompt:**

> Load `uipath-agents` and build the Comparator agent in `src/agents/comparator/` within the project at `/Users/karthicks/kAgents/Projects/my-uipath-project`.
>
> **Purpose:** Compare clause pairs using RAG-grounded LLM reasoning to produce structured findings.
>
> **Inputs:** `docA` (ClauseJSON), `docB` (ClauseJSON), `templateSystemMessage: str`, `linkedGuidelineIds: list[str]`, `mode: str` ("buyer-seller-diff" | "template-compliance")
>
> **Processing per clause pair:**
> 1. Query UiPath AI Index with clause text → retrieve top-K chunks (from `RAG_TOP_K` asset, default 5) filtered to `linkedGuidelineIds`
> 2. LLM call (GPT-5.4 via UiPath AI Center): System=`templateSystemMessage`, Context=guideline chunks, User=clause A + clause B + instructions
> 3. Classify: `deviationType` (added | removed | modified | compliant | missing), `riskLevel` (high | medium | low | none) using `RISK_THRESHOLD_HIGH` / `RISK_THRESHOLD_MEDIUM` assets
> 4. Populate `guidelineCitations` from chunk metadata, `characterOffsets` from clause body positions
>
> **Mode-specific edge cases:**
> - `template-compliance`: missing clause in DocA → `deviationType: "missing"`, `clauseIdA: null`
> - `template-compliance`: extra clause in DocA not in template → `deviationType: "added"`, `clauseIdB: null`
>
> **Output (FindingsJSON):**
> ```json
> { "findings": [{ "clauseIdA": "string", "clauseIdB": "string", "deviationType": "...", "riskLevel": "...", "guidelineCitations": [{ "guidelineName": "string", "chunkReference": "string", "text": "string" }], "characterOffsets": { "docA": { "start": number, "end": number }, "docB": { "start": number, "end": number } } }] }
> ```
>
> Read Assets: `LLM_API_KEY`, `LLM_MODEL`, `LLM_ENDPOINT`, `VECTOR_STORE_ENDPOINT`, `VECTOR_STORE_KEY`, `RAG_TOP_K`, `RISK_THRESHOLD_HIGH`, `RISK_THRESHOLD_MEDIUM`. Deploy after build.
>
> Use values, mappings, and structure exactly as documented in this plan. Do not infer or guess.

- [ ] Scaffold agent in `src/agents/comparator/` with `uip agents init` or equivalent
- [ ] Implement UiPath AI Index query tool (semantic search, parameterized by `guidelineIds` filter and `top_k`)
- [ ] Implement LLM call with system message + guideline context + clause pair (UiPath AI Center endpoint, `LLM_API_KEY` / `LLM_MODEL` assets)
- [ ] Implement clause alignment loop: match DocA and DocB clauses by heading similarity
- [ ] Implement `deviationType` classification and `riskLevel` scoring using threshold assets
- [ ] Populate `guidelineCitations` from chunk metadata; populate `characterOffsets` from clause text positions
- [ ] Handle `template-compliance` missing/extra clause edge cases (null clauseId fields)
- [ ] Deploy agent via `uip agents deploy`
- [ ] **Validate:** `uip agents run` with sample ClauseJSON pair and test systemMessage; confirm FindingsJSON output includes at least one finding with `deviationType`, `riskLevel`, and `guidelineCitations`

---

## Task T5 — uipath-agents — Testing: Comparator (MANDATORY)

**Identity:** `agents:ContractComparison:testing-comparator`
**Status:** [ ] pending
**Blocked by:** T4
**Skill prompt:**

> Load `uipath-agents` and run its testing workflow end-to-end for the Comparator agent at `src/agents/comparator/`. Always thorough: happy path + edge cases + error scenarios. See that skill's testing references for commands, test-case authoring, and best practices. Do not describe the testing procedure here — the specialist owns it.
>
> Key scenarios: buyer-seller-diff with known differences (correct deviationType per finding), template-compliance missing clause (deviationType "missing"), RAG grounding (guidelineCitations populated), risk scoring (high-risk finding → riskLevel "high"), UiPath AI Index unreachable (graceful error), LLM API failure (retry + structured error response).
>
> Use values, mappings, and structure exactly as documented in this plan. Do not infer or guess.

- [ ] Run testing workflow per `uipath-agents` testing reference
- [ ] **Validate:** all tests pass; record results

---

## Task T6 — uipath-agents — Agent 3: Reviewer

**Identity:** `agents:ContractComparison:agents/reviewer`
**Status:** [ ] pending
**Blocked by:** T1, T5
**Skill prompt:**

> Load `uipath-agents` and build the Reviewer agent in `src/agents/reviewer/` within the project at `/Users/karthicks/kAgents/Projects/my-uipath-project`.
>
> **Purpose:** Transform FindingsJSON into three human-readable outputs.
>
> **Inputs:** `findings` (FindingsJSON), `templateSystemMessage: str`, `mode: str`
>
> **Output 1 — ScorecardJSON:**
> ```json
> { "overallStatus": "red|amber|green", "categories": [{ "name": "Liability|IP|Payment|Termination|Confidentiality", "status": "red|amber|green", "summary": "string" }] }
> ```
> Map each finding to its category by clause heading keywords. Category status = highest riskLevel in that category. Overall = highest category status.
>
> **Output 2 — DiffJSON:**
> ```json
> { "clauses": [{ "clauseIdA": "string", "clauseIdB": "string", "changeType": "added|removed|modified|compliant|missing", "highlights": { "docA": [{ "start": number, "end": number, "color": "red|amber|green|blue" }], "docB": [{ "start": number, "end": number, "color": "red|amber|green|blue" }] } }] }
> ```
> Highlight colour mapping (spec §4.2):
> - Buyer/Seller: red=high-risk delta, amber=medium-risk, green=aligned, blue=N/A
> - Template Compliance: red=missing-required, amber=modified, green=compliant, blue=extra
>
> **Output 3 — NarrativeString:** LLM call (GPT-5.4, UiPath AI Center) with `templateSystemMessage` + findings summary → plain English business-user paragraph with key risks and recommendations.
>
> **Combined output:** `{ "scorecard": ScorecardJSON, "diff": DiffJSON, "narrative": "string" }`
>
> Deploy after build.
>
> Use values, mappings, and structure exactly as documented in this plan. Do not infer or guess.

- [ ] Scaffold agent in `src/agents/reviewer/` with `uip agents init` or equivalent
- [ ] Implement ScorecardJSON builder: category mapping by heading keywords, status aggregation by riskLevel, overall status computation
- [ ] Implement DiffJSON builder: map FindingsJSON to ordered clause pairs + highlight colour codes per spec §4.2
- [ ] Implement NarrativeString generator: LLM call with templateSystemMessage prefix + findings summary
- [ ] Deploy agent via `uip agents deploy`
- [ ] **Validate:** `uip agents run` with sample FindingsJSON; confirm all three outputs present — scorecard has at least one category with a status, DiffJSON has at least one clause with highlights, narrative is a non-empty string

---

## Task T7 — uipath-agents — Testing: Reviewer (MANDATORY)

**Identity:** `agents:ContractComparison:testing-reviewer`
**Status:** [ ] pending
**Blocked by:** T6
**Skill prompt:**

> Load `uipath-agents` and run its testing workflow end-to-end for the Reviewer agent at `src/agents/reviewer/`. Always thorough: happy path + edge cases + error scenarios. See that skill's testing references for commands, test-case authoring, and best practices. Do not describe the testing procedure here — the specialist owns it.
>
> Key scenarios: all risk levels → correct RAG status per category and overall; buyer-seller colour assignments (red/amber/green); template-compliance colour assignments (red/amber/green/blue); all-clauses-compliant → all-green scorecard; LLM failure on narrative → scorecard + diff returned, narrative null with descriptive error.
>
> Use values, mappings, and structure exactly as documented in this plan. Do not infer or guess.

- [ ] Run testing workflow per `uipath-agents` testing reference
- [ ] **Validate:** all tests pass; record results

---

## Task T8 — uipath-human-in-the-loop — Review approval task schema

**Identity:** `hitl:ContractComparison:review-task-schema`
**Status:** [ ] pending
**Blocked by:** T7
**Skill prompt:**

> Load `uipath-human-in-the-loop` and author the HITL task schema for the `ContractReviewApproval` task that the Maestro flow will create.
>
> **Display payload (read-only, shown to reviewer):**
> - `scorecard` (ScorecardJSON) — colour-coded category table
> - `diff` (DiffJSON) — clause diff list with change type labels
> - `narrative` (string) — plain text paragraph
> - `mode` (string) — "Buyer/Seller Diff" | "Template Compliance"
> - `docALabel` (string) — document A filename
> - `docBLabel` (string) — document B filename
>
> **Action fields (user fills):**
> - `action` (enum: "Confirm" | "Reject") — required
> - `note` (string) — optional reviewer note or rejection reason
>
> **Outcomes (spec §5.3):**
> - Confirm → case closed, results finalized, stored with audit log
> - Reject → case flagged, rejection note stored, escalation triggered
>
> Write task schema JSON to `src/tasks/contract-review-approval-task.json`.
>
> Use values, mappings, and structure exactly as documented in this plan. Do not infer or guess.

- [ ] Author task schema JSON at `src/tasks/contract-review-approval-task.json` with all display and action fields
- [ ] Confirm `action` is a required non-nullable enum; `note` is optional nullable string
- [ ] Confirm action outcomes map to the two Maestro flow branches (Confirm → close, Reject → escalate)
- [ ] **Validate:** schema is valid and surfaceable in Action Center

---

## Task T9 — uipath-maestro-flow — ContractComparisonProcess

**Identity:** `flow:ContractComparison:ContractComparisonProcess.flow`
**Status:** [ ] pending
**Blocked by:** T1, T7, T8
**Skill prompt:**

> Load `uipath-maestro-flow` and build the `ContractComparisonProcess` flow in Studio Web (Solution scope: SW).
>
> **Trigger inputs (spec §5.1):**
> `bucketId`, `docAKey`, `docBKey`, `mode` ("buyer-seller-diff" | "template-compliance"), `templateId`, `includeVersionHistory` (bool, default false), `contractId`
>
> **Flow steps (spec §5.2):**
>
> 1. **Template + Guideline Loader** — fetch Template entity by `templateId` from Data Fabric → extract `systemMessage` and `linkedGuidelineIds`; resolve template bucket key `templates/{templateId}/template.pdf`
>
> 2. **Version History Gate** — if `includeVersionHistory == true`: query Buckets for all keys matching `contracts/{contractId}/*/` → populate `priorVersionKeys`; else `priorVersionKeys = []`
>
> 3. **Agent 1 — Extractor node** — inputs: `bucketId`, `docAKey`, `docBKey`, `priorVersionKeys`; output: `extractorOutput` (docA, docB, history)
>
> 4. **Agent 2 — Comparator node** — inputs: `docA`, `docB` from extractorOutput, `systemMessage`, `linkedGuidelineIds`, `mode`; output: `findings` (FindingsJSON)
>
> 5. **Agent 3 — Reviewer node** — inputs: `findings`, `systemMessage`, `mode`; output: `reviewOutput` (ScorecardJSON, DiffJSON, NarrativeString)
>
> 6. **Human Task node** — task type `ContractReviewApproval`; payload: `scorecard`, `diff`, `narrative`, `mode`, `docALabel` (filename of docAKey), `docBLabel` (filename of docBKey); wait for completion
>
> 7. **Branch on task action:**
>    - **Confirm:** store `results/{jobId}/review.json` + `results/{jobId}/audit.json` (jobId, contractId, templateId, action: "Confirm", reviewerNote, timestamp) to Buckets; mark case closed
>    - **Reject:** store `results/{jobId}/audit.json` (action: "Reject", reviewerNote, timestamp); trigger escalation via Script node (set escalation status in Data Fabric or send notification)
>
> Publish flow to Studio Web upon completion.
>
> Use values, mappings, and structure exactly as documented in this plan. Do not infer or guess.

- [ ] Create new Studio Web flow project `ContractComparisonProcess`
- [ ] Add trigger with input schema matching all 7 spec §5.1 fields
- [ ] Implement Template + Guideline Loader node (fetch from Data Fabric Entities by `templateId`)
- [ ] Implement Version History Gate condition node (query Buckets by `contractId` prefix when `includeVersionHistory` is true)
- [ ] Wire Extractor Agent node with correct input/output bindings
- [ ] Wire Comparator Agent node with extractorOutput + systemMessage + guidelineIds bindings
- [ ] Wire Reviewer Agent node with findings + systemMessage bindings
- [ ] Add Human Task node referencing `ContractReviewApproval` schema with full review payload
- [ ] Implement Confirm branch: write `review.json` + `audit.json` to Buckets
- [ ] Implement Reject branch: write `audit.json` + trigger escalation via Script node
- [ ] Validate flow in Studio Web (no broken bindings, all outputs connected)
- [ ] Publish flow to Studio Web
- [ ] **Validate:** test run with minimal inputs returns a pending task in Action Center

---

## Task T10 — uipath-maestro-flow — Testing: ContractComparisonProcess (MANDATORY)

**Identity:** `flow:ContractComparison:testing`
**Status:** [ ] pending
**Blocked by:** T9
**Skill prompt:**

> Load `uipath-maestro-flow` and run its testing workflow end-to-end for `ContractComparisonProcess`. Always thorough: happy path + edge cases + error scenarios + end-to-end pipeline tests. See that skill's testing references for commands, test-case authoring, and best practices. Do not describe the testing procedure here — the specialist owns it.
>
> Key verification scenarios (spec §12):
> - Buyer/Seller diff: two MSA versions with known differences → correct RAG scorecard, diff highlights on correct clauses, narrative summarises key gaps
> - Template compliance: contract vs GAFTA 100 template → missing clause in DiffJSON as deviationType "missing", modified clause riskLevel "medium"
> - RAG grounding: finding `guidelineCitations` cite the linked guideline (e.g., "per GAFTA clause 22")
> - Version history: `priorVersionKeys` populated → `history` array non-empty in extractorOutput
> - Human task — Confirm: case closed, `audit.json` written with action "Confirm" and timestamp
> - Human task — Reject: escalation flag set, `audit.json` written with action "Reject" and rejection note
> - UI swap readiness: trigger flow and complete human task via raw `@uipath/uipath-typescript` SDK calls (bypassing Coded App)
>
> Use values, mappings, and structure exactly as documented in this plan. Do not infer or guess.

- [ ] Run testing workflow per `uipath-maestro-flow` testing reference
- [ ] **Validate:** all tests pass; record results

---

## Phase 2 — Deferred (Coded App UI)

The following are out of scope for this plan and addressed in a follow-up:

- `uipath-coded-apps` — Review Workspace: side-by-side document viewer (react-pdf + mammoth.js), inline highlights from DiffJSON `characterOffsets`, bidirectional sidebar ↔ document click sync, Confirm/Reject bar completing the Maestro task
- `uipath-coded-apps` — Template Manager admin screen: card list, system message editor, guideline chip add/remove, drag-and-drop upload
- `uipath-coded-apps` — Guideline Library admin screen: indexing pipeline trigger (DU → chunk → UiPath AI Index), chunk count display, indexing status badge
- `uipath-coded-apps` — Document Onboarding screen: upload with template tag, contractId assignment, Buckets upload via SDK
- `uipath-coded-apps` — Testing for all Coded App screens
