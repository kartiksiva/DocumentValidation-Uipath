# Contract Comparison Agent — Design Spec

**Date:** 2026-05-23  
**Status:** Draft — Awaiting Implementation  
**Stack:** UiPath Coded App · UiPath TypeScript SDK · Maestro · Document Understanding · LLM

---

## 1. Problem & Goal

Business users (procurement, sales) need to compare legal contracts quickly and accurately — either Buyer vs Seller versions or against a standard template — and confirm or reject an AI-generated review before it is finalized. Currently this is manual, slow, and inconsistent across reviewers.

**Goal:** Deliver an agentic contract review workspace where:
- Users upload two documents or a document + template
- Maestro orchestrates AI extraction, comparison, and review generation
- Results surface inline in a document viewer with highlighted findings
- User confirms or rejects the AI review as a Maestro human task

---

## 2. Scope

**In scope:**
- Two comparison modes: Buyer/Seller diff, Template compliance
- **Contract Workspace** — named container per contract; all versions, metadata, and comparison history in one place
- Version history comparison (optional, user-triggered) — **v1 scope: "Latest vs Immediately Previous" only**; comparing against all prior versions simultaneously deferred to v2
- Document formats: PDF, Word (.docx)
- Output: Risk scorecard (RAG) + side-by-side clause diff + narrative summary
- Inline document rendering with highlighted findings
- Per-template system messages (LLM instructions)
- Guideline document library with RAG-based context grounding (e.g. GAFTA, Incoterms)
- Human-in-the-loop: business user confirms/rejects before finalization
- Template and guideline management admin UI

**Out of scope (v1):**
- Scanned/OCR PDFs
- Multi-party redline workflows
- E-signature integration
- Mobile UI

---

## 3. Architecture

Five layers. Maestro and agent pipeline are UI-agnostic — the Coded App can be swapped for any React host without changing backend logic.

```
┌─────────────────────────────────────────────────────┐
│  UI Layer — UiPath Coded App (React + Vite)          │  ← Swappable
│  Review Workspace · Template Manager · Guidelines    │
└────────────────────┬────────────────────────────────┘
                     │ UiPath TypeScript SDK (browser)
┌────────────────────▼────────────────────────────────┐
│  UiPath Platform Services (SDK)                      │
│  Buckets · Entities · MaestroProcesses · Tasks       │
└────────────────────┬────────────────────────────────┘
                     │ Maestro SDK
┌────────────────────▼────────────────────────────────┐
│  Maestro — ContractComparisonProcess                 │
│  Mode Router · Template Loader · Human Task          │
└────────────────────┬────────────────────────────────┘
                     │ Agent calls
┌────────────────────▼────────────────────────────────┐
│  Agent Pipeline                                      │
│  Agent 1: Extractor → Agent 2: Comparator → Agent 3: Reviewer │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│  Storage & Knowledge                                 │
│  Buckets · Entities · Vector Store · Assets          │
└─────────────────────────────────────────────────────┘
```

**Deployment:** UiPath Automation Cloud (Coded Apps — Cloud only).  
**Auth:** OAuth injected automatically via `@uipath/coded-apps-dev` at deploy time.  
**Future UI swap:** Replace Coded App with any React host; SDK calls and Maestro process IDs unchanged.

---

## 4. UI — Coded App Screens

### 4.1 Navigation

Sidebar stays flat and static regardless of how many workspaces exist. No individual workspace items in the sidebar — they live in the main content browser.

```
Workspace
  ├── My Workspaces          ← opens workspace browser (card grid in main area)
  ├── New Comparison
  └── My Reviews             ← badge shows pending human task count
Admin
  ├── Templates
  ├── Guidelines
  └── Settings
```

**Workspace browser (main content area):** Searchable, filterable card grid. Each card shows workspace name, parties, template type, version/run/confirmed counts, last activity, and a pending review pill. Pending workspaces get an amber left border. Filter bar scopes by template type (All / Pending / MSA / GAFTA / NDA). Grid/list view toggle. "New Workspace" card always inline in grid. Scales to any number of workspaces without sidebar changes.

### 4.2 Review Workspace

Primary screen. Hybrid layout combining side-by-side document view (Option A) with report-driven navigation (Option C).

