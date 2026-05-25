# Contract Comparison Agent — Plan B (Python Rewrite)

**Date:** 2026-05-24  
**Status:** Active — replaces C# plan (`2026-05-24-maestro-agents-plan.md`)  
**Reason for rewrite:** Studio Web (Automation Cloud) supports Python coded agents only. No path to run C# `CodedWorkflow` in Automation Cloud without desktop Studio.

**Spec:** `docs/superpowers/specs/2026-05-23-contract-comparison-agent-design.md`  
**Plan A (Coded App):** `docs/superpowers/plans/2026-05-24-coded-app-plan.md`

---

## Stack Mapping (C# → Python)

| Old (C# / Studio Desktop) | New (Python / Studio Web) |
|---|---|
| `ContractComparisonAgent/Main.xaml` | `ContractComparisonProcess/ContractComparisonProcess.flow` |
| `coded-workflows/ExtractClauses.cs` | `extractor/main.py` — LangGraph coded agent |
| `coded-workflows/CompareClauses.cs` | `comparator/main.py` — LangGraph coded agent |
| `coded-workflows/GenerateReview.cs` | `reviewer/main.py` — LangGraph coded agent |
| `GuidelineIndexer/Main.xaml` | `guideline-indexer/main.py` — LangGraph coded agent |
| `BucketClient.cs`, `LlmClient.cs`, `AzureSearchClient.cs` | UiPath Python SDK (`uipath.platform.UiPath`) — built-in Buckets + Context Grounding |
| NuGet packages | `pyproject.toml` deps: `uipath`, `uipath-langchain`, `langgraph` |

Same logic. Same output schema. Same bucket paths. Python + `.flow` instead of C# + `.xaml`.

---

## Critical Contracts with Plan A (unchanged)

**Process name Plan A calls — must be exact:**
```typescript
sdk.MaestroProcesses.start({ processName: 'ContractComparisonProcess', ... })
```

**Bucket path Plan A downloads:**
```
workspaces/{workspaceId}/comparisons/{comparisonId}/review.json
```

**ReviewPayload schema (must match `src/types/review.ts` exactly):**
```json
{
  "comparisonId": "string",
  "workspaceId": "string",
  "mode": "buyer-seller-diff | template-compliance",
  "scorecard": [{ "name": "string", "status": "HIGH|MEDIUM|OK|MISSING|MODIFIED|EXTRA", "summary": "string" }],
  "compliancePercent": 85,
  "findings": [{
    "id": "string",
    "clauseRef": "string",
    "deviationType": "high-risk|medium-risk|aligned|missing|modified|extra",
    "snippetA": "string",
    "snippetB": "string (optional)",
    "explanation": "string",
    "guidelineCitation": "string (optional)",
    "insertAfterClause": "string (optional — missing clauses only)"
  }],
  "narrative": "string",
  "taskId": 0
}
```

---

## Solution Structure

```
ContractComparisonSolution/          ← uip solution init
  ContractComparisonSolution.uipx
  ContractComparisonProcess/         ← uip maestro flow init
    ContractComparisonProcess.flow
  extractor/                         ← uip codedagent new extractor
    pyproject.toml
    main.py
    entry-points.json
    schemas.py                       ← shared Pydantic models
    evaluations/
  comparator/                        ← uip codedagent new comparator
    pyproject.toml
    main.py
    entry-points.json
    evaluations/
  reviewer/                          ← uip codedagent new reviewer
    pyproject.toml
    main.py
    entry-points.json
    evaluations/

GuidelineIndexerSolution/            ← separate uip solution init
  GuidelineIndexerSolution.uipx
  guideline-indexer/                 ← uip codedagent new guideline-indexer
    pyproject.toml
    main.py
    entry-points.json
    evaluations/
```

---

## Agent I/O Contracts

### Extractor Input/Output
```python
class ExtractorInput(BaseModel):
    bucket_name: str
    doc_a_key: str
    doc_b_key: str
    workspace_id: str
    comparison_id: str
    include_version_history: bool = False
    prior_version_keys: list[str] = []

class ClauseBlock(BaseModel):
    clause_ref: str        # e.g. "§3.1"
    heading: str
    text: str
    page_number: int

class DocumentClauses(BaseModel):
    doc_key: str
    clauses: list[ClauseBlock]
    extraction_method: str  # "du" | "llm-fallback"

class ExtractorOutput(BaseModel):
    doc_a: DocumentClauses
    doc_b: DocumentClauses
    history: list[DocumentClauses] = []
```

### Comparator Input/Output
```python
class ComparatorInput(BaseModel):
    doc_a: DocumentClauses
    doc_b: DocumentClauses
    mode: str              # "buyer-seller-diff" | "template-compliance"
    template_system_message: str
    linked_guideline_ids: list[str]
    batch_size: int = 7    # from Orchestrator Asset COMPARATOR_BATCH_SIZE

class RawFinding(BaseModel):
    id: str
    clause_ref: str
    deviation_type: str    # high-risk|medium-risk|aligned|missing|modified|extra
    snippet_a: str         # verbatim text — mark.js uses this
    snippet_b: str = ""
    explanation: str
    guideline_citation: str = ""
    insert_after_clause: str = ""  # only for missing clauses

class ComparatorOutput(BaseModel):
    findings: list[RawFinding]
    mode: str
```

### Reviewer Input/Output
```python
class ReviewerInput(BaseModel):
    workspace_id: str
    comparison_id: str
    bucket_name: str
    mode: str
    findings: list[RawFinding]
    template_system_message: str

# Output = ReviewPayload written to bucket as review.json
# taskId populated by Maestro after CreateHumanTask
```

### Guideline Indexer Input
```python
class IndexerInput(BaseModel):
    bucket_name: str
    guideline_key: str      # bucket key of the PDF/DOCX
    guideline_id: str
    guideline_name: str
    context_grounding_index: str  # name of CG index to upsert into
```

---

## Task List

### PB-T1: Solution Scaffold

**Goal:** Create both solutions and scaffold all agent projects inside them.

**Steps:**
1. `uip solution init ContractComparisonSolution` → creates `ContractComparisonSolution/`
2. `cd ContractComparisonSolution`
3. `uip maestro flow init ContractComparisonProcess`
4. For each agent (extractor, comparator, reviewer):
   - `uip codedagent new <name> --framework langgraph`
   - `uip solution project add --project-path ./<name>`
5. `cd ..` → `uip solution init GuidelineIndexerSolution`
6. `cd GuidelineIndexerSolution` → `uip codedagent new guideline-indexer --framework langgraph`
7. `uip solution project add --project-path ./guideline-indexer`
8. Commit: `feat: scaffold Plan B Python solution structure`

**Verify:** `uip maestro flow registry list --local --output json` shows all 3 agents.

---

### PB-T2: Shared Pydantic Schemas

**Goal:** Create `schemas.py` in the solution root (symlinked/copied to each agent) with all Pydantic models.

**Files:**
- `ContractComparisonSolution/schemas.py` — `ClauseBlock`, `DocumentClauses`, `RawFinding`, `ReviewPayload`, `ScorecardCategory`, `Finding`

All types mirror `src/types/review.ts` and `src/types/workspace.ts` exactly. `ReviewPayload` matches the Plan A JSON schema above.

**Verify:** `python -c "from schemas import ReviewPayload; print('ok')"` in each agent venv.

---

### PB-T3: Extractor Agent

**Framework:** LangGraph  
**File:** `ContractComparisonSolution/extractor/main.py`

**Graph nodes:**
1. `download_docs` — download doc_a and doc_b from Buckets using `UiPath().storage`
2. `extract_clauses` — attempt DU extraction via `UiPath().context_grounding` file analysis
3. `llm_fallback` — if DU confidence < 0.75, use LLM to structure raw text into clauses
4. `extract_history` (conditional) — if `include_version_history`, download + extract prior versions
5. `return_clauses` — assemble `ExtractorOutput`

**Key SDK usage:**
```python
from uipath.platform import UiPath
sdk = UiPath()
# Download from bucket
content = await sdk.storage.download(bucket_name, key)
# LLM for fallback structuring
llm = sdk.llm.get_model()  # uses LLM_MODEL asset
```

**Verify:** `uip codedagent run main '{"bucket_name":"contract-workspaces","doc_a_key":"...","doc_b_key":"...","workspace_id":"test","comparison_id":"test"}' --output-file out.json`

---

### PB-T4: Comparator Agent

**Framework:** LangGraph  
**File:** `ContractComparisonSolution/comparator/main.py`

**Graph nodes:**
1. `load_guidelines` — retrieve guideline chunks from Context Grounding index for each clause batch
2. `batch_compare` — split clause list into batches of `batch_size` (default 7), run LLM per batch
3. `merge_findings` — deduplicate + merge findings across batches into `ComparatorOutput`

**RAG pattern:**
```python
# Context Grounding retrieval per batch
retriever = sdk.context_grounding.get_retriever(index_name="contract-guidelines")
chunks = await retriever.retrieve(query=batch_clause_text, top_k=5)
```

**LLM prompt structure:**
```
[template_system_message]
[guideline context chunks]
Compare these clause pairs and identify deviations:
Doc A clauses: ...
Doc B clauses: ...
Return JSON: list of RawFinding
```

**Verify:** smoke eval with a 3-clause test pair, mode=buyer-seller-diff.

---

### PB-T5: Reviewer Agent

**Framework:** LangGraph  
**File:** `ContractComparisonSolution/reviewer/main.py`

**Graph nodes:**
1. `generate_scorecard` — LLM categorizes findings into RAG scorecard (Liability, IP, Payment, Termination, Confidentiality)
2. `compute_compliance` — if mode=template-compliance, count aligned / total → `compliancePercent`
3. `generate_narrative` — LLM writes plain-English business summary using `template_system_message`
4. `assemble_payload` — build `ReviewPayload` with all fields
5. `write_to_bucket` — upload `review.json` to `workspaces/{workspaceId}/comparisons/{comparisonId}/review.json`
   - **Note:** `taskId` is set to `0` here; Maestro flow patches it after `CreateHumanTask`

**Verify:** output `review.json` matches Plan A `ReviewPayload` schema exactly.

---

### PB-T6: Maestro Flow

**File:** `ContractComparisonSolution/ContractComparisonProcess/ContractComparisonProcess.flow`

**Flow graph:**

```
Start (inputs: workspaceId, bucketName, docAKey, docBKey, mode, templateId, includeVersionHistory, comparisonId)
  ↓
LoadTemplate — fetch template entity from Supabase/Entities (templateId → systemMessage + linkedGuidelineIds)
  ↓
CallExtractor — uipath.core.agent.extractor node
  ↓
CallComparator — uipath.core.agent.comparator node
  ↓
CallReviewer — uipath.core.agent.reviewer node (writes review.json to bucket)
  ↓
CreateHumanTask — HITL node (data: {comparisonId, workspaceId})
  ↓
PatchTaskId — update review.json in bucket to set taskId from CreateHumanTask output
  ↓
UpdateWorkspaceStatus — set comparison status to "awaiting-review"
  ↓
WaitForHumanDecision — suspend until HITL completes
  ↓
[Confirmed branch] → SetStatusConfirmed → End
[Rejected branch]  → SetStatusRejected + StoreRejectionNote → End
```

**Variables:** All inputs + `templateSystemMessage`, `linkedGuidelineIds`, `extractorOutput`, `comparatorOutput`, `taskId`

**Verify:** `uip maestro flow validate --output json` returns no errors.

---

### PB-T7: Guideline Indexer Agent

**Framework:** LangGraph  
**File:** `GuidelineIndexerSolution/guideline-indexer/main.py`

**Graph nodes:**
1. `download_guideline` — download PDF/DOCX from Buckets
2. `extract_text` — parse with pdfminer / python-docx into raw text
3. `chunk_text` — 512-token chunks, 10% overlap
4. `index_chunks` — upsert chunks into Context Grounding index via `sdk.context_grounding`
5. `update_status` — update Guideline entity `indexingStatus` to "indexed" and `chunkCount`

**Triggered by:** Plan A admin UI uploads a guideline → calls a Maestro process that invokes this agent.

**Verify:** smoke eval uploads a 2-page PDF, verifies > 0 chunks indexed.

---

### PB-T8: Deploy + E2E Verification

**Steps:**
1. Deploy all 3 agents to personal workspace: `uip codedagent deploy --my-workspace` (each)
2. `uip maestro flow registry pull --force` — ensure flow can resolve agents
3. Pack + publish flow: `uip maestro flow pack` → `uip solution publish`
4. From Plan A UI: create workspace → upload test contracts → Run Comparison
5. Monitor Maestro process in Orchestrator → confirm HITL task appears in Plan A UI
6. Confirm task in Plan A → verify `comparison.status` → `confirmed`
7. Deploy guideline indexer separately: `uip codedagent deploy --my-workspace`

**E2E test scenarios (from spec §12):**
- [ ] buyer-seller-diff, 2 short contracts, no guidelines → findings with snippetA populated
- [ ] template-compliance, contract vs template, 1 guideline linked → compliancePercent present
- [ ] missing clause scenario → finding has `insertAfterClause` set
- [ ] HITL confirm flow → status transitions to "confirmed"
- [ ] HITL reject flow → rejectionNote stored, status → "rejected"

---

## Assets Required (Orchestrator)

Existing assets (from old Plan B T2, already created):

| Asset | Value |
|---|---|
| `COMPARATOR_BATCH_SIZE` | `7` |
| `RAG_TOP_K` | `5` |
| `DU_HIERARCHY_CONFIDENCE_THRESHOLD` | `0.75` |
| `RISK_THRESHOLD_HIGH` | `0.7` |
| `RISK_THRESHOLD_MEDIUM` | `0.4` |
| `LLM_MODEL` | `gpt-4o` |
| `BUCKET_NAME` | `contract-workspaces` |

Context Grounding index: `contract-guidelines` (already created in old Plan B T3).

---

## Implementation Order

```
PB-T1 (scaffold) → PB-T2 (schemas) → PB-T3 (extractor) → PB-T4 (comparator)
  → PB-T5 (reviewer) → PB-T6 (flow) → PB-T7 (indexer) → PB-T8 (deploy + E2E)
```

T3, T4, T5 can be built in parallel (each agent is independent). T6 depends on T3-T5 (needs resource keys). T8 depends on all.
