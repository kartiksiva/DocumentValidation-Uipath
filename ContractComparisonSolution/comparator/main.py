import uuid
from typing import Optional

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field
from uipath_langchain.chat.models import UiPathAzureChatOpenAI
from uipath_langchain.retrievers import ContextGroundingRetriever

from schemas import ClauseBlock, ComparatorInput, ComparatorOutput, DocumentClauses, RawFinding

_COMPARE_SYS_TEMPLATE = """\
{system_message}

Compare the following contract clause pairs. For each pair, identify the deviation type:
- aligned: Substantively equivalent
- high-risk: Significant deviation with material risk
- medium-risk: Moderate deviation worth noting
- missing: Clause in Doc A has no equivalent in Doc B
- modified: Both docs have the clause but with meaningful changes
- extra: Clause in Doc B has no equivalent in Doc A
{guideline_block}
Return JSON: {{"findings": [{{id, clause_ref, deviation_type, snippet_a, snippet_b, \
explanation, guideline_citation, insert_after_clause}}]}}
snippet_a/snippet_b must be verbatim text (or "" if absent). \
insert_after_clause only for missing findings — set to the preceding clause_ref."""


class _FindingListResponse(BaseModel):
    findings: list[RawFinding]


class ComparatorState(ComparatorInput):
    findings: list[RawFinding] = Field(default_factory=list)


def _pair_clauses(
    doc_a: DocumentClauses, doc_b: DocumentClauses
) -> list[tuple[Optional[ClauseBlock], Optional[ClauseBlock]]]:
    a_map = {c.clause_ref: c for c in doc_a.clauses}
    b_map = {c.clause_ref: c for c in doc_b.clauses}
    # preserve order: A first, then any B-only refs
    seen: dict[str, None] = {}
    for ref in list(a_map) + list(b_map):
        seen[ref] = None
    return [(a_map.get(r), b_map.get(r)) for r in seen]


def _batch_text(pairs: list[tuple[Optional[ClauseBlock], Optional[ClauseBlock]]]) -> str:
    lines = []
    for ca, cb in pairs:
        ref = (ca or cb).clause_ref  # type: ignore[union-attr]
        a_txt = f"[{ca.clause_ref}] {ca.text[:400]}" if ca else f"[{ref}] (NOT PRESENT)"
        b_txt = f"[{cb.clause_ref}] {cb.text[:400]}" if cb else f"[{ref}] (NOT PRESENT)"
        lines.append(f"DOC A: {a_txt}\nDOC B: {b_txt}")
    return "\n\n".join(lines)


async def compare_clauses(state: ComparatorState) -> dict:
    llm = UiPathAzureChatOpenAI()
    structured = llm.with_structured_output(_FindingListResponse)
    retriever = (
        ContextGroundingRetriever(index_name="contract-guidelines")
        if state.linked_guideline_ids
        else None
    )

    pairs = _pair_clauses(state.doc_a, state.doc_b)
    all_findings: list[RawFinding] = []

    for i in range(0, len(pairs), state.batch_size):
        batch = pairs[i : i + state.batch_size]

        guideline_block = ""
        if retriever:
            query = " ".join(
                (ca.text if ca else "") + " " + (cb.text if cb else "")
                for ca, cb in batch
            )[:600]
            docs = await retriever.ainvoke(query)
            if docs:
                excerpts = "\n".join(f"- {d.page_content[:300]}" for d in docs[:5])
                guideline_block = f"\nRelevant guideline excerpts:\n{excerpts}\n"

        sys_prompt = _COMPARE_SYS_TEMPLATE.format(
            system_message=state.template_system_message,
            guideline_block=guideline_block,
        )

        result: _FindingListResponse = await structured.ainvoke([
            SystemMessage(sys_prompt),
            HumanMessage(f"Compare these clauses:\n\n{_batch_text(batch)}"),
        ])

        for f in result.findings:
            if not f.id:
                f.id = str(uuid.uuid4())
        all_findings.extend(result.findings)

    return {"findings": all_findings}


builder = StateGraph(ComparatorState, input=ComparatorInput, output=ComparatorOutput)

builder.add_node("compare_clauses", compare_clauses)

builder.add_edge(START, "compare_clauses")
builder.add_edge("compare_clauses", END)

graph = builder.compile()