**Layout:**
```
┌─ Top bar ─────────────────────────────────────────────────────┐
│  [Doc A chip] vs [Doc B chip]  [Mode badge]  [stats]          │
├─ Sidebar (220px) ─┬─ Document Area ───────────────────────────┤
│ Compliance Score  │  Left Panel          Right Panel           │
│ ─────────────────  │  [Doc header]        [Template header]    │
│ By Category (RAG) │  [Rendered doc       [Rendered doc /       │
│ ─────────────────  │   with highlights]    template ref]       │
│ Findings list     │                                            │
│ (clickable)       │  Active finding → both panels scroll +     │
│ ─────────────────  │  dimmed non-active clauses                │
│ AI Summary        │  Inline finding cards expand below clause  │
├───────────────────┴──────────────────────────────────────────-┤
│  [progress]                    [Reject & Escalate] [Confirm ✓] │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click sidebar finding → both document panels scroll to matching clause, non-active clauses dim
- Click inline highlight → that finding activates in sidebar (bidirectional)
- Confirm/Reject bar always visible — completes Maestro human task

**Highlight colour system:**

| Colour | Buyer/Seller mode | Template Compliance mode |
|--------|-------------------|--------------------------|
| Red    | High risk delta   | Missing clause (required) |
| Amber  | Medium risk / review needed | Modified clause |
| Green  | Aligned / match  | Compliant clause |
| Blue   | N/A              | Extra clause (not in template) |

**Mode differences:**

| | Buyer/Seller Diff | Template Compliance |
|---|---|---|
| Right column | Seller contract | Standard template (cream tint) |
| Sidebar score | RAG per risk category | Compliance % + per-category status |
| Finding types | Risk deltas | Missing / Modified / Extra / Compliant |
| Missing clauses | N/A | Dashed gap placeholder at LLM-identified insertion point — Comparator outputs `"insertAfterClause": "§4"` so UI knows where to render the gap |

### 4.3 Template Manager (Admin)

- List of registered templates (card per template)
- Per-template: name, description, file (PDF/DOCX), status badge
- **System message editor** — LLM instruction specific to this template type (e.g. GAFTA 100 instructs AI to focus on Incoterms, sampling rules, GAFTA arbitration)
- **Linked guideline documents** — chips, add/remove, links to Guideline Library
- Upload new template via drag-and-drop zone

### 4.4 Guideline Library (Admin)

- List of indexed guideline documents (GAFTA 100, Incoterms 2020, GAFTA 125, internal policies, etc.)
- Per guideline: name, description, chunk count, indexing status (Indexing / Indexed)
- Upload new guideline → triggers DU extraction + chunking + vector indexing pipeline
- Each guideline shows which templates link to it

### 4.5 Contract Workspace

Named container grouping all versions of a single contract and its full comparison history.

**Workspace view layout:**
- **Header card** — workspace name, description, party names (Buyer/Seller), default template, stats (version count, comparison count, pending reviews)
- **Version panel** — ordered list of uploaded versions (v1…vN) with filename, uploader, date, size. Drag-drop zone to add new version. Versions are immutable once uploaded.
- **Run Comparison panel** — pick Document A and Document B from version dropdowns, select mode and template, toggle version history context. Submits to Maestro without re-uploading.
- **Comparison History** — every run logged as a row: versions compared, mode, findings summary chips (High/Medium/Aligned or Missing/Modified/Extra), status (Awaiting Review / Confirmed / Rejected), confirmed-by + rejection note. Click row → opens that comparison's Review Workspace.

**Workspace navigation:** Listed in app sidebar tree under "My Workspaces". Jump between contracts instantly.

---

## 5. Maestro Workflow — ContractComparisonProcess

### 5.1 Trigger inputs

```json
{
  "bucketId": "string",
  "docAKey": "string",
  "docBKey": "string",
  "mode": "buyer-seller-diff | template-compliance",
  "templateId": "string",
  "includeVersionHistory": false,
  "contractId": "string"
}
```

### 5.2 Step-by-step flow

```
1. Upload & Trigger
   User uploads docs via Coded App → SDK stores to Buckets
   → MaestroProcesses.start(ContractComparisonProcess, inputs)

2. Template + Guideline Loader (Maestro)
   Fetch template file from Buckets
   Fetch template system message from Entities
   Fetch linked guideline document keys for RAG

   [Optional] Version History Gate
   If includeVersionHistory: fetch prior versions from Buckets by contractId

3. Agent 1 — Extractor
   Pull both documents from Buckets (+ prior versions if requested)
   DU extracts: clause headings, sub-clauses, definitions, signature blocks
   Handles: native PDF, DOCX → mammoth.js → HTML → clause parse
   Output: structured clause JSON per document

4. Agent 2 — Comparator
   Per clause: retrieve relevant guideline chunks from vector store (RAG)
   LLM compares clause pairs using template system message as instruction prefix
   Identifies: added / removed / modified clauses, risk deltas, missing required clauses
   Output: raw findings JSON with clause references + guideline citations

5. Agent 3 — Reviewer
   Formats findings into three outputs:
   a. Risk Scorecard — RAG status per category (Liability, IP, Payment, Termination, Confidentiality)
   b. Side-by-side diff — clause pairs with change type tags + character offsets for highlights
   c. Narrative summary — plain English, business-user level, key risks + recommendations
   All three use template system message for tone/focus

