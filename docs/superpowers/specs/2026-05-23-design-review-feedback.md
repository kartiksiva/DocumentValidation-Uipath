# Design Review Feedback — Contract Comparison Agent

**Date:** 2026-05-23  
**Status:** Review Comments  
**Reference Spec:** `2026-05-23-contract-comparison-agent-design.md`

---

## 1. Strong Points & Solid Architectural Choices

- **Decoupled Architecture:** Using Maestro as the headless orchestrator and the Coded App purely as a UI layer via the SDK is excellent. This guarantees the "swappable UI" requirement and keeps state management where it belongs.
- **Clear Agent Specialization:** Breaking the AI workload into three distinct agents (Extractor, Comparator, Reviewer) is a robust pattern. It makes prompting easier, simplifies debugging, and allows you to swap out or upgrade specific parts of the pipeline without rewriting the whole logic.
- **Dynamic System Messages:** The per-template system message pattern (e.g., specific instructions for GAFTA 100) is a very smart way to handle varying contract types without needing entirely different Maestro workflows or Agent pipelines.
- **Human-in-the-Loop Integration:** Seamlessly integrating UiPath Action Center/Tasks via Maestro for the final Confirm/Reject step ensures compliance and auditability.

---

## 2. Potential Technical Risks & Challenges

### 2.1 The "Character Offset" Highlight Problem
- **The Risk:** The spec states: *"Highlights: Character offsets from FindingsJSON mapped to rendered positions"*. In practice, getting an LLM to output accurate character offsets that map perfectly back to `react-pdf` or `mammoth.js`-generated HTML is notoriously fragile. Whitespace stripping during extraction, PDF rendering quirks, and LLM hallucination of offsets frequently cause highlights to break or land in the wrong place.
- **Mitigation:** Instead of relying on character offsets, consider having the LLM output the *exact text snippet* of the clause that changed, and use a fuzzy-search or DOM text-search algorithm in the React frontend to locate and wrap that text in highlight tags.

### 2.2 Per-Clause LLM Calls
- **The Risk:** The Comparator agent operates "per clause". If a contract has 150 clauses, that could mean 150 separate LLM calls to compare them. This could easily trigger API rate limits, drive up costs, and exceed the "target < 3 minutes end-to-end" processing time.
- **Mitigation:** You will likely need to batch clauses. Send chunks of 5-10 clauses to the LLM in a single prompt for comparison to optimize speed and cost, while still keeping the context window manageable.

### 2.3 Complex Clause Extraction
- **The Risk:** Extracting a perfectly structured `{ docA: ClauseJSON }` hierarchy (headings, sub-clauses) from arbitrary PDFs is very difficult. Standard OCR or DU might just give you a flat list of text blocks.
- **Mitigation:** Ensure you have a fallback strategy. If DU cannot confidently identify the clause hierarchy, you might need to use a pre-processing LLM step just to structure the raw text into logical clauses before passing it to the Comparator.

### 2.4 Vector Store Infrastructure
- **The Risk:** The spec mentions Azure AI Search but notes a decision is needed. Since UiPath Coded Apps/Maestro don't have a native "Vector Database" entity type out-of-the-box, this implies an external dependency.
- **Mitigation:** Clarify how the connection to the Vector Store is managed. Will it be via Integration Service (if a connector exists for the chosen DB), or direct REST API calls from the Agent?

---

## 3. Recommendations & Questions to Consider

- **Version History Complexity:** The spec mentions pulling prior versions into Agent 1, but Agent 2 (Comparator) is only described as comparing `clause A` and `clause B`. If `includeVersionHistory` is true, does the LLM compare the current doc against *all* past versions simultaneously? I recommend scoping v1 to just compare "Latest vs Previous" or "Buyer vs Seller".
- **Task Polling:** Polling every 5 seconds is acceptable for a prototype, but for production, check if the UiPath SDK for Coded Apps supports WebSockets or Server-Sent Events (SSE) for task completion notifications to reduce network overhead.
- **Missing Clause Handling:** For "Template Compliance" mode, how does the UI render a dashed placeholder for a missing clause if it doesn't know *where* in the document that clause was supposed to go? The LLM will need to identify the logical insertion point (e.g., "Missing Liability clause, should be between clause 4 and 5").