6. Human Task
   Maestro creates Human Task with full review payload
   Task surfaces in Coded App via Tasks SDK
   Business user reviews → Confirm (finalize + store) or Reject (escalate + flag)

7. Storage & Audit
   All stored to Buckets: source docs, extracted JSON, findings, final review, user decision + timestamp
   Enables version history in future runs
```

### 5.3 Human task states

| User Action | Maestro outcome |
|-------------|-----------------|
| Confirm ✓   | Case closed, results finalized, stored with audit log |
| Reject & Escalate | Case flagged, rejection note stored, escalation triggered |

---

## 6. Agent Pipeline Detail

### Agent 1 — Extractor
- Input: two document bucket keys (+ optional prior version keys)
- Tool: UiPath Document Understanding
- PDF: native text extraction; DOCX: mammoth.js HTML conversion + clause parser
- **Fallback:** If DU cannot confidently identify clause hierarchy (flat text blocks, non-standard formatting), a pre-processing LLM step structures the raw text into logical clauses before passing to Agent 2. Fallback triggered when DU confidence < threshold (`DU_HIERARCHY_CONFIDENCE_THRESHOLD` Asset, default: 0.75).
- Output: `{ docA: ClauseJSON, docB: ClauseJSON, history?: ClauseJSON[] }`

### Agent 2 — Comparator
- Input: Extractor output + template system message + guideline chunk retriever
- **Batching:** Clauses sent in batches of 5–10 per LLM call (not one call per clause) to avoid rate limits, control cost, and hit the < 3 min target. Batch size configurable via Asset `COMPARATOR_BATCH_SIZE` (default: 7).
- Per batch: semantic search against vector store → top-K guideline chunks retrieved for the batch collectively
- LLM prompt structure: `[system message] + [guideline context] + [clause batch A] + [clause batch B] → findings[]`
- Output: `FindingsJSON` — clause pairs, deviation type, risk level, guideline citations, **exact text snippet** (not character offsets)

### Agent 3 — Reviewer
- Input: FindingsJSON + template system message
- Output 1: `ScorecardJSON` — per-category RAG status + summary
- Output 2: `DiffJSON` — ordered clause pairs with highlight offsets for UI rendering
- Output 3: `NarrativeString` — plain-English paragraph, business-user focused

---

## 7. Context Grounding (RAG)

### Indexing pipeline (one-time per guideline upload)
```
Upload PDF/DOCX → DU extraction → text chunking (512 tokens, 10% overlap)
→ embedding generation → vector store index (keyed by guideline ID)
```

### Runtime retrieval (per clause, Agent 2)
```
Clause text → semantic query → top-K chunks from linked guideline set
→ chunks prepended to LLM context → LLM cites guideline in finding
```

### Per-template system message
Each template stores a system message in Entities. The Maestro process loads it before Agent 2 and Agent 3 run, injecting it as the LLM instruction prefix. This controls:
- Which clause categories to prioritise
- Risk severity thresholds
- Tone (legal vs business-user)
- Industry-specific terminology expectations

**Example — GAFTA 100 system message:**
> "You are a commodities trade compliance specialist reviewing contracts against GAFTA 100 standard terms. Key areas: delivery terms (Incoterms 2020 CIF/FOB), quality specifications (moisture, protein, impurities per GAFTA sampling rules), arbitration (must specify GAFTA arbitration London), force majeure (aligned to GAFTA clause 22), payment (irrevocable LC standard). Cross-reference GAFTA 125 arbitration rules when dispute clauses deviate. Flag deviations with commercial impact on buyer/seller."

---

## 8. Storage Schema

### UiPath Buckets
```
workspaces/
  {workspaceId}/versions/v{n}/{filename}.pdf|docx   ← immutable once uploaded
  {workspaceId}/comparisons/{comparisonId}/extracted.json
  {workspaceId}/comparisons/{comparisonId}/findings.json
  {workspaceId}/comparisons/{comparisonId}/review.json
  {workspaceId}/comparisons/{comparisonId}/audit.json
templates/
  {templateId}/template.pdf
guidelines/
  {guidelineId}/source.pdf
```

### UiPath Entities (Workspace + Template Registry)
```
ContractWorkspace {
  id, name, description,
  defaultTemplateId,
  buyerParty, sellerParty, contractType,
  ownerId, createdAt,
  versions: [{ versionNumber, bucketKey, uploadedBy, uploadedAt, fileSizeBytes }],
  comparisons: [{ comparisonId, docAVersion, docBVersion, mode, templateId,
                  status, confirmedBy, confirmedAt, rejectionNote }]
}

Template {
  id, name, description, bucketKey,
  systemMessage,            // LLM instruction string
  linkedGuidelineIds[],     // array of guideline IDs
  comparisonMode,           // "buyer-seller" | "compliance"
  status                    // "active" | "draft"
}
```

### Vector Store (Guidelines)
```
Chunk {
  id, guidelineId, guidelineName,
  text, embedding[],
  pageNumber, chunkIndex
}
```

**Vector store technology:** Azure AI Search (recommended — native to UiPath Cloud Azure infrastructure). Alternative: Pinecone or Weaviate if Azure not available. Decision needed before implementation.

**Vector store connection:** No native UiPath Integration Service connector exists for Azure AI Search. Connection via **direct REST API calls** from the Agent (HTTP activity in Maestro), using endpoint + API key stored in UiPath Assets (`VECTOR_STORE_ENDPOINT`, `VECTOR_STORE_KEY`). This keeps the dependency explicit and auditable.

**RAG retrieval K:** Default top-5 chunks per clause. Configurable via Asset `RAG_TOP_K`.

### UiPath Assets
```
LLM_API_KEY, LLM_MODEL, LLM_ENDPOINT,        // via UiPath AI Center LLM connections
VECTOR_STORE_ENDPOINT, VECTOR_STORE_KEY,
RISK_THRESHOLD_HIGH, RISK_THRESHOLD_MEDIUM,
RAG_TOP_K,                                   // default: 5
COMPARATOR_BATCH_SIZE,                       // default: 7 clauses per LLM call
DU_HIERARCHY_CONFIDENCE_THRESHOLD            // default: 0.75 — below this triggers LLM fallback structuring
```

**LLM:** Configured via UiPath AI Center LLM gateway (supports Azure OpenAI, OpenAI, Anthropic). Specific model TBD by user — recommend GPT-4o or Claude Sonnet for clause-level legal reasoning.

---

## 9. Document Rendering (UI)

| Format | Rendering approach |
|--------|-------------------|
| PDF    | `react-pdf` (PDF.js wrapper) with annotation overlay layer |
| DOCX   | `mammoth.js` → HTML → rendered inline in panel |
| Highlights | LLM outputs **exact text snippet** per finding; React frontend locates it via fuzzy-search (`fuse.js` or `mark.js`) and wraps in highlight span — avoids fragile character offset mapping |
| Scrolling  | Click finding → `scrollIntoView()` on both panels simultaneously |

**Why not character offsets:** PDF rendering quirks and LLM hallucination of offsets make offset-based highlighting unreliable. Exact snippet + fuzzy DOM search is more robust across PDF/DOCX rendering pipelines.

---

## 10. SDK Usage (Key calls)

```typescript
const sdk = new UiPath();
await sdk.initialize();

// Upload document
await sdk.Buckets.upload({ bucketName, key, file });

// Start Maestro process
await sdk.MaestroProcesses.start({
  processName: 'ContractComparisonProcess',
  inputArguments: { docAKey, docBKey, mode, templateId, ... }
});

// Poll for human task (5s interval; upgrade to SSE/WebSocket if SDK adds push support)
const tasks = await sdk.Tasks.list({ status: 'Pending' });

// Complete human task
await sdk.Tasks.complete({ taskId, action: 'Confirm', data: { note } });
```

---

## 11. Non-Functional Requirements

| Concern | Requirement |
|---------|-------------|
| Document size | Support up to 100-page contracts |
| Processing time | Maestro pipeline target < 3 minutes end-to-end |
| Version history | Retain all versions; never overwrite |
| Audit | Every comparison, human decision, timestamp stored immutably |
| Auth | UiPath OAuth via Coded Apps — no custom auth layer |
| Deployment | Cloud-only (Automation Cloud); Coded Apps not available on Automation Suite |
| UI swap | All Maestro/agent logic must function without modification when Coded App is replaced |

---

## 12. Verification Plan

1. **Template upload** — upload GAFTA 100 template PDF, set system message, link GAFTA 100 guideline → confirm template appears in registry with correct system message
2. **Guideline indexing** — upload GAFTA 125 PDF → status transitions Indexing → Indexed, chunk count populated
3. **Buyer/Seller diff** — upload two MSA versions with known differences → confirm scorecard shows correct RAG, diff highlights land on correct clauses in both panels, narrative summarises key gaps
4. **Template compliance** — upload contract against GAFTA 100 template → missing clause shows as dashed gap, modified clause highlighted amber, compliance % calculated correctly
5. **RAG grounding** — verify finding cards cite guideline source (e.g. "per GAFTA clause 22") when guideline is linked to template
6. **Version history** — upload v1, v2, v3 of same contract with same contractId → toggle version history → all three versions included in comparison
7. **Human task flow** — complete comparison → confirm human task appears in Coded App → Confirm → verify case closed in Maestro, audit record written → Reject → verify escalation flag set
8. **UI swap readiness** — verify Maestro process starts and human task completes correctly when triggered via raw SDK calls (bypassing Coded App)
